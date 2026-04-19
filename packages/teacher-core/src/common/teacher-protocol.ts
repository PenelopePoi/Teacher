/** Service path for the Teacher backend service. */
export const TEACHER_SERVICE_PATH = '/services/teacher';

/** Status of a lesson within the curriculum. */
export type LessonStatus = 'locked' | 'available' | 'in-progress' | 'completed' | 'mastered';

/**
 * Describes a single lesson within a curriculum module.
 * Contains everything needed to present, guide, and assess the student.
 */
export interface LessonManifest {
    /** Unique identifier for this lesson (e.g., "js-101-variables"). */
    id: string;
    /** Human-readable lesson title shown in the UI. */
    title: string;
    /** Learning objectives the student should achieve by completing this lesson. */
    objectives: string[];
    /**
     * Progressive hints — ordered from vague to specific.
     * Index 0 is the gentlest nudge; the last element is nearly the answer.
     */
    hints: string[];
    /**
     * Criteria used by the assessment engine to evaluate the student's work.
     * Each string describes one pass/fail check (e.g., "Function returns a number").
     */
    assessmentCriteria: string[];
    /** Estimated time to complete this lesson, in minutes. */
    estimatedMinutes: number;
    /** Skill identifiers the student should have before attempting this lesson. */
    prerequisiteSkills: string[];
}

/**
 * Top-level curriculum container — a full course or program of study.
 */
export interface CurriculumDefinition {
    /** Unique identifier for this curriculum. */
    id: string;
    /** Display title for the curriculum. */
    title: string;
    /** Brief description of what this curriculum covers. */
    description: string;
    /** Ordered list of modules within this curriculum. */
    modules: CurriculumModule[];
    /** Optional: number of academic credit hours this curriculum is worth. */
    creditHours?: number;
}

/**
 * A module groups related lessons within a curriculum.
 */
export interface CurriculumModule {
    /** Unique identifier for this module. */
    id: string;
    /** Display title for the module. */
    title: string;
    /** Ordered list of lessons in this module. */
    lessons: LessonManifest[];
}

/** Symbol for dependency injection of the TeacherService. */
export const TeacherService = Symbol('TeacherService');

/**
 * Core service for lesson management — starting lessons, checking work,
 * and retrieving curriculum data.
 */
export interface TeacherService {
    /** Returns the currently active lesson, or undefined if no lesson is in progress. */
    getActiveLessonContext(): Promise<LessonManifest | undefined>;
    /** Returns all available curricula. */
    getCurriculum(): Promise<CurriculumDefinition[]>;
    /** Starts a lesson by its ID, making it the active lesson. */
    startLesson(lessonId: string): Promise<void>;
    /**
     * Evaluates the student's current work against the lesson's assessment criteria.
     * Returns a result with a score (0-100) and feedback items.
     */
    checkWork(lessonId: string): Promise<AssessmentResult>;
    /**
     * Returns a hint for the given lesson at the specified level.
     * @param hintLevel 0 = gentlest nudge, higher = more specific. Clamped to available hints.
     */
    getHint(lessonId: string, hintLevel: number): Promise<string>;
}

/**
 * Result of an automated assessment of the student's work.
 */
export interface AssessmentResult {
    /** The lesson that was assessed. */
    lessonId: string;
    /** Whether the student met all passing criteria. */
    passed: boolean;
    /**
     * Numeric score from 0 to 100.
     * - 0-49: significant gaps remain
     * - 50-79: partial understanding, needs improvement
     * - 80-94: solid understanding
     * - 95-100: mastery
     */
    score: number;
    /** Ordered feedback items — most important first. */
    feedback: string[];
    /** ISO 8601 timestamp of when the assessment was performed. */
    timestamp: string;
}
