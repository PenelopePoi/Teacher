# Submission 03 — Mythos-Class Risk Roadmap

> **Source skill:** `teacher-link/skills/mythos-class-risk-roadmap/SKILL.md`
> **Format:** In-person 30-minute presentation
> **Track fit:** Cloud and AI governance guardrails; Cloud security architecture; Generative AI and Agentic AI security

## Title

**Mythos-Class Risk: A Six-Step, Risk-Based Roadmap for Cloud and AI Programs**

## Abstract

Autonomous offensive capability is becoming a commodity feature of models and agents. Defenders don't get a brand-new attack surface — they get the existing surface (phishing, credential abuse, unpatched KEVs, cloud misconfig, brittle backups, ungoverned non-human identity) exploited cheaper and faster. Treating AI risk as an isolated app-sec problem produces frameworks that are intellectually satisfying and operationally useless; treating it as governed machine execution inside an existing business risk model produces a roadmap that closes loss.

This session presents a six-step, risk-based roadmap drawn from the *AI Security 6-Step Approach* / *Mitigating Mythos-Class Risk* discussion in the security-leadership community: establish AI security and data-protection policies; build AI inventory and visibility (including shadow AI); verify cyber hygiene and residual risk (CISA KEV first); apply a risk-based AI security model with three layers (residual risk floor ~60–70%, AI/app-sec ~15–25%, governance + NHI IAM ~10–20%); implement an AI / NHI IAM standard treating every meaningful agent as a first-class governed identity; operate integrated AI governance with a Decision Rights Matrix and Provenance Chain. Attendees leave with the sequence, layer-by-layer loss-reduction proportions to defend the budget, a 30-day quick cycle for steps 1–3, and the most common ordering mistakes to avoid.

## Outline (30 minutes)

| Min | Section |
|---|---|
| 3 | Why most AI risk is amplification, not novelty: the same channels, faster and cheaper |
| 4 | The three-layer model and where loss actually concentrates (~60–70% / ~15–25% / ~10–20%) — and why skipping layer 1 makes layer 2 and 3 work wasted insurance |
| 4 | Steps 1–3 in detail: policy, AI inventory (sanctioned + shadow), KEV-first hygiene check — the 30-day quick cycle |
| 4 | Step 4: risk-based AI security model with three real-world tier examples (Low / Medium / High) and the controls each tier inherits |
| 4 | Step 5: AI / NHI IAM as the runtime enforcement layer — distinct identity, least privilege, short-lived credentials, acting-on-behalf-of context, immediate suspension capability |
| 4 | Step 6: integrated governance — Decision Rights Matrix, Constraint Catalog, Provenance Chain — connecting human approvals to machine actions with traceability |
| 4 | Common roadmap mistakes (starting at step 4, frontier-tooling for layer-1 problems, treating shadow AI as discoverable later) |
| 3 | Q&A |

## Key takeaways

1. The six-step sequence in the order that actually works, with clear prerequisites between steps
2. Layer-by-layer loss-reduction proportions to defend the AI-security budget at the leadership table
3. A 30-day quick cycle for steps 1–3 that produces measurable posture change before the bigger investments land
4. A NHI IAM sketch (distinct identity, least privilege, short-lived credentials, suspension capability) that makes step-6 governance enforceable at runtime
5. The most common roadmap mistakes and how to avoid them

## Speaker bio (fill in)

```
[Speaker name] is [current role — CISO / security architect / AI
governance lead] at [organisation]. [They] have led [N] AI-security
program build-outs in [regulated context — schools, healthcare,
public sector, financial services], with a focus on aligning AI risk
to existing business risk models rather than treating it as a
standalone problem. [Their] work focuses on AI inventory and
visibility (including shadow AI), KEV-first cyber hygiene as the
residual-risk floor, and NHI IAM as the runtime enforcement layer for
governance decisions. [They] are based in [city].
```

## Source material the speaker will cite

- The public *AI Security 6-Step Approach* / *Mitigating Mythos-Class Risk* discussion in the security-leadership community
- CISA Known Exploited Vulnerabilities (KEV) catalogue as the reference for step 3
- The speaker's own program-build-out work (substitute: number of AI use cases tiered, KEV-remediation timeline before/after the hygiene check, number of shadow-AI tools surfaced in first inventory pass)

## Promotional plan (per CFP commitment)

LinkedIn announcement at acceptance, mid-cycle teaser with the three-layer loss-distribution graphic, day-of post linking to the session, post-Summit publication of the 30-day quick-cycle checklist as a downloadable artefact.

## Notes for the speaker before submitting

- Three-layer loss-distribution graphic is the slide most likely to circulate independently — invest in making it readable from a distance and by a virtual audience
- Avoid framing the roadmap as a vendor-product fit; the CFP forbids product pitches and the framework is the asset, not any tooling
- Be specific about *which* AI use cases land in each tier in the worked example — vague "high-risk use cases" content is what the CFP forbids
- Confirm in-person availability; in-person speakers prioritised per CFP
