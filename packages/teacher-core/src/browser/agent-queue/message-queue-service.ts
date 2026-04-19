import { injectable } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';

/**
 * G6a — Queued Messages During Agent Run.
 *
 * Injectable singleton that holds messages the user wants to append
 * to the current agent's context without breaking the loop.
 * Queue lives in memory only — cleared on session end.
 */

export interface QueuedMessage {
    readonly id: string;
    readonly text: string;
    readonly timestamp: number;
}

@injectable()
export class MessageQueueService {

    protected readonly _onDidEnqueue = new Emitter<QueuedMessage>();
    readonly onDidEnqueue: Event<QueuedMessage> = this._onDidEnqueue.event;

    protected readonly _onDidChange = new Emitter<void>();
    readonly onDidChange: Event<void> = this._onDidChange.event;

    protected queue: QueuedMessage[] = [];
    protected nextId: number = 0;

    enqueue(message: string): QueuedMessage {
        const entry: QueuedMessage = {
            id: `mq-${++this.nextId}`,
            text: message,
            timestamp: Date.now(),
        };
        this.queue.push(entry);
        this._onDidEnqueue.fire(entry);
        this._onDidChange.fire();
        return entry;
    }

    dequeue(): QueuedMessage | undefined {
        const entry = this.queue.shift();
        if (entry) {
            this._onDidChange.fire();
        }
        return entry;
    }

    peek(): QueuedMessage | undefined {
        return this.queue.length > 0 ? this.queue[0] : undefined;
    }

    getAll(): QueuedMessage[] {
        return [...this.queue];
    }

    remove(id: string): boolean {
        const idx = this.queue.findIndex(m => m.id === id);
        if (idx >= 0) {
            this.queue.splice(idx, 1);
            this._onDidChange.fire();
            return true;
        }
        return false;
    }

    clear(): void {
        if (this.queue.length > 0) {
            this.queue = [];
            this._onDidChange.fire();
        }
    }

    getCount(): number {
        return this.queue.length;
    }
}
