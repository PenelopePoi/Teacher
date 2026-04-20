# Submission 01 — AI Command Triage

> **Source skill:** `teacher-link/skills/ai-command-triage/SKILL.md`
> **Format:** In-person 30-minute presentation
> **Track fit:** AI-powered cloud and application security; Cloud security monitoring and threat detection; Incident response in cloud environments

## Title

**Was That You, the User, or the Attacker? Triaging AI-Generated Shell Activity in Cloud Workloads**

## Abstract

EDR alerts on cloud-hosted Linux and macOS endpoints where users run AI coding agents (Codex, Copilot CLI, Cursor terminal) look uncomfortably similar to attacker living-off-the-land. Both produce long chained one-liners, snapshot-sourced bash wrappers, base64-piped scripts, curl to localhost on dev ports, and heavy `>/dev/null 2>&1` patterns. The Huntress *Codex Red* case study made this concrete in a real Linux-host investigation; SOC teams that don't deconflict spend analyst time chasing AI noise while attackers persist on the same host.

This session presents a working triage methodology for distinguishing AI-generated shell activity from attacker LotL, drawn from the *Codex Red* case and several months of deconfliction in cloud-developer environments. Attendees walk away with a five-signal decision tree (parent process, user identity, working directory, command cluster shape, snapshot-file artefacts), an EDR-rule pattern that suppresses AI-tool noise without blinding the agent to genuine compromise on the same host, and a framework for the awkward edge case where both AI tooling and an attacker live on the same box mid-incident.

## Outline (30 minutes)

| Min | Section |
|---|---|
| 3 | Why this matters: the *Codex Red* case in one slide — fans loud, miner from August 2024, AI agent masked the symptom, EDR went in mid-incident |
| 5 | Anatomy of a Codex / Copilot CLI / Cursor terminal shell wrapper — snapshot path, parent process, working directory, the `; :; fi` tells |
| 5 | Anatomy of attacker LotL on Linux/macOS — `/tmp` and `/var/tmp` staging, renamed binaries impersonating system services, recon clusters (`id`, `cat /etc/passwd`, `crontab -l`, `find / -perm -4000`) |
| 5 | The five-signal decision tree, walked through three real signals (one AI, one attacker, one ambiguous-then-resolved-via-user-callback) |
| 4 | EDR-rule shape that suppresses AI noise without false-negative on real LotL — what to match on and what *not* to match on |
| 3 | Mid-incident hosts: when both AI tooling and an attacker live on the same box, and why "I suppressed the AI signature" is a trap |
| 2 | Cross-references for cloud workloads (containerised dev environments, ephemeral cloud workstations, codespace-style services) |
| 3 | Q&A |

## Key takeaways

1. A repeatable five-signal decision tree (parent, user, working dir, cluster shape, artefacts) for AI-vs-attacker shell activity
2. Concrete Codex / Copilot CLI / Cursor artefacts — snapshot path, wrapper structure, working-dir patterns — to cross-reference in real time
3. An EDR-rule shape that suppresses AI noise without blinding the agent to genuine compromise on the same host
4. A handling pattern for the dual-occupancy case where AI tooling and an attacker share a host

## Speaker bio (fill in)

```
[Speaker name] is [current role] at [organisation], where [they]
[detection-engineering / SOC / cloud-security responsibility]. [They]
previously [prior practitioner role focused on EDR triage, deconflict,
or developer-environment security]. [Their] work focuses on
telemetry-driven investigation of AI-tool activity in cloud and
developer environments, deconfliction of AI-generated process
telemetry from attacker living-off-the-land patterns, and EDR rule
design that does not punish legitimate AI tooling. [They] are based
in [city].
```

## Source material the speaker will cite

- Huntress, *Codex Red: Untangling a Linux Incident With an OpenAI Twist* (parts 1 and 2)
- The speaker's own deconfliction experience (substitute concrete numbers: hosts triaged, hours of analyst time recovered, false-positive rate before/after rule shape change)

## Promotional plan (per CFP commitment)

LinkedIn post ten days before the Summit, day-of post linking to the session, post-session writeup with the decision tree as a downloadable artefact.

## Notes for the speaker before submitting

- Confirm in-person availability for both Summit days (in-person speakers prioritised per CFP)
- Record a 60–90s overview video (optional per CFP but strengthens the submission)
- Pull two redacted real EDR alerts (one AI, one attacker) to use as live examples — slides need to be readable from a distance and by a virtual audience, so screenshots should be high-contrast and excerpted, not dumped
