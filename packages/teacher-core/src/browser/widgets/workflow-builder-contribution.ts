import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { WorkflowBuilderWidget } from './workflow-builder-widget';

export const WorkflowBuilderOpenCommand: Command = {
    id: 'teacher.workflowBuilder.open',
    category: 'Teacher',
    label: nls.localize('theia/teacher/workflowBuilderOpen', 'Teacher: Open Workflows'),
};

@injectable()
export class WorkflowBuilderContribution extends AbstractViewContribution<WorkflowBuilderWidget> {

    constructor() {
        super({
            widgetId: WorkflowBuilderWidget.ID,
            widgetName: WorkflowBuilderWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 200,
            },
            toggleCommandId: WorkflowBuilderOpenCommand.id,
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }
}
