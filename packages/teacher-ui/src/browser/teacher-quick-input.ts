import { injectable } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';

@injectable()
export class TeacherQuickInputStyling implements FrontendApplicationContribution {

    onStart(): void {
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const node of Array.from(mutation.addedNodes)) {
                    if (node instanceof HTMLElement) {
                        const quickInput = node.classList?.contains('monaco-quick-input-widget')
                            ? node
                            : node.querySelector?.('.monaco-quick-input-widget');
                        if (quickInput) {
                            quickInput.classList.add('teacher-glass-palette');
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}
