# Guardian

A serverless Love-Invariant evaluator. Deploys to AWS via Pulumi. Discharges the architecture claim in `briefings/world-model-changes.md` #7: *the guardian must be serverless-deployable, satisfying the paper's decay-by-design test.*

The theoretical substrate is the author's hedonic-packing paper (Theorem 5 §9.4). This directory is an implementation of that theorem as an HTTP-callable service whose every decision is durable in a hash-chained, cryptographically signed audit log.

## Directory layout

- **`core/`** — pure TypeScript module. Zero AWS or Theia dependencies. Implements:
  - `Action`, `Context`, `AgencyEnvelope`, `Decision`, `WalEntry` types.
  - Love Invariant evaluator (`love-invariant.ts`).
  - Epiplexity asymmetry `A(τ) = S_T(S|H)/S_T(H|S)` with safe margin α.
  - Agency envelope componentwise check with `(σ_min, a_min, w_max, d_max)`.
  - Non-Supremacy Axiom check (`non-supremacy.ts`): forbid `more-loving ∧ Δagency < 0`.
  - Short-TTL detached-JWS consent tokens (`consent.ts`).
  - Hash-chained WAL with `InMemoryWalStore` and `JsonlFileWalStore` (`wal.ts`).
  - KEV-Guardian orchestrator skeleton with one fixture vulnerability (`kev-orchestrator.ts`).
  - 69 unit + property tests. 90% statement coverage.

- **`lambda/`** — AWS wrappers around `@guardian/core`:
  - `DynamoWalStore`: `PutItem`-only with conditional idempotency.
  - `KmsSigner`: `RSASSA_PSS_SHA_256` via AWS KMS, sign + verify only.
  - API Gateway HTTP API v2 handler for `POST /validate`.
  - esbuild bundle: 87 KB (budget 2 MB).

- **`infra/`** — Pulumi AWS stack:
  - DynamoDB WAL with PITR, SSE, deletion protection.
  - KMS asymmetric CMK (RSA_2048, sign/verify).
  - Least-privilege IAM role with explicit deny on `DeleteItem`/`UpdateItem`/key mutation.
  - HTTP API, Lambda permission, log group with retention.

- **`scripts/verify-chain.ts`** — standalone WAL verifier. Run locally against a JSONL file or nightly in CI against DynamoDB.

## Build

```sh
cd guardian/core   && npm ci && npm test && npm run build
cd guardian/lambda && npm ci && npm test && npm run bundle
cd guardian/infra  && npm ci && npm run typecheck
```

## Deploy

Prerequisites: AWS account, Pulumi CLI, and a one-time AWS-side bootstrap (see below). Secrets never live in this repo; OIDC federation + `pulumi config set --secret`.

```sh
cd guardian/infra

# Set the HMAC key used to sign consent tokens (example value).
pulumi config set --secret guardian:consentSigningKey "$(openssl rand -base64 32)"

# If you have calibrated α for this deployment context, set it.
pulumi config set guardian:alphaMode calibrated
pulumi config set guardian:alpha 3

# Preview.
pulumi preview

# Apply.
pulumi up
```

The stack outputs `apiUrl`, `walTableName`, `kmsKeyArn`, `kmsKeyAlias`, `logGroupName`, and `lambdaFunctionName`.

## One-time AWS OIDC bootstrap

The `guardian-deploy.yml` workflow uses GitHub OIDC federation; no long-lived AWS credentials are stored in GitHub Secrets. The AWS side needs a one-time setup that cannot live in code (chicken-and-egg — this *is* the code that gets deployed):

