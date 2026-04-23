/**
 * Agency envelope G(τ) check per §2.3.
 *
 * Componentwise: S ≥ σ_min, A ≥ a_min, W ≤ w_max, D ≤ d_max.
 * A violation on any component fails the check; the returned result
 * enumerates which.
 */

import { AgencyBounds, AgencyEnvelope } from './types';

export type EnvelopeViolation =
    | 'stopability-too-low'
    | 'authorship-too-low'
    | 'withdrawal-cost-too-high'
    | 'drift-too-high';

export interface EnvelopeCheckResult {
    readonly violations: readonly EnvelopeViolation[];
    readonly preserved: boolean;
}

/** Return the list of violated constraints; empty iff the envelope is preserved. */
export function checkAgencyEnvelope(
    envelope: AgencyEnvelope,
    bounds: AgencyBounds
): EnvelopeCheckResult {
    const violations: EnvelopeViolation[] = [];
    if (envelope.stopability < bounds.stopabilityMin) {
        violations.push('stopability-too-low');
    }
    if (envelope.authorship < bounds.authorshipMin) {
        violations.push('authorship-too-low');
    }
    if (envelope.withdrawalCost > bounds.withdrawalCostMax) {
        violations.push('withdrawal-cost-too-high');
    }
    if (envelope.drift > bounds.driftMax) {
        violations.push('drift-too-high');
    }
    return {
        violations,
        preserved: violations.length === 0
    };
}

/**
 * Agency delta = post - counterfactual.
 *
 * Positive components reflect agency-preserving actions; negative
 * components reflect agency-reducing ones. Used by the Non-Supremacy
 * check to forbid "more loving by system judgment but less agency"
 * actions. §27.3
 */
export function agencyDelta(
    post: AgencyEnvelope,
    counterfactual: AgencyEnvelope
): AgencyEnvelope {
    return {
        stopability: post.stopability - counterfactual.stopability,
        authorship: post.authorship - counterfactual.authorship,
        // W and D are "less is better" — invert so positive means better.
        withdrawalCost: counterfactual.withdrawalCost - post.withdrawalCost,
        drift: counterfactual.drift - post.drift
    };
}

/** Does the delta represent a net reduction in agency? */
export function isAgencyReducing(delta: AgencyEnvelope): boolean {
    // Any single component strictly worse is a reduction. This is
    // deliberately strict — reversing even one dimension is enough to
    // reject a "more loving" action.
    return (
        delta.stopability < 0 ||
        delta.authorship < 0 ||
        delta.withdrawalCost < 0 ||
        delta.drift < 0
    );
}
