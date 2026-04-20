---
name: backup-restore-drill
description: Run a quarterly backup-restore drill that proves the backups actually work — because backups you have not restored from are not backups
domain: security
intent: audit
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Evaluate
argumentHint: the system being drilled (SIS, financial, file share) and the target RTO
---

# backup-restore-drill — Do the restore, or you don't have a backup

Every school has backups. Few have practiced restoring from them. A ransomware incident is the wrong time to find out that the backup is corrupted, the immutable copy was never actually immutable, or the restore takes three days when leadership budgeted four hours.

## When to use

- Quarterly, on a schedule — not triggered by an incident
- After a backup-system upgrade or a change of backup provider
- Onboarding a new critical system; confirm its restore works before it holds real data
- `ransomware-readiness` flagged an untested restore path

## When NOT to use

- During an actual incident — this is for peacetime drills; real incidents follow `incident-triage-checklist`
- For systems that are trivially recreated from source (static websites, ephemeral build servers)

## The one-sentence standard

For each critical system, you know the date you last restored it successfully from cold backup, and that date is less than ninety days ago.

## Workflow

1. **Pick one system.** Rotate through the critical systems list (student information, finance, HR, file shares, identity, email archive) so each gets drilled at least once a year.
2. **Set a target RTO.** How long is leadership expecting the restore to take in a real incident? The drill measures against that number.
3. **Drill on a clean environment,** not production. A separate VM, VPC, or test tenant. The point is to prove the restore path, not to impact live service.
4. **Start from the cold backup,** not the hot replica. Hot replicas survive an accidental deletion; they do not survive ransomware that encrypts them in place.
5. **Time every step.** Authentication to the backup system; initiating the restore; data transfer; post-restore validation. Most of the surprise is in the validation.
6. **Validate with a checklist.** Random sample of records, known-good row counts, a simple functional test (can the app open a restored record?), crypto integrity check where applicable.
7. **Record the findings.** Runtime vs. RTO, any steps that didn't go to plan, the exact backup image ID used. Attach the run to the system's change log.
8. **Close the gap.** If the restore took longer than RTO, or a step failed, or the validation turned up discrepancies — that is the finding. Fix it in the next sprint; don't accept a permanent gap.
9. **Verify the immutable copy is actually immutable.** A quarterly spot-check: attempt (in a safe environment) to modify or delete the most recent immutable backup. Object-lock and WORM should make this fail.

## Example

A district drills its student information system restore:
- Target RTO: 8 hours.
- Drill starts in a test tenant; restore from last night's cold backup.
- Restore completes in 4 hours 10 minutes. Validation takes another 45 minutes — the row count for attendance is off by one day because the backup runs before the nightly attendance close. This is a *backup timing* finding, not a restore finding; it gets fixed by moving the backup job to post-close.
- Documented; the SIS is back on the four-system rotation with a fresh restore date.
- Immutable-copy spot check: an attempt to delete the most recent snapshot via the storage API fails with an object-lock error. Working as intended.

## Error handling

If the drill fails — restore errors, corruption, validation mismatch, or runtime wildly past RTO: the drill succeeded. It found the problem. Open a ticket with the urgency leadership would assign during a real incident, fix the underlying cause, and re-drill before the quarter closes. Do not mark the drill "complete" with an open finding; that turns the next real incident into the drill.

## Provenance

Aligned with CISA's ransomware-readiness guidance on testing backups and the published 3-2-1-1 backup standard (three copies, two media types, one off-site, one immutable). Cited as public guidance, not as endorsement of any specific backup product.
