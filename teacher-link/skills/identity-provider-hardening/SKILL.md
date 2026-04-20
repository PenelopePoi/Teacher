---
name: identity-provider-hardening
description: Harden the school's identity provider (Google Workspace, Entra ID, Okta, ClassLink) with conditional access, session limits, OAuth-grant hygiene, and admin-role scoping — so credential theft does not immediately become account takeover
domain: security
intent: guard
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Evaluate
argumentHint: the identity provider and the user population (staff, students, contractors)
---

# identity-provider-hardening — The identity tier is the new perimeter

Most school compromises in 2026 are not firewall failures; they are identity failures. An attacker with valid credentials and a bypassable MFA policy owns the tenant. Hardening the identity provider is the highest-leverage defensive move a school can make after `mfa-rollout-for-schools` is complete.

## When to use

- Post-MFA-rollout polish — MFA is the floor, this is the walls and roof
- After a credential-theft incident anywhere in the sector (e.g., the April 2026 Vercel / Context.ai chain was an identity-tier compromise at heart)
- Annual posture review; the IdP's capabilities evolve and defaults drift
- Migrating or consolidating identity providers

## When NOT to use

- MFA itself is not rolled out — start with `mfa-rollout-for-schools`; this skill presumes MFA is already a floor
- Mid-incident — go to `incident-triage-checklist`

## The seven hardening layers

1. **Conditional access / context-aware access.** Require managed-device + MFA for access to high-value apps (SIS, finance, HR). Block sign-in from countries with no legitimate use case. Raise friction on anonymous-IP networks (Tor, commercial VPNs used by attackers).
2. **Session limits.** Short session lifetimes on privileged accounts (hours, not weeks). Re-authentication on sensitive operations (admin-role elevation, OAuth-grant approval, password change). Revoke-on-demand capability tested.
3. **OAuth-grant hygiene.** Periodic review of OAuth grants. Block user-level grants to unverified apps by default; grants only via admin-approved allow-list. Revoke stale grants on a schedule. The Context.ai → Vercel chain ran through OAuth; this closes that door.
4. **Admin-role scoping and separation.** No permanent global admin for anyone. Just-in-time elevation via PIM / equivalent. Separate day-to-day accounts from admin accounts. Named admins, not shared accounts. Every admin action logged and reviewed.
5. **Break-glass accounts.** Two emergency accounts with no MFA (stored credentials in a sealed envelope or split across physical safes), monitored for any login attempt, used only in a declared emergency. The break-glass is the answer to "what if Okta is down and we can't log in to fix Okta?"
6. **Federation and directory hygiene.** Disable unused federation paths. Review connected apps quarterly. Disable legacy protocols (IMAP, POP3, basic auth) that bypass MFA. Enforce strong auth on every sign-in path.
7. **Logging and alerting.** IdP logs feed the SOC / monitoring pipeline. Alerts on: impossible travel, admin-role changes, OAuth grants to new apps, MFA method changes (especially to weaker methods), session-token theft indicators. Retain logs for the regulatory window at minimum.

## Workflow

1. **Baseline the current posture.** Export current conditional-access policies, OAuth-grant list, admin-role list, session lifetimes, federation configuration. This is what the hardening changes against.
2. **Pilot conditional access on IT and admin cohorts first.** Broken-by-new-policy is cheap to fix at 20 people; painful at 2,000.
3. **Roll out layer by layer.** Conditional access → session limits → OAuth-grant hygiene → admin-role scoping → break-glass → federation → logging. Each layer gets a pilot window and a "roll forward" date.
4. **Test the break-glass** before you need it. Annual verification that the sealed credentials work, that the monitoring fires, and that the right people know the procedure.
5. **Schedule the reviews.** Quarterly admin-role review (accounts should justify their role), quarterly OAuth-grant review (every grant re-approved or revoked), annual end-to-end posture review.
6. **Alert-tune early.** Impossible-travel alerts will fire for legitimate travel; session-token-theft indicators will false-positive on network changes. Spend the time tuning, or the alerts become ignored.
7. **Document.** The hardening configuration is a living artefact, owned by an IT-security-named individual, reviewed at the quarterly cadence.

## Example

A district hardens Google Workspace + ClassLink:
- Context-aware access: staff SIS access requires managed Chromebook + MFA; student access to the SIS student portal requires managed device during school hours.
- Session limits: privileged admin sessions at 4 hours; Google Cloud Platform sessions require re-auth on admin operations.
- OAuth-grant hygiene: third-party app access restricted to admin-approved; the initial cleanup revokes 340 stale grants and 12 grants to unrecognised vendors (one of which turns out to be a free AI tool installed in 2023 by a then-employee).
- Admin roles: global admin reduced from 9 named accounts to 3; PIM-equivalent for temporary elevation; day-to-day accounts separated from admin accounts.
- Break-glass: two accounts in sealed envelopes in two physical safes. Tested at standup and annually.
- Federation: legacy IMAP disabled; basic-auth-only SMTP retired in favour of OAuth-authenticated submission.
- Logging: IdP logs to the SOC; alerts on MFA-method-change, impossible-travel, admin-role-change.

Two quarters later, a credential-stuffing attack lands valid staff credentials. Conditional access blocks the sign-in (unmanaged device). No compromise.

## Error handling

If a conditional-access policy locks out a legitimate staff member on a trip: do not disable the policy. Use the IdP's "request access" or admin-override path (briefly, with MFA, logged, and with a follow-up review). A policy that breaks under legitimate pressure is a policy that will break under attacker pressure; fix the path, don't remove the policy.

## Provenance

Aligned with CISA's Identity and Access Management guidance, the Microsoft Identity Secure Score framework, Google Workspace security-best-practices guidance, and Okta's security-posture documentation. Cited as public vendor and standards-body guidance, not as endorsement of any specific IdP.
