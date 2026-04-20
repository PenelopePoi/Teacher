---
name: fight-fraud-mapping
description: Map observed account-takeover and fraud activity in a school context to the seven lanes of the Fight Fraud Framework Matrix — Recon, Resource Dev, Initial Access, Defense Evasion, Positioning, Execution, Monetization
domain: security
intent: analyze
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Analyze
argumentHint: a fraud incident summary or a single observed event
---

# fight-fraud-mapping — Where on the kill chain are we?

The Fight Fraud Framework Matrix breaks fraud into seven sequential lanes (Reconnaissance → Resource Development → Initial Access → Defense Evasion → Positioning → Execution → Monetization). Mapping a school incident to the lanes makes it clear which controls failed and which controls would have caught it earlier.

## When to use

- Post-incident review of a fraud event (compromised parent-payment portal, fake invoice paid, gift-card scam against the principal's name)
- Threat-modelling a new payment or identity workflow before launch
- Briefing leadership on fraud risk in language that maps to industry standards

## When NOT to use

- Operational triage during an incident — that's `incident-triage-checklist`. Mapping is a post-event lens.
- Generic malware incidents with no fraud component — the framework is fraud-specific; use ATT&CK for that

## The seven lanes (school-flavoured examples)

| Lane | What it covers | School example |
|---|---|---|
| Reconnaissance | Researching targets, harvesting public info | Scraping the staff directory off the school website |
| Resource Development | Acquiring infrastructure, fake materials, lookalike domains | Registering `school-payments-portal.tk` |
| Initial Access | First foothold | Phishing the bursar's account; password reuse from a breach |
| Defense Evasion | Hiding the activity | Forwarding rules that auto-delete the genuine vendor's replies |
| Positioning | Setting up to act | Adding an attacker-controlled bank account as a "saved payee" |
| Execution | Doing the fraudulent action | Submitting a wire transfer to the new payee |
| Monetization | Getting value out | Cryptocurrency conversion; layered withdrawals |

## Workflow

1. **Walk the incident in order.** What was the earliest signal you have? Place it in a lane.
2. **Identify the lane *before* that one** that you didn't catch. That's where the next control belongs.
3. **For each lane, name the control that *would* have caught it.** Recon — locked-down directory listings; Resource Dev — domain monitoring; Initial Access — MFA + password manager; Defense Evasion — alerting on inbox-rule changes; Positioning — out-of-band confirmation for new payees; Execution — dual-approval on transfers; Monetization — bank-side velocity controls.
4. **Pick the one or two highest-leverage controls** and build them into the next quarter's roadmap. Don't try to fix all seven lanes at once.

## Example

A school's bursar account is compromised via a credential-stuffing attack. The attacker creates an inbox rule that hides messages from the genuine vendor, adds an attacker-controlled bank as a saved payee, and re-routes a $42k invoice payment.

Mapped:
- Initial Access — credential stuffing (fix: MFA + manager)
- Defense Evasion — inbox rule (fix: alert on auto-delete rule creation)
- Positioning — new payee added (fix: out-of-band callback to confirm new payees)
- Execution — payment submitted (fix: dual approval on transfers above a threshold)

Leverage choice: dual approval on transfers + new-payee callback. Both close the door even if Initial Access succeeds again.

## Error handling

If an incident doesn't cleanly fit the lanes (e.g., insider fraud where there's no Initial Access lane, just a person with valid credentials abusing them): note it explicitly. The framework is a lens, not a contract — record the misfit and move on; don't force-fit.
