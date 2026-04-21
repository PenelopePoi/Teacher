import { evaluateLoveInvariant } from '../src/love-invariant';
import { DEGRADED_ENVELOPE, HEALTHY_ENVELOPE, SAMPLE_BOUNDS, sampleContext } from './fixtures';

describe('evaluateLoveInvariant', () => {
    it('classifies as love when asymmetry within α and envelope preserved', () => {
        const r = evaluateLoveInvariant({
            context: sampleContext(),
            alpha: 3,
            bounds: SAMPLE_BOUNDS
        });
        expect(r.regime).toBe('love');
        expect(r.reasonCode).toBe('love-preserving');
    });

    it('classifies as manipulation when asymmetry ok but envelope fails', () => {
        const r = evaluateLoveInvariant({
            context: sampleContext({ agencyEnvelope: DEGRADED_ENVELOPE }),
            alpha: 3,
            bounds: SAMPLE_BOUNDS
        });
        expect(r.regime).toBe('manipulation');
        expect(r.reasonCode).toBe('agency-violation');
    });

    it('classifies as domination when asymmetry exceeds α, regardless of envelope', () => {
        const preserved = evaluateLoveInvariant({
            context: sampleContext({
                systemEpiplexityAboutHost: 100,
                hostEpiplexityAboutSystem: 1,
                agencyEnvelope: HEALTHY_ENVELOPE
            }),
            alpha: 3,
            bounds: SAMPLE_BOUNDS
        });
        expect(preserved.regime).toBe('domination');

        const degraded = evaluateLoveInvariant({
            context: sampleContext({
                systemEpiplexityAboutHost: 100,
                hostEpiplexityAboutSystem: 1,
                agencyEnvelope: DEGRADED_ENVELOPE
            }),
            alpha: 3,
            bounds: SAMPLE_BOUNDS
        });
        expect(degraded.regime).toBe('domination');
    });

    it('returns indeterminate when α is uncalibrated', () => {
        const r = evaluateLoveInvariant({
            context: sampleContext(),
            alpha: 'uncalibrated',
            bounds: SAMPLE_BOUNDS
        });
        expect(r.regime).toBe('indeterminate');
        expect(r.reasonCode).toBe('alpha-uncalibrated');
    });
});
