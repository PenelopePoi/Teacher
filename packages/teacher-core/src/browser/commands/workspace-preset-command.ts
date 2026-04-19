import { injectable, inject } from '@theia/core/shared/inversify';
import { Command, CommandContribution, CommandRegistry, nls } from '@theia/core/lib/common';
import { ApplicationShell, KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { WidgetManager } from '@theia/core/lib/browser/widget-manager';
import { MessageService } from '@theia/core/lib/common/message-service';
import { TeacherWelcomeWidget } from '../widgets/teacher-welcome-widget';
import { ProgressDashboardWidget } from '../widgets/progress-dashboard-widget';
import { LearningPathWidget } from '../widgets/learning-path-widget';
import { SkillBrowserWidget } from '../widgets/skill-browser-widget';
import { CanvasWidget } from '../widgets/canvas-widget';

export const WorkspacePresetCommand: Command = {
    id: 'teacher.workspace.learningPreset',
    category: 'Teacher',
    label: nls.localize(
        'theia/teacher/workspacePreset',
        'Teacher: Open Learning Workspace',
    ),
};

@injectable()
export class WorkspacePresetContribution implements CommandContribution, KeybindingContribution {

    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;

    @inject(WidgetManager)
    protected readonly widgetManager: WidgetManager;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(WorkspacePresetCommand, {
            execute: () => this.openPreset(),
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: WorkspacePresetCommand.id,
            keybinding: 'ctrlcmd+alt+t',
        });
    }

    protected async openPreset(): Promise<void> {
        try {
            await Promise.all([
                this.openInArea(TeacherWelcomeWidget.ID, 'main'),
                this.openInArea(ProgressDashboardWidget.ID, 'main'),
                this.openInArea(SkillBrowserWidget.ID, 'left'),
                this.openInArea(LearningPathWidget.ID, 'left'),
                this.openInArea(CanvasWidget.ID, 'right'),
            ]);
            this.messageService.info(nls.localize(
                'theia/teacher/workspacePresetOpened',
                'Learning workspace opened: welcome + progress (main), skills + path (left), canvas (right).',
            ));
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.messageService.error(nls.localize(
                'theia/teacher/workspacePresetFailed',
                'Could not open full learning workspace: {0}',
                msg,
            ));
        }
    }

    protected async openInArea(widgetId: string, area: ApplicationShell.Area): Promise<void> {
        const widget = await this.widgetManager.getOrCreateWidget(widgetId);
        if (!widget.isAttached) {
            this.shell.addWidget(widget, { area });
        }
        this.shell.revealWidget(widget.id);
    }
}
