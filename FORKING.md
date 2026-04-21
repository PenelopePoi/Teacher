# Forking Teacher IDE

This document tells you what you can take, what you must keep, and what you
must leave behind when you fork this repository.

## 1. License map

This repository is a **composite work** under multiple licenses. If you fork,
you inherit every one of them for the files they cover.

| Path | License | Notes |
|---|---|---|
| `packages/teacher-*/**` | Apache-2.0 | Teacher-specific code (widgets, agents, services, contributions). |
| `guardian/**` | Apache-2.0 | Guardian v1 + Forgetful Agent. |
| `curriculum/**` | Apache-2.0 (code), CC-BY-4.0 (lesson text) | Mixed — see per-file headers. |
| `teacher-plugins/**` | Apache-2.0 | Teacher-specific Theia plugins. |
| `packages/` (non-`teacher-*`) | EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0 | Upstream Eclipse Theia. Do not relicense. |
| `configs/`, `dev-packages/`, `examples/`, `sample-plugins/` | EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0 | Upstream Theia. |
| `lyrics/`, `submissions/` | See per-file headers | Original creative works, licensed individually. |

When in doubt, check the header of the specific file you want to redistribute.

## 2. What you cannot fork

### 2.1 Raw CellAI content

**CellAI** is medical and research material contributed by a private author
under a non-transferable arrangement. The raw CellAI corpus:

- Is **not** present in this public repository.
- Is stored in a private repository (`<SISTER_REMOTE>`) that you will not be
  able to clone.
- Is passed through the **Forgetful Agent** (`guardian/forgetful/`) before
  any derivative content lands here.

If you fork this repository, you will receive:

- The **scrubbed** CellAI-derived content that has already landed here.
- The accompanying scrub manifests (signed, in `docs/scrub-manifests/`).

You will **not** receive:

- The raw corpus.
- Any ability to re-generate scrubbed files from a different source.

### 2.2 Re-publication of scrubbed CellAI content

Even after scrubbing, CellAI-derived content may retain **quasi-identifiers**
(combinations of attributes — e.g. age, zip code, diagnosis — that together
could re-identify a subject). This is a known limitation of regex-and-NER
scrubbing; it does not perform k-anonymity or l-diversity analysis.

If you fork and then republish CellAI-derived content under your own brand,
you are representing to your users that the content is safe to redistribute.
**This representation is yours, not David's, and not the Forgetful Agent's.**

The safest practice when forking:

1. Remove all files under `curriculum/medical/` and any other CellAI-derived
   path listed in the most recent scrub manifest's `source: cellai` entries.
2. Keep the scrub manifests themselves for audit continuity.
3. Substitute your own content.

If instead you keep CellAI-derived content:

1. Read `docs/forgetful-threat-model.md` to understand what the agent does
   and does not protect against.
2. Re-run the Forgetful Agent on every file you redistribute, with your own
   signing key, to establish your own audit chain.
3. Document this in your fork's `FORKING.md`.

### 2.3 Trademarks

"Teacher IDE" and Teacher's visual identity (logos in `logo/`, the XELA
branding on its packaging) are not granted by the Apache-2.0 license. Rename
your fork before publishing.

## 3. What you should fork

Almost everything else. The guardian subsystem, the widget library, the agent
contributions, the curriculum engine, the skill library — all of it is
Apache-2.0 and designed to be reused. The patent grant in Apache-2.0 §3
protects you against patent claims on David's original work.

## 4. Forker obligations checklist

Before you publish your fork:

- [ ] Update `AUTHORS.md` with your own primary author information, keeping
      the upstream sections intact.
- [ ] Update `NOTICE` and `NOTICE.md` — do not remove attributions, but do
      add your own.
- [ ] Rename the project per §2.3 above.
- [ ] Decide your CellAI posture per §2.2 above. Document it in your fork's
      `FORKING.md`.
- [ ] Add your own pre-push hook (`scripts/pre-push-scrub-gate.sh`) pointing
      at your own public remote, so your users inherit the scrub discipline.
- [ ] Run `npm test` on `@guardian/forgetful-core` before your first public
      release to verify the forgetfulness property still holds on your
      platform.

## 5. Questions

Open an issue at <https://github.com/reconsumeralization/teacher/issues> and
tag it `forking`. For license-specific questions, consult a lawyer, not an
issue tracker.
