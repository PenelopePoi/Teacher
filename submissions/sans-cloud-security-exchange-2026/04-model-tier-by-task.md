# Submission 04 — Model Tier by Task

> **Source skill:** `teacher-link/skills/model-tier-by-task/SKILL.md`
> **Format:** In-person 30-minute presentation
> **Track fit:** AI-powered cloud and application security; Cloud security monitoring and threat detection; Generative AI and Agentic AI security

## Title

**A Thousand Adequate Detectives: Choosing Model Tier by Task Shape in Cloud Security Workflows**

## Abstract

The "best model" obsession spends frontier-model budget on tasks that a cheap model with good scaffolding handles equally well — and runs out of budget for the tasks that genuinely need reasoning. This session presents a working method for picking model tier by task shape across cloud-security workflows.

Coverage tasks (fuzzing, dependency scans, secret hunting across a sprawling monorepo, first-pass log triage, EDR alert classification, mailbox-layer phishing triage) run cheap and parallel with good scaffolding; isolation matters far more than parameter count. Stanislav Fort / AISLE's public results showed a 3.6B-parameter model with the right scaffolding matching frontier vulnerability detection once the right code was isolated; the scaffolding was doing the work, not the model. Judgment tasks (does this proposed patch actually close the underlying bug? is this user request a social-engineering tell? does this DPA actually protect the data?) are where frontier reasoning earns its price.

Attendees leave with a working coverage-vs-judgment task taxonomy for cloud-security workflows, a triage-funnel design pattern that drops cost by an order of magnitude in real EDR-triage deployments, a diagnostic for distinguishing scaffolding bugs from tier bugs when the cheap-tier filter starts missing signal, and a quarterly re-evaluation cadence so the funnel stays calibrated as cheap-tier capabilities improve.

## Outline (30 minutes)

| Min | Section |
|---|---|
| 3 | Coverage vs. brilliance: the framing, and why the "best model" obsession misallocates budget |
| 5 | Coverage tasks in cloud security: fuzzing, dependency scans, secret hunting, first-pass triage, EDR classification, mailbox phishing — where cheap + scaffolding wins |
| 5 | Judgment tasks in cloud security: patch verification, social-engineering deconfliction, DPA evaluation, alert escalation calls — where frontier reasoning earns its price |
| 6 | The triage-funnel design pattern with a worked EDR example: cheap tier filters 4,000 alerts/week into three buckets, mid tier resolves the ambiguous bucket, frontier reserved for the residue and for analyst-escalated items — cost dropped ~10x |
| 4 | When the cheap-tier filter misses signal: scaffolding bug vs. tier bug — the diagnostic to apply before reaching for a more expensive tier |
| 4 | Quarterly re-evaluation: cheap-tier capabilities are moving fast; what needed frontier six months ago may not now |
| 3 | Q&A |

## Key takeaways

1. A working coverage-vs-judgment task taxonomy mapped to common cloud-security workflows
2. The triage-funnel design pattern with concrete numbers from a real deployment (cost reduction, analyst-load reduction, residue rate)
3. A diagnostic that distinguishes scaffolding bugs from tier bugs — so the response to "the filter is missing signal" is to fix the scaffolding, not burn budget on a more expensive model
4. A quarterly re-evaluation cadence and the signals that should trigger it sooner

## Speaker bio (fill in)

```
[Speaker name] is [current role] at [organisation], where [they]
design AI-assisted security workflows across [coverage area — log
triage, EDR, code review, etc.]. [They] previously [prior role
demonstrating practitioner credibility in AI-tooling cost optimisation
or large-scale security automation]. [Their] work focuses on
coverage-vs-judgment task analysis, triage-funnel architectures that
keep frontier reasoning where it matters, and scaffolding-vs-tier
diagnostics for AI-assisted security tooling. [They] are based in
[city].
```

## Source material the speaker will cite

- Stanislav Fort / AISLE's public results showing a small open model with good scaffolding matching frontier vulnerability detection once the right code is isolated
- The speaker's own deployment experience — substitute concrete numbers: alerts processed per week, cost per alert before/after, residue rate sent to the frontier tier, analyst-load delta

## Promotional plan (per CFP commitment)

LinkedIn announcement at acceptance, mid-cycle teaser with the coverage-vs-judgment task taxonomy as a graphic, day-of post linking to the session, post-Summit publication of the triage-funnel design pattern as a downloadable artefact (boxes-and-arrows diagram + worked example numbers).

## Notes for the speaker before submitting

- Lead with the worked EDR example — concrete numbers (alerts/week, cost reduction multiple, residue rate) are the strongest evidence the talk has, and the CFP rewards specificity over framing
- The coverage-vs-judgment taxonomy slide should be readable from a distance and by a virtual audience; consider columns rather than a paragraph dump
- Avoid naming any specific cheap-tier or frontier-tier model — the framing should outlast any particular product release, and the CFP forbids product pitches
- Confirm in-person availability; in-person speakers prioritised per CFP
