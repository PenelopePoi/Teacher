import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandContribution, CommandRegistry, nls } from '@theia/core';
import { KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser';

/**
 * B7 Help Overlay Contribution — toggle the keyboard shortcut overlay.
 *
 * Keybinding: Shift+/ (which produces ? on US keyboards).
 * Toggles the overlay on/off via the shell widget open/close cycle.
 */

export const HelpOverlayToggleCommand: Command = Command.toLocalizedCommand(
    { id: 'teacher.helpOverlay.toggle', category: 'Teacher', label: 'Toggle Help Overlay' },
    'theia/teacher/helpOverlayToggle'
);

@injectable()
export class HelpOverlayContribution implements CommandContribution, KeybindingContribution {

    protected overlayElement: HTMLElement | undefined;
    protected visible = false;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(HelpOverlayToggleCommand, {
            execute: () => this.toggle(),
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: HelpOverlayToggleCommand.id,
            keybinding: 'shift+/',
            when: '!editorFocus && !inputFocus',
        });
    }

    toggle(): void {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    protected show(): void {
        if (this.overlayElement) {
            return;
        }

        const backdrop = document.createElement('div');
        backdrop.className = 'teacher-help-overlay-backdrop';
        backdrop.addEventListener('click', this.onBackdropClick);
        backdrop.addEventListener('keydown', this.onKeyDown);
        backdrop.setAttribute('tabindex', '-1');

        const panel = document.createElement('div');
        panel.className = 'teacher-help-overlay-panel';
        panel.addEventListener('click', e => e.stopPropagation());

        panel.innerHTML = this.buildContent();
        backdrop.appendChild(panel);
        document.body.appendChild(backdrop);
        this.overlayElement = backdrop;
        this.visible = true;

        // Focus for Escape handling
        backdrop.focus();
    }

    protected hide(): void {
        if (this.overlayElement) {
            this.overlayElement.remove();
            this.overlayElement = undefined;
        }
        this.visible = false;
    }

    protected onBackdropClick = (): void => {
        this.hide();
    };

    protected onKeyDown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            this.hide();
        }
    };

    protected buildContent(): string {
        const usedCommands = this.loadUsedCommands();

        const categories: Array<{ title: string; shortcuts: Array<{ keys: string; label: string; id: string }> }> = [
            {
                title: 'Navigation',
                shortcuts: [
                    { keys: 'Cmd+P', label: 'Search files', id: 'workbench.action.quickOpen' },
                    { keys: 'Cmd+Shift+.', label: 'Focus mode', id: 'teacher.modeCycle' },
                ],
            },
            {
                title: 'AI',
                shortcuts: [
                    { keys: 'Cmd+Shift+A', label: 'Ask about selection', id: 'teacher.askAboutSelection' },
                    { keys: 'Cmd+Shift+M', label: 'Queue message', id: 'teacher.messageQueue.open' },
                ],
            },
            {
                title: 'Lessons',
                shortcuts: [
                    { keys: 'Ctrl+Shift+L', label: 'Start lesson', id: 'teacher.lesson.start' },
                    { keys: 'Ctrl+Shift+C', label: 'Check work', id: 'teacher.lesson.checkWork' },
                    { keys: 'Ctrl+Shift+H', label: 'Hint', id: 'teacher.lesson.getHint' },
                ],
            },
            {
                title: 'Modes',
                shortcuts: [
                    { keys: 'Cmd+Shift+.', label: 'Cycle permission mode', id: 'teacher.modeCycle' },
                ],
            },
            {
                title: 'General',
                shortcuts: [
                    { keys: '?', label: 'This overlay', id: 'teacher.helpOverlay.toggle' },
                    { keys: 'Cmd+K', label: 'Command palette', id: 'workbench.action.showCommands' },
                ],
            },
        ];

        const header = `
            <div class="teacher-help-overlay-header">
                <h2 class="teacher-help-overlay-title">${nls.localize('theia/teacher/shortcutSheet', 'Keyboard Shortcuts')}</h2>
                <button class="teacher-help-overlay-close" aria-label="Close" onclick="this.closest('.teacher-help-overlay-backdrop').remove()">
                    <span class="codicon codicon-close"></span>
                </button>
            </div>`;

        const body = categories.map(cat => {
            const rows = cat.shortcuts.map(s => {
                const dot = usedCommands.has(s.id) ? '' : '<span class="teacher-help-overlay-amber-dot"></span>';
                return `<div class="teacher-help-overlay-shortcut-row">${dot}<kbd class="teacher-help-overlay-kbd">${s.keys}</kbd><span class="teacher-help-overlay-shortcut-label">${s.label}</span></div>`;
            }).join('');
            return `<div class="teacher-help-overlay-category"><h3 class="teacher-help-overlay-category-title">${cat.title}</h3><div class="teacher-help-overlay-shortcut-list">${rows}</div></div>`;
        }).join('');

        const footer = `
            <div class="teacher-help-overlay-footer">
                <span class="teacher-help-overlay-amber-dot"></span>
                <span class="teacher-help-overlay-legend-label">${nls.localize('theia/teacher/unusedShortcut', 'Not yet used')}</span>
            </div>`;

        return header + `<div class="teacher-help-overlay-body">${body}</div>` + footer;
    }

    protected loadUsedCommands(): Set<string> {
        try {
            const raw = localStorage.getItem('teacher.helpOverlay.usedCommands');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    return new Set(parsed);
                }
            }
        } catch {
            // ignore
        }
        return new Set();
    }
}
