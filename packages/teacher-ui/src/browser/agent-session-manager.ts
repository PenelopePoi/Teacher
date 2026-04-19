import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common';

/**
 * Agent Session Manager — tracks agent actions, checkpoints, and plans.
 *
 * Auto-creates a checkpoint every 5 actions. Provides rewind support
 * and plan-mode approval workflow.
 */

export interface AgentActionRecord {
    id: string;
    type: string;
    description: string;
    files: string[];
    reversible: boolean;
    timestamp: number;
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
}

export interface Plan {
    steps: PlanStep[];
    status: 'drafting' | 'reviewing' | 'approved' | 'executing';
}

const AUTO_CHECKPOINT_INTERVAL = 5;

@injectable()
export class AgentSessionManager {

    private actions: AgentActionRecord[] = [];
    private checkpoints: Checkpoint[] = [];
    private sessionStartTime: number = Date.now();
    private actionCounter = 0;
    private currentPlan: Plan | undefined;

    private readonly onDidRecordActionEmitter = new Emitter<AgentActionRecord>();
    readonly onDidRecordAction: Event<AgentActionRecord> = this.onDidRecordActionEmitter.event;

    private readonly onDidCreateCheckpointEmitter = new Emitter<Checkpoint>();
    readonly onDidCreateCheckpoint: Event<Checkpoint> = this.onDidCreateCheckpointEmitter.event;

    private readonly onDidChangePlanEmitter = new Emitter<Plan | undefined>();
    readonly onDidChangePlan: Event<Plan | undefined> = this.onDidChangePlanEmitter.event;

    private readonly onDidRewindEmitter = new Emitter<Checkpoint>();
    readonly onDidRewind: Event<Checkpoint> = this.onDidRewindEmitter.event;

    @postConstruct()
    protected init(): void {
        // Create initial checkpoint at session start
        this.createCheckpoint('Session Start');
        console.info('[AgentSessionManager] Session started at', new Date(this.sessionStartTime).toISOString());
    }

    /** Record an agent action. Returns action ID. Auto-checkpoints every 5 actions. */
    recordAction(action: { type: string; description: string; files?: string[]; reversible: boolean }): string {
        const id = `action-${++this.actionCounter}-${Date.now()}`;
        const record: AgentActionRecord = {
            id,
            type: action.type,
            description: action.description,
            files: action.files ?? [],
            reversible: action.reversible,
            timestamp: Date.now(),
        };
        this.actions.push(record);
        this.onDidRecordActionEmitter.fire(record);

        // Auto-checkpoint every N actions
        if (this.actions.length % AUTO_CHECKPOINT_INTERVAL === 0) {
            this.createCheckpoint(`Auto (${this.actions.length} actions)`, true);
        }

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
        console.info(`[AgentSessionManager] Checkpoint created: ${checkpoint.label} (${checkpoint.id})`);
        return id;
    }

    getCheckpoints(): Checkpoint[] {
        return [...this.checkpoints];
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
        console.info(`[AgentSessionManager] Rewound to checkpoint: ${checkpoint.label}`);
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

    // ---- Plan Mode ----

    setPlan(plan: Plan): void {
        this.currentPlan = plan;
        this.onDidChangePlanEmitter.fire(plan);
        console.info('[AgentSessionManager] Plan set with', plan.steps.length, 'steps');
    }

    getPlan(): Plan | undefined {
        return this.currentPlan;
    }

    approveStep(stepIndex: number): void {
        if (!this.currentPlan || stepIndex < 0 || stepIndex >= this.currentPlan.steps.length) {
            return;
        }
        this.currentPlan.steps[stepIndex].status = 'approved';
        this.onDidChangePlanEmitter.fire(this.currentPlan);

        // If all steps approved, mark plan as approved
        if (this.currentPlan.steps.every(s => s.status === 'approved' || s.status === 'completed')) {
            this.currentPlan.status = 'approved';
            this.onDidChangePlanEmitter.fire(this.currentPlan);
        }
    }

    rejectStep(stepIndex: number): void {
        if (!this.currentPlan || stepIndex < 0 || stepIndex >= this.currentPlan.steps.length) {
            return;
        }
        this.currentPlan.steps[stepIndex].status = 'rejected';
        this.onDidChangePlanEmitter.fire(this.currentPlan);
    }

    clearPlan(): void {
        this.currentPlan = undefined;
        this.onDidChangePlanEmitter.fire(undefined);
    }

    /** Reset the session completely. */
    clearSession(): void {
        this.actions = [];
        this.checkpoints = [];
        this.currentPlan = undefined;
        this.sessionStartTime = Date.now();
        this.actionCounter = 0;
        this.createCheckpoint('Session Start');
        this.onDidChangePlanEmitter.fire(undefined);
        console.info('[AgentSessionManager] Session cleared');
    }
}
