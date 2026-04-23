#!/usr/bin/env node
/**
 * WAL hash-chain verifier.
 *
 * Reads every entry from either a local JSONL WAL or a DynamoDB table,
 * replays the chain, and exits non-zero if any entry has been tampered,
 * deleted, or reordered.
 *
 * Usage:
 *   npx ts-node guardian/scripts/verify-chain.ts --file path/to/wal.jsonl
 *   npx ts-node guardian/scripts/verify-chain.ts --table guardian-dev-wal --region us-east-1
 *
 * This is intended to run locally and as a scheduled CI job (nightly)
 * against the production WAL with read-only IAM.
 */

import { parseArgs } from 'node:util';
import { JsonlFileWalStore, verifyChain } from '@guardian/core';

async function main(): Promise<number> {
    const { values } = parseArgs({
        options: {
            file: { type: 'string' },
            table: { type: 'string' },
            region: { type: 'string', default: 'us-east-1' }
        },
        strict: true
    });

    if (!values.file && !values.table) {
        console.error('usage: verify-chain.ts (--file path.jsonl | --table name [--region us-east-1])');
        return 2;
    }
    if (values.file && values.table) {
        console.error('choose exactly one of --file or --table');
        return 2;
    }

    const entries = values.file
        ? await new JsonlFileWalStore(values.file).readAll()
        : await loadFromDynamo(values.table!, values.region ?? 'us-east-1');

    const result = await verifyChain(entries);
    console.log(JSON.stringify(result, undefined, 2));
    if (result.chainBreakIndex !== -1) {
        console.error(`chain broken at entry index ${result.chainBreakIndex}`);
        return 1;
    }
    if (result.signatureInvalidIndices.length > 0) {
        console.error(`invalid signatures at ${result.signatureInvalidIndices.join(', ')}`);
        return 1;
    }
    console.log(`chain ok: ${result.totalEntries} entries verified`);
    return 0;
}

async function loadFromDynamo(tableName: string, region: string) {
    // Lazy import so the script can be used for file-only verification
    // without needing AWS SDK installed in the environment.
    const { DynamoWalStore } = await import('../lambda/src/wal-dynamo');
    const store = new DynamoWalStore({ tableName, region });
    return store.readAll();
}

main().then(code => process.exit(code), err => {
    console.error(err);
    process.exit(1);
});
