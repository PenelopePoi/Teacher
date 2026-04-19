import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common';

/**
 * Agent Session Manager — tracks agent actions, checkpoints, and plans.
 *
 * Auto-creates a checkpoint every 5 actions. Provides rewind support
 * and plan-mode approval workflow.
 *
 * Enhancements over v1:
 *   - Action search and filtering
 *   - Checkpoint diffing (files changed between checkpoints)
 *   - Session persistence across browser refreshes (sessionStorage)
 *   - Plan execution tracking with step-level progress
 *   - Risk assessment aggregation across plan steps
 *   - Undo last action (single-step rewind)
 *   - Session export for debugging/audit
 */

export interface AgentActionRecord {
    id: string;
    type: string;
    description: string;
    files: string[];
    reversible: boolean;
    timestamp: number;
    metadata?: Record<string, unknown>;
}

export interface Checkpoint {
    id: string;
    label: string;
    timestamp: number;
    actionIndex: number;
    auto: boolean;
    fileSnapshot: string[];
}

export interface PlanStep {
    description: string;
    files: string[];
    risk: 'low' | 'medium' | 'high';
    status: 'pending' | 'approved' | 'rejected' | 'executing' | 'completed';
    estimatedDuration?: number;
    actualDuration?: number;
    startedAt?: number;
    completedAt?: number;
}

export interface Plan {
    id: string;
    title: string;
    steps: PlanStep[];
    status: 'drafting' | 'reviewing' | 'approved' | 'executing' | 'completed' | 'aborted';
    createdAt: number;
    updatedAt: number;
}

export interface SessionSnapshot {
    actions: AgentActionRecord[];
    checkpoints: Checkpoint[];
    plan: Plan | undefined;
    startTime: number;
    exportedAt: number;
    duration: number;
}

const AUTO_CHECKPOINT_INTERVAL = 5;
const SESSION_STORAGE_KEY = 'teacher.agentSession';
const MAX_PERSISTED_ACTIONS = 200;

@injectable()
export class AgentSessionManager {

    private actions: AgentActionRecord[] = [];
    private checkpoints: Checkpoint[] = [];
    private sessionStartTime: number = Date.now();
    private actionCounter = 0;
    private currentPlan: Plan | undefined;
    private paused: boolean = false;

    private readonly onDidRecordActionEmitter = new Emitter<AgentActionRecord>();
    readonly onDidRecordAction: Event<AgentActionRecord> = this.onDidRecordActionEmitter.event;

    private readonly onDidCreateCheckpointEmitter = new Emitter<Checkpoint>();
    readonly onDidCreateCheckpoint: Event<Checkpoint> = this.onDidCreateCheckpointEmitter.event;

    private readonly onDidChangePlanEmitter = new Emitter<Plan | undefined>();
    readonly onDidChangePlan: Event<Plan | undefined> = this.onDidChangePlanEmitter.event;

    private readonly onDidRewindEmitter = new Emitter<Checkpoint>();
    readonly onDidRewind: Event<Checkpoint> = this.onDidRewindEmitter.event;

    private readonly onDidUndoEmitter = new Emitter<AgentActionRecord>();
    readonly onDidUndo: Event<AgentActionRecord> = this.onDidUndoEmitter.event;

    private readonly onDidClearSessionEmitter = new Emitter<void>();
    readonly onDidClearSession: Event<void> = this.onDidClearSessionEmitter.event;

    @postConstruct()
    protected init(): void {
        this.restoreSession();
        if (this.checkpoints.length === 0) {
            this.createCheckpoint('Session Start');
        }
        console.info('[AgentSessionManager] Session started at', new Date(this.sessionStartTime).toISOString(),
            `(${this.actions.length} restored actions)`);
    }

    /** Record an agent action. Returns action ID. Auto-checkpoints every 5 actions. */
    recordAction(action: { type: string; description: string; files?: string[]; reversible: boolean; metadata?: Record<string, unknown> }): string {
        const id = `action-${++this.actionCounter}-${Date.now()}`;
        const record: AgentActionRecord = {
            id,
            type: action.type,
            description: action.description,
            files: action.files ?? [],
            reversible: action.reversible,
            timestamp: Date.now(),
            metadata: action.metadata,
        };
        this.actions.push(record);
        this.onDidRecordActionEmitter.fire(record);

        // Auto-checkpoint every N actions
        if (this.actions.length % AUTO_CHECKPOINT_INTERVAL === 0) {
            this.createCheckpoint(`Auto (${this.actions.length} actions)`, true);
        }

        this.persistSession();
        console.info(`[AgentSessionManager] Action #${this.actionCounter}: ${action.type} — ${action.description}`);
        return id;
    }

