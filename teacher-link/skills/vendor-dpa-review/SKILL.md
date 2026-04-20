---
name: vendor-dpa-review
description: Review a vendor's Data Processing Agreement for student-data handling before signing — the ten clauses that actually matter and how to spot boilerplate that does not protect the school
domain: security
intent: audit
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Evaluate
argumentHint: the vendor name, the data classes involved, and the current DPA draft
---

# vendor-dpa-review — Read the ten clauses that actually matter

A Data Processing Agreement (DPA) is the contract that governs what the vendor can do with student data. Most vendor DPA drafts are written to protect the vendor, not the school. Redlining is expected and normal. This skill gives a school compliance lead a structured pass through the ten clauses that decide whether the DPA is worth signing.

## When to use

- Before signing a new vendor contract that touches student data, staff data, or FERPA-scope records
- Renewal of an existing vendor contract where the DPA has materially changed
- After `ai-use-inventory` surfaces a widely-used free-tier tool worth negotiating into an enterprise contract
- As input to `secure-by-default-vs-by-config` — the DPA and the default technical posture together determine residual risk

## When NOT to use

- The school is the data processor (rare; most school vendor relationships are school-as-controller) — different lens applies
- Non-data-handling contracts (facilities, professional services with no data access) — standard contract review only

## The ten clauses (each gets a yes/no/flag)

1. **Role assignment.** The school is the data controller; the vendor is the processor. Vendor-as-controller language is a refusal; walk away unless this is corrected.
2. **Purpose limitation.** Vendor may only use the data to provide the contracted service. Explicit prohibition of use for training AI models, product development, analytics, or any secondary purpose. Flag any "improving our services" catch-all.
3. **Subprocessor list and notification.** Named subprocessors listed in an exhibit. New subprocessors require notification with a right-to-object window (typically 30 days).
4. **Data location.** Where data is stored and processed, and under which jurisdiction's laws. For US schools, data in jurisdictions with divergent disclosure-to-government regimes (including some cloud regions) requires extra thought.
5. **Security controls.** Specific, not vague. Encryption at rest and in transit (named algorithms), access controls, audit logging, multi-factor authentication for vendor staff accessing the data, SOC 2 Type II or ISO 27001 or equivalent with current report available on request. "Industry-standard security" alone is not a clause.
6. **Breach notification timeline.** Vendor notifies the school within 24-72 hours of confirmed breach affecting school data, with enough detail for the school's own notification obligations under `ferpa-data-breach-notification`. Anything longer than 72 hours is a flag; anything longer than the school's own regulatory timeline is a refusal.
7. **Audit rights.** School may audit or request third-party audit reports at reasonable intervals. The vendor may scope this, but "no audit rights" is not acceptable for high-data-exposure services.
8. **Data return and deletion.** On termination, vendor returns or deletes all school data within a defined window (often 30-90 days), certifies deletion in writing, and does not retain derivative or aggregate data that could re-identify. "Aggregated and anonymised retention" is a flag — insist on a clear definition and documented de-identification method.
9. **Indemnification and liability.** Vendor indemnifies the school for breach caused by vendor's negligence, with liability caps proportionate to risk (a cap equal to one month's fees is not proportionate to a 4,000-student data breach).
10. **AI / model-training terms.** Explicit, separate clause that data is not used to train any model, whether vendor's own or a third party's. Absence of this clause in 2026 is a refusal; ambiguity is a flag.

## Workflow

1. **Classify the data the vendor will touch** using `data-classification-for-students`. The higher the classification, the tighter the DPA must be.
2. **Read the DPA straight through once** without marking it. You need the shape before the details.
3. **Score the ten clauses.** Each gets yes / no / flag with a short note. A single no on a clause marked as a refusal above is sufficient to walk away.
4. **Redline.** Produce specific replacement language — not "please strengthen this clause" but the actual sentence you want in. Vendors who will negotiate engage with language; those who will not reveal themselves in the redline stage.
5. **Escalate the non-negotiators.** A vendor refusing to accept a "no training on student data" clause is a structural refusal; document it and recommend against adoption, regardless of how good the product is.
6. **Close with the security-controls exhibit.** Insist on specific, named controls in an exhibit — cite SOC 2 Type II report date, named encryption algorithms, named audit logging, named breach-notification contact. Specificity in the exhibit closes gaps that the DPA body leaves open.
7. **Route to counsel before signature.** The school's counsel reviews the final redlined version. This skill structures the review; counsel owns the sign-off.

## Example

A school is evaluating a new AI-powered writing-feedback tool used by 8th-grade ELA teachers. Data scope: student writing samples (sensitive; author identifiable). Vendor's initial DPA:

- Role assignment: correct (controller / processor). ✓
- Purpose limitation: *"may use de-identified data to improve services."* Flag — strike.
- Subprocessors: named; 30-day notification. ✓
- Data location: US only. ✓
- Security controls: vague. Flag — replace with an exhibit citing SOC 2 Type II dated within 12 months, AES-256 at rest, TLS 1.3 in transit, MFA for vendor staff.
- Breach notification: 10 days. No — counter with 72 hours.
- Audit rights: "SOC 2 report on request." ✓ (sufficient for this risk profile).
- Data return and deletion: 90 days post-termination, deletion certificate. ✓
- Indemnification: cap at $50k. No — counter proportionate to 8,000 potentially affected students.
- AI / model-training: silent. Flag — insert explicit "no training" clause.

Redlines delivered. Vendor accepts 72-hour notification, explicit purpose-limitation, and higher cap; agrees to no-training clause. DPA signed. Had the vendor refused the no-training clause, the tool would not have been adopted.

## Error handling

If the vendor refuses a structural clause (role, training, subprocessor notification, breach timeline) and the school's stakeholders still want the product: document the refusal, accept the residual in writing with explicit leadership sign-off, and re-evaluate at renewal. This is worse than a clean DPA but better than either walking into an unwritten gap or pretending the DPA protects the school when it does not.

## Provenance

Aligned with standard data-protection-agreement practice (US state student-privacy laws, EU GDPR Article 28 as a reference model, and common SOPIPA / Ed Law 2-d-style state requirements). **This skill structures the review; it is not legal advice. Counsel signs off on the final DPA.**
