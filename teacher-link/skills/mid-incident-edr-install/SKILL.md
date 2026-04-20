---
name: mid-incident-edr-install
description: When EDR is installed mid-compromise (no historical telemetry), use the gap reasoning to investigate without pretending you have data you don't have
domain: security
intent: analyze
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Analyze
argumentHint: the host where EDR was just installed and the symptoms that prompted it
---

# mid-incident-edr-install — When the agent goes in after the attacker

A common school scenario: a teacher's laptop has been "weird" for a week, IT installs the EDR agent today, and within minutes alerts fire. The agent only sees what's happening *now*. Everything before the install is invisible. This skill is about investigating honestly within that constraint.

## When to use

- An EDR agent has been freshly installed on a host that already had symptoms
- A SOC partner flags that the host's earliest telemetry is younger than the suspected compromise
- You are reviewing an incident report and notice the agent install timestamp post-dates the suspicious activity

## When NOT to use

- The agent has been installed since before any plausible compromise — full historical telemetry exists; treat it as a normal investigation
- The host is being decommissioned anyway — reimage and move on; investigation has diminishing returns

## The honest framing

You will not be able to determine the initial access vector from EDR alone. Don't invent one. The investigation produces:
- A current-state inventory of the host (running processes, services, scheduled tasks, persistence locations, network connections)
- A list of suspicious artefacts found on disk that pre-date the install (look at file mtimes, not telemetry)
- A best-effort containment plan based on what you found

## Workflow

1. **Acknowledge the gap in writing.** The incident report should say: "EDR installed at HH:MM on YYYY-MM-DD; activity prior to that timestamp is not directly visible."
2. **Snapshot the current state.** Process tree, listening ports, established connections, logged-in users, scheduled tasks, cron, systemd timers, shell histories.
3. **File-system archaeology.** Look in the places attackers stage:
   - Linux: `/tmp`, `/var/tmp`, `/dev/shm`, hidden dotfolders in `$HOME`, `~/.ssh/authorized_keys`, `~/.bash_history`
   - Windows: `%TEMP%`, `%APPDATA%`, two-letter subfolders of `Downloads`, scheduled tasks, run keys, services
4. **Compare file mtimes against the install time.** Anything modified before the install is pre-existing; anything modified after is the agent or live activity.
5. **Look for renamed binaries and impostors.** A `systemd-logind` in `/var/tmp/` is not the real one. A `z.exe` in `Downloads\xy\` is not normal.
6. **Hunt for persistence,** because attackers usually plant it early. SSH keys, cron jobs, scheduled tasks, run keys, browser extensions, malicious launch agents.
7. **Hunt for known data-exfil signs:** credential stores accessed (`.aws/credentials`, `~/.config/gcloud/`, browser cookie/login databases), unusual DNS / outbound traffic visible in current-state telemetry.
8. **Decide containment.** Often the right call is: image, wipe, rebuild from a known-good baseline. With no historical telemetry, "I cleaned it up" is a guess; "I rebuilt it" is a fact.
9. **Cross-reference with the user.** Did they install anything unusual? Did they use AI tooling? (See `ai-command-triage` — AI-generated commands on the host can look suspicious in current telemetry; rule that in or out before chasing ghosts.)

## Example

Huntress agent goes onto a Linux dev box at 17:30; alerts fire on a `systemd-logind` running from `/var/tmp` since boot. The binary's mtime is from August of the previous year. Investigation finds it is a Monero miner from a prior compromise that the user never noticed; the recent symptom (loud fans) had been masked, not fixed, by an AI coding agent's CPU-throttling suggestion. Containment: kill the miner, remove its persistence, image-and-rebuild the host before returning it to the user. (This pattern is documented publicly in the Huntress *Codex Red* case study.)

## Error handling

If you find an active credential-stealing process: assume those credentials are already in attacker hands. Rotate immediately, regardless of how confident you are in containment. Investigation is for understanding; rotation is for limiting damage. Do both.
