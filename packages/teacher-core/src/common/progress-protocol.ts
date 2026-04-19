export const PROGRESS_SERVICE_PATH = '/services/progress';

export const ProgressTrackingService = Symbol('ProgressTrackingService');
export interface ProgressTrackingService {
    getProgress(): Promise<StudentProgress>;
    recordLessonStart(lessonId: string): Promise<void>;
    recordLessonCompletion(lessonId: string, score: number): Promise<void>;
    recordSkillPractice(skill: string, duration: number): Promise<void>;
    getSkillMastery(): Promise<Map<string, number>>;
    getSummary(): Promise<ProgressSummary>;
}

export interface StudentProgress {
    studentId: string;
    enrolledCourses: CourseProgress[];
    skillMastery: Record<string, number>;
    totalTimeMinutes: number;
    lastActive: string;
    lessonsCompleted: number;
    lessonsInProgress: number;
}

export interface CourseProgress {
    courseId: string;
    courseTitle: string;
    lessonsTotal: number;
    lessonsCompleted: number;
    currentLessonId?: string;
    startedAt: string;
    lastActivityAt: string;
}

export interface LessonProgress {
    lessonId: string;
    status: 'not-started' | 'in-progress' | 'completed' | 'mastered';
    score?: number;
    attempts: number;
    completedAt?: string;
    timeSpentMinutes: number;
}

export interface ProgressSummary {
    totalLessons: number;
    completedLessons: number;
    averageScore: number;
    totalTimeHours: number;
    topSkills: Array<{ skill: string; mastery: number }>;
    suggestedNextLesson?: string;
}
