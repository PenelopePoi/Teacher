---
name: ferpa-data-breach-notification
description: After a confirmed student-data breach, handle the legal and ethical notification obligations — which law applies, who must be told, in what order, and what to put in writing — without making the situation worse
domain: security
intent: guard
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Evaluate
argumentHint: the confirmed breach scope (data classes, record count, affected population) and the jurisdiction
---

# ferpa-data-breach-notification — Get the order right

FERPA does not impose a direct federal breach-notification timeline the way HIPAA does, but state student-privacy laws, contractual obligations, and cyber-insurance requirements usually do. The common mistakes are notifying too late, notifying too narrowly, or — worse — notifying publicly before legal, regulators, and affected families have been briefed in the right order. This skill is not legal advice; it is the operational sequence a school's IT and compliance leadership should run in coordination with counsel.

## When to use

- A confirmed breach of student records, IEPs, health information, or other FERPA-scope data
- A strong indication of breach pending forensic confirmation — start the clock now; you can stand down if forensics clear it
- A vendor notifies the school that *their* breach exposed the school's student data

## When NOT to use

- Mid-intrusion without confirmed exposure — go to `incident-triage-checklist`; notification starts after scope is established
- Non-FERPA-scope incidents (purely staff data, purely district financial data) — different laws apply; coordinate with counsel rather than using this skill

## The legal landscape in brief

- **FERPA** (34 CFR 99) governs who may access education records and requires the school to maintain records of access. It does not impose a federal breach-notification timeline, but it does restrict further disclosure during investigation.
- **State student-privacy laws** vary widely. California (SOPIPA, AB 1584), New York (Ed Law 2-d), Illinois (SOPPA), Colorado, Connecticut, and many others impose notification timelines (often 30-60 days) and specific recipients (parents, state education agency, SEA-designated office).
- **State general breach-notification laws** also apply (personally identifiable information beyond the FERPA definition — financial, SSN, health — typically has its own, shorter timelines).
- **Contract clauses** in vendor DPAs often impose shorter timelines than the underlying law.
- **Cyber-insurance** requires notification to the carrier within hours, *before* notifying regulators or the public, or coverage may be voided.

Assume every incident invokes at least three of these regimes. The school's counsel selects the binding set; this skill sequences the operational steps.

## Workflow (in order)

1. **Call the cyber-insurance carrier first.** Most carriers have a 24-hour hotline and require immediate notification. This is a contractual gate — skipping it can void coverage. The carrier's panel counsel often becomes the lead legal counsel for the incident from this point.
2. **Engage counsel.** Internal and/or carrier-panel. Counsel owns the determination of which laws and which notification timelines apply, and counsel reviews every piece of written communication before it leaves the district.
3. **Identify the affected population.** Who, by data class, by grade, by parent contact record. The notification list is a dataset of its own; get it right before drafting.
4. **Notify the state education agency / student-privacy office** per the state's specific timeline. Usually this precedes parent notification because the SEA may direct the communications approach.
5. **Notify affected families** with a written notice reviewed by counsel. Contents per applicable law, typically: what happened, what data was involved, when, what the school is doing, what the family can do (credit monitoring for data classes that justify it), who to contact. Plain language; avoid jargon. For minors, the notice goes to parents / guardians.
6. **Notify vendors and downstream data recipients** if the breach affects data they hold or process under the school's contract.
7. **Notify law enforcement** if criminal activity is confirmed or suspected. Typically FBI for interstate actors (IC3 filing), state attorney general per state law, local law enforcement for physical or insider components.
8. **Notify the public** only via a single, counsel-reviewed, approved statement — usually after affected families have had a head start. Do not let the incident reach families through the news.
9. **Maintain the log.** Every communication, recipient, timestamp, and response. This is the artefact for a later audit, state investigation, or civil matter.
10. **Close out with a findings-and-remediation letter** to the state education agency and (often) to affected families, documenting what has been fixed.

## Example

A district confirms that a cyber-insurance-claim-worthy breach of the SIS exposed 4,200 students' attendance and contact records, including some IEP data for 120 students.

- Hour 0: cyber-insurance hotline called. Panel counsel retained within 90 minutes.
- Hour 6: SEA (state's designated student-privacy office) notified per state law (here, 24-hour requirement).
- Day 2: data-class and affected-population list finalised; drafts of parent notice with counsel.
- Day 4: parent notices mailed; dedicated hotline opened; superintendent's letter on the district website.
- Day 5: public statement issued in coordination with counsel; local media already called, statement is ready.
- Week 2: FBI IC3 filing complete; law enforcement engaged; vendor cleared from scope (breach was directly on the SIS, not via a vendor).
- Week 8: findings letter to SEA documenting remediation; civil matter is pending but coverage is intact.

## Error handling

If a staff member or board member tells the press before the notifications are complete: that is damage control, not blueprint. Counsel adjusts the sequence, accelerates the parent notification, and the incident log records the deviation. The bigger risk is using this as an excuse to skip the order entirely — the order still matters; the deviation just changes the pace.

## Provenance

Framework drawn from FERPA (20 U.S.C. § 1232g; 34 CFR Part 99), common state student-privacy laws (California SOPIPA / AB 1584, New York Ed Law 2-d, Illinois SOPPA, Connecticut PA 16-189 / 18-125 successors), general state breach-notification laws, and cyber-insurance carrier practices. **This skill is operational guidance, not legal advice. Every incident requires engaged counsel who determines the binding legal timeline for the specific jurisdiction and facts.**
