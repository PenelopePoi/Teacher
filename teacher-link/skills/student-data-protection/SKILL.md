---
name: student-data-protection
description: FERPA-aware classroom-device practices — what counts as an education record, what can leave the school, and how MDM and cloud configuration enforce it without slowing teaching down
domain: security
intent: audit
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Evaluate
argumentHint: a workflow, app, or data-sharing scenario to evaluate
---

# student-data-protection — Treat student data as a duty, not a checkbox

In the United States, FERPA defines education records and the rules for who can see them. Equivalent regimes exist elsewhere (UK GDPR + DfE guidance; Canadian provincial law; state-level student-privacy laws). This skill helps an IT or compliance lead evaluate whether a tool, workflow, or device configuration honours those duties.

## When to use

- Approving a new third-party app, AI tool, or assessment platform for classroom use
- Reviewing the school's MDM and cloud configuration during the annual privacy audit
- A teacher proposes a workflow that involves uploading student names / IDs / grades to an external service

## When NOT to use

- A specific data-leak event has already occurred — go to `incident-triage-checklist`; this skill is preventive
- Decisions that require legal interpretation of a specific statute — escalate to the school's legal counsel; this skill is operational, not legal advice

## Working definitions

- **Education record (FERPA-style):** records that are directly related to a student and maintained by an educational institution. Names, IDs, grades, attendance, disciplinary records.
- **Directory information:** name, address, phone, photo — the school may publish unless the parent / eligible student has opted out.
- **Personally identifiable information (PII):** anything that could reasonably identify a student, including indirect identifiers in combination.

## Workflow

1. **Inventory data flows.** For the system under review, list: what student data goes in, where it is stored, who can see it, how long it is retained, what happens at end-of-contract.
2. **Apply minimisation.** Does the tool need real names? Real IDs? Often a pseudonymous ID works just as well; insist on it.
3. **Check the contract.** A Data Processing Agreement (or equivalent) is non-optional. The school should be the data controller; the vendor the processor.
4. **Configure the tooling.**
   - MDM enforces disk encryption, screen-lock, app allow-list on classroom devices.
   - Cloud SSO with conditional access blocks unmanaged devices from accessing the SIS.
   - DLP rules flag attempts to email PII to non-school addresses.
5. **Train the people.** The teacher uploading attendance to a free transcription service is not malicious; they're under-supported. `data-classification-for-students` is the learner-facing companion to this skill.
6. **Plan for the breach.** Know your notification obligations *before* you have to notify. The school's privacy lead should know who to call within hours, not days.

## Example

A teacher wants to use a free AI tool to summarise IEPs. The tool's free tier explicitly states inputs may be used for training. Decision: deny the workflow on the free tier; pursue an enterprise contract with no-training, with-DPA terms; in the meantime, give the teacher a sanctioned alternative (the school's existing tooling).

## Error handling

If a vendor refuses to sign a DPA or won't commit to no-training on student data: that's a refusal to do business on terms the school can accept. Walk away; document the decision; communicate the alternative to staff so they don't route around the decision.
