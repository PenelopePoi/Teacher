/**
 * Hand-rolled IAM policy documents for the Guardian.
 *
 * Every grant here is the smallest it can be and still work. Any widening
 * should be rejected in review.
 */

import * as pulumi from '@pulumi/pulumi';

/**
 * Lambda → DynamoDB: PutItem only. DeleteItem, UpdateItem,
 * BatchWriteItem, and any Stream write are explicitly denied.
 */
export function walAppendOnlyPolicy(tableArn: pulumi.Input<string>): pulumi.Output<string> {
    return pulumi.output(tableArn).apply(arn =>
        JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'AllowAppend',
                    Effect: 'Allow',
                    Action: ['dynamodb:PutItem', 'dynamodb:Scan', 'dynamodb:DescribeTable'],
                    Resource: arn
                },
                {
                    Sid: 'DenyMutation',
                    Effect: 'Deny',
                    Action: [
                        'dynamodb:DeleteItem',
                        'dynamodb:UpdateItem',
                        'dynamodb:BatchWriteItem',
                        'dynamodb:TransactWriteItems',
                        'dynamodb:DeleteTable',
                        'dynamodb:DisableKinesisStreamingDestination',
                        'dynamodb:EnableKinesisStreamingDestination'
                    ],
                    Resource: arn
                }
            ]
        })
    );
}

/** Lambda → KMS: Sign and Verify only on the specific key ARN. */
export function kmsSignOnlyPolicy(keyArn: pulumi.Input<string>): pulumi.Output<string> {
    return pulumi.output(keyArn).apply(arn =>
        JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'AllowSignVerify',
                    Effect: 'Allow',
                    Action: ['kms:Sign', 'kms:Verify', 'kms:GetPublicKey', 'kms:DescribeKey'],
                    Resource: arn
                },
                {
                    Sid: 'DenyDestructive',
                    Effect: 'Deny',
                    Action: [
                        'kms:ScheduleKeyDeletion',
                        'kms:DisableKey',
                        'kms:DeleteAlias',
                        'kms:UpdateAlias',
                        'kms:UpdatePrimaryRegion',
                        'kms:PutKeyPolicy'
                    ],
                    Resource: arn
                }
            ]
        })
    );
}

/** Lambda → CloudWatch Logs: write to its own log group only. */
export function cloudWatchLogsPolicy(
    logGroupArn: pulumi.Input<string>
): pulumi.Output<string> {
    return pulumi.output(logGroupArn).apply(arn =>
        JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                    Resource: `${arn}:*`
                }
            ]
        })
    );
}

/** Trust policy letting Lambda assume the execution role. */
export const lambdaAssumeRolePolicy: string = JSON.stringify({
    Version: '2012-10-17',
    Statement: [
        {
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
            Action: 'sts:AssumeRole'
        }
    ]
});

/**
 * OIDC trust policy for the deploy role, restricting AssumeRoleWithWebIdentity
 * to a specific GitHub repo + branch.
 *
 * The trust policy on the AWS side must exist before the deploy workflow
 * runs — it is NOT created by this stack (chicken-and-egg: the OIDC role
 * is what the stack uses to deploy). See guardian/README.md for the
 * one-time bootstrap procedure.
 */
export function githubOidcTrustPolicy(args: {
    awsAccountId: string;
    githubOwner: string;
    githubRepo: string;
    allowedBranches: readonly string[];
}): string {
    const sub = args.allowedBranches.map(b => `repo:${args.githubOwner}/${args.githubRepo}:ref:refs/heads/${b}`);
    return JSON.stringify({
        Version: '2012-10-17',
        Statement: [
            {
                Effect: 'Allow',
                Principal: {
                    Federated: `arn:aws:iam::${args.awsAccountId}:oidc-provider/token.actions.githubusercontent.com`
                },
                Action: 'sts:AssumeRoleWithWebIdentity',
                Condition: {
                    StringEquals: {
                        'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com'
                    },
                    StringLike: {
                        'token.actions.githubusercontent.com:sub': sub
                    }
                }
            }
        ]
    });
}
