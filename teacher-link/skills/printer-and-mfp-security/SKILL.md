---
name: printer-and-mfp-security
description: Harden copiers and multi-function printers — they scan student data, they store it on internal disks, they speak legacy protocols, and they are the asset class most schools forget to secure until the lease ends and the hard drive walks out the door
domain: security
intent: guard
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Analyze
argumentHint: the MFP fleet size, vendor mix, and whether the fleet is owned or leased
---

# printer-and-mfp-security — The overlooked storage system

A modern multi-function printer is a Linux box with a hard drive, a scanner, a network stack, a web admin panel, and — usually — a stored history of every document scanned, copied, faxed, or printed. In a school, that history is student data: IEPs, test results, nurse-office paperwork, parent correspondence. Schools inventory laptops, patch servers, and forget the printer. At lease-end, the MFP goes back to the vendor with its disk intact. This skill closes that gap.

## When to use

- Annual IT posture review.
- New MFP procurement or lease renewal (the window to bake in security requirements).
- An MFP is being retired, replaced, relocated between buildings, or shipped back to the vendor.
- You are mapping the FERPA-scope data footprint and realise "scanned documents" is not in your inventory yet.

## When NOT to use

- Student-data handling on teacher laptops — that is `student-data-protection`.
- Network segmentation of the printer fleet — the printer lives on the `iot` segment from `network-segmentation-for-schools`; this skill covers the device itself.

## The eight MFP hardening controls

1. **Admin credentials.** Change the default admin password on every device; store in the password manager; rotate on staff change. Default `admin / 1234` is a scanner-and-search finding at most fleets.
2. **Admin-panel access.** Bind the admin web UI to the staff-admin segment only; do not expose to the student VLAN. If the vendor supports HTTPS with a real certificate, enable it. Disable HTTP.
3. **Protocol hygiene.** Disable legacy and unused protocols: Telnet, FTP, SNMPv1/v2c (leave only SNMPv3 with auth), LPD if not used, raw port 9100 if not used, SMB1 (always), WSD if not used. Turn off "Auto-install printer on network" Windows broadcasts if the vendor supports it.
4. **Scan-to-destination.** Scan-to-email with authenticated SMTP or OAuth, not open relay. Scan-to-network-folder with a service account that has only the share's write permission, not domain-admin. Scan-to-USB disabled or PIN-gated. No scan-to-public-cloud without authentication.
5. **Authentication at the panel.** Badge or PIN before a walk-up user can scan to email or release a print job. Prevents both casual browsing of held jobs and scan-to-their-own-address exfiltration.
6. **Storage encryption.** Enable the device's internal-disk encryption (almost every modern enterprise MFP supports it; almost none ship with it on). Document the recovery procedure.
7. **Data-sanitization / image-overwrite.** Enable "image overwrite" or equivalent so the latent copy of each scan / print job is wiped after the job completes. On end-of-life, run a full-device wipe that overwrites the disk per NIST SP 800-88 or remove and physically destroy the disk.
8. **Firmware.** Subscribe to the vendor's security bulletins; patch annually at minimum, quarterly for high-fleet-count districts. Firmware holds known exploitable CVEs; the supply chain is not trivial. Use the vendor's fleet-management console if one exists.

## Lease-end and vendor-return

The MFP's disk has student data on it. Do not ship the disk back.

- Run the device's "data sanitization" / "HDD format" flow with "verified" checked — NIST 800-88 Clear / Purge, as the vendor supports.
- If the device supports disk removal, remove the disk, physically destroy it, and ship the device back without it (document the disk destruction).
- If the vendor contract explicitly requires the disk return intact, negotiate a disk-destroy-on-pickup clause before the lease starts — not at pickup.
- Maintain a certificate of data destruction, signed, in the offboarding case file (mirrors `vendor-offboarding-and-data-return`).

## Workflow

1. **Inventory the fleet.** Make / model / location / serial / disk type / vendor / lease-end date.
2. **Pull each device's admin panel** and audit against the eight controls. Record findings.
3. **Change default credentials.** First. Today. If you do nothing else from this skill, do this.
4. **Segment the fleet** onto `iot` per `network-segmentation-for-schools`. Allow-list only: vendor cloud management endpoints, NTP, print-server inbound.
5. **Enable image-overwrite and disk encryption** across the fleet with the vendor console.
6. **Deploy badge / PIN authentication** at the panel (most modern fleets include this; it is a licensing choice at procurement).
7. **Patch firmware** to current; schedule the cadence.
8. **Write the end-of-life / lease-return procedure** into the offboarding playbook so it runs every time a device leaves the building.
9. **Annual audit**: re-run the checks; patch-level, default-cred scan, image-overwrite enabled.

## Example

A district audits 46 MFPs across 11 buildings before a 60-month lease renewal. Findings: 28 on default admin credentials; 41 with SNMPv1 enabled; 46 with image-overwrite off; 32 with scan-to-any-email open; zero with encrypted disks; six units past firmware-support end-of-life (replace at renewal).

Actions:
- Defaults rotated to unique admin credentials via fleet console in one afternoon.
- SNMPv1 / Telnet / FTP disabled fleet-wide.
- Scan-to-email scoped to authenticated outbound; badge release on panel enabled.
- Image-overwrite and disk encryption turned on (required a firmware bump on 18 units).
- Lease renewal adds a "disk destroyed on unit return" clause and makes badge authentication a required feature in every unit procured.

Three years later, at lease-end, each returning unit's disk is shredded on-site; certificates filed with each unit's serial.

## Error handling

If the vendor says they need SNMPv1 or Telnet for fleet management: they do not. Every major MFP vendor supports SNMPv3 and HTTPS-based fleet management. Push back; if they will not, pick a different vendor at renewal.

If image-overwrite slows the device noticeably on heavy print queues: select the "after each job" schedule or the batched "overnight" mode; do not disable. A slightly slower print queue is cheaper than a FERPA incident.

If you inherit a fleet whose lease is ending next month and you did not run the full hardening in time: prioritise the disk destruction / sanitization path for return. That is the non-negotiable. Everything else can be fixed on the incoming fleet.

## Provenance

Based on NIST SP 800-88 Rev. 1 (Media Sanitization), the CIS Multi-Function Devices benchmark family, and HP / Xerox / Canon / Ricoh security-configuration guides. Cross-references `network-segmentation-for-schools` (IoT placement), `student-data-protection` (data classes scanned by MFPs), and `vendor-offboarding-and-data-return` (lease-end).
