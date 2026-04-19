import { ReactWidget } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';
import { CanvasService } from '../canvas-service';
import { CanvasArtifact } from '../../common/canvas-protocol';

/**
 * §2 item #2 — Ghost Timeline.
 *
 * An Ableton-style horizontal ribbon showing AI actions as colored clips.
 * Each clip represents one AI action with color coding by action type:
 *   blue = edit, green = create, amber = suggest, red = delete.
 * Includes a playhead, mute/revert toggles, and demo clips for testing.
 */

type ActionType = 'edit' | 'create' | 'suggest' | 'delete';

interface TimelineClip {
    readonly id: string;
    readonly label: string;
    readonly actionType: ActionType;
    readonly timestamp: number;
    readonly sizeWeight: number;  // 1-5, affects width
}

const DEMO_CLIPS: TimelineClip[] = [
    { id: 'dc1', label: 'Added login form', actionType: 'create', timestamp: Date.now() - 3600000, sizeWeight: 4 },
    { id: 'dc2', label: 'Fixed CSS alignment', actionType: 'edit', timestamp: Date.now() - 3200000, sizeWeight: 2 },
    { id: 'dc3', label: 'Refactored auth service', actionType: 'edit', timestamp: Date.now() - 2800000, sizeWeight: 5 },
    { id: 'dc4', label: 'Suggested error handling', actionType: 'suggest', timestamp: Date.now() - 2400000, sizeWeight: 3 },
    { id: 'dc5', label: 'Created user model', actionType: 'create', timestamp: Date.now() - 2000000, sizeWeight: 4 },
    { id: 'dc6', label: 'Removed legacy endpoint', actionType: 'delete', timestamp: Date.now() - 1600000, sizeWeight: 2 },
    { id: 'dc7', label: 'Updated validation logic', actionType: 'edit', timestamp: Date.now() - 1200000, sizeWeight: 3 },
    { id: 'dc8', label: 'Suggested test coverage', actionType: 'suggest', timestamp: Date.now() - 800000, sizeWeight: 3 },
    { id: 'dc9', label: 'Added dark mode styles', actionType: 'create', timestamp: Date.now() - 400000, sizeWeight: 4 },
    { id: 'dc10', label: 'Fixed race condition', actionType: 'edit', timestamp: Date.now() - 120000, sizeWeight: 2 },
];

@injectable()
export class GhostTimelineWidget extends ReactWidget {

    static readonly ID = 'teacher-ghost-timeline';
    static readonly LABEL = nls.localize('theia/teacher/ghostTimeline', 'AI Timeline');

    @inject(CanvasService) protected readonly canvasService: CanvasService;

    protected mutedIds = new Set<string>();
    protected selectedId: string | undefined;
    protected demoClips: TimelineClip[] = DEMO_CLIPS.map(c => ({ ...c }));

    @postConstruct()
    protected init(): void {
        this.id = GhostTimelineWidget.ID;
        this.title.label = GhostTimelineWidget.LABEL;
        this.title.caption = GhostTimelineWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-history';
        this.addClass('teacher-ghost-timeline-widget');
        this.toDispose.push(this.canvasService.onDidChange(() => this.update()));
    }

    protected handleClipClick = (clipId: string): void => {
        this.selectedId = this.selectedId === clipId ? undefined : clipId;
        this.update();
    };

    protected handleMuteClick = (e: React.MouseEvent, clipId: string): void => {
        e.stopPropagation();
        if (this.mutedIds.has(clipId)) {
            this.mutedIds.delete(clipId);
        } else {
            this.mutedIds.add(clipId);
        }
        this.update();
    };

    protected render(): React.ReactNode {
        const canvasArtifacts = [...this.canvasService.artifacts].reverse();
        const hasCanvasData = canvasArtifacts.length > 0;
        const clips = hasCanvasData ? this.artifactsToClips(canvasArtifacts) : this.demoClips;

        if (clips.length === 0) {
            return (
                <div className='teacher-ghost-empty'>
                    <p>{nls.localize('theia/teacher/timelineEmpty', 'Timeline is empty.')}</p>
                    <p className='teacher-ghost-empty-hint'>
                        {nls.localize('theia/teacher/timelineHint', 'AI actions appear here as colored clips. Click to inspect, mute to revert.')}
                    </p>
                </div>
            );
        }

        const first = clips[0].timestamp;
        const last = Math.max(first + 1, clips[clips.length - 1].timestamp);
        const span = last - first;

        return (
            <div className='teacher-ghost-scroll'>
                <div className='teacher-ghost-ruler'>
                    <span className='teacher-ghost-ruler-mark'>{this.formatAbs(first)}</span>
                    <span className='teacher-ghost-ruler-mark teacher-ghost-ruler-now'>
                        {nls.localize('theia/teacher/timelineNow', 'now')} · {clips.length} {nls.localize('theia/teacher/timelineClips', 'clips')}
                    </span>
                </div>
                <div className='teacher-ghost-track'>
                    {/* Playhead */}
                    <div className='teacher-ghost-playhead' />

                    {clips.map(clip => {
                        const pct = ((clip.timestamp - first) / Math.max(1, span)) * 100;
                        const muted = this.mutedIds.has(clip.id);
                        const selected = this.selectedId === clip.id;
                        const widthPx = 60 + (clip.sizeWeight * 20);

                        const classNames = [
                            'teacher-ghost-clip',
                            `teacher-ghost-clip--${clip.actionType}`,
                            muted ? 'teacher-ghost-clip--muted' : '',
                            selected ? 'teacher-ghost-clip--selected' : '',
                        ].filter(Boolean).join(' ');

                        return (
                            <div
                                key={clip.id}
                                className={classNames}
                                style={{ left: `${pct}%`, width: `${widthPx}px` }}
                                title={`${clip.label}\n${this.formatAbs(clip.timestamp)}${muted ? '\n(reverted)' : ''}`}
                                onClick={() => this.handleClipClick(clip.id)}
                            >
                                <div className='teacher-ghost-clip-top'>
                                    <span className='teacher-ghost-clip-kind'>{clip.actionType}</span>
                                    <button
                                        type='button'
                                        className='teacher-ghost-clip-mute-btn'
                                        onClick={(e) => this.handleMuteClick(e, clip.id)}
                                        title={muted
                                            ? nls.localize('theia/teacher/timelineUnmute', 'Restore')
                                            : nls.localize('theia/teacher/timelineMute', 'Revert')}
                                    >
                                        <i className={`codicon ${muted ? 'codicon-unmute' : 'codicon-mute'}`} />
                                    </button>
                                </div>
                                <span className='teacher-ghost-clip-title'>{clip.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    protected artifactsToClips(artifacts: CanvasArtifact[]): TimelineClip[] {
        return artifacts.map(a => ({
            id: a.id,
            label: a.title,
            actionType: this.kindToAction(a.kind),
            timestamp: a.createdAt,
            sizeWeight: 3,
        }));
    }

    protected kindToAction(kind: string): ActionType {
        switch (kind) {
            case 'code': return 'edit';
            case 'markdown': return 'create';
            case 'table': return 'suggest';
            case 'chart': return 'suggest';
            default: return 'create';
        }
    }

    protected formatAbs(ts: number): string {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
}
