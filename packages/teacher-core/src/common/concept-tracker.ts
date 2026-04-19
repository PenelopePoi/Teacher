/**
 * Service interface for tracking which programming concepts
 * a student has encountered, practiced, and mastered.
 */

/** Represents the learning state of a single concept. */
export type ConceptState = 'unseen' | 'seen' | 'practiced' | 'mastered';

/** A tracked concept with its current learning state. */
export interface TrackedConcept {
    /** Unique concept identifier (e.g., 'js-closures', 'react-hooks'). */
    id: string;
    /** Human-readable concept name. */
    name: string;
    /** Current learning state. */
    state: ConceptState;
    /** ISO 8601 timestamp of when the concept was first seen. */
    firstSeenAt?: string;
    /** ISO 8601 timestamp of when the concept was mastered. */
    masteredAt?: string;
    /** Number of times the student has practiced this concept. */
    practiceCount: number;
}

/** Symbol for dependency injection of the ConceptTrackerService. */
export const ConceptTrackerService = Symbol('ConceptTrackerService');

/**
 * Tracks which concepts the student has encountered and their mastery level.
 * Used by agents to avoid re-explaining known concepts and to surface gaps.
 */
export interface ConceptTrackerService {
    /** Mark a concept as seen (first encounter). */
    markSeen(concept: string): Promise<void>;
    /** Mark a concept as mastered. */
    markMastered(concept: string): Promise<void>;
    /** Returns the count of concepts the student has not yet encountered. */
    getUnseenCount(): Promise<number>;
    /**
     * Returns suggested concepts to learn next, based on prerequisites
     * and the student's current mastery.
     */
    getSuggested(): Promise<string[]>;
    /** Returns the full tracked concept record for a given concept ID. */
    getConcept(conceptId: string): Promise<TrackedConcept | undefined>;
    /** Returns all tracked concepts. */
    getAllConcepts(): Promise<TrackedConcept[]>;
}
