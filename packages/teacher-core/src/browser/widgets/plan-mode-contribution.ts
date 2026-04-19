import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { PlanModeWidget } from './plan-mode-widget';

export const PlanModeOpenCommand: Command = {
    id: 'teacher.planMode.open',
    category: 'Teacher',
    label: nls.localize('theia/teacher/planModeOpen', 'Teacher: Open Plan Mode'),
};

@injectable()
export class PlanModeContribution extends AbstractViewContribution<PlanModeWidget> {

    constructor() {
        super({
            widgetId: PlanModeWidget.ID,
            widgetName: PlanModeWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 200,
            },
            toggleCommandId: PlanModeOpenCommand.id,
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }
}
