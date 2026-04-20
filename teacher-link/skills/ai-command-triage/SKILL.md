---
name: ai-command-triage
description: Distinguish AI-generated shell commands (Codex, Copilot CLI, similar) from attacker living-off-the-land activity, so EDR alerts on a user's own AI tooling don't look identical to an intrusion
domain: security
intent: analyze
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Analyze
argumentHint: the suspicious command line or process tree
---

# ai-command-triage — Was that you, the user, or the attacker?

A user running an AI coding agent (Codex, Copilot CLI, Cursor's terminal) on a school endpoint produces shell commands that look uncomfortably similar to attacker living-off-the-land: long one-liners, `curl` to localhost, base64-piped scripts, snapshot files in `~/.codex/shell_snapshots/`. EDRs alert on the shape, not the intent. This skill gives a triage analyst a working separation.

## When to use

- An EDR alert fires on a Linux or macOS endpoint where the user is known to use Codex / Copilot CLI / Cursor terminal
- A long, chained shell command shows up in process telemetry and you can't immediately attribute it
- You're auditing a host and want to label which commands were AI-generated before you start hunting attackers

## When NOT to use

- The host has no known AI tooling installed — assume attacker until proven otherwise
- You've already found unambiguous IOCs (cryptominer binary, unfamiliar persistence) — go straight to `incident-triage-checklist`

## What AI-generated commands tend to look like

- A `bash -c` wrapper that sources a snapshot file: `if . '/home/USER/.codex/shell_snapshots/...sh' >/dev/null 2>&1; then :; fi exec '/bin/bash' -c '<inner>'`
- An inner command that is *plausibly something a user would do* — a curl to localhost on the dev port, a `make test`, a `psql -c "select ..."`
- Heavy use of `>/dev/null 2>&1` and `; :; fi` patterns the snapshot wrapper inserts
- Working directory is the user's project, not `/tmp`, `/var/tmp`, `/dev/shm`, or a hidden dotfolder

## What attacker LotL tends to look like

- Working directory under `/tmp`, `/var/tmp`, `/dev/shm`, or a two-letter hidden subfolder of `Downloads`
- Binaries renamed to short names (`z.exe`, `x`) or named after legitimate system services (`systemd-logind` in `/var/tmp`)
- Outbound connections to high-numbered ports on residential IP ranges or known mining-pool ports
- Recon clusters: `whoami /priv`, `cmdkey /list`, `net group` in quick succession (Windows); `id`, `cat /etc/passwd`, `crontab -l`, `find / -perm -4000` (Linux)
- Persistence writes: cron, systemd units, shell rc files, SSH `authorized_keys`, scheduled tasks

## Workflow

1. **Look at the parent process.** Codex sets a recognisable parent and a snapshot-file path. Cursor's terminal runs under its renderer process. If the parent is `sshd` from an unexpected source IP, that's not your user.
2. **Look at the user.** A non-interactive system account running shell one-liners during business hours is a flag; a logged-in developer account doing the same is normal.
3. **Look at the working directory and target.** AI agents act on the user's repo; attackers act on system files, credential stores, and process listings.
4. **Look at the cluster.** AI sessions cluster around a single project; attacker sessions cluster around recon, persistence, and lateral movement.
5. **Cross-reference Codex artefacts.** `~/.codex/shell_snapshots/<uuid>.sh` and the chat transcript, if accessible, will tell you whether the command originated from a user prompt.
6. **If still ambiguous:** call the user. They will know whether they were running Codex at that timestamp.

## Example

EDR fires on `bash -c if . '/home/REDACTED/.codex/shell_snapshots/<uuid>.sh' >/dev/null 2>&1; then :; fi exec '/bin/bash' -c 'curl -I http://127.0.0.1:3016/api/health'`. Parent is the Codex CLI. Working dir is the user's web-app project. Target is localhost on the dev port. Verdict: legitimate AI command, suppress this signature for this user, move on. (See the Huntress *Codex Red* case study for a real-world incident where missing this distinction cost analyst time.)

## Error handling

If you suppressed an AI signature and later find genuine compromise on the same host: do not assume the AI tooling was the entry vector — re-run the full triage from scratch. Mid-incident hosts can host *both* AI tooling and an attacker simultaneously, and the AI tooling can mask the attacker's noise.
