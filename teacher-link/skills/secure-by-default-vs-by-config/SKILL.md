---
name: secure-by-default-vs-by-config
description: Evaluate a protocol, SDK, or platform by what it does out of the box rather than what it can be configured to do — and recognise the "it's a feature, not a bug" deflection that shifts security burden onto downstream integrators
domain: security
intent: analyze
lifecycle: stable
version: 0.1.0
type: skill
bloomLevel: Evaluate
argumentHint: the protocol, SDK, or platform you are about to adopt or have already adopted
---

# secure-by-default-vs-by-config — What does it do before you configure it?

A vendor can ship a protocol or SDK that is technically *configurable* into a secure posture, then point at the configuration when something goes wrong: "the framework is fine, you just had to opt in." A school IT lead evaluating that vendor needs to look at what the system does *before* anyone configures anything — because that is what most downstream users will run in production.

## When to use

- Procurement of an AI tool, SDK, MCP server, integration framework, or any component that sits at a privileged junction (auth, code execution, data access)
- A vendor responds to a vulnerability report with "it's a feature, not a bug" or "this is documented behaviour"
- An internal team is about to integrate a third-party SDK and you want a structured way to ask whether the defaults are safe

## When NOT to use

- Mid-incident — go to `incident-triage-checklist`; this is a procurement / architecture skill, not a response skill
- The component is already adopted and entrenched — use this to decide *what to harden*, not as a re-litigation of the original choice

## The honest sentence

"It can be configured securely" is not the same as "it is secure." For most users, most of the time, defaults are policy. A protocol that requires every downstream integrator to re-derive the secure configuration will be insecure in most deployments, regardless of what the docs say.

## Three questions to ask any vendor

1. **What does the simplest "hello world" deployment do?** If the quick-start guide produces an installation that executes arbitrary commands, exposes credentials, or skips authentication, that is the production posture for most users. Whatever a security-aware operator *can* do is irrelevant to what a typical operator *will* do.
2. **What does the system do when configuration is omitted or malformed?** Fail-closed (refuse to run, refuse to authorise, refuse to execute) is the safe default. Fail-open (assume permission, assume trust, assume valid input) shifts risk onto the integrator and onto the integrator's users.
3. **Who pays when the defaults are wrong?** If the vendor's response to a vulnerability is "downstream developers should have configured X," the burden has been shifted to the people with the *least* context and the *most* to lose. That is a structural problem, not a documentation problem.

## Workflow

1. **Install the component the way a normal user would.** Follow the official quick-start, no security hardening. Capture the resulting posture: what executes, what listens, what authenticates, what logs.
2. **Compare against the security guide.** What configuration would a fully-hardened deployment require? How many steps separate the quick-start from the hardened state?
3. **Look for vulnerability reports the vendor has rejected.** "Won't fix — by design" is a signal. One or two on edge cases is normal; a pattern means the vendor's threat model differs from yours.
4. **Score the failure modes.** What happens on missing config, malformed config, malicious input from a user the integrator trusts, malicious input from a user the integrator does not trust? A fail-closed system in all four cases is much stronger than a configurable one.
5. **Decide.** If the gap between default and safe is wide and the vendor's posture is "by design," your options are: don't adopt; adopt with a wrapper that enforces safe defaults at the edge; adopt and accept the residual risk in writing.
6. **Write down the wrapper or the residual.** The thing that makes this a school-IT skill rather than a research thought is that the decision needs to be findable later, when the staff who made it have moved on.

## Example

A school is evaluating an MCP server framework that lets AI agents call out to local tools. The quick-start spawns subprocesses based on agent input with no input validation. The vendor's reply to a public command-injection report is *"this is the documented behaviour; downstream integrators should sandbox the subprocess."*

Workflow:
- Install the quick-start, confirm: yes, the default config executes attacker-controlled strings.
- Read the hardening guide: requires per-tool allow-lists, a sandbox runtime, and a custom validator. Twelve steps from quick-start to safe.
- Check the issue tracker: three more "won't fix — by design" rejections in the last six months in the same general area.
- Failure-mode score: missing config = arbitrary execution; malformed config = arbitrary execution; trusted user = arbitrary execution they didn't intend; untrusted user = full compromise.
- Decision: don't adopt this server in this form. If the use case is critical, build a sandbox wrapper that enforces an allow-list at the edge before the framework sees the request, document the wrapper as load-bearing, and review it at every framework upgrade.

## Error handling

If you adopted the component before this skill existed and the gap is now obvious: don't ship a panicked rip-and-replace. Inventory where the component is in use, prioritise the deployments where the failure mode actually reaches sensitive data or untrusted input, and either retrofit a wrapper or migrate those first. Re-evaluate the rest on the next upgrade boundary.

## Provenance

Informed by ongoing public arguments about *secure-by-default* responsibilities at protocol layer — including the OX Security disclosure of arbitrary command execution in MCP-server implementations and Anthropic's response framing the behaviour as documented design rather than a vulnerability. Cited as a public industry example to illustrate the burden-shifting pattern, not as a verdict on any specific product.
