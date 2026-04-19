import { injectable } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { CanvasArtifact, CanvasArtifactInput } from '../common/canvas-protocol';

export interface CanvasChangeEvent {
    readonly artifacts: ReadonlyArray<CanvasArtifact>;
}

@injectable()
export class CanvasService {

    protected readonly _onDidChange = new Emitter<CanvasChangeEvent>();
    readonly onDidChange: Event<CanvasChangeEvent> = this._onDidChange.event;

    protected readonly _artifacts: CanvasArtifact[] = [];

    get artifacts(): ReadonlyArray<CanvasArtifact> {
        return this._artifacts;
    }

    add(input: CanvasArtifactInput): CanvasArtifact {
        const artifact = {
            ...input,
            id: input.id ?? this.generateId(),
            createdAt: Date.now(),
        } as CanvasArtifact;
        this._artifacts.unshift(artifact);
        this.fire();
        return artifact;
    }

    remove(id: string): boolean {
        const idx = this._artifacts.findIndex(a => a.id === id);
        if (idx === -1) {
            return false;
        }
        this._artifacts.splice(idx, 1);
        this.fire();
        return true;
    }

    clear(): void {
        if (this._artifacts.length === 0) {
            return;
        }
        this._artifacts.length = 0;
        this.fire();
    }

    protected generateId(): string {
        return `canvas-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    protected fire(): void {
        this._onDidChange.fire({ artifacts: [...this._artifacts] });
    }
}
