---
name: mythos-class-risk-roadmap
description: Six-step risk-based roadmap for reducing AI-amplified loss in a school environment — verify the floor, define the posture, constrain the identity, govern the execution
domain: security
intent: guard
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Evaluate
argumentHint: current AI footprint (sanctioned tools, agents, shadow AI) and posture maturity
---

# mythos-class-risk-roadmap — Govern AI like governed machine execution

When autonomous offensive capability becomes a commodity feature of models and agents, defenders don't get a brand-new attack surface — they get the existing surface exploited cheaper and faster. Phishing, credential abuse, unpatched KEVs, cloud misconfig, brittle backups, and ungoverned machine identity still drive most loss. This skill gives a school IT or compliance lead a six-step sequence to make AI risk manageable instead of mythological.

## When to use

- Standing up an AI security programme for a district that hasn't formally addressed AI yet
- A leadership ask after a high-profile AI security headline ("are *we* exposed to this?")
- Annual review of AI posture against a structured framework rather than a vendor pitch deck

## When NOT to use

- Mid-incident — go to `incident-triage-checklist`; this is a roadmap, not a runbook
- Buying decisions about specific tools — this skill defines the controls; tool selection comes later

## The six steps in order

1. **Establish AI security and data-protection policies.** Acceptable use, data-handling rules, ownership, accountability, boundaries for tools, agents, copilots. Set the policy *before* the technology spreads. Leadership sign-off; communicate across teams.
2. **Build AI inventory and visibility.** A single view of every AI system, agent, copilot, data flow, prompt, model, and *shadow* AI. Scan for sanctioned and unsanctioned tools; assign owners; map data access and tool integrations. Governance starts with what exists.
3. **Verify cyber hygiene and residual risk (the foundation).** Stabilise the environment AI will amplify. Start with CISA Known Exploited Vulnerabilities (KEV); expand to identity, exposure, logging, backups. Enforce MFA, immutable backups, and config-drift controls. This layer carries roughly 60–70% of avoidable AI-driven loss.
4. **Apply a risk-based AI security model.** Classify every AI use case into Low / Medium / High tiers. Define controls across three layers:
   - Layer 1 — cyber residual risk floor (~60–70%): identity, KEV-first patching, MFA, backups
   - Layer 2 — AI / application security (~15–25%): prompt-injection and output handling, OWASP-for-LLM
   - Layer 3 — governance (Tech & Ops) and AI / NHI IAM (~10–20%): inventory, policy exceptions, decision rights
5. **Implement an AI / NHI IAM standard.** Treat every meaningful AI agent and non-human identity as a first-class governed identity: distinct attributable IDs, least privilege, short-lived credentials, acting-on-behalf-of context, per-call authorisation, immediate suspension capability. Without bounded machine identity, higher-level governance is unenforceable at runtime.
6. **Operate integrated AI governance.** Connect human decisions to machine actions with traceability. Build a Decision Rights Matrix, a Constraint Catalog, and a Provenance Chain so approvals, constraints, execution, telemetry, and audit form one auditable loop. Include suspension and rollback playbooks.

## Workflow

1. **Pick the lowest unfinished step.** Don't skip ahead. Steps 1–3 carry most of the loss reduction and are prerequisites for the rest.
2. **30-day quick cycle for steps 1–3.** Initial AI inventory, KEV + CCS hygiene check, classify the highest-risk AI use cases.
3. **Quarterly review of steps 4–6.** Risk tiers, NHI inventory, governance loop coverage.
4. **Track residual risk by layer.** If layer-1 isn't done, layer-2 and layer-3 work is wasted insurance.

## Example

A district stands up the programme:
- Step 1: AI policy approved by the superintendent in two weeks; published.
- Step 2: First inventory scan finds 14 sanctioned AI tools and 41 unsanctioned (mostly free transcription, image, and code tools used by individual teachers).
- Step 3: KEV check turns up six unpatched KEVs on internet-facing services; remediated.
- Step 4: The 14 sanctioned tools are tiered; three High-tier tools (those touching student records) get Layer-2 controls before any further rollout.
- Steps 5–6: NHI IAM and integrated governance scoped for the next two quarters.

## Error handling

If leadership wants to start at step 4 ("we already do hygiene, let's get to the AI-specific stuff"), push back politely and verify step 3 first. Most "we already do hygiene" claims fall over on the KEV check; finding that out now is cheaper than finding it out during an incident.

## Provenance

The six-step structure is summarised from the public "AI Security 6-Step Approach" / *Mitigating Mythos-Class Risk* discussion circulating in the security-leadership community. Cited as a public framework, not as official guidance.
