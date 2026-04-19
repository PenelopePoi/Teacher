import { injectable, inject } from '@theia/core/shared/inversify';
import { Command, CommandContribution, CommandRegistry, nls } from '@theia/core/lib/common';
import { KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { AgentModeService } from './agent-mode-service';
import { AgentSessionManager } from './agent-session-manager';
import { AgentContextProvider } from './agent-context-provider';

/**
 * Agent Commands — All agent-specific commands and keybindings.
 *
 * Keybindings:
 *   Shift+Tab       → Cycle Agent Mode
 *   Cmd+Shift+C     → Create Checkpoint
 *   Cmd+Shift+Z     → Rewind to Checkpoint (opens picker)
 *   Cmd+Shift+.     → Show Plan (reuses focus mode slot — reassigned)
 */

export namespace AgentCommands {

    export const CYCLE_MODE: Command = {
        id: 'teacher.agent.cycleMode',
        category: 'Teacher',
        label: nls.localize('theia/teacher/agentCycleMode', 'Teacher: Cycle Agent Mode'),
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
}

@injectable()
export class AgentCommandContribution implements CommandContribution, KeybindingContribution {

    @inject(AgentModeService)
    protected readonly modeService: AgentModeService;

    @inject(AgentSessionManager)
    protected readonly sessionManager: AgentSessionManager;

    @inject(AgentContextProvider)
    protected readonly contextProvider: AgentContextProvider;

    registerCommands(registry: CommandRegistry): void {
        // Cycle Agent Mode
        registry.registerCommand(AgentCommands.CYCLE_MODE, {
            execute: () => {
                this.modeService.cycleMode();
            },
        });

        // Create Checkpoint
        registry.registerCommand(AgentCommands.CREATE_CHECKPOINT, {
            execute: () => {
                const id = this.sessionManager.createCheckpoint();
                console.info('[AgentCommands] Manual checkpoint created:', id);
            },
        });

        // Rewind to Checkpoint
        registry.registerCommand(AgentCommands.REWIND, {
            execute: () => {
                const checkpoints = this.sessionManager.getCheckpoints();
                if (checkpoints.length === 0) {
                    console.info('[AgentCommands] No checkpoints to rewind to');
                    return;
                }
                // Rewind to the most recent checkpoint (a picker would be ideal, but for now last checkpoint)
                const latest = checkpoints[checkpoints.length - 1];
                this.sessionManager.rewindTo(latest.id, 'both');
            },
        });

        // Show Plan
        registry.registerCommand(AgentCommands.SHOW_PLAN, {
            execute: () => {
                const plan = this.sessionManager.getPlan();
                if (plan) {
                    console.info('[AgentCommands] Current plan:', JSON.stringify(plan, undefined, 2));
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

        // Show Context — logs the full agent context
        registry.registerCommand(AgentCommands.SHOW_CONTEXT, {
            execute: () => {
                const context = this.contextProvider.getContext();
                console.info('[AgentCommands] Agent context:', JSON.stringify(context, undefined, 2));
            },
        });

        // Clear Session
        registry.registerCommand(AgentCommands.CLEAR_SESSION, {
            execute: () => {
                this.sessionManager.clearSession();
                console.info('[AgentCommands] Session cleared');
            },
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        // Shift+Tab → Cycle Agent Mode
        registry.registerKeybinding({
            command: AgentCommands.CYCLE_MODE.id,
            keybinding: 'shift+tab',
        });

        // Cmd+Shift+C → Create Checkpoint
        registry.registerKeybinding({
            command: AgentCommands.CREATE_CHECKPOINT.id,
            keybinding: 'ctrlcmd+shift+c',
        });

        // Cmd+Shift+Z → Rewind to Checkpoint
        registry.registerKeybinding({
            command: AgentCommands.REWIND.id,
            keybinding: 'ctrlcmd+shift+z',
        });

        // Cmd+Shift+/ → Show Plan
        registry.registerKeybinding({
            command: AgentCommands.SHOW_PLAN.id,
            keybinding: 'ctrlcmd+shift+/',
        });
    }
}
