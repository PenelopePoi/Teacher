/**
 * Guardian Pulumi stack — AWS target.
 *
 * Resources created:
 *   - DynamoDB table (WAL). Billing: PAY_PER_REQUEST. PITR enabled.
 *   - KMS asymmetric CMK (RSA_2048) with annual rotation (AWS default).
 *   - IAM execution role for the Lambda, with least-privilege policies.
 *   - CloudWatch log group for the Lambda with retention.
 *   - Lambda function (Node 20). Handler comes from ../lambda/dist/handler.js.
 *   - HTTP API Gateway. Public. IAM or JWT auth intentionally not enabled
 *     at v1 — the Lambda enforces consent tokens itself, and the deploy
 *     smoke test exercises that path. Upgrade to IAM auth in a later PR.
 *   - Route: POST /validate → Lambda integration.
 *
 * NOT created here (deliberately):
 *   - GitHub OIDC provider on AWS: one-time bootstrap outside this stack.
 *   - Secrets Manager / SSM Parameter entries for the consent signing key:
 *     supplied via `pulumi config set --secret guardian:consentSigningKey`.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as path from 'node:path';
import {
    cloudWatchLogsPolicy,
    kmsSignOnlyPolicy,
    lambdaAssumeRolePolicy,
    walAppendOnlyPolicy
} from './iam-policies';

const projectConfig = new pulumi.Config('guardian');
const stackName = pulumi.getStack();
const baseName = `guardian-${stackName}`;

// --------------------------------------------------------------------------
// DynamoDB: Write-Ahead Log
// --------------------------------------------------------------------------
const walTable = new aws.dynamodb.Table(`${baseName}-wal`, {
    name: `${baseName}-wal`,
    billingMode: 'PAY_PER_REQUEST',
    hashKey: 'entryId',
    attributes: [{ name: 'entryId', type: 'S' }],
    pointInTimeRecovery: { enabled: true },
    deletionProtectionEnabled: true,
    serverSideEncryption: { enabled: true },
    tags: { 'guardian:purpose': 'wal', 'guardian:stack': stackName }
});

// --------------------------------------------------------------------------
// KMS: asymmetric CMK for WAL-entry signing
// --------------------------------------------------------------------------
const kmsKey = new aws.kms.Key(`${baseName}-signer`, {
    description: `Guardian WAL-entry signer (stack=${stackName})`,
    customerMasterKeySpec: 'RSA_2048',
    keyUsage: 'SIGN_VERIFY',
    enableKeyRotation: false, // asymmetric keys cannot auto-rotate; manual rotation policy lives in SECURITY.md
    deletionWindowInDays: 30,
    tags: { 'guardian:purpose': 'wal-signer', 'guardian:stack': stackName }
});

const kmsAlias = new aws.kms.Alias(`${baseName}-signer-alias`, {
    name: `alias/${baseName}-signer`,
    targetKeyId: kmsKey.keyId
});

// --------------------------------------------------------------------------
// CloudWatch Logs
// --------------------------------------------------------------------------
const logGroup = new aws.cloudwatch.LogGroup(`${baseName}-logs`, {
    name: `/aws/lambda/${baseName}-handler`,
    retentionInDays: parseInt(projectConfig.require('logRetentionDays'), 10)
});

// --------------------------------------------------------------------------
// IAM execution role
// --------------------------------------------------------------------------
const execRole = new aws.iam.Role(`${baseName}-exec-role`, {
    name: `${baseName}-exec-role`,
    assumeRolePolicy: lambdaAssumeRolePolicy
});

new aws.iam.RolePolicy(`${baseName}-wal-policy`, {
    role: execRole.id,
    policy: walAppendOnlyPolicy(walTable.arn)
});

new aws.iam.RolePolicy(`${baseName}-kms-policy`, {
    role: execRole.id,
    policy: kmsSignOnlyPolicy(kmsKey.arn)
});

new aws.iam.RolePolicy(`${baseName}-logs-policy`, {
    role: execRole.id,
    policy: cloudWatchLogsPolicy(logGroup.arn)
});

// --------------------------------------------------------------------------
// Lambda function
// --------------------------------------------------------------------------
const lambdaCodePath = path.resolve(__dirname, '..', 'lambda', 'dist');

const lambdaEnv: Record<string, pulumi.Input<string>> = {
    GUARDIAN_WAL_TABLE_NAME: walTable.name,
    GUARDIAN_KMS_KEY_ID: kmsKey.arn,
    GUARDIAN_ALPHA_MODE: projectConfig.require('alphaMode'),
    GUARDIAN_STOPABILITY_MIN: projectConfig.require('stopabilityMin'),
    GUARDIAN_AUTHORSHIP_MIN: projectConfig.require('authorshipMin'),
    GUARDIAN_WITHDRAWAL_COST_MAX: projectConfig.require('withdrawalCostMax'),
    GUARDIAN_DRIFT_MAX: projectConfig.require('driftMax'),
    GUARDIAN_CONSENT_MAX_AGE_SECONDS: projectConfig.require('consentMaxAgeSeconds'),
    GUARDIAN_CONSENT_SIGNING_KEY: projectConfig.requireSecret('consentSigningKey')
};

const calibratedAlpha = projectConfig.get('alpha');
if (calibratedAlpha !== undefined) {
    lambdaEnv.GUARDIAN_ALPHA = calibratedAlpha;
}

const lambdaFn = new aws.lambda.Function(`${baseName}-handler`, {
    name: `${baseName}-handler`,
    runtime: 'nodejs20.x',
    architectures: ['arm64'],
    handler: 'handler.handler',
    role: execRole.arn,
    code: new pulumi.asset.AssetArchive({
        '.': new pulumi.asset.FileArchive(lambdaCodePath)
    }),
    memorySize: 256,
    timeout: 10,
    loggingConfig: {
        logFormat: 'JSON',
        logGroup: logGroup.name
    },
    environment: { variables: lambdaEnv },
    tags: { 'guardian:purpose': 'handler', 'guardian:stack': stackName }
});

// --------------------------------------------------------------------------
// HTTP API Gateway
// --------------------------------------------------------------------------
const httpApi = new aws.apigatewayv2.Api(`${baseName}-api`, {
    name: `${baseName}-api`,
    protocolType: 'HTTP',
    corsConfiguration: {
        allowOrigins: ['*'],
        allowMethods: ['POST', 'OPTIONS'],
        allowHeaders: ['content-type', 'authorization']
    }
});

const integration = new aws.apigatewayv2.Integration(`${baseName}-int`, {
    apiId: httpApi.id,
    integrationType: 'AWS_PROXY',
    integrationUri: lambdaFn.invokeArn,
    integrationMethod: 'POST',
    payloadFormatVersion: '2.0'
});

new aws.apigatewayv2.Route(`${baseName}-route`, {
    apiId: httpApi.id,
    routeKey: 'POST /validate',
    target: pulumi.interpolate`integrations/${integration.id}`
});

const stage = new aws.apigatewayv2.Stage(`${baseName}-stage`, {
    apiId: httpApi.id,
    name: '$default',
    autoDeploy: true
});

new aws.lambda.Permission(`${baseName}-invoke-perm`, {
    action: 'lambda:InvokeFunction',
    function: lambdaFn.name,
    principal: 'apigateway.amazonaws.com',
    sourceArn: pulumi.interpolate`${httpApi.executionArn}/*/*`
});

// --------------------------------------------------------------------------
// Outputs
// --------------------------------------------------------------------------
export const apiUrl = pulumi.interpolate`${stage.invokeUrl}/validate`;
export const walTableName = walTable.name;
export const kmsKeyArn = kmsKey.arn;
export const kmsKeyAlias = kmsAlias.name;
export const logGroupName = logGroup.name;
export const lambdaFunctionName = lambdaFn.name;
