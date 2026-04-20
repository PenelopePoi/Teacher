---
name: secrets-rotation-after-vendor-breach
description: When a third-party platform (hosting, identity, AI tooling) discloses a breach, rotate the right secrets in the right order without panic — and close the structural gaps that made the blast radius large
domain: security
intent: guard
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Apply
argumentHint: the disclosing vendor and the systems your school connects to it
---

# secrets-rotation-after-vendor-breach — Rotate, scope, switch

A breach disclosed by a vendor your school relies on is not the moment to debate your roadmap. It is the moment to rotate secrets, reduce the scope of what's left, and switch to runtime-fetched credentials so the next breach has a smaller blast radius.

## When to use

- A platform the school depends on (hosting provider, identity provider, AI tooling, monitoring, deploy pipeline) discloses unauthorised access
- An employee at a vendor you transitively trust gets compromised (the supply-chain-via-customer pattern: e.g., the Vercel / Context.ai infostealer chain in April 2026)
- Cyber insurance or an IR partner asks "what's your secret-rotation posture?"

## When NOT to use

- An internal account compromise — that's `incident-triage-checklist`; this skill is the vendor-side companion
- Generic password change at the user level — that's `password-hygiene`

## The four moves

1. **Rotate.** Every secret stored in the affected vendor's dashboard / vault. API keys, OAuth client secrets, signing keys, database credentials, webhook signing secrets, deploy tokens. Do this before reading any further reports.
2. **Reduce scope.** Mark every environment variable as *sensitive* (not visible to users with read access to the project). Remove anything in the vendor that doesn't strictly need to be there. Audit who in your org has admin access to the vendor; trim it.
3. **Switch to runtime.** Where possible, stop storing long-lived credentials in the vendor at all. Pull them at runtime from a dedicated secrets manager (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault, 1Password Connect) via SDK. The vendor sees only an identity, not the secret.
4. **Make them short-lived.** Rotate on a schedule (database credentials, API keys) so a future leak has an expiry. Aim for hours-to-days, not months-to-years.

## Workflow

1. **Read the vendor's bulletin once, carefully.** Note: which systems were accessed, what data classes are at risk, what they recommend, what the deadline is.
2. **Audit logs first.** Pull the vendor's audit log for the affected window and identify which of *your* projects, accounts, and credentials were touched. Don't trust "we'll let you know" — go look.
3. **Rotate in dependency order.** Rotate the highest-leverage credentials first: identity-provider tokens, payment-processor keys, anything with admin scope. Then deploy / build credentials. Then read-only or low-scope keys.
4. **Reduce scope of what remains.** Mark env vars as sensitive. Move any that don't need to be in the vendor at all into a real secrets manager.
5. **Switch the high-value secrets to runtime fetch.** Update the relevant apps to pull from the secrets manager via SDK. The vendor stops being a credential store and becomes only an environment-pointer.
6. **Schedule rotation.** Database creds and API keys auto-rotate on a cadence (hours-to-days). Document the cadence; alert if it slips.
7. **Tell the people who need to know.** Internal: leadership, the affected service owners. External: only what your obligations require, in coordination with legal — don't pre-empt the vendor's own communications.
8. **Update the playbook.** What did this incident teach you about your dependency on this vendor? Capture it before the urgency fades.

## Example

A hosting provider discloses an incident in which an employee was compromised via an AI-tooling customer of theirs; the attacker enumerated environment variables marked "non-sensitive" across customer projects.

A school IT lead working on the response:
- Reads the bulletin. Notes: env vars marked non-sensitive are at risk, audit logs are available.
- Pulls audit logs for the school's two projects in the platform; notes which secrets were enumerated.
- Rotates identity-provider OAuth client secret first (highest leverage); then deploy tokens, database read-write creds, third-party API keys, in that order.
- Marks all env vars as sensitive going forward; removes three keys that were left in the dashboard from a discontinued integration last year.
- Switches the database connection string to be fetched at runtime from the school's secrets manager via SDK; the platform now sees only the identity, not the credential.
- Schedules database credentials to auto-rotate every 24 hours.
- One-paragraph note to the superintendent; a longer post-mortem in the incident log; updates the vendor-breach playbook to make "rotate before you read further" the literal first step.

## Error handling

If a rotation breaks production: that's a finding, not a disaster. Either the rotation procedure is missing a step (script the next one) or the dependency on the vendor is more brittle than you thought (fix the architecture). Don't roll back to the old secret unless it's the only way to keep critical school operations running; a known-stolen key in production is worse than the outage.

## Provenance

The runtime-fetch + sensitive-env-var pattern is informed by the April 2026 Vercel security incident write-up and the Hudson Rock analysis of the Context.ai infostealer infection that fed it. Cited as an industry example, not as endorsement of any specific product.
