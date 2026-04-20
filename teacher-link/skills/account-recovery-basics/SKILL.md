---
name: account-recovery-basics
description: Set up real account recovery before you need it (codes, trusted contacts, backup methods), and recognise "support will reset it for you" as a scam vector — because the moment you're locked out is the worst time to learn this
domain: education
intent: teach
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Apply
argumentHint: the account type (school Google, personal email, gaming) and what recovery is set up now
---

# account-recovery-basics — Set it up before you need it

Losing access to an account when your phone dies, or when someone locks you out, is a bad afternoon. Losing access because you fell for a "support" message that asked for your recovery code is a worse one — the person on the other end now owns the account. This skill is about setting up recovery now, and spotting the scam when it arrives.

## When to use

- Today, while your account still works — set recovery up before the emergency.
- You just got a new phone and need to move your recovery options with you.
- You got a message from "support" saying they will help you reset something — stop and read this first.

## When NOT to use

- You are mid-incident and already locked out — go to your school IT's account-recovery process (if it is a school account) or the platform's official recovery flow. Come back here once you are back in.

## The three real recovery paths

Different accounts offer different paths. Most have at least two. Set up both.

1. **Recovery codes.** A list of one-time codes the platform gives you when you enable MFA. Print them or write them down. Keep them somewhere you can find but no one else can — not in your email, not in a note titled "codes," not taped to your laptop. A sealed envelope in a drawer is fine. A password manager's "secure note" is better.
2. **Backup authenticator method.** A second way to get a code: a second authenticator app on a tablet, a security key, or a second phone number. If your only MFA is SMS to a phone that can break or get stolen, you have one point of failure.
3. **Trusted contacts / recovery contacts.** Some platforms (Apple, Facebook, some Google flows) let you pre-designate people who can help you recover. Pick 2-3 adults who are reachable and who you trust. They can confirm it's you through a pre-agreed process.

## What "support" will never ask for

This is the scam section. Read it twice.

- **No legitimate support will ask for your recovery codes.** Ever. A recovery code is like a key. Support has their own way to help you; they don't need yours.
- **No legitimate support will ask for your MFA code over a call or a chat.** The code is for you to use to log in. If anyone asks you to read it out, that is the attack — they are in the login flow pretending to be you and need your code to finish.
- **No legitimate support will ask you to "verify" by sending them a password reset link that was just emailed to you.** The link is for your browser, not theirs.
- **No legitimate support will pressure you urgently.** "Do this in the next five minutes or your account is permanently deleted" is how scams sound. Real support gives you time.

If any of the above happens: stop, don't reply, and go to the platform's official help page directly (type the URL yourself, don't click a link). If it's a school account, tell your school IT.

## Workflow

1. **List your important accounts.** School Google Workspace / Microsoft 365, personal email, any gaming / social accounts tied to real identity, and — for older students — financial apps.
2. **For each, enable MFA** (use `password-hygiene` if you have not yet).
3. **Generate and save recovery codes.** Once per account. Put them somewhere you can retrieve but no one else can.
4. **Add a backup authenticator.** Second app, security key, or second number. Don't rely on only one channel.
5. **Add trusted recovery contacts** where the platform supports it. Tell those people they are on the list and what you would do if you got locked out.
6. **Practice the recovery flow once.** Sign out, walk through "I can't access my phone." If you discover the flow is broken or unclear, fix it now, not later.
7. **When a "support" message arrives**, match it against the "never asks" list. If it asks any of those things, it is a scam. No exceptions.

## Example

Priya (11th grade) prepares for a summer trip. She:
- Prints her Google recovery codes and puts them in her parents' home safe.
- Adds a second phone number (her mum's) as a backup to her school Google account.
- Adds her aunt as a trusted recovery contact on her Apple ID.
- Saves her password manager's emergency access details in the same safe.
- Mid-trip, her phone is stolen. She uses her mum's laptop, signs into Google with a recovery code, changes her password, re-enables MFA on a borrowed device, and locks the lost phone via iCloud using her aunt's help for the verification step. She is back in within an hour.

## Error handling

If you already lost access and have no recovery set up: contact the platform through its official recovery URL (type it yourself). Expect a days-to-weeks process with identity verification. This is the lesson for the next account.

If you shared a code and realise it was a scam: sign into the account from a device that is signed in already, change the password, remove any unknown sessions ("sign out all devices"), re-enable MFA from scratch, regenerate recovery codes, and check that no recovery method was changed. Tell a trusted adult or your school IT; if money or identity theft is involved, file with the FTC (IdentityTheft.gov) in the US.

## Provenance

Aligned with NIST SP 800-63B §5.1.1.2 (backup authenticators and recovery), Google / Microsoft / Apple recovery documentation, and CISA's public guidance on social-engineering of MFA codes. **This skill is student-facing teaching; for school accounts, your school IT's specific recovery process supersedes generic advice.**
