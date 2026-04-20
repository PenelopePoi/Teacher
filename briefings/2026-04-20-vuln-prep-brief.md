# Vulnerability preparedness brief — 2026-04-20

A school-IT-focused synthesis of vulnerability news from the last two weeks. Every item is mapped to a skill in the `cybersecurity-for-education` bundle (`teacher-link/skills/cybersecurity-for-education/SKILL.md`) so the response is operational, not just informational.

## TL;DR — do this week

1. **Patch Windows now.** April Patch Tuesday shipped 163 CVEs including a SharePoint zero-day already exploited in the wild (CVE-2026-32201, also on CISA KEV) and three unauthenticated critical RCEs (Windows IKE CVE-2026-33824 CVSS 9.8, Windows TCP/IP CVE-2026-33827, Windows AD CVE-2026-33826). Office preview-pane RCEs (CVE-2026-32190 / 33114 / 33115) trigger without the user opening the file.
2. **One Defender LPE is patched (BlueHammer / CVE-2026-33825); two are not (RedSun, UnDefend).** Both unpatched ones are being exploited in the wild per Huntress. SYSTEM privilege escalation on Win10 / 11 / Server 2019+. No vendor fix yet.
3. **Audit any account that was ever stored in a Vercel project,** or that touches Context.ai, or that was reused with one. The Vercel breach was confirmed, vectored through an infostealer on a Context.ai customer-employee laptop, then escalated through Google Workspace OAuth into Vercel environments and read non-sensitive env vars.
4. **If you use Claude Code CLI / Claude Agent SDK on any school-managed device, upgrade now.** CVE-2026-35022 (CVSS 9.8) and two siblings — command injection through `apiKeyHelper`, `awsAuthRefresh`, `gcpAuthRefresh`, the `TERMINAL` env var, and prompt-editor file paths.

## Active patches (apply now)

### Microsoft April 2026 Patch Tuesday — 163 CVEs

| CVE | Component | Why now |
|---|---|---|
| CVE-2026-32201 | SharePoint | Zero-day, exploited in wild, on CISA KEV |
| CVE-2026-33824 | Windows IKE | Unauthenticated RCE, CVSS 9.8 |
| CVE-2026-33827 | Windows TCP/IP | Unauthenticated RCE, race condition, no user interaction |
| CVE-2026-33826 | Windows Active Directory | RCE, "Exploitation More Likely" |
| CVE-2026-32190 / 33114 / 33115 | Office / Word | Preview-pane RCE, CVSS 8.4 each |
| CVE-2026-33825 | Windows Defender | BlueHammer LPE → SYSTEM (now patched) |

→ Map: `vulnerability-disclosure-handling` (workflow steps 1–5), `incident-triage-checklist` (if a host shows pre-patch compromise signs).

### CISA KEV additions, 13–16 April 2026

CVE-2025-60710 (Windows Link Following), CVE-2026-21643 (Fortinet SQLi), CVE-2026-34621 (Adobe Acrobat prototype pollution), CVE-2009-0238 (Office RCE — yes, 2009; still being exploited), CVE-2026-34197 (Apache ActiveMQ improper input validation), plus the SharePoint zero-day above.

→ Map: `mythos-class-risk-roadmap` step 3 (KEV-first hygiene check is the residual-risk floor).

## Active threats with no fix yet

### RedSun — Windows Defender LPE → SYSTEM

Abuses Defender's own file-rewrite behaviour for cloud-tagged files to overwrite system files. Works on fully-patched Win10 / 11 / Server 2019+ with Defender enabled. **No CVE assigned, no Microsoft fix, exploited in the wild.** Researcher (Chaotic Eclipse) dropped the PoC after a publicly hostile disclosure dispute with Microsoft.

### UnDefend — blocks Defender definition updates

Blinds the endpoint to new signatures. Standard-user privilege required. Exploited in the wild per Huntress.

→ Map: `vulnerability-disclosure-handling` (the new "On AI-discovered findings and severity gaps" + Chaotic Eclipse paragraphs); `mid-incident-edr-install` (telemetry-gap reasoning if you find this on a host); IOC hunt for `z.exe` in two-letter `Downloads` subfolders, `FunnyApp.exe` / `RedSun.exe` in Pictures, and the recon cluster `whoami /priv` + `cmdkey /list` + `net group`.

## Supply chain — secrets and protocol layer

### Vercel breach (confirmed) via Context.ai

