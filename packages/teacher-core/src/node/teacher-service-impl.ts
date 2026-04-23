import { inject, injectable } from '@theia/core/shared/inversify';
import {
    TeacherService,
    LessonManifest,
    CurriculumDefinition,
    AssessmentResult,
    MasteryLevel,
} from '../common/teacher-protocol';
import { LearningProfile } from '../common/learning-profile';
import { CurriculumService } from './curriculum-service';
import { AssessmentService } from './assessment-service';
import {
    LearningProfileServiceSymbol,
    LearningProfileService,
} from './learning-profile-service';
import {
    ConceptTrackerSymbol,
    ConceptTracker,
} from './concept-tracker-impl';

/**
 * Orchestrates lesson lifecycle — start, check work, hints, and learning profile.
 * Delegates to CurriculumService, AssessmentService, LearningProfileService, and ConceptTracker.
 */
@injectable()
export class TeacherServiceImpl implements TeacherService {

    @inject(CurriculumService)
    protected readonly curriculumService: CurriculumService;

    @inject(AssessmentService)
    protected readonly assessmentService: AssessmentService;

    @inject(LearningProfileServiceSymbol)
    protected readonly learningProfileService: LearningProfileService;

    @inject(ConceptTrackerSymbol)
    protected readonly conceptTracker: ConceptTracker;

    /** The currently active lesson ID, or undefined. */
    protected activeLessonId: string | undefined;

    async getActiveLessonContext(): Promise<LessonManifest | undefined> {
        if (!this.activeLessonId) {
            return undefined;
        }
        return this.curriculumService.getLesson(this.activeLessonId);
    }

    async getCurriculum(): Promise<CurriculumDefinition[]> {
        return this.curriculumService.getCourses();
    }

    async startLesson(lessonId: string): Promise<void> {
        const lesson = await this.curriculumService.getLesson(lessonId);
        if (!lesson) {
            throw new Error(`Lesson not found: ${lessonId}`);
        }
        this.activeLessonId = lessonId;
        console.info(`[TeacherService] Started lesson: ${lessonId} — ${lesson.title}`);
    }

    async checkWork(lessonId: string): Promise<AssessmentResult> {
        return this.assessmentService.runAssessment(lessonId);
    }

    async getHint(lessonId: string, hintLevel: number): Promise<string> {
        const lesson = await this.curriculumService.getLesson(lessonId);
        if (!lesson) {
            return 'Lesson not found.';
        }
        if (lesson.hints.length === 0) {
            return 'No hints available for this lesson.';
        }
        const clampedLevel = Math.max(0, Math.min(hintLevel, lesson.hints.length - 1));
        return lesson.hints[clampedLevel];
    }

    async getLearningProfile(): Promise<LearningProfile> {
        return this.learningProfileService.getProfile();
    }

    async updateLearningProfile(profile: Partial<LearningProfile>): Promise<void> {
        await this.learningProfileService.updateProfile(profile);
    }

    async recordConceptMastery(concept: string, level: MasteryLevel): Promise<void> {
        const clamped = Math.max(0, Math.min(1, level));
        await this.conceptTracker.recordConceptSeen(concept, concept);
        if (clamped >= 0.8) {
            await this.conceptTracker.markMastered(concept);
        }
    }
}
