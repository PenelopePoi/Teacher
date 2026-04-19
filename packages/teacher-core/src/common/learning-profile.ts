/**
 * Represents the student's learning profile, used by agents to personalize
 * instruction, track progress, and adapt difficulty.
 *
 * Corresponds to the `.teacher/learning-profile.json` file in a workspace.
 */
export interface LearningProfile {
    /** Current skill level of the student. */
    studentLevel: 'beginner' | 'intermediate' | 'advanced';
    /** Preferred learning style. */
    preferredStyle: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
    /** Concept identifiers the student has completed/mastered. */
    completedConcepts: string[];
    /** Concept identifiers or topics where the student struggles. */
    weakAreas: string[];
    /** Number of consecutive days with learning activity. */
    streakDays: number;
    /** Total hours spent learning across all sessions. */
    totalHours: number;
    /** Student-defined learning goals (free-form strings). */
    goals: string[];
}

export namespace LearningProfile {
    /** Creates a default learning profile for a new student. */
    export function createDefault(): LearningProfile {
        return {
            studentLevel: 'beginner',
            preferredStyle: 'kinesthetic',
            completedConcepts: [],
            weakAreas: [],
            streakDays: 0,
            totalHours: 0,
            goals: []
        };
    }
}
