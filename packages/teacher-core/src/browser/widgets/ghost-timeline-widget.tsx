import { ReactWidget } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';
import { CanvasService } from '../canvas-service';
import { CanvasArtifact } from '../../common/canvas-protocol';

/**
 * §2 item #2 — Ghost Timeline.
 *
 * A horizontal ribbon across the bottom of the workspace showing every
 * AI-produced artifact as a colored clip, Ableton-session style.
 * Clips are color-coded by artifact kind. Click a clip to jump to it in
 * the Canvas panel (onSelect emits a request; CanvasService raises the
 * corresponding artifact to the top of the list by removing and
 * re-adding). Clips can be hidden from the session view without being
 * destroyed — "muted" in Ableton terms — via the mute toggle.
 *
 * Non-linear, visual, complementary to git: the Canvas is what got
 * produced; the Timeline is the order it was produced.
 */

@injectable()
export class GhostTimelineWidget extends ReactWidget {

    static readonly ID = 'teacher-ghost-timeline-widget';
    static readonly LABEL = nls.localize('theia/teacher/ghostTimeline', 'Ghost Timeline');

    @inject(CanvasService) protected readonly canvasService: CanvasService;

    protected mutedIds = new Set<string>();

    @postConstruct()
    protected init(): void {
        this.id = GhostTimelineWidget.ID;
        this.title.label = GhostTimelineWidget.LABEL;
        this.title.caption = GhostTimelineWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-pulse';
        this.addClass('teacher-ghost-timeline-widget');
        this.toDispose.push(this.canvasService.onDidChange(() => this.update()));
    }

    protected render(): React.ReactNode {
        const artifacts = [...this.canvasService.artifacts].reverse();  // oldest → newest, left → right

        if (artifacts.length === 0) {
            return (
                <div className="teacher-ghost-empty">
                    <p>Timeline is empty.</p>
                    <p className="teacher-ghost-empty-hint">
                        Every Canvas artifact appears here as a clip as it arrives. Click a clip to focus it; double-click to mute.
                    </p>
                </div>
            );
        }

        const first = artifacts[0].createdAt;
        const last = Math.max(first + 1, artifacts[artifacts.length - 1].createdAt);
        const span = last - first;

        return (
            <div className="teacher-ghost-scroll">
                <div className="teacher-ghost-ruler">
                    <span className="teacher-ghost-ruler-mark">{this.formatAbs(first)}</span>
                    <span className="teacher-ghost-ruler-mark teacher-ghost-ruler-now">
                        now · {artifacts.length} clips
                    </span>
                </div>
                <div className="teacher-ghost-track">
                    {artifacts.map(artifact => {
                        const pct = ((artifact.createdAt - first) / Math.max(1, span)) * 100;
                        const muted = this.mutedIds.has(artifact.id);
                        return (
                            <button
                                key={artifact.id}
                                type="button"
                                className={`teacher-ghost-clip ${muted ? 'teacher-ghost-clip--muted' : ''} teacher-ghost-clip--${artifact.kind}`}
                                style={{ left: `${pct}%` }}
                                title={`${artifact.title}\n${this.formatAbs(artifact.createdAt)}${muted ? '\n(muted)' : ''}`}
                                onClick={() => this.focus(artifact)}
                                onDoubleClick={() => this.toggleMute(artifact)}
                            >
                                <span className="teacher-ghost-clip-kind">{artifact.kind}</span>
                                <span className="teacher-ghost-clip-title">{artifact.title}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    protected focus(artifact: CanvasArtifact): void {
        /*
         * Simplest "jump" semantics: remove + re-add to push the clip to
         * the top of the Canvas artifact list. Doesn't destroy content —
         * the artifact's full shape is preserved.
         */
        this.canvasService.remove(artifact.id);
        this.canvasService.add({
            ...artifact,
            id: artifact.id,
        } as never);
    }

    protected toggleMute(artifact: CanvasArtifact): void {
        if (this.mutedIds.has(artifact.id)) {
            this.mutedIds.delete(artifact.id);
        } else {
            this.mutedIds.add(artifact.id);
        }
        this.update();
    }

    protected formatAbs(ts: number): string {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

}
