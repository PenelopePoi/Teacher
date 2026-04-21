/**
 * Handler unit tests. We mock the DDB and KMS singletons by setting env
 * and swapping module-level state, but the WAL interactions are driven
 * through jest mocks on the AWS SDK clients.
 *
 * Note: this is shape-level testing for the handler. True end-to-end
 * testing is the job of the Pulumi smoke deploy (§ verification #7).
 */

import { handler } from '../src/handler';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

jest.mock('@aws-sdk/client-dynamodb', () => ({ DynamoDBClient: class {} }));
jest.mock('@aws-sdk/client-kms', () => ({
    KMSClient: class {},
    SignCommand: class {},
    VerifyCommand: class {}
}));
jest.mock('@aws-sdk/lib-dynamodb', () => {
    const store: Record<string, unknown> = {};
    return {
        DynamoDBDocumentClient: {
            from: () => ({
                send: async (cmd: unknown) => {
                    const c = cmd as { input: { TableName?: string; Item?: Record<string, unknown> } };
                    const ctor = (cmd as { constructor: { name: string } }).constructor.name;
                    if (ctor === 'PutCommand') {
                        const item = c.input.Item as { entryId: string };
                        if (store[item.entryId]) {
                            const err = new Error('ConditionalCheckFailedException');
                            (err as { name: string }).name = 'ConditionalCheckFailedException';
                            throw err;
                        }
                        store[item.entryId] = item;
                        return {};
                    }
                    if (ctor === 'ScanCommand') {
                        return { Items: Object.values(store) };
                    }
                    throw new Error('unknown command in mock');
                }
            })
        },
        PutCommand: class {
            constructor(public readonly input: unknown) {}
        },
        ScanCommand: class {
            constructor(public readonly input: unknown) {}
        }
    };
});

beforeEach(() => {
    process.env.GUARDIAN_WAL_TABLE_NAME = 'guardian-wal-test';
    process.env.GUARDIAN_ALPHA_MODE = 'calibrated';
    process.env.GUARDIAN_ALPHA = '3';
    process.env.GUARDIAN_STOPABILITY_MIN = '0.5';
    process.env.GUARDIAN_AUTHORSHIP_MIN = '0.5';
    process.env.GUARDIAN_WITHDRAWAL_COST_MAX = '0.5';
    process.env.GUARDIAN_DRIFT_MAX = '0.2';
    process.env.GUARDIAN_CONSENT_SIGNING_KEY = 'test-signing-key-1234567890ab';
    delete process.env.GUARDIAN_KMS_KEY_ID;
    jest.resetModules();
});

function makeEvent(body: unknown, path = '/validate', method = 'POST'): APIGatewayProxyEventV2 {
    return {
        version: '2.0',
        routeKey: `${method} ${path}`,
        rawPath: path,
        rawQueryString: '',
        headers: {},
        requestContext: {
            accountId: '0',
            apiId: 'x',
            domainName: 'x',
            domainPrefix: 'x',
            http: { method, path, protocol: 'HTTP/1.1', sourceIp: '1.1.1.1', userAgent: 'test' },
            requestId: 'r',
            routeKey: `${method} ${path}`,
            stage: 'dev',
            time: '',
            timeEpoch: 0
        },
        body: JSON.stringify(body),
        isBase64Encoded: false
    };
}

describe('handler', () => {
    it('returns 405 on non-POST', async () => {
        const { handler: h } = await import('../src/handler');
        const res = await h(makeEvent({}, '/validate', 'GET'));
        expect(res.statusCode).toBe(405);
    });

    it('returns 404 on unknown path', async () => {
        const { handler: h } = await import('../src/handler');
        const res = await h(makeEvent({}, '/elsewhere'));
        expect(res.statusCode).toBe(404);
    });

    it('returns 400 on missing body fields', async () => {
        const { handler: h } = await import('../src/handler');
        const res = await h(makeEvent({}));
        expect(res.statusCode).toBe(400);
    });

    it('returns 200 with ALLOW for a love-preserving action', async () => {
        const { handler: h } = await import('../src/handler');
        const res = await h(
            makeEvent({
                action: {
                    id: 'a1',
                    proposedAt: '2026-04-20T00:00:00.000Z',
                    class: 'informational',
                    descriptor: 'hi',
                    systemId: 's',
                    hostId: 'h'
                },
                context: {
                    systemEpiplexityAboutHost: 2,
                    hostEpiplexityAboutSystem: 2,
                    agencyEnvelope: { stopability: 0.9, authorship: 0.9, withdrawalCost: 0.1, drift: 0.05 }
                }
            })
        );
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body as string);
        expect(body.kind).toBe('ALLOW');
    });

    it('returns INDETERMINATE when alpha is uncalibrated', async () => {
        process.env.GUARDIAN_ALPHA_MODE = 'uncalibrated';
        delete process.env.GUARDIAN_ALPHA;
        const { handler: h } = await import('../src/handler');
        const res = await h(
            makeEvent({
                action: {
                    id: 'a1',
                    proposedAt: '2026-04-20T00:00:00.000Z',
                    class: 'informational',
                    descriptor: 'hi',
                    systemId: 's',
                    hostId: 'h'
                },
                context: {
                    systemEpiplexityAboutHost: 2,
                    hostEpiplexityAboutSystem: 2,
                    agencyEnvelope: { stopability: 0.9, authorship: 0.9, withdrawalCost: 0.1, drift: 0.05 }
                }
            })
        );
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body as string);
        expect(body.kind).toBe('INDETERMINATE');
    });

    it('returns 500 config-error on missing config env', async () => {
        delete process.env.GUARDIAN_ALPHA_MODE;
        const { handler: h } = await import('../src/handler');
        const res = await h(
            makeEvent({
                action: {
                    id: 'a1',
                    proposedAt: '2026-04-20T00:00:00.000Z',
                    class: 'informational',
                    descriptor: 'hi',
                    systemId: 's',
                    hostId: 'h'
                },
                context: {
                    systemEpiplexityAboutHost: 1,
                    hostEpiplexityAboutSystem: 1,
                    agencyEnvelope: { stopability: 0.9, authorship: 0.9, withdrawalCost: 0.1, drift: 0.05 }
                }
            })
        );
        expect(res.statusCode).toBe(500);
    });
});