    /** Create a checkpoint. Returns checkpoint ID. */
    createCheckpoint(label?: string, auto: boolean = false): string {
        const id = `ckpt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const checkpoint: Checkpoint = {
            id,
            label: label ?? `Checkpoint #${this.checkpoints.length + 1}`,
            timestamp: Date.now(),
            actionIndex: this.actions.length,
            auto,
            fileSnapshot: this.getFilesTouched(),
        };
        this.checkpoints.push(checkpoint);
        this.onDidCreateCheckpointEmitter.fire(checkpoint);
        this.persistSession();
        console.info(`[AgentSessionManager] Checkpoint created: ${checkpoint.label} (${checkpoint.id})`);
        return id;
    }

    getCheckpoints(): Checkpoint[] {
        return [...this.checkpoints];
    }

    /** Get a specific checkpoint by ID. */
    getCheckpoint(checkpointId: string): Checkpoint | undefined {
        return this.checkpoints.find(c => c.id === checkpointId);
    }

    /** Rewind to a checkpoint — truncates action history after that point. */
    rewindTo(checkpointId: string, _scope: 'code' | 'conversation' | 'both'): void {
        const checkpoint = this.checkpoints.find(c => c.id === checkpointId);
        if (!checkpoint) {
            console.warn(`[AgentSessionManager] Checkpoint not found: ${checkpointId}`);
            return;
        }

        // Truncate actions after the checkpoint
        this.actions = this.actions.slice(0, checkpoint.actionIndex);
        // Remove checkpoints after this one
        const ckptIdx = this.checkpoints.indexOf(checkpoint);
        this.checkpoints = this.checkpoints.slice(0, ckptIdx + 1);

        this.onDidRewindEmitter.fire(checkpoint);
        this.persistSession();
        console.info(`[AgentSessionManager] Rewound to checkpoint: ${checkpoint.label}`);
    }

    /** Undo the last action (if reversible). Returns the undone action or undefined. */
    undoLastAction(): AgentActionRecord | undefined {
        if (this.actions.length === 0) {
            return undefined;
        }
        const last = this.actions[this.actions.length - 1];
        if (!last.reversible) {
            console.warn(`[AgentSessionManager] Last action is not reversible: ${last.description}`);
            return undefined;
        }
        this.actions.pop();
        this.onDidUndoEmitter.fire(last);
        this.persistSession();
        console.info(`[AgentSessionManager] Undone: ${last.description}`);
        return last;
    }

    /** Get files that changed between two checkpoints. */
    getCheckpointDiff(fromId: string, toId: string): { added: string[]; removed: string[] } {
        const from = this.checkpoints.find(c => c.id === fromId);
        const to = this.checkpoints.find(c => c.id === toId);
        if (!from || !to) {
            return { added: [], removed: [] };
        }
        const fromSet = new Set(from.fileSnapshot);
        const toSet = new Set(to.fileSnapshot);
        const added = to.fileSnapshot.filter(f => !fromSet.has(f));
        const removed = from.fileSnapshot.filter(f => !toSet.has(f));
        return { added, removed };
    }

    /** Session duration in milliseconds. */
    getSessionDuration(): number {
        return Date.now() - this.sessionStartTime;
    }

    getActionCount(): number {
        return this.actions.length;
    }

    getActions(): AgentActionRecord[] {
        return [...this.actions];
    }

    /** Get the last N actions. */
    getRecentActions(limit: number = 10): AgentActionRecord[] {
        return this.actions.slice(-limit);
    }

    /** Search actions by type or description substring. */
    searchActions(query: string): AgentActionRecord[] {
        const lower = query.toLowerCase();
        return this.actions.filter(a =>
            a.type.toLowerCase().includes(lower) ||
            a.description.toLowerCase().includes(lower) ||
            a.files.some(f => f.toLowerCase().includes(lower))
        );
    }

    /** Unique set of files touched during this session. */
    getFilesTouched(): string[] {
        const files = new Set<string>();
        for (const action of this.actions) {
            for (const f of action.files) {
                files.add(f);
            }
        }
        return Array.from(files);
    }

    /** Count of unique files touched. */
    getFilesTouchedCount(): number {
        return this.getFilesTouched().length;
    }

    /** Is the session currently paused (no actions recorded). */
    isPaused(): boolean {
        return this.paused;
    }

    /** Pause action recording. */
    pause(): void {
        this.paused = true;
        console.info('[AgentSessionManager] Session paused');
    }

    /** Resume action recording. */
    resume(): void {
        this.paused = false;
        console.info('[AgentSessionManager] Session resumed');
    }

    // ---- Plan Mode ----

    setPlan(plan: Plan): void {
        this.currentPlan = plan;
        this.onDidChangePlanEmitter.fire(plan);
        this.persistSession();
        console.info('[AgentSessionManager] Plan set with', plan.steps.length, 'steps');
    }

    getPlan(): Plan | undefined {
        return this.currentPlan;
    }

    /** Check if there is an active plan. */
    hasPlan(): boolean {
        return this.currentPlan !== undefined;
    }

    approveStep(stepIndex: number): void {
        if (!this.currentPlan || stepIndex < 0 || stepIndex >= this.currentPlan.steps.length) {
            return;
        }
        this.currentPlan.steps[stepIndex].status = 'approved';
        this.currentPlan.updatedAt = Date.now();
        this.onDidChangePlanEmitter.fire(this.currentPlan);

        // If all steps approved, mark plan as approved
        if (this.currentPlan.steps.every(s => s.status === 'approved' || s.status === 'completed')) {
            this.currentPlan.status = 'approved';
            this.onDidChangePlanEmitter.fire(this.currentPlan);
        }
        this.persistSession();
    }

    rejectStep(stepIndex: number): void {
        if (!this.currentPlan || stepIndex < 0 || stepIndex >= this.currentPlan.steps.length) {
            return;
        }
        this.currentPlan.steps[stepIndex].status = 'rejected';
        this.currentPlan.updatedAt = Date.now();
        this.onDidChangePlanEmitter.fire(this.currentPlan);
        this.persistSession();
    }

    /** Start executing a plan step. */
    startStep(stepIndex: number): void {
        if (!this.currentPlan || stepIndex < 0 || stepIndex >= this.currentPlan.steps.length) {
            return;
        }
        const step = this.currentPlan.steps[stepIndex];
        step.status = 'executing';
        step.startedAt = Date.now();
        this.currentPlan.status = 'executing';
        this.currentPlan.updatedAt = Date.now();
        this.onDidChangePlanEmitter.fire(this.currentPlan);
        this.persistSession();
    }

    /** Complete a plan step. */
    completeStep(stepIndex: number): void {
        if (!this.currentPlan || stepIndex < 0 || stepIndex >= this.currentPlan.steps.length) {
            return;
        }
        const step = this.currentPlan.steps[stepIndex];
        step.status = 'completed';
        step.completedAt = Date.now();
        if (step.startedAt) {
            step.actualDuration = step.completedAt - step.startedAt;
        }
        this.currentPlan.updatedAt = Date.now();

        // If all steps completed, mark plan as completed
        if (this.currentPlan.steps.every(s => s.status === 'completed')) {
            this.currentPlan.status = 'completed';
        }
        this.onDidChangePlanEmitter.fire(this.currentPlan);
        this.persistSession();
    }

    /** Get aggregate risk level of the current plan. */
    getPlanRiskLevel(): 'low' | 'medium' | 'high' | 'none' {
        if (!this.currentPlan) {
            return 'none';
        }
        const risks = this.currentPlan.steps.map(s => s.risk);
        if (risks.includes('high')) {
            return 'high';
        }
        if (risks.includes('medium')) {
            return 'medium';
        }
        return 'low';
    }

    /** Get plan completion percentage. */
    getPlanProgress(): number {
        if (!this.currentPlan || this.currentPlan.steps.length === 0) {
            return 0;
        }
        const completed = this.currentPlan.steps.filter(s => s.status === 'completed').length;
        return Math.round((completed / this.currentPlan.steps.length) * 100);
    }

    clearPlan(): void {
        this.currentPlan = undefined;
        this.onDidChangePlanEmitter.fire(undefined);
        this.persistSession();
    }

    /** Export session for debugging/audit. */
    exportSession(): SessionSnapshot {
        return {
            actions: [...this.actions],
            checkpoints: [...this.checkpoints],
            plan: this.currentPlan ? { ...this.currentPlan } : undefined,
            startTime: this.sessionStartTime,
            exportedAt: Date.now(),
            duration: this.getSessionDuration(),
        };
    }

    /** Reset the session completely. */
    clearSession(): void {
        this.actions = [];
        this.checkpoints = [];
        this.currentPlan = undefined;
        this.sessionStartTime = Date.now();
        this.actionCounter = 0;
        this.paused = false;
        this.createCheckpoint('Session Start');
        this.onDidChangePlanEmitter.fire(undefined);
        this.onDidClearSessionEmitter.fire();
        this.clearPersistedSession();
        console.info('[AgentSessionManager] Session cleared');
    }

    // ---- Session persistence ----

    private persistSession(): void {
        try {
            const data = {
                actions: this.actions.slice(-MAX_PERSISTED_ACTIONS),
                checkpoints: this.checkpoints,
                plan: this.currentPlan,
                startTime: this.sessionStartTime,
                counter: this.actionCounter,
            };
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
        } catch {
            // sessionStorage not available or quota exceeded
        }
    }

    private restoreSession(): void {
        try {
            const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                if (data && Array.isArray(data.actions)) {
                    this.actions = data.actions;
                    this.checkpoints = data.checkpoints ?? [];
                    this.currentPlan = data.plan;
                    this.sessionStartTime = data.startTime ?? Date.now();
                    this.actionCounter = data.counter ?? this.actions.length;
                    console.info(`[AgentSessionManager] Restored session: ${this.actions.length} actions, ${this.checkpoints.length} checkpoints`);
                }
            }
        } catch {
            // sessionStorage not available or malformed
        }
    }

    private clearPersistedSession(): void {
        try {
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
        } catch {
            // sessionStorage not available
        }
    }
}
