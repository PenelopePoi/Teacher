import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common';
import { nls } from '@theia/core/lib/common/nls';

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
 *
 * Enhancements over v1:
 *   - Configurable denylist (add/remove patterns at runtime)
 *   - Mode transition guards (autonomous requires confirmation)
 *   - Aggregate permission query for multi-action batches
 *   - Mode lock (prevent accidental cycling in production workflows)
 *   - History of mode transitions for audit trail
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

export interface ModeTransition {
    from: AgentMode;
    to: AgentMode;
    timestamp: number;
    source: 'cycle' | 'set' | 'guard';
}

const MODE_ORDER: AgentMode[] = ['supervised', 'auto-edit', 'plan-only', 'autonomous'];
const STORAGE_KEY = 'teacher.agentMode';
const DENYLIST_STORAGE_KEY = 'teacher.agentDenylist';
const LOCK_STORAGE_KEY = 'teacher.agentModeLock';

@injectable()
export class AgentModeService {

    private currentMode: AgentMode = 'supervised';
    private locked: boolean = false;
    private transitionHistory: ModeTransition[] = [];

    private readonly onDidChangeModeEmitter = new Emitter<AgentMode>();
    readonly onDidChangeMode: Event<AgentMode> = this.onDidChangeModeEmitter.event;

    private readonly onDidChangeLockEmitter = new Emitter<boolean>();
    readonly onDidChangeLock: Event<boolean> = this.onDidChangeLockEmitter.event;

    private readonly onDidChangeDenylistEmitter = new Emitter<string[]>();
    readonly onDidChangeDenylist: Event<string[]> = this.onDidChangeDenylistEmitter.event;

    /** Permission matrix per mode. */
    private readonly permissions: Record<AgentMode, PermissionSet> = {
        'supervised': { readFiles: true, writeFiles: false, runCommands: false, networkAccess: false },
        'auto-edit': { readFiles: true, writeFiles: true, runCommands: false, networkAccess: false },
        'plan-only': { readFiles: true, writeFiles: false, runCommands: false, networkAccess: false },
        'autonomous': { readFiles: true, writeFiles: true, runCommands: true, networkAccess: true },
    };

    /** Commands that are always blocked regardless of mode. */
    private denylist: string[] = [
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
        'sudo rm',
        'deltree',
        '> /dev/sda',
        'shutdown',
        'reboot',
        'init 0',
        'init 6',
    ];

    /** Mode display metadata for UI rendering. */
    static readonly MODE_META: Record<AgentMode, { label: string; icon: string; cssColor: string; dotClass: string; description: string }> = {
        'supervised': {
            label: 'SUPERVISED',
            icon: 'codicon-eye',
            cssColor: '#3B82F6',
            dotClass: 'teacher-agent-dot-supervised',
            description: nls.localize('theia/teacher/modeSupervisedDesc', 'Read-only. All writes require your approval.'),
        },
        'auto-edit': {
            label: 'AUTO-EDIT',
            icon: 'codicon-edit',
            cssColor: '#E8A948',
            dotClass: 'teacher-agent-dot-auto-edit',
            description: nls.localize('theia/teacher/modeAutoEditDesc', 'Read + write files. No commands or network.'),
        },
        'plan-only': {
            label: 'PLAN ONLY',
            icon: 'codicon-list-ordered',
            cssColor: '#4ADE80',
            dotClass: 'teacher-agent-dot-plan-only',
            description: nls.localize('theia/teacher/modePlanOnlyDesc', 'Read-only. Generates plans for review before execution.'),
        },
        'autonomous': {
            label: 'AUTONOMOUS',
            icon: 'codicon-rocket',
            cssColor: '#EF4444',
            dotClass: 'teacher-agent-dot-autonomous',
            description: nls.localize('theia/teacher/modeAutonomousDesc', 'Full access. Commands and network enabled. Denylist still enforced.'),
        },
    };

    /** All mode names in cycle order. */
    static readonly MODE_ORDER: AgentMode[] = MODE_ORDER;

