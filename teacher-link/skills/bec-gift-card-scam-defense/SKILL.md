---
name: bec-gift-card-scam-defense
description: Defend against the single most common non-ransomware loss pattern in K-12 — Business Email Compromise where an attacker impersonates the superintendent, principal, or bursar and asks a staff member for urgent gift cards or a wire transfer
domain: security
intent: guard
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Apply
argumentHint: the specific impersonation scenario or a received message
---

# bec-gift-card-scam-defense — Authority + urgency = fraud attempt

The pattern: an email from what looks like the superintendent (or principal, or bursar, or vendor contact) arrives with a short, urgent ask. Buy gift cards for a staff appreciation event. Wire a small invoice. Change the vendor's bank details. The visible name is real; the reply-to address is not. Every K-12 district deals with this, and most lose money to it at least once.

## When to use

- Staff report receiving "weird" emails claiming to be from leadership
- A financial loss occurred via gift cards, wire, or payee-change and you're building the defence programme in the aftermath
- Annual training refresh; this is the concrete pattern to centre on for most K-12 audiences

## When NOT to use

- An account is actively compromised (not just spoofed) — go to `incident-triage-checklist`
- Student-side scams (fake Discord gifts, phishing for game accounts) — that's `phishing-spotter` and `social-engineering-101`

## The three moves attackers use

1. **Display-name spoof.** The From name reads "Jane Principal"; the actual address is `janeprincipal8472@gmail.com` or a lookalike domain. Email clients hide the address by default on mobile.
2. **Urgency + channel shift.** "I'm in a meeting, can't call, please reply to this email only." This is designed to stop the one thing that would expose the scam — picking up the phone.
3. **Small, plausible ask.** $200 in gift cards for "staff appreciation." $4,200 invoice. A bank-details change. Each is small enough not to trigger approval workflow and large enough to matter.

## The four controls that stop it

1. **Email authentication at the domain.** SPF, DKIM, DMARC with `p=reject` on the school's sending domain and on any lookalike the school also owns. See `email-authentication-for-schools` for the config.
2. **External-sender banner.** Mail from outside the school domain gets a visual tag. Makes the display-name spoof visible at a glance.
3. **Out-of-band confirmation rule, written.** Any request from leadership that (a) involves money or data and (b) arrived only by email requires a phone call or in-person confirmation before action. The rule is the defence, not the judgement.
4. **Dual approval on payee changes and wires over a threshold.** Every vendor-bank-details change requires a callback to a known-good number from the vendor file, not the number in the email. Every wire above a threshold requires two signatures.

## Workflow (when a message lands)

1. **Look at the actual address,** not the display name. If it's not `@yourschool.edu`, that's a flag.
2. **Check the tone.** Urgency + unusual channel + financial ask = BEC until proven otherwise.
3. **Verify out-of-band.** Walk over. Phone the known number. Slack / Teams to their known handle. Do not reply to the suspect message.
4. **Report, even if benign.** The reporting inbox sees patterns you won't as an individual.
5. **If money already moved:** call the bank immediately (most banks can recall same-day wires within a window); call the FBI / IC3 in the US; call the cyber-insurance carrier; then internal IR.

## Example

A bursar receives an email "from" the superintendent: *"Quick favour — buy five $200 Apple gift cards for the retiring teachers' event tonight, scratch the codes and reply with photos, I'll reimburse you Monday. Stuck in meetings, email only please."* Reply-to is `superintendent.j@outlook.com` (not the `.edu`). The bursar has a written out-of-band rule, walks to the front office, confirms the superintendent is in a meeting but has sent no such request, reports the message. No money lost.

## Error handling

If a staff member already bought and sent the gift-card codes: tell them it is the attackers who did this, not them, and mean it — shaming staff drives the next incident underground. Contact the gift-card issuer's fraud line within minutes (codes are sometimes recoverable if unspent), file with IC3, preserve the email headers, and loop in cyber-insurance. Most insurers cover a portion of BEC losses; not reporting voids coverage.
