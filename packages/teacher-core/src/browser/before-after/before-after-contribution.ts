import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { BeforeAfterWidget } from './before-after-widget';

export const BeforeAfterOpenCommand: Command = {
    id: 'teacher.showBeforeAfter',
    category: 'Teacher',
    label: nls.localize('theia/teacher/showBeforeAfter', 'Teacher: Show Before / After Canvas'),
};

/**
 * View contribution for the Before/After Canvas (C6).
 */
@injectable()
export class BeforeAfterContribution extends AbstractViewContribution<BeforeAfterWidget> {

    constructor() {
        super({
            widgetId: BeforeAfterWidget.ID,
            widgetName: BeforeAfterWidget.LABEL,
            defaultWidgetOptions: {
                area: 'main',
                rank: 250,
            },
            toggleCommandId: BeforeAfterOpenCommand.id,
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }
}