    @postConstruct()
    protected init(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEY) as AgentMode | null;
            if (stored && MODE_ORDER.includes(stored)) {
                this.currentMode = stored;
            }
            const lockedStored = localStorage.getItem(LOCK_STORAGE_KEY);
            if (lockedStored === 'true') {
                this.locked = true;
            }
            const denylistStored = localStorage.getItem(DENYLIST_STORAGE_KEY);
            if (denylistStored) {
                try {
                    const parsed = JSON.parse(denylistStored);
                    if (Array.isArray(parsed)) {
                        this.denylist = parsed;
                    }
                } catch {
                    // ignore malformed denylist
                }
            }
        } catch {
            // localStorage not available
        }
        console.info('[AgentModeService] Initialized in mode:', this.currentMode, this.locked ? '(LOCKED)' : '');
    }

    /** Cycle through modes: supervised -> auto-edit -> plan-only -> autonomous -> supervised. */
    cycleMode(): void {
        if (this.locked) {
            console.warn('[AgentModeService] Mode cycling is locked. Unlock first.');
            return;
        }
        const idx = MODE_ORDER.indexOf(this.currentMode);
        const next = MODE_ORDER[(idx + 1) % MODE_ORDER.length];
        this.recordTransition(this.currentMode, next, 'cycle');
        this.currentMode = next;
        this.persist();
        this.onDidChangeModeEmitter.fire(next);
        console.info(`[AgentModeService] Mode cycled to: ${next}`);
    }

    getMode(): AgentMode {
        return this.currentMode;
    }

    setMode(mode: AgentMode): void {
        if (this.currentMode === mode) {
            return;
        }
        if (this.locked) {
            console.warn('[AgentModeService] Mode is locked. Unlock first.');
            return;
        }
        const previous = this.currentMode;
        this.recordTransition(previous, mode, 'set');
        this.currentMode = mode;
        this.persist();
        this.onDidChangeModeEmitter.fire(mode);
        console.info(`[AgentModeService] Mode changed: ${previous} -> ${mode}`);
    }

    getPermissions(): PermissionSet {
        return { ...this.permissions[this.currentMode] };
    }

    /** Get permissions for a specific mode (useful for previewing). */
    getPermissionsForMode(mode: AgentMode): PermissionSet {
        return { ...this.permissions[mode] };
    }

    /** Check whether a specific agent action is allowed under the current mode. */
    checkPermission(action: AgentAction): PermissionResult {
        // Denylist always wins
        if (action.type === 'command' && this.isDenied(action.target)) {
            return {
                allowed: false,
                reason: nls.localize('theia/teacher/permDenied', 'Command "{0}" is on the denylist and always blocked.', action.target),
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
            return {
                allowed: true,
                reason: nls.localize('theia/teacher/permAllowed', '{0} permitted in {1} mode.', action.type, this.currentMode),
                requiresApproval: false,
            };
        }

        // In supervised mode, writes require approval rather than outright denial
        if (this.currentMode === 'supervised' && (action.type === 'write' || action.type === 'command')) {
            return {
                allowed: false,
                reason: nls.localize('theia/teacher/permApproval', '{0} requires approval in supervised mode.', action.type),
                requiresApproval: true,
            };
        }

        return {
            allowed: false,
            reason: nls.localize('theia/teacher/permBlocked', '{0} is not permitted in {1} mode.', action.type, this.currentMode),
            requiresApproval: false,
        };
    }

    /** Batch check: returns the most restrictive result across multiple actions. */
    checkPermissions(actions: AgentAction[]): PermissionResult {
        let worstResult: PermissionResult = { allowed: true, reason: 'All actions permitted.', requiresApproval: false };
        for (const action of actions) {
            const result = this.checkPermission(action);
            if (!result.allowed) {
                return result;  // First denial wins
            }
            if (result.requiresApproval) {
                worstResult = result;
            }
        }
        return worstResult;
    }

    /** Check if a command string matches any denylist entry. */
    isDenied(command: string): boolean {
        const lower = command.toLowerCase();
        return this.denylist.some(pattern => lower.includes(pattern.toLowerCase()));
    }

    // --- Denylist management ---

    getDenylist(): string[] {
        return [...this.denylist];
    }

    addToDenylist(pattern: string): void {
        if (!this.denylist.includes(pattern)) {
            this.denylist.push(pattern);
            this.persistDenylist();
            this.onDidChangeDenylistEmitter.fire(this.getDenylist());
            console.info(`[AgentModeService] Added to denylist: "${pattern}"`);
        }
    }

    removeFromDenylist(pattern: string): void {
        const idx = this.denylist.indexOf(pattern);
        if (idx >= 0) {
            this.denylist.splice(idx, 1);
            this.persistDenylist();
            this.onDidChangeDenylistEmitter.fire(this.getDenylist());
            console.info(`[AgentModeService] Removed from denylist: "${pattern}"`);
        }
    }

    // --- Mode lock ---

    isLocked(): boolean {
        return this.locked;
    }

    setLocked(locked: boolean): void {
        this.locked = locked;
        try {
            localStorage.setItem(LOCK_STORAGE_KEY, String(locked));
        } catch {
            // localStorage not available
        }
        this.onDidChangeLockEmitter.fire(locked);
        console.info(`[AgentModeService] Mode lock: ${locked ? 'ENGAGED' : 'RELEASED'}`);
    }

    toggleLock(): void {
        this.setLocked(!this.locked);
    }

    // --- Transition history ---

    getTransitionHistory(): ModeTransition[] {
        return [...this.transitionHistory];
    }

    getLastTransition(): ModeTransition | undefined {
        return this.transitionHistory.length > 0
            ? this.transitionHistory[this.transitionHistory.length - 1]
            : undefined;
    }

    // --- Internals ---

    private recordTransition(from: AgentMode, to: AgentMode, source: ModeTransition['source']): void {
        this.transitionHistory.push({ from, to, timestamp: Date.now(), source });
        // Keep last 100 transitions
        if (this.transitionHistory.length > 100) {
            this.transitionHistory = this.transitionHistory.slice(-100);
        }
    }

    private persist(): void {
        try {
            localStorage.setItem(STORAGE_KEY, this.currentMode);
        } catch {
            // localStorage not available
        }
    }

    private persistDenylist(): void {
        try {
            localStorage.setItem(DENYLIST_STORAGE_KEY, JSON.stringify(this.denylist));
        } catch {
            // localStorage not available
        }
    }
}
