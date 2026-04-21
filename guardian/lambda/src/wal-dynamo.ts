/**
 * DynamoDB-backed WAL store.
 *
 * Invariants enforced at the IAM layer (see guardian/infra/iam-policies.ts):
 *   - Lambda execution role has PutItem only.
 *   - DeleteItem, UpdateItem, BatchWriteItem explicitly denied.
 *   - Table has point-in-time recovery enabled.
 *
 * Invariants enforced here:
 *   - Idempotent append via ConditionExpression: attribute_not_exists(entryId).
 *   - readAll returns entries sorted by timestamp ASC (chain order).
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { WalEntry, WalStore } from '@guardian/core';

export interface DynamoWalStoreOptions {
    readonly tableName: string;
    readonly client?: DynamoDBClient;
    readonly region?: string;
}

export class DynamoWalStore implements WalStore {
    private readonly doc: DynamoDBDocumentClient;
    private readonly tableName: string;

    constructor(opts: DynamoWalStoreOptions) {
        this.tableName = opts.tableName;
        const raw = opts.client ?? new DynamoDBClient({ region: opts.region });
        this.doc = DynamoDBDocumentClient.from(raw, {
            marshallOptions: { removeUndefinedValues: true }
        });
    }

    async append(entry: WalEntry): Promise<void> {
        try {
            await this.doc.send(
                new PutCommand({
                    TableName: this.tableName,
                    Item: entry,
                    ConditionExpression: 'attribute_not_exists(entryId)'
                })
            );
        } catch (err) {
            if ((err as { name?: string }).name === 'ConditionalCheckFailedException') {
                // Idempotent: another invocation already wrote this entryId.
                return;
            }
            throw err;
        }
    }

    async readLast(): Promise<WalEntry | undefined> {
        const all = await this.readAll();
        return all[all.length - 1];
    }

    async readAll(): Promise<readonly WalEntry[]> {
        const items: WalEntry[] = [];
        let exclusiveStartKey: Record<string, unknown> | undefined = undefined;
        do {
            const res: {
                Items?: Record<string, unknown>[];
                LastEvaluatedKey?: Record<string, unknown>;
            } = await this.doc.send(
                new ScanCommand({
                    TableName: this.tableName,
                    ExclusiveStartKey: exclusiveStartKey
                })
            );
            for (const i of res.Items ?? []) items.push(i as unknown as WalEntry);
            exclusiveStartKey = res.LastEvaluatedKey;
        } while (exclusiveStartKey !== undefined);
        items.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        return items;
    }
}
