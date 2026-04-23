/**
 * Main orchestration: `validateAction(action, context)`.
 *
 * Flow:
 *   1. If action is choice-architecture, require consent token; verify it.
 *   2. Run Non-Supremacy check — FORBID wins immediately.
 *   3. Evaluate Love Invariant — may yield INDETERMINATE or DENY.
 *   4. If everything passes, compose ALLOW decision.
 *   5. Regardless of kind, synchronously append a WAL entry before returning.
 *
 * This is the write-ahead property: the decision does not return until
 * the WAL entry is durable.
 */

import { randomUUID } from 'node:crypto';
import { GuardianConfig } from './config';
import { actionHash, ConsentVerifyResult, verifyConsent } from './consent';
import { evaluateLoveInvariant, LoveInvariantResult } from './love-invariant';
import { checkNonSupremacy, NonSupremacyResult } from './non-supremacy';
import {
    Action,
    Context,
    Decision,
    DecisionKind,
    Signer,
    WalEntry,
    WalEntryCanonicalInput,
    WalStore
} from './types';
import { finalizeEntry, nextPreviousHash } from './wal';

export interface Guardian {
    validateAction(action: Action, context: Context): Promise<Decision>;
}

export interface GuardianDeps {
    readonly config: GuardianConfig;
    readonly wal: WalStore;
    readonly signer?: Signer;
    readonly usedNonces: ReadonlySet<string>;
    /** Injected clock for deterministic testing; defaults to Date.now(). */
    readonly now?: () => number;
    /** Injected UUID generator for deterministic testing. */
    readonly uuid?: () => string;
}

export function createGuardian(deps: GuardianDeps): Guardian {
    const now = deps.now ?? (() => Date.now());
    const uuid = deps.uuid ?? (() => randomUUID());

    return {
        async validateAction(action: Action, context: Context): Promise<Decision> {
            const nowMs = now();
            const nowSeconds = Math.floor(nowMs / 1000);
            const decidedAt = new Date(nowMs).toISOString();

            // 1. Consent for choice-architecture actions. §23.2
            const consentResult = maybeCheckConsent(action, context, deps, nowSeconds);
            if (consentResult && consentResult.verdict !== 'valid') {
                return await emit({
                    kind: 'DENY',
                    reasonCode: `consent-${consentResult.verdict}`,
                    reasonMessage: `consent required for choice-architecture action — ${consentResult.reason}`,
                    deps,
                    action,
                    context,
                    decidedAt,
                    uuid,
                    alphaSnapshot: snapshotAlpha(deps.config)
                });
            }

            // 2. Non-Supremacy Axiom. §27.3 — FORBID wins.
            const nonSupremacy: NonSupremacyResult = checkNonSupremacy(context);
            if (nonSupremacy.verdict === 'forbidden') {
                return await emit({
                    kind: 'FORBID',
                    reasonCode: 'non-supremacy-violation',
                    reasonMessage: nonSupremacy.reason,
                    deps,
                    action,
                    context,
                    decidedAt,
                    uuid,
                    alphaSnapshot: snapshotAlpha(deps.config)
                });
            }

            // 3. Love Invariant. §9.4
            const invariant: LoveInvariantResult = evaluateLoveInvariant({
                context,
                alpha: snapshotAlpha(deps.config),
                bounds: deps.config.agencyBounds
            });

            const kind = decisionKindFromRegime(invariant.regime);
            return await emit({
                kind,
                reasonCode: invariant.reasonCode,
                reasonMessage: invariant.reasonMessage,
                deps,
                action,
                context,
                decidedAt,
                uuid,
                alphaSnapshot: snapshotAlpha(deps.config),
                nextConsentNonce: kind === 'ALLOW' ? uuid() : undefined
            });
        }
    };
}

function snapshotAlpha(config: GuardianConfig): number | 'uncalibrated' {
    return config.alphaMode === 'calibrated' ? config.alpha : 'uncalibrated';
}

function maybeCheckConsent(
    action: Action,
    context: Context,
    deps: GuardianDeps,
    nowSeconds: number
): ConsentVerifyResult | undefined {
    if (action.class !== 'choice-architecture') return undefined;
    if (!context.consentToken) {
        return { verdict: 'malformed', reason: 'choice-architecture action requires a consent token' };
    }
    return verifyConsent({
        token: context.consentToken,
        action,
        nowSeconds,
        maxAgeSeconds: deps.config.consentMaxAgeSeconds,
        signingKey: deps.config.consentSigningKey,
        usedNonces: deps.usedNonces
    });
}

function decisionKindFromRegime(regime: LoveInvariantResult['regime']): DecisionKind {
    switch (regime) {
        case 'love':
            return 'ALLOW';
        case 'indeterminate':
            return 'INDETERMINATE';
        case 'manipulation':
        case 'domination':
            return 'DENY';
    }
}

interface EmitParams {
    readonly kind: DecisionKind;
    readonly reasonCode: string;
    readonly reasonMessage: string;
    readonly deps: GuardianDeps;
    readonly action: Action;
    readonly context: Context;
    readonly decidedAt: string;
    readonly uuid: () => string;
    readonly alphaSnapshot: number | 'uncalibrated';
    readonly nextConsentNonce?: string;
}

async function emit(params: EmitParams): Promise<Decision> {
    const entryId = params.uuid();
    const proofId = actionHash(params.action);
    const previousHash = await nextPreviousHash(params.deps.wal);

    const decision: Decision = {
        kind: params.kind,
        reasonCode: params.reasonCode,
        reasonMessage: params.reasonMessage,
        walEntryId: entryId,
        proofId,
        nextConsentNonce: params.nextConsentNonce,
        decidedAt: params.decidedAt
    };

    // Compute asymmetry for the record (even on early-exit paths).
    const asymmetry = computeAsymmetryForRecord(params.context);

    const canonical: WalEntryCanonicalInput = {
        entryId,
        timestamp: params.decidedAt,
        previousHash,
        action: params.action,
        context: params.context,
        decision,
        asymmetry,
        alphaInEffect: params.alphaSnapshot,
        agencyBoundsInEffect: params.deps.config.agencyBounds
    };

    const finalized: WalEntry = await finalizeEntry(canonical, params.deps.signer);
    await params.deps.wal.append(finalized);
    return decision;
}

function computeAsymmetryForRecord(context: Context): number {
    const num = context.systemEpiplexityAboutHost;
    const den = context.hostEpiplexityAboutSystem;
    if (num < 0 || den < 0) return Number.NaN;
    if (den < 1e-9) return Number.MAX_VALUE;
    return num / den;
}
