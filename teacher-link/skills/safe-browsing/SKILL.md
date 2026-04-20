---
name: safe-browsing
description: Read browser indicators, treat downloads with caution, and use sandboxes or guest profiles for anything you do not fully trust
domain: education
intent: teach
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Apply
argumentHint: site or download you want to evaluate
---

# safe-browsing — Trust the browser, then verify

Modern browsers do a lot for you. Reading what they're already telling you closes most of the gap; the rest is download discipline and a healthy use of guest profiles.

## When to use

- A learner is about to download a file from an unfamiliar source
- A site asks for credentials, files, or webcam/microphone access
- You are teaching a class to do their own basic site triage

## When NOT to use

- The browser has flagged the site outright as deceptive — that is not a teaching moment, that is a "back away" moment
- The user is being actively coached through a remote-support call by a stranger — likely social engineering; route to `social-engineering-101`

## Workflow

1. **Address bar first.** Look at the domain, not the page contents. `https://login.google.com` is different from `https://login.google.com.evil.tld`.
2. **HTTPS is necessary, not sufficient.** A padlock means the connection is encrypted, not that the site is honest. Phishing sites use HTTPS too.
3. **Permissions prompts.** Camera, microphone, location, notifications — say no by default. Only allow when a known site needs it for a known reason.
4. **Downloads.** Check the file extension carefully: `report.pdf.exe` is an executable, not a PDF. Prefer official app stores over random installers.
5. **Sandbox unknowns.** Open suspicious links in a guest profile or an incognito window with no logged-in accounts. Run unknown executables in a VM, not on the daily-driver laptop.
6. **Extensions.** Install fewer of them. Each one can read everything you do; some have been sold to malicious owners after the fact.

## Example

A student wants to install a PDF-to-Word converter from a search-result ad:
- The top three results are all ads (sponsored).
- The official site is the fourth result.
- Even on the official site, the download is a `.exe` rather than a Microsoft Store package.
- Decision: skip it; use the school's existing PDF tooling.

## Error handling

If a download fires a Defender / SmartScreen warning: do not bypass it. Right-click → delete. If you already ran it: disconnect the device from the network, run a full antivirus scan, tell IT, and follow `incident-triage-checklist` if signs of compromise persist.
