---
name: ransomware-basics
description: What ransomware is, why backups are the only honest defence, and what a learner should and should not do in the first hour of an attack
domain: education
intent: teach
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Understand
argumentHint: the affected device or service
---

# ransomware-basics — What it is and what to do

Ransomware encrypts your files (and often steals a copy first), then demands payment to release them. Schools are a favourite target because downtime hurts so much that paying feels rational. Recovery without payment is a function of preparation, not luck.

## When to use

- Teaching learners or staff what ransomware actually is, before they meet one
- A device shows the classic signs: unfamiliar file extensions, a `README_DECRYPT.txt`, fans loud from CPU/disk pressure, files becoming unreadable in real time
- You want to ground a discussion of "why we have backups" with concrete attacker behaviour

## When NOT to use

- You are an IT responder mid-incident — go to `incident-triage-checklist` and `ransomware-readiness`
- The user just wants to know if a single suspicious file is malware — `safe-browsing` and `phishing-spotter` are closer

## The honest sentence

Backups are the only thing that breaks an attacker's leverage. Anti-virus reduces the chance you get hit; backups decide what happens when you do.

## Workflow (for learners caught in one)

1. **Disconnect.** Pull Wi-Fi / unplug Ethernet. Don't shut down — that can lose evidence and break some recovery options.
2. **Don't pay yet, don't decide alone.** Tell IT or a teacher right away.
3. **Don't try to "clean" the device** by deleting the ransom note or running random tools — you can destroy artefacts that help recovery.
4. **Write down what you remember**: what you clicked or opened, when files started going wrong, any error messages.
5. **Wait for instructions.** From here, IT and any incident response partner take over.

## Example

A student opens a `.zip` from an unexpected email; minutes later their thesis folder is full of files ending in `.lockbit`. They unplug the laptop's Ethernet, walk it (powered on, locked) to the IT office, and explain. The school restores the affected drive from last night's backup; nothing was paid.

## Error handling

If files genuinely cannot be recovered and there is no backup: *still* don't pay without legal and law-enforcement guidance. Paying funds the next attack, often produces a broken decryptor, and signals you as a willing target.
