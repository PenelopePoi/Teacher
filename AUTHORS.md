# Authors

Teacher IDE is the work of many hands. This file lists contributors in three
tiers: the primary author of Teacher-specific code, contributors of specific
subsystems, and the upstream projects whose code Teacher builds on.

## Primary author

- **David** ([`@reconsumeralization`](https://github.com/reconsumeralization))
  — Teacher IDE architecture, the hedonic-packing paper and its formal
  apparatus, the Guardian v1 implementation, and the Forgetful Agent design.

## Subsystem contributors

- **Sister** (pseudonymized per her request) — **CellAI** content contribution.
  CellAI is the source material for Teacher's medical-education and
  research-tutoring tracks. All CellAI-derived content in this repository
  passes through the Forgetful Agent before publication; the raw CellAI
  corpus lives in a private repository and is not redistributed.

## Upstream projects

Teacher IDE is built on top of **Eclipse Theia**
(https://github.com/eclipse-theia/theia), licensed under EPL-2.0 OR
GPL-2.0-only WITH Classpath-exception-2.0. Every file in `packages/` that
originated upstream retains its original header and license. See `NOTICE.md`
for the full upstream attribution list and `LICENSE-EPL`, `LICENSE-MIT.txt`,
`LICENSE-vscode.txt` for the corresponding license texts.

## How to be added to this file

Sign off your commits (`git commit -s`) per the DCO flow in `CONTRIBUTING.md`.
First-time contributors may add themselves to this file in the PR that lands
their first substantive change, under a new "Contributors" section below this
one, or ask a maintainer to do so in the merge commit.
