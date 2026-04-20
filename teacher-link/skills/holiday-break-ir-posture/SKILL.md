---
name: holiday-break-ir-posture
description: Harden the district before a long weekend or winter break — frozen change window, pre-break admin-session revoke, on-call rota, backup-verified sign-off — because attackers know the SOC is empty and they target that
domain: security
intent: guard
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Apply
argumentHint: the upcoming break (duration, staffing), the current IR retainer, and the backup verification date
---

# holiday-break-ir-posture — Ransomware knows the calendar

CISA's joint advisory on holiday and weekend ransomware is explicit: attackers time their detonation to when the SOC is empty, the decision-makers are unreachable, and the restore runbook has not been touched in months. Schools are particularly exposed because winter, spring, and summer breaks are long and predictable. The posture before a break is not "send everyone home"; it is a short list of hardening steps that make the break safer and a named on-call who can act if something lights up.

## When to use

- 7-10 days before any long break (≥3 days): Thanksgiving, winter break, spring break, major holidays, summer break.
- 2-3 days before a long weekend (≥4 days).
- After a peer district is breached during a break — immediate posture check even outside the usual cycle.

## When NOT to use

- Mid-break, mid-incident — go to `incident-triage-checklist`. This skill is preparation, not response.
- The end-of-year "the whole IT team is leaving, what now?" — that is staff turnover planning, not break posture.

## The pre-break checklist (T-minus 7 days)

1. **Backups verified within the last 7 days.** Not "the backup ran"; a restore tested. Tie to `backup-restore-drill`. If the last drill failed, remediate before break.
2. **Patch current.** KEV-catalog CVEs patched on every internet-reachable asset. Anything unpatchable has a compensating control or is offline for the break.
3. **MFA coverage confirmed.** No service account, no admin account, no shared account is exempt. The "we'll fix it Monday" accounts are the break-compromise vector.
4. **Admin session revoke scheduled** for the start of break. Force re-auth on return; short session lifetimes for the break period.
5. **OAuth-grant review** — any grants added in the last 30 days are re-validated. A staff-driven OAuth grant to an unknown app that sat unnoticed will be exploited when no one is watching.
6. **Change-freeze window declared.** No non-emergency changes from 48 hours before break through 24 hours after return. Document; communicate; exceptions require named approver.
7. **On-call rota published.** Two people minimum, named, reachable, with documented authority to call the IR retainer. Not "whoever's around."
8. **IR retainer contact verified.** A dry-run call to the 24/7 line; confirm they have current tenant IDs, access lists, and RPO/RTO expectations.
9. **Break-glass accounts tested.** See `identity-provider-hardening`. Sealed credentials work, monitoring fires, the right people know the procedure.
10. **Leadership contact chain current.** Superintendent, general counsel, comms lead, insurance broker, chair of the board — cell phones, not extensions.
11. **Communications templates ready.** Parent notice draft, staff notice draft, media holding statement. Not drafted mid-incident.
12. **Physical security.** Building alarms active; after-hours access list current; server-room physical access reviewed.

## The on-call structure

Two-person rota minimum for breaks of 4+ days. Primary and secondary; known to each other; both reachable. Each on-call carries:

- A rotating mobile or direct number the alerting system escalates to.
- Remote admin access via hardened paths (no "I have to go to the office to fix this").
- Authority to declare an incident, engage the IR retainer, and start parent-notification prep without needing to wake the superintendent first (for the first 30 minutes; after that, escalate).
- A short runbook: "alert fires → triage → if credible, engage retainer → call superintendent → evaluate parent notification trigger" (the full flow lives in `incident-triage-checklist`).

## Workflow

1. **Calendar the posture reviews.** Seven days before every break. Recurring. Not negotiable.
2. **Run the pre-break checklist**, assigning each item to a named owner with a deadline.
3. **Hold a 30-minute pre-break tabletop** with on-call staff: "at 2 am Day 3, this alert fires — walk it." Tie to `tabletop-exercise-design`.
4. **Freeze changes.** Publish the freeze. Email the staff. Honour it.
5. **Pre-break sign-off:** IT director signs a one-page statement "posture verified; on-call rota published; retainer confirmed; backups verified." File it.
6. **During break:** monitor alerts; respect the on-call rota; log every alert triaged even if it's a false positive (the log defends the posture later).
7. **Day 1 back:** change-freeze release only after a posture check; reset any emergency access used; close the break file.

## Example

A district prepares for winter break (17 days):

- T-14: posture review kicks off.
- T-10: backup drill passes end-to-end; includes SaaS restore per `workspace-365-backup`.
- T-7: KEV-catalog scan finds 2 unpatched assets. One patched, one re-segmented to `iot` where the CVE is unreachable from outside. MFA coverage 99.6%.
- T-5: OAuth-grant review. Three new grants; two re-validated, one revoked.
- T-4: Change freeze announced; staff emailed.
- T-3: On-call rota published (Primary: IT director; Secondary: senior SOC analyst). Dry-run call to IR retainer succeeds. Break-glass tested.
- T-2: Tabletop: "teacher reports encrypted Drive on Day 8." Team walks it; gaps found (Vol-shadow-copy on the file-server is not enabled for the SaaS-sync'd folders). Remediation assigned and completed T-1.
- T-0: Pre-break sign-off filed.
- Day 8 of break: anomalous login from a new country on a staff account flagged. Session revoked by on-call; MFA challenge fires on re-login; no compromise. Alert logged. IR retainer notified but not engaged.
- Day 1 back: posture-check pass; freeze released; break file closed.

## Error handling

If a check cannot be completed in time: extend the on-call rota, lower the risk (shut down the unpatched asset for the break, disable the suspect account) rather than accept the posture gap silently. Document what was skipped and why; remediate within two weeks.

If an alert fires mid-break and the on-call is slow to respond: escalate per the runbook; after the break, a post-mortem on the response latency — almost always, the fix is a shorter escalation chain, not a better person.

If an incident is confirmed mid-break: this skill stops; go to `incident-triage-checklist` and `ferpa-data-breach-notification` as applicable. The posture work done pre-break is now paying for itself.

## Provenance

Aligned with CISA and FBI joint advisory AA22-228A ("#StopRansomware: Holiday and Weekend Ransomware") and follow-on advisories, FBI IC3 seasonal notices on BEC and ransomware timing, and MS-ISAC K-12 break-posture guidance. Cross-references `incident-triage-checklist`, `tabletop-exercise-design`, `backup-restore-drill`, `identity-provider-hardening`, and `ransomware-readiness`.
