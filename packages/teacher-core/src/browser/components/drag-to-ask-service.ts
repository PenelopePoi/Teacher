import { injectable } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';

/**
 * C8 Drag-to-Ask Service — injectable singleton that holds the current
 * "subject" (a code selection the user wants to ask about).
 *
 * Any component can call `setSubject()` to stage a selection. The next
 * AI chat message will be prepended with context:
 *   "[Selected from {source}]: {text}"
 *
 * Direct manipulation replaces @-mentions.
 */

export interface DragToAskSubject {
    readonly text: string;
    readonly source: string;
}

@injectable()
export class DragToAskService {

    protected readonly onDidChangeSubjectEmitter = new Emitter<DragToAskSubject | undefined>();
    readonly onDidChangeSubject: Event<DragToAskSubject | undefined> = this.onDidChangeSubjectEmitter.event;

    protected subject: DragToAskSubject | undefined;

    setSubject(text: string, source: string): void {
        this.subject = { text, source };
        this.onDidChangeSubjectEmitter.fire(this.subject);
    }

    getSubject(): DragToAskSubject | undefined {
        return this.subject;
    }

    hasSubject(): boolean {
        return this.subject !== undefined;
    }

    clearSubject(): void {
        this.subject = undefined;
        this.onDidChangeSubjectEmitter.fire(undefined);
    }

    /**
     * Formats the subject as context to prepend to a chat message.
     * Returns empty string if no subject is set.
     */
    formatContext(): string {
        if (!this.subject) {
            return '';
        }
        return `[Selected from ${this.subject.source}]: ${this.subject.text}`;
    }
}
