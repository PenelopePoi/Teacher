/**
 * Protocol interfaces for learning milestones in Teacher IDE.
 * Milestones mark significant achievements in the student's learning journey.
 */

/**
 * A learning milestone — a significant achievement the student can unlock.
 */
export interface Milestone {
    /** Unique milestone identifier (e.g., 'first-function', 'ten-lessons'). */
    id: string;
    /** Human-readable milestone title (e.g., "Function Craftsman"). */
    title: string;
    /** Description of what this milestone represents. */
    description: string;
    /** Concept IDs that must be mastered to unlock this milestone. */
    requiredConcepts: string[];
    /** ISO 8601 timestamp of when the milestone was completed, if completed. */
    completedAt?: string;
    /** Message displayed when the student unlocks this milestone. */
    celebrationMessage: string;
}

/** Symbol for dependency injection of the MilestoneService. */
export const MilestoneService = Symbol('MilestoneService');

/**
 * Service for managing learning milestones — checking progress,
 * unlocking achievements, and celebrating student accomplishments.
 */
export interface MilestoneService {
    /** Returns all defined milestones with their current completion state. */
    getMilestones(): Promise<Milestone[]>;
    /**
     * Checks whether a specific milestone has been completed.
     * Returns true if all required concepts are mastered.
     */
    checkMilestone(id: string): Promise<boolean>;
    /**
     * Triggers the celebration UI/notification for a completed milestone.
     * Should only be called after checkMilestone returns true.
     */
    celebrateMilestone(id: string): Promise<void>;
    /**
     * Returns the next milestone the student is closest to completing,
     * or undefined if all milestones are completed.
     */
    getNextMilestone(): Promise<Milestone | undefined>;
}
