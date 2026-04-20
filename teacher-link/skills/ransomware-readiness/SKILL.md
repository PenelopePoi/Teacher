---
name: ransomware-readiness
description: Backup strategy, recovery drills, and IR retainer setup that decide whether a ransomware hit is a bad week or an existential event for a school
domain: security
intent: audit
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Evaluate
argumentHint: critical systems and current backup posture
---

# ransomware-readiness — The work you do before, not after

Ransomware response is a function of preparation. Schools that recover quickly all did the same boring things in advance: tested backups, an IR firm on retainer, a written playbook, and a leadership team that knew not to pay.

## When to use

- Annual review of ransomware posture
- After any near-miss or sector incident — use the moment to fix what was theoretical before
- During cyber-insurance renewal — the carrier will ask about most of these

## When NOT to use

- You are *currently being ransomed* — go to `incident-triage-checklist`; this skill is for prevention/preparation
- A leadership team is asking "what do we do right now if this happens?" — give them the playbook summary, then route them to the IR firm on retainer

## The 3-2-1-1 backup rule (modern variant)

- **3** copies of any critical data
- **2** different media types
- **1** copy off-site
- **1** copy *immutable* (object-lock or air-gapped) — this is the one ransomware operators target hardest

## Workflow

1. **Inventory critical systems.** Student records, finance, payroll, identity, learning-management. Whatever bringing this down for a week would close the school.
2. **Map each system to a backup posture.** For each: where, how often, last restored-from-zero successfully on what date.
3. **Test restores.** Backups you have not restored from are not backups. Schedule a quarterly drill where one system is actually restored from cold backup.
4. **IR retainer.** Have a contract in place *before* an incident. During an incident, vendors are slower and more expensive.
5. **Cyber-insurance.** Confirm coverage limits, the hotline number, and what the carrier requires you to do in the first hour (often: call them before notifying anyone else).
6. **Written playbook.** Three to five pages. Roles, contact list, decision tree on whether to pay (default: don't), comms templates.
7. **Tabletop annually.** A two-hour scenario exercise with leadership. The point isn't to win it — it's to find which questions nobody can answer and answer them now.

## Example

A district restores its student-information system from its immutable backup in 14 hours during a real incident, doesn't pay the ransom, and is back to business the next school day. The 14 hours feel terrible in the moment; without the immutable backup it would have been weeks.

## Error handling

If a tabletop reveals that the immutable backup is theoretical (it was set up but never tested) — that *is* the finding. Fix it that quarter, not next year. Untested backups are the most common reason "we're prepared" turns into "we paid."
