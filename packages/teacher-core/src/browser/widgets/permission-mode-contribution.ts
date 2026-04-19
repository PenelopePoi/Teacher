import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { PermissionModeWidget } from './permission-mode-widget';

export const PermissionModeOpenCommand: Command = {
    id: 'teacher.permissionMode.open',
    category: 'Teacher',
    label: nls.localize('theia/teacher/permissionModeOpen', 'Teacher: Open Trust Level'),
};

@injectable()
export class PermissionModeContribution extends AbstractViewContribution<PermissionModeWidget> {

    constructor() {
        super({
            widgetId: PermissionModeWidget.ID,
            widgetName: PermissionModeWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 220,
            },
            toggleCommandId: PermissionModeOpenCommand.id,
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }
}
