---
name: data-classification-for-students
description: Sort the data on a shared device into public, internal, sensitive, and restricted so learners know what they can post, send, or upload
domain: education
intent: teach
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Understand
argumentHint: the file, document, or message you want to classify
---

# data-classification-for-students — What is this, and where can it go?

Most data leaks at schools are not break-ins — they are sensitive files emailed to a personal address, posted to a public folder, or uploaded to a free AI tool. A four-bucket classification gives learners a quick mental check before they hit "share."

## When to use

- About to post something to a public channel, share a folder, or upload a file to a third-party service
- Setting up a new shared drive or class folder
- Teaching a class about why "just my study group" is not the same as "the whole internet"

## When NOT to use

- The data is already public by design (a school marketing post)
- An IT or compliance team has its own classification scheme — defer to it; this skill is the entry-level model

## The four buckets

- **Public** — posted on the school website, social media, brochures. No restrictions.
- **Internal** — class notes, worksheets, schedules. Fine inside the school's accounts; not for public posting.
- **Sensitive** — graded work, attendance records, draft assessments. Limited to the people who need to see it.
- **Restricted** — student records, health information, financial data, anything covered by FERPA or local privacy law. Strict access; never paste into an external tool.

## Workflow

1. **Name the bucket** for the file in front of you.
2. **Match the channel.** Public → anywhere. Internal → school accounts. Sensitive → named recipients. Restricted → the official system, nothing else.
3. **Specifically watch external tools.** Free PDF converters, free transcription services, generative-AI assistants — assume anything you upload could be retained, indexed, or used for training. Don't paste Restricted data into them.
4. **Ask if unsure.** A teacher's two-minute "is this okay to share?" is cheaper than a breach notification.

## Example

A learner is preparing a presentation and wants to use real attendance data to make a chart. Attendance is *Sensitive*. Decision: anonymise it (replace names with "Student A, B, C") before pasting into the slide deck or any external tool.

## Error handling

If Restricted data has already been posted somewhere it shouldn't be: don't try to "delete and forget" — tell a teacher or IT immediately. The school may have a legal duty to notify; speed matters.
