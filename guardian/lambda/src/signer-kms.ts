/**
 * KMS-backed signer. Implements the core `Signer` interface using
 * KMS `Sign` / `Verify` with an asymmetric key (RSASSA_PSS_SHA_256).
 *
 * The Lambda execution role's IAM policy grants:
 *   - kms:Sign and kms:Verify on the specific key ARN.
 *   - No kms:Decrypt, kms:ScheduleKeyDeletion, kms:DisableKey.
 */

import { KMSClient, SignCommand, VerifyCommand } from '@aws-sdk/client-kms';
import type { Signer } from '@guardian/core';

export interface KmsSignerOptions {
    readonly keyId: string;
    readonly client?: KMSClient;
    readonly region?: string;
    readonly signingAlgorithm?: 'RSASSA_PSS_SHA_256' | 'ECDSA_SHA_256';
}

export class KmsSigner implements Signer {
    private readonly client: KMSClient;
    private readonly keyId: string;
    private readonly algorithm: 'RSASSA_PSS_SHA_256' | 'ECDSA_SHA_256';

    constructor(opts: KmsSignerOptions) {
        this.client = opts.client ?? new KMSClient({ region: opts.region });
        this.keyId = opts.keyId;
        this.algorithm = opts.signingAlgorithm ?? 'RSASSA_PSS_SHA_256';
    }

    async sign(bytes: Uint8Array): Promise<{ signature: string; keyId: string }> {
        const res = await this.client.send(
            new SignCommand({
                KeyId: this.keyId,
                Message: bytes,
                MessageType: 'RAW',
                SigningAlgorithm: this.algorithm
            })
        );
        if (!res.Signature) throw new Error('KMS Sign returned empty signature');
        const signature = Buffer.from(res.Signature).toString('base64');
        return { signature, keyId: res.KeyId ?? this.keyId };
    }

    async verify(bytes: Uint8Array, signature: string, keyId: string): Promise<boolean> {
        const res = await this.client.send(
            new VerifyCommand({
                KeyId: keyId,
                Message: bytes,
                MessageType: 'RAW',
                Signature: Buffer.from(signature, 'base64'),
                SigningAlgorithm: this.algorithm
            })
        );
        return Boolean(res.SignatureValid);
    }
}
