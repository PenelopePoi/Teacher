---
name: vendor-offboarding-and-data-return
description: Execute the end-of-contract clauses when a vendor relationship terminates — data return, verified deletion, certificate on file, access shutoff — so student data does not sit on a former vendor's disk forever
domain: security
intent: audit
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Evaluate
argumentHint: the vendor name, the terminating contract, and the data classes involved
---

# vendor-offboarding-and-data-return — Close the file, get the certificate

`vendor-dpa-review` covered the contract at sign-in. This skill covers the contract at sign-out. Termination is the moment the DPA's deletion-and-return clauses are tested; most districts do not test them, and learn years later — through a vendor's own breach — that their data was still on the vendor's disk. Run this skill end-to-end at every vendor exit.

## When to use

- A vendor contract is terminating (expiry, non-renewal, for-cause termination).
- A vendor has been acquired and the acquirer is not continuing the service under the existing DPA.
- A vendor has announced a material security incident and the district is terminating early.
- `vendor-dpa-review` is being run at renewal — this skill is the hygienic close-out of the previous term.

## When NOT to use

- The contract is continuing — this is not a renewal / restatement skill.
- Internal staff offboarding — go to `staff-offboarding-and-contractor-hygiene`.
- Vendor incident mid-term — go to `secrets-rotation-after-vendor-breach`; offboarding may follow, but the first move is incident response.

## The six exit-clause executions

1. **Access shutoff.** Every account the vendor holds in the district's tenants — IdP accounts, SSO federations, OAuth grants, API keys, service-account credentials — is disabled or revoked at or before the termination effective time. Federation trust removed where applicable.
2. **Data export.** Where the DPA entitles the district to data export, run the export in the format promised, in the window promised, to district-controlled storage. Verify the export is complete and readable before the deletion clock starts.
3. **Data return or destruction.** Per DPA, the vendor returns and/or destroys the school's data within the defined window (typically 30-90 days). Specify which — return, destroy, or both.
4. **Deletion certificate.** Signed, on vendor letterhead, identifying the data classes and volumes destroyed and the method. Filed in the district's vendor-offboarding case file.
5. **Subprocessor propagation.** Every subprocessor named in the DPA must also delete / return. The vendor bears responsibility but the district confirms — a clause in the exit letter asking the vendor to certify subprocessor compliance.
6. **Aggregated / de-identified data.** If the DPA permitted retention of aggregated or de-identified derivatives, confirm in writing what was retained and the de-identification method. "Retains analytics forever" without method = treat as not de-identified.

## The exit-letter template

Send the vendor a formal exit letter at contract end. Template, plain language:

> **Subject:** Termination effective [date] — data return and deletion
>
> Under Section [X] of the DPA dated [YYYY-MM-DD], this letter serves formal notice of termination of services effective [date].
>
> The district requests the following actions within the [30 / 60 / 90]-day window provided for in Section [X]:
>
> 1. Export of all district data (mailboxes, files, records, logs) in [format] by [date]. Confirm receipt upon completion.
> 2. Verified destruction of all district data held by [vendor] and its subprocessors, per NIST SP 800-88 Clear / Purge as applicable to the media. Certificate of destruction signed and delivered to [named district contact] by [date].
> 3. Confirmation that every subprocessor has been directed to complete the same destruction and has certified compliance.
> 4. Access removal: deactivation of all federation, API, and service-account credentials by [date] and confirmation in writing.
> 5. Written confirmation of any aggregated or de-identified data retained, with the specific de-identification method used.
>
> The district's designated contact for this matter is [named contact, email, phone].
>
> [Signed, district procurement / legal lead]

Counsel reviews the letter before sending.

## Workflow

1. **Calendar the exit** 90-120 days before the effective date. Don't wait for the date.
2. **Pull the DPA** and extract the exit-clause obligations verbatim. If a clause is missing or vague, the vendor will move in the gap; counsel is consulted.
3. **Classify the data** still on the vendor's side. Scope the export.
4. **Export first, then delete.** Never let the deletion clock start before the export is verified readable. Corrupted or incomplete exports are worse than no export.
5. **Send the formal exit letter** with counsel review. Vendors are less flexible after the letter than before; align first.
6. **Track the 30/60/90-day milestones** in the case file. Nudge the vendor as milestones approach.
7. **Receive and file the deletion certificate.** If it does not arrive, it is a breach of contract; counsel advises next step.
8. **Confirm access removal** from the district side: the vendor's federation is off the IdP; their OAuth grants are revoked; their API keys show 401 on next use; service-accounts are disabled and rotated.
9. **Subprocessor confirmation** — a line in the vendor's certificate or a separate attestation.
10. **Close the case file.** Exit letter, DPA extract, certificate, access-removal screenshots, sign-off.

## Example

A district offboards a classroom-reading-analytics vendor after three years. Data scope: student reading logs, assessment scores — FERPA-scope.

- T-90: exit reminder from contract register. Case file opened. DPA exit-clauses extracted; 60-day deletion window with certificate requirement.
- T-75: export run; 1.7 GB of CSV / JSON exports verified readable; stored in district-controlled storage with a retention label.
- T-60: formal exit letter sent; counsel-reviewed.
- T-45: vendor confirms data export seen on their side and schedules destruction for T-30.
- T-30: vendor runs destruction; certificate received (signed, vendor letterhead, specifies CSV / database / backup blob classes and NIST 800-88 Clear method for SaaS-backing storage).
- T-30: district IdP federation removed; vendor OAuth grants revoked; vendor API keys see 401 on next use; three staff service-accounts used by vendor disabled and rotated.
- T-15: subprocessor attestation received (one subprocessor, a hosting provider; attestation signed).
- T-0: case file closed; exit letter, certificate, subprocessor attestation, access-removal screenshots, sign-off — ten-year retention per state student-privacy law.

## Error handling

If the vendor will not produce a deletion certificate: that is a breach of contract. Escalate through counsel; if the DPA has an indemnity clause, invoke as needed. Treat non-compliance as a finding in the future vendor-evaluation register.

If the vendor has been acquired and the acquirer will not honour the DPA: treat this as a DPA termination and a new DPA negotiation with the acquirer; run this exit skill against the original relationship, then `vendor-dpa-review` against the acquirer.

If a subprocessor mid-chain is unresponsive: the direct vendor is contractually responsible, not the subprocessor. Push the vendor, not the subprocessor.

If you find, months later, that a vendor retained data it was supposed to delete: that is a `ferpa-data-breach-notification`-level event if student data is involved; coordinate with counsel and follow that skill. A retained-without-authorisation corpus is a latent breach.

## Provenance

Aligned with standard DPA practice; mirrors the exit clauses drafted in `vendor-dpa-review`; NIST SP 800-88 Rev. 1 (Media Sanitization) for destruction methods; and common state student-privacy law (e.g., NY Ed Law 2-d, CA SOPIPA, IL SOPPA) for retention-after-termination rules. **This skill structures operational close-out; counsel reviews the exit letter and signs off on any dispute that arises from non-compliance.**
