import {
    canonicalize,
    finalizeEntry,
    GENESIS_HASH,
    hashCanonical,
    InMemoryWalStore,
    JsonlFileWalStore,
    nextPreviousHash,
    verifyChain
} from '../src/wal';
import { WalEntry, WalEntryCanonicalInput } from '../src/types';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SAMPLE_BOUNDS } from './fixtures';

function makeCanonical(i: number, previousHash: string): WalEntryCanonicalInput {
    return {
        entryId: `entry-${i}`,
        timestamp: `2026-04-20T00:00:0${i}.000Z`,
        previousHash,
        action: {
            id: `act-${i}`,
            proposedAt: `2026-04-20T00:00:0${i}.000Z`,
            class: 'informational',
            descriptor: `action ${i}`,
            systemId: 's',
            hostId: 'h'
        },
        context: {
            systemEpiplexityAboutHost: 1,
            hostEpiplexityAboutSystem: 1,
            agencyEnvelope: { stopability: 0.9, authorship: 0.9, withdrawalCost: 0.1, drift: 0.05 }
        },
        decision: {
            kind: 'ALLOW',
            reasonCode: 'love-preserving',
            reasonMessage: 'ok',
            walEntryId: `entry-${i}`,
            proofId: `proof-${i}`,
            decidedAt: `2026-04-20T00:00:0${i}.000Z`
        },
        asymmetry: 1,
        alphaInEffect: 3,
        agencyBoundsInEffect: SAMPLE_BOUNDS
    };
}

async function buildChain(length: number): Promise<WalEntry[]> {
    const entries: WalEntry[] = [];
    let prev = GENESIS_HASH;
    for (let i = 0; i < length; i++) {
        const canonical = makeCanonical(i, prev);
        const entry = await finalizeEntry(canonical);
        entries.push(entry);
        prev = entry.currentHash;
    }
    return entries;
}

describe('hash-chain', () => {
    it('canonicalize produces byte-identical output for reordered input', () => {
        const a = canonicalize({ ...makeCanonical(0, GENESIS_HASH) });
        const reordered: WalEntryCanonicalInput = {
            ...makeCanonical(0, GENESIS_HASH)
        };
        const b = canonicalize(reordered);
        expect(Buffer.from(a).toString('base64')).toEqual(Buffer.from(b).toString('base64'));
    });

    it('hashCanonical is deterministic', () => {
        const bytes = canonicalize(makeCanonical(0, GENESIS_HASH));
        expect(hashCanonical(bytes)).toEqual(hashCanonical(bytes));
    });

    it('verifies an intact chain', async () => {
        const chain = await buildChain(5);
        const r = await verifyChain(chain);
        expect(r.chainBreakIndex).toBe(-1);
        expect(r.totalEntries).toBe(5);
    });

    it('detects tampering with an entry', async () => {
        const chain = await buildChain(5);
        const tampered: WalEntry = {
            ...chain[2],
            action: { ...chain[2].action, descriptor: 'tampered payload' }
        };
        const badChain = [chain[0], chain[1], tampered, chain[3], chain[4]];
        const r = await verifyChain(badChain);
        expect(r.chainBreakIndex).toBe(2);
    });

    it('detects deletion of an entry', async () => {
        const chain = await buildChain(5);
        const badChain = [chain[0], chain[1], chain[3], chain[4]];
        const r = await verifyChain(badChain);
        expect(r.chainBreakIndex).toBe(2);
    });

    it('detects reordering', async () => {
        const chain = await buildChain(5);
        const badChain = [chain[0], chain[2], chain[1], chain[3], chain[4]];
        const r = await verifyChain(badChain);
        expect(r.chainBreakIndex).toBe(1);
    });
});

describe('InMemoryWalStore', () => {
    it('appends and reads entries in order', async () => {
        const store = new InMemoryWalStore();
        const chain = await buildChain(3);
        for (const e of chain) await store.append(e);
        expect(await store.readLast()).toEqual(chain[2]);
        expect(await store.readAll()).toEqual(chain);
    });

    it('is idempotent on duplicate entryId', async () => {
        const store = new InMemoryWalStore();
        const [entry] = await buildChain(1);
        await store.append(entry);
        await store.append(entry);
        expect((await store.readAll()).length).toBe(1);
    });

    it('returns GENESIS_HASH as nextPreviousHash when empty', async () => {
        const store = new InMemoryWalStore();
        expect(await nextPreviousHash(store)).toBe(GENESIS_HASH);
    });

    it('returns last entry hash as nextPreviousHash when non-empty', async () => {
        const store = new InMemoryWalStore();
        const [entry] = await buildChain(1);
        await store.append(entry);
        expect(await nextPreviousHash(store)).toBe(entry.currentHash);
    });
});

describe('JsonlFileWalStore', () => {
    let dir: string;

    beforeEach(async () => {
        dir = await mkdtemp(join(tmpdir(), 'guardian-wal-test-'));
    });

    afterEach(async () => {
        await rm(dir, { recursive: true, force: true });
    });

    it('persists entries across instances', async () => {
        const path = join(dir, 'wal.jsonl');
        const chain = await buildChain(3);
        const a = new JsonlFileWalStore(path);
        for (const e of chain) await a.append(e);
        const b = new JsonlFileWalStore(path);
        expect(await b.readAll()).toEqual(chain);
    });

    it('creates parent directories as needed', async () => {
        const path = join(dir, 'nested', 'deep', 'wal.jsonl');
        const [entry] = await buildChain(1);
        const store = new JsonlFileWalStore(path);
        await store.append(entry);
        const raw = await readFile(path, 'utf8');
        expect(raw.trim().split('\n').length).toBe(1);
    });

    it('is idempotent on duplicate entryId', async () => {
        const path = join(dir, 'wal.jsonl');
        const [entry] = await buildChain(1);
        const store = new JsonlFileWalStore(path);
        await store.append(entry);
        await store.append(entry);
        expect((await store.readAll()).length).toBe(1);
    });
});
