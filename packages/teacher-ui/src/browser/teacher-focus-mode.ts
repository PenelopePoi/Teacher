import { injectable } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry, Command } from '@theia/core/lib/common';
import { KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser';

export const TOGGLE_FOCUS_MODE: Command = {
    id: 'teacher.toggleFocusMode',
    label: 'Teacher: Toggle Focus Mode',
    category: 'Teacher'
};

@injectable()
export class TeacherFocusModeContribution implements CommandContribution, KeybindingContribution {

    private focusMode = false;

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(TOGGLE_FOCUS_MODE, {
            execute: () => this.toggle()
        });
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        keybindings.registerKeybinding({
            command: TOGGLE_FOCUS_MODE.id,
            keybinding: 'ctrlcmd+shift+f'
        });
    }

    protected toggle(): void {
        this.focusMode = !this.focusMode;
        if (this.focusMode) {
            document.body.classList.add('teacher-focus-mode');
        } else {
            document.body.classList.remove('teacher-focus-mode');
        }
    }
}
