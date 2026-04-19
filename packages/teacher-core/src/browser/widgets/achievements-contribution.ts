import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { AchievementsWidget } from './achievements-widget';

export const AchievementsOpenCommand: Command = {
    id: 'teacher.achievements.open',
    category: 'Teacher',
    label: nls.localize('theia/teacher/achievementsOpen', 'Teacher: Open Achievements'),
};

@injectable()
export class AchievementsContribution extends AbstractViewContribution<AchievementsWidget> {

    constructor() {
        super({
            widgetId: AchievementsWidget.ID,
            widgetName: AchievementsWidget.LABEL,
            defaultWidgetOptions: {
                area: 'main',
            },
            toggleCommandId: AchievementsOpenCommand.id,
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }
}
