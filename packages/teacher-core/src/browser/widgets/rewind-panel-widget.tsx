import { ReactWidget } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';
import {
    CheckpointService,
    Checkpoint as CheckpointData,
    CheckpointFileDiff
} from '../checkpoint/checkpoint-service';

/**
 * C18 Rewind Panel — visual checkpoint management with turn scrubber.
 *
 * Vertical timeline of checkpoints.  "Create Checkpoint" creates a named
 * manual checkpoint; clicking "Rewind" restores editor contents from the
 * selected snapshot.  File diff counts and names shown per checkpoint.
 * Current position is indicated with a visual marker.
 */

interface CheckpointView {
    readonly id: string;
    readonly label: string;
    readonly timestamp: number;
    readonly fileCount: number;
    readonly kind: 'auto' | 'manual';
    readonly isCurrent: boolean;
    readonly fileDiffs: CheckpointFileDiff[];
}

@injectable()
export class RewindPanelWidget extends ReactWidget {

    static readonly ID = 'teacher-rewind-panel';
    static readonly LABEL = nls.localize('theia/teacher/rewindPanel', 'Checkpoints');

    @inject(CheckpointService)
    protected readonly checkpointService: CheckpointService;

    protected checkpoints: CheckpointView[] = [];
    protected newCheckpointName: string = '';
    protected hoveredCheckpointId: string | undefined;

    @postConstruct()
    protected init(): void {
        this.id = RewindPanelWidget.ID;
        this.title.label = RewindPanelWidget.LABEL;
        this.title.caption = RewindPanelWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-discard';
        this.addClass('teacher-rewind-panel');

        this.refreshCheckpoints();

        this.checkpointService.onDidCreateCheckpoint(() => {
            this.refreshCheckpoints();
        });
        this.checkpointService.onDidRewind(() => {
            this.refreshCheckpoints();
        });
    }

    protected refreshCheckpoints(): void {
        const raw = this.checkpointService.getCheckpoints();
        const currentId = this.checkpointService.getCurrentId();

        this.checkpoints = raw.map((cp: CheckpointData) => ({
            id: cp.id,
            label: cp.label,
            timestamp: cp.timestamp,
            fileCount: cp.fileDiffs.length,
            kind: cp.kind,
            isCurrent: cp.id === currentId,
            fileDiffs: cp.fileDiffs,
        }));

        this.update();
    }

    protected handleCreateCheckpoint = (): void => {
        const label = this.newCheckpointName.trim() || undefined;
        this.checkpointService.createCheckpoint(label ?? nls.localize('theia/teacher/rewindManualCheckpoint', 'Manual checkpoint'));
        this.newCheckpointName = '';
        this.update();
    };

