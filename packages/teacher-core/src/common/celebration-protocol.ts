/**
 * Defines the interface for milestone celebrations.
 * When a student achieves a milestone, the system emits a CelebrationEvent
 * that can be displayed in the UI via confetti, notifications, or animations.
 */

/**
 * Available animation styles for milestone celebrations.
 */
export type CelebrationAnimation =
    | 'confetti'
    | 'fireworks'
    | 'star-burst'
    | 'level-up'
    | 'trophy'
    | 'none';

/**
 * Emitted when a student achieves a milestone.
 */
export interface CelebrationEvent {
    /** The milestone identifier that was just achieved. */
    milestone: string;
    /** Human-readable congratulation message to display. */
    message: string;
    /** ISO 8601 timestamp of when the milestone was achieved. */
    timestamp: string;
    /** The animation style to play in the UI. */
    animation: CelebrationAnimation;
}

/**
 * Symbol for dependency injection of the CelebrationService.
 */
export const CelebrationServiceSymbol = Symbol('CelebrationService');

/**
 * Service for triggering and observing milestone celebrations.
 */
export interface CelebrationService {
    /** Fire a celebration event for the given milestone. */
    celebrate(milestone: string, message: string, animation?: CelebrationAnimation): Promise<CelebrationEvent>;
    /** Return the history of all celebrations. */
    getCelebrationHistory(): Promise<CelebrationEvent[]>;
}
