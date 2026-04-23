import {
    chooseStrategy,
    epiplexityIndex,
    exposureGate,
    FIXTURE_VULNERABILITY,
    orchestrate,
    proofOfFix
} from '../src/kev-orchestrator';

describe('exposureGate', () => {
    it('includes KEV-flagged items', () => {
        expect(exposureGate({ ...FIXTURE_VULNERABILITY, exploitedInWild: true, reachability: 0 })).toBe('in-scope');
    });

    it('includes reachable non-KEV items', () => {
        expect(exposureGate({ ...FIXTURE_VULNERABILITY, exploitedInWild: false, reachability: 0.1 })).toBe('in-scope');
    });

    it('excludes unreachable non-KEV items', () => {
        expect(exposureGate({ ...FIXTURE_VULNERABILITY, exploitedInWild: false, reachability: 0 })).toBe('out-of-scope');
    });
});

describe('epiplexityIndex', () => {
    it('weights exploited-in-wild higher', () => {
        const kev = epiplexityIndex({ ...FIXTURE_VULNERABILITY, exploitedInWild: true });
        const nonKev = epiplexityIndex({ ...FIXTURE_VULNERABILITY, exploitedInWild: false });
        expect(kev).toBeGreaterThan(nonKev);
    });

    it('is 0 when reachability or privilege is 0', () => {
        expect(epiplexityIndex({ ...FIXTURE_VULNERABILITY, reachability: 0 })).toBe(0);
        expect(epiplexityIndex({ ...FIXTURE_VULNERABILITY, privilege: 0 })).toBe(0);
    });
});

describe('chooseStrategy', () => {
    it('patches when possible', () => {
        expect(chooseStrategy(FIXTURE_VULNERABILITY, true)).toBe('patch');
    });

    it('falls back to compensating controls when patching blocked', () => {
        expect(chooseStrategy(FIXTURE_VULNERABILITY, false)).toBe('compensating-control');
    });

    it('defers low-index items', () => {
        const low = {
            ...FIXTURE_VULNERABILITY,
            exploitedInWild: false,
            reachability: 0.1,
            privilege: 0.1,
            patchAvailable: false,
            compensatingControls: []
        };
        expect(chooseStrategy(low, false)).toBe('defer');
    });

    it('requires approval when no patch, no controls, but non-trivial index', () => {
        const risky = {
            ...FIXTURE_VULNERABILITY,
            patchAvailable: false,
            compensatingControls: []
        };
        expect(chooseStrategy(risky, false)).toBe('accept-risk-with-approval');
    });
});

describe('proofOfFix', () => {
    it('emits non-empty steps for each strategy', () => {
        for (const strategy of ['patch', 'compensating-control', 'accept-risk-with-approval', 'defer'] as const) {
            const steps = proofOfFix(FIXTURE_VULNERABILITY, strategy);
            expect(steps.length).toBeGreaterThan(0);
        }
    });
});

describe('orchestrate', () => {
    it('patches an in-scope patchable vulnerability', () => {
        const d = orchestrate(FIXTURE_VULNERABILITY, true);
        expect(d.gate).toBe('in-scope');
        expect(d.strategy).toBe('patch');
        expect(d.proofOfFixSteps.length).toBeGreaterThan(0);
    });

    it('defers out-of-scope vulnerabilities', () => {
        const d = orchestrate(
            { ...FIXTURE_VULNERABILITY, exploitedInWild: false, reachability: 0 },
            true
        );
        expect(d.gate).toBe('out-of-scope');
        expect(d.strategy).toBe('defer');
    });
});
