import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { SkillCommandWidget } from './skill-command-widget';

export const SkillCommandOpenCommand: Command = {
    id: 'teacher.skillCommand.open',
    category: 'Teacher',
    label: nls.localize('theia/teacher/skillCommandOpen', 'Teacher: Open Skill Launcher'),
};

@injectable()
export class SkillCommandContribution extends AbstractViewContribution<SkillCommandWidget> {

    constructor() {
        super({
            widgetId: SkillCommandWidget.ID,
            widgetName: SkillCommandWidget.LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: 200,
            },
            toggleCommandId: SkillCommandOpenCommand.id,
            toggleKeybinding: 'ctrlcmd+shift+s',
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }
}
