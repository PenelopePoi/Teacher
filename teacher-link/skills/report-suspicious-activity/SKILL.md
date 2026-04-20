---
name: report-suspicious-activity
description: Decide when something on a school device or account is worth escalating, and report it through the right channel without making the situation worse
domain: education
intent: teach
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Apply
argumentHint: what you saw and on which device or account
---

# report-suspicious-activity — Tell the right person, the right way

The cost of a false alarm to IT is small. The cost of a real attack that nobody told them about is large. This skill teaches learners and staff how to report — and what *not* to do while waiting.

## When to use

- A login alert arrives for an account or place you don't recognise
- A file appears or disappears on a shared drive without explanation
- A device starts behaving oddly (fans loud at idle, browser tabs you didn't open, password no longer works)
- You realise after the fact that you clicked a phishing link

## When NOT to use

- The behaviour has a known cause you can verify (you remember installing that app; the new login was you on holiday)
- The situation is actively dangerous (e.g., a threatening message) — that goes to school safeguarding / law enforcement, not IT triage

## Workflow

1. **Stop touching the device.** Don't try to "fix" or "test" — you can destroy evidence or alert an attacker.
2. **Disconnect from the network** if you suspect malware (Wi-Fi off, Ethernet unplugged). Leave the device powered on.
3. **Note what you saw and when.** A short timeline (timestamp + sentence) is more useful than a long story.
4. **Report through a known channel.** The school's IT email, ticket system, or a teacher in person. Do not reply to a suspicious message asking "is this real?" — that just confirms the address is live.
5. **Wait for instructions.** Don't broadcast the incident to the class chat; that can amplify or alert.

## Example

A student notices their school email shows a "successful login from Romania" while they were in class. They:
- Lock the laptop and stop typing.
- Open a separate device, change the email password.
- Walk to IT and explain, with screenshots taken on the second device.
- Don't post about it on social media.

## Error handling

If IT cannot be reached and you believe an attack is in progress: disconnect the device, change passwords from a different device, and escalate to a teacher. Speed beats perfection — a partial report now is more useful than a complete report tomorrow.
