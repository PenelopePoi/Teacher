import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { ImprovementDashboardWidget } from './improvement-dashboard-widget';

export const ImprovementDashboardOpenCommand: Command = {
    id: 'teacher.improvementDashboard.open',
    category: 'Teacher',
    label: nls.localize('theia/teacher/improvementDashboardOpen', 'Teacher: Open Skill Health'),
};

@injectable()
export class ImprovementDashboardContribution extends AbstractViewContribution<ImprovementDashboardWidget> {

    constructor() {
        super({
            widgetId: ImprovementDashboardWidget.ID,
            widgetName: ImprovementDashboardWidget.LABEL,
            defaultWidgetOptions: {
                area: 'main',
                rank: 200,
            },
            toggleCommandId: ImprovementDashboardOpenCommand.id,
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }
}
