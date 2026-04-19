import { injectable, inject, optional } from '@theia/core/shared/inversify';
import { Command, CommandContribution, CommandRegistry, nls } from '@theia/core/lib/common';
import { KeybindingContribution, KeybindingRegistry, QuickInputService } from '@theia/core/lib/browser';
import { AgentModeService } from './agent-mode-service';
import { AgentSessionManager } from './agent-session-manager';
import { AgentContextProvider } from './agent-context-provider';

/**
 * Agent Commands — All agent-specific commands and keybindings.
 *
 * Keybindings:
 *   Shift+Tab       -> Cycle Agent Mode
 *   Cmd+Shift+C     -> Create Checkpoint
 *   Cmd+Shift+Z     -> Rewind to Checkpoint (opens picker)
 *   Cmd+Shift+/     -> Show Plan
 *   Cmd+Shift+L     -> Toggle Mode Lock
 *
 * Enhancements over v1:
 *   - QuickInput picker for rewind (choose checkpoint)
 *   - QuickInput picker for mode selection (jump to any mode)
 *   - Session export command
 *   - Undo last action command
 *   - Toggle mode lock
 *   - Show session stats
 */

export namespace AgentCommands {

    export const CYCLE_MODE: Command = {
        id: 'teacher.agent.cycleMode',
        category: 'Teacher',
        label: nls.localize('theia/teacher/agentCycleMode', 'Teacher: Cycle Agent Mode'),
    };

    export const SELECT_MODE: Command = {
        id: 'teacher.agent.selectMode',
        category: 'Teacher',
        label: nls.localize('theia/teacher/agentSelectMode', 'Teacher: Select Agent Mode'),
    };

    export const CREATE_CHECKPOINT: Command = {
        id: 'teacher.agent.createCheckpoint',
        category: 'Teacher',
        label: nls.localize('theia/teacher/agentCreateCheckpoint', 'Teacher: Create Checkpoint'),
    };

    export const REWIND: Command = {
        id: 'teacher.agent.rewind',
        category: 'Teacher',
        label: nls.localize('theia/teacher/agentRewind', 'Teacher: Rewind to Checkpoint'),
    };

    export const SHOW_PLAN: Command = {
        id: 'teacher.agent.showPlan',
        category: 'Teacher',
        label: nls.localize('theia/teacher/agentShowPlan', 'Teacher: Show Current Plan'),
    };

    export const APPROVE_PLAN: Command = {
        id: 'teacher.agent.approvePlan',
        category: 'Teacher',
        label: nls.localize('theia/teacher/agentApprovePlan', 'Teacher: Approve Plan'),
    };

    export const FOCUS_MODE: Command = {
        id: 'teacher.agent.focusMode',
        category: 'Teacher',
        label: nls.localize('theia/teacher/agentFocusMode', 'Teacher: Toggle Focus Mode'),
    };

    export const SHOW_CONTEXT: Command = {
        id: 'teacher.agent.showContext',
        category: 'Teacher',
        label: nls.localize('theia/teacher/agentShowContext', 'Teacher: Show Agent Context'),
    };

    export const CLEAR_SESSION: Command = {
        id: 'teacher.agent.clearSession',
        category: 'Teacher',
        label: nls.localize('theia/teacher/agentClearSession', 'Teacher: Clear Session'),
    };

    export const UNDO_ACTION: Command = {
        id: 'teacher.agent.undoAction',
        category: 'Teacher',
        label: nls.localize('theia/teacher/agentUndoAction', 'Teacher: Undo Last Agent Action'),
    };

    export const TOGGLE_MODE_LOCK: Command = {
        id: 'teacher.agent.toggleModeLock',
        category: 'Teacher',
        label: nls.localize('theia/teacher/agentToggleLock', 'Teacher: Toggle Mode Lock'),
    };

    export const EXPORT_SESSION: Command = {
        id: 'teacher.agent.exportSession',
        category: 'Teacher',
        label: nls.localize('theia/teacher/agentExportSession', 'Teacher: Export Session'),
    };

    export const SESSION_STATS: Command = {
        id: 'teacher.agent.sessionStats',
        category: 'Teacher',
        label: nls.localize('theia/teacher/agentSessionStats', 'Teacher: Show Session Stats'),
    };
}

