# cybersecurity-for-education — bundle README

This folder is the source of truth for the 44-skill cybersecurity-for-education bundle. To make these skills discoverable by `SkillEngineService` (which scans `~/.claude/skills/` recursively for `SKILL.md` files), symlink each skill folder into your skills root.

## One-time symlink (Linux/macOS)

```bash
SKILLS_SRC="$(pwd)/teacher-link/skills"
SKILLS_DST="$HOME/.claude/skills"
mkdir -p "$SKILLS_DST"

# Bundle entry
ln -snf "$SKILLS_SRC/cybersecurity-for-education" "$SKILLS_DST/cybersecurity-for-education"

# Student track (11)
for skill in phishing-spotter password-hygiene safe-browsing social-engineering-101 \
             ransomware-basics data-classification-for-students device-hygiene \
             report-suspicious-activity academic-integrity-and-ai-use \
             cyberbullying-response account-recovery-basics; do
  ln -snf "$SKILLS_SRC/$skill" "$SKILLS_DST/$skill"
done

# Educator / IT track (33)
for skill in edr-basics-for-schools incident-triage-checklist ai-command-triage \
             phishing-defense-program ransomware-readiness fight-fraud-mapping \
             student-data-protection vulnerability-disclosure-handling \
             mid-incident-edr-install mythos-class-risk-roadmap \
             secrets-rotation-after-vendor-breach model-tier-by-task \
             secure-by-default-vs-by-config pqc-readiness-for-schools \
             mfa-rollout-for-schools bec-gift-card-scam-defense \
             email-authentication-for-schools backup-restore-drill \
             tabletop-exercise-design chromebook-fleet-security \
             ai-use-inventory ferpa-data-breach-notification \
             vendor-dpa-review identity-provider-hardening \
             cipa-compliant-web-filtering network-segmentation-for-schools \
             workspace-365-backup staff-offboarding-and-contractor-hygiene \
             printer-and-mfp-security board-reporting-cyber-risk \
             holiday-break-ir-posture erate-and-cyber-grant-funding \
             vendor-offboarding-and-data-return; do
  ln -snf "$SKILLS_SRC/$skill" "$SKILLS_DST/$skill"
done
```

After symlinking, restart the Theia backend so `SkillRegistry.scanSkills()` re-runs. You should see a log line like `Scanned N files, loaded M skills` from `[SkillRegistry]`.

## Verifying in the IDE

1. `npm run start:browser` and open `http://localhost:3000`.
2. Open the Skill Launcher (`Ctrl+Shift+S`).
3. Filter by `security` — 33 educator/IT skills should appear.
4. Filter by `education` — 11 student skills should appear (alongside any other education-domain skills).
5. Expand any skill and click **Execute** — the rendered `SKILL.md` body shows in the result panel with a score and duration.

## Removing the symlinks

```bash
for name in cybersecurity-for-education phishing-spotter password-hygiene safe-browsing \
            social-engineering-101 ransomware-basics data-classification-for-students \
            device-hygiene report-suspicious-activity edr-basics-for-schools \
            incident-triage-checklist ai-command-triage phishing-defense-program \
            ransomware-readiness fight-fraud-mapping student-data-protection \
            vulnerability-disclosure-handling mid-incident-edr-install \
            mythos-class-risk-roadmap secrets-rotation-after-vendor-breach \
            model-tier-by-task secure-by-default-vs-by-config \
            pqc-readiness-for-schools mfa-rollout-for-schools \
            bec-gift-card-scam-defense email-authentication-for-schools \
            backup-restore-drill tabletop-exercise-design \
            chromebook-fleet-security ai-use-inventory \
            ferpa-data-breach-notification vendor-dpa-review \
            identity-provider-hardening academic-integrity-and-ai-use \
            cyberbullying-response account-recovery-basics \
            cipa-compliant-web-filtering network-segmentation-for-schools \
            workspace-365-backup staff-offboarding-and-contractor-hygiene \
            printer-and-mfp-security board-reporting-cyber-risk \
            holiday-break-ir-posture erate-and-cyber-grant-funding \
            vendor-offboarding-and-data-return; do
  rm -f "$HOME/.claude/skills/$name"
done
```
