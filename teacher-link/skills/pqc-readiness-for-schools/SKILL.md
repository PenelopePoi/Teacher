---
name: pqc-readiness-for-schools
description: Post-quantum cryptography readiness for schools — inventory cryptographic dependencies, identify data with long secrecy life (student records persist for decades), and plan the migration off quantum-vulnerable public-key dependencies before harvest-now-decrypt-later catches up
domain: security
intent: analyze
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Evaluate
argumentHint: a system, data class, or vendor to evaluate for PQC exposure
---

# pqc-readiness-for-schools — Long-secrecy data, today's algorithms

When a sufficiently capable quantum computer arrives, today's public-key cryptography (RSA, ECDH, ECDSA) breaks. Symmetric crypto (AES) and most modern hashes survive with parameter changes. The honest deadline is not the day a quantum computer ships — it is the day an attacker who already harvested today's encrypted traffic can decrypt it. For schools that means: anything you transmit today that must remain confidential in ten or twenty years is at risk now.

## When to use

- Annual review of cryptographic posture; PQC is now a near-term board issue, not a science-fair item
- Procuring a system that will hold student records, IEPs, health information, or other long-secrecy data
- Vendor due-diligence — asking whether a platform has a PQC migration plan
- Budgeting for the next three years; PQC migration is real cost and real timeline

## When NOT to use

- Mid-incident — go to `incident-triage-checklist`; PQC is a multi-year programme, not a response
- Marketing-driven "we need quantum-safe everything tomorrow" panics — the honest answer is *inventory first, prioritise long-secrecy data, follow NIST and CISA guidance*

## The honest framing

Most schools' immediate quantum exposure is not the day-to-day TLS connections to Google Workspace or Canvas. It is the long-secrecy data: student records that persist for the student's lifetime, health information, custody and protective-order documentation, financial-aid records. *Harvest-now-decrypt-later* (HNDL) is the one PQC threat model that has already started. Everything else is on the runway.

## The four exposure classes

1. **Long-secrecy data in transit today.** TLS sessions carrying student PII, health records, financial-aid data. An attacker recording these now can decrypt later.
2. **Long-secrecy data at rest with key-wrapping that uses public-key crypto.** If the data-encryption-key is wrapped with RSA, future quantum decryption of the wrapped key recovers the data.
3. **Authentication and signing.** Code signing, SAML/OIDC tokens, document signatures with long-term legal weight (transcripts, diplomas).
4. **Embedded / long-lived systems.** HVAC controllers, badge readers, cameras, network equipment with hard-coded crypto and no realistic update path.

## Workflow

1. **Cryptographic inventory.** For each system: which TLS versions and ciphersuites; what wraps DEKs at rest; what signs tokens, code, and documents; what algorithms are baked into hardware. The first inventory is the hardest; subsequent ones are diffs.
2. **Map data-secrecy lifetimes.** For each data class the system handles: how long must it remain confidential? Student transcripts → 50+ years. Health records → 20+ years. Routine attendance → ~7 years. Use the longest-secrecy class as the system's exposure class.
3. **Score exposure.** Long-secrecy + traversing the open internet = highest priority. Long-secrecy + at rest with public-key key-wrap = second. Short-secrecy or local-only = patient.
4. **Triage by priority.** Don't try to migrate everything at once. The first cohort is high-exposure systems where the vendor already has a PQC roadmap. The second is high-exposure systems where the vendor doesn't — those need vendor pressure, contract language, or replacement planning.
5. **Vendor questions.** *What is your PQC migration timeline? Which NIST-standardised algorithms are you adopting (ML-KEM, ML-DSA, SLH-DSA)? When do you plan hybrid-mode availability? What's your plan for data already collected in pre-PQC ciphers?* If a vendor cannot answer any of these for a long-secrecy system, that is itself a finding.
6. **Pilot hybrid mode where available.** Hybrid (classical + PQC) is the sane intermediate step — it adds PQC protection without risking a regression if the new algorithms turn up flaws. TLS 1.3 with hybrid key exchange is shipping.
7. **Plan the long-tail systems.** Embedded controllers and old appliances that cannot be updated → segment, restrict, replace on the next refresh. Don't pretend they're going to receive a PQC patch.
8. **Document the programme.** Inventory + secrecy-lifetime map + priority queue + vendor-status table. This becomes the artefact you defend at the board level and hand to the next IT lead.

## Example

A district reviews its student-information system, learning-management system, financial-aid platform, and HR system:
- **SIS**: vendor confirms ML-KEM hybrid TLS in 2026 release; opt in. Action: schedule the upgrade.
- **LMS**: vendor has no published PQC plan; data secrecy is mostly short. Action: ask annually, no immediate move.
- **Financial-aid platform**: vendor stalls on PQC questions; data is highly long-secrecy (financial PII for minors). Action: written question to vendor; if no satisfactory answer in 12 months, evaluate alternatives.
- **HR system**: vendor on roadmap; SSO certificates use ECDSA. Action: pair migration with the next cert-rotation cycle.
- **Cryptographic inventory** finds three legacy badge-reader controllers using TLS 1.0 with RSA-1024. Action: VLAN-segment now; replace in next physical-security refresh.
- **Document the programme** in a one-page board brief: four cohorts, three years, defensible budget.

## Error handling

If a vendor responds with "we'll wait for a real quantum computer" and the data is long-secrecy: that is a misalignment between vendor's threat model and yours, and it shows up in writing. Capture it as a finding, raise it at the next contract review, and treat it as input to the renewal/replacement decision rather than as an answered question.

## Provenance

Aligned with NIST's post-quantum cryptography standards (ML-KEM / FIPS 203, ML-DSA / FIPS 204, SLH-DSA / FIPS 205) and the joint CISA / NSA / NIST guidance on quantum-readiness. Cited as public standards bodies, not as endorsement of any specific vendor's roadmap. The harvest-now-decrypt-later framing is the consensus near-term threat model in published government and industry guidance; this skill summarises it for an educator/IT audience without claiming to add new technical content.
