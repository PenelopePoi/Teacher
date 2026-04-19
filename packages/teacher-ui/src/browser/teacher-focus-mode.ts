import { injectable, inject } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry, Command } from '@theia/core/lib/common';
import { KeybindingContribution, KeybindingRegistry, StatusBar, StatusBarAlignment } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common/nls';

export const TOGGLE_FOCUS_MODE: Command = {
    id: 'teacher.toggleFocusMode',
    label: 'Teacher: Toggle Focus Mode',
    category: 'Teacher'
};

const FOCUS_MODE_STORAGE_KEY = 'teacher.focusMode';
const FOCUS_MODE_STATUS_ID = 'teacher-focus-mode-status';

@injectable()
export class TeacherFocusModeContribution implements CommandContribution, KeybindingContribution {

    @inject(StatusBar)
    protected readonly statusBar: StatusBar;

    private focusMode = false;

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(TOGGLE_FOCUS_MODE, {
            execute: () => this.toggle()
        });

        // Restore persisted state on startup
        try {
            const saved = localStorage.getItem(FOCUS_MODE_STORAGE_KEY);
            if (saved === 'true') {
                this.focusMode = true;
                document.body.classList.add('teacher-focus-mode');
            }
        } catch (err) {
            console.error('[TeacherFocusMode] Failed to restore state:', err);
        }
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        keybindings.registerKeybinding({
            command: TOGGLE_FOCUS_MODE.id,
            keybinding: 'ctrlcmd+shift+.'
        });
    }

    protected toggle(): void {
        this.focusMode = !this.focusMode;
        if (this.focusMode) {
            document.body.classList.add('teacher-focus-mode');
        } else {
            document.body.classList.remove('teacher-focus-mode');
        }

        // Persist state
        try {
            localStorage.setItem(FOCUS_MODE_STORAGE_KEY, String(this.focusMode));
        } catch (err) {
            console.error('[TeacherFocusMode] Failed to persist state:', err);
        }

        // Show brief status bar feedback
        const label = this.focusMode
            ? nls.localize('theia/teacher/focusOn', 'Focus Mode: ON')
            : nls.localize('theia/teacher/focusOff', 'Focus Mode: OFF');

        this.statusBar.setElement(FOCUS_MODE_STATUS_ID, {
            text: label,
            alignment: StatusBarAlignment.RIGHT,
            priority: 1000,
        });

        // Remove the status message after 2 seconds
        setTimeout(() => {
            this.statusBar.removeElement(FOCUS_MODE_STATUS_ID);
        }, 2000);
    }
}
