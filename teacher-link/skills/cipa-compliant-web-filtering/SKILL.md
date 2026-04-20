---
name: cipa-compliant-web-filtering
description: Meet CIPA's web-filtering obligation without turning the filter into a wall — protect students, preserve research access, document the policy, and keep E-rate funding intact
domain: security
intent: audit
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Evaluate
argumentHint: the filter product in use, student grade bands, and any reported over-blocking complaints
---

# cipa-compliant-web-filtering — Protect without walling off

CIPA is not "block everything that could offend anyone." It is a specific, narrow set of obligations: block visual depictions that are obscene, child sexual abuse material, or (for minors) harmful to minors; adopt and enforce an Internet-safety policy; monitor minors' online activity; educate students on appropriate online behaviour. Filters tuned aggressively beyond that blur into censorship of legitimate research and punish the students you meant to protect. This skill walks the compliance line.

## When to use

- Annual E-rate certification of CIPA compliance is coming up.
- Teachers are complaining that the filter blocks assignments and library-database links.
- The district is reviewing or replacing its filter product.
- A parent or civil-rights complaint references CIPA or over-blocking.
- You want to tune the filter once, with documented rationale.

## When NOT to use

- Classroom device policy on a per-teacher basis — that is pedagogy, not CIPA.
- First Amendment / state-law speech issues that exceed CIPA scope — coordinate with counsel, not this skill.

## CIPA's actual requirements (read this twice)

Per 47 U.S.C. § 254(h) and FCC implementing rules, schools receiving E-rate discounts for internet access or internal connections must:

1. **Have a technology protection measure** (the filter) that blocks or filters internet access, on school-owned devices, to visual depictions that are **obscene**, **child pornography**, or (for minors) **harmful to minors**.
2. **Adopt and enforce an Internet-safety policy** that addresses: access by minors to inappropriate matter; safety and security in direct electronic communications; unauthorized access (including "hacking") and other unlawful activities; unauthorized disclosure, use, and dissemination of personal information regarding minors; measures restricting minors' access to harmful materials.
3. **Hold a public hearing / meeting** on the policy.
4. **Educate minors about appropriate online behaviour**, including interacting with other individuals on social networking sites and in chat rooms, and cyberbullying awareness and response. (Children's Internet Protection Act as amended by the Protecting Children in the 21st Century Act.)
5. **Monitor online activities of minors** (human oversight, not just the filter).

That is the whole federal compliance surface on the filter side. Notably absent: no federal requirement to block social media broadly, political content, LGBTQ+ resources, health information, or lawful speech that makes anyone uncomfortable. Over-blocking those categories does not make you more compliant; it can expose the district to First Amendment and civil-rights liability, and it damages the core instructional mission.

## The four-category filter model

Configure the filter in four categories:

1. **Required block** (CIPA scope): obscenity, CSAM, and — on student-accessed profiles — material deemed harmful to minors. Use the filter's native CIPA category; this is what the product is built for.
2. **Protect-from-harm** (school judgement): malware / phishing, known C2 infrastructure, gambling, drug facilitation, online-predator bait. These are not CIPA-mandated but align with safeguarding.
3. **Instructional-override** (off by default on student profiles, on teacher request): specific categories or URLs that are blocked too aggressively for legitimate instruction — health information, research sites, news about difficult topics. Build a fast-response override path so a teacher can unblock for a class by end of day.
4. **Staff-unfiltered-with-logging** (staff profiles): staff have broader access, with logging, for legitimate instructional preparation.

Disable bulk-category blocks that sweep in protected speech by accident: "LGBT," "activism," "religious minorities," and similar identity-based categories are almost always over-blocked when enabled, and invite legal risk.

## Workflow

1. **Inventory the current filter categories.** Every category enabled, with a note on why. Vendor defaults are a starting point, not a policy.
2. **Map each category to the four-category model.** Anything in "protect-from-harm" that is really identity-category filtering gets moved out.
3. **Audit over-block reports.** Pull the last quarter's teacher override requests. Patterns reveal category drift. Publicly document the top 10 over-blocks and their resolutions.
4. **Write / refresh the Internet-safety policy.** CIPA-required clauses, plus the override path, plus the student-education plan. Post publicly.
5. **Hold the public hearing.** Minutes become part of the E-rate compliance file.
6. **Build the override path.** A teacher submits a URL; IT unblocks (for their class or school-wide) within a stated SLA. Every override is logged with rationale.
7. **Train.** Students get the digital-citizenship / cyberbullying lesson. Staff get the policy and the override path.
8. **Monitor minors' activity** with the specific pattern your product supports — keyword-alerts on high-risk terms (self-harm, weapons) triggering counsellor review, not mass reading of student browsing. Document the monitoring method.
9. **Re-certify annually** with the policy, hearing minutes, filter configuration, training records, and monitoring method on file.

## Example

A district reviews its filter ahead of E-rate recertification. Current config blocks "Social Issues," "Alternative Lifestyles," "Non-Traditional Religions," and "Activism." Teacher overrides pattern: 40% are for news coverage of world events, 30% for health-class research, 20% for AP Government source material. The district:

- Disables the four identity-based categories; documents the rationale.
- Keeps CIPA-scope and malware/phishing / C2 categories on.
- Creates a 24-hour SLA for teacher override requests with a web-form intake.
- Publishes the new Internet-safety policy; public hearing at the April board meeting.
- Updates the 8th-grade digital-citizenship curriculum to include cyberbullying response (cross-references `cyberbullying-response`).
- Adds keyword-alerting on self-harm language with counsellor routing; documents the counsellor SOP.
- Re-certifies. E-rate file is intact; teacher override volume drops 60% in the next quarter.

## Error handling

If a filter outage blocks all traffic or causes broad over-blocking: do not disable filtering entirely on student profiles (that would break CIPA mid-day); fail over to a limited-category mode or vendor fallback. Document the outage and duration.

If a parent or ACLU-style complaint alleges over-blocking: pull the override log and the category-rationale file. Specific, documented rationale defends a category; vendor defaults "because they were on" do not.

If a student's monitoring alert fires: the response is counsellor review and welfare check, not discipline. The purpose of the monitoring requirement is safety, not surveillance-for-punishment.

## Provenance

Based on CIPA (47 U.S.C. § 254(h)) and the Protecting Children in the 21st Century Act amendments, FCC CIPA certification guidance for E-rate applicants, and ALA / EFF / ACLU research on over-blocking and its impact on instructional access. Cited as federal standards, not as an endorsement of any specific filter vendor. **This skill structures compliance review; counsel signs off on the Internet-safety policy and the filter-category rationale.**
