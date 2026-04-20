---
name: cybersecurity-for-education
description: Bundle of 21 cybersecurity skills for schools — 8 student fundamentals (phishing, passwords, ransomware, devices) and 13 educator/IT operational skills (EDR, IR triage, AI-command triage, fraud-framework mapping, FERPA-aware data protection, Mythos-class AI risk roadmap, vendor-breach secret rotation, model-tier-by-task, secure-by-default-vs-by-config)
domain: security
intent: analyze
lifecycle: stable
version: 0.4.0
type: bundle
argumentHint: skill name to look up, or "list" to see all 21
---

# cybersecurity-for-education — Bundle

A two-track skill bundle that brings cybersecurity coverage to the Teacher platform's Skill Launcher. Every skill is a real `SKILL.md` file scanned by `SkillEngineService`, browseable from the Skill Launcher (`Ctrl+Shift+S`) and the Skill Library widget.

## Student track — domain: education, intent: teach

Foundational concepts for learners. Bloom's level *Understand* / *Apply*.

| Skill | What it teaches |
|---|---|
| `phishing-spotter` | Read sender/URL/grammar tells in inbound mail |
| `password-hygiene` | Strong passphrases, password managers, MFA |
| `safe-browsing` | HTTPS indicators, download caution, sandboxing |
| `social-engineering-101` | Pretexting, baiting, tailgating, vishing |
| `ransomware-basics` | What it is, why backups matter, what to do |
| `data-classification-for-students` | Sensitive vs. public data on shared devices |
| `device-hygiene` | Updates, screen-lock, drive encryption, OS basics |
| `report-suspicious-activity` | How and when to escalate inside a school |

## Educator / IT track — domain: security, intent: analyze | guard | audit

Operational guidance for educators and school IT. Bloom's level *Apply* / *Analyze* / *Evaluate*.

| Skill | What it does |
|---|---|
| `edr-basics-for-schools` | What EDR does and why coverage gaps hurt |
| `incident-triage-checklist` | First-30-minute response after a suspected incident |
| `ai-command-triage` | Tell AI-generated shell commands apart from attacker LotL |
| `phishing-defense-program` | Run sims and awareness training that actually move numbers |
| `ransomware-readiness` | Backup strategy, recovery drills, IR retainer |
| `fight-fraud-mapping` | Map observed activity to the Fight Fraud Framework Matrix |
| `student-data-protection` | FERPA-aware classroom-device practices |
| `vulnerability-disclosure-handling` | Coordinated disclosure norms; why public PoC drops harm defenders |
| `mid-incident-edr-install` | What to do when EDR goes in mid-compromise |
| `mythos-class-risk-roadmap` | Six-step risk-based roadmap for AI-amplified loss |
| `secrets-rotation-after-vendor-breach` | Rotate, scope, switch when a vendor discloses a breach |
| `model-tier-by-task` | Pick cheap+scaffolded vs. frontier per task shape |
| `secure-by-default-vs-by-config` | Evaluate a protocol/SDK by what it does out of the box |

## When to use this bundle

- An educator or learner wants a curated path through cybersecurity-for-education topics
- A skill needs to ground itself in the bundle's vocabulary (e.g., the educator track presupposes students have seen `phishing-spotter` and `password-hygiene`)
- You want to symlink one bundle directory into `~/.claude/skills/` rather than 17 sibling folders

## When NOT to use

- Quick lookups for a single skill — invoke that skill directly from the Skill Launcher
- Generic security questions with no education context — the bundle assumes a school setting

## Workflow

1. Read this file to orient on the two tracks.
2. Pick a skill by name and execute it from the Skill Launcher; the rendered output is the SKILL.md body for that file.
3. Skills do not chain — each is a standalone teaching or operational artifact.

## Provenance

Skill topics are informed by public materials cited inline in each skill: the Huntress 2025 education-sector threat report, the *Codex Red* mid-incident case study (informs `ai-command-triage` and `mid-incident-edr-install`), the Fight Fraud Framework Matrix (informs `fight-fraud-mapping`), the Nightmare-Eclipse and Chaotic Eclipse PoC drops (inform `vulnerability-disclosure-handling`), the AI Security 6-Step Approach / *Mitigating Mythos-Class Risk* discussion (informs `mythos-class-risk-roadmap`), the April 2026 Vercel / Context.ai supply-chain incident write-ups (inform `secrets-rotation-after-vendor-breach`), Stanislav Fort / AISLE's coverage-vs-brilliance vulnerability-detection results (inform `model-tier-by-task`), and the OX Security MCP-server arbitrary-command-execution disclosure (informs `secure-by-default-vs-by-config`).
