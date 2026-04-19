import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { Command, CommandContribution, CommandRegistry, nls, Emitter, Event } from '@theia/core/lib/common';
import { KeybindingContribution, KeybindingRegistry, StatusBar, StatusBarAlignment } from '@theia/core/lib/browser';
import { FrontendApplicationContribution, FrontendApplication } from '@theia/core/lib/browser';

/**
 * C16 Mode Cycle — Four-mode permission cycle
 *
 * Replaces the simple focus mode toggle with a four-mode trust cycle:
 *   Review     (blue)  — propose only, nothing executes
 *   Assist     (amber) — propose + auto-accept reversible, ask for shell/deploy (DEFAULT)
 *   Autonomous (green) — auto-accept allowlist, ask for denylist
 *   Observer   (gray)  — read-only, agent analyzes but cannot edit
 *
 * Single keybinding: Cmd+Shift+. cycles through modes.
 * Mode persists in localStorage. Status bar shows current mode with color.
 */

export type PermissionMode = 'review' | 'assist' | 'autonomous' | 'observer';

export interface ModeDefinition {
    readonly mode: PermissionMode;
    readonly label: string;
    readonly description: string;
    readonly icon: string;
    readonly color: string;
    readonly cssColor: string;
}

export const MODE_DEFINITIONS: readonly ModeDefinition[] = [
    {
        mode: 'review',
        label: nls.localize('theia/teacher/modeReview', 'Review'),
        description: nls.localize('theia/teacher/modeReviewDesc', 'Propose only, nothing executes'),
        icon: 'codicon codicon-eye',
        color: 'blue',
        cssColor: '#3B82F6',
    },
    {
        mode: 'assist',
        label: nls.localize('theia/teacher/modeAssist', 'Assist'),
        description: nls.localize('theia/teacher/modeAssistDesc', 'Auto-accept reversible, ask for shell/deploy'),
        icon: 'codicon codicon-edit',
        color: 'amber',
        cssColor: '#E8A948',
    },
    {
        mode: 'autonomous',
        label: nls.localize('theia/teacher/modeAutonomous2', 'Autonomous'),
        description: nls.localize('theia/teacher/modeAutonomousDesc2', 'Auto-accept allowlist, ask for denylist'),
        icon: 'codicon codicon-rocket',
        color: 'green',
        cssColor: '#4ADE80',
    },
    {
        mode: 'observer',
        label: nls.localize('theia/teacher/modeObserver', 'Observer'),
        description: nls.localize('theia/teacher/modeObserverDesc', 'Read-only, agent analyzes but cannot edit'),
        icon: 'codicon codicon-shield',
        color: 'gray',
        cssColor: '#9CA3AF',
    },
];

const MODE_ORDER: PermissionMode[] = ['review', 'assist', 'autonomous', 'observer'];
const STORAGE_KEY = 'teacher.permissionMode';
const STATUS_BAR_ID = 'teacher-mode-cycle';

export const ModeCycleCommand: Command = {
    id: 'teacher.modeCycle',
    category: 'Teacher',
    label: nls.localize('theia/teacher/modeCycle', 'Teacher: Cycle Permission Mode'),
};

export const ModeSetReviewCommand: Command = {
    id: 'teacher.mode.review',
    category: 'Teacher',
    label: nls.localize('theia/teacher/modeSetReview', 'Teacher: Set Review Mode'),
};

export const ModeSetAssistCommand: Command = {
    id: 'teacher.mode.assist',
    category: 'Teacher',
    label: nls.localize('theia/teacher/modeSetAssist', 'Teacher: Set Assist Mode'),
};

export const ModeSetAutonomousCommand: Command = {
    id: 'teacher.mode.autonomous',
    category: 'Teacher',
    label: nls.localize('theia/teacher/modeSetAutonomous', 'Teacher: Set Autonomous Mode'),
};

export const ModeSetObserverCommand: Command = {
    id: 'teacher.mode.observer',
    category: 'Teacher',
    label: nls.localize('theia/teacher/modeSetObserver', 'Teacher: Set Observer Mode'),
};

@injectable()
export class ModeCycleContribution implements CommandContribution, KeybindingContribution, FrontendApplicationContribution {

    @inject(StatusBar)
    protected readonly statusBar: StatusBar;

    protected currentMode: PermissionMode = 'assist';

    protected readonly onDidChangeModeEmitter = new Emitter<PermissionMode>();
    readonly onDidChangeMode: Event<PermissionMode> = this.onDidChangeModeEmitter.event;

    @postConstruct()
    protected init(): void {
        const stored = this.loadMode();
        if (stored && MODE_ORDER.includes(stored)) {
            this.currentMode = stored;
        }
    }

    onStart(_app: FrontendApplication): void {
        this.updateStatusBar();
    }

    getMode(): PermissionMode {
        return this.currentMode;
    }

    getModeDefinition(): ModeDefinition {
        return MODE_DEFINITIONS.find(m => m.mode === this.currentMode) ?? MODE_DEFINITIONS[1];
    }

    setMode(mode: PermissionMode): void {
        if (this.currentMode === mode) {
            return;
        }
        this.currentMode = mode;
        this.saveMode(mode);
        this.updateStatusBar();
        this.onDidChangeModeEmitter.fire(mode);
    }

    cycleMode(): void {
        const idx = MODE_ORDER.indexOf(this.currentMode);
        const next = MODE_ORDER[(idx + 1) % MODE_ORDER.length];
        this.setMode(next);
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(ModeCycleCommand, {
            execute: () => this.cycleMode(),
        });
        registry.registerCommand(ModeSetReviewCommand, {
            execute: () => this.setMode('review'),
        });
        registry.registerCommand(ModeSetAssistCommand, {
            execute: () => this.setMode('assist'),
        });
        registry.registerCommand(ModeSetAutonomousCommand, {
            execute: () => this.setMode('autonomous'),
        });
        registry.registerCommand(ModeSetObserverCommand, {
            execute: () => this.setMode('observer'),
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: ModeCycleCommand.id,
            keybinding: 'ctrlcmd+shift+.',
        });
    }

    protected updateStatusBar(): void {
        const def = this.getModeDefinition();
        this.statusBar.setElement(STATUS_BAR_ID, {
            text: `$(${def.icon.replace('codicon codicon-', '')}) ${def.label}`,
            tooltip: `${nls.localize('theia/teacher/modeTooltip', 'Permission Mode')}: ${def.label} -- ${def.description}`,
            alignment: StatusBarAlignment.RIGHT,
            priority: 900,
            command: ModeCycleCommand.id,
            color: def.cssColor,
        });
    }

    protected saveMode(mode: PermissionMode): void {
        try {
            localStorage.setItem(STORAGE_KEY, mode);
        } catch {
            // localStorage not available
        }
    }

    protected loadMode(): PermissionMode | undefined {
        try {
            return localStorage.getItem(STORAGE_KEY) as PermissionMode | null ?? undefined;
        } catch {
            return undefined;
        }
    }
}
