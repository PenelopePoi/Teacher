import { ReactWidget } from '@theia/core/lib/browser';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';

/**
 * Rewind Panel — visual checkpoint management with code/conversation split.
 *
 * Vertical timeline of checkpoints with three rewind modes:
 * code only, conversation only, or both.
 */

interface Checkpoint {
    readonly id: string;
    readonly label: string;
    readonly timestamp: number;
    readonly fileCount: number;
    readonly kind: 'auto' | 'manual';
    readonly isCurrent: boolean;
}

@injectable()
export class RewindPanelWidget extends ReactWidget {

    static readonly ID = 'teacher-rewind-panel';
    static readonly LABEL = nls.localize('theia/teacher/rewindPanel', 'Checkpoints');

    protected checkpoints: Checkpoint[] = [];
    protected newCheckpointName: string = '';

    @postConstruct()
    protected init(): void {
        this.id = RewindPanelWidget.ID;
        this.title.label = RewindPanelWidget.LABEL;
        this.title.caption = RewindPanelWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-discard';
        this.addClass('teacher-rewind-panel');

        this.loadDemoData();
    }

    protected loadDemoData(): void {
        const now = Date.now();
        this.checkpoints = [
            { id: 'cp-1', label: 'Current state', timestamp: now, fileCount: 0, kind: 'auto', isCurrent: true },
            { id: 'cp-2', label: 'Before auth refactor', timestamp: now - 2 * 60000, fileCount: 4, kind: 'manual', isCurrent: false },
            { id: 'cp-3', label: 'Login form working', timestamp: now - 8 * 60000, fileCount: 2, kind: 'auto', isCurrent: false },
            { id: 'cp-4', label: 'Initial scaffold', timestamp: now - 15 * 60000, fileCount: 7, kind: 'auto', isCurrent: false },
            { id: 'cp-5', label: 'Session start', timestamp: now - 22 * 60000, fileCount: 0, kind: 'auto', isCurrent: false },
        ];
    }

    protected handleCreateCheckpoint = (): void => {
        const label = this.newCheckpointName.trim() || nls.localize('theia/teacher/rewindManualCheckpoint', 'Manual checkpoint');
        const cp: Checkpoint = {
            id: `cp-${Date.now()}`,
            label,
            timestamp: Date.now(),
            fileCount: 0,
            kind: 'manual',
            isCurrent: false,
        };
        this.checkpoints.splice(1, 0, cp);
        this.newCheckpointName = '';
        this.update();
    };

    protected handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.newCheckpointName = e.target.value;
        this.update();
    };

    protected handleRewind = (checkpointId: string, mode: 'code' | 'conversation' | 'both'): void => {
        console.info(`Rewind ${mode} to checkpoint ${checkpointId}`);
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
                <div className='teacher-rewind-timeline'>
                    {this.checkpoints.map(cp => this.renderCheckpoint(cp))}
                </div>
            </div>
        );
    }

    protected renderCheckpoint(cp: Checkpoint): React.ReactNode {
        return (
            <div
                key={cp.id}
                className={`teacher-rewind-checkpoint ${cp.isCurrent ? 'teacher-rewind-checkpoint--current' : ''}`}
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
                    </div>
                    {!cp.isCurrent && (
                        <div className='teacher-rewind-actions'>
                            <button
                                type='button'
                                className='teacher-rewind-action-btn'
                                title={nls.localize('theia/teacher/rewindCodeOnly', 'Rewind Code Only')}
                                onClick={() => this.handleRewind(cp.id, 'code')}
                            >
                                <i className='codicon codicon-code' />
                            </button>
                            <button
                                type='button'
                                className='teacher-rewind-action-btn'
                                title={nls.localize('theia/teacher/rewindConversationOnly', 'Rewind Conversation Only')}
                                onClick={() => this.handleRewind(cp.id, 'conversation')}
                            >
                                <i className='codicon codicon-comment-discussion' />
                            </button>
                            <button
                                type='button'
                                className='teacher-rewind-action-btn'
                                title={nls.localize('theia/teacher/rewindBoth', 'Rewind Both')}
                                onClick={() => this.handleRewind(cp.id, 'both')}
                            >
                                <i className='codicon codicon-history' />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
