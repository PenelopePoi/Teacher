import { injectable, inject } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution, FrontendApplication } from '@theia/core/lib/browser';
import { CommandService } from '@theia/core/lib/common';

@injectable()
export class TeacherMenuBarContribution implements FrontendApplicationContribution {

    @inject(CommandService)
    protected readonly commandService: CommandService;

    onStart(app: FrontendApplication): void {
        const menuBar = document.getElementById('theia:menubar');
        if (menuBar) {
            menuBar.classList.add('teacher-menu-hidden');
        }

        const topPanel = app.shell.topPanel;
        if (topPanel && topPanel.node) {
            const wordmark = document.createElement('div');
            wordmark.className = 'teacher-wordmark';
            wordmark.textContent = 'Teacher';
            wordmark.addEventListener('click', () => {
                this.commandService.executeCommand('workbench.action.quickOpen');
            });
            topPanel.node.prepend(wordmark);
        }
    }
}