@injectable()
export class AgentCommandContribution implements CommandContribution, KeybindingContribution {

    @inject(AgentModeService)
    protected readonly modeService: AgentModeService;

    @inject(AgentSessionManager)
    protected readonly sessionManager: AgentSessionManager;

    @inject(AgentContextProvider)
    protected readonly contextProvider: AgentContextProvider;

    @inject(QuickInputService) @optional()
    protected readonly quickInputService: QuickInputService;

    registerCommands(registry: CommandRegistry): void {
        // Cycle Agent Mode
        registry.registerCommand(AgentCommands.CYCLE_MODE, {
            execute: () => {
                this.modeService.cycleMode();
            },
        });

        // Select Agent Mode (via picker)
        registry.registerCommand(AgentCommands.SELECT_MODE, {
            execute: async () => {
                const currentMode = this.modeService.getMode();
                const items = AgentModeService.MODE_ORDER.map(mode => {
                    const meta = AgentModeService.MODE_META[mode];
                    return {
                        label: `${mode === currentMode ? '$(check) ' : '     '}${meta.label}`,
                        description: meta.description,
                        value: mode,
                    };
                });

                const selected = await this.quickInputService?.showQuickPick(items, {
                    title: nls.localize('theia/teacher/selectMode', 'Select Agent Mode'),
                    placeholder: nls.localize('theia/teacher/selectModePlaceholder', 'Choose agent permission level...'),
                });

                if (selected) {
                    this.modeService.setMode((selected as { value: string }).value as any);
                }
            },
        });

        // Create Checkpoint
        registry.registerCommand(AgentCommands.CREATE_CHECKPOINT, {
            execute: async () => {
                const label = await this.quickInputService?.input({
                    title: nls.localize('theia/teacher/checkpointLabel', 'Checkpoint Label'),
                    placeHolder: nls.localize('theia/teacher/checkpointPlaceholder', 'Enter a label for this checkpoint (optional)'),
                });
                const id = this.sessionManager.createCheckpoint(label || undefined);
                console.info('[AgentCommands] Manual checkpoint created:', id);
            },
        });

        // Rewind to Checkpoint (with picker)
        registry.registerCommand(AgentCommands.REWIND, {
            execute: async () => {
                const checkpoints = this.sessionManager.getCheckpoints();
                if (checkpoints.length === 0) {
                    console.info('[AgentCommands] No checkpoints to rewind to');
                    return;
                }

                const items = checkpoints.map((ckpt, _idx) => {
                    const time = new Date(ckpt.timestamp);
                    const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
                    return {
                        label: `${ckpt.auto ? '$(sync) ' : '$(bookmark) '}${ckpt.label}`,
                        description: `${timeStr} | ${ckpt.actionIndex} actions | ${ckpt.fileSnapshot.length} files`,
                        value: ckpt.id,
                    };
                }).reverse(); // Most recent first

                const selected = await this.quickInputService?.showQuickPick(items, {
                    title: nls.localize('theia/teacher/rewindTitle', 'Rewind to Checkpoint'),
                    placeholder: nls.localize('theia/teacher/rewindPlaceholder', 'Select a checkpoint to rewind to...'),
                });

                if (selected) {
                    this.sessionManager.rewindTo((selected as { value: string }).value, 'both');
                }
            },
        });

        // Show Plan
        registry.registerCommand(AgentCommands.SHOW_PLAN, {
            execute: () => {
                const plan = this.sessionManager.getPlan();
                if (plan) {
                    const progress = this.sessionManager.getPlanProgress();
                    const risk = this.sessionManager.getPlanRiskLevel();
                    console.info(`[AgentCommands] Plan: "${plan.title}" [${plan.status}] ${progress}% complete, risk: ${risk}`);
                    console.info('[AgentCommands] Steps:', JSON.stringify(plan.steps, undefined, 2));
                } else {
                    console.info('[AgentCommands] No active plan');
                }
            },
        });

        // Approve Plan — approve all pending steps
        registry.registerCommand(AgentCommands.APPROVE_PLAN, {
            execute: () => {
                const plan = this.sessionManager.getPlan();
                if (!plan) {
                    return;
                }
                plan.steps.forEach((step, i) => {
                    if (step.status === 'pending') {
                        this.sessionManager.approveStep(i);
                    }
                });
            },
        });

        // Focus Mode — delegates to the existing focus mode toggle
        registry.registerCommand(AgentCommands.FOCUS_MODE, {
            execute: () => {
                registry.executeCommand('teacher.toggleFocusMode');
            },
        });

        // Show Context — logs the full serialized agent context
        registry.registerCommand(AgentCommands.SHOW_CONTEXT, {
            execute: () => {
                const serialized = this.contextProvider.serializeForPrompt();
                console.info('[AgentCommands] Agent context:\n' + serialized);
            },
        });

        // Clear Session
        registry.registerCommand(AgentCommands.CLEAR_SESSION, {
            execute: () => {
                this.sessionManager.clearSession();
                console.info('[AgentCommands] Session cleared');
            },
        });

        // Undo Last Action
        registry.registerCommand(AgentCommands.UNDO_ACTION, {
            execute: () => {
                const undone = this.sessionManager.undoLastAction();
                if (undone) {
                    console.info('[AgentCommands] Undone:', undone.description);
                } else {
                    console.info('[AgentCommands] Nothing to undo');
                }
            },
        });

        // Toggle Mode Lock
        registry.registerCommand(AgentCommands.TOGGLE_MODE_LOCK, {
            execute: () => {
                this.modeService.toggleLock();
            },
        });

        // Export Session
        registry.registerCommand(AgentCommands.EXPORT_SESSION, {
            execute: () => {
                const snapshot = this.sessionManager.exportSession();
                const json = JSON.stringify(snapshot, undefined, 2);
                console.info('[AgentCommands] Session export:\n' + json);
                // Copy to clipboard if available
                try {
                    navigator.clipboard.writeText(json).then(
                        () => console.info('[AgentCommands] Session exported to clipboard'),
                        () => console.warn('[AgentCommands] Failed to copy to clipboard')
                    );
                } catch {
                    // clipboard not available
                }
            },
        });

        // Session Stats
        registry.registerCommand(AgentCommands.SESSION_STATS, {
            execute: () => {
                const duration = this.sessionManager.getSessionDuration();
                const actions = this.sessionManager.getActionCount();
                const checkpoints = this.sessionManager.getCheckpoints().length;
                const files = this.sessionManager.getFilesTouchedCount();
                const plan = this.sessionManager.getPlan();
                const mode = this.modeService.getMode();
                const locked = this.modeService.isLocked();
                const errors = this.contextProvider.getErrorCounts();

                const minutes = Math.floor(duration / 60_000);
                console.info([
                    '[AgentCommands] Session Stats:',
                    `  Mode: ${mode}${locked ? ' (LOCKED)' : ''}`,
                    `  Duration: ${minutes}m`,
                    `  Actions: ${actions}`,
                    `  Checkpoints: ${checkpoints}`,
                    `  Files touched: ${files}`,
                    `  Errors: ${errors.error}E / ${errors.warning}W / ${errors.info}I`,
                    plan ? `  Plan: "${plan.title}" [${plan.status}] ${this.sessionManager.getPlanProgress()}%` : '  Plan: none',
                ].join('\n'));
            },
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        // Shift+Tab -> Cycle Agent Mode
        registry.registerKeybinding({
            command: AgentCommands.CYCLE_MODE.id,
            keybinding: 'shift+tab',
        });

        // Cmd+Shift+C -> Create Checkpoint
        registry.registerKeybinding({
            command: AgentCommands.CREATE_CHECKPOINT.id,
            keybinding: 'ctrlcmd+shift+c',
        });

        // Cmd+Shift+Z -> Rewind to Checkpoint (picker)
        registry.registerKeybinding({
            command: AgentCommands.REWIND.id,
            keybinding: 'ctrlcmd+shift+z',
        });

        // Cmd+Shift+/ -> Show Plan
        registry.registerKeybinding({
            command: AgentCommands.SHOW_PLAN.id,
            keybinding: 'ctrlcmd+shift+/',
        });

        // Cmd+Shift+L -> Toggle Mode Lock
        registry.registerKeybinding({
            command: AgentCommands.TOGGLE_MODE_LOCK.id,
            keybinding: 'ctrlcmd+shift+l',
        });
    }
}
