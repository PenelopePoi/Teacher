---
name: board-reporting-cyber-risk
description: Report cyber risk to a school board in metrics they can act on — MTTD, MTTR, KEV exposure, MFA coverage, backup-drill pass/fail, top-five residual risks — instead of vanity numbers the board cannot use
domain: security
intent: analyze
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Evaluate
argumentHint: the reporting cadence (quarterly / annual) and the board's current familiarity with cyber topics
---

# board-reporting-cyber-risk — Numbers a board can act on

A school board is a governance body, not a SOC. Its job is to set direction, approve spend, and hold leadership accountable. Cyber reporting that dumps dashboards and acronyms is reporting that gets nodded through and ignored. Reporting that lands is short, uses a small set of durable metrics, and tells the board what decision is in front of them. This skill is the format.

## When to use

- Quarterly IT / cyber update to the board — the expected cadence for a district with real cyber exposure.
- Annual risk review / audit committee briefing.
- After an incident, as part of the closeout narrative.
- Before a major cyber-spend decision (MFA rollout, SaaS backup, IR retainer).
- After a peer district is publicly breached and the board asks "are we exposed?"

## When NOT to use

- Briefing the technical staff — they need operational detail, not governance format. Use a different deck.
- A crisis-response briefing mid-incident — use the incident-response communications template, not a risk-metric report.
- Public-facing communications — privacy- and safeguarding-scope detail should never be in a public deck.

## The seven metrics that belong in a board report

Pick these. Report them every time. Show the trend.

1. **MFA coverage** — percent of staff accounts and service accounts on phishing-resistant MFA. Baseline, target, trend. Tie to `mfa-rollout-for-schools`.
2. **KEV-exposed asset count** — number of internet-reachable assets running a CVE in the CISA Known Exploited Vulnerabilities catalog. Baseline, target (zero), trend.
3. **MTTD** — mean time to detect, measured from a representative incident set (not "average across everything"). Improvements mean earlier detection.
4. **MTTR** — mean time to recover, on the same incident set.
5. **Backup-restore-drill pass/fail** — did the last quarterly drill pass end-to-end? If failed: what failed, and the remediation plan. Tie to `backup-restore-drill`.
6. **Top-five residual risks** — named, with current mitigation and the board-level decision needed (accept / fund / delegate). Updated every quarter.
7. **Training completion** — percent of staff completed the last phishing-sim cycle and digital-citizenship refresh. Tie to `phishing-defense-program`.

These seven are durable: the same set works across years, and trending them shows whether the district is getting safer. Avoid vanity: "blocked X million attacks at the firewall" is not a decision metric.

## The two metrics that drift into theatre

Name them out loud to yourself every quarter and check that they are not in the deck:

- **Volumetric counts** ("we blocked 2.3 million phishing emails"). Means nothing without denominator, and cannot be acted on.
- **Tool counts** ("we have 47 security tools"). More tools ≠ safer; often the opposite. If this is in the deck, the deck is a vendor sales slide.

## The one-page report format

Every quarter, one page. Two sides if you must. No more.

```
Cyber Risk Report — Q[N] [Year]
Prepared by: [Named IT/Security Lead]

1. Headline: one sentence (e.g., "The district's MFA rollout completed this
   quarter; backup drill failed on SaaS restore; top residual risk is
   segmentation of the IoT VLAN.")

2. Seven metrics — a 2×4 grid, each cell: metric, current, trend arrow,
   one-line context.

3. Top-five residual risks — named, each with: current mitigation, owner,
   board decision needed, target date.

4. Board decisions requested — bulleted, one line each. "Approve $X for
   SaaS backup renewal"; "Endorse the identity-provider-hardening plan";
   "Acknowledge the holiday-break IR posture plan."

5. Next quarter's focus — bulleted, three items.
```

## Workflow

1. **Select the seven metrics** and baseline them. Write down the measurement method — that method does not change quarter to quarter, or the trends lie.
2. **Build the data pipeline** — a spreadsheet is fine in year one; a dashboard helps by year two. Either way, the number is produced the same way every quarter.
3. **Name a reporting owner** — the IT director, CIO, or a named security lead. The board sees the same face every quarter.
4. **Draft the one-page format.** Get a sanity read from another educator-IT peer who has done this. The first draft will be too long; cut it.
5. **Pre-brief the chair** — a 15-minute call the week before the board meeting lets the chair know what the requested decisions are and prevents surprise.
6. **Present** — read the headline, show the grid, walk the top-five risks, make the asks. Answer questions in plain language.
7. **Log the decisions** in the board minutes and in the IT risk register.
8. **Review annually** that the seven metrics still measure what matters; replace one per year if it becomes stale.

## Example

A district's first board cyber report:

> **Headline.** MFA rollout completed (99.3%). Q3 backup drill failed on SaaS restore path. The top residual risk is ransomware through IoT — a $42k decision is in front of the board tonight.

The 2×4 grid shows: MFA 99.3% ↑; KEV-exposed 3 ↓ (was 12); MTTD 41 min ↓; MTTR 3.8 hr ↓; Backup drill FAIL; Top-5 risks updated; Training 96% ↑.

Residual risks: IoT segmentation (fund), identity-provider session-limit tightening (approve), SaaS backup vendor change (deferred to Q4), MFP fleet hardening (in progress), holiday-break posture (acknowledge).

Asks: approve $42k for IoT segmentation; endorse the IdP session-limit change; acknowledge the holiday-break posture plan.

Total meeting time on the item: 22 minutes. Three decisions recorded.

## Error handling

If the board asks for a metric not on the list: hear the question behind the ask. Usually they want reassurance on a single topic (ransomware readiness, data-leak exposure). Answer the topic directly, and if the metric would be durable, add it to the list for next quarter — with a stated measurement method.

If metrics move the wrong way: do not bury them. Open with the bad number; show the remediation plan; ask for what you need. A board that discovers a hidden bad number in the press or from an auditor stops trusting the reporter.

If there is no incident in the quarter: still run the drill, still baseline the metrics, still present. "Nothing happened" is the wrong reporting mode; posture needs governance even when the quarter is quiet.

## Provenance

Aligned with NIST Cybersecurity Framework 2.0's GOVERN function (published Feb 2024, emphasising board-level cyber governance), CISA's K-12 Cybersecurity Leadership briefings, and the CISA Known Exploited Vulnerabilities Catalog as a concrete data source. Cross-references `fight-fraud-mapping` (observations that feed the narrative), `phishing-defense-program`, `mfa-rollout-for-schools`, and `backup-restore-drill`.
