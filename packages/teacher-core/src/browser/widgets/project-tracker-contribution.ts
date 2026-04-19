import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { ProjectTrackerWidget } from './project-tracker-widget';

export const ProjectTrackerOpenCommand: Command = {
    id: 'teacher.projectTracker.open',
    category: 'Teacher',
    label: nls.localize('theia/teacher/projectTrackerOpen', 'Teacher: Open Project Tracker'),
};

@injectable()
export class ProjectTrackerContribution extends AbstractViewContribution<ProjectTrackerWidget> {

    constructor() {
        super({
            widgetId: ProjectTrackerWidget.ID,
            widgetName: ProjectTrackerWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 260,
            },
            toggleCommandId: ProjectTrackerOpenCommand.id,
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }
}
