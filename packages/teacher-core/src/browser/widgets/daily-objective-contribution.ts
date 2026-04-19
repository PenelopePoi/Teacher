import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, FrontendApplication, FrontendApplicationContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { DailyObjectiveWidget } from './daily-objective-widget';

export const DailyObjectiveOpenCommand: Command = {
    id: 'teacher.dailyObjective.open',
    category: 'Teacher',
    label: nls.localize('theia/teacher/dailyObjectiveOpen', 'Teacher: Open Daily Objective'),
};

@injectable()
export class DailyObjectiveContribution extends AbstractViewContribution<DailyObjectiveWidget> implements FrontendApplicationContribution {

    constructor() {
        super({
            widgetId: DailyObjectiveWidget.ID,
            widgetName: DailyObjectiveWidget.LABEL,
            defaultWidgetOptions: {
                area: 'bottom',
                rank: 50,
            },
            toggleCommandId: DailyObjectiveOpenCommand.id,
        });
    }

    async onStart(_app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }
}
