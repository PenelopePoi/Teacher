import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { RewindPanelWidget } from './rewind-panel-widget';

export const RewindPanelOpenCommand: Command = {
    id: 'teacher.rewindPanel.open',
    category: 'Teacher',
    label: nls.localize('theia/teacher/rewindPanelOpen', 'Teacher: Open Checkpoints'),
};

@injectable()
export class RewindPanelContribution extends AbstractViewContribution<RewindPanelWidget> {

    constructor() {
        super({
            widgetId: RewindPanelWidget.ID,
            widgetName: RewindPanelWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 210,
            },
            toggleCommandId: RewindPanelOpenCommand.id,
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }
}
