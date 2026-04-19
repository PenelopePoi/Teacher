/**
 * C9 — Teachable Moment Service
 *
 * Injectable service that tracks which concepts the user has "got it" on.
 * Persists to localStorage. The single source of truth for the user's
 * personal curriculum — built through working, not through coursework.
 */

import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common';

const STORAGE_KEY = 'teacher.teachableMoments.dismissed';
const LIBRARY_KEY = 'teacher.teachableMoments.library';

export interface EncounteredConcept {
    readonly conceptId: string;
    readonly firstEncountered: number;
    readonly lastEncountered: number;
    encounterCount: number;
    dismissed: boolean;
}

@injectable()
export class TeachableMomentService {

    protected dismissed: Set<string> = new Set();
    protected library: Map<string, EncounteredConcept> = new Map();

    protected readonly onDidChangeEmitter = new Emitter<void>();
    readonly onDidChange: Event<void> = this.onDidChangeEmitter.event;

    @postConstruct()
    protected init(): void {
        this.loadDismissed();
        this.loadLibrary();
    }

    /**
     * Returns true if the user has dismissed this concept with "Got it".
     */
    isDismissed(conceptId: string): boolean {
        return this.dismissed.has(conceptId);
    }

    /**
     * Mark a concept as understood. It will no longer surface as a teachable moment.
     */
    dismiss(conceptId: string): void {
        this.dismissed.add(conceptId);
        this.saveDismissed();

        const entry = this.library.get(conceptId);
        if (entry) {
            entry.dismissed = true;
            this.saveLibrary();
        }

        this.onDidChangeEmitter.fire();
    }

    /**
     * Un-dismiss a concept so it can appear again (the "revisit" action).
     */
    undismiss(conceptId: string): void {
        this.dismissed.delete(conceptId);
        this.saveDismissed();

        const entry = this.library.get(conceptId);
        if (entry) {
            entry.dismissed = false;
            this.saveLibrary();
        }

        this.onDidChangeEmitter.fire();
    }

    /**
     * Record that the user encountered a concept (in an AI response, etc.).
     */
    recordEncounter(conceptId: string): void {
        const now = Date.now();
        const existing = this.library.get(conceptId);

        if (existing) {
            existing.encounterCount++;
            (existing as { lastEncountered: number }).lastEncountered = now;
        } else {
            this.library.set(conceptId, {
                conceptId,
                firstEncountered: now,
                lastEncountered: now,
                encounterCount: 1,
                dismissed: false,
            });
        }

        this.saveLibrary();
        this.onDidChangeEmitter.fire();
    }

    /**
     * How many concepts the user has dismissed (marked as understood).
     */
    getDismissedCount(): number {
        return this.dismissed.size;
    }

    /**
     * Get the full library of encountered concepts.
     */
    getLibrary(): ReadonlyMap<string, EncounteredConcept> {
        return this.library;
    }

    /**
     * Get all encountered concept IDs (dismissed or not).
     */
    getEncounteredIds(): string[] {
        return [...this.library.keys()];
    }

    /**
     * Get all dismissed concept IDs.
     */
    getDismissedIds(): string[] {
        return [...this.dismissed];
    }

    // ─── Persistence ───

    protected loadDismissed(): void {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    this.dismissed = new Set(parsed);
                }
            }
        } catch {
            this.dismissed = new Set();
        }
    }

    protected saveDismissed(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.dismissed]));
        } catch {
            /* localStorage may be disabled */
        }
    }

    protected loadLibrary(): void {
        try {
            const raw = localStorage.getItem(LIBRARY_KEY);
            if (raw) {
                const parsed: Record<string, EncounteredConcept> = JSON.parse(raw);
                this.library = new Map(Object.entries(parsed));
            }
        } catch {
            this.library = new Map();
        }
    }

    protected saveLibrary(): void {
        try {
            const obj: Record<string, EncounteredConcept> = {};
            for (const [k, v] of this.library) {
                obj[k] = v;
            }
            localStorage.setItem(LIBRARY_KEY, JSON.stringify(obj));
        } catch {
            /* localStorage may be disabled */
        }
    }
}
