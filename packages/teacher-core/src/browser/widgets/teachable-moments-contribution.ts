import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { TeachableMomentsWidget } from './teachable-moments-widget';

export const TeachableMomentsOpenCommand: Command = {
    id: 'teacher.teachableMoments.open',
    category: 'Teacher',
    label: nls.localize('theia/teacher/teachableMomentsOpen', 'Teacher: Open Learned Concepts'),
};

@injectable()
export class TeachableMomentsContribution extends AbstractViewContribution<TeachableMomentsWidget> {

    constructor() {
        super({
            widgetId: TeachableMomentsWidget.ID,
            widgetName: TeachableMomentsWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 300,
            },
            toggleCommandId: TeachableMomentsOpenCommand.id,
            toggleKeybinding: 'ctrlcmd+alt+l',
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }
}
