import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { CanvasReviewWidget } from './canvas-review-widget';

export const CanvasReviewOpenCommand: Command = {
    id: 'teacher.canvasReview.open',
    category: 'Teacher',
    label: nls.localize('theia/teacher/canvasReviewOpen', 'Teacher: Open Visual Review'),
};

@injectable()
export class CanvasReviewContribution extends AbstractViewContribution<CanvasReviewWidget> {

    constructor() {
        super({
            widgetId: CanvasReviewWidget.ID,
            widgetName: CanvasReviewWidget.LABEL,
            defaultWidgetOptions: {
                area: 'main',
                rank: 230,
            },
            toggleCommandId: CanvasReviewOpenCommand.id,
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }
}
