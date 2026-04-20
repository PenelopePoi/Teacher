---
name: phishing-defense-program
description: Run a phishing-defence programme that actually moves the click-rate down — sims, training, reporting paths, and the metrics that tell you whether any of it is working
domain: security
intent: guard
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Evaluate
argumentHint: current click-rate (if known) and target audience
---

# phishing-defense-program — A programme, not an event

A once-a-year compliance video doesn't change behaviour. A real programme runs sims on a regular cadence, makes reporting trivially easy, trains on what the sims actually catch, and tracks numbers over time.

## When to use

- Standing up phishing defence for a school or district that doesn't have one
- The current programme exists but the click-rate isn't moving
- An incident traced back to a phishing email and leadership wants "more training" — channel that into something measurable

## When NOT to use

- A specific user just clicked a phish — that's `report-suspicious-activity` plus `incident-triage-checklist`, not programme design
- The school has no email infrastructure of its own (e.g., relies entirely on a parent district) — coordinate up rather than running parallel sims

## The four pillars

1. **Reporting path.** A one-click "Report phishing" button in the mail client. Reports go to a real inbox a person reads. People will not report if it's a five-step process.
2. **Sims.** Monthly simulated phishing emails covering different lures (urgency, authority, financial, internal-impersonation). Track click-rate and report-rate per audience (students, staff, admin).
3. **Training.** Short (5-minute) modules tied to the lures the sims used. Trigger training only for users who clicked, not for everyone — broad training trains people to ignore training.
4. **Metrics.** Click-rate, report-rate, time-to-first-report. Report-rate is the leading indicator; click-rate is the lagging one.

## Workflow

1. **Baseline.** Run one sim before any training. The baseline click-rate is the number you compare against later.
2. **Install the report button.** This is non-negotiable.
3. **Set a cadence.** Monthly sims; quarterly leadership review of metrics.
4. **Differentiate by audience.** A simulated invoice scam is wasted on a 7th-grader; a fake "Discord nitro" gift is wasted on the finance team. Use lures appropriate to each group.
5. **Treat repeat clickers as a process problem,** not a personal failing. If 30% of staff fall for the same lure pattern twice, the training is wrong, not the staff.
6. **Publish trend lines** internally. "Report-rate up from 4% to 22% this term" makes the programme defensible to leadership.

## Example

A district baselines at 18% click / 3% report. After six months of monthly sims and triggered micro-trainings, they're at 6% click / 31% report. Leadership renews the programme; the SOC partner notes that real phishes are now being reported within minutes, before anyone clicks.

## Error handling

If the report button generates noise (people reporting newsletters and meeting invites): that's a feature, not a bug — better over-reporting than under-reporting. Triage the inbox; don't punish reporters.
