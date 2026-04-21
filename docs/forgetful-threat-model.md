# Forgetful Agent — Threat Model

This document describes what the Forgetful Agent defends against, what it does not, and the operational assumptions it relies on. Read this in conjunction with `docs/ingest.md` (the runbook) and `FORKING.md` (license + redistribution obligations).

## Actors and assets

**Assets:**

- **Raw PII/PHI** in CellAI-derived content: patient identifiers (names, MRNs, DOBs), contact identifiers (emails, phones, addresses), system identifiers (file paths with usernames), genomic identifiers, location data.
- **The scrub manifest**: a signed record listing *which types of identifiers were removed from which files*, never the values themselves. The manifest is itself an asset because it gates Tier 3 promotion.
- **Forgetfulness as a property**: the agent's behavioral guarantee that detected values do not persist beyond a single file's processing.

**Actors (threats):**

- **Honest-but-curious fork consumer.** Someone who legitimately forks the public repo and wants to re-link scrubbed content to identities. Cannot be fully prevented — see §5.
- **Misconfigured contributor.** A Teacher contributor who accidentally commits raw CellAI content to a public-branch-bound PR.
- **Compromised contributor workstation.** Attacker with arbitrary code execution on David's laptop. Out of scope — this is the trust root.
- **Curious maintainer of upstream infrastructure** (GitHub, npm). In scope for public-branch content but not for private-tier staging.

## What the agent DOES defend against

### 1. Accidental direct-identifier leakage

Regex + checksum-validated detectors redact the standard catalog of direct identifiers (SSN, email, phone, MRN, NHS number, NPI, credit card, explicit-label DOB, high-precision geo, genomic IDs, home-directory file paths, public IPs). A document that contained one of these in raw form does not contain it post-scrub.

### 2. Metadata exfiltration via supported formats

- Jupyter notebooks: all cell and notebook metadata is stripped. Execution environment info (kernel paths, usernames) does not survive.
- JPEG: EXIF and XMP APP segments are stripped. GPS, camera serial, creator tool info does not survive.

### 3. Accidental commits to the public remote

The pre-push hook (`scripts/pre-push-scrub-gate.sh`) refuses to push CellAI-derived files that lack a matching manifest entry. A contributor who forgets to run the agent gets a push rejection, not a leak.

### 4. Value retention in the agent process

The `withForgettingBuffer` primitive overwrites processed buffers with zeros before release. Manifests record types and counts, never values. There is no log file, no cache, no server-side memory in the CLI flow.

### 5. Tampering with the manifest

The manifest carries a SHA-256 hash over its canonical-stringified content and (optionally) a detached signature. `verifyManifest` detects byte-level mutation; a KMS-backed or age/minisign-backed signature detects substitution. Hash chaining via `previousHash` means a reviewer can walk the full history and detect inserted or dropped rounds.

## What the agent DOES NOT defend against

### 1. Quasi-identifier re-identification

Even after direct identifiers are removed, combinations of attributes — age + zip + diagnosis is the canonical example — can uniquely re-identify a subject in many datasets. The Forgetful Agent performs NO k-anonymity, l-diversity, or differential-privacy analysis. A dataset that is safe for redistribution from a regex standpoint may be unsafe from a quasi-identifier standpoint.

Mitigation (caller's responsibility):

- Do not redistribute structured tabular data (CSV, parquet) without a separate re-identification risk review.
- For free-text narratives, the risk is lower but not zero; prefer summarization or paraphrasing to verbatim inclusion.
- `FORKING.md` documents the forker's obligation here.

### 2. Names in free text (unless NER is enabled)

The regex detector set does not include a name-list. Name detection requires a NER model (see `detectors/name-ner.ts`), which is OFF by default in v1. When off, the manifest declares `name-detection: disabled`, and the reviewer is responsible for a name pass by hand.

Mitigation: enable the NER detector when running against name-dense content; still eyeball the output.

### 3. DICOM burned-in identifiers

DICOM files are quarantined, not auto-processed, in v1. A proper DICOM de-identifier must strip both tag-level PHI and burned-in pixel text (requires OCR). A follow-up release will integrate `dcmjs` with a configurable tag profile. Until then, DICOM content requires hand-handling or exclusion.

### 4. Content that was never PII but looks similar

False positives: a string that looks like a phone number (e.g., `800-555-0100`) but is a public hotline will be redacted. This is a feature (false positives are acceptable), but it means the scrubbed content may be harder to read in places. The human reviewer at Step 4 of the runbook is expected to catch and tolerate this.

### 5. Side channels

- **File timestamps.** Scrubbed files inherit the CLI run's timestamp, not the original file's mtime. No identifying information leaks via timestamps as a default, but cross-referencing scrubbed-file timestamps with Git commit times could reveal work-session timing. Not a PII leak but worth noting.
- **File sizes.** A scrubbed file's size is close to but not identical to the original's. Difference-in-size correlations across many files could leak structural info. Not a v1 concern.
- **Directory structure.** The output tree mirrors the input tree. Directory names are not scrubbed. If a directory name contains a person's name (`subjects/john-doe/`), it will propagate. Mitigation: normalize the input tree before scrubbing.

### 6. Compromised signer key

If the KMS key (or local signer key) is compromised, an attacker can forge a manifest claiming a scrubbing that did not occur. The repo-side verification would accept the forged manifest. Mitigation: key rotation + audit of unexpected signatures — outside v1's scope.

### 7. The agent itself

A bug in a detector (a false negative) means PII does not get redacted. The test suite (`test/detectors.spec.ts`) covers the documented positive-and-negative cases, but cannot cover inputs we have not imagined. Mitigation: the three-tier staging discipline means every scrub cycle gets reviewed by sister against the raw, providing a human backstop.

## Operational assumptions

1. **David's laptop is the trust root.** If it is compromised, no discipline downstream helps.
2. **Sister's review is non-perfunctory.** She actually reads the scrubbed output against the raw, every round. The agent is a filter, not a substitute for her judgment.
3. **The public repo's collaborators honor the hook.** Disabling the pre-push hook is a choice a contributor can make locally. The organization policy (CODEOWNERS + branch protection on `main` + required review) must back up the hook; the hook alone is advisory.
4. **The Apache-2.0 grant is not retroactive consent.** Forkers who receive scrubbed content have been granted a copyright license to the Teacher *code*; they have not been granted permission to re-identify the subjects in scrubbed content. `FORKING.md` states this, and the responsibility for respecting it falls on the forker.

## Post-incident procedure

If raw PII slips through to the public tier:

1. `git revert` the offending commit on `origin/main`. Force-push is not used; the revert is itself a public record.
2. File a report in `~/.teacher/incidents/NN.md` (local only). Include: the file(s) affected, the detector gap that caused the miss, the time window during which the content was public.
3. Harden the detector that missed the case. Add a regression test.
4. Contact the affected subjects via the sister's private channel if possible. This is a human responsibility, not an agent responsibility.
5. Do not attempt to "scrub from history" via force-push — the content is already cached (GitHub, Google, archive.org). The only effective remediation is forward-looking.
