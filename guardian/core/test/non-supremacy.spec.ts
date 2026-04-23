import fc from 'fast-check';
import { checkNonSupremacy } from '../src/non-supremacy';
import { HEALTHY_ENVELOPE, sampleContext } from './fixtures';

describe('checkNonSupremacy', () => {
    it('returns not-applicable when inputs are missing', () => {
        const c = sampleContext();
        expect(checkNonSupremacy(c).verdict).toBe('not-applicable');
    });

    it('returns ok when action is not more loving than counterfactual', () => {
        const c = sampleContext({
            systemLoveScore: 0.3,
            counterfactualLoveScore: 0.5,
            counterfactualAgencyEnvelope: HEALTHY_ENVELOPE
        });
        expect(checkNonSupremacy(c).verdict).toBe('ok');
    });

    it('returns forbidden when more loving but agency-reducing', () => {
        const c = sampleContext({
            systemLoveScore: 0.9,
            counterfactualLoveScore: 0.2,
            agencyEnvelope: { stopability: 0.3, authorship: 0.7, withdrawalCost: 0.2, drift: 0.1 },
            counterfactualAgencyEnvelope: HEALTHY_ENVELOPE
        });
        expect(checkNonSupremacy(c).verdict).toBe('forbidden');
    });

    it('returns ok when more loving AND agency-preserving', () => {
        const c = sampleContext({
            systemLoveScore: 0.9,
            counterfactualLoveScore: 0.2,
            agencyEnvelope: HEALTHY_ENVELOPE,
            counterfactualAgencyEnvelope: HEALTHY_ENVELOPE
        });
        expect(checkNonSupremacy(c).verdict).toBe('ok');
    });

    // Property: Δagency < 0 ∧ moreLoving ⇒ FORBID
    it('property: any agency-reducing + more-loving action is forbidden', () => {
        fc.assert(
            fc.property(
                fc.double({ min: 0, max: 1, noNaN: true }),
                fc.double({ min: 0, max: 1, noNaN: true }),
                fc.double({ min: 0, max: 1, noNaN: true }),
                fc.double({ min: 0, max: 1, noNaN: true }),
                fc.double({ min: 0, max: 1, noNaN: true }),
                fc.double({ min: 0, max: 1, noNaN: true }),
                fc.double({ min: 0, max: 1, noNaN: true }),
                fc.double({ min: 0, max: 1, noNaN: true }),
                (pS, pA, pW, pD, cS, cA, cW, cD) => {
                    // Skip cases where no reduction occurs.
                    const reducing = pS < cS || pA < cA || pW > cW || pD > cD;
                    if (!reducing) return true;
                    const c = sampleContext({
                        systemLoveScore: 0.9,
                        counterfactualLoveScore: 0.1,
                        agencyEnvelope: { stopability: pS, authorship: pA, withdrawalCost: pW, drift: pD },
                        counterfactualAgencyEnvelope: { stopability: cS, authorship: cA, withdrawalCost: cW, drift: cD }
                    });
                    return checkNonSupremacy(c).verdict === 'forbidden';
                }
            ),
            { numRuns: 1000 }
        );
    });
});
