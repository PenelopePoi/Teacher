import { agencyDelta, checkAgencyEnvelope, isAgencyReducing } from '../src/agency-envelope';
import { DEGRADED_ENVELOPE, HEALTHY_ENVELOPE, SAMPLE_BOUNDS } from './fixtures';

describe('checkAgencyEnvelope', () => {
    it('reports no violations on a healthy envelope', () => {
        const r = checkAgencyEnvelope(HEALTHY_ENVELOPE, SAMPLE_BOUNDS);
        expect(r.preserved).toBe(true);
        expect(r.violations).toEqual([]);
    });

    it('reports all four violations on a fully degraded envelope', () => {
        const r = checkAgencyEnvelope(DEGRADED_ENVELOPE, SAMPLE_BOUNDS);
        expect(r.preserved).toBe(false);
        expect(r.violations).toEqual([
            'stopability-too-low',
            'authorship-too-low',
            'withdrawal-cost-too-high',
            'drift-too-high'
        ]);
    });

    it('reports only the specific violations', () => {
        const r = checkAgencyEnvelope(
            { ...HEALTHY_ENVELOPE, drift: 0.9 },
            SAMPLE_BOUNDS
        );
        expect(r.violations).toEqual(['drift-too-high']);
    });
});

describe('agencyDelta and isAgencyReducing', () => {
    it('computes per-component delta with W/D sign-flipped', () => {
        const delta = agencyDelta(HEALTHY_ENVELOPE, DEGRADED_ENVELOPE);
        expect(delta.stopability).toBeCloseTo(0.7, 5);
        expect(delta.authorship).toBeCloseTo(0.5, 5);
        // W: counterfactual (0.8) - post (0.1) = +0.7 (less cost = better)
        expect(delta.withdrawalCost).toBeCloseTo(0.7, 5);
        // D: counterfactual (0.5) - post (0.05) = +0.45 (less drift = better)
        expect(delta.drift).toBeCloseTo(0.45, 5);
    });

    it('flags reducing when any dimension is negative', () => {
        const delta = agencyDelta(
            { stopability: 0.5, authorship: 0.8, withdrawalCost: 0.1, drift: 0.05 },
            { stopability: 0.7, authorship: 0.6, withdrawalCost: 0.1, drift: 0.05 }
        );
        // stopability delta = -0.2 (post < counterfactual)
        expect(isAgencyReducing(delta)).toBe(true);
    });

    it('does not flag when all dimensions are non-negative', () => {
        const delta = agencyDelta(HEALTHY_ENVELOPE, HEALTHY_ENVELOPE);
        expect(isAgencyReducing(delta)).toBe(false);
    });
});
