/**
 * AWS Lambda handler for guardian `validateAction` requests.
 *
 * Route: POST /validate
 * Body (JSON): { action: Action, context: Context }
 * Response (JSON): Decision
 *
 * Cold-start invariant: the handler is truly stateless between invocations.
 * The only module-level state is the shared DynamoDB + KMS clients, which
 * do not carry request-scoped data. This is load-bearing for the paper's
 * decay-by-design test (briefings/world-model-changes.md #7).
 *
 * Every invocation rebuilds the Guardian from fresh config + a
 * request-scoped `usedNonces` set populated from the WAL lookup.
 */

import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import {
    createGuardian,
    loadConfig,
    type Action,
    type Context as GuardianContext
} from '@guardian/core';
import { DynamoWalStore } from './wal-dynamo';
import { KmsSigner } from './signer-kms';

const WAL_TABLE_ENV = 'GUARDIAN_WAL_TABLE_NAME';
const KMS_KEY_ENV = 'GUARDIAN_KMS_KEY_ID';

let walStoreSingleton: DynamoWalStore | undefined;
let kmsSignerSingleton: KmsSigner | undefined;

function resolveWalStore(): DynamoWalStore {
    if (walStoreSingleton) return walStoreSingleton;
    const tableName = process.env[WAL_TABLE_ENV];
    if (!tableName) throw new Error(`missing env: ${WAL_TABLE_ENV}`);
    walStoreSingleton = new DynamoWalStore({ tableName });
    return walStoreSingleton;
}

function resolveSigner(): KmsSigner | undefined {
    if (kmsSignerSingleton) return kmsSignerSingleton;
    const keyId = process.env[KMS_KEY_ENV];
    if (!keyId) return undefined;
    kmsSignerSingleton = new KmsSigner({ keyId });
    return kmsSignerSingleton;
}

interface ValidatePayload {
    readonly action?: Action;
    readonly context?: GuardianContext;
}

export async function handler(
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> {
    if (event.requestContext?.http?.method !== 'POST') {
        return json(405, { error: 'method-not-allowed' });
    }
    if (event.rawPath !== '/validate') {
        return json(404, { error: 'not-found', path: event.rawPath });
    }

    let body: ValidatePayload;
    try {
        body = JSON.parse(event.body ?? '{}') as ValidatePayload;
    } catch {
        return json(400, { error: 'invalid-json' });
    }
    if (!body.action || !body.context) {
        return json(400, { error: 'missing-fields', required: ['action', 'context'] });
    }

    let config: ReturnType<typeof loadConfig>;
    try {
        config = loadConfig(process.env);
    } catch (err) {
        return json(500, { error: 'config-error', detail: (err as Error).message });
    }

    const wal = resolveWalStore();
    const signer = resolveSigner();

    // Load recently-used nonces from the WAL to prevent replay across
    // invocations. We read the most recent entries and collect their
    // nonces; older nonces are effectively dropped because their tokens
    // would have expired anyway (TTL ≤ 60s).
    const recentEntries = await wal.readAll();
    const nowSeconds = Math.floor(Date.now() / 1000);
    const cutoff = nowSeconds - config.consentMaxAgeSeconds * 2;
    const usedNonces = new Set<string>();
    for (const entry of recentEntries) {
        const ts = Math.floor(new Date(entry.timestamp).getTime() / 1000);
        if (ts < cutoff) continue;
        if (entry.context.consentToken?.nonce) {
            usedNonces.add(entry.context.consentToken.nonce);
        }
    }

    const guardian = createGuardian({ config, wal, signer, usedNonces });
    try {
        const decision = await guardian.validateAction(body.action, body.context);
        return json(200, decision);
    } catch (err) {
        return json(500, { error: 'internal', detail: (err as Error).message });
    }
}

function json(statusCode: number, body: unknown): APIGatewayProxyStructuredResultV2 {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    };
}
