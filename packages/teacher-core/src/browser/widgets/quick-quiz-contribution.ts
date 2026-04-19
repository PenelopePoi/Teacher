import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { QuickQuizWidget } from './quick-quiz-widget';

export const QuickQuizOpenCommand: Command = {
    id: 'teacher.quickQuiz.open',
    category: 'Teacher',
    label: nls.localize('theia/teacher/quickQuizOpen', 'Teacher: Open Quick Quiz'),
};

@injectable()
export class QuickQuizContribution extends AbstractViewContribution<QuickQuizWidget> {

    constructor() {
        super({
            widgetId: QuickQuizWidget.ID,
            widgetName: QuickQuizWidget.LABEL,
            defaultWidgetOptions: {
                area: 'main',
                rank: 240,
            },
            toggleCommandId: QuickQuizOpenCommand.id,
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }
}
