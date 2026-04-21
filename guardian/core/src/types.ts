/**
 * Type surface for guardian/core.
 *
 * These types formalize the Love Invariant (Theorem 5, §9.4 of the hedonic
 * packing paper) and the Agency Envelope (§2.3). They are the interchange
 * format between the Lambda handler, the Theia RPC wrapper (future), and
 * the pure evaluator.
 */

/**
 * A proposed action the guardian is asked to validate. The shape is
 * deliberately minimal — it captures only what the Love Invariant needs:
 * who is acting on whom, with what intent, and what consent backing.
 */
export interface Action {
    /** Unique action identifier (UUID v4 recommended). Used for idempotency in the WAL. */
    readonly id: string;
    /** ISO 8601 timestamp when the action was proposed. */
    readonly proposedAt: string;
    /**
     * The class of the action per §23.1. Choice-architecture actions
     * require explicit consent tokens.
     */
    readonly class: ActionClass;
    /** Free-form action descriptor (what is being proposed, in the system's own terms). */
    readonly descriptor: string;
    /** Identifier of the acting system (e.g. model ID, agent ID). */
    readonly systemId: string;
    /** Identifier of the affected host (user, subject). Opaque — do not log PII here. */
    readonly hostId: string;
}

/** Action classes from §23.1. */
export type ActionClass =
    | 'informational'
    | 'bridging'
    | 'choice-architecture'
    | 'refusal';

/**
 * Contextual signals the guardian needs to evaluate the action.
 *
 * These are provided by the caller and are trusted only to the extent
 * the caller is trusted — the guardian does not infer them.
 */
export interface Context {
    /** Epiplexity the system extracts about the host (bits). §9.4 */
    readonly systemEpiplexityAboutHost: number;
    /** Epiplexity the host extracts about the system (bits). §9.4 */
    readonly hostEpiplexityAboutSystem: number;
    /** Current agency envelope measurements. §2.3 */
    readonly agencyEnvelope: AgencyEnvelope;
    /** Consent token, required if action class is choice-architecture. §23.2 */
    readonly consentToken?: ConsentToken;
    /**
     * Counterfactual agency envelope if this action were NOT executed.
     * Used by the Non-Supremacy check to compute Δagency. §27.3
     */
    readonly counterfactualAgencyEnvelope?: AgencyEnvelope;
    /**
     * The system's own love-score for this action (higher = more loving
     * by the system's internal model). Used only by the Non-Supremacy
     * check, never as a ranking signal.
     */
    readonly systemLoveScore?: number;
    /** Counterfactual love-score if the action were NOT executed. */
    readonly counterfactualLoveScore?: number;
}

/**
 * Agency envelope G(τ) = (S, A, W, D) per §2.3.
 *
 * Each component is normalized to [0, 1] for S and A (higher is better),
 * and to [0, 1] for W and D (higher is worse).
 */
export interface AgencyEnvelope {
    /** Stop-ability: ease of exiting. Must be ≥ σ_min. */
    readonly stopability: number;
    /** Authorship: user-initiated share of action. Must be ≥ a_min. */
    readonly authorship: number;
    /** Withdrawal cost: cost to fully exit. Must be ≤ w_max. */
    readonly withdrawalCost: number;
    /** Drift: preference change rate. Must be ≤ d_max. */
    readonly drift: number;
}

/** Configured componentwise bounds for the agency envelope. */
export interface AgencyBounds {
    readonly stopabilityMin: number;
    readonly authorshipMin: number;
    readonly withdrawalCostMax: number;
    readonly driftMax: number;
}

/**
 * Detached JWS consent token per §23.2 and the consent module.
 *
 * Opaque to the guardian; parsed and verified by `consent.ts`.
 */
export interface ConsentToken {
    /** Compact JWS string (header.payload.signature, base64url-encoded). */
    readonly jws: string;
    /** Single-use nonce bound to the action hash. */
    readonly nonce: string;
}

