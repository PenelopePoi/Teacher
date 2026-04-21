// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.

import { createHash } from 'node:crypto';
import {
    DetectionClass,
    ManifestFileEntry,
    ManifestSigner,
    ScrubManifest,
    ScrubManifestCanonicalInput
} from './types';

const ALL_CLASSES: readonly DetectionClass[] = [
    'ssn', 'email', 'phone', 'dob', 'mrn', 'nhs-number', 'npi',
    'name', 'address', 'geo-coord', 'genomic-id', 'file-path',
    'ipv4', 'credit-card'
];

/** Stable stringify: sorts object keys recursively, preserves array order. */
function stableStringify(value: unknown): string {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
        return '[' + value.map(stableStringify).join(',') + ']';
    }
    const keys = Object.keys(value as Record<string, unknown>).sort();
    const body = keys.map(
        k => JSON.stringify(k) + ':' + stableStringify((value as Record<string, unknown>)[k])
    );
    return '{' + body.join(',') + '}';
}

/** Canonical bytes for a manifest. Deterministic across runs given identical input. */
export function canonicalizeManifest(input: ScrubManifestCanonicalInput): Uint8Array {
    return new TextEncoder().encode(stableStringify(input));
}

/** SHA-256 over canonical bytes, base64-encoded. */
export function hashManifest(bytes: Uint8Array): string {
    return createHash('sha256').update(bytes).digest('base64');
}

/** Aggregate per-file counts into totals across all classes. */
export function aggregateTotals(
    files: readonly ManifestFileEntry[]
): Record<DetectionClass, number> {
    const totals = Object.create(null) as Record<DetectionClass, number>;
    for (const c of ALL_CLASSES) totals[c] = 0;
    for (const file of files) {
        for (const [k, v] of Object.entries(file.counts)) {
            if (typeof v === 'number') {
                totals[k as DetectionClass] += v;
            }
        }
    }
    return totals;
}

/**
 * Finalize a manifest: compute `currentHash` over canonical bytes, optionally
 * sign. The returned manifest is JSON-serializable and carries everything a
 * verifier needs.
 */
export async function finalizeManifest(
    input: ScrubManifestCanonicalInput,
    signer?: ManifestSigner
): Promise<ScrubManifest> {
    const bytes = canonicalizeManifest(input);
    const currentHash = hashManifest(bytes);
    if (!signer) {
        return { ...input, currentHash };
    }
    const { signature, keyId } = await signer.sign(new TextEncoder().encode(currentHash));
    return { ...input, currentHash, signature, signatureKeyId: keyId };
}

/**
 * Verify a manifest's hash (and, if signed, its signature).
 *
 * Returns:
 *   - `hashValid: false` if the canonical bytes don't hash to `currentHash`.
 *   - `signatureValid: false` if a signature is present but fails verification.
 *   - `signatureValid: undefined` if no signature is present.
 */
export async function verifyManifest(
    manifest: ScrubManifest,
    signer?: ManifestSigner
): Promise<{ hashValid: boolean; signatureValid: boolean | undefined }> {
    const { currentHash: _c, signature: _s, signatureKeyId: _k, ...canonical } = manifest;
    const recomputed = hashManifest(canonicalizeManifest(canonical));
    const hashValid = recomputed === manifest.currentHash;

    let signatureValid: boolean | undefined;
    if (manifest.signature && manifest.signatureKeyId && signer) {
        signatureValid = await signer.verify(
            new TextEncoder().encode(manifest.currentHash),
            manifest.signature,
            manifest.signatureKeyId
        );
    } else if (manifest.signature) {
        // Signature present but we have no verifier.
        signatureValid = undefined;
    }

    return { hashValid, signatureValid };
}

/** Compute SHA-256 of raw bytes, base64. For file-entry integrity fields. */
export function sha256Base64(bytes: Buffer): string {
    return createHash('sha256').update(bytes).digest('base64');
}
