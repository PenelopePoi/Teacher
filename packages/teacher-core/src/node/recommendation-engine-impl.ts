import { inject, injectable } from '@theia/core/shared/inversify';
import {
    RecommendationEngine,
    LessonRecommendation,
    WeakTopic,
    ProjectSuggestion,
    ReviewScheduleItem,
} from '../common/recommendation-engine-protocol';
import { ProgressTrackingService } from '../common/progress-protocol';
import { CurriculumService } from './curriculum-service';
import {
    ConceptTrackerSymbol,
    ConceptTracker,
} from './concept-tracker-impl';

/**
 * Recommendation engine — builds personalized learning paths from
 * progress data, weak areas, and concept mastery.
 */
@injectable()
export class RecommendationEngineImpl implements RecommendationEngine {

    @inject(ProgressTrackingService)
    protected readonly progress: ProgressTrackingService;

    @inject(CurriculumService)
    protected readonly curriculum: CurriculumService;

    @inject(ConceptTrackerSymbol)
    protected readonly concepts: ConceptTracker;

    async getNextLesson(): Promise<LessonRecommendation | undefined> {
        const weakAreas = await this.progress.getWeakAreas();
        const courses = await this.curriculum.getCourses();

        // Find a lesson that addresses a weak area
        for (const course of courses) {
            for (const mod of course.modules) {
                for (const lesson of mod.lessons) {
                    const addressesWeakness = weakAreas.some(weak =>
                        lesson.prerequisiteSkills.includes(weak) ||
                        lesson.title.toLowerCase().includes(weak.toLowerCase())
                    );
                    if (addressesWeakness) {
                        return {
                            lessonId: lesson.id,
                            title: lesson.title,
                            reason: `Addresses weak area: ${weakAreas.find(w => lesson.title.toLowerCase().includes(w.toLowerCase())) || weakAreas[0]}`,
                            priority: 1,
                        };
                    }
                }
            }
        }

        // Fallback: suggest next uncompleted lesson
        const summary = await this.progress.getSummary();
        if (summary.suggestedNextLesson) {
            const lesson = await this.curriculum.getLesson(summary.suggestedNextLesson);
            if (lesson) {
                return {
                    lessonId: lesson.id,
                    title: lesson.title,
                    reason: 'Next lesson in your learning path',
                    priority: 2,
                };
            }
        }

        return undefined;
    }

    async getWeakTopics(): Promise<WeakTopic[]> {
        const mastery = await this.progress.getSkillMastery();
        const topics: WeakTopic[] = [];

        for (const [skill, level] of mastery) {
            if (level < 0.4) {
                topics.push({
                    topicId: skill,
                    name: skill,
                    mastery: level,
                    practiceCount: Math.floor(level * 10),
                });
            }
        }

        return topics.sort((a, b) => a.mastery - b.mastery);
    }

    async getSuggestedProjects(): Promise<ProjectSuggestion[]> {
        const mastery = await this.progress.getSkillMastery();
        const knownSkills = [...mastery.entries()]
            .filter(([, level]) => level >= 0.4)
            .map(([skill]) => skill);

        const projects: ProjectSuggestion[] = [];

        if (knownSkills.some(s => s.toLowerCase().includes('function'))) {
            projects.push({
                title: 'Calculator App',
                description: 'Build a calculator with functions for each operation.',
                skillsCovered: ['Functions', 'Variables', 'Control Flow'],
                estimatedHours: 2,
                difficulty: 'beginner',
            });
        }

        if (knownSkills.some(s => s.toLowerCase().includes('array') || s.toLowerCase().includes('loop'))) {
            projects.push({
                title: 'Todo List',
                description: 'Build a task tracker with add, remove, and filter functionality.',
                skillsCovered: ['Arrays', 'Loops', 'DOM Manipulation'],
                estimatedHours: 4,
                difficulty: 'intermediate',
            });
        }

        if (knownSkills.some(s => s.toLowerCase().includes('api') || s.toLowerCase().includes('async'))) {
            projects.push({
                title: 'Weather Dashboard',
                description: 'Fetch real-time weather data and display it with charts.',
                skillsCovered: ['REST APIs', 'Async/Await', 'CSS Grid'],
                estimatedHours: 6,
                difficulty: 'intermediate',
            });
        }

        // Always include a starter project
        if (projects.length === 0) {
            projects.push({
                title: 'Personal Greeting Page',
                description: 'Create a web page that greets the visitor by name.',
                skillsCovered: ['HTML', 'CSS', 'Variables'],
                estimatedHours: 1,
                difficulty: 'beginner',
            });
        }

        return projects;
    }

    async getReviewSchedule(): Promise<ReviewScheduleItem[]> {
        const mastered = await this.concepts.getMasteredConcepts();
        const now = Date.now();
        const items: ReviewScheduleItem[] = [];

        for (const concept of mastered) {
            const masteredAtMs = concept.masteredAt ? new Date(concept.masteredAt).getTime() : now;
            const daysSinceMastered = Math.floor((now - masteredAtMs) / 86400000);
            // Spaced repetition intervals: 1, 3, 7, 14, 30 days
            const intervals = [1, 3, 7, 14, 30];
            for (const interval of intervals) {
                if (daysSinceMastered >= interval) {
                    const dueDate = new Date(masteredAtMs + interval * 86400000);
                    if (dueDate.getTime() <= now + 7 * 86400000) {
                        items.push({
                            conceptId: concept.id,
                            conceptName: concept.label,
                            dueDate: dueDate.toISOString(),
                            intervalDays: interval,
                        });
                        break;
                    }
                }
            }
        }

        return items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }
}
