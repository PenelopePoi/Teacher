// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import {
    canonicalizeManifest,
    finalizeManifest,
    hashManifest,
    sha256Base64,
    verifyManifest
} from '../src';
import { ManifestSigner, ScrubManifestCanonicalInput } from '../src/types';

const zeroTotals = {
    ssn: 0, email: 0, phone: 0, dob: 0, mrn: 0, 'nhs-number': 0, npi: 0,
    name: 0, address: 0, 'geo-coord': 0, 'genomic-id': 0, 'file-path': 0,
    ipv4: 0, 'credit-card': 0
};

function baseManifest(): ScrubManifestCanonicalInput {
    return {
        version: 1,
        scrubbedAt: '2026-04-21T00:00:00.000Z',
        sessionId: '00000000-0000-0000-0000-000000000001',
        agentVersion: 'test-0.1.0',
        sourceRoot: '/tmp/src',
        outputRoot: '/tmp/out',
        files: [
            {
                path: 'a.md',
                sha256Before: sha256Base64(Buffer.from('alice@example.com')),
                sha256After: sha256Base64(Buffer.from('[REDACTED:EMAIL]')),
                bytesBefore: 17,
                bytesAfter: 16,
                contentType: 'text/markdown',
                status: 'scrubbed',
                counts: { email: 1 }
            }
        ],
        totals: { ...zeroTotals, email: 1 },
        previousHash: ''
    };
}

describe('canonicalize + hash', () => {
    it('produces deterministic bytes for equivalent objects', () => {
        const a = baseManifest();
        const b = baseManifest();
        const bytesA = canonicalizeManifest(a);
        const bytesB = canonicalizeManifest(b);
        expect(Buffer.from(bytesA).toString('hex')).toBe(Buffer.from(bytesB).toString('hex'));
    });

    it('hash changes when any field changes', () => {
        const a = baseManifest();
        const b = { ...baseManifest(), sessionId: '00000000-0000-0000-0000-000000000002' };
        expect(hashManifest(canonicalizeManifest(a))).not.toBe(hashManifest(canonicalizeManifest(b)));
    });
});

describe('finalizeManifest', () => {
    it('produces a currentHash that round-trips via verifyManifest', async () => {
        const finalized = await finalizeManifest(baseManifest());
        const { hashValid } = await verifyManifest(finalized);
        expect(hashValid).toBe(true);
    });

    it('tampering with any byte breaks hashValid', async () => {
        const finalized = await finalizeManifest(baseManifest());
        const tampered = { ...finalized, agentVersion: 'tampered' };
        const { hashValid } = await verifyManifest(tampered);
        expect(hashValid).toBe(false);
    });
});

describe('signing round-trip', () => {
    const hmacSigner: ManifestSigner = {
        async sign(bytes) {
            const { createHmac } = await import('node:crypto');
            const mac = createHmac('sha256', 'test-key').update(bytes).digest('base64');
            return { signature: mac, keyId: 'test-key' };
        },
        async verify(bytes, signature) {
            const { createHmac } = await import('node:crypto');
            const mac = createHmac('sha256', 'test-key').update(bytes).digest('base64');
            return mac === signature;
        }
    };

    it('signs and verifies a clean manifest', async () => {
        const signed = await finalizeManifest(baseManifest(), hmacSigner);
        const { hashValid, signatureValid } = await verifyManifest(signed, hmacSigner);
        expect(hashValid).toBe(true);
        expect(signatureValid).toBe(true);
    });

    it('detects a forged signature', async () => {
        const signed = await finalizeManifest(baseManifest(), hmacSigner);
        const forged = { ...signed, signature: 'AAAA' };
        const { signatureValid } = await verifyManifest(forged, hmacSigner);
        expect(signatureValid).toBe(false);
    });
});
