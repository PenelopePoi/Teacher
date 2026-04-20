---
name: mfa-rollout-for-schools
description: Roll out multi-factor authentication to staff and students without breaking classrooms — enrolment strategy, recovery-code discipline, and handling the "I left my phone at home" moment
domain: security
intent: guard
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Apply
argumentHint: the population to enrol (staff, students grade range, contractors) and the identity provider
---

# mfa-rollout-for-schools — Coverage beats elegance

MFA is the single control that most reliably stops credential-stuffing and phishing-harvested passwords from becoming account takeovers. The hard part in a school is not the technology; it is the rollout. A programme that enrols 100% of staff imperfectly beats one that enrols 40% beautifully.

## When to use

- Standing up MFA for the first time on a district's SSO (Google Workspace, Entra ID, Okta, ClassLink, Clever)
- Expanding coverage from staff to students, or from staff SSO to high-value downstream apps (SIS, financial aid, HR)
- Post-incident: a credential-abuse event forces a cadence change

## When NOT to use

- Mid-incident — go to `incident-triage-checklist`; rollout is prevention
- You already have mature MFA; use `identity-provider-hardening` for conditional-access polish

## The two decisions that actually matter

1. **Which factor types.** Authenticator app and hardware key are strong; SMS is weak but still better than no MFA. For staff: authenticator app minimum, hardware key for privileged accounts. For students: authenticator app where devices support it, passkey where available, SMS as a fallback only.
2. **Who holds the recovery story.** Recovery codes, backup factors, and IT-assisted reset pathways will *all* get used in week one. Decide in advance who can reset what, with what verification, and log every reset.

## Workflow

1. **Cohort the population.** Privileged accounts (IT, finance, HR, principal) → staff → students → contractors. Enrol in that order.
2. **Pre-stage the reset pathway.** Document the exact verification a helpdesk must perform before resetting MFA. Without this, the rollout creates a social-engineering vector in its own right.
3. **Pilot with the most-technical cohort first.** IT and admin staff absorb the rough edges; the classroom cohort benefits from the fixes.
4. **Enrol with a grace window.** Seven to fourteen days between "available" and "required." Communicate both dates; enforce the second one.
5. **Recovery-code discipline.** Every enrolled user generates and stores codes somewhere other than the same phone. The school's password manager is a good default.
6. **Handle the classroom edge case.** A student without their phone should have a sanctioned path (hardware-key cart, teacher-assisted reset, kiosk-mode fallback) that doesn't collapse into "teacher shares their password."
7. **Measure and report.** MFA enrolment percentage by cohort, monthly. Report to leadership. Non-enrolled accounts after the deadline get disabled, not exempted.
8. **Phish-test after rollout.** `phishing-defense-program` sims should now include MFA-prompt-bombing; the point of MFA is to survive phishing, and training should cover the approve/deny decision.

## Example

A district rolls MFA to 2,000 staff and 12,000 students:
- Week 1–2: IT and principals enrol with hardware keys. Two reset-protocol bugs found and fixed.
- Week 3–6: staff enrol on authenticator app; recovery codes stored in the school password manager.
- Week 7–10: students in grades 9–12 enrol on authenticator app; grades 6–8 on passkey-capable Chromebooks; grades K–5 exempted from direct MFA but their parent accounts require it.
- Week 12: non-enrolled staff accounts disabled until enrolled. Helpdesk sees a temporary spike; back to normal in two weeks.
- Month 4: a phish-sim includes an MFA-prompt-bombing scenario. Click rate low; deny-rate on the fake prompt high.

## Error handling

If a high-visibility staff member locks themselves out repeatedly: do not weaken their policy. Add a hardware key as second factor, add a documented helpdesk-assisted path with stronger verification, and move on. Carve-outs by seniority are how MFA stops working.

## Provenance

Aligned with CISA's Strong MFA guidance and the general body of published MFA-rollout-in-education case studies. Cited as public guidance, not as endorsement of any specific IdP product.
