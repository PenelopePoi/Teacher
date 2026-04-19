/** Service path for the progress tracking backend service. */
export const PROGRESS_SERVICE_PATH = '/services/progress';

/** Symbol for dependency injection of the ProgressTrackingService. */
export const ProgressTrackingService = Symbol('ProgressTrackingService');

/**
 * Tracks student progress across lessons, courses, and skills.
 * All mastery values use a 0.0 to 1.0 scale (0% to 100%).
 */
export interface ProgressTrackingService {
    /** Returns the full progress record for the current student. */
    getProgress(): Promise<StudentProgress>;
    /** Records that the student has started a lesson. Creates a LessonProgress entry if none exists. */
    recordLessonStart(lessonId: string): Promise<void>;
    /**
     * Records lesson completion with a score.
     * @param score Value from 0 to 100. Converted internally to the 0.0-1.0 mastery scale.
     */
    recordLessonCompletion(lessonId: string, score: number): Promise<void>;
    /**
     * Records practice time on a specific skill.
     * @param duration Time spent in minutes.
     */
    recordSkillPractice(skill: string, duration: number): Promise<void>;
    /**
     * Returns a map of skill name to mastery level.
     * Mastery ranges from 0.0 (no exposure) to 1.0 (full mastery).
     */
    getSkillMastery(): Promise<Map<string, number>>;
    /** Returns an aggregated summary of the student's progress. */
    getSummary(): Promise<ProgressSummary>;
}

/**
 * Complete progress record for a single student.
 */
export interface StudentProgress {
    /** Unique student identifier. */
    studentId: string;
    /** Progress for each enrolled course. */
    enrolledCourses: CourseProgress[];
    /**
     * Skill mastery map — keys are skill identifiers, values range from 0.0 to 1.0.
     * - 0.0: no exposure
     * - 0.1-0.3: beginner — has seen the concept
     * - 0.4-0.6: intermediate — can apply with guidance
     * - 0.7-0.9: proficient — can apply independently
     * - 1.0: mastery — can teach it to others
     */
    skillMastery: Record<string, number>;
    /** Total time spent learning, in minutes. */
    totalTimeMinutes: number;
    /** ISO 8601 timestamp of last activity. */
    lastActive: string;
    /** Total number of lessons completed across all courses. */
    lessonsCompleted: number;
    /** Number of lessons currently in progress. */
    lessonsInProgress: number;
}

/**
 * Progress within a single course.
 */
export interface CourseProgress {
    /** Course identifier matching a CurriculumDefinition.id. */
    courseId: string;
    /** Human-readable course title. */
    courseTitle: string;
    /** Total number of lessons in this course. */
    lessonsTotal: number;
    /** Number of lessons completed so far. */
    lessonsCompleted: number;
    /** The lesson the student is currently working on, if any. */
    currentLessonId?: string;
    /** ISO 8601 timestamp of when the student enrolled. */
    startedAt: string;
    /** ISO 8601 timestamp of last activity in this course. */
    lastActivityAt: string;
}

/**
 * Tracks progress for a single lesson, including multiple attempts.
 */
export interface LessonProgress {
    /** Lesson identifier matching a LessonManifest.id. */
    lessonId: string;
    /** Current status of this lesson for the student. */
    status: 'not-started' | 'in-progress' | 'completed' | 'mastered';
    /**
     * Best score achieved, from 0 to 100.
     * Undefined if the lesson has not been attempted.
     */
    score?: number;
    /** Total number of assessment attempts. */
    attempts: number;
    /** ISO 8601 timestamp of first successful completion, if any. */
    completedAt?: string;
    /** Total time spent on this lesson across all attempts, in minutes. */
    timeSpentMinutes: number;
}

/**
 * Records a single attempt at a lesson for historical tracking.
 */
export interface LessonHistory {
    /** Lesson identifier. */
    lessonId: string;
    /** Score achieved on this attempt (0-100). */
    score: number;
    /** ISO 8601 timestamp of when this attempt started. */
    startedAt: string;
    /** ISO 8601 timestamp of when this attempt ended. */
    completedAt: string;
    /** Duration of this attempt in minutes. */
    durationMinutes: number;
    /** Feedback items returned by the assessment engine for this attempt. */
    feedback: string[];
    /** Whether this attempt met the passing threshold. */
    passed: boolean;
}

/**
 * Aggregated summary of a student's overall progress.
 */
export interface ProgressSummary {
    /** Total lessons across all enrolled courses. */
    totalLessons: number;
    /** Lessons completed across all enrolled courses. */
    completedLessons: number;
    /** Average score across all completed lessons (0-100). */
    averageScore: number;
    /** Total learning time in hours. */
    totalTimeHours: number;
    /**
     * Top skills by mastery level, sorted descending.
     * Mastery ranges from 0.0 to 1.0.
     */
    topSkills: Array<{ skill: string; mastery: number }>;
    /** Suggested next lesson ID based on the student's progress and skill gaps. */
    suggestedNextLesson?: string;
}
