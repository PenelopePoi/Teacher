import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { XPLevelWidget } from './xp-level-widget';

export const XPLevelOpenCommand: Command = {
    id: 'teacher.xpLevel.open',
    category: 'Teacher',
    label: nls.localize('theia/teacher/xpLevelOpen', 'Teacher: Open Player Profile'),
};

@injectable()
export class XPLevelContribution extends AbstractViewContribution<XPLevelWidget> {

    constructor() {
        super({
            widgetId: XPLevelWidget.ID,
            widgetName: XPLevelWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 100,
            },
            toggleCommandId: XPLevelOpenCommand.id,
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }
}
