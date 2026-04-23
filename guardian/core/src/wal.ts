/**
 * Write-Ahead Log with hash-chaining per §11 of the paper.
 *
 * Each entry's `previousHash` must match the `currentHash` of the
 * entry before it. The chain's genesis entry uses a fixed zero-hash
 * as its `previousHash`. Tampering with any prior entry breaks
 * verification at the next entry.
 *
 * The WAL itself is pluggable: `WalStore` is the interface, with
 * in-memory and FS-JSONL implementations here, and a DynamoDB
 * implementation in `guardian/lambda/src/wal-dynamo.ts`.
 */

import { createHash } from 'node:crypto';
import { readFile, appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Signer, WalEntry, WalEntryCanonicalInput, WalStore } from './types';

/** Zero-hash used as `previousHash` for the first (genesis) entry. */
export const GENESIS_HASH = Buffer.alloc(32).toString('base64');

/**
 * Canonical serialization of a WAL entry for hashing.
 *
 * Keys are sorted alphabetically at each level to guarantee byte-equal
 * output for equivalent objects. We explicitly exclude `currentHash`
 * and `signature` because they are outputs of the hash/sign step.
 */
export function canonicalize(input: WalEntryCanonicalInput): Uint8Array {
    const json = stableStringify(input);
    return new TextEncoder().encode(json);
}

/** Compute the SHA-256 of canonical bytes, base64-encoded. */
export function hashCanonical(bytes: Uint8Array): string {
    return createHash('sha256').update(bytes).digest('base64');
}

/**
 * Build a finalized WAL entry: computes `currentHash`, optionally
 * signs it via the provided `Signer`.
 */
export async function finalizeEntry(
    input: WalEntryCanonicalInput,
    signer?: Signer
): Promise<WalEntry> {
    const bytes = canonicalize(input);
    const currentHash = hashCanonical(bytes);
    if (!signer) {
        return { ...input, currentHash };
    }
    const { signature, keyId } = await signer.sign(new TextEncoder().encode(currentHash));
    return { ...input, currentHash, signature, signatureKeyId: keyId };
}

/**
 * Verify the hash chain over a sequence of entries.
 *
 * Returns the index of the first mismatched entry (or -1 if the entire
 * chain is consistent). Also returns a list of signature-invalid entries
 * if a signer is supplied.
 */
export interface ChainVerificationResult {
    readonly chainBreakIndex: number;
    readonly signatureInvalidIndices: readonly number[];
    readonly totalEntries: number;
}

export async function verifyChain(
    entries: readonly WalEntry[],
    signer?: Signer
): Promise<ChainVerificationResult> {
    const signatureInvalid: number[] = [];
    let expectedPrevious = GENESIS_HASH;
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (entry.previousHash !== expectedPrevious) {
            return { chainBreakIndex: i, signatureInvalidIndices: signatureInvalid, totalEntries: entries.length };
        }
        const { currentHash: _c, signature: _s, signatureKeyId: _k, ...canonical } = entry;
        const recomputed = hashCanonical(canonicalize(canonical));
        if (recomputed !== entry.currentHash) {
            return { chainBreakIndex: i, signatureInvalidIndices: signatureInvalid, totalEntries: entries.length };
        }
        if (signer && entry.signature && entry.signatureKeyId) {
            const ok = await signer.verify(
                new TextEncoder().encode(entry.currentHash),
                entry.signature,
                entry.signatureKeyId
            );
            if (!ok) {
                signatureInvalid.push(i);
            }
        }
        expectedPrevious = entry.currentHash;
    }
    return { chainBreakIndex: -1, signatureInvalidIndices: signatureInvalid, totalEntries: entries.length };
}

/** Stable stringify: sorts object keys recursively, preserves array order. */
function stableStringify(value: unknown): string {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
        return '[' + value.map(stableStringify).join(',') + ']';
    }
    const keys = Object.keys(value as Record<string, unknown>).sort();
    const body = keys.map(k => JSON.stringify(k) + ':' + stableStringify((value as Record<string, unknown>)[k]));
    return '{' + body.join(',') + '}';
}

/** In-memory WAL store. Safe for single-process use; not thread-safe. Primarily for tests. */
export class InMemoryWalStore implements WalStore {
    private readonly entries: WalEntry[] = [];
    private readonly seenIds = new Set<string>();

    async append(entry: WalEntry): Promise<void> {
        if (this.seenIds.has(entry.entryId)) {
            return; // idempotent
        }
        this.seenIds.add(entry.entryId);
        this.entries.push(entry);
    }

    async readLast(): Promise<WalEntry | undefined> {
        return this.entries[this.entries.length - 1];
    }

    async readAll(): Promise<readonly WalEntry[]> {
        return [...this.entries];
    }
}

/** File-backed JSONL store. Appends one JSON-encoded entry per line. */
export class JsonlFileWalStore implements WalStore {
    private readonly seenIds = new Set<string>();
    private loaded = false;

    constructor(private readonly filePath: string) {}

    private async ensureLoaded(): Promise<void> {
        if (this.loaded) return;
        this.loaded = true;
        try {
            const content = await readFile(this.filePath, 'utf8');
            for (const line of content.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                const entry = JSON.parse(trimmed) as WalEntry;
                this.seenIds.add(entry.entryId);
            }
        } catch (err) {
            const code = (err as NodeJS.ErrnoException).code;
            if (code !== 'ENOENT') throw err;
        }
    }

    async append(entry: WalEntry): Promise<void> {
        await this.ensureLoaded();
        if (this.seenIds.has(entry.entryId)) return;
        this.seenIds.add(entry.entryId);
        await mkdir(dirname(this.filePath), { recursive: true });
        await appendFile(this.filePath, JSON.stringify(entry) + '\n', 'utf8');
    }

    async readLast(): Promise<WalEntry | undefined> {
        const all = await this.readAll();
        return all[all.length - 1];
    }

    async readAll(): Promise<readonly WalEntry[]> {
        try {
            const content = await readFile(this.filePath, 'utf8');
            const entries: WalEntry[] = [];
            for (const line of content.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                entries.push(JSON.parse(trimmed) as WalEntry);
            }
            return entries;
        } catch (err) {
            const code = (err as NodeJS.ErrnoException).code;
            if (code === 'ENOENT') return [];
            throw err;
        }
    }
}

/** Compute the `previousHash` the next entry must carry, given the current store state. */
export async function nextPreviousHash(store: WalStore): Promise<string> {
    const last = await store.readLast();
    return last?.currentHash ?? GENESIS_HASH;
}
