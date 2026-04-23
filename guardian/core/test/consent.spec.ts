import { mintConsent, verifyConsent } from '../src/consent';
import { CHOICE_ACTION, SIGNING_KEY } from './fixtures';

const NOW = 1_700_000_000;

function verify(params: {
    nonce?: string;
    nowSeconds?: number;
    ttlSeconds?: number;
    signingKey?: string;
    usedNonces?: ReadonlySet<string>;
    action?: typeof CHOICE_ACTION;
}) {
    const nonce = params.nonce ?? 'nonce-1';
    const token = mintConsent({
        action: params.action ?? CHOICE_ACTION,
        nonce,
        nowSeconds: NOW,
        ttlSeconds: params.ttlSeconds ?? 60,
        signingKey: params.signingKey ?? SIGNING_KEY
    });
    return verifyConsent({
        token,
        action: params.action ?? CHOICE_ACTION,
        nowSeconds: params.nowSeconds ?? NOW + 10,
        maxAgeSeconds: 60,
        signingKey: SIGNING_KEY,
        usedNonces: params.usedNonces ?? new Set()
    });
}

describe('verifyConsent', () => {
    it('accepts a valid token', () => {
        const r = verify({});
        expect(r.verdict).toBe('valid');
    });

    it('rejects an expired token', () => {
        const r = verify({ nowSeconds: NOW + 61 });
        expect(r.verdict).toBe('expired');
    });

    it('rejects a ttl-too-long token', () => {
        const r = verify({ ttlSeconds: 300 });
        expect(r.verdict).toBe('expired');
    });

    it('rejects signature mismatch', () => {
        const r = verify({ signingKey: 'different-key-abcdef0123456789' });
        expect(r.verdict).toBe('signature-invalid');
    });

    it('rejects replayed nonce', () => {
        const r = verify({ nonce: 'nonce-seen', usedNonces: new Set(['nonce-seen']) });
        expect(r.verdict).toBe('nonce-replayed');
    });

    it('rejects action-mismatch (different host)', () => {
        const token = mintConsent({
            action: CHOICE_ACTION,
            nonce: 'n',
            nowSeconds: NOW,
            ttlSeconds: 60,
            signingKey: SIGNING_KEY
        });
        const r = verifyConsent({
            token,
            action: { ...CHOICE_ACTION, hostId: 'different-host' },
            nowSeconds: NOW + 1,
            maxAgeSeconds: 60,
            signingKey: SIGNING_KEY,
            usedNonces: new Set()
        });
        expect(r.verdict).toBe('action-mismatch');
    });

    it('rejects malformed jws', () => {
        const r = verifyConsent({
            token: { jws: 'not.a.valid.jws.structure', nonce: 'n' },
            action: CHOICE_ACTION,
            nowSeconds: NOW,
            maxAgeSeconds: 60,
            signingKey: SIGNING_KEY,
            usedNonces: new Set()
        });
        expect(r.verdict).toBe('malformed');
    });

    it('rejects nonce envelope/payload mismatch', () => {
        const token = mintConsent({
            action: CHOICE_ACTION,
            nonce: 'inner-nonce',
            nowSeconds: NOW,
            ttlSeconds: 60,
            signingKey: SIGNING_KEY
        });
        const r = verifyConsent({
            token: { ...token, nonce: 'different-envelope-nonce' },
            action: CHOICE_ACTION,
            nowSeconds: NOW + 1,
            maxAgeSeconds: 60,
            signingKey: SIGNING_KEY,
            usedNonces: new Set()
        });
        expect(r.verdict).toBe('malformed');
    });
});
