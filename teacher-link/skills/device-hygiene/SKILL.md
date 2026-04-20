---
name: device-hygiene
description: Keep the OS patched, lock the screen, encrypt the disk, and prune unknown software so a single device never becomes the weakest link
domain: education
intent: teach
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Apply
argumentHint: device or OS to harden (laptop, phone, Chromebook)
---

# device-hygiene — Boring controls do most of the work

Most successful school-device compromises walk in through the simple side: an unpatched OS, an unlocked screen, an unencrypted drive, or a forgotten browser extension. None of these need a security team to fix.

## When to use

- Onboarding a new student or staff device
- A learner is moving from a managed school device to a personal device for coursework
- Periodic checks (start of term, after a long break) — these are cheap to repeat

## When NOT to use

- The device is already known-compromised — go to `incident-triage-checklist`; do not "clean" by tinkering
- The device is part of a managed fleet under MDM — defer to IT's policy; don't manually override

## The four habits

1. **Updates on, automatic.** OS, browser, and major apps. The default is "delay" — flip it to "install".
2. **Screen lock short.** One to five minutes. Require a password / PIN / biometric to wake. The screen-lock is the one control that survives the device being left in a coffee shop.
3. **Disk encryption on.** BitLocker (Windows), FileVault (macOS), built-in (modern iOS/Android, ChromeOS). Without it, a stolen laptop is a stolen filesystem.
4. **Prune software.** Uninstall apps you don't recognise. Remove browser extensions you didn't deliberately install. Each one is a foothold.

## Workflow

1. Open the OS settings and verify each of the four habits is on. Fix the first one that isn't.
2. List the installed browser extensions; remove any you cannot justify.
3. Enable automatic backups (built-in: Windows Backup, Time Machine, Google Drive sync). Backups are the safety net for `ransomware-basics`.
4. Set the device to require a password on wake from sleep — not just on cold boot.

## Example

A teacher gets a new laptop:
- Windows Update → set to install during off-hours.
- BitLocker turned on; recovery key saved to their Microsoft account *and* exported to a safe location.
- Screen-lock at 2 minutes; PIN required.
- Browser extensions: only the one password manager they actually use.

## Error handling

If a device is lost or stolen: trigger remote-wipe through the school's MDM (or the OS's Find-My equivalent), change passwords for accounts that were signed in, and tell IT. If disk encryption was on, the data is generally safe; if it wasn't, treat as a data-breach event.