1. In the AWS IAM console, create an OIDC identity provider:
   - URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`
2. Create an IAM role (e.g. `guardian-github-deploy`) with a trust policy matching your fork. A policy generator is in `guardian/infra/iam-policies.ts` (`githubOidcTrustPolicy`).
3. Attach an IAM policy to the role granting the narrow set of actions Pulumi needs: DynamoDB table + KMS key create/update, Lambda create/update, API Gateway v2 create/update, IAM role create/attach, CloudWatch log group create, `iam:PassRole` on the execution role.
4. Set two repository variables in GitHub:
   - `GUARDIAN_AWS_DEPLOY_ROLE_ARN` — the role ARN from step 2.
   - `GUARDIAN_AWS_REGION` — e.g. `us-east-1`.
5. Run `.github/workflows/guardian-oidc-smoke.yml` via workflow_dispatch. A successful `sts:GetCallerIdentity` proves the plumbing works before any real deploy.

Absence of `GUARDIAN_AWS_DEPLOY_ROLE_ARN` causes `guardian-deploy.yml` to skip — fail-closed is the right default.

## API

**Route:** `POST /validate`

**Request body (JSON):**

```jsonc
{
  "action": {
    "id": "uuid",
    "proposedAt": "2026-04-20T00:00:00.000Z",
    "class": "informational | bridging | choice-architecture | refusal",
    "descriptor": "what the system wants to do",
    "systemId": "opaque-system-id",
    "hostId": "opaque-host-id"
  },
  "context": {
    "systemEpiplexityAboutHost": 5,
    "hostEpiplexityAboutSystem": 4,
    "agencyEnvelope": {
      "stopability": 0.9, "authorship": 0.8,
      "withdrawalCost": 0.1, "drift": 0.05
    },
    "consentToken": { "jws": "...", "nonce": "..." },        // required for choice-architecture
    "counterfactualAgencyEnvelope": {...},                    // for Non-Supremacy check
    "systemLoveScore": 0.3, "counterfactualLoveScore": 0.2    // for Non-Supremacy check
  }
}
```

**Response (JSON):**

```jsonc
{
  "kind": "ALLOW | DENY | INDETERMINATE | FORBID",
  "reasonCode": "love-preserving | agency-violation | asymmetry-exceeded | alpha-uncalibrated | non-supremacy-violation | consent-*",
  "reasonMessage": "human-readable",
  "walEntryId": "uuid",
  "proofId": "base64-sha256 of canonical action",
  "nextConsentNonce": "uuid if ALLOW, else omitted",
  "decidedAt": "ISO8601"
}
```

Callers **MUST** treat `INDETERMINATE` as not-permitted. It is emitted when α has not been calibrated for the deployment context.

## Threat model

See `/SECURITY.md` at the repo root for the full summary. Key invariants:

- No client-extractable secrets. The consent HMAC key lives only in Lambda env, sourced from Pulumi config secrets.
- IAM denies `DeleteItem` / `UpdateItem` on the WAL table.
- IAM denies `ScheduleKeyDeletion` / `DisableKey` on the signer key.
- Lambda function has no function URL — API Gateway is the sole public path.
- Consent tokens have TTL ≤ 60 s. Expiry *is* the revocation. No revocation list.
- Non-Supremacy fires before WAL append: forbidden actions are still logged with the `FORBID` kind so the attempt is auditable.

## α calibration

The paper's §9.5 explicitly says there is no universal α. Calibrate before going to production:

1. Identify the deployment context (population, horizon, acceptable drift bound).
2. Run stress-test traces (adversarial epiplexity streams) against your representative population.
3. Fit α so that worst-case preference drift stays below your chosen ε.
4. Set `guardian:alpha` via Pulumi config and flip `guardian:alphaMode` to `calibrated`.

Until this is done, the guardian returns `INDETERMINATE` for every call. This is the intended fail-closed behaviour — absence of data is not permission.

## Rollback

Every change is additive. To abandon:

```sh
cd guardian/infra && pulumi destroy
cd /home/user/Teacher && git revert <guardian commits>
```

No changes to existing `packages/*` code were made; the Theia monorepo is untouched.

## Follow-ups (explicit out-of-scope for v1)

- Empirical α calibration data and methodology.
- Full CISA KEV catalog ingestion (currently one fixture vulnerability).
- Theia RPC wrapper (`packages/teacher-guardian/`).
- Cloudflare Workers deployment as a second handler around the same core.
- Democratic / intergenerational / Cassandra layers (§12, §13, §22, §26 of the paper).
- `npm audit` remediation across the 77 Theia packages — separate hardening PR.
- Frontend guardian audit-review widget (Theia browser UI).
- Post-deploy smoke body that minting real consent tokens and asserts the full round-trip with WAL retrieval.
