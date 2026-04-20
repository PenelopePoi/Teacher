# Submission 02 — Secure by Default vs. Secure by Config

> **Source skill:** `teacher-link/skills/secure-by-default-vs-by-config/SKILL.md`
> **Format:** In-person 30-minute presentation
> **Track fit:** MCP servers, AI agents, and tool-use attacks and defenses; Cloud security architecture; Supply chain security for cloud-native applications and dependencies

## Title

**Defaults Are Policy: Procuring SDKs, MCP Servers, and Protocols Without Inheriting Their Risk**

## Abstract

When a cloud-native component (SDK, protocol implementation, MCP server, integration framework) ships configurable into a secure posture, vendors increasingly respond to vulnerability reports with "it can be configured securely" or "this is documented behaviour." For most downstream operators, defaults are policy: the quick-start install is the production install. A protocol that requires every integrator to re-derive the secure configuration will be insecure in most deployments, regardless of what the docs say.

This session presents a procurement and architecture method for evaluating cloud-native components by what they do out of the box. It walks through the recurring "by design" deflection pattern — including the OX Security MCP arbitrary-command-execution disclosure and the broader public argument about secure-by-default responsibilities at protocol layer — and gives attendees a working decision framework. Attendees leave with three procurement questions that surface default-vs-configurable security gaps, a six-step evaluation workflow that ends in *don't adopt / wrap with edge-enforced safe defaults / accept residual risk in writing*, edge-wrapper patterns for AI-tool integration where the underlying component is permissive, and a residual-decision document template that survives staff turnover.

## Outline (30 minutes)

| Min | Section |
|---|---|
| 3 | Defaults are policy: why "it can be configured securely" is not the same as "it is secure" |
| 4 | The "by design" deflection: the recurring pattern, examples (OX/MCP, others), and the structural cause (burden shifted to those with least context, most to lose) |
| 5 | Three procurement questions: what does the simplest hello-world deployment do; what does the system do when configuration is omitted or malformed; who pays when the defaults are wrong |
| 6 | Six-step evaluation workflow with a worked MCP-server-style example — install, compare, search rejected reports, score four failure modes, decide, document |
| 5 | Wrapper patterns: what an edge-enforced safe default looks like for an AI-tool integration where the underlying component is permissive |
| 4 | Documenting the residual: making the wrapper-or-residual decision survive staff turnover and re-emerge at every framework upgrade |
| 3 | Q&A |

## Key takeaways

1. Three procurement questions that surface default-vs-configurable security gaps before adoption
2. A six-step evaluation workflow ending in *not-adopt / wrap / accept-residual* with a concrete decision artefact
3. Edge-wrapper patterns for AI-tool and MCP-server integration where the underlying component is permissive by default
4. A residual-decision document shape that survives staff turnover and gets re-evaluated at upgrade boundaries

## Speaker bio (fill in)

```
[Speaker name] is [current role] at [organisation], where [they] lead
[procurement / architecture / cloud-security] decisions for
[regulated environment context — schools, healthcare, public sector,
fintech]. [They] previously [prior role demonstrating practitioner
credibility in evaluating SDKs, protocols, or third-party components
under real risk constraints]. [Their] work focuses on default-state
security analysis of cloud-native components, edge-wrapper patterns
for AI-tool integration, and decision documentation that survives
staff turnover. [They] are based in [city].
```

## Source material the speaker will cite

- The OX Security MCP-server arbitrary-command-execution disclosure and Anthropic's response framing the behaviour as documented design
- One additional public "by design" rejection of a real vulnerability report (speaker should pick one well-documented case from their own evaluation history)
- The speaker's own procurement-decision artefacts (substitute: number of components evaluated, percentage that passed default-state evaluation, examples of wrappers built)

## Promotional plan (per CFP commitment)

LinkedIn announcement at acceptance, two-week pre-Summit teaser with the three procurement questions as a graphic, day-of post linking to the session, post-Summit publication of the decision-document template as a downloadable artefact.

## Notes for the speaker before submitting

- Pick one specific real-world case (with public sources) to anchor the talk — generic "SDKs are bad by default" content is exactly what the CFP forbids
- Avoid naming any single vendor as the villain; the structural pattern is the point, not the brand
- Confirm in-person availability; in-person speakers prioritised per CFP
- The wrapper-pattern slide is the technical centrepiece — should be readable from a distance and by a virtual audience
