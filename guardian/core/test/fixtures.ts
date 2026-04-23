import { Action, AgencyBounds, AgencyEnvelope, Context } from '../src/types';

export const SAMPLE_BOUNDS: AgencyBounds = {
    stopabilityMin: 0.5,
    authorshipMin: 0.5,
    withdrawalCostMax: 0.5,
    driftMax: 0.2
};

export const HEALTHY_ENVELOPE: AgencyEnvelope = {
    stopability: 0.9,
    authorship: 0.8,
    withdrawalCost: 0.1,
    drift: 0.05
};

export const DEGRADED_ENVELOPE: AgencyEnvelope = {
    stopability: 0.2,
    authorship: 0.3,
    withdrawalCost: 0.8,
    drift: 0.5
};

export const SAMPLE_ACTION: Action = {
    id: 'act-0001',
    proposedAt: '2026-04-20T00:00:00.000Z',
    class: 'informational',
    descriptor: 'answer a user question about the weather',
    systemId: 'system-test',
    hostId: 'host-test'
};

export const CHOICE_ACTION: Action = {
    ...SAMPLE_ACTION,
    id: 'act-0002',
    class: 'choice-architecture',
    descriptor: 'reorder the user feed to show item X first'
};

export function sampleContext(overrides: Partial<Context> = {}): Context {
    return {
        systemEpiplexityAboutHost: 5,
        hostEpiplexityAboutSystem: 4,
        agencyEnvelope: HEALTHY_ENVELOPE,
        ...overrides
    };
}

export const SIGNING_KEY = 'test-signing-key-abcdef0123456789';
