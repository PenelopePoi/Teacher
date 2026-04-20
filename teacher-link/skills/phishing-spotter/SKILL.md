---
name: phishing-spotter
description: Read sender, URL, and grammar tells in inbound mail to decide whether a message is a phishing attempt before clicking
domain: education
intent: teach
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Apply
argumentHint: paste the suspicious email subject + sender + first sentence
---

# phishing-spotter — Read the message before you click it

Phishing works because attackers borrow trust — a logo, a familiar name, a verb that creates urgency. The defense is a slow read of three places: who sent it, where the links go, and how the words are arranged.

## When to use

- An inbound email asks you to log in, reset a password, or open an attachment
- A message claims to be from a teacher, IT, the principal, or a service like Google or Microsoft, but something feels off
- You want to teach a learner to do this themselves before they get to the click

## When NOT to use

- The sender, the topic, and the next step were all expected — there is nothing to triage
- You already know the message is malicious — report and delete; don't keep "studying" it

## Workflow

1. **Sender.** Read the full address, not the display name. `support@m1crosoft-helpdesk.co` is not Microsoft. Check the domain right of the `@`.
2. **Links.** Hover (don't click). Compare the visible text to the actual URL. Watch for lookalike domains (`paypa1.com`, `g00gle-login.net`) and for redirectors that hide the destination.
3. **Tone.** Phishing pushes urgency ("within 24 hours"), fear ("account suspended"), or authority ("from the principal"). Calm, expected requests are usually fine; commands that bypass normal channels are usually not.
4. **Grammar and formatting.** Off-by-one capitalisation, awkward phrasing, slightly wrong logo crops, mismatched fonts.
5. **Decide.** If two or more of {sender, link, tone, grammar} look wrong → don't click; report it.

## Example

> Subject: "Your password expires today — re-verify here"
> From: "IT Helpdesk <it-helpdesk@school-portal-secure.tk>"

Sender domain `.tk` is not your school's domain. The link points to a typosquat. Tone weaponises urgency. Three flags → report and delete.

## Error handling

If you already clicked the link but did not enter credentials: close the tab, run a malware scan, change your password from a known-good device. If you entered credentials: change the password from a different device, enable MFA if you haven't, then tell IT — speed matters more than embarrassment.
