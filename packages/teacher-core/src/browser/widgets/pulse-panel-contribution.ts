import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { PulsePanelWidget } from './pulse-panel-widget';

export const PulsePanelOpenCommand: Command = {
    id: 'teacher.pulsePanel.open',
    category: 'Teacher',
    label: nls.localize('theia/teacher/pulsePanelOpen', 'Teacher: Open AI Pulse'),
};

@injectable()
export class PulsePanelContribution extends AbstractViewContribution<PulsePanelWidget> {

    constructor() {
        super({
            widgetId: PulsePanelWidget.ID,
            widgetName: PulsePanelWidget.LABEL,
            defaultWidgetOptions: {
                area: 'bottom',
                rank: 100,
            },
            toggleCommandId: PulsePanelOpenCommand.id,
            toggleKeybinding: 'ctrlcmd+alt+p',
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }
}