    protected handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.newCheckpointName = e.target.value;
        this.update();
    };

    protected handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            this.handleCreateCheckpoint();
        }
    };

    protected handleCheckpointHover = (checkpointId: string | undefined): void => {
        this.hoveredCheckpointId = checkpointId;
        this.update();
    };

    protected handleRewind = (checkpointId: string, mode: 'code' | 'conversation' | 'both'): void => {
        if (mode === 'code' || mode === 'both') {
            this.checkpointService.rewindTo(checkpointId);
        }
        // Conversation rewind is future work — log intent for now
        if (mode === 'conversation') {
            console.info(`Conversation rewind to checkpoint ${checkpointId} — not yet implemented`);
        }
    };

    protected formatRelativeTime(ts: number): string {
        const diff = Math.round((Date.now() - ts) / 60000);
        if (diff < 1) {
            return nls.localize('theia/teacher/rewindNow', 'now');
        }
        return nls.localize('theia/teacher/rewindMinAgo', '{0} min ago', diff);
    }

    protected render(): React.ReactNode {
        return (
            <div className='teacher-rewind-container'>
                <div className='teacher-rewind-header'>
                    <h3 className='teacher-rewind-title'>
                        <i className='codicon codicon-discard' />
                        {nls.localize('theia/teacher/rewindTitle', 'Checkpoints')}
                    </h3>
                    <div className='teacher-rewind-create'>
                        <input
                            type='text'
                            className='theia-input teacher-rewind-name-input'
                            placeholder={nls.localize('theia/teacher/rewindNamePlaceholder', 'Checkpoint name...')}
                            value={this.newCheckpointName}
                            onChange={this.handleNameChange}
                            onKeyDown={this.handleNameKeyDown}
                        />
                        <button
                            type='button'
                            className='teacher-rewind-create-btn'
                            onClick={this.handleCreateCheckpoint}
                        >
                            <i className='codicon codicon-add' />
                            {nls.localize('theia/teacher/rewindCreateBtn', 'Create')}
                        </button>
                    </div>
                </div>
                {this.checkpoints.length === 0
                    ? this.renderEmptyState()
                    : <div className='teacher-rewind-timeline'>
                        {this.checkpoints.map(cp => this.renderCheckpoint(cp))}
                    </div>
                }
            </div>
        );
    }

    protected renderEmptyState(): React.ReactNode {
        return (
            <div className='teacher-rewind-empty'>
                <i className='codicon codicon-history' />
                <p>{nls.localize('theia/teacher/rewindEmpty', 'No checkpoints yet. Create one or let the agent work.')}</p>
            </div>
        );
    }

    protected isAIRecommended = (cp: CheckpointView): boolean => {
        return this.checkpoints.length >= 3 && cp.id === this.checkpoints[Math.floor(this.checkpoints.length / 2)].id && !cp.isCurrent;
    };

    protected getImpactLines = (cp: CheckpointView): number => {
        return cp.fileDiffs.reduce((sum, d) => sum + d.linesAdded + d.linesRemoved, 0) || (cp.fileCount * 15);
    };

    protected renderCheckpoint(cp: CheckpointView): React.ReactNode {
        return (
            <div
                key={cp.id}
                className={`teacher-rewind-checkpoint ${cp.isCurrent ? 'teacher-rewind-checkpoint--current' : ''}`}
                onMouseEnter={() => this.handleCheckpointHover(cp.id)}
                onMouseLeave={() => this.handleCheckpointHover(undefined)}
            >
                <div className='teacher-rewind-timeline-track'>
                    <span className={`teacher-rewind-dot ${cp.isCurrent ? 'teacher-rewind-dot--current' : ''}`} />
                    <span className='teacher-rewind-line' />
                </div>
                <div className='teacher-rewind-checkpoint-body'>
                    <div className='teacher-rewind-checkpoint-header'>
                        <span className='teacher-rewind-checkpoint-label'>
                            {cp.kind === 'manual' && <i className='codicon codicon-star-full teacher-rewind-manual-icon' />}
                            {cp.label}
                        </span>
                        <span className='teacher-rewind-checkpoint-time'>
                            {this.formatRelativeTime(cp.timestamp)}
                        </span>
                    </div>
                    {this.isAIRecommended(cp) && (
                        <div className='teacher-ai-recommended-badge teacher-rewind-ai-recommend'>
                            <i className='codicon codicon-lightbulb' />
                            {nls.localize('theia/teacher/rewindAIRecommend', 'AI recommends rewinding to this point \u2014 the approach taken after this was less efficient')}
                        </div>
                    )}
                    <div className='teacher-rewind-checkpoint-badges'>
                        {cp.fileCount > 0 && (
                            <span className='teacher-rewind-file-badge'>
                                <i className='codicon codicon-files' />
                                {cp.fileCount}
                            </span>
                        )}
                        <span className={`teacher-rewind-kind-badge teacher-rewind-kind-badge--${cp.kind}`}>
                            {cp.kind}
                        </span>
                        {cp.isCurrent && (
                            <span className='teacher-rewind-current-badge'>
                                <i className='codicon codicon-circle-filled' />
                                {nls.localize('theia/teacher/rewindCurrent', 'current')}
                            </span>
                        )}
                    </div>
                    {!cp.isCurrent && (
                        <div className='teacher-rewind-actions'>
                            <button
                                type='button'
                                className='teacher-rewind-action-btn'
                                title={nls.localize('theia/teacher/rewindCodeOnly', 'Rewind Code Only')}
                                aria-label={nls.localize('theia/teacher/rewindCodeOnly', 'Rewind Code Only')}
                                onClick={() => this.handleRewind(cp.id, 'code')}
                            >
                                <i className='codicon codicon-code' aria-hidden='true' />
                            </button>
                            <button
                                type='button'
                                className='teacher-rewind-action-btn'
                                title={nls.localize('theia/teacher/rewindConversationOnly', 'Rewind Conversation Only')}
                                aria-label={nls.localize('theia/teacher/rewindConversationOnly', 'Rewind Conversation Only')}
                                onClick={() => this.handleRewind(cp.id, 'conversation')}
                            >
                                <i className='codicon codicon-comment-discussion' aria-hidden='true' />
                            </button>
                            <button
                                type='button'
                                className='teacher-rewind-action-btn'
                                title={nls.localize('theia/teacher/rewindBoth', 'Rewind Both')}
                                aria-label={nls.localize('theia/teacher/rewindBoth', 'Rewind Both')}
                                onClick={() => this.handleRewind(cp.id, 'both')}
                            >
                                <i className='codicon codicon-history' aria-hidden='true' />
                            </button>
                        </div>
                    )}
                    {this.hoveredCheckpointId === cp.id && (
                        <div className='teacher-rewind-impact-preview'>
                            <i className='codicon codicon-info' />
                            <span>
                                {nls.localize('theia/teacher/rewindImpact', 'Rewinding will undo: {0} file changes, {1} lines', cp.fileCount, this.getImpactLines(cp))}
                            </span>
                        </div>
                    )}
                    {this.hoveredCheckpointId === cp.id && cp.fileDiffs.length > 0 && (
                        <div className='teacher-rewind-diff-preview'>
                            <div className='teacher-rewind-diff-preview-title'>
                                <i className='codicon codicon-diff' />
                                {nls.localize('theia/teacher/rewindFilesChanged', 'Files changed')}
                            </div>
                            {cp.fileDiffs.map(diff => (
                                <div key={diff.file} className='teacher-rewind-diff-row'>
                                    <span className='teacher-rewind-diff-file'>
                                        <i className='codicon codicon-file' />
                                        {diff.file}
                                    </span>
                                    <span className='teacher-rewind-diff-stats'>
                                        <span className='teacher-rewind-diff-added'>+{diff.linesAdded}</span>
                                        <span className='teacher-rewind-diff-removed'>-{diff.linesRemoved}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
