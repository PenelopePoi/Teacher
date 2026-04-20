---
name: incident-triage-checklist
description: A first-30-minute response checklist for school IT staff after a suspected incident — preserve evidence, contain blast radius, brief the right people in the right order
domain: security
intent: guard
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Apply
argumentHint: brief description of the suspected incident
---

# incident-triage-checklist — First 30 minutes

Most damage in a school incident comes not from the initial intrusion but from the half-hour where nobody is in charge. This checklist gives the on-call IT staffer a script.

## When to use

- A user reports symptoms that fit one of: ransomware notes, unfamiliar processes, MFA prompts they didn't trigger, accounts they can no longer log in to, EDR alert that hasn't been triaged
- An EDR / SOC alert lands and you are the first responder

## When NOT to use

- The behaviour is benign on inspection — close it out, log it, move on
- The incident is already in the hands of an external IR firm — follow their direction; this skill is the bridge to that hand-off

## Workflow (run in order)

1. **Pick an incident commander.** One person owns this until handover. That's you, until someone more senior says otherwise.
2. **Time-box: 30 minutes for triage,** not investigation. Investigation comes after containment.
3. **Identify the affected accounts and devices.** Write a short list in a shared doc — usernames, hostnames, what was reported, when.
4. **Contain.**
   - Affected device: isolate via EDR (don't wipe; don't power off).
   - Affected account: force a password reset, revoke active sessions and OAuth tokens, disable if needed.
   - Affected service: take it offline if continuing to run risks data exfiltration.
5. **Preserve.** Don't reboot. Don't delete the ransom note or the suspicious file. EDR telemetry, memory, and disk artefacts are needed later.
6. **Communicate.**
   - **Immediately:** the principal / superintendent / IT director (one line, no speculation).
   - **Within the hour:** legal, the cyber-insurance carrier (they often *require* you to call them before doing more), the EDR / IR partner.
   - **Not yet:** parents, students, the press. That comes from leadership with legal and PR involved.
7. **Log everything you do.** Time + who + action. This becomes the post-incident timeline.

## Example

A teacher reports "I think I clicked something and now Word can't open my files":
- Commander: the on-call IT lead.
- Identify: teacher's username, laptop hostname.
- Contain: EDR-isolate the laptop; reset the teacher's password; revoke sessions.
- Preserve: laptop stays on, isolated.
- Communicate: principal informed; IR partner called; insurance hotline notified.
- Log: shared doc lists every step with timestamps.

## Error handling

If you don't have an EDR or an IR partner: still preserve, contain manually (unplug Ethernet, disable account in identity provider), and call the insurance carrier — they often have an IR firm on retainer for incidents like this. Don't try to investigate alone.
