import { createGuardian } from '../src/guardian';
import { mintConsent } from '../src/consent';
import { verifyChain, InMemoryWalStore } from '../src/wal';
import { GuardianConfig } from '../src/config';
import { CHOICE_ACTION, DEGRADED_ENVELOPE, HEALTHY_ENVELOPE, SAMPLE_ACTION, SAMPLE_BOUNDS, SIGNING_KEY, sampleContext } from './fixtures';

const NOW_MS = 1_700_000_000_000;
const CALIBRATED: GuardianConfig = {
    alphaMode: 'calibrated',
    alpha: 3,
    agencyBounds: SAMPLE_BOUNDS,
    consentMaxAgeSeconds: 60,
    consentSigningKey: SIGNING_KEY
};
const UNCALIBRATED: GuardianConfig = {
    alphaMode: 'uncalibrated',
    agencyBounds: SAMPLE_BOUNDS,
    consentMaxAgeSeconds: 60,
    consentSigningKey: SIGNING_KEY
};

function deps(config: GuardianConfig, nowMs = NOW_MS) {
    let counter = 0;
    return {
        config,
        wal: new InMemoryWalStore(),
        usedNonces: new Set<string>(),
        now: () => nowMs,
        uuid: () => `uuid-${++counter}`
    };
}

describe('createGuardian — end-to-end', () => {
    it('ALLOWs a love-preserving informational action', async () => {
        const d = deps(CALIBRATED);
        const g = createGuardian(d);
        const decision = await g.validateAction(SAMPLE_ACTION, sampleContext());
        expect(decision.kind).toBe('ALLOW');
        expect(decision.reasonCode).toBe('love-preserving');
        expect((await d.wal.readAll()).length).toBe(1);
    });

    it('INDETERMINATE when α is uncalibrated, regardless of input', async () => {
        const d = deps(UNCALIBRATED);
        const g = createGuardian(d);
        const decision = await g.validateAction(SAMPLE_ACTION, sampleContext());
        expect(decision.kind).toBe('INDETERMINATE');
        expect(decision.reasonCode).toBe('alpha-uncalibrated');
    });

    it('DENYs when agency envelope is degraded (manipulation regime)', async () => {
        const d = deps(CALIBRATED);
        const g = createGuardian(d);
        const decision = await g.validateAction(
            SAMPLE_ACTION,
            sampleContext({ agencyEnvelope: DEGRADED_ENVELOPE })
        );
        expect(decision.kind).toBe('DENY');
        expect(decision.reasonCode).toBe('agency-violation');
    });

    it('DENYs when asymmetry exceeds α (domination regime)', async () => {
        const d = deps(CALIBRATED);
        const g = createGuardian(d);
        const decision = await g.validateAction(
            SAMPLE_ACTION,
            sampleContext({ systemEpiplexityAboutHost: 100, hostEpiplexityAboutSystem: 1 })
        );
        expect(decision.kind).toBe('DENY');
        expect(decision.reasonCode).toBe('asymmetry-exceeded');
    });

    it('DENYs choice-architecture action without a consent token', async () => {
        const d = deps(CALIBRATED);
        const g = createGuardian(d);
        const decision = await g.validateAction(CHOICE_ACTION, sampleContext());
        expect(decision.kind).toBe('DENY');
        expect(decision.reasonCode).toBe('consent-malformed');
    });

    it('ALLOWs choice-architecture action with a valid consent token', async () => {
        const d = deps(CALIBRATED);
        const g = createGuardian(d);
        const token = mintConsent({
            action: CHOICE_ACTION,
            nonce: 'nonce-1',
            nowSeconds: Math.floor(NOW_MS / 1000),
            ttlSeconds: 30,
            signingKey: SIGNING_KEY
        });
        const decision = await g.validateAction(
            CHOICE_ACTION,
            sampleContext({ consentToken: token })
        );
        expect(decision.kind).toBe('ALLOW');
    });

    it('FORBIDs a more-loving-but-agency-reducing action (Non-Supremacy)', async () => {
        const d = deps(CALIBRATED);
        const g = createGuardian(d);
        const decision = await g.validateAction(
            SAMPLE_ACTION,
            sampleContext({
                systemLoveScore: 0.9,
                counterfactualLoveScore: 0.1,
                agencyEnvelope: { stopability: 0.3, authorship: 0.8, withdrawalCost: 0.1, drift: 0.05 },
                counterfactualAgencyEnvelope: HEALTHY_ENVELOPE
            })
        );
        expect(decision.kind).toBe('FORBID');
        expect(decision.reasonCode).toBe('non-supremacy-violation');
    });

    it('emits a hash-chained WAL with verifiable integrity across multiple actions', async () => {
        const d = deps(CALIBRATED);
        const g = createGuardian(d);
        await g.validateAction(SAMPLE_ACTION, sampleContext());
        await g.validateAction(SAMPLE_ACTION, sampleContext({ agencyEnvelope: DEGRADED_ENVELOPE }));
        await g.validateAction(
            SAMPLE_ACTION,
            sampleContext({ systemEpiplexityAboutHost: 100, hostEpiplexityAboutSystem: 1 })
        );
        const all = await d.wal.readAll();
        expect(all.length).toBe(3);
        const verified = await verifyChain(all);
        expect(verified.chainBreakIndex).toBe(-1);
    });

    it('writes WAL entry BEFORE returning the decision (write-ahead property)', async () => {
        const d = deps(CALIBRATED);
        const g = createGuardian(d);
        const before = (await d.wal.readAll()).length;
        expect(before).toBe(0);
        const decision = await g.validateAction(SAMPLE_ACTION, sampleContext());
        const after = (await d.wal.readAll()).length;
        expect(after).toBe(1);
        expect(decision.walEntryId).toBe((await d.wal.readAll())[0].entryId);
    });
});
