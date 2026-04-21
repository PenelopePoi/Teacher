/**
 * KEV-Guardian orchestrator skeleton per §29.4 of the paper.
 *
 * Exposure Gate → Epiplexity Index → Compensating Controls → Proof-of-Fix.
 *
 * This is a deliberately minimal state machine. It ships with one
 * fixture vulnerability and no live feed integration. Full CISA KEV
 * ingestion is out of scope for v1 (see plan file).
 */

export interface Vulnerability {
    readonly cveId: string;
    readonly title: string;
    /** CISA KEV-flagged? (True means exploited-in-the-wild.) */
    readonly exploitedInWild: boolean;
    /** Reachability of the component in the deployed asset graph (0–1). */
    readonly reachability: number;
    /** Privilege level required by the component (0–1; 0 = unprivileged). */
    readonly privilege: number;
    /** Is a patch available? */
    readonly patchAvailable: boolean;
    /** Compensating controls available if patching is blocked. */
    readonly compensatingControls: readonly string[];
}

export type GateResult = 'in-scope' | 'out-of-scope';

export type RemediationStrategy = 'patch' | 'compensating-control' | 'accept-risk-with-approval' | 'defer';

export interface OrchestratorDecision {
    readonly vulnerability: Vulnerability;
    readonly gate: GateResult;
    readonly epiplexityScore: number;
    readonly strategy: RemediationStrategy;
    readonly proofOfFixSteps: readonly string[];
    readonly reason: string;
}

/** Exposure Gate: does this vulnerability enter the guardian's scope? */
export function exposureGate(v: Vulnerability): GateResult {
    // v1 heuristic: KEV-flagged OR reachability > 0.
    // Unreachable non-KEV items are out of scope (noise reduction).
    if (v.exploitedInWild) return 'in-scope';
    if (v.reachability > 0) return 'in-scope';
    return 'out-of-scope';
}

/**
 * Epiplexity Index: components ranked by exploitedness × reachability × privilege.
 *
 * High score = more structural information about the real threat, per the
 * paper's framing — more "actionable signal per unit of analyst attention".
 */
export function epiplexityIndex(v: Vulnerability): number {
    const exploit = v.exploitedInWild ? 1 : 0.2;
    return exploit * v.reachability * v.privilege;
}

/** Choose a remediation strategy given the vulnerability and an org patch-capability flag. */
export function chooseStrategy(v: Vulnerability, canPatchNow: boolean): RemediationStrategy {
    if (canPatchNow && v.patchAvailable) return 'patch';
    if (v.compensatingControls.length > 0) return 'compensating-control';
    if (epiplexityIndex(v) < 0.1) return 'defer';
    return 'accept-risk-with-approval';
}

/** Emit proof-of-fix verification steps for the chosen strategy. */
export function proofOfFix(v: Vulnerability, strategy: RemediationStrategy): readonly string[] {
    switch (strategy) {
        case 'patch':
            return [
                `verify component version post-deploy excludes ${v.cveId} scope`,
                `run regression safety check for affected services`,
                `record patch-applied timestamp and asset IDs in WAL`
            ];
        case 'compensating-control':
            return [
                ...v.compensatingControls.map(c => `apply control: ${c}`),
                `verify control is active and reachable`,
                `record control-activated timestamp + ongoing monitoring plan in WAL`
            ];
        case 'accept-risk-with-approval':
            return [
                `obtain written approval from risk owner (WAL-signed)`,
                `record acceptance rationale + review date in WAL`,
                `schedule re-evaluation when patch or control becomes available`
            ];
        case 'defer':
            return [
                `record defer rationale: epiplexity index < 0.1`,
                `schedule re-evaluation on next KEV refresh`
            ];
    }
}

/** Orchestrate one vulnerability through the full pipeline. */
export function orchestrate(v: Vulnerability, canPatchNow: boolean): OrchestratorDecision {
    const gate = exposureGate(v);
    if (gate === 'out-of-scope') {
        return {
            vulnerability: v,
            gate,
            epiplexityScore: epiplexityIndex(v),
            strategy: 'defer',
            proofOfFixSteps: [`out of scope: not KEV-flagged and not reachable; no action`],
            reason: 'exposure gate excluded'
        };
    }
    const strategy = chooseStrategy(v, canPatchNow);
    return {
        vulnerability: v,
        gate,
        epiplexityScore: epiplexityIndex(v),
        strategy,
        proofOfFixSteps: proofOfFix(v, strategy),
        reason: `in-scope: strategy=${strategy}`
    };
}

/** Fixture vulnerability for tests and smoke deploys. */
export const FIXTURE_VULNERABILITY: Vulnerability = {
    cveId: 'CVE-FIXTURE-0001',
    title: 'Fixture: server-side request forgery in example service',
    exploitedInWild: true,
    reachability: 0.8,
    privilege: 0.6,
    patchAvailable: true,
    compensatingControls: ['network-egress-deny-list', 'request-url-allowlist']
};
