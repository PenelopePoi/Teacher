---
name: edr-basics-for-schools
description: What an EDR agent does, what coverage gaps cost in a school environment, and how to think about EDR as part of a layered defence rather than a magic bullet
domain: security
intent: analyze
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Analyze
argumentHint: a fleet description (count, OS mix, current EDR)
---

# edr-basics-for-schools — What it is, what it isn't

EDR (Endpoint Detection and Response) is an agent on every endpoint that watches process / file / network activity, sends telemetry to a SOC, and lets responders contain a host remotely. For schools it is often the difference between *we noticed* and *we read about ourselves in the news*.

## When to use

- Evaluating a managed EDR product against the school's actual fleet
- Briefing leadership on why "we have antivirus" is not the same as having EDR
- Sizing the gap between coverage and the fleet (the laptops in the music room, the science department's Linux box, BYOD)

## When NOT to use

- Reviewing alerts in the SOC console — that's `incident-triage-checklist`
- Buying decisions about pricing models — that's procurement, not this skill

## What EDR actually does

- **Telemetry.** Records process trees, file writes, network connections, command lines.
- **Detections.** Pattern-matches and behavioural-models the telemetry against known-bad activity.
- **Response.** Lets a SOC isolate a host, kill a process, or roll back a change without physically touching the device.

## What EDR doesn't do

- It doesn't see what happened *before* the agent was installed. Mid-incident installs leave a telemetry gap — see `mid-incident-edr-install`.
- It can't help on devices it isn't installed on. Coverage gaps are where attackers live.
- It is not a replacement for backups, patching, MFA, or training. It is the layer that catches what the others miss.

## Workflow

1. **Inventory the fleet.** Every device that touches the school network. Count by OS.
2. **Map coverage.** Which devices have the agent? Which don't? Why?
3. **Close the gaps you can.** Push the agent to the unmanaged devices first; they are the highest-value gap.
4. **Decide the gaps you can't.** Personal devices, contractor laptops — write down the compensating controls (network segmentation, conditional access).
5. **Rehearse the response.** Confirm the SOC can actually isolate a host. Run a tabletop once a term.

## Example

A K-12 district has the agent on 800 of 1,000 endpoints. The 200 gaps are all in the language lab (Linux). Decision: deploy the agent to the lab on the next maintenance window; until then, segment the lab VLAN so a compromise can't pivot to the student-record systems.

## Error handling

If the agent's heartbeat goes silent on a device: treat it as suspicious until proven otherwise. A genuinely down agent and an attacker who killed the agent look the same on day one. Reach out, verify the device is on the user's desk, and re-install if needed.