Infostealer (Lumma) on a Context.ai employee's personal device → harvested Google Workspace creds → OAuth into Context.ai's Vercel projects → enumerated non-sensitive env vars across customer projects. Sensitive env vars not accessed. Mandiant engaged. Customer guidance: rotate everything in any affected Vercel project, mark env vars as sensitive, review audit logs.

→ Map: `secrets-rotation-after-vendor-breach` (full workflow); `secure-by-default-vs-by-config` (the "non-sensitive" default for env-var visibility is exactly the burden-shift pattern).

### MCP STDIO command injection — 150M+ downloads, 200K+ servers

OX Security disclosed an architectural RCE in Anthropic's MCP across Python / TypeScript / Java / Rust SDKs. Affects Cursor, VS Code, Windsurf, Claude Code, Gemini-CLI. **Windsurf zero-click (CVE-2026-30615).** Anthropic's response: "by design, sanitisation is the developer's responsibility."

→ Map: `secure-by-default-vs-by-config` (canonical example; the "by design" deflection in the wild). If your school deploys MCP-using AI tooling: inventory which clients are affected, and either restrict MCP-server sources to a vetted allow-list or wrap them.

### Claude Code CLI / Claude Agent SDK — three CVEs

CVE-2026-35020 (TERMINAL env var), CVE-2026-35021 (prompt-editor file path), CVE-2026-35022 (auth helpers — `apiKeyHelper`, `awsAuthRefresh`, `awsCredentialExport`, `gcpAuthRefresh`; CVSS 9.8). Chain into credential exfiltration over HTTP.

→ Map: `secrets-rotation-after-vendor-breach` (rotate any creds an affected CLI touched); `ai-command-triage` (knowing what AI tooling looks like in process telemetry helps you spot the post-exploitation activity).

## Watch list

### Mythos / Project Glasswing CVE pipeline

Public confirmed count is small (CVE-2026-4747 in FreeBSD; reporting suggests CVE-2026-5588 in BC-Java may also be a Glasswing finding). Anthropic's marketing language ("over 99% of vulnerabilities found have not yet been patched") will produce a stream of CVEs over the next quarter; expect noise-vs-signal misalignment between scaffold-claimed severity and upstream maintainer classification.

→ Map: `vulnerability-disclosure-handling` ("On AI-discovered findings and severity gaps") — wait for upstream classification before patching the calendar; treat findings without a CVE as informational unless a maintainer says otherwise.

## Sector context

K-12 ransomware in 2025: 251 attacks worldwide, 130 in the US, 50 confirmed. Ransom demands down 33% (avg ~$464k vs ~$694k in 2024). Federal support shrinking — the US Department of Education's Office of Educational Technology was closed and the MS-ISAC K-12 cybersecurity programme was discontinued in 2025. Net effect: schools are increasingly on their own and need to internalise programme-level controls.

→ Map: `ransomware-readiness` (the 3-2-1-1 backup rule, IR retainer, tabletop annually); `phishing-defense-program` (the cheap counter to BEC-by-impersonation that drives most non-ransomware loss in K-12).

## Action checklist for this week

