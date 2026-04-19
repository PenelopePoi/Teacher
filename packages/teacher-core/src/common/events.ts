/**
 * Centralized event types for Teacher IDE.
 * All cross-cutting events flow through these types to enable
 * consistent logging, analytics, and inter-component communication.
 */

/**
 * Discriminated union of all Teacher event types.
 * Use this as the key in event handlers and event bus subscriptions.
 */
export type TeacherEventType =
    | 'concept-learned'
    | 'milestone-reached'
    | 'session-start'
    | 'session-end'
    | 'agent-handoff'
    | 'skill-executed'
    | 'checkpoint-created'
    | 'plan-approved';

/**
 * A single event emitted by Teacher IDE subsystems.
 * Consumers can subscribe to specific `type` values to react to
 * learning milestones, agent transitions, or session lifecycle changes.
 */
export interface TeacherEvent<T = unknown> {
    /** Discriminator identifying the kind of event. */
    type: TeacherEventType;
    /** ISO 8601 timestamp of when the event occurred. */
    timestamp: string;
    /** Event-specific payload. Shape depends on `type`. */
    data: T;
}

/** Payload for `concept-learned` events. */
export interface ConceptLearnedData {
    /** Concept identifier (e.g., 'js-closures'). */
    conceptId: string;
    /** New mastery level (0.0 to 1.0). */
    masteryLevel: number;
    /** Lesson that triggered the learning, if any. */
    lessonId?: string;
}

/** Payload for `milestone-reached` events. */
export interface MilestoneReachedData {
    /** Human-readable milestone name. */
    milestone: string;
    /** Number of lessons completed at this point. */
    lessonsCompleted: number;
}

/** Payload for `session-start` and `session-end` events. */
export interface SessionData {
    /** Unique session identifier. */
    sessionId: string;
    /** Duration in minutes (only set for session-end). */
    durationMinutes?: number;
}

/** Payload for `agent-handoff` events. */
export interface AgentHandoffData {
    /** ID of the agent handing off. */
    fromAgentId: string;
    /** ID of the agent receiving the handoff. */
    toAgentId: string;
    /** Reason for the handoff. */
    reason: string;
}

/** Payload for `skill-executed` events. */
export interface SkillExecutedData {
    /** Name of the executed skill. */
    skillName: string;
    /** Quality score (0 to 10). */
    score: number;
    /** Execution duration in milliseconds. */
    durationMs: number;
}

/** Payload for `checkpoint-created` events. */
export interface CheckpointCreatedData {
    /** Checkpoint identifier. */
    checkpointId: string;
    /** Number of agent actions since last checkpoint. */
    actionsSinceLastCheckpoint: number;
}

/** Payload for `plan-approved` events. */
export interface PlanApprovedData {
    /** Plan identifier. */
    planId: string;
    /** Number of steps in the approved plan. */
    stepCount: number;
}
