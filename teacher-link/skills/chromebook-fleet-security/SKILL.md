---
name: chromebook-fleet-security
description: Secure a Chromebook fleet using the admin console's native controls — verified boot, ephemeral profiles, enrolment, and the forced-managed-extensions allow-list — rather than treating ChromeOS like a stripped-down Windows laptop
domain: security
intent: guard
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Apply
argumentHint: the fleet (device count, OUs, user population)
---

# chromebook-fleet-security — Use the console, not a third-party overlay

ChromeOS is not Windows with a Chrome sticker. It has its own security model — verified boot, mandatory sandboxing, per-user ephemeral profiles, an admin console as the single policy surface. Most school Chromebook security problems are not ChromeOS weaknesses; they are schools trying to secure ChromeOS using concepts borrowed from Windows fleet management.

## When to use

- Standing up a new Chromebook fleet or inheriting one without a written baseline
- A fleet review after turnover of the IT lead who originally configured the admin console
- A specific incident (extension abuse, account-sharing, off-hours misuse) that prompts a policy rethink

## When NOT to use

- Non-ChromeOS devices — `device-hygiene` is the general-device skill
- Google Workspace identity policy specifically — use `identity-provider-hardening` in conjunction; there is overlap

## The ChromeOS security features you already have

- **Verified boot** on every power-on. ChromeOS checks its own firmware and OS integrity; a compromised device fails to the recovery screen.
- **Sandboxed everything.** Each tab, each extension, each Android/Linux app runs in its own sandbox.
- **Ephemeral user profiles** (if enabled). Sign-out wipes the user's session; next sign-in is clean.
- **Forced re-enrolment.** A wiped device re-enrols automatically into the same OU, keeping policies attached to the device, not the user.
- **Automatic updates.** OS patches install on reboot; no IT action required. Your job is to ensure devices reboot.

## The policies that actually matter in the admin console

1. **Enrolment required.** Every device on the fleet is enrolled into a district OU; "consumer" sign-in blocked.
2. **User sign-in restriction.** Only `*@yourschool.edu` may sign in; block personal Google accounts outright.
3. **Forced re-enrolment** on device wipe; makes stolen or resold devices harmless.
4. **Ephemeral mode** on shared-device OUs (classroom carts). Privileged OUs (staff-assigned) stay persistent for usability.
5. **Extension allow-list.** Only installs from an explicit allow-list; blocks the sprawling ecosystem risk. Pre-install educator-approved extensions; users cannot sideload.
6. **Safe Browsing enhanced.** Enabled district-wide.
7. **Guest mode disabled** on managed devices; removes a sign-in-as-anyone path.
8. **Incognito disabled** for student OUs; keeps Family Link / content-filtering logs honest.
9. **USB restrictions** on classroom-cart OUs; reduces the baiting risk.
10. **Auto-update to the latest stable channel.** Stay on LTS only if the fleet has a compatibility constraint.

## Workflow

1. **Audit the OU tree.** Every device in an OU; every OU with the right policies. A flat fleet with everything at the top level is the single biggest mistake; sub-OUs give you the granularity you need for staff vs. classroom carts vs. 1:1 student devices.
2. **Apply baseline policies at the top** and differentiate only where justified. Fewer policy variations is less breakage.
3. **Build the extension allow-list from observed need.** Don't allow hundreds "just in case"; start small and respond to teacher requests individually.
4. **Verify the auto-update posture.** The admin console reports devices on out-of-support versions. Schedule reboots (e.g., forced restart during non-school hours) if staff leave lids open for weeks.
5. **Enable alert rules** in the admin console: policy violations, suspicious sign-ins, admin privilege changes. These feed the existing SOC / IT-monitoring pipeline.
6. **Document the Auto Update Expiration (AUE) of each model** and the replacement budget. A device past AUE stops receiving updates; past AUE it belongs to the decommissioning queue.

## Example

A district with 5,000 Chromebooks in a flat OU moves to three top-level OUs (staff, student-carts, student-1:1) with four baseline policies applied district-wide and only sign-in-restriction and ephemeral-mode differentiated per OU. Extension allow-list starts at twelve educator-requested items, reviewed monthly. Auto-update compliance jumps from 71% to 98% after the admin console schedules off-hours reboots. Two models past AUE are scheduled for replacement in the next fiscal year.

## Error handling

If a teacher's workflow breaks because of a policy change: do not make an exception at the user level. Identify the workflow, evaluate whether the policy is correct, and either adjust the baseline or grant the exception at the OU level with a documented review date. Per-user exceptions become the new baseline and erode the fleet's posture.

## Provenance

Aligned with Google's ChromeOS admin-console documentation and the CIS Benchmark for Chrome OS. Cited as public vendor and standards-body guidance, not as endorsement of any specific ChromeOS management add-on.