/**
 * The guardian's verdict for an action.
 *
 * - `ALLOW`: action may proceed. WAL entry written, ready for execution.
 * - `DENY`: action rejected on a knowable constraint (consent failure,
 *   envelope violation, asymmetry exceedance).
 * - `INDETERMINATE`: guardian cannot produce a safe verdict (most commonly
 *   because α is uncalibrated). Caller MUST treat this as not-permitted.
 * - `FORBID`: action triggered the Non-Supremacy Axiom (more loving by
 *   system judgment but agency-reducing). §27.3
 */
export type DecisionKind = 'ALLOW' | 'DENY' | 'INDETERMINATE' | 'FORBID';

/** The full decision returned to the caller. */
export interface Decision {
    readonly kind: DecisionKind;
    /** Short stable reason code for programmatic handling. */
    readonly reasonCode: string;
    /** Human-readable explanation of the decision. */
    readonly reasonMessage: string;
    /** ID of the WAL entry recording this decision. */
    readonly walEntryId: string;
    /** Proof identifier for later verification (signature ID, hash of entry, etc.). */
    readonly proofId: string;
    /** Next nonce for follow-up consent tokens, if any. */
    readonly nextConsentNonce?: string;
    /** ISO 8601 when the decision was emitted. */
    readonly decidedAt: string;
}

/**
 * A single entry in the Write-Ahead Log (§11 of the paper).
 *
 * The hash chain is load-bearing: tampering with any prior entry will be
 * detected at verification time by `verifyChain()`.
 */
export interface WalEntry {
    /** Unique entry ID (not the same as Action.id; one action can produce multiple entries). */
    readonly entryId: string;
    /** ISO 8601 timestamp. */
    readonly timestamp: string;
    /** Base64 hash of the previous entry's canonical bytes. Zero-hash for genesis. */
    readonly previousHash: string;
    /** Base64 hash of this entry's canonical bytes (excludes `currentHash` itself). */
    readonly currentHash: string;
    /** The action under evaluation. */
    readonly action: Action;
    /** Context snapshot at decision time. */
    readonly context: Context;
    /** The verdict. */
    readonly decision: Decision;
    /** Computed asymmetry ratio A(τ). */
    readonly asymmetry: number;
    /** Asymmetry threshold α that was in effect at decision time. */
    readonly alphaInEffect: number | 'uncalibrated';
    /** Agency bounds in effect at decision time. */
    readonly agencyBoundsInEffect: AgencyBounds;
    /** Optional KMS signature over `currentHash`. Populated by the KMS-backed signer. */
    readonly signature?: string;
    /** Key identifier used for signature, if signed. */
    readonly signatureKeyId?: string;
}

/** Canonical bytes for a WAL entry, excluding `currentHash` and `signature`. */
export type WalEntryCanonicalInput = Omit<WalEntry, 'currentHash' | 'signature' | 'signatureKeyId'>;

/** Store abstraction for the WAL. Pluggable: in-memory, FS JSONL, DynamoDB. */
export interface WalStore {
    /** Append a fully formed entry. Idempotent by entryId — second call with the same ID is a no-op. */
    append(entry: WalEntry): Promise<void>;
    /** Read the last entry, or undefined if the store is empty. */
    readLast(): Promise<WalEntry | undefined>;
    /** Read all entries in order. Used by verifiers. */
    readAll(): Promise<readonly WalEntry[]>;
}

/** Signer abstraction for signing WAL entry hashes. Pluggable: no-op, HMAC, KMS. */
export interface Signer {
    /** Sign the given bytes, returning a base64 signature and a key identifier. */
    sign(bytes: Uint8Array): Promise<{ signature: string; keyId: string }>;
    /** Verify a signature. Used by verifiers. */
    verify(bytes: Uint8Array, signature: string, keyId: string): Promise<boolean>;
}

/** Classification regime of the Love Invariant (corollary to §9.4). */
export type InvariantRegime = 'love' | 'manipulation' | 'domination' | 'indeterminate';
