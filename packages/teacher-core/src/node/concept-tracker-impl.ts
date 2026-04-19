import { injectable } from '@theia/core/shared/inversify';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Service path for the ConceptTracker backend.
 */
export const CONCEPT_TRACKER_PATH = '/services/concept-tracker';

/**
 * Symbol for dependency injection of the ConceptTracker.
 */
export const ConceptTrackerSymbol = Symbol('ConceptTracker');

/**
 * A single tracked concept with timestamps for first-seen and mastered dates.
 */
export interface TrackedConcept {
    /** The concept identifier (e.g., "variables", "async-await", "closures"). */
    id: string;
    /** Human-readable label for the concept. */
    label: string;
    /** ISO 8601 timestamp of when this concept was first encountered. */
    firstSeen: string;
    /** ISO 8601 timestamp of when this concept was marked as mastered. Undefined if not yet mastered. */
    masteredAt?: string;
    /** Number of times the student has practiced or revisited this concept. */
    encounters: number;
}

/**
 * RPC interface for the ConceptTracker.
 */
export interface ConceptTracker {
    /** Record that a concept was seen. Creates entry if new, increments encounters if existing. */
    recordConceptSeen(id: string, label: string): Promise<TrackedConcept>;
    /** Mark a concept as mastered with a timestamp. */
    markMastered(id: string): Promise<TrackedConcept | undefined>;
    /** Return all tracked concepts. */
    getAllConcepts(): Promise<TrackedConcept[]>;
    /** Return a single concept by id. */
    getConcept(id: string): Promise<TrackedConcept | undefined>;
    /** Return only mastered concepts. */
    getMasteredConcepts(): Promise<TrackedConcept[]>;
    /** Return concepts that have been seen but not yet mastered. */
    getUnmasteredConcepts(): Promise<TrackedConcept[]>;
}

/**
 * Implements concept tracking by storing data in ~/.teacher/concepts.json.
 * Tracks which concepts the student has seen and which are mastered,
 * with timestamps for both events.
 */
@injectable()
export class ConceptTrackerImpl implements ConceptTracker {

    protected readonly teacherDir: string = path.join(
        process.env.HOME || '~', '.teacher'
    );

    protected readonly conceptsPath: string = path.join(
        this.teacherDir, 'concepts.json'
    );

    async recordConceptSeen(id: string, label: string): Promise<TrackedConcept> {
        const concepts = this.loadConcepts();
        const existing = concepts.find(c => c.id === id);
        if (existing) {
            existing.encounters++;
            this.saveConcepts(concepts);
            return existing;
        }
        const newConcept: TrackedConcept = {
            id,
            label,
            firstSeen: new Date().toISOString(),
            encounters: 1,
        };
        concepts.push(newConcept);
        this.saveConcepts(concepts);
        return newConcept;
    }

    async markMastered(id: string): Promise<TrackedConcept | undefined> {
        const concepts = this.loadConcepts();
        const concept = concepts.find(c => c.id === id);
        if (!concept) {
            return undefined;
        }
        concept.masteredAt = new Date().toISOString();
        this.saveConcepts(concepts);
        return concept;
    }

    async getAllConcepts(): Promise<TrackedConcept[]> {
        return this.loadConcepts();
    }

    async getConcept(id: string): Promise<TrackedConcept | undefined> {
        const concepts = this.loadConcepts();
        return concepts.find(c => c.id === id);
    }

    async getMasteredConcepts(): Promise<TrackedConcept[]> {
        const concepts = this.loadConcepts();
        return concepts.filter(c => c.masteredAt !== undefined);
    }

    async getUnmasteredConcepts(): Promise<TrackedConcept[]> {
        const concepts = this.loadConcepts();
        return concepts.filter(c => c.masteredAt === undefined);
    }

    protected loadConcepts(): TrackedConcept[] {
        this.ensureDirectory();
        try {
            if (fs.existsSync(this.conceptsPath)) {
                const raw = fs.readFileSync(this.conceptsPath, 'utf-8');
                return JSON.parse(raw) as TrackedConcept[];
            }
        } catch (err) {
            console.warn('[ConceptTracker] Could not read concepts file:', err);
        }
        return [];
    }

    protected saveConcepts(concepts: TrackedConcept[]): void {
        this.ensureDirectory();
        try {
            fs.writeFileSync(this.conceptsPath, JSON.stringify(concepts, undefined, 2), 'utf-8');
        } catch (err) {
            console.error('[ConceptTracker] Could not save concepts file:', err);
        }
    }

    protected ensureDirectory(): void {
        if (!fs.existsSync(this.teacherDir)) {
            fs.mkdirSync(this.teacherDir, { recursive: true });
        }
    }
}
