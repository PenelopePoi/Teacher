import { checkAsymmetry, computeAsymmetry } from '../src/epiplexity';
import { sampleContext } from './fixtures';

describe('computeAsymmetry', () => {
    it('returns ratio of system-to-host over host-to-system epiplexity', () => {
        const c = sampleContext({ systemEpiplexityAboutHost: 10, hostEpiplexityAboutSystem: 4 });
        expect(computeAsymmetry(c)).toBeCloseTo(2.5, 5);
    });

    it('returns MAX_VALUE when host has near-zero epiplexity about system', () => {
        const c = sampleContext({ systemEpiplexityAboutHost: 5, hostEpiplexityAboutSystem: 0 });
        expect(computeAsymmetry(c)).toBe(Number.MAX_VALUE);
    });

    it('throws on negative epiplexity', () => {
        const c = sampleContext({ systemEpiplexityAboutHost: -1, hostEpiplexityAboutSystem: 1 });
        expect(() => computeAsymmetry(c)).toThrow(RangeError);
    });
});

describe('checkAsymmetry', () => {
    it('passes when A(τ) ≤ α', () => {
        const c = sampleContext({ systemEpiplexityAboutHost: 8, hostEpiplexityAboutSystem: 4 });
        const r = checkAsymmetry(c, 3);
        expect(r.withinBound).toBe(true);
        expect(r.asymmetry).toBe(2);
        expect(r.alpha).toBe(3);
    });

    it('fails when A(τ) > α', () => {
        const c = sampleContext({ systemEpiplexityAboutHost: 40, hostEpiplexityAboutSystem: 4 });
        const r = checkAsymmetry(c, 3);
        expect(r.withinBound).toBe(false);
    });

    it('rejects α ≤ 1', () => {
        const c = sampleContext();
        expect(() => checkAsymmetry(c, 1)).toThrow(RangeError);
        expect(() => checkAsymmetry(c, 0.5)).toThrow(RangeError);
    });
});
