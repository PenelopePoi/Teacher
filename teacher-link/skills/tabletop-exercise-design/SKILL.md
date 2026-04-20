---
name: tabletop-exercise-design
description: Design and run a two-hour tabletop exercise with school leadership so the incident-response questions nobody can answer today get answered before a real incident forces them
domain: security
intent: guard
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Create
argumentHint: the scenario type (ransomware, BEC, data breach, vendor outage) and the attendees
---

# tabletop-exercise-design — The point is to find the unanswered questions

A tabletop isn't a test anyone can pass or fail. It's a two-hour conversation where the school's leadership walks through a plausible incident and discovers which decisions nobody has made, which contacts nobody has, and which dependencies nobody knew about. The deliverable is not a completed tabletop — it is the list of gaps to close before the real one.

## When to use

- Annually as a baseline, plus after any near-miss or sector incident that produces new questions
- Onboarding a new superintendent, principal, board chair, or cyber-insurance carrier who needs to understand the playbook
- During `ransomware-readiness` review; a tabletop surfaces gaps no document walkthrough will

## When NOT to use

- Mid-incident — tabletop is preparation, not response
- As a compliance checkbox with no intent to act on the findings; that is worse than skipping the exercise

## The attendees

Superintendent or head of school, IT director, business manager / CFO, legal counsel (internal or outside), communications lead, the IR partner's point of contact, one board member if available. Keep it to eight or nine people; larger groups talk less, not more.

## The scenarios that pay off

- **Ransomware on the SIS during semester-close.** Forces decisions on restore-vs-pay, communications to parents, and academic continuity.
- **BEC payment to a fake vendor.** Forces decisions on bank recall, insurance call, and internal accountability.
- **Vendor outage on a Monday morning.** Cloud provider, identity provider, or LMS. Forces continuity planning and communication.
- **Student data breach with media attention.** Forces decisions on notification, legal, and communications in a time-boxed way.

## Workflow

1. **Pick one scenario** per tabletop. Two hours is not enough for two scenarios; attendees will treat the second as a checkbox.
2. **Write the scenario in four time-staged injects.** T+0 (discovery), T+1h (first facts), T+4h (media or regulator contact), T+24h (containment and communications). Each inject advances the clock and forces a new decision.
3. **Write the facilitator's question sheet.** For each inject, the questions that leadership must be able to answer: *who is in charge right now? what have we told parents? have we called the insurance carrier? has legal reviewed the notification draft?* The facilitator asks; the room works it out.
4. **Open the room honestly.** State up front: "This is a conversation to find what we don't know. Nobody fails. Unknowns are the point." Without this, attendees perform instead of think.
5. **Track gaps as they emerge.** A scribe (not the facilitator) writes down every "we don't know" in real time. This is the exercise's output.
6. **Close with the list.** Last fifteen minutes: read the gap list back to the room. Assign an owner and a deadline to each item before anyone leaves.
7. **Follow through.** A gap list without a follow-up review in 30 days is theatre. Put the review on the calendar before leaving the tabletop.

## Example

A district runs a ransomware tabletop at T-minus-two-weeks before semester-close. Attendees: superintendent, CFO, IT director, outside counsel, communications lead, IR partner, one trustee.

Injects:
- T+0: SIS is encrypted; ransom note in the IT director's email; EDR firing on three servers.
- T+1h: a parent tweets a screenshot of the ransom note.
- T+4h: local TV station calls for comment; the cyber-insurance hotline asks for a recorded-line statement.
- T+24h: the attacker posts a sample of stolen attendance data on a leak site; the state's student-privacy office calls.

Gaps surfaced during the two hours:
- The insurance carrier's hotline number is in the IT director's email — which is encrypted.
- No one knows who drafts the parent communication; both the communications lead and outside counsel assumed the other did.
- The "decision not to pay" has not been pre-approved by the board; the CFO would have to call an emergency session during the incident.
- The SIS restore drill has not happened this quarter.

All four gaps get owners and deadlines; the 30-day review is on the calendar before people leave.

## Error handling

If leadership treats the tabletop as a performance exercise ("we would of course call legal immediately") rather than a diagnostic: that is itself a finding about organisational culture, and the facilitator should name it. Escalate by running the next exercise with a more adversarial facilitator from the IR partner, who has less political cost in saying "that answer is not credible — what happens when legal's phone is going to voicemail?"

## Provenance

Aligned with CISA's tabletop-exercise package guidance for K-12 and the broader incident-response-planning literature. Cited as public guidance, not as endorsement of any specific tabletop product or consulting firm.
