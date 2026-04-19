import { injectable, inject } from '@theia/core/shared/inversify';
import { CommandRegistry, MenuModelRegistry, nls } from '@theia/core/lib/common';
import {
    AbstractViewContribution,
    CommonMenus,
    FrontendApplication,
    FrontendApplicationContribution
} from '@theia/core/lib/browser';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { TeacherWelcomeWidget } from './teacher-welcome-widget';

export const TeacherWelcomeCommand = {
    id: TeacherWelcomeWidget.ID,
    label: nls.localize('theia/teacher/openWelcome', 'Teacher: Welcome')
};

@injectable()
export class TeacherWelcomeContribution extends AbstractViewContribution<TeacherWelcomeWidget> implements FrontendApplicationContribution {

    @inject(FrontendApplicationStateService)
    protected readonly stateService: FrontendApplicationStateService;

    constructor() {
        super({
            widgetId: TeacherWelcomeWidget.ID,
            widgetName: TeacherWelcomeWidget.LABEL,
            defaultWidgetOptions: {
                area: 'main',
            }
        });
    }

    async onStart(_app: FrontendApplication): Promise<void> {
        this.stateService.reachedState('ready').then(() => {
            this.openView({ reveal: true, activate: true });
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(TeacherWelcomeCommand, {
            execute: () => this.openView({ reveal: true, activate: true }),
        });
    }

    override registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(CommonMenus.HELP, {
            commandId: TeacherWelcomeCommand.id,
            label: TeacherWelcomeCommand.label,
            order: 'a00'
        });
    }
}
