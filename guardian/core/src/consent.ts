/**
 * Consent token verification per §23.2.
 *
 * Short-TTL detached JWS. The token covers:
 *   - the action's canonical hash
 *   - a single-use nonce
 *   - issued-at and expiry timestamps
 *   - the host identifier
 *
 * Expiry is the only revocation mechanism — there is no revocation list.
 * This is a deliberate choice: TTL ≤ 60s means no stateful revocation
 * infrastructure is needed, and Lambda handlers stay truly stateless.
 *
 * Signature algorithm: HMAC-SHA256. Symmetric key lives in the Lambda
 * environment (loaded via config), backed by AWS Secrets Manager or
 * equivalent at deploy time. Each deployment gets its own key.
 */

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { Action, ConsentToken } from './types';

export interface ConsentVerifyInput {
    readonly token: ConsentToken;
    readonly action: Action;
    readonly nowSeconds: number;
    readonly maxAgeSeconds: number;
    readonly signingKey: string;
    /** Nonces the caller has already seen. Guardian persists these via the WAL. */
    readonly usedNonces: ReadonlySet<string>;
}

export type ConsentVerdict = 'valid' | 'expired' | 'signature-invalid' | 'nonce-replayed' | 'action-mismatch' | 'malformed';

export interface ConsentVerifyResult {
    readonly verdict: ConsentVerdict;
    readonly reason: string;
    readonly payload?: ConsentPayload;
}

export interface ConsentPayload {
    readonly actionHash: string;
    readonly nonce: string;
    readonly iat: number;
    readonly exp: number;
    readonly hostId: string;
}

/** Canonical action hash used to bind a consent token to a specific action. */
export function actionHash(action: Action): string {
    const canonical = JSON.stringify({
        class: action.class,
        descriptor: action.descriptor,
        hostId: action.hostId,
        id: action.id,
        proposedAt: action.proposedAt,
        systemId: action.systemId
    });
    return createHash('sha256').update(canonical).digest('base64');
}

/** Verify a consent token. Does not mutate `usedNonces`. */
export function verifyConsent(input: ConsentVerifyInput): ConsentVerifyResult {
    const { token, action, nowSeconds, maxAgeSeconds, signingKey, usedNonces } = input;
    const parsed = parseJws(token.jws);
    if (!parsed) {
        return { verdict: 'malformed', reason: 'jws is not in compact form or not base64url' };
    }
    const { header, payloadBytes, signature, signedBytes } = parsed;
    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
        return { verdict: 'malformed', reason: `unsupported alg/typ: ${header.alg}/${header.typ}` };
    }
    if (!verifySignature(signedBytes, signature, signingKey)) {
        return { verdict: 'signature-invalid', reason: 'hmac mismatch' };
    }
    let payload: ConsentPayload;
    try {
        payload = JSON.parse(payloadBytes.toString('utf8')) as ConsentPayload;
    } catch {
        return { verdict: 'malformed', reason: 'payload is not valid json' };
    }
    if (typeof payload.nonce !== 'string' || payload.nonce !== token.nonce) {
        return { verdict: 'malformed', reason: 'nonce in payload does not match envelope' };
    }
    if (usedNonces.has(payload.nonce)) {
        return { verdict: 'nonce-replayed', reason: `nonce ${payload.nonce} already consumed` };
    }
    if (typeof payload.iat !== 'number' || typeof payload.exp !== 'number') {
        return { verdict: 'malformed', reason: 'iat/exp missing or non-numeric' };
    }
    if (payload.exp <= nowSeconds) {
        return { verdict: 'expired', reason: `exp ${payload.exp} <= now ${nowSeconds}` };
    }
    if (payload.exp - payload.iat > maxAgeSeconds) {
        return { verdict: 'expired', reason: `ttl exceeds max (${payload.exp - payload.iat} > ${maxAgeSeconds})` };
    }
    if (payload.actionHash !== actionHash(action)) {
        return { verdict: 'action-mismatch', reason: 'token was issued for a different action' };
    }
    if (payload.hostId !== action.hostId) {
        return { verdict: 'action-mismatch', reason: 'host id in token does not match action host id' };
    }
    return { verdict: 'valid', reason: 'consent valid', payload };
}

/** Mint a consent token. Primarily for tests — production callers use their own issuer. */
export function mintConsent(params: {
    action: Action;
    nonce: string;
    nowSeconds: number;
    ttlSeconds: number;
    signingKey: string;
}): ConsentToken {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload: ConsentPayload = {
        actionHash: actionHash(params.action),
        nonce: params.nonce,
        iat: params.nowSeconds,
        exp: params.nowSeconds + params.ttlSeconds,
        hostId: params.action.hostId
    };
    const encodedHeader = base64urlEncode(Buffer.from(JSON.stringify(header), 'utf8'));
    const encodedPayload = base64urlEncode(Buffer.from(JSON.stringify(payload), 'utf8'));
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const signature = createHmac('sha256', params.signingKey).update(signingInput).digest();
    const encodedSignature = base64urlEncode(signature);
    return {
        jws: `${signingInput}.${encodedSignature}`,
        nonce: params.nonce
    };
}

interface ParsedJws {
    readonly header: { alg: string; typ: string };
    readonly payloadBytes: Buffer;
    readonly signature: Buffer;
    readonly signedBytes: string;
}

function parseJws(jws: string): ParsedJws | undefined {
    const parts = jws.split('.');
    if (parts.length !== 3) return undefined;
    const [h, p, s] = parts;
    try {
        const header = JSON.parse(base64urlDecode(h).toString('utf8')) as { alg: string; typ: string };
        const payloadBytes = base64urlDecode(p);
        const signature = base64urlDecode(s);
        return { header, payloadBytes, signature, signedBytes: `${h}.${p}` };
    } catch {
        return undefined;
    }
}

function verifySignature(signedBytes: string, signature: Buffer, signingKey: string): boolean {
    const expected = createHmac('sha256', signingKey).update(signedBytes).digest();
    if (expected.length !== signature.length) return false;
    return timingSafeEqual(expected, signature);
}

function base64urlEncode(buf: Buffer): string {
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(s: string): Buffer {
    const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
    return Buffer.from(padded, 'base64');
}
