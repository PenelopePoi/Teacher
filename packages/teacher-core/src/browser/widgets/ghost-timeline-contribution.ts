import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { GhostTimelineWidget } from './ghost-timeline-widget';

/**
 * C7 Ghost Timeline Contribution
 *
 * Registers the Ghost Timeline as a panel widget in the bottom dock area
 * (optionally above the editor). Provides a toggle command and keybinding.
 */

export const GhostTimelineOpenCommand: Command = {
    id: 'teacher.ghostTimeline.open',
    category: 'Teacher',
    label: nls.localize('theia/teacher/ghostTimelineOpen', 'Teacher: Open Ghost Timeline'),
};

export const GhostTimelineClearCommand: Command = {
    id: 'teacher.ghostTimeline.clear',
    category: 'Teacher',
    label: nls.localize('theia/teacher/ghostTimelineClear', 'Teacher: Clear Ghost Timeline'),
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
        registry.registerCommand(GhostTimelineClearCommand, {
            execute: async () => {
                const widget = await this.widget;
                // Clear is handled by the service; widget re-renders via event
                void widget;
            },
        });
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }
}
