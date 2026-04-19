/**
 * Available teaching styles that control how the tutor presents information.
 *
 * - SOCRATIC: Asks guiding questions to lead the student to discover answers.
 * - DIRECT: Gives clear, concise explanations with minimal back-and-forth.
 * - EXAMPLE_FIRST: Shows a working example first, then explains the concepts.
 * - ANALOGY_HEAVY: Uses analogies and metaphors to map new concepts to familiar ones.
 * - PROJECT_BASED: Teaches through building a real project step-by-step.
 */
export enum TeachingStyle {
    SOCRATIC = 'socratic',
    DIRECT = 'direct',
    EXAMPLE_FIRST = 'example-first',
    ANALOGY_HEAVY = 'analogy-heavy',
    PROJECT_BASED = 'project-based',
}

/**
 * Symbol for dependency injection of the TeachingStyleService.
 */
export const TeachingStyleServiceSymbol = Symbol('TeachingStyleService');

/**
 * Service for getting and setting the student's preferred teaching style.
 */
export interface TeachingStyleService {
    /** Get the student's current preferred teaching style. */
    getPreferredStyle(): Promise<TeachingStyle>;
    /** Set the student's preferred teaching style. */
    setPreferredStyle(style: TeachingStyle): Promise<void>;
    /** Get all available teaching styles with descriptions. */
    getAvailableStyles(): Promise<TeachingStyleInfo[]>;
}

/**
 * Information about a teaching style option.
 */
export interface TeachingStyleInfo {
    /** The style enum value. */
    style: TeachingStyle;
    /** Human-readable label. */
    label: string;
    /** Description of how this style works. */
    description: string;
}
