import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { GhostTimelineWidget } from './ghost-timeline-widget';

export const GhostTimelineOpenCommand: Command = {
    id: 'teacher.ghostTimeline.open',
    category: 'Teacher',
    label: nls.localize('theia/teacher/ghostTimelineOpen', 'Teacher: Open Ghost Timeline'),
};

@injectable()
export class GhostTimelineContribution extends AbstractViewContribution<GhostTimelineWidget> {

    constructor() {
        super({
            widgetId: GhostTimelineWidget.ID,
            widgetName: GhostTimelineWidget.LABEL,
            defaultWidgetOptions: {
                area: 'bottom',
                rank: 200,
            },
            toggleCommandId: GhostTimelineOpenCommand.id,
            toggleKeybinding: 'ctrlcmd+alt+g',
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }
}
