---
name: workspace-365-backup
description: Back up Google Workspace or Microsoft 365 properly — because native retention is not backup, and "the vendor has it" is not a recovery strategy when a teacher ransomwares a shared drive or a departing staffer wipes their mailbox
domain: security
intent: guard
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Evaluate
argumentHint: the SaaS suite in use (Google Workspace, Microsoft 365, or both) and the retention requirements
---

# workspace-365-backup — Shared responsibility, not vendor responsibility

Both Google and Microsoft publish shared-responsibility models that make the same point: the vendor keeps the platform running; **the customer is responsible for the data**. Retention policies, recycle bins, and "Vault" / "eDiscovery" products are not backup. They expire on a schedule, they can be purged by admins, they can be overwritten by mass changes made through the UI, and they do not cover accidental mailbox deletion after the retention window, teacher-caused Drive corruption propagated by sync, or ransomware that touches cloud-synced folders.

This skill is how a school sets up a real SaaS backup that is independent, immutable, and testable — without making a procurement choice that drifts into the next vendor-lock-in.

## When to use

- Annual infrastructure review, or onboarding of Google Workspace / Microsoft 365 as the primary productivity suite.
- After a data-loss incident that native retention could not recover.
- Renewal of an existing SaaS backup contract — product maturity has moved a lot since 2022.
- Planning the `backup-restore-drill` for the SaaS tier (it is usually the missing tier).

## When NOT to use

- On-premise or hybrid file-server backup — different architecture, different products; go to `ransomware-readiness` first for the 3-2-1-1 framing.
- Active ransomware — `incident-triage-checklist`.

## What native retention covers (and what it does not)

**Google Workspace native:**
- Drive trash: 30 days.
- Gmail trash: 30 days.
- Admin "restore user data" window: 25 days after deletion (Drive and Gmail only).
- Vault (if licensed): retention and hold per policy, but Vault is **eDiscovery for legal, not backup** — no granular fast restore, no multi-version, no cloud-to-offsite isolation.

**Microsoft 365 native:**
- Recycle bin (first / second stage): up to 93 days.
- Deleted mailbox retention: 30 days (configurable up to 180 days with litigation hold).
- Retention policies: what they say; but an admin can purge.
- Purview / eDiscovery: legal-hold-style retention; not backup.

Gaps native does not cover: anything lost to ransomware that syncs into Drive / OneDrive, mass accidental changes kept past trash expiry, departing admins who wipe before offboarding, long-tail restore requests months after deletion, and multi-version recovery across thousands of files.

## Selection criteria for a SaaS backup product

Do not pick on price alone. The category has matured; the product should clear all of these:

1. **Independent storage.** Backup data sits in storage the vendor controls, not in your same Workspace / 365 tenant. Ideally a different cloud provider region from your production suite.
2. **Immutability / air-gap.** Backups are write-once / object-locked. A compromised admin account cannot delete or re-encrypt the backups.
3. **Multiple recovery points.** Daily snapshots retained for 30-90 days minimum; longer per policy. Point-in-time restore, not just "latest."
4. **Granular restore.** Single email, single Drive file version, single Calendar event. Full mailbox / full Drive also works, but granular is what you use most often.
5. **Scope coverage.** Mail, Drive / OneDrive, Calendar, Contacts, Chat / Teams messages, Sites / SharePoint, shared drives. Check the matrix — vendors quietly omit one or two.
6. **Restore speed and SLAs.** Documented restore time for a 100 GB mailbox, a full Drive, and a full tenant. "Best effort" is not a number.
7. **Role-based access.** Multiple IT admins with MFA; no single admin can delete the backup set. Audit log on backup admin actions.
8. **Exit path.** A standard-format export of your backups that you can take elsewhere. Proprietary blobs with no export are a trap.
9. **DPA that matches `vendor-dpa-review`.** Student data goes into this product; it is a processor relationship with everything that implies.
10. **Pricing model.** Per-user per-month, not by storage — schools do not benefit from "per GB" where graduating classes bloat costs.

Vendor categories that ship this shape (not endorsements, mention only to disambiguate the product class): Afi, Spanning, Datto SaaS Protection, Keepit, Veeam Backup for M365, Druva, Backupify. Validate each against the ten points above at the time of purchase; posture changes.

## Workflow

1. **Baseline native retention.** What your suite does today, per workload, in writing.
2. **Identify the gap**: the data classes and scenarios native cannot recover from. This is the requirements document for procurement.
3. **Short-list products** against the ten criteria. Reference-call a similarly-sized district (5,000-user school-specific references exist in this category).
4. **Run a 30-day pilot** on a subset of staff. Measure backup completion, restore time, granular-restore correctness, and admin usability.
5. **Sign with a `vendor-dpa-review`-compliant DPA.** No "improve the service" training clause. Named subprocessors. 72-hour breach notification.
6. **Onboard in waves.** Staff first (highest-value data), then service accounts, then shared drives / SharePoint, then student accounts (scope per retention policy; not every district backs up student mailboxes long-term).
7. **Set retention policy explicitly.** Point-in-time recovery window, long-term retention window, legal-hold workflow. Document it in the Internet-safety policy if relevant.
8. **Run the `backup-restore-drill`.** SaaS restore is a distinct drill from on-prem. Do this quarterly with real scenarios: "a teacher ransomware'd Shared Drive X three days ago, restore it"; "a departing admin deleted their mailbox, restore to last Thursday."
9. **Audit** quarterly that every mailbox / drive is being backed up, that immutability is on, and that no admin-role change has weakened the product's security.

## Example

A district on Google Workspace for Education (5,200 accounts) adds SaaS backup after a ransomware affiliate targets staff laptops and the infection hits Google Drive Stream before detection. Native retention gets them the last 30 days of Drive trash — but the attacker deleted the trash via a web session after stealing the superintendent's password. The district re-builds from stale exported snapshots and loses 9 weeks of curriculum planning.

Post-incident:
- Selects a SaaS backup product on the ten-point criteria; immutable object-lock in a different cloud region.
- Enables daily snapshots, 90-day point-in-time, 7-year long-term retention for staff accounts.
- Restricts backup-delete to 2 IT admins with MFA; change-control approvals on retention changes.
- Runs a quarterly drill: first drill finds that Shared Drives were not included in the default scope. Fixed. Second drill passes end-to-end.
- Six months later, a teacher's account is compromised and used to mass-delete Drive files. Restore from the previous night's point-in-time; forty minutes to full recovery; no data loss.

## Error handling

If the SaaS backup's restore is slow and the drill reveals unusable RTO: this is a finding, not a footnote. Raise it to leadership, renegotiate SLA, switch products at renewal if the vendor cannot meet it. RTO on a SaaS restore that blocks a school day's instruction is an operational risk — treat it like one.

If the backup admin accounts lack MFA: fix today. Backup admin is a tier of privilege equal to or greater than global admin — it holds a parallel copy of every mailbox in the district.

If the vendor cannot produce a SOC 2 Type II and a clear DPA: not production-ready. This is student data.

## Provenance

Aligned with the Microsoft 365 shared-responsibility model (Microsoft published "Shared responsibility in the cloud" guidance), Google Workspace's shared-responsibility documentation, and standard third-party SaaS-backup vendor category practice. Cross-references `backup-restore-drill` and `ransomware-readiness`. **Product mentions are disambiguation of the category, not endorsements.**
