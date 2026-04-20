---
name: email-authentication-for-schools
description: Configure SPF, DKIM, and DMARC on the school's sending domain so attackers can't spoof the superintendent or the district from outside — the DNS-level foundation under phishing and BEC defence
domain: security
intent: guard
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Apply
argumentHint: the domain to secure and its current email sending sources
---

# email-authentication-for-schools — DNS is the front door

Most impersonation of a school happens because SPF, DKIM, and DMARC are missing, misconfigured, or stuck at monitor-only. A working configuration makes the "from the superintendent" spoof bounce or land in spam, without any action required of the reader.

## When to use

- Standing up a new sending domain or migrating email providers
- Reviewing the district's posture as part of `bec-gift-card-scam-defense` or `phishing-defense-program`
- A vendor asks for proof of DMARC enforcement before issuing a contract or insurance
- Inbound impersonation reports from staff have a common spoofed-domain pattern and you want to close the door

## When NOT to use

- Inbound spam filtering tuning — that's a different discipline (this skill is about outbound authentication of *your* domain)
- Active incident — go to `incident-triage-checklist`

## The three records in plain terms

- **SPF** (Sender Policy Framework) lists the IPs / services that are allowed to send as your domain. DNS TXT record.
- **DKIM** (DomainKeys Identified Mail) puts a cryptographic signature in the mail header; receivers verify with a public key published in DNS. One selector per sending service.
- **DMARC** (Domain-based Message Authentication, Reporting, and Conformance) tells receivers what to do when SPF / DKIM fail (`none`, `quarantine`, `reject`) and where to send aggregate reports.

The goal is `DMARC p=reject` on every domain the school sends from, plus every lookalike the school owns. `p=none` buys you reports; `p=reject` buys you protection.

## Workflow

1. **Inventory every sending source.** Google Workspace / Microsoft 365, the SIS, the LMS, the payment processor, the alumni mail tool, the field-trip permission-slip service, the Mailchimp account somebody set up in 2019. Every one of them sends as `@yourschool.edu`.
2. **Publish SPF listing only those sources.** Keep the `all` mechanism at `-all` (hard fail). Avoid the ten-DNS-lookup limit by using the `include:` sparingly; consolidate where possible.
3. **Enable DKIM per sending service.** Each provider has its own selector and setup. Verify signatures are landing with `d=yourschool.edu`, not the provider's domain.
4. **Publish DMARC at `p=none`** with `rua=mailto:dmarc-reports@yourschool.edu`. Collect a week of aggregate reports.
5. **Fix the legitimate senders that fail.** The reports will show surprises — yes, the alumni mail tool exists. Add SPF entries, enable DKIM, or retire the sender.
6. **Move to `p=quarantine`** for a few weeks, then `p=reject`. Do not stay at `p=none` indefinitely; `none` is reporting-only and offers no protection.
7. **Publish DMARC on parked domains too.** Every domain the school owns but doesn't send from needs a `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s` record; otherwise attackers will spoof the parked domain instead.
8. **Add BIMI later, not first.** BIMI (logo-in-inbox) requires DMARC at `p=reject` or `p=quarantine` and is nice-to-have, not foundational.

## Example

A district sends from `@example.k12.ca.us`. Inventory finds seven services. SPF is consolidated to five `include:` entries plus two IP blocks. DKIM is enabled on all seven, each with its own selector. DMARC starts at `p=none`; aggregate reports reveal that an internal reminder-email Python script on a teacher's laptop is sending from the domain without authentication. That script is retired. DMARC moves to `p=quarantine` for three weeks, then `p=reject`. BEC attempts impersonating `@example.k12.ca.us` now bounce at the receiving domain.

## Error handling

If legitimate mail starts bouncing after `p=reject`: do not roll back immediately. Read the DMARC aggregate report to identify *which* sender is failing, decide whether it's legitimate (fix SPF / DKIM for it) or forgotten (let it fail), and resolve at the source. Rolling back `p=reject` under pressure re-opens the spoof hole.

## Provenance

Aligned with M3AAWG's DMARC best-practice guidance and DMARC.org documentation. Cited as public standards and guidance, not as endorsement of any specific provider or DMARC-analytics tool.
