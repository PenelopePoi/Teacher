/** Barrel export for guardian/core. */

export * from './types';
export * from './config';
export {
    checkAgencyEnvelope,
    agencyDelta,
    isAgencyReducing,
    type EnvelopeViolation,
    type EnvelopeCheckResult
} from './agency-envelope';
export { computeAsymmetry, checkAsymmetry, type AsymmetryCheckResult } from './epiplexity';
export {
    checkNonSupremacy,
    type NonSupremacyVerdict,
    type NonSupremacyResult
} from './non-supremacy';
export {
    verifyConsent,
    mintConsent,
    actionHash,
    type ConsentPayload,
    type ConsentVerdict,
    type ConsentVerifyInput,
    type ConsentVerifyResult
} from './consent';
export {
    canonicalize,
    hashCanonical,
    finalizeEntry,
    verifyChain,
    nextPreviousHash,
    GENESIS_HASH,
    InMemoryWalStore,
    JsonlFileWalStore,
    type ChainVerificationResult
} from './wal';
export {
    evaluateLoveInvariant,
    type LoveInvariantInput,
    type LoveInvariantResult
} from './love-invariant';
export {
    exposureGate,
    epiplexityIndex,
    chooseStrategy,
    proofOfFix,
    orchestrate,
    FIXTURE_VULNERABILITY,
    type Vulnerability,
    type GateResult,
    type RemediationStrategy,
    type OrchestratorDecision
} from './kev-orchestrator';
export { createGuardian, type Guardian, type GuardianDeps } from './guardian';
