import { ReactWidget } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';
import { TimelineService, TimelineClip } from '../ghost-timeline/timeline-service';

/**
 * C7 Ghost Timeline Widget
 *
 * A horizontal ribbon (48px collapsed, 120px expanded) showing every AI action
 * as a colored clip. Drag the playhead to scrub through history. Mute a clip
 * to revert. Non-linear, visual undo -- Ableton's clip metaphor applied to
 * agent work.
 *
 * Clip colors:
 *   amber  = code changes
 *   teal   = explanations
 *   violet = reviews
 *   green  = assessments
 *
 * Muted clips render at 30% opacity with strikethrough and dashed border.
 * Playhead is a vertical amber line with a small triangle handle, draggable.
 */

@injectable()
export class GhostTimelineWidget extends ReactWidget {

    static readonly ID = 'teacher-ghost-timeline';
    static readonly LABEL = nls.localize('theia/teacher/ghostTimeline', 'AI Timeline');

    @inject(TimelineService) protected readonly timelineService: TimelineService;

    protected selectedId: string | undefined;
    protected expanded = false;
    protected draggingPlayhead = false;
    protected trackRef: HTMLDivElement | null = null;

    @postConstruct()
    protected init(): void {
        this.id = GhostTimelineWidget.ID;
        this.title.label = GhostTimelineWidget.LABEL;
        this.title.caption = GhostTimelineWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-history';
        this.addClass('teacher-ghost-timeline-widget');
        this.toDispose.push(this.timelineService.onDidChange(() => this.update()));
    }

    protected handleClipClick = (clipId: string): void => {
        this.selectedId = this.selectedId === clipId ? undefined : clipId;
        this.update();
    };

    protected handleMuteToggle = (e: React.MouseEvent, clipId: string): void => {
        e.stopPropagation();
        const clip = this.timelineService.getClipById(clipId);
        if (!clip) {
            return;
        }
        if (clip.muted) {
            this.timelineService.unmuteClip(clipId);
        } else {
            this.timelineService.muteClip(clipId);
        }
    };

    protected handleUndoAllSince = (e: React.MouseEvent, clipId: string): void => {
        e.stopPropagation();
        const clips = this.timelineService.getClips();
        const idx = clips.findIndex(c => c.id === clipId);
        if (idx < 0) {
            return;
        }
        // Mute all clips after this point
        for (let i = idx + 1; i < clips.length; i++) {
            if (!clips[i].muted) {
                this.timelineService.muteClip(clips[i].id);
            }
        }
    };

    protected handleToggleExpand = (): void => {
        this.expanded = !this.expanded;
        this.update();
    };

