import { MaybePromise, nls } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import {
    AIVariable, ResolvedAIVariable, AIVariableContribution, AIVariableResolver,
    AIVariableService, AIVariableResolutionRequest, AIVariableContext
} from '@theia/ai-core/lib/common/variable-service';
import { TeacherService, LessonManifest } from '../common/teacher-protocol';

export const LESSON_CONTEXT_VARIABLE: AIVariable = {
    id: 'teacher-lesson-context',
    description: nls.localize('theia/teacher/lessonContextVariable', 'Provides current lesson context including objectives, hints, and assessment criteria'),
    name: 'lessonContext'
};

@injectable()
export class LessonContextVariableContribution implements AIVariableContribution, AIVariableResolver {

    @inject(TeacherService)
    protected readonly teacherService: TeacherService;

    registerVariables(service: AIVariableService): void {
        service.registerResolver(LESSON_CONTEXT_VARIABLE, this);
    }

    canResolve(request: AIVariableResolutionRequest, context: AIVariableContext): MaybePromise<number> {
        if (request.variable.name === LESSON_CONTEXT_VARIABLE.name) {
            return 1;
        }
        return -1;
    }

    async resolve(request: AIVariableResolutionRequest, context: AIVariableContext): Promise<ResolvedAIVariable | undefined> {
        if (request.variable.name !== LESSON_CONTEXT_VARIABLE.name) {
            return undefined;
        }

        try {
            const lesson = await this.teacherService.getActiveLessonContext();
            if (!lesson) {
                return {
                    variable: request.variable,
                    value: 'No active lesson in the current workspace.'
                };
            }

            const contextValue = this.formatLessonContext(lesson);
            return {
                variable: request.variable,
                value: contextValue
            };
        } catch {
            return {
                variable: request.variable,
                value: 'Unable to load lesson context.'
            };
        }
    }

    protected formatLessonContext(lesson: LessonManifest): string {
        const sections: string[] = [
            `## Current Lesson: ${lesson.title}`,
            '',
            '### Objectives',
            ...lesson.objectives.map((obj, i) => `${i + 1}. ${obj}`),
            '',
            '### Assessment Criteria',
            ...lesson.assessmentCriteria.map((c, i) => `${i + 1}. ${c}`),
            '',
            `### Estimated Time: ${lesson.estimatedMinutes} minutes`,
        ];

        if (lesson.prerequisiteSkills.length > 0) {
            sections.push('', '### Prerequisites');
            sections.push(...lesson.prerequisiteSkills.map(s => `- ${s}`));
        }

        if (lesson.hints.length > 0) {
            sections.push('', `### Available Hints: ${lesson.hints.length} levels`);
        }

        return sections.join('\n');
    }
}
