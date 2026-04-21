# CellAI Ingestion Runbook

**Audience:** David. No one else should execute this runbook on David's behalf.

**Purpose:** Ingest content from the private CellAI corpus (sister's repo) into the public `reconsumeralization/Teacher` repo, preserving the three-tier staging discipline so that raw PII/PHI never reaches the public tier.

**Preconditions:**

- You have push access to the private sister remote (referred to below as `<SISTER_REMOTE>`).
- You have push access to `reconsumeralization/Teacher` (the public remote).
- The Forgetful Agent has been built (`guardian/forgetful/core` and `guardian/forgetful/cli` installed and compiled).
- Sister has signaled which subset of the CellAI corpus is ready for ingestion this round.

---

## Three-tier staging, in one picture

```
 Tier 1  (your laptop, never pushed)
   ~/work/CellAI-raw           ← clone of <SISTER_REMOTE>, raw content
   ~/work/CellAI-scrubbed      ← Forgetful Agent output
   ~/work/scrub-manifest.json  ← signed manifest for this round

 Tier 2  (private sister remote)
   <SISTER_REMOTE>:main        ← raw corpus lives here
   <SISTER_REMOTE>:review/NN   ← scrubbed PR for sister to review against raw

 Tier 3  (public reconsumeralization/Teacher)
   origin/main                  ← scrubbed content lands here only after review
   docs/scrub-manifests/NN.json ← the manifest for this round is committed here
```

The only flow is downstream. Raw never moves up-tier. The pre-push hook (`scripts/pre-push-scrub-gate.sh`) enforces this at the Tier 3 boundary.

---

## Procedure

### Step 1 — Sync Tier 1 (your machine)

```bash
cd ~/work
git clone <SISTER_REMOTE> CellAI-raw        # or: git -C CellAI-raw pull
```

Do not copy `CellAI-raw` anywhere the laptop backs up to a cloud provider. Local-only.

### Step 2 — Run the Forgetful Agent

From the Teacher repo:

```bash
cd ~/path/to/Teacher
# Build once per release:
(cd guardian/forgetful/core && npm ci && npm run build && npm test)
(cd guardian/forgetful/cli  && npm ci && npm run build)

# Scrub:
./guardian/forgetful/cli/bin/forgetful scrub \
    --in  ~/work/CellAI-raw \
    --out ~/work/CellAI-scrubbed \
    --quarantine ~/work/CellAI-quarantine \
    --manifest    ~/work/scrub-manifest.json \
    --agent-version "$(cd guardian/forgetful/core && node -p 'require(\"./package.json\").version')"
```

The CLI prints a summary: how many files were scrubbed, clean, or quarantined; per-class detection counts. **Read the summary.** If anything looks wrong — detection counts of zero on a file you know contains PII, or a suspiciously-large quarantine pile — stop and investigate before moving to Step 3.

### Step 3 — Manually review the quarantine

Files land in `~/work/CellAI-quarantine` when the agent cannot safely auto-process them (v1: DICOM and unknown binaries). For each file:

- DICOM: either defer (exclude from this round) or run a DICOM-aware de-identifier (v1 does not ship one).
- Unknown binary: determine the format; if it's something the agent should handle, file an issue to add a handler; if it's truly opaque, exclude it.

Do not move quarantined files into `CellAI-scrubbed` by hand.

### Step 4 — Review the scrubbed output

Spot-check the scrubbed directory by hand:

- Pick 3–5 files at random from `~/work/CellAI-scrubbed` and read them side-by-side with `~/work/CellAI-raw`.
- Confirm redactions applied, no raw identifiers slipped through.
- Confirm structure was preserved (CSV column counts, JSON shape, notebook cell counts).

If you catch a miss, **do not patch the scrubbed file by hand.** Update the detector or handler, re-run Step 2, and try again.

### Step 5 — Tier 2 review with sister

Push the scrubbed output and the manifest to a review branch on the sister remote:

```bash
# In a throwaway clone of <SISTER_REMOTE>:
git checkout -b review/NN        # NN = round number
cp -r ~/work/CellAI-scrubbed/*    scrubbed/
cp     ~/work/scrub-manifest.json manifests/NN.json
git add scrubbed/ manifests/NN.json
git commit -s -m "review: scrubbed content for round NN"
git push -u origin review/NN
```

Open a PR on `<SISTER_REMOTE>` titled `Round NN: scrubbed content for review`. Sister reviews the scrubbed files against the raw corpus she already has access to. She approves via signed PR comment (or another channel David and sister have agreed on).

### Step 6 — Tier 3 promotion (public)

Only after sister's approval. From the Teacher repo's main working tree:

```bash
# Copy scrubbed content into the repo structure:
cp -r ~/work/CellAI-scrubbed/*    curriculum/medical/     # or wherever it belongs
mkdir -p docs/scrub-manifests/
cp      ~/work/scrub-manifest.json docs/scrub-manifests/NN.json
ln -sf  NN.json docs/scrub-manifests/latest.json

git add curriculum/medical/ docs/scrub-manifests/
git commit -s -m "curriculum: round NN — scrubbed content + manifest

Signed-off-by: David <...>"

# Ensure the pre-push hook is installed:
ln -sf ../../scripts/pre-push-scrub-gate.sh .git/hooks/pre-push
chmod +x scripts/pre-push-scrub-gate.sh

# Push:
git push -u origin claude/ingest-round-NN
```

The hook inspects the pushed range, filters to CellAI-prefixed paths, and verifies each one is listed in `docs/scrub-manifests/latest.json`. If any file is missing from the manifest, the push is refused — no bypass.

### Step 7 — Open a public PR

Open a draft PR on `reconsumeralization/Teacher` titled `Round NN: CellAI ingestion (scrubbed)`. The PR body should include:

- Link to the sister-side review PR (Tier 2) showing sister's approval.
- Summary of per-class detection counts from the manifest.
- Confirmation that the pre-push hook accepted the push.

Merge the PR once CI is green.

---

## After ingestion

- Delete `~/work/CellAI-raw` if you will not use it again for a while. `git clone` again next round.
- Keep `~/work/CellAI-scrubbed` and `~/work/scrub-manifest.json` only until the public PR merges; then delete them as well.
- The authoritative copy of scrubbed content + manifest lives in `reconsumeralization/Teacher` after merge.

## What to do if something went wrong

- **Raw PII slipped through to Tier 3.** This is the worst case. Revert the offending commit on the public repo (`git revert`), rotate any compromised values at their source (e.g., if an email address leaked, contact the person and document), file a post-incident report in a private location, and harden the detector that missed it before the next round.
- **A manifest entry is wrong.** The manifest is signed; regenerate by re-running Step 2, do not edit by hand.
- **Sister declines a round.** Do not push to Tier 3. Discard `~/work/CellAI-scrubbed` for that round and iterate on detector tuning.

## References

- `FORKING.md` — what the Apache-2.0 license grants and what it does not.
- `docs/forgetful-threat-model.md` — what the agent protects against and what it does not.
- `guardian/forgetful/core/README.md` — design notes for the agent.
