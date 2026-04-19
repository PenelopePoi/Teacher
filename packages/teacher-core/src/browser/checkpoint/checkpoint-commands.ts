import { inject, injectable } from '@theia/core/shared/inversify';
import { Command, CommandContribution, CommandRegistry, nls } from '@theia/core';
import { KeybindingContribution, KeybindingRegistry, ApplicationShell } from '@theia/core/lib/browser';
import { MessageService } from '@theia/core/lib/common/message-service';
import { QuickInputService } from '@theia/core/lib/browser/quick-input';
import { CheckpointService } from './checkpoint-service';
import { RewindPanelWidget } from '../widgets/rewind-panel-widget';

/**
 * C18 Checkpoint commands and keybindings.
 *
 * - teacher.createCheckpoint  (Cmd+Shift+S) — create a named checkpoint
 * - teacher.rewindLast        (Cmd+Shift+Z) — rewind to previous checkpoint
 * - teacher.openRewindPanel   — opens the rewind panel widget
 */

export namespace CheckpointCommands {

    const TEACHER_CATEGORY = 'Teacher';

    export const CREATE_CHECKPOINT: Command = Command.toLocalizedCommand(
        { id: 'teacher.createCheckpoint', category: TEACHER_CATEGORY, label: 'Create Checkpoint' },
        'theia/teacher/createCheckpoint'
    );

    export const REWIND_LAST: Command = Command.toLocalizedCommand(
        { id: 'teacher.rewindLast', category: TEACHER_CATEGORY, label: 'Rewind to Last Checkpoint' },
        'theia/teacher/rewindLast'
    );

    export const OPEN_REWIND_PANEL: Command = Command.toLocalizedCommand(
        { id: 'teacher.openRewindPanel', category: TEACHER_CATEGORY, label: 'Open Rewind Panel' },
        'theia/teacher/openRewindPanel'
    );
}

@injectable()
export class CheckpointCommandContribution implements CommandContribution, KeybindingContribution {

    @inject(CheckpointService)
    protected readonly checkpointService: CheckpointService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(QuickInputService)
    protected readonly quickInputService: QuickInputService;

    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(CheckpointCommands.CREATE_CHECKPOINT, {
            execute: async () => {
                const name = await this.quickInputService.input({
                    prompt: nls.localize('theia/teacher/checkpointNamePrompt', 'Name this checkpoint'),
                    placeHolder: nls.localize('theia/teacher/checkpointNamePlaceholder', 'e.g. Before auth refactor'),
                });
                const label = name?.trim() || undefined;
                const cp = this.checkpointService.createCheckpoint(label);
                this.messageService.info(
                    nls.localize('theia/teacher/checkpointCreated', 'Checkpoint created: {0}', cp.label)
                );
            }
        });

        registry.registerCommand(CheckpointCommands.REWIND_LAST, {
            execute: () => {
                const checkpoints = this.checkpointService.getCheckpoints();
                const currentId = this.checkpointService.getCurrentId();

                // Find the checkpoint right after the current one (i.e. one step back in time)
                let target: string | undefined;
                if (currentId) {
                    const idx = checkpoints.findIndex(cp => cp.id === currentId);
                    if (idx >= 0 && idx + 1 < checkpoints.length) {
                        target = checkpoints[idx + 1].id;
                    }
                } else if (checkpoints.length >= 2) {
                    target = checkpoints[1].id;
                }

                if (!target) {
                    this.messageService.warn(
                        nls.localize('theia/teacher/noCheckpointToRewind', 'No previous checkpoint to rewind to.')
                    );
                    return;
                }

                this.checkpointService.rewindTo(target);
                const cp = checkpoints.find(c => c.id === target);
                this.messageService.info(
                    nls.localize('theia/teacher/rewoundTo', 'Rewound to: {0}', cp?.label ?? target)
                );
            }
        });

        registry.registerCommand(CheckpointCommands.OPEN_REWIND_PANEL, {
            execute: async () => {
                const widget = await this.shell.revealWidget(RewindPanelWidget.ID);
                if (widget) {
                    this.shell.activateWidget(RewindPanelWidget.ID);
                }
            }
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: CheckpointCommands.CREATE_CHECKPOINT.id,
            keybinding: 'ctrlcmd+shift+s',
        });
        registry.registerKeybinding({
            command: CheckpointCommands.REWIND_LAST.id,
            keybinding: 'ctrlcmd+shift+z',
        });
    }
}
