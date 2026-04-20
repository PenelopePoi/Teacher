---
name: staff-offboarding-and-contractor-hygiene
description: Deprovision a departing staff member or contractor in hours, not days — access revoked on the IdP, mailbox and files held, shared credentials rotated, devices retrieved, audit trail intact
domain: security
intent: guard
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Evaluate
argumentHint: the departure type (resignation, non-renewal, termination, contract-end), role, and the systems the person had access to
---

# staff-offboarding-and-contractor-hygiene — The runbook on the day someone leaves

Most data-exfiltration-by-insider stories in the sector share one line in the write-up: "the account remained active for 11 days after termination." Offboarding is not paperwork; it is a time-bound security runbook. This skill presumes `identity-provider-hardening` is in place (the IdP is the lever); this skill owns the execution under clock.

## When to use

- A staff member, substitute, or contractor is leaving (resignation, retirement, end of term, non-renewal, termination).
- A vendor contract is ending and the vendor's personnel had named accounts in the tenant.
- A student worker / intern is offboarding with elevated privileges (rare, but real).
- Annual review — inactive accounts from prior departures still present = audit finding.

## When NOT to use

- IdP posture design — go to `identity-provider-hardening`.
- Vendor relationship / contract exit — cross with `vendor-offboarding-and-data-return`.
- Student account graduation — different policy; alumni retention has its own rules.

## The four-quadrant offboarding model

Not every departure is the same. Risk = access × motivation × notice.

| Departure type | Time to revoke | Mailbox hold | Device retrieval |
|---|---|---|---|
| Amicable resignation, notice given | End of last day | Optional, per retention policy | Scheduled pickup |
| Non-renewal, notice given | End of last day | Yes, per retention policy | Scheduled pickup |
| Termination for cause | Immediate, before notification of employee | Yes, legal hold possible | Simultaneous with notification |
| Contractor contract-end | End of contract hour | Per contract clause | Per contract clause |

For terminations for cause, IT revokes access in the same minute the employee is notified, not before (to avoid tipping them off) and not after (to avoid a final access window). This requires a signal channel between HR and IT that works in 60 seconds.

## The offboarding checklist

Run every step, every time. Tick on a checklist stored in the offboarding case file.

1. **Trigger received from HR** (ticket with employee ID, departure type, effective time).
2. **IdP**: disable the user (not delete — deletion loses audit). Revoke all sessions. Remove MFA methods (they are now attacker tools if stolen). Remove from all groups.
3. **MFA / authenticator**: de-register the user's authenticator app and security keys.
4. **Mailbox**: place on litigation hold if termination-for-cause or if retention policy requires. Convert to shared mailbox for continuity if the role needed mail forwarding. Autoreply set with a named human successor.
5. **Files / Drive / OneDrive**: transfer ownership of anything the individual owned that the team needs. Place a retention policy on the account per schedule. Do not delete immediately — re-creating a deleted user's Drive is painful.
6. **SaaS app review**: every third-party SaaS the user had SSO to — deprovision. If SSO-only, disabling in the IdP is enough for most; some apps maintain local state and need explicit user-deletion.
7. **Shared credentials**: every credential known to the departing user that is shared with others (service accounts, wifi PSKs, vendor portals) — rotate. Today. This is the step most often skipped.
8. **Physical access**: badge deactivated, keys returned, alarm codes changed if they knew them, cameras / door-lock panels audited for known codes.
9. **Devices**: retrieve laptop, phone, tablet, keys, fobs. Wipe on return; do not re-issue before wipe verification.
10. **Admin roles**: if the user held admin roles, rotate any shared secrets and regenerate API keys that they provisioned.
11. **Audit the 30 days prior**: run a report of unusual data access, bulk downloads, mass-forwarding-rule creation, and OAuth-grant additions. Investigate anomalies.
12. **Notify affected vendors** who hold named-user lists (LMS, SIS, finance-system admin-contact lists).
13. **Close the case file**: checklist, screenshots, timestamps, signed-off. This is the artefact for audit and for any later dispute.

## The first-30-minutes minimum

If you cannot run the full checklist in a single window — terminations happen at 4:55 pm on a Friday — the first 30 minutes must cover: IdP disable, revoke sessions, place mailbox on hold, rotate shared credentials the person knew. The rest can extend into the next business day with the person locked out.

## Workflow

1. **Build the runbook** aligned with this checklist, your IdP, and your SaaS stack.
2. **Build the HR→IT trigger channel** that works in 60 seconds for termination-for-cause.
3. **Inventory shared credentials** annually and document which named staff know each. Offboarding trigger checks this list.
4. **Test the runbook** with a dry-run every six months. A fake departure through the full checklist, end-to-end.
5. **Log everything** in a case-file structure that survives staff turnover on IT — next year's IT admin needs to audit this year's offboarding.

## Example

A middle-school teacher with 9 years at the district is terminated for cause on a Tuesday at 2 pm. The HR→IT trigger fires at 2:01.

- 2:02: IdP (Google Workspace) suspends the account. All sessions revoked. MFA methods removed.
- 2:03: Gmail placed on litigation hold; Drive placed on a 90-day retention.
- 2:05: Shared Wi-Fi PSK for the staff lounge rotated; teacher was one of ~80 who knew it, but policy requires rotation after any termination.
- 2:08: Badge deactivated; key retrieval scheduled at the exit meeting at 3:00.
- 2:12: SIS third-party admin portal — teacher's account (separate from SSO) disabled.
- 2:30: Device retrieved at the exit meeting.
- Next morning: 30-day data-access review. Two anomalies flagged (a weekend Drive download of the gradebook template — legitimate; a bulk export of a class roster — within scope of role). Case file closed by end of day.

No access gap. No shared credential left intact. Audit trail for counsel.

## Error handling

If IT discovers a forgotten active account from a departure months ago: disable today, audit the intervening period for unusual access, note in the case file, and treat the discovery as a process finding. Fix the offboarding trigger so it cannot happen again.

If a former employee is found to have created OAuth grants to unknown apps during their tenure: revoke the grants, review for data movement, escalate to counsel if student data may have been involved.

If the IdP shows sessions persisting after a user is disabled: that is a product bug or a misconfiguration in token lifetime; raise with the IdP vendor, document, and either set short session lifetimes (see `identity-provider-hardening`) or accept that "disable" alone is insufficient and add session-revoke as a separate step.

## Provenance

Aligned with NIST SP 800-53 PS-4 (Personnel Termination) and PS-5 (Personnel Transfer), CIS Controls v8 Control 6 (Access Control Management), and MS-ISAC / CISA K-12 IT-operations guidance. Cross-references `identity-provider-hardening` (posture), `vendor-offboarding-and-data-return` (vendor equivalents), and `ferpa-data-breach-notification` when departure coincides with a suspected data incident.
