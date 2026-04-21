# Security Policy

## Vulnerability Reporting — Theia Core

If you think or suspect that you have discovered a new security vulnerability
in this project, please **do not** disclose it on GitHub, e.g. in an issue, a
PR, or a discussion. Any such disclosure will be removed/deleted on sight, to
promote orderly disclosure, as per the Eclipse Foundation Security Policy.

Instead, please report any potential vulnerability to the Eclipse Foundation
[Security Team](https://www.eclipse.org/security/). Make sure to provide a
concise description of the issue, a CWE, and other supporting information.

_Eclipse Foundation Vulnerability Reporting Policy_:
<https://www.eclipse.org/security/policy.php>

## Vulnerability Reporting — Guardian Subsystem

For vulnerabilities specific to the Guardian subsystem under `guardian/` —
including the Lambda handler, Pulumi infrastructure, WAL integrity, consent
token verification, or KMS key handling — follow the same private-disclosure
process above.

---

## Operational Security Principles

These principles are load-bearing for the Guardian subsystem and apply to the
broader repository as cultural defaults.

### 1. No client-extractable secrets

The Guardian's design explicitly rejects a pattern identified in prior AI
tooling deployments: shipping API credentials inside browser extensions or
other client-side artifacts. Client-bundled code is trivially retrievable
through standard developer tooling and local file access, so any credential
embedded in it must be treated as public.

Consequences, enforced in review:

- All API keys, signing keys, and session tokens live server-side.
- Frontend code must never import from a server-side env-reading module.
- `guardian/core` and the Lambda handler run Node-side only; no bundler target
  produces browser output for them.
- Audit findings that indicate a secret reached a client bundle are treated as
  high-severity and block merge.

### 2. Secret-less CI via OIDC federation

The Guardian's deployment workflow does not store long-lived AWS credentials
in GitHub Secrets. It uses GitHub OIDC identity federation
(`id-token: write` + `aws-actions/configure-aws-credentials` with
`role-to-assume`) to obtain short-lived credentials scoped to a specific IAM
role with a least-privilege policy.

The trust policy on the AWS side must restrict `sts:AssumeRoleWithWebIdentity`
to this repository and branch. That trust policy is a one-time manual setup
step on the AWS account; no code change in this repo can create it, and its
absence causes deploy workflows to fail at role assumption.

### 3. Append-only audit with cryptographic integrity

The Guardian's Write-Ahead Log (`guardian/core/src/wal.ts`, backed by DynamoDB
in production) must be append-only at the storage layer. Entries are
hash-chained (each entry carries the hash of the previous entry), and the
per-session Merkle root is signed at session close using AWS KMS. The IAM
policy granted to the Lambda execution role permits `PutItem` only; it
explicitly denies `DeleteItem`, `UpdateItem`, and `BatchWriteItem` on the
WAL table.

This means log tampering leaves cryptographic evidence at verification time
(`guardian/scripts/verify-chain.ts` performs this). A successful tamper would
require compromise of the KMS key itself, which is a separate, logged control
surface.

### 4. Supply chain hygiene

- The repo's Dependabot configuration (`.github/dependabot.yml`) tracks npm,
  GitHub Actions, and Docker ecosystems on a daily / weekly cadence.
- CI-exercised scripts must pin third-party versions; unpinned `npx` of
  third-party tooling in workflows is a defect. (Current pin baseline:
  `semver@7.6.3`.)
- The Lambda bundle is produced by `esbuild` with explicit `external`
  declarations for `@aws-sdk/*`; any addition to the bundle dependency graph
  is reviewed for transitive risk.

### 5. KMS key rotation

KMS keys used for WAL signing are configured with automatic annual rotation
(AWS default). An audit event is emitted on every rotation. Verification of
prior signatures remains valid because KMS retains historic key material for
decryption/verification; only new signatures use the new material.

---

## Guardian Threat Model (summary)

| Threat | Mitigation |
| --- | --- |
| Stolen long-lived AWS credentials | Not used. OIDC-federated short-lived credentials only. |
| Leaked API key in client bundle | No client bundle contains server-side secrets. Review gate. |
| Forged consent token | Short-TTL (≤60s) detached JWS, nonce bound to action hash. |
| Replayed consent token | Nonce is single-use; WAL records nonce consumption. |
| WAL tampering (delete, rewrite) | IAM denies non-Put; hash-chain verification detects edits. |
| WAL omission (skip entry) | Decision path cannot return without a durable WAL entry. |
| Guardian bypass (direct Lambda invoke) | API Gateway is the only public path; Lambda has no function URL. |
| α threshold manipulation | `GUARDIAN_ALPHA_MODE=uncalibrated` returns `INDETERMINATE`, never `ALLOW`. |
| More-loving-but-less-agency action | Non-Supremacy check returns `FORBID` before WAL append. |

---

## Reporting Channel Summary

| Subsystem | Channel |
| --- | --- |
| Theia core, packages, extensions | Eclipse Foundation Security Team (see above) |
| Guardian subsystem | Same Eclipse private-disclosure channel |
| Infrastructure / AWS account misconfiguration | Same |
| Documentation errors or non-security bugs | Public GitHub issue |
