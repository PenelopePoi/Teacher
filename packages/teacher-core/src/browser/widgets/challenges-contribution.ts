import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { ChallengesWidget } from './challenges-widget';

export const ChallengesOpenCommand: Command = {
    id: 'teacher.challenges.open',
    category: 'Teacher',
    label: nls.localize('theia/teacher/challengesOpen', 'Teacher: Open Challenges'),
};

@injectable()
export class ChallengesContribution extends AbstractViewContribution<ChallengesWidget> {

    constructor() {
        super({
            widgetId: ChallengesWidget.ID,
            widgetName: ChallengesWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 200,
            },
            toggleCommandId: ChallengesOpenCommand.id,
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }
}
