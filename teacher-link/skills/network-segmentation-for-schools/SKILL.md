---
name: network-segmentation-for-schools
description: Split student, staff, guest, IoT, and SIS traffic onto separate network segments with explicit allow-lists between them — so a compromised Chromebook cannot talk to the SIS and a compromised thermostat cannot talk to anything
domain: security
intent: guard
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Evaluate
argumentHint: the current network topology (VLANs, SSIDs, wired subnets) and the critical systems that need protection
---

# network-segmentation-for-schools — Flat networks are generous networks

A flat network is generous to attackers. Once a single device is compromised, lateral movement is trivial: the student Chromebook, the classroom printer, the HVAC controller, the SIS, the finance server — all share one broadcast domain. The school becomes compromisable at the weakest endpoint. Segmentation is the architectural answer: separate networks for separate trust levels, with explicit allow-lists (not default-deny-with-exceptions-everywhere) between them.

## When to use

- Annual infrastructure review; segmentation is a zero-trust foundation item.
- After an incident where lateral movement expanded the blast radius.
- Network refresh — new switches, new Wi-Fi, new firewall.
- Adoption of a significant new IoT fleet (cameras, HVAC, door locks).
- E-rate Category 2 funding cycle — segmentation-enabling gear is eligible.

## When NOT to use

- Mid-incident — containment is immediate VLAN-isolation of the affected host, not a segmentation redesign. Go to `incident-triage-checklist`.
- A school with a single switch and no VLAN-capable gear — address procurement first; segmentation requires VLAN-capable L2/L3 equipment and a firewall that can enforce inter-VLAN policy.

## The five-segment model

| Segment | Who / what is on it | Trust | Allowed talking to |
|---|---|---|---|
| `sis-admin` | SIS servers, HR, finance, student-records systems | Highest | Staff-admin segment on specific ports/protocols only |
| `staff-admin` | IT admins, teacher workstations handling student records | High | `sis-admin` (limited), internet (filtered), `staff-general` |
| `staff-general` | Teacher laptops, classroom PCs | Medium | Internet (filtered), print server, file share; *not* `sis-admin` |
| `student` | Student Chromebooks, tablets | Low | Internet (filtered per CIPA), learning-platform allow-list; *not* other segments |
| `iot` | Cameras, HVAC, door locks, printers, AV, signage | Lowest (IoT is untrustworthy by default) | Outbound to specific vendor-cloud endpoints only; *not* student, staff, or SIS |
| `guest` | BYOD staff phones, visitors | Isolated | Internet only; no lateral connectivity; client isolation on |

A sixth segment — `quarantine` — holds compromised or pre-joined devices with no inbound/outbound except the NAC posture-check path.

## Workflow

1. **Map the current topology.** Every VLAN, every SSID, every wired subnet, and every inter-VLAN route. If it is "one flat /16," that is the finding.
2. **Classify every connected device** into one of the six segments above. Inventory with MAC and role. Phantom devices ("I don't know what that is") go to `iot` by default — they almost always belong there.
3. **Design the inter-segment policy matrix.** One row per source, one column per destination. Each cell is allow (with ports) or deny. Default deny between segments.
4. **Procure or repurpose firewall capacity** to enforce inter-VLAN policy. A modern firewall, a L3 switch with ACLs, or a modern SD-branch appliance can all do this; the point is enforcement exists.
5. **Stand up the six VLANs**, DHCP scopes, and SSIDs. Client-isolation on student and guest Wi-Fi.
6. **Migrate devices into segments** in waves. IoT first (almost nothing will break; the default of "can talk to anything" is rarely used legitimately). Then staff. Then students. SIS and finance are a careful move and usually go last with a maintenance window.
7. **Enforce the inter-segment policy** — start in log-only ("what would have been blocked?") to find the handful of legitimate crossings you missed. Then flip to enforce.
8. **Add NAC or 802.1X** to authenticate devices onto the right segment. Posture-check on join. Unmanaged device → `guest` or `quarantine`.
9. **Document.** The segmentation diagram, the policy matrix, the DHCP / Wi-Fi config, the exceptions list, the review cadence.
10. **Re-audit quarterly** — new devices drift into the wrong segment, new exceptions pile up, shadow IoT appears. Catch it early.

## Example

A 4,500-student district finds four VLANs (a 1992-style split: servers, wired workstations, Wi-Fi, "other") and a flat HVAC bus that can reach the SIS. After segmentation:

- `sis-admin` VLAN isolated behind the firewall; only named staff workstations can reach it on specific ports.
- `iot` VLAN created; 412 cameras, 180 HVAC controllers, 63 door locks, 90 printers migrated. HVAC vendor escalation reveals one hardcoded route needed; allow-listed explicitly.
- `staff-general`, `staff-admin`, `student`, `guest` SSIDs separated on Wi-Fi with per-SSID VLAN mapping.
- Log-only mode runs two weeks. Eleven legitimate inter-segment flows are discovered and allow-listed (e.g., printer print-queue reach from staff to `iot`).
- Enforce mode on. 90 days later, a student Chromebook is compromised via a browser zero-day; the attacker cannot reach the SIS or any staff device. Contained at the segment.

## Error handling

If legitimate services break after enforcement: do not disable the firewall policy for the whole segment — find the specific flow, add it to the allow-list with rationale, keep the rest enforced. "The filter was on, then we turned it off, then we got hit" is the most common story in the FBI IC3 school caseload.

If an HVAC / printer / door-lock vendor insists their device needs unrestricted network access: they are wrong. The allow-list is vendor-specific outbound endpoints for cloud management and NTP. If a vendor cannot or will not name those endpoints, the device is not ready for a school network.

## Provenance

Aligned with NIST SP 800-207 (Zero Trust Architecture), NIST SP 800-53 SC-7 (boundary protection), and CIS Controls v8 Control 12 (Network Infrastructure Management) and Control 13 (Network Monitoring and Defense). K-12-specific guidance from MS-ISAC and CISA K-12 cybersecurity bulletins.
