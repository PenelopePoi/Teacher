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
                const curriculum = await this.teacherService.getCurriculum();
                if (!curriculum || curriculum.length === 0) {
                    this.messageService.info(nls.localize('theia/teacher/noCurriculum', 'No curriculum found. Configure a curriculum directory in Teacher settings.'));
                    return;
                }
                // Start the first available lesson
                const firstLesson = curriculum[0]?.modules?.[0]?.lessons?.[0];
                if (firstLesson) {
                    await this.teacherService.startLesson(firstLesson.id);
                    this.hintLevel = 0;
                    this.messageService.info(nls.localize('theia/teacher/lessonStarted', 'Lesson started: {0}', firstLesson.title));
                }
            }
        });

        registry.registerCommand(LessonCommands.CHECK_MY_WORK, {
            execute: async () => {
                const lesson = await this.teacherService.getActiveLessonContext();
                if (!lesson) {
                    this.messageService.warn(nls.localize('theia/teacher/noActiveLesson', 'No active lesson. Start a lesson first.'));
                    return;
                }
                this.messageService.info(nls.localize('theia/teacher/checkingWork', 'Checking your work...'));
                const result = await this.teacherService.checkWork(lesson.id);
                if (result.passed) {
                    this.messageService.info(nls.localize('theia/teacher/workPassed', 'Great job! Score: {0}%', String(result.score)));
                } else {
                    this.messageService.warn(nls.localize(
                        'theia/teacher/workNeedsImprovement',
                        'Score: {0}%. {1}',
                        String(result.score),
                        result.feedback[0] || 'Keep trying.'
                    ));
                }
            }
        });

        registry.registerCommand(LessonCommands.GET_HINT, {
            execute: async () => {
                const lesson = await this.teacherService.getActiveLessonContext();
                if (!lesson) {
                    this.messageService.warn(nls.localize('theia/teacher/noActiveLesson', 'No active lesson. Start a lesson first.'));
                    return;
                }
                const hint = await this.teacherService.getHint(lesson.id, this.hintLevel);
                this.hintLevel = Math.min(this.hintLevel + 1, (lesson.hints?.length || 1) - 1);
                this.messageService.info(hint);
            }
        });

        registry.registerCommand(LessonCommands.SUBMIT_FOR_REVIEW, {
            execute: async () => {
                const lesson = await this.teacherService.getActiveLessonContext();
                if (!lesson) {
                    this.messageService.warn(nls.localize('theia/teacher/noActiveLesson', 'No active lesson. Start a lesson first.'));
                    return;
                }
                this.messageService.info(nls.localize(
                    'theia/teacher/submittedForReview',
                    'Submitted "{0}" for AI review. Check the chat for feedback.',
                    lesson.title
                ));
                await this.teacherService.checkWork(lesson.id);
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
