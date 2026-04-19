import { ReactWidget } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';
import { BeforeAfterService, DiffMetadata } from './before-after-service';

/**
 * Before/After Canvas (C6) — the review surface for creatives who cannot read diffs.
 *
 * Split view: left = current state, right = proposed state.
 * A draggable slider wipes between them via CSS clip-path.
 * Header shows agent name, action, timestamp.
 * Footer: Accept (amber), Reject (subtle), Edit (opens in editor).
 */
@injectable()
export class BeforeAfterWidget extends ReactWidget {

    static readonly ID = 'teacher-before-after';
    static readonly LABEL = nls.localize('theia/teacher/beforeAfter', 'Before / After Canvas');

    @inject(BeforeAfterService)
    protected readonly service: BeforeAfterService;

    protected splitPercent: number = 50;
    protected isDragging: boolean = false;

    @postConstruct()
    protected init(): void {
        this.id = BeforeAfterWidget.ID;
        this.title.label = BeforeAfterWidget.LABEL;
        this.title.caption = BeforeAfterWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-split-horizontal';
        this.addClass('teacher-before-after');

        this.service.onDidChange(() => this.update());

        this.node.tabIndex = 0;
        this.node.addEventListener('keydown', this.handleKeyDown);
    }

    protected handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.service.accept();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            this.service.reject();
        } else if (e.key === 'e' || e.key === 'E') {
            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                this.service.edit();
            }
        }
    };

    protected handleAccept = (): void => {
        this.service.accept();
    };

    protected handleReject = (): void => {
        this.service.reject();
    };

    protected handleEdit = (): void => {
        this.service.edit();
    };

    protected handleMouseDown = (e: React.MouseEvent): void => {
        e.preventDefault();
        this.isDragging = true;
        const onMouseMove = (ev: MouseEvent): void => {
            if (!this.isDragging) {
                return;
            }
            const container = this.node.querySelector('.teacher-ba-panels') as HTMLElement;
            if (container) {
                const rect = container.getBoundingClientRect();
                const pct = Math.max(10, Math.min(90, ((ev.clientX - rect.left) / rect.width) * 100));
                this.splitPercent = pct;
                this.update();
            }
        };
        const onMouseUp = (): void => {
            this.isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    protected render(): React.ReactNode {
        const state = this.service.currentState;
        if (!state) {
            return this.renderEmpty();
        }
        return (
            <div className='teacher-ba-container'>
                {this.renderHeader(state.metadata)}
                <div className='teacher-ba-panels'>
                    <div
                        className='teacher-ba-panel teacher-ba-panel--before'
                        style={{ width: `${this.splitPercent}%` }}
                    >
                        <div className='teacher-ba-panel-label'>
                            {nls.localize('theia/teacher/baBefore', 'Before')}
                        </div>
                        <pre className='teacher-ba-code'>{this.renderDiffLines(state.before, 'before')}</pre>
                    </div>
                    <div
                        className='teacher-ba-slider'
                        onMouseDown={this.handleMouseDown}
                    >
                        <div className='teacher-ba-slider-handle' />
                    </div>
                    <div
                        className='teacher-ba-panel teacher-ba-panel--after'
                        style={{ width: `${100 - this.splitPercent}%` }}
                    >
                        <div className='teacher-ba-panel-label'>
                            {nls.localize('theia/teacher/baAfter', 'After')}
                        </div>
                        <pre className='teacher-ba-code'>{this.renderDiffLines(state.after, 'after')}</pre>
                    </div>
                </div>
                {this.renderFooter(state.metadata)}
            </div>
        );
    }

    protected renderEmpty(): React.ReactNode {
        return (
            <div className='teacher-ba-empty'>
                <i className='codicon codicon-git-compare' />
                <p>{nls.localize('theia/teacher/baEmpty', 'No pending changes to review.')}</p>
                <span className='teacher-ba-empty-hint'>
                    {nls.localize('theia/teacher/baEmptyHint', 'When an agent proposes a change, it will appear here as a visual diff.')}
                </span>
            </div>
        );
    }

    protected renderDiffLines(content: string, side: 'before' | 'after'): React.ReactNode {
        const lines = content.split('\n');
        return lines.map((line, i) => {
            let className = 'teacher-ba-line';
            if (side === 'before' && line.startsWith('-')) {
                className += ' teacher-ba-line--removed';
            } else if (side === 'after' && line.startsWith('+')) {
                className += ' teacher-ba-line--added';
            }
            return <div key={i} className={className}>{line}</div>;
        });
    }

    protected renderHeader(meta: DiffMetadata): React.ReactNode {
        const time = new Date(meta.timestamp).toLocaleTimeString();
        return (
            <div className='teacher-ba-header'>
                <span className='teacher-ba-header-agent'>
                    <i className='codicon codicon-hubot' />
                    {meta.agentName}
                </span>
                <span className='teacher-ba-header-action'>{meta.action}</span>
                <span className='teacher-ba-header-files'>
                    {meta.filesChanged.length} {meta.filesChanged.length === 1 ? 'file' : 'files'}
                </span>
                <span className='teacher-ba-header-time'>{time}</span>
            </div>
        );
    }

    protected renderFooter(_meta: DiffMetadata): React.ReactNode {
        return (
            <div className='teacher-ba-footer'>
                <button
                    type='button'
                    className='teacher-ba-btn teacher-ba-btn--accept'
                    onClick={this.handleAccept}
                >
                    <i className='codicon codicon-check' />
                    {nls.localize('theia/teacher/baAccept', 'Accept')}
                </button>
                <button
                    type='button'
                    className='teacher-ba-btn teacher-ba-btn--reject'
                    onClick={this.handleReject}
                >
                    <i className='codicon codicon-close' />
                    {nls.localize('theia/teacher/baReject', 'Reject')}
                </button>
                <button
                    type='button'
                    className='teacher-ba-btn teacher-ba-btn--edit'
                    onClick={this.handleEdit}
                >
                    <i className='codicon codicon-edit' />
                    {nls.localize('theia/teacher/baEdit', 'Edit')}
                </button>
                <span className='teacher-ba-footer-hint'>
                    Enter = accept &middot; Esc = reject &middot; E = edit
                </span>
            </div>
        );
    }
}
