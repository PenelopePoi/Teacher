import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common';

/**
 * Agent Mode Service — Central permission management for the agent-first IDE.
 *
 * Four modes (Claude Code Shift+Tab style):
 *   supervised  (blue)  — read only, all writes require approval
 *   auto-edit   (amber) — reads + writes allowed, no commands/network
 *   plan-only   (green) — read-only but generates actionable plans
 *   autonomous  (red)   — full access except denylist
 *
 * The denylist is always enforced regardless of mode.
 */

export type AgentMode = 'supervised' | 'auto-edit' | 'plan-only' | 'autonomous';

export interface PermissionSet {
    readFiles: boolean;
    writeFiles: boolean;
    runCommands: boolean;
    networkAccess: boolean;
}

export interface AgentAction {
    type: 'read' | 'write' | 'command' | 'network';
    target: string;
    description: string;
}

export interface PermissionResult {
    allowed: boolean;
    reason: string;
    requiresApproval: boolean;
}

const MODE_ORDER: AgentMode[] = ['supervised', 'auto-edit', 'plan-only', 'autonomous'];
const STORAGE_KEY = 'teacher.agentMode';

@injectable()
export class AgentModeService {

    private currentMode: AgentMode = 'supervised';

    private readonly onDidChangeModeEmitter = new Emitter<AgentMode>();
    readonly onDidChangeMode: Event<AgentMode> = this.onDidChangeModeEmitter.event;

    /** Permission matrix per mode. */
    private readonly permissions: Record<AgentMode, PermissionSet> = {
        'supervised': { readFiles: true, writeFiles: false, runCommands: false, networkAccess: false },
        'auto-edit': { readFiles: true, writeFiles: true, runCommands: false, networkAccess: false },
        'plan-only': { readFiles: true, writeFiles: false, runCommands: false, networkAccess: false },
        'autonomous': { readFiles: true, writeFiles: true, runCommands: true, networkAccess: true },
    };

    /** Commands that are always blocked regardless of mode. */
    private readonly denylist: string[] = [
        'rm -rf',
        'git push --force',
        'DROP TABLE',
        'DROP DATABASE',
        'chmod 777',
        'curl | bash',
        'wget | sh',
        'npm publish',
        'git reset --hard',
        'format c:',
        'mkfs',
        'dd if=',
    ];

    /** Mode display metadata for UI rendering. */
    static readonly MODE_META: Record<AgentMode, { label: string; icon: string; cssColor: string; dotClass: string }> = {
        'supervised': { label: 'SUPERVISED', icon: 'codicon-eye', cssColor: '#3B82F6', dotClass: 'teacher-agent-dot-supervised' },
        'auto-edit': { label: 'AUTO-EDIT', icon: 'codicon-edit', cssColor: '#E8A948', dotClass: 'teacher-agent-dot-auto-edit' },
        'plan-only': { label: 'PLAN ONLY', icon: 'codicon-list-ordered', cssColor: '#4ADE80', dotClass: 'teacher-agent-dot-plan-only' },
        'autonomous': { label: 'AUTONOMOUS', icon: 'codicon-rocket', cssColor: '#EF4444', dotClass: 'teacher-agent-dot-autonomous' },
    };

    @postConstruct()
    protected init(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEY) as AgentMode | null;
            if (stored && MODE_ORDER.includes(stored)) {
                this.currentMode = stored;
            }
        } catch {
            // localStorage not available
        }
        console.info('[AgentModeService] Initialized in mode:', this.currentMode);
    }

    /** Cycle through modes: supervised -> auto-edit -> plan-only -> autonomous -> supervised. */
    cycleMode(): void {
        const idx = MODE_ORDER.indexOf(this.currentMode);
        const next = MODE_ORDER[(idx + 1) % MODE_ORDER.length];
        this.setMode(next);
    }

    getMode(): AgentMode {
        return this.currentMode;
    }

    setMode(mode: AgentMode): void {
        if (this.currentMode === mode) {
            return;
        }
        const previous = this.currentMode;
        this.currentMode = mode;
        this.persist();
        this.onDidChangeModeEmitter.fire(mode);
        console.info(`[AgentModeService] Mode changed: ${previous} -> ${mode}`);
    }

    getPermissions(): PermissionSet {
        return { ...this.permissions[this.currentMode] };
    }

    /** Check whether a specific agent action is allowed under the current mode. */
    checkPermission(action: AgentAction): PermissionResult {
        // Denylist always wins
        if (action.type === 'command' && this.isDenied(action.target)) {
            return {
                allowed: false,
                reason: `Command "${action.target}" is on the denylist and always blocked.`,
                requiresApproval: false,
            };
        }

        const perms = this.permissions[this.currentMode];
        const typeToKey: Record<AgentAction['type'], keyof PermissionSet> = {
            'read': 'readFiles',
            'write': 'writeFiles',
            'command': 'runCommands',
            'network': 'networkAccess',
        };

        const key = typeToKey[action.type];
        const allowed = perms[key];

        if (allowed) {
            return { allowed: true, reason: `${action.type} permitted in ${this.currentMode} mode.`, requiresApproval: false };
        }

        // In supervised mode, writes require approval rather than outright denial
        if (this.currentMode === 'supervised' && (action.type === 'write' || action.type === 'command')) {
            return {
                allowed: false,
                reason: `${action.type} requires approval in supervised mode.`,
                requiresApproval: true,
            };
        }

        return {
            allowed: false,
            reason: `${action.type} is not permitted in ${this.currentMode} mode.`,
            requiresApproval: false,
        };
    }

    /** Check if a command string matches any denylist entry. */
    isDenied(command: string): boolean {
        const lower = command.toLowerCase();
        return this.denylist.some(pattern => lower.includes(pattern.toLowerCase()));
    }

    private persist(): void {
        try {
            localStorage.setItem(STORAGE_KEY, this.currentMode);
        } catch {
            // localStorage not available
        }
    }
}
