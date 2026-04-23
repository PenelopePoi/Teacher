/**
 * Non-Supremacy Axiom (§27.3):
 *
 *   The system may reason about love, but it may never override human
 *   choice in the name of love.
 *
 * Formal: an action with higher LoveScore than the counterfactual AND
 * lower agency than the counterfactual is FORBIDDEN.
 *
 * This module makes that a one-function check.
 */

import { Context } from './types';
import { agencyDelta, isAgencyReducing } from './agency-envelope';

export type NonSupremacyVerdict = 'ok' | 'forbidden' | 'not-applicable';

export interface NonSupremacyResult {
    readonly verdict: NonSupremacyVerdict;
    readonly reason: string;
}

/**
 * Returns `forbidden` iff:
 *   - both systemLoveScore and counterfactualLoveScore are provided,
 *   - a counterfactualAgencyEnvelope is provided,
 *   - the action scores more loving (strictly greater), AND
 *   - the action reduces agency on any dimension.
 *
 * Returns `not-applicable` if the inputs needed for the check are
 * missing — callers interpret this as "the axiom could not be tested"
 * and must not treat it as approval.
 */
export function checkNonSupremacy(context: Context): NonSupremacyResult {
    const { systemLoveScore, counterfactualLoveScore, agencyEnvelope, counterfactualAgencyEnvelope } = context;
    if (
        systemLoveScore === undefined ||
        counterfactualLoveScore === undefined ||
        counterfactualAgencyEnvelope === undefined
    ) {
        return {
            verdict: 'not-applicable',
            reason: 'non-supremacy check needs systemLoveScore, counterfactualLoveScore, and counterfactualAgencyEnvelope'
        };
    }
    const moreLoving = systemLoveScore > counterfactualLoveScore;
    if (!moreLoving) {
        return { verdict: 'ok', reason: 'action does not claim to be more loving than counterfactual' };
    }
    const delta = agencyDelta(agencyEnvelope, counterfactualAgencyEnvelope);
    if (isAgencyReducing(delta)) {
        return {
            verdict: 'forbidden',
            reason: 'non-supremacy: action scores more loving but reduces agency — imposed love is domination'
        };
    }
    return { verdict: 'ok', reason: 'more-loving action preserves or increases agency' };
}
