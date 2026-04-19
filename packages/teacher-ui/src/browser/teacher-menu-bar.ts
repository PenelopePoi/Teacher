import { injectable, inject } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution, FrontendApplication } from '@theia/core/lib/browser';
import { CommandService } from '@theia/core/lib/common';
import { nls } from '@theia/core/lib/common/nls';

@injectable()
export class TeacherMenuBarContribution implements FrontendApplicationContribution {

    @inject(CommandService)
    protected readonly commandService: CommandService;

    onStart(app: FrontendApplication): void {
        try {
            const menuBar = document.getElementById('theia:menubar');
            if (menuBar) {
                menuBar.classList.add('teacher-menu-hidden');
            }

            const topPanel = app.shell?.topPanel;
            if (topPanel?.node) {
                const wordmark = document.createElement('div');
                wordmark.className = 'teacher-wordmark';
                wordmark.textContent = 'Teacher';
                wordmark.setAttribute('role', 'button');
                wordmark.setAttribute('tabindex', '0');
                wordmark.setAttribute('aria-label',
                    nls.localize('theia/teacher/wordmarkHint', 'Teacher — {0} to search', 'Cmd+P')
                );
                wordmark.title = nls.localize('theia/teacher/wordmarkTooltip', 'Cmd+P to search');

                const executeQuickOpen = (): void => {
                    try {
                        this.commandService.executeCommand('workbench.action.quickOpen');
                    } catch (err) {
                        console.error('[TeacherMenuBar] Failed to execute quickOpen:', err);
                    }
                };

                wordmark.addEventListener('click', executeQuickOpen);
                wordmark.addEventListener('keydown', (e: KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        executeQuickOpen();
                    }
                });

                topPanel.node.prepend(wordmark);
            }
        } catch (err) {
            console.error('[TeacherMenuBar] Failed to initialize menu bar:', err);
        }
    }
}
