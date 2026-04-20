---
name: social-engineering-101
description: Recognise the four classic social-engineering moves — pretexting, baiting, tailgating, vishing — and the emotional levers each one pulls
domain: education
intent: teach
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Understand
argumentHint: the scenario or message to classify
---

# social-engineering-101 — Who, why, and which lever?

Technical controls can be bypassed by a polite human on a phone. This skill teaches learners to name the move being pulled on them.

## When to use

- A learner reports feeling pressured to do something they normally wouldn't
- Staff training — to give people a shared vocabulary before the moment arrives
- You receive an unusual request that references authority, urgency, or fear

## When NOT to use

- You are mid-incident — stop analysing the attacker's psychology and start containment (`incident-triage-checklist`)
- The request is legitimate but awkward — the skill is about attack patterns, not social discomfort

## The four moves

- **Pretexting** — fabricating a believable identity to extract information. "I'm from IT and we're resetting passwords today." Lever: authority.
- **Baiting** — leaving something tempting so the target takes the action. USB drops labelled "Salaries 2025" in the staff parking lot. Lever: curiosity / gain.
- **Tailgating** — physically following someone through a badge-controlled door. Lever: politeness. Most people hold the door.
- **Vishing** — voice phishing. A phone call that sounds urgent. Often combined with pretexting. Lever: fear / urgency.

## Workflow

1. Notice the request you're about to honour. Say the lever out loud: *authority, curiosity, politeness, urgency*.
2. If the lever is present and the channel is unusual (phone call from "IT", email from an unknown address with a favour attached), slow down.
3. **Verify out-of-band.** Hang up and call IT's known number. Walk over. Message the person's known Slack handle, not the one in the email thread.
4. **Decline politely.** "I'm going to check with IT before I do that." An honest party accepts this; an attacker pushes back.

## Example

A caller claiming to be from the district office asks a secretary for a list of student IDs in a specific grade, "for a compliance audit due today." The lever is urgency + authority. The secretary says "I'll ring you back at the main office number," the caller hangs up. That was vishing + pretexting — the verify-out-of-band step ended it.

## Error handling

If information was already handed over: tell IT immediately; `incident-triage-checklist` applies. If you let someone tailgate in: radio / message the on-site security lead with a description. Do not chase anyone yourself.
