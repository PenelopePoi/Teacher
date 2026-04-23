/**
 * Theorem 5 evaluator (Love Invariant, §9.4).
 *
 * This module does NOT take actions or write to the WAL. It is a pure
 * classifier: given a (Context, α, bounds), it returns the regime
 * (love / manipulation / domination / indeterminate) and enough
 * evidence to construct a Decision.
 */

import { checkAgencyEnvelope, EnvelopeCheckResult } from './agency-envelope';
import { AsymmetryCheckResult, checkAsymmetry } from './epiplexity';
import { AgencyBounds, Context, InvariantRegime } from './types';

export interface LoveInvariantInput {
    readonly context: Context;
    readonly alpha: number | 'uncalibrated';
    readonly bounds: AgencyBounds;
}

export interface LoveInvariantResult {
    readonly regime: InvariantRegime;
    readonly asymmetryCheck?: AsymmetryCheckResult;
    readonly envelopeCheck: EnvelopeCheckResult;
    readonly reasonCode: string;
    readonly reasonMessage: string;
}

/**
 * Classify the trajectory per Theorem 5.
 *
 * | Regime         | Asymmetry within α | Envelope preserved |
 * | -------------- | ------------------ | ------------------ |
 * | love           | yes                | yes                |
 * | manipulation   | yes                | no                 |
 * | domination     | no                 | no                 |
 * | domination*    | no                 | yes                |
 * | indeterminate  | alpha uncalibrated | n/a                |
 *
 * * When asymmetry exceeds α but envelope is preserved, the paper's
 *   corollary (§9.4) still classifies this as in the domination regime
 *   — the invariant is conjunctive, not alternative. We record the
 *   envelope as preserved but flag the asymmetry failure.
 */
export function evaluateLoveInvariant(input: LoveInvariantInput): LoveInvariantResult {
    const envelopeCheck = checkAgencyEnvelope(input.context.agencyEnvelope, input.bounds);

    if (input.alpha === 'uncalibrated') {
        return {
            regime: 'indeterminate',
            envelopeCheck,
            reasonCode: 'alpha-uncalibrated',
            reasonMessage:
                'safe asymmetry margin α has not been calibrated for this deployment; guardian refuses to classify'
        };
    }

    const asymmetryCheck = checkAsymmetry(input.context, input.alpha);

    if (asymmetryCheck.withinBound && envelopeCheck.preserved) {
        return {
            regime: 'love',
            asymmetryCheck,
            envelopeCheck,
            reasonCode: 'love-preserving',
            reasonMessage: 'asymmetry within α and agency envelope preserved — trajectory is love-preserving'
        };
    }

    if (asymmetryCheck.withinBound && !envelopeCheck.preserved) {
        return {
            regime: 'manipulation',
            asymmetryCheck,
            envelopeCheck,
            reasonCode: 'agency-violation',
            reasonMessage: `agency envelope violated: ${envelopeCheck.violations.join(', ')}`
        };
    }

    // Asymmetry exceeds α; this is domination regardless of envelope status.
    return {
        regime: 'domination',
        asymmetryCheck,
        envelopeCheck,
        reasonCode: 'asymmetry-exceeded',
        reasonMessage: `A(τ) = ${asymmetryCheck.asymmetry.toFixed(4)} exceeds α = ${asymmetryCheck.alpha}`
    };
}
