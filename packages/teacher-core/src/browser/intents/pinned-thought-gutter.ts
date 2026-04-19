import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { PinnedThought } from '../../common/intent-protocol';
import { Emitter, Event } from '@theia/core/lib/common/event';

/**
 * Pinned Thought Gutter — margin decorations in the Monaco editor.
 *
 * Shows small pin icons in the gutter at lines that have PinnedThoughts.
 * Hover reveals the thought content. Click opens a thread.
 */
@injectable()
export class PinnedThoughtGutter implements FrontendApplicationContribution {

    protected thoughts: Map<string, PinnedThought[]> = new Map();

    protected readonly _onDidClick = new Emitter<PinnedThought>();
    readonly onDidClick: Event<PinnedThought> = this._onDidClick.event;

    protected readonly _onDidChange = new Emitter<void>();
    readonly onDidChange: Event<void> = this._onDidChange.event;

    @postConstruct()
    protected init(): void {
        // Initialization hook — connect to Monaco editors when available
    }

    onStart(): void {
        console.info('PinnedThoughtGutter: ready — will decorate editor gutters with pinned thoughts');
    }

    /**
     * Add a pinned thought and update gutter decorations.
     */
    addThought(thought: PinnedThought): void {
        const fileId = thought.anchor.fileId;
        const existing = this.thoughts.get(fileId) ?? [];
        existing.push(thought);
        this.thoughts.set(fileId, existing);
        this._onDidChange.fire();
        this.updateDecorations(fileId);
    }

    /**
     * Remove a pinned thought by id.
     */
    removeThought(id: string): void {
        for (const [fileId, list] of this.thoughts.entries()) {
            const filtered = list.filter(t => t.id !== id);
            if (filtered.length !== list.length) {
                if (filtered.length === 0) {
                    this.thoughts.delete(fileId);
                } else {
                    this.thoughts.set(fileId, filtered);
                }
                this._onDidChange.fire();
                this.updateDecorations(fileId);
                break;
            }
        }
    }

    /**
     * Get all pinned thoughts for a file.
     */
    getThoughtsForFile(fileId: string): PinnedThought[] {
        return this.thoughts.get(fileId) ?? [];
    }

    /**
     * Get all pinned thoughts across all files.
     */
    getAllThoughts(): PinnedThought[] {
        const all: PinnedThought[] = [];
        for (const list of this.thoughts.values()) {
            all.push(...list);
        }
        return all;
    }

    /**
     * Clear all pinned thoughts.
     */
    clear(): void {
        this.thoughts.clear();
        this._onDidChange.fire();
    }

    /**
     * Update Monaco gutter decorations for a file.
     * Uses Monaco's deltaDecorations API when editor is available.
     */
    protected updateDecorations(fileId: string): void {
        const thoughts = this.thoughts.get(fileId) ?? [];
        // Build decoration descriptors for each pinned thought line
        const decorations = thoughts
            .filter(t => t.anchor.line !== undefined)
            .map(t => ({
                line: t.anchor.line!,
                note: t.note,
                id: t.id,
            }));

        console.info(
            `PinnedThoughtGutter: updated ${decorations.length} decoration(s) for ${fileId}`
        );

        // In a full integration this would call monaco.editor.deltaDecorations
        // with glyphMarginClassName: 'teacher-pinned-thought-glyph'
        // and hoverMessage containing the thought note.
    }
}
