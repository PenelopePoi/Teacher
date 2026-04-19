/**
 * Intent System (A5/A6) — the CRDT continuity primitive.
 *
 * Voice-captured intent objects that flow from Companion to Workshop.
 * Each intent carries raw transcript, cleaned text, inferred action,
 * and a context snapshot so the Workshop can replay the user's thinking.
 */

/**
 * Inferred action parsed from natural language.
 */
export interface InferredAction {
    readonly verb: string;
    readonly target: string;
    readonly params: Record<string, string>;
}

/**
 * A captured intent from voice, text, or gesture.
 */
export interface IntentObject {
    readonly id: string;
    readonly timestamp: number;
    readonly source: 'voice' | 'text' | 'gesture';
    readonly rawTranscript: string;
    readonly cleanedText: string;
    readonly inferredAction: InferredAction;
    readonly contextSnapshot: Record<string, unknown>;
    readonly confidence: number;
    readonly status: 'pending' | 'applied' | 'dismissed';
}

/**
 * Anchor for a pinned thought in a file.
 */
export interface PinnedThoughtAnchor {
    readonly fileId: string;
    readonly line?: number;
    readonly region?: { start: number; end: number };
}

/**
 * A thought pinned to a specific location in code.
 */
export interface PinnedThought {
    readonly id: string;
    readonly intentId: string;
    readonly anchor: PinnedThoughtAnchor;
    readonly note: string;
    readonly createdAt: number;
    readonly createdBy: string;
}

/**
 * Service interface for the intent system.
 */
export interface IntentService {
    createIntent(input: Omit<IntentObject, 'id' | 'timestamp' | 'status'>): IntentObject;
    getIntents(): IntentObject[];
    applyIntent(id: string): void;
    dismissIntent(id: string): void;
    getPendingIntents(): IntentObject[];
}

export const IntentService = Symbol('IntentService');
export const INTENT_SERVICE_PATH = '/services/intent';