- [ ] Push April Patch Tuesday to the fleet, prioritising public-facing SharePoint and any Windows host with IKEv2 enabled
- [ ] Hunt for the BlueHammer / RedSun / UnDefend IOCs on Windows endpoints (binaries staged in `%USERPROFILE%\Pictures\` and `%USERPROFILE%\Downloads\<two-letter>\`, recon cluster, Defender definition-update failures)
- [ ] Inventory Vercel and Context.ai exposure; rotate per the playbook in `secrets-rotation-after-vendor-breach`
- [ ] Inventory Claude Code CLI / Agent SDK installs on managed devices; upgrade
- [ ] Inventory MCP-using AI tooling on managed devices; restrict to vetted server sources
- [ ] Verify your CISA KEV catalogue subscription and re-run a posture check; the April adds include items going back to 2009 (still being exploited)
- [ ] Confirm backups are immutable and that the last successful test-restore was within the last quarter
- [ ] Confirm the IR retainer / cyber-insurance hotline numbers are current and the right people know them

## Sources

- [CISA Adds Seven Known Exploited Vulnerabilities to Catalog (Apr 13)](https://www.cisa.gov/news-events/alerts/2026/04/13/cisa-adds-seven-known-exploited-vulnerabilities-catalog)
- [CISA Adds Two Known Exploited Vulnerabilities to Catalog (Apr 14)](https://www.cisa.gov/news-events/alerts/2026/04/14/cisa-adds-two-known-exploited-vulnerabilities-catalog)
- [CISA Adds One Known Exploited Vulnerability to Catalog (Apr 16)](https://www.cisa.gov/news-events/alerts/2026/04/16/cisa-adds-one-known-exploited-vulnerability-catalog)
- [Microsoft's April 2026 Patch Tuesday Addresses 163 CVEs (Tenable)](https://www.tenable.com/blog/microsofts-april-2026-patch-tuesday-addresses-163-cves-cve-2026-32201)
- [The April 2026 Security Update Review (Zero Day Initiative)](https://www.zerodayinitiative.com/blog/2026/4/14/the-april-2026-security-update-review)
- [Recently leaked Windows zero-days now exploited in attacks (BleepingComputer)](https://www.bleepingcomputer.com/news/security/recently-leaked-windows-zero-days-now-exploited-in-attacks/)
- [Three Microsoft Defender Zero-Days Actively Exploited (The Hacker News)](https://thehackernews.com/2026/04/three-microsoft-defender-zero-days.html)
- [BlueHammer & RedSun: Windows Defender CVE-2026-33825 Explained (Picus)](https://www.picussecurity.com/resource/blog/bluehammer-redsun-windows-defender-cve-2026-33825-zero-day-vulnerability-explained)
- [Vercel April 2026 security incident (Vercel KB)](https://vercel.com/kb/bulletin/vercel-april-2026-security-incident)
- [Vercel Breach Tied to Context AI Hack (The Hacker News)](https://thehackernews.com/2026/04/vercel-breach-tied-to-context-ai-hack.html)
- [Breaking: Vercel Breach Linked to Infostealer Infection at Context.ai (InfoStealers)](https://www.infostealers.com/article/breaking-vercel-breach-linked-to-infostealer-infection-at-context-ai/)
- [Vercel April 2026 incident-response playbook (OpenSourceMalware/GitHub)](https://github.com/OpenSourceMalware/vercel-april2026-incident-response)
- [Three CVEs in Claude Code CLI: Shell Injection to Exfiltration (Phoenix Security)](https://phoenix.security/claude-code-leak-to-vulnerability-three-cves-in-claude-code-cli-and-the-chain-that-connects-them/)
- [CVE-2026-35020 advisory (CVEFeed)](https://cvefeed.io/vuln/detail/CVE-2026-35020)
- [Anthropic Claude Code & Agent SDK OS Command Injection via Authentication Helper (VulnCheck)](https://www.vulncheck.com/advisories/anthropic-claude-code-agent-sdk-os-command-injection-via-authentication-helper)
- [The Mother of All AI Supply Chains: Critical, Systemic Vulnerability at the Core of Anthropic's MCP (OX Security)](https://www.ox.security/blog/the-mother-of-all-ai-supply-chains-critical-systemic-vulnerability-at-the-core-of-the-mcp/)
- [MCP STDIO Command Injection: Full Vulnerability Advisory (OX Security)](https://www.ox.security/blog/mcp-supply-chain-advisory-rce-vulnerabilities-across-the-ai-ecosystem)
- [Anthropic won't own MCP 'design flaw' putting 200K servers at risk (The Register)](https://www.theregister.com/2026/04/16/anthropic_mcp_design_flaw/)
- [Anthropic's Project Glasswing CVE count is still guesswork (The Register)](https://www.theregister.com/2026/04/15/project_glasswing_cves/)
- [Behind the Mythos hype, Glasswing has just one confirmed CVE (CSO Online)](https://www.csoonline.com/article/4159617/behind-the-mythos-hype-glasswing-has-just-one-confirmed-cve.html)
- [Claude Mythos Preview (Anthropic Red)](https://red.anthropic.com/2026/mythos-preview/)
- [We Reproduced Anthropic's Mythos Findings With Public Models (Vidoc Security Lab)](https://blog.vidocsecurity.com/blog/we-reproduced-anthropics-mythos-findings-with-public-models)
- [180 ransomware attacks plague education sector worldwide in 2025 through Q3 (K-12 Dive)](https://www.k12dive.com/news/first-dip-ransomware-attacks-quarters-since-2024-comparitech/804339/)
- [Ransomware attacks against education sector slow worldwide (K-12 Dive)](https://www.k12dive.com/news/ransomware-attacks-against-education-sector-slow-worldwide/811133/)
- [K-12 Cybersecurity (US Department of Education)](https://www.ed.gov/teaching-and-administration/safe-learning-environments/school-safety-and-security/k-12-cybersecurity)
- [Ransomware Reference Materials for K-12 School and School District IT Staff (CISA)](https://www.cisa.gov/stopransomware/ransomware-reference-materials-k-12-school-and-school-district-it-staff)