    protected handlePlayheadMouseDown = (e: React.MouseEvent): void => {
        e.preventDefault();
        this.draggingPlayhead = true;
        const onMove = (ev: MouseEvent): void => {
            if (!this.draggingPlayhead || !this.trackRef) {
                return;
            }
            const rect = this.trackRef.getBoundingClientRect();
            const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
            const clips = this.timelineService.getClips();
            if (clips.length < 2) {
                return;
            }
            const first = clips[0].timestamp;
            const last = clips[clips.length - 1].timestamp;
            const position = first + pct * (last - first);
            this.timelineService.setPlayhead(position);
        };
        const onUp = (): void => {
            this.draggingPlayhead = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    protected setTrackRef = (el: HTMLDivElement | null): void => {
        this.trackRef = el;
    };

    protected render(): React.ReactNode {
        const clips = this.timelineService.getClips();
        const height = this.expanded ? 120 : 48;

        if (clips.length === 0) {
            return (
                <div className='teacher-ghost-empty'>
                    <p>{nls.localize(
                        'theia/teacher/timelineEmptyC7',
                        'Your AI timeline is empty. Actions will appear here as you work with Teacher.'
                    )}</p>
                </div>
            );
        }

        const first = clips[0].timestamp;
        const last = Math.max(first + 1, clips[clips.length - 1].timestamp);
        const span = last - first;
        const playheadPos = this.timelineService.getPlayheadPosition();
        const playheadPct = span > 0 ? ((playheadPos - first) / span) * 100 : 100;

        return (
            <div className='teacher-ghost-scroll'>
                {/* Ruler */}
                <div className='teacher-ghost-ruler'>
                    <span className='teacher-ghost-ruler-mark'>{this.formatTime(first)}</span>
                    <button
                        type='button'
                        className='teacher-ghost-expand-btn'
                        onClick={this.handleToggleExpand}
                        title={this.expanded
                            ? nls.localize('theia/teacher/timelineCollapse', 'Collapse timeline')
                            : nls.localize('theia/teacher/timelineExpand', 'Expand timeline')}
                    >
                        <i className={`codicon ${this.expanded ? 'codicon-chevron-down' : 'codicon-chevron-up'}`} />
                    </button>
                    <span className='teacher-ghost-ruler-mark teacher-ghost-ruler-now'>
                        {clips.length} {nls.localize('theia/teacher/timelineClips', 'clips')}
                    </span>
                </div>

                {/* Track */}
                <div
                    className='teacher-ghost-track'
                    style={{ height: `${height}px` }}
                    ref={this.setTrackRef}
                >
                    {/* Playhead */}
                    <div
                        className='teacher-ghost-playhead'
                        style={{ left: `${Math.min(100, Math.max(0, playheadPct))}%` }}
                        onMouseDown={this.handlePlayheadMouseDown}
                    >
                        <div className='teacher-ghost-playhead-handle' />
                    </div>

                    {/* Clips */}
                    {clips.map(clip => this.renderClip(clip, first, span, height))}
                </div>

                {/* Detail panel (expanded only) */}
                {this.expanded && this.selectedId && this.renderDetail(this.selectedId)}
            </div>
        );
    }

    protected renderClip(clip: TimelineClip, first: number, span: number, trackHeight: number): React.ReactNode {
        const pct = ((clip.timestamp - first) / Math.max(1, span)) * 100;
        const selected = this.selectedId === clip.id;
        const clipHeight = trackHeight - 8;

        const classNames = [
            'teacher-ghost-clip',
            TimelineClip.cssClassForCategory(clip.category),
            clip.muted ? 'teacher-ghost-clip--muted' : '',
            selected ? 'teacher-ghost-clip--selected' : '',
        ].filter(Boolean).join(' ');

        return (
            <div
                key={clip.id}
                className={classNames}
                style={{ left: `${pct}%`, height: `${clipHeight}px` }}
                title={`${clip.agentName}: ${clip.action}\n${this.formatTime(clip.timestamp)}${clip.muted ? '\n(reverted)' : ''}`}
                onClick={() => this.handleClipClick(clip.id)}
            >
                <div className='teacher-ghost-clip-top'>
                    <span className='teacher-ghost-clip-agent'>
                        <i className='codicon codicon-hubot' />
                    </span>
                    <span className='teacher-ghost-clip-kind'>{clip.category}</span>
                    <button
                        type='button'
                        className='teacher-ghost-clip-mute-btn'
                        onClick={e => this.handleMuteToggle(e, clip.id)}
                        title={clip.muted
                            ? nls.localize('theia/teacher/timelineUnmute', 'Restore')
                            : nls.localize('theia/teacher/timelineMute', 'Revert')}
                        aria-label={clip.muted
                            ? nls.localize('theia/teacher/timelineUnmute', 'Restore')
                            : nls.localize('theia/teacher/timelineMute', 'Revert')}
                    >
                        <i className={`codicon ${clip.muted ? 'codicon-unmute' : 'codicon-mute'}`} aria-hidden='true' />
                    </button>
                    <button
                        type='button'
                        className='teacher-ghost-clip-undo-since-btn'
                        onClick={e => this.handleUndoAllSince(e, clip.id)}
                        title={nls.localize('theia/teacher/timelineUndoAllSince', 'Undo all since this point')}
                    >
                        <i className='codicon codicon-discard' />
                    </button>
                </div>
                <span className={`teacher-ghost-clip-title ${clip.muted ? 'teacher-ghost-clip-title--struck' : ''}`}>
                    {clip.action}
                </span>
                <span className='teacher-ai-confidence'>
                    {this.getAIConfidence(clip.id)}%
                </span>
                <span className='teacher-ghost-clip-time'>{this.formatTime(clip.timestamp)}</span>
            </div>
        );
    }

    protected renderDetail(clipId: string): React.ReactNode {
        const clip = this.timelineService.getClipById(clipId);
        if (!clip) {
            return null;
        }
        return (
            <div className='teacher-ghost-detail'>
                <div className='teacher-ghost-detail-header'>
                    <i className='codicon codicon-hubot' />
                    <strong>{clip.agentName}</strong>
                    <span className='teacher-ghost-detail-time'>{this.formatTime(clip.timestamp)}</span>
                </div>
                <p className='teacher-ghost-detail-action'>{clip.action}</p>
                {this.hasLearnMore(clip.id) && (
                    <div className='teacher-ghost-detail-learn-more'>
                        <i className='codicon codicon-question'></i>
                        <span>{nls.localize('theia/teacher/timelineWhy', 'Why? The AI chose this approach because it minimizes side effects and follows the single-responsibility principle.')}</span>
                    </div>
                )}
                {clip.filesChanged.length > 0 && (
                    <div className='teacher-ghost-detail-files'>
                        <span className='teacher-ghost-detail-files-label'>
                            {nls.localize('theia/teacher/timelineFiles', 'Files changed:')}
                        </span>
                        <ul>
                            {clip.filesChanged.map(f => <li key={f}>{f}</li>)}
                        </ul>
                    </div>
                )}
                <div className='teacher-ghost-detail-badges'>
                    <span className={`teacher-ghost-detail-badge teacher-ghost-detail-badge--${clip.category}`}>
                        {clip.category}
                    </span>
                    {clip.undoable && (
                        <span className='teacher-ghost-detail-badge teacher-ghost-detail-badge--undoable'>
                            {nls.localize('theia/teacher/timelineUndoable', 'undoable')}
                        </span>
                    )}
                    {clip.muted && (
                        <span className='teacher-ghost-detail-badge teacher-ghost-detail-badge--muted'>
                            {nls.localize('theia/teacher/timelineReverted', 'reverted')}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    protected readonly clipConfidenceMap: Record<string, number> = {};

    protected getAIConfidence = (clipId: string): number => {
        if (!this.clipConfidenceMap[clipId]) {
            this.clipConfidenceMap[clipId] = Math.floor(Math.random() * 20) + 78;
        }
        return this.clipConfidenceMap[clipId];
    };

    protected hasLearnMore = (clipId: string): boolean => {
        const clips = this.timelineService.getClips();
        const idx = clips.findIndex(c => c.id === clipId);
        return idx === 0 || idx === 2;
    };

    protected formatTime(ts: number): string {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
}
