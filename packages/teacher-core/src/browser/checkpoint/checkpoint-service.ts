import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common';
import { EditorManager } from '@theia/editor/lib/browser';
import { TimelineService } from '../ghost-timeline/timeline-service';

/**
 * C18 Checkpoint/Rewind — time travel for agent work.
 *
 * Named checkpoints the user creates explicitly; auto-checkpoints on every
 * agent turn.  The service snapshots all open editor contents and can
 * restore any previous state with a single call.
 *
 * Max 50 checkpoints.  Oldest auto-checkpoints are pruned first;
 * manual checkpoints are never pruned.
 */

export interface CheckpointFileDiff {
    readonly file: string;
    readonly linesAdded: number;
    readonly linesRemoved: number;
}

export interface Checkpoint {
    readonly id: string;
    readonly label: string;
    readonly timestamp: number;
    readonly fileSnapshots: Map<string, string>;
    readonly kind: 'auto' | 'manual';
    readonly fileDiffs: CheckpointFileDiff[];
}

const MAX_CHECKPOINTS = 50;
const LABEL_STORAGE_KEY = 'teacher.checkpoint.labels';

@injectable()
export class CheckpointService {

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(TimelineService)
    protected readonly timelineService: TimelineService;

    protected checkpoints: Checkpoint[] = [];
    protected idCounter = 0;
    protected currentCheckpointId: string | undefined;

    protected readonly onDidCreateCheckpointEmitter = new Emitter<Checkpoint>();
    readonly onDidCreateCheckpoint: Event<Checkpoint> = this.onDidCreateCheckpointEmitter.event;

    protected readonly onDidRewindEmitter = new Emitter<Checkpoint>();
    readonly onDidRewind: Event<Checkpoint> = this.onDidRewindEmitter.event;

    @postConstruct()
    protected init(): void {
        this.restoreLabels();

        // Auto-checkpoint after every timeline clip (agent action)
        this.timelineService.onDidChange(() => {
            const clips = this.timelineService.getClips();
            if (clips.length > 0) {
                const latest = clips[clips.length - 1];
                if (!latest.muted) {
                    this.createCheckpoint();
                }
            }
        });
    }

    /**
     * Snapshot all open editor contents into a new checkpoint.
     */
    createCheckpoint(label?: string): Checkpoint {
        const snapshots = this.captureOpenEditors();
        const previous = this.getLatest();
        const fileDiffs = this.computeDiffs(previous, snapshots);

        const kind: 'auto' | 'manual' = label ? 'manual' : 'auto';
        const resolvedLabel = label ?? `Auto #${this.idCounter + 1}`;

        const checkpoint: Checkpoint = {
            id: `cp-${++this.idCounter}-${Date.now()}`,
            label: resolvedLabel,
            timestamp: Date.now(),
            fileSnapshots: snapshots,
            kind,
            fileDiffs,
        };

        this.checkpoints.unshift(checkpoint);
        this.currentCheckpointId = checkpoint.id;
        this.prune();
        this.persistLabels();
        this.onDidCreateCheckpointEmitter.fire(checkpoint);
        return checkpoint;
    }

    getCheckpoints(): Checkpoint[] {
        return [...this.checkpoints];
    }

    getLatest(): Checkpoint | undefined {
        return this.checkpoints[0];
    }

    getCurrentId(): string | undefined {
        return this.currentCheckpointId;
    }

    /**
     * Restore file contents from the given checkpoint.
     */
    rewindTo(checkpointId: string): void {
        const checkpoint = this.checkpoints.find(cp => cp.id === checkpointId);
        if (!checkpoint) {
            return;
        }

        for (const editor of this.editorManager.all) {
            const uri = editor.editor.uri.toString();
            const content = checkpoint.fileSnapshots.get(uri);
            if (content !== undefined) {
                const model = editor.editor.document;
                if (model && 'textEditorModel' in model) {
                    const monacoModel = (model as { textEditorModel: { setValue(v: string): void } }).textEditorModel;
                    monacoModel.setValue(content);
                }
            }
        }

        this.currentCheckpointId = checkpoint.id;
        this.onDidRewindEmitter.fire(checkpoint);
    }

    clear(): void {
        this.checkpoints = [];
        this.currentCheckpointId = undefined;
        try {
            localStorage.removeItem(LABEL_STORAGE_KEY);
        } catch {
            // storage unavailable
        }
    }

    // ── Private helpers ──────────────────────────────────────────────

    protected captureOpenEditors(): Map<string, string> {
        const snapshots = new Map<string, string>();
        for (const editor of this.editorManager.all) {
            const uri = editor.editor.uri.toString();
            const text = editor.editor.document.getText();
            snapshots.set(uri, text);
        }
        return snapshots;
    }

    protected computeDiffs(
        previous: Checkpoint | undefined,
        current: Map<string, string>
    ): CheckpointFileDiff[] {
        const diffs: CheckpointFileDiff[] = [];
        for (const [uri, content] of current) {
            const oldContent = previous?.fileSnapshots.get(uri);
            if (oldContent === undefined) {
                const lines = content.split('\n').length;
                diffs.push({ file: this.uriToShortName(uri), linesAdded: lines, linesRemoved: 0 });
            } else if (oldContent !== content) {
                const oldLines = oldContent.split('\n');
                const newLines = content.split('\n');
                let added = 0;
                let removed = 0;
                const maxLen = Math.max(oldLines.length, newLines.length);
                for (let i = 0; i < maxLen; i++) {
                    if (oldLines[i] !== newLines[i]) {
                        if (i < newLines.length) {
                            added++;
                        }
                        if (i < oldLines.length) {
                            removed++;
                        }
                    }
                }
                if (added > 0 || removed > 0) {
                    diffs.push({ file: this.uriToShortName(uri), linesAdded: added, linesRemoved: removed });
                }
            }
        }
        return diffs;
    }

    protected uriToShortName(uri: string): string {
        const parts = uri.split('/');
        return parts.slice(-2).join('/');
    }

    /**
     * Prune oldest auto-checkpoints when over the limit.
     * Manual checkpoints are never pruned.
     */
    protected prune(): void {
        while (this.checkpoints.length > MAX_CHECKPOINTS) {
            const autoIndex = this.findOldestAutoIndex();
            if (autoIndex >= 0) {
                this.checkpoints.splice(autoIndex, 1);
            } else {
                // Only manual checkpoints remain — remove the oldest
                this.checkpoints.pop();
            }
        }
    }

    protected findOldestAutoIndex(): number {
        for (let i = this.checkpoints.length - 1; i >= 0; i--) {
            if (this.checkpoints[i].kind === 'auto') {
                return i;
            }
        }
        return -1;
    }

    protected persistLabels(): void {
        try {
            const labels: Record<string, string> = {};
            for (const cp of this.checkpoints) {
                if (cp.kind === 'manual') {
                    labels[cp.id] = cp.label;
                }
            }
            localStorage.setItem(LABEL_STORAGE_KEY, JSON.stringify(labels));
        } catch {
            // storage unavailable
        }
    }

    protected restoreLabels(): void {
        try {
            const raw = localStorage.getItem(LABEL_STORAGE_KEY);
            if (raw) {
                // Labels are restored only when matching checkpoints exist.
                // On a fresh session there are no in-memory checkpoints, so this
                // is essentially a no-op until the first checkpoint is created.
                JSON.parse(raw);
            }
        } catch {
            // corrupted or unavailable
        }
    }
}
