/**
 * Friction Protocol — shared types for student struggle/friction detection.
 *
 * Qualtrics-inspired: detect when a student is struggling BEFORE they ask
 * for help. Proactive, not reactive. Non-interrupting.
 */

/**
 * Discriminated friction signal types.
 * Each maps to a specific behavioral pattern that indicates struggle.
 */
export enum FrictionType {
    /** Student undoes/redoes >5 times in 30 seconds — stuck in a loop. */
    UndoRedoCycle = 'undo-redo-cycle',
    /** Compiler error appears, student doesn't type for >60 seconds. */
    ErrorPause = 'error-pause',
    /** Same test fails 3+ times in a row. */
    RepeatedTestFailure = 'repeated-test-failure',
    /** Student deletes more than they write — negative progress. */
    ExcessiveDeletions = 'excessive-deletions',
    /** Student opens docs/Stack Overflow in quick succession. */
    HelpSeeking = 'help-seeking',
    /** Student retakes assessment 3+ times without improvement. */
    AssessmentRetries = 'assessment-retries',
    /** No activity for 5+ minutes during a lesson. */
    SessionAbandonment = 'session-abandonment',
    /** Student hovers over Teachable Moments repeatedly for same concept. */
    ConceptConfusion = 'concept-confusion',
}

/** How urgent the friction signal is. */
export type FrictionSeverity = 'mild' | 'moderate' | 'high';

/**
 * A single detected friction event.
 * Created by StudentFrictionService when behavioral thresholds are crossed.
 */
export interface FrictionEvent {
    /** Unique identifier for this event. */
    readonly id: string;
    /** The type of friction detected. */
    readonly type: FrictionType;
    /** Severity — drives notification urgency and visual styling. */
    readonly severity: FrictionSeverity;
    /** ISO 8601 timestamp of when the friction was detected. */
    readonly timestamp: string;
    /** Additional context about the friction (error text, test name, etc.). */
    readonly context: string;
    /** Human-readable intervention suggestion for the student. */
    readonly suggestedIntervention: string;
    /** Whether the student acted on the suggested intervention. */
    resolved: boolean;
}

/**
 * Session health score derived from friction frequency and resolution.
 * 0 = severe struggle, 100 = smooth sailing.
 */
export interface SessionHealthScore {
    /** Current score (0-100). */
    readonly score: number;
    /** Total friction events detected this session. */
    readonly totalFrictions: number;
    /** How many frictions the student resolved via intervention. */
    readonly resolvedFrictions: number;
    /** Most common friction type this session, if any. */
    readonly dominantFrictionType?: FrictionType;
    /** ISO 8601 timestamp of when this score was computed. */
    readonly computedAt: string;
}
