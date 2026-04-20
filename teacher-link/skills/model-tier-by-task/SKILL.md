---
name: model-tier-by-task
description: Pick the right model tier per task — cheap models plus good scaffolding for broad-coverage work (fuzzing, dependency scans, secret hunting), frontier reasoning for judgment work (did this fix actually close the bug?)
domain: security
intent: analyze
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Evaluate
argumentHint: the task you are about to spend model budget on
---

# model-tier-by-task — Coverage vs. brilliance

The "best model" obsession spends frontier-model budget on tasks that a cheap model with good scaffolding handles just as well, and then runs out of budget for the tasks that actually need reasoning. This skill gives a school IT lead or security-curious educator a way to decide which tier to use, before the credit card explains it for them.

## When to use

- Building or buying any AI-assisted security tooling for the school (vuln scanning, log triage, code review, IR assist)
- A vendor pitch leans on "powered by [frontier model]" and you want to evaluate whether that's load-bearing
- Burn-rate on a frontier-model tool is climbing and you want to know what to push down to a cheaper tier

## When NOT to use

- General "which AI should we license for staff?" decisions — that's a productivity / policy question, not a security one
- Mid-incident — pick whatever you have access to and use it; optimisation comes later

## The honest sentence

For broad-coverage work, a thousand adequate detectives beats one brilliant detective who has to guess where to look. For judgment work, the brilliant detective is still worth it.

## Two task shapes

**Coverage shape** — the task is "look at a lot of stuff and flag things":
- Fuzzing inputs against a service
- Dependency scans across a monorepo
- Secret / credential hunting in source and CI logs
- First-pass log triage (is anything in this 10k-line auth log unusual?)
- Initial classification of EDR alerts before a human sees them
- Phishing-email triage at the mailbox layer

These run cheaper, more parallel, and benefit far more from *isolation* (giving the model a small, well-scoped chunk to look at) than from raw model intelligence. A 3.6B-parameter model with the right scaffolding can match a frontier model here. Pay for the scaffolding, not the parameter count.

**Judgment shape** — the task is "look at one thing carefully and decide":
- Does this proposed patch actually close the underlying bug, or just hide the symptom?
- Is this user's request legitimate or a social-engineering attempt with subtle tells?
- Should this incident be escalated to the IR partner or contained internally?
- Is this AI-generated shell command on a host explicable by the user's project, or attacker LotL? (See `ai-command-triage`.)
- Does this vendor's DPA actually protect student data, or is it boilerplate?

These are where the frontier model earns its price. Don't substitute cheaper tiers here just because they're cheaper; you'll pay the difference in missed calls.

## Workflow

1. **Name the task shape.** Coverage or judgment? If you're not sure, look at the output: a *list of things to look at next* is coverage; a *single decision with a reason* is judgment.
2. **For coverage tasks:** invest in scaffolding (chunking, isolation, validation, retries) before model tier. Run the cheap tier first. Only escalate to a higher tier on the items that survive the cheap-tier filter.
3. **For judgment tasks:** use the best tier you can justify. Cap volume rather than capping quality — a frontier model on the 30 alerts that actually need human-grade reasoning is cheaper than a frontier model on all 3,000.
4. **Build a triage funnel,** not a single tier. Cheap-tier coverage filters most volume; mid-tier handles ambiguity; frontier handles the residue.
5. **Re-evaluate quarterly.** Cheap-tier capabilities improve fast; what needed a frontier model six months ago may not anymore.

## Example

A district's security team gets 4,000 EDR alerts a week. They were paying for a frontier-model triage product at $X per alert. Re-architecting:
- Cheap-tier model with good scaffolding does first-pass labelling on all 4,000 — outputs three buckets (likely benign, ambiguous, likely worth a human).
- Mid-tier model re-checks the *ambiguous* bucket only.
- Frontier model is reserved for the *likely-worth-a-human* bucket plus anything escalated by the SOC analyst.

End-to-end cost drops by an order of magnitude; analyst load drops because the cheap-tier filter is tuned to be conservative on the "likely benign" bucket; the frontier model is now reserved for the calls where its reasoning actually matters.

## Error handling

If the cheap-tier filter starts missing real signal: that is a scaffolding bug, not a tier bug. Tighten the chunking, add a validator, expand the test set the filter is evaluated against. Escalating to a more expensive tier without fixing the scaffolding burns budget without closing the gap.

## Provenance

The coverage-vs-brilliance framing draws on Stanislav Fort / AISLE's public results showing that a small open model with good scaffolding can match a frontier vulnerability-detection model once the right code is isolated. Cited as a public research finding informing tier selection, not as endorsement of any specific product.
