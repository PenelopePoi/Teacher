import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common';

/**
 * C7 Ghost Timeline — TimelineService
 *
 * Tracks every AI action as a "clip" in a horizontal timeline.
 * Ableton's clip metaphor applied to agent work: each clip is a colored
 * rectangle representing one discrete AI action. Muting a clip conceptually
 * reverts its changes (actual file revert is future work).
 *
 * Color coding by action category:
 *   amber  = code changes
 *   teal   = explanations
 *   violet = reviews
 *   green  = assessments
 */

export type ClipCategory = 'code' | 'explanation' | 'review' | 'assessment';

export interface TimelineClip {
    readonly id: string;
    readonly agentId: string;
    readonly agentName: string;
    readonly action: string;
    readonly timestamp: number;
    readonly filesChanged: string[];
    readonly undoable: boolean;
    readonly category: ClipCategory;
    readonly color: string;
    muted: boolean;
}

export namespace TimelineClip {
    export function colorForCategory(category: ClipCategory): string {
        switch (category) {
            case 'code': return 'var(--teacher-clip-amber, #E8A948)';
            case 'explanation': return 'var(--teacher-clip-teal, #2DD4BF)';
            case 'review': return 'var(--teacher-clip-violet, #A78BFA)';
            case 'assessment': return 'var(--teacher-clip-green, #4ADE80)';
        }
    }

    export function cssClassForCategory(category: ClipCategory): string {
        switch (category) {
            case 'code': return 'teacher-ghost-clip--amber';
            case 'explanation': return 'teacher-ghost-clip--teal';
            case 'review': return 'teacher-ghost-clip--violet';
            case 'assessment': return 'teacher-ghost-clip--green';
        }
    }
}

@injectable()
export class TimelineService {

    protected clips: TimelineClip[] = [];
    protected playheadPosition = 0;
    protected clipIdCounter = 0;

    protected readonly onDidChangeEmitter = new Emitter<void>();
    readonly onDidChange: Event<void> = this.onDidChangeEmitter.event;

    protected readonly onDidMuteClipEmitter = new Emitter<TimelineClip>();
    readonly onDidMuteClip: Event<TimelineClip> = this.onDidMuteClipEmitter.event;

    protected readonly onDidUnmuteClipEmitter = new Emitter<TimelineClip>();
    readonly onDidUnmuteClip: Event<TimelineClip> = this.onDidUnmuteClipEmitter.event;

    @postConstruct()
    protected init(): void {
        this.playheadPosition = Date.now();
    }

    addClip(params: {
        agentId: string;
        agentName: string;
        action: string;
        filesChanged?: string[];
        undoable?: boolean;
        category?: ClipCategory;
    }): TimelineClip {
        const category = params.category ?? 'code';
        const clip: TimelineClip = {
            id: `clip-${++this.clipIdCounter}-${Date.now()}`,
            agentId: params.agentId,
            agentName: params.agentName,
            action: params.action,
            timestamp: Date.now(),
            filesChanged: params.filesChanged ?? [],
            undoable: params.undoable ?? true,
            category,
            color: TimelineClip.colorForCategory(category),
            muted: false,
        };
        this.clips.push(clip);
        this.playheadPosition = clip.timestamp;
        this.onDidChangeEmitter.fire();
        return clip;
    }

    muteClip(id: string): boolean {
        const clip = this.clips.find(c => c.id === id);
        if (!clip || clip.muted) {
            return false;
        }
        clip.muted = true;
        this.onDidMuteClipEmitter.fire(clip);
        this.onDidChangeEmitter.fire();
        return true;
    }

    unmuteClip(id: string): boolean {
        const clip = this.clips.find(c => c.id === id);
        if (!clip || !clip.muted) {
            return false;
        }
        clip.muted = false;
        this.onDidUnmuteClipEmitter.fire(clip);
        this.onDidChangeEmitter.fire();
        return true;
    }

    getClips(): readonly TimelineClip[] {
        return this.clips;
    }

    getPlayheadPosition(): number {
        return this.playheadPosition;
    }

    setPlayhead(position: number): void {
        this.playheadPosition = position;
        this.onDidChangeEmitter.fire();
    }

    clearTimeline(): void {
        this.clips = [];
        this.playheadPosition = Date.now();
        this.onDidChangeEmitter.fire();
    }

    getClipById(id: string): TimelineClip | undefined {
        return this.clips.find(c => c.id === id);
    }

    getClipsByAgent(agentId: string): TimelineClip[] {
        return this.clips.filter(c => c.agentId === agentId);
    }

    getMutedClips(): TimelineClip[] {
        return this.clips.filter(c => c.muted);
    }
}
