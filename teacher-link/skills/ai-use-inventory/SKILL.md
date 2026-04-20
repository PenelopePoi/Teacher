---
name: ai-use-inventory
description: Surface shadow AI use across a school — the free transcription tools, free image generators, free coding assistants, and free "homework helpers" that teachers and students are already using — so policy and data protection catch up with practice
domain: security
intent: analyze
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Analyze
argumentHint: the population to inventory (staff, students, grade range) and the time window
---

# ai-use-inventory — What are we actually using?

Policy on AI use means very little if nobody knows what's actually being used. The inventory is the prerequisite to every other governance move: classification, tiering, contract review, training. The step that `mythos-class-risk-roadmap` calls "build AI inventory and visibility" is its own discipline in a school, because the surface is wide and most of it is free-tier.

## When to use

- First-time inventory before standing up an AI-use policy
- Quarterly refresh after the initial pass; shadow AI changes fast
- After an incident or near-miss (sensitive data pasted into a free tool, an AI-generated assessment backfiring)
- Before a vendor contract renewal; the inventory informs what the school actually needs to sanction

## When NOT to use

- Mid-incident — go to `incident-triage-checklist`
- Evaluating a single tool pre-adoption — that's `secure-by-default-vs-by-config` and `vendor-dpa-review`

## The four data sources

1. **Network and proxy logs.** Destination domains over 30-60 days, aggregated by request count. Filter for known AI services (`openai.com`, `anthropic.com`, `gemini.google.com`, `perplexity.ai`, `character.ai`, `midjourney.com`, plus hundreds of smaller). The long tail is where shadow AI lives.
2. **Browser extension inventory** from the Chromebook or endpoint management console. AI extensions (translate, summarise, rewrite, image-gen) often reveal the tool even when network logs don't.
3. **SSO / OAuth grants** in the identity provider. A free AI tool with a Google Workspace OAuth grant is inventoriable by that grant; revoking unknown grants closes a chunk of the supply chain `secrets-rotation-after-vendor-breach` warns about.
4. **Staff survey, anonymous.** Free-tool use is under-reported in conversations where staff feel judged; a low-stakes anonymous survey catches what the logs miss (tools accessed from phones, tools with no SSO, tools staff use at home).

## Workflow

1. **Scope the inventory window.** 30 to 60 days of logs; any shorter misses the monthly-use tail.
2. **Extract the four sources in parallel.** Don't let one blocked extract stop the other three.
3. **Classify each identified tool by data exposure.** What data can it see? What does its free tier say about retention and training use? Any DPA? Any sanctioned alternative the school already pays for?
4. **Score by risk.** Tool touching student records with no DPA, free tier, training-by-default → high. Tool the school already sanctions, properly configured → low. Tool nobody uses more than once → ignore.
5. **Close the easy gaps.** Revoke unnecessary OAuth grants. Block a small number of specifically-risky destinations at the proxy. Pre-install sanctioned alternatives on the fleet so staff don't reach for the shadow tool.
6. **Communicate, don't punish.** Publish the inventory (aggregated, no individual names) with a short "here's what we found, here's why each item was classified, here's the sanctioned alternative" note. Staff who thought they were alone find out the tool is widespread, and the alternative.
7. **Feed the inventory into governance.** `mythos-class-risk-roadmap` step 2 uses this; `student-data-protection` uses the risk-classification; `vendor-dpa-review` uses the list of tools worth negotiating contracts with.
8. **Refresh quarterly.** New tools appear every month; old ones die. The inventory is a rolling artefact, not a one-off.

## Example

A district runs its first inventory over Q1:
- Network logs reveal 47 distinct AI services accessed by at least five staff.
- Fourteen are clearly sanctioned and low-risk.
- Twenty-one are "seen once, not worth pursuing."
- Twelve are widely used with no contract; nine of those have free tiers whose terms allow training on inputs.
- Of the twelve: three are replaced by sanctioned alternatives in the same quarter; four are candidates for enterprise contracts (negotiated via `vendor-dpa-review`); five are blocked at the proxy with a notice pointing staff to alternatives.
- The anonymous staff survey surfaces two tools that didn't appear in logs because everybody was using them from personal devices at home. Those go on the policy list under off-device-use guidance.

## Error handling

If leadership wants to "just block all AI" as a response to the inventory: that's rarely viable. Staff will route around at home or on personal devices, producing exactly the shadow problem you started with. The alternative is tiered sanctioning: a small sanctioned list with good defaults, a clearly-communicated blocklist of data-hostile free tiers, and a path to request additions that doesn't take six months.

## Provenance

Aligned with `mythos-class-risk-roadmap` step 2 and the broader public discussion of shadow-AI visibility in regulated environments (healthcare, financial services, K-12). Cited as public operational guidance, not as endorsement of any specific inventory / CASB product.
