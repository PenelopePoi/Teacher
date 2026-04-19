import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { ConceptMapWidget } from './concept-map-widget';

export const ConceptMapOpenCommand: Command = {
    id: 'teacher.conceptMap.open',
    category: 'Teacher',
    label: nls.localize('theia/teacher/conceptMapOpen', 'Teacher: Open Concept Map'),
};

@injectable()
export class ConceptMapContribution extends AbstractViewContribution<ConceptMapWidget> {

    constructor() {
        super({
            widgetId: ConceptMapWidget.ID,
            widgetName: ConceptMapWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 250,
            },
            toggleCommandId: ConceptMapOpenCommand.id,
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }
}
