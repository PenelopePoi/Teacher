/**
 * Epiplexity asymmetry A(τ) = S_T(S|H) / S_T(H|S) per §9.4.
 *
 * High A(τ) (>> 1) is the informational signature of manipulation: the
 * system models the host well while remaining opaque to the host.
 */

import { Context } from './types';

const EPSILON = 1e-9;

export interface AsymmetryCheckResult {
    readonly asymmetry: number;
    readonly alpha: number;
    readonly withinBound: boolean;
}

/**
 * Compute A(τ) from a context.
 *
 * Guards against division by zero: when the host models the system with
 * zero epiplexity, asymmetry is unbounded — we treat this as the maximum
 * representable float, which will always exceed any finite α.
 */
export function computeAsymmetry(context: Context): number {
    const numerator = context.systemEpiplexityAboutHost;
    const denominator = context.hostEpiplexityAboutSystem;
    if (numerator < 0 || denominator < 0) {
        throw new RangeError('epiplexity values must be non-negative');
    }
    if (denominator < EPSILON) {
        return Number.MAX_VALUE;
    }
    return numerator / denominator;
}

/** Check A(τ) against the calibrated α threshold. */
export function checkAsymmetry(context: Context, alpha: number): AsymmetryCheckResult {
    if (alpha <= 1) {
        throw new RangeError(`alpha must be > 1 (got ${alpha})`);
    }
    const asymmetry = computeAsymmetry(context);
    return {
        asymmetry,
        alpha,
        withinBound: asymmetry <= alpha
    };
}
