---
name: cybersecurity-for-education
description: Bundle of 32 cybersecurity skills for schools — 8 student fundamentals (phishing, passwords, ransomware, devices) and 24 educator/IT operational skills covering EDR, IR triage, AI governance, fraud-framework mapping, FERPA-aware data protection and breach notification, Mythos-class AI risk roadmap, vendor-breach secret rotation, identity-provider hardening, MFA rollout, email authentication, BEC defence, Chromebook fleet security, AI-use inventory, vendor DPA review, backup-restore drills, tabletop exercise design, PQC readiness
domain: security
intent: analyze
lifecycle: stable
version: 0.6.0
type: bundle
argumentHint: skill name to look up, or "list" to see all 32
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
| `pqc-readiness-for-schools` | Inventory crypto, map data-secrecy lifetimes, plan PQC migration |
| `mfa-rollout-for-schools` | Roll out MFA without breaking classrooms — cohorts, recovery, the "no phone" edge case |
| `bec-gift-card-scam-defense` | Defend against the superintendent-impersonation gift-card / wire scam |
| `email-authentication-for-schools` | SPF / DKIM / DMARC configuration to block domain spoofing at DNS |
| `backup-restore-drill` | Quarterly restore drills that prove the backup actually works |
| `tabletop-exercise-design` | Two-hour leadership tabletop that surfaces unanswered IR questions |
| `chromebook-fleet-security` | Secure a ChromeOS fleet using the admin console, not a Windows-style overlay |
| `ai-use-inventory` | Surface shadow AI use across a school — four data sources, one workflow |
| `ferpa-data-breach-notification` | Notification order and obligations after a confirmed student-data breach |
| `vendor-dpa-review` | Ten clauses that actually matter in a vendor Data Processing Agreement |
| `identity-provider-hardening` | Conditional access, OAuth-grant hygiene, admin-role scoping, break-glass |

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

Skill topics are informed by public materials cited inline in each skill: the Huntress 2025 education-sector threat report, the *Codex Red* mid-incident case study (informs `ai-command-triage` and `mid-incident-edr-install`), the Fight Fraud Framework Matrix (informs `fight-fraud-mapping`), the Nightmare-Eclipse and Chaotic Eclipse PoC drops (inform `vulnerability-disclosure-handling`), the AI Security 6-Step Approach / *Mitigating Mythos-Class Risk* discussion (informs `mythos-class-risk-roadmap`), the April 2026 Vercel / Context.ai supply-chain incident write-ups (inform `secrets-rotation-after-vendor-breach`), Stanislav Fort / AISLE's coverage-vs-brilliance vulnerability-detection results (inform `model-tier-by-task`), the OX Security MCP-server arbitrary-command-execution disclosure (informs `secure-by-default-vs-by-config`), NIST's post-quantum cryptography standards (FIPS 203/204/205) plus joint CISA / NSA / NIST quantum-readiness guidance (inform `pqc-readiness-for-schools`), CISA's Strong MFA guidance (informs `mfa-rollout-for-schools`), M3AAWG / DMARC.org guidance (informs `email-authentication-for-schools`), FBI IC3 reporting on K-12 BEC / gift-card scams (informs `bec-gift-card-scam-defense`), CISA's tabletop-exercise guidance for K-12 (informs `tabletop-exercise-design`), Google's ChromeOS admin documentation and the CIS Benchmark for Chrome OS (inform `chromebook-fleet-security`), FERPA (20 U.S.C. § 1232g; 34 CFR Part 99) and common state student-privacy laws (inform `ferpa-data-breach-notification`), standard DPA practice and EU GDPR Article 28 as a reference model (inform `vendor-dpa-review`), and CISA's Identity and Access Management guidance plus IdP-vendor security-best-practice documentation (inform `identity-provider-hardening`).
