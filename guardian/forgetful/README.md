# Forgetful Agent

A PII/PHI scrubber that forgets its work. Given a source directory, it detects identifiers, redacts them with typed placeholders, writes the scrubbed output to a sibling directory, and emits a signed manifest of what was removed — counts and types per file, never values.

The agent is the gate between private staging (sister's private repo) and public release (`reconsumeralization/Teacher`). See `docs/ingest.md` for the operational runbook and `docs/forgetful-threat-model.md` for what it does and does not protect against.

## Design invariants

1. **Forgetfulness.** Detected values do not persist beyond a single file's processing. Manifests record types and counts only. In-memory buffers are zeroed before release.
2. **Structure preservation.** Redacted output preserves line count, JSON shape, and CSV column count. Detectors return offsets, not captured text; the redactor substitutes typed placeholders of short, bounded length.
3. **Deterministic manifests.** Canonical JSON + SHA-256. Two scrubs of the same input directory produce the same `currentHash`. Tamper-detection is byte-exact.
4. **Pluggable signer.** The manifest signer implements a `sign(bytes) → { signature, keyId }` interface, the same shape as `guardian/lambda/signer-kms.ts`. KMS, local age/minisign, or a no-signer dry-run all plug in without changing manifest structure.
5. **No automated promotion.** The agent writes scrubbed output and a manifest; the human chooses when (and whether) to promote to the public tier. The pre-push hook blocks accidents, not intentions.

## Directory layout

```
guardian/forgetful/
├── core/                              # @guardian/forgetful-core
│   ├── src/
│   │   ├── types.ts                   # Detection, Manifest, ScrubOptions, ...
│   │   ├── forgetful.ts               # scrubDirectory() orchestrator
│   │   ├── redactor.ts                # offset-merging + placeholder substitution
│   │   ├── manifest.ts                # canonicalize + hash + sign + verify
│   │   ├── forget.ts                  # withForgettingBuffer zero-discipline
│   │   ├── detectors/                 # one file per DetectionClass
│   │   │   ├── ssn, email, phone, dob, mrn, nhs-number, npi
│   │   │   ├── ipv4, credit-card
│   │   │   ├── file-path, geo-coord, address
│   │   │   ├── genomic-id
│   │   │   ├── name-ner                # optional Ollama-backed, off by default
│   │   │   └── registry                # defaultDetectors()
│   │   └── content-types/
│   │       ├── text, markdown, json, csv, notebook
│   │       ├── image-exif              # JPEG APP/COM strip
│   │       ├── dicom                   # quarantine only in v1
│   │       └── registry                # defaultHandlers()
│   └── test/
│       ├── detectors.spec.ts
│       ├── redactor.spec.ts
│       ├── manifest.spec.ts
│       ├── forget.spec.ts
│       └── e2e.spec.ts
└── cli/                                # @guardian/forgetful
    ├── bin/forgetful                   # shebang wrapper
    └── src/cli.ts                      # scrub + verify commands
```

## Build and test

```sh
cd guardian/forgetful/core && npm ci && npm test && npm run build
cd guardian/forgetful/cli  && npm ci && npm run build
```

## Usage

```sh
# Scrub a directory tree.
./guardian/forgetful/cli/bin/forgetful scrub \
    --in  ~/work/CellAI-raw \
    --out ~/work/CellAI-scrubbed \
    --quarantine ~/work/CellAI-quarantine \
    --manifest    ~/work/scrub-manifest.json \
    --agent-version 0.1.0

# Verify a manifest.
./guardian/forgetful/cli/bin/forgetful verify --manifest ~/work/scrub-manifest.json
```

See `./cli/bin/forgetful help` for the complete option list.

## What v1 covers and what it doesn't

| Concern | Status |
|---|---|
| Regex + checksum detectors for SSN/NHS/NPI/credit-card | ✓ |
| File-path personalization (Users/home) | ✓ |
| Genomic IDs (dbGaP, TCGA, GTEx, labeled Subject ID) | ✓ |
| JSON / CSV / Markdown / plain-text content handlers | ✓ |
| Jupyter notebook cell + metadata handling | ✓ |
| JPEG EXIF/APP segment strip | ✓ |
| DICOM | Quarantine only (v1). `dcmjs` integration deferred. |
| PNG/TIFF EXIF strip | Deferred. |
| Name NER via Ollama | Stub (off by default); live integration deferred. |
| K-anonymity / quasi-identifier analysis | Out of scope. See threat model §1. |
| Automatic re-identification defense beyond direct IDs | Out of scope. See threat model §1. |
| KMS signer integration | Interface ready; wiring deferred to a follow-up PR. |

## Relationship to Guardian v1

The Forgetful Agent and Guardian v1 are siblings: both enforce a Non-Supremacy property, both emit hash-chained, signable audit artifacts. The manifest's hash-chain format (`canonicalize` + `hashManifest` + `previousHash`) mirrors Guardian v1's WAL (`guardian/core/src/wal.ts`). The signer interface mirrors `Signer` from `@guardian/core`. When Guardian v1's KMS signer is deployed, the Forgetful Agent will plug it in directly; until then, the manifest is unsigned (local dry-run) or signed by a local fallback (deferred).

The two subsystems are independently deployable. You can run the Forgetful Agent without Guardian, and vice versa.
