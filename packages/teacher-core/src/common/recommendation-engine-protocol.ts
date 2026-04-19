/**
 * Service path for the RecommendationEngine backend.
 */
export const RECOMMENDATION_ENGINE_PATH = '/services/recommendation-engine';

/**
 * Symbol for dependency injection of the RecommendationEngine.
 */
export const RecommendationEngineSymbol = Symbol('RecommendationEngine');

/**
 * A recommended lesson for the student.
 */
export interface LessonRecommendation {
    /** Lesson identifier. */
    lessonId: string;
    /** Human-readable lesson title. */
    title: string;
    /** Why this lesson is recommended (e.g., "Addresses weak area: closures"). */
    reason: string;
    /** Priority from 1 (highest) to 10 (lowest). */
    priority: number;
}

/**
 * A topic identified as weak for the student.
 */
export interface WeakTopic {
    /** Topic identifier. */
    topicId: string;
    /** Human-readable topic name. */
    name: string;
    /** Current mastery level (0.0 to 1.0). */
    mastery: number;
    /** Number of times the student has practiced this topic. */
    practiceCount: number;
}

/**
 * A project suggestion based on the student's current level and interests.
 */
export interface ProjectSuggestion {
    /** Short title for the project. */
    title: string;
    /** Description of what the project involves. */
    description: string;
    /** Skills the student will practice. */
    skillsCovered: string[];
    /** Estimated time to complete in hours. */
    estimatedHours: number;
    /** Difficulty: beginner, intermediate, or advanced. */
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * A scheduled review item for spaced repetition.
 */
export interface ReviewScheduleItem {
    /** Concept identifier to review. */
    conceptId: string;
    /** Human-readable concept name. */
    conceptName: string;
    /** ISO 8601 date when the review is due. */
    dueDate: string;
    /** Review interval in days since last review. */
    intervalDays: number;
}

/**
 * Provides personalized learning recommendations based on
 * the student's profile, progress, and concept mastery.
 */
export interface RecommendationEngine {
    /** Get the next recommended lesson based on the student's progress and weak areas. */
    getNextLesson(): Promise<LessonRecommendation | undefined>;
    /** Return topics where the student's mastery is below the target threshold. */
    getWeakTopics(): Promise<WeakTopic[]>;
    /** Generate project suggestions tailored to the student's level and interests. */
    getSuggestedProjects(): Promise<ProjectSuggestion[]>;
    /** Return a spaced-repetition review schedule for previously learned concepts. */
    getReviewSchedule(): Promise<ReviewScheduleItem[]>;
}
