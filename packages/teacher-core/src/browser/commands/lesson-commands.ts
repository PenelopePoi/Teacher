import { inject, injectable } from '@theia/core/shared/inversify';
import { Command, CommandContribution, CommandRegistry, nls } from '@theia/core';
import { KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { TeacherService } from '../../common/teacher-protocol';
import { MessageService } from '@theia/core/lib/common/message-service';

export namespace LessonCommands {

    const TEACHER_CATEGORY = 'Teacher';

    export const START_LESSON: Command = Command.toLocalizedCommand(
        { id: 'teacher.lesson.start', category: TEACHER_CATEGORY, label: 'Start Lesson' },
        'theia/teacher/startLesson'
    );

    export const CHECK_MY_WORK: Command = Command.toLocalizedCommand(
        { id: 'teacher.lesson.checkWork', category: TEACHER_CATEGORY, label: 'Check My Work' },
        'theia/teacher/checkMyWork'
    );

    export const GET_HINT: Command = Command.toLocalizedCommand(
        { id: 'teacher.lesson.getHint', category: TEACHER_CATEGORY, label: 'Get Hint' },
        'theia/teacher/getHint'
    );

    export const SUBMIT_FOR_REVIEW: Command = Command.toLocalizedCommand(
        { id: 'teacher.lesson.submitForReview', category: TEACHER_CATEGORY, label: 'Submit for Review' },
        'theia/teacher/submitForReview'
    );
}

@injectable()
export class LessonCommandContribution implements CommandContribution, KeybindingContribution {

    @inject(TeacherService)
    protected readonly teacherService: TeacherService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    protected hintLevel: number = 0;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(LessonCommands.START_LESSON, {
            execute: async () => {
                try {
                    const curriculum = await this.teacherService.getCurriculum();
                    if (!curriculum || curriculum.length === 0) {
                        this.messageService.info(nls.localize('theia/teacher/noCurriculum',
                            'No curriculum found. Configure a curriculum directory in Teacher settings.'));
                        return;
                    }
                    const firstLesson = curriculum[0]?.modules?.[0]?.lessons?.[0];
                    if (firstLesson) {
                        await this.teacherService.startLesson(firstLesson.id);
                        this.hintLevel = 0;
                        this.messageService.info(nls.localize('theia/teacher/lessonStarted',
                            'Lesson started: {0}', firstLesson.title));
                    } else {
                        this.messageService.warn(nls.localize('theia/teacher/noLessonsInCurriculum',
                            'Curriculum found but contains no lessons. Check your curriculum files.'));
                    }
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    this.messageService.error(nls.localize('theia/teacher/startLessonError',
                        'Failed to start lesson: {0}', message));
                }
            }
        });

        registry.registerCommand(LessonCommands.CHECK_MY_WORK, {
            execute: async () => {
                try {
                    const lesson = await this.teacherService.getActiveLessonContext();
                    if (!lesson) {
                        this.messageService.warn(nls.localize('theia/teacher/noActiveLesson',
                            'No active lesson. Start a lesson first.'));
                        return;
                    }
                    this.messageService.info(nls.localize('theia/teacher/checkingWork',
                        'Assessing your work on "{0}"...', lesson.title));
                    const result = await this.teacherService.checkWork(lesson.id);
                    if (result.passed) {
                        const feedbackSummary = result.feedback.length > 0
                            ? ' ' + result.feedback.slice(0, 3).join(' | ')
                            : '';
                        this.messageService.info(nls.localize('theia/teacher/workPassed',
                            'Great job! Score: {0}%.{1}', String(result.score), feedbackSummary));
                    } else {
                        const feedbackItems = result.feedback.length > 0
                            ? result.feedback.slice(0, 3).join(' | ')
                            : 'Keep trying.';
                        this.messageService.warn(nls.localize(
                            'theia/teacher/workNeedsImprovement',
                            'Score: {0}%. Feedback: {1}',
                            String(result.score),
                            feedbackItems
                        ));
                    }
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    this.messageService.error(nls.localize('theia/teacher/checkWorkError',
                        'Assessment failed: {0}', message));
                }
            }
        });

        registry.registerCommand(LessonCommands.GET_HINT, {
            execute: async () => {
                try {
                    const lesson = await this.teacherService.getActiveLessonContext();
                    if (!lesson) {
                        this.messageService.warn(nls.localize('theia/teacher/noActiveLesson',
                            'No active lesson. Start a lesson first.'));
                        return;
                    }
                    const maxHintLevel = Math.max((lesson.hints?.length || 1) - 1, 0);
                    const clampedLevel = Math.max(0, Math.min(this.hintLevel, maxHintLevel));
                    const hint = await this.teacherService.getHint(lesson.id, clampedLevel);
                    const hintLabel = clampedLevel < maxHintLevel
                        ? nls.localize('theia/teacher/hintWithLevel',
                            'Hint {0}/{1}: {2}', String(clampedLevel + 1), String(maxHintLevel + 1), hint)
                        : nls.localize('theia/teacher/hintFinal',
                            'Final hint: {0}', hint);
                    this.messageService.info(hintLabel);
                    this.hintLevel = Math.min(this.hintLevel + 1, maxHintLevel);
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    this.messageService.error(nls.localize('theia/teacher/getHintError',
                        'Could not retrieve hint: {0}', message));
                }
            }
        });

        registry.registerCommand(LessonCommands.SUBMIT_FOR_REVIEW, {
            execute: async () => {
                try {
                    const lesson = await this.teacherService.getActiveLessonContext();
                    if (!lesson) {
                        this.messageService.warn(nls.localize('theia/teacher/noActiveLesson',
                            'No active lesson. Start a lesson first.'));
                        return;
                    }
                    this.messageService.info(nls.localize(
                        'theia/teacher/submittingForReview',
                        'Submitting "{0}" for AI review...', lesson.title
                    ));
                    const result = await this.teacherService.checkWork(lesson.id);
                    const feedbackSummary = result.feedback.length > 0
                        ? result.feedback.slice(0, 3).join(' | ')
                        : 'No specific feedback.';
                    if (result.passed) {
                        this.messageService.info(nls.localize(
                            'theia/teacher/reviewComplete',
                            'Review complete — Score: {0}%. {1}. Check the chat for detailed feedback.',
                            String(result.score), feedbackSummary
                        ));
                    } else {
                        this.messageService.warn(nls.localize(
                            'theia/teacher/reviewNeedsWork',
                            'Review complete — Score: {0}%. {1}. Check the chat for detailed feedback.',
                            String(result.score), feedbackSummary
                        ));
                    }
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    this.messageService.error(nls.localize('theia/teacher/submitReviewError',
                        'Review submission failed: {0}', message));
                }
            }
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: LessonCommands.START_LESSON.id,
            keybinding: 'ctrlcmd+shift+l'
        });
        registry.registerKeybinding({
            command: LessonCommands.CHECK_MY_WORK.id,
            keybinding: 'ctrlcmd+shift+c'
        });
        registry.registerKeybinding({
            command: LessonCommands.GET_HINT.id,
            keybinding: 'ctrlcmd+shift+h'
        });
        registry.registerKeybinding({
            command: LessonCommands.SUBMIT_FOR_REVIEW.id,
            keybinding: 'ctrlcmd+shift+r'
        });
    }
}
