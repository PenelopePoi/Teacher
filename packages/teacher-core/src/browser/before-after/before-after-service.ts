import { injectable } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';

/**
 * Metadata describing a proposed diff from an AI agent.
 */
export interface DiffMetadata {
    readonly agentId: string;
    readonly agentName: string;
    readonly action: string;
    readonly filesChanged: string[];
    readonly timestamp: number;
}

export interface BeforeAfterState {
    readonly before: string;
    readonly after: string;
    readonly metadata: DiffMetadata;
}

export interface BeforeAfterAcceptEvent {
    readonly state: BeforeAfterState;
}

export interface BeforeAfterRejectEvent {
    readonly state: BeforeAfterState;
}

export interface BeforeAfterEditEvent {
    readonly state: BeforeAfterState;
}

/**
 * Before/After service — manages the current diff state for the C6 canvas.
 *
 * Agents call `showDiff()` to propose a change. The widget reads `currentState`
 * and renders the split view. The user accepts, rejects, or edits.
 */
@injectable()
export class BeforeAfterService {

    protected readonly _onAccept = new Emitter<BeforeAfterAcceptEvent>();
    readonly onAccept: Event<BeforeAfterAcceptEvent> = this._onAccept.event;

    protected readonly _onReject = new Emitter<BeforeAfterRejectEvent>();
    readonly onReject: Event<BeforeAfterRejectEvent> = this._onReject.event;

    protected readonly _onEdit = new Emitter<BeforeAfterEditEvent>();
    readonly onEdit: Event<BeforeAfterEditEvent> = this._onEdit.event;

    protected readonly _onDidChange = new Emitter<void>();
    readonly onDidChange: Event<void> = this._onDidChange.event;

    protected _current: BeforeAfterState | undefined;

    get currentState(): BeforeAfterState | undefined {
        return this._current;
    }

    /**
     * Show a before/after diff in the canvas widget.
     */
    showDiff(before: string, after: string, metadata: DiffMetadata): void {
        this._current = { before, after, metadata };
        this._onDidChange.fire();
    }

    /**
     * Accept the proposed change.
     */
    accept(): void {
        if (this._current) {
            const state = this._current;
            this._current = undefined;
            this._onAccept.fire({ state });
            this._onDidChange.fire();
        }
    }

    /**
     * Reject the proposed change.
     */
    reject(): void {
        if (this._current) {
            const state = this._current;
            this._current = undefined;
            this._onReject.fire({ state });
            this._onDidChange.fire();
        }
    }

    /**
     * Open the proposed change in the editor for manual editing.
     */
    edit(): void {
        if (this._current) {
            this._onEdit.fire({ state: this._current });
        }
    }

    /**
     * Clear without emitting accept/reject.
     */
    clear(): void {
        if (this._current) {
            this._current = undefined;
            this._onDidChange.fire();
        }
    }
}
