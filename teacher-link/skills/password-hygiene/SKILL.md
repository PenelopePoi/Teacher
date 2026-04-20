---
name: password-hygiene
description: Choose strong passphrases, store them in a password manager, and turn on multi-factor authentication on every account that supports it
domain: education
intent: teach
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Apply
argumentHint: account or service to harden (e.g., "school email")
---

# password-hygiene — Strong, stored, and second-factored

Most account takeovers in schools come from reused passwords leaked in unrelated breaches. A learner who never reuses a password, stores them in a manager, and turns on MFA closes that whole class of attack.

## When to use

- Setting up a new account (school email, Google Workspace, Canvas, GitHub)
- A breach notification names a service the learner uses
- Teaching learners to take password choice seriously without making it scary

## When NOT to use

- The account is shared by design (a class kiosk login) — different rules apply; talk to IT about a service account model
- The user is in active incident response — go to `incident-triage-checklist` first

## Workflow

1. **Passphrase, not password.** Four random words is stronger and easier to remember than `P@ssw0rd!`. Length beats complexity.
2. **Manager.** Use a password manager (Bitwarden, 1Password, Apple Passwords, browser built-in). The manager generates the password; you only memorise the manager's master passphrase.
3. **No reuse.** One password per account. The manager makes this free.
4. **MFA on.** Prefer an authenticator app or a hardware key over SMS. Turn it on for email, school SSO, banking, and any account whose recovery email points back to your school address.
5. **Recovery codes.** Save the recovery codes the manager prompts you for. Without them, MFA can lock you out as effectively as it locks attackers out.

## Example

A student opens GitHub for the first time:
- Manager generates a 20-character password and stores it.
- Student turns on MFA via the Authenticator app.
- Student saves the 10 recovery codes into the manager's notes for the same entry.
- Student never types the GitHub password again — the manager autofills.

## Error handling

If the manager itself is compromised: change the master passphrase from a known-good device, then rotate the most sensitive accounts first (email, banking, school SSO). If MFA is failing because of a lost device: use a recovery code, then re-enrol a new device immediately.
