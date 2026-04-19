import { inject, injectable } from '@theia/core/shared/inversify';
import { Command, CommandContribution, CommandRegistry } from '@theia/core';
import { ApplicationShell, WidgetManager } from '@theia/core/lib/browser';

export namespace WelcomeCommands {

    const TEACHER_CATEGORY = 'Teacher';

    export const ASK_TUTOR: Command = Command.toLocalizedCommand(
        { id: 'teacher.askTutor', category: TEACHER_CATEGORY, label: 'Ask Tutor' },
        'theia/teacher/askTutor'
    );

    export const START_LESSON: Command = Command.toLocalizedCommand(
        { id: 'teacher.startLesson', category: TEACHER_CATEGORY, label: 'Open Curriculum Browser' },
        'theia/teacher/openCurriculum'
    );

    export const VIEW_PROGRESS: Command = Command.toLocalizedCommand(
        { id: 'teacher.viewProgress', category: TEACHER_CATEGORY, label: 'View Progress Dashboard' },
        'theia/teacher/viewProgress'
    );

    export const BROWSE_SKILLS: Command = Command.toLocalizedCommand(
        { id: 'teacher.browseSkills', category: TEACHER_CATEGORY, label: 'Browse Skills' },
        'theia/teacher/browseSkills'
    );

    export const VIEW_ACHIEVEMENTS: Command = Command.toLocalizedCommand(
        { id: 'teacher.viewAchievements', category: TEACHER_CATEGORY, label: 'View Achievements' },
        'theia/teacher/viewAchievements'
    );

    export const DAILY_CHALLENGES: Command = Command.toLocalizedCommand(
        { id: 'teacher.dailyChallenges', category: TEACHER_CATEGORY, label: 'Daily Challenges' },
        'theia/teacher/dailyChallenges'
    );
}

@injectable()
export class WelcomeCommandContribution implements CommandContribution {

    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;

    @inject(WidgetManager)
    protected readonly widgetManager: WidgetManager;

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(WelcomeCommands.ASK_TUTOR, {
            execute: async () => {
                try {
                    await this.commandRegistry.executeCommand('ai-chat:open');
                } catch {
                    // Fallback: try opening the AI chat widget directly
                    try {
                        const widget = await this.widgetManager.getOrCreateWidget('ai-chat-widget');
                        await this.shell.activateWidget(widget.id);
                    } catch {
                        console.warn('Could not open AI Chat panel.');
                    }
                }
            }
        });

        registry.registerCommand(WelcomeCommands.START_LESSON, {
            execute: async () => {
                await this.openWidget('teacher-curriculum-browser');
            }
        });

        registry.registerCommand(WelcomeCommands.VIEW_PROGRESS, {
            execute: async () => {
                await this.openWidget('teacher-progress-dashboard');
            }
        });

        registry.registerCommand(WelcomeCommands.BROWSE_SKILLS, {
            execute: async () => {
                await this.openWidget('teacher-skill-browser');
            }
        });

        registry.registerCommand(WelcomeCommands.VIEW_ACHIEVEMENTS, {
            execute: async () => {
                await this.openWidget('teacher-achievements');
            }
        });

        registry.registerCommand(WelcomeCommands.DAILY_CHALLENGES, {
            execute: async () => {
                await this.openWidget('teacher-challenges');
            }
        });
    }

    protected async openWidget(widgetId: string): Promise<void> {
        try {
            const widget = await this.widgetManager.getOrCreateWidget(widgetId);
            await this.shell.activateWidget(widget.id);
        } catch (error) {
            console.warn(`Could not open widget '${widgetId}':`, error);
        }
    }
}
