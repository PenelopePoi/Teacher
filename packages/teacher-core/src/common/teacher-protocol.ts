export const TEACHER_SERVICE_PATH = '/services/teacher';

export interface LessonManifest {
    id: string;
    title: string;
    objectives: string[];
    hints: string[];
    assessmentCriteria: string[];
    estimatedMinutes: number;
    prerequisiteSkills: string[];
}

export interface CurriculumDefinition {
    id: string;
    title: string;
    description: string;
    modules: CurriculumModule[];
    creditHours?: number;
}

export interface CurriculumModule {
    id: string;
    title: string;
    lessons: LessonManifest[];
}

export const TeacherService = Symbol('TeacherService');
export interface TeacherService {
    getActiveLessonContext(): Promise<LessonManifest | undefined>;
    getCurriculum(): Promise<CurriculumDefinition[]>;
    startLesson(lessonId: string): Promise<void>;
    checkWork(lessonId: string): Promise<AssessmentResult>;
    getHint(lessonId: string, hintLevel: number): Promise<string>;
}

export interface AssessmentResult {
    lessonId: string;
    passed: boolean;
    score: number;
    feedback: string[];
    timestamp: string;
}
