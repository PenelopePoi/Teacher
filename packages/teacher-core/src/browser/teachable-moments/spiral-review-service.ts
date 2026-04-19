/**
 * H3 -- Spiral Review Service
 *
 * Concepts the user learned long ago resurface as soft reminders
 * if the user hasn't touched them recently and is about to work
 * on something adjacent. Non-coercive spaced repetition.
 *
 * "You learned this six months ago -- want a refresher?"
 */

import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common';
import { TeachableMomentService } from './teachable-moment-service';
import { CONCEPT_LIBRARY, ConceptDefinition } from './concept-library';

const REVIEW_TIMESTAMPS_KEY = 'teacher.spiralReview.lastReviewed';
const SHOWN_SUGGESTIONS_KEY = 'teacher.spiralReview.shownThisSession';
const REVIEW_COOLDOWN_DAYS = 7;
const MAX_SUGGESTIONS_PER_SESSION = 2;

@injectable()
export class SpiralReviewService {

    @inject(TeachableMomentService)
    protected readonly teachableService: TeachableMomentService;

    protected lastReviewedMap: Map<string, number> = new Map();
    protected shownThisSession: Set<string> = new Set();
    protected suggestionsShownCount: number = 0;

    protected readonly onDidChangeSuggestionsEmitter = new Emitter<void>();
    readonly onDidChangeSuggestions: Event<void> = this.onDidChangeSuggestionsEmitter.event;

    @postConstruct()
    protected init(): void {
        this.loadLastReviewed();
        this.loadShownSuggestions();
    }

    /**
     * Whether we should even attempt to suggest a review right now.
     * Returns false if the session cap has been reached.
     */
    shouldSuggestReview(): boolean {
        return this.suggestionsShownCount < MAX_SUGGESTIONS_PER_SESSION;
    }

    /**
     * Get review suggestions relevant to the current context (language, lesson topic).
     * Returns max 2 suggestions per session that:
     *   1. Were dismissed ("got it") more than 7 days ago
     *   2. Are related to the current context by category or keyword overlap
     */
    getReviewSuggestions(currentContext: string): ConceptDefinition[] {
        if (!this.shouldSuggestReview()) {
            return [];
        }

        const now = Date.now();
        const cooldownMs = REVIEW_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
        const library = this.teachableService.getLibrary();
        const contextLower = currentContext.toLowerCase();

        // Build concept lookup
        const conceptMap = new Map<string, ConceptDefinition>();
        for (const c of CONCEPT_LIBRARY) {
            conceptMap.set(c.id, c);
        }

        const candidates: Array<{ concept: ConceptDefinition; staleness: number }> = [];

        for (const [id, encounter] of library) {
            // Must have been dismissed
            if (!encounter.dismissed) {
                continue;
            }

            // Must not have been shown this session already
            if (this.shownThisSession.has(id)) {
                continue;
            }

            // Must have been dismissed more than 7 days ago
            const lastReviewed = this.lastReviewedMap.get(id) ?? encounter.lastEncountered;
            const timeSinceReview = now - lastReviewed;
            if (timeSinceReview < cooldownMs) {
                continue;
            }

            const concept = conceptMap.get(id);
            if (!concept) {
                continue;
            }

            // Check relevance to current context
            const isRelated = this.isRelatedToContext(concept, contextLower);
            if (!isRelated) {
                continue;
            }

            candidates.push({
                concept,
                staleness: timeSinceReview,
            });
        }

        // Sort by staleness (oldest first -- most in need of review)
        candidates.sort((a, b) => b.staleness - a.staleness);

        // Cap to remaining allowance
        const remaining = MAX_SUGGESTIONS_PER_SESSION - this.suggestionsShownCount;
        return candidates.slice(0, remaining).map(c => c.concept);
    }

    /**
     * Record that a suggestion was shown to the user.
     * Prevents it from being shown again this session.
     */
    markSuggestionShown(conceptId: string): void {
        this.shownThisSession.add(conceptId);
        this.suggestionsShownCount++;
        this.saveShownSuggestions();
        this.onDidChangeSuggestionsEmitter.fire();
    }

    /**
     * User chose "Refresh" -- update the last reviewed timestamp.
     */
    markReviewed(conceptId: string): void {
        this.lastReviewedMap.set(conceptId, Date.now());
        this.saveLastReviewed();
        this.onDidChangeSuggestionsEmitter.fire();
    }

    /**
     * User chose "Not now" -- snooze for another 7 days by
     * setting lastReviewed to now.
     */
    snooze(conceptId: string): void {
        this.lastReviewedMap.set(conceptId, Date.now());
        this.saveLastReviewed();
        this.onDidChangeSuggestionsEmitter.fire();
    }

    /**
     * Get a human-readable time-ago string for when a concept was last encountered.
     */
    getTimeAgo(conceptId: string): string {
        const library = this.teachableService.getLibrary();
        const encounter = library.get(conceptId);
        if (!encounter) {
            return 'some time ago';
        }

        const lastReviewed = this.lastReviewedMap.get(conceptId) ?? encounter.lastEncountered;
        const diffMs = Date.now() - lastReviewed;
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (days < 1) {
            return 'today';
        }
        if (days === 1) {
            return 'yesterday';
        }
        if (days < 7) {
            return `${days} days ago`;
        }
        if (days < 30) {
            const weeks = Math.floor(days / 7);
            return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
        }
        if (days < 365) {
            const months = Math.floor(days / 30);
            return months === 1 ? '1 month ago' : `${months} months ago`;
        }
        const years = Math.floor(days / 365);
        return years === 1 ? '1 year ago' : `${years} years ago`;
    }

    // ─── Private Helpers ───

    protected isRelatedToContext(concept: ConceptDefinition, contextLower: string): boolean {
        // Check if any keyword appears in the context
        for (const kw of concept.keywords) {
            if (contextLower.includes(kw.toLowerCase())) {
                return true;
            }
        }

        // Check if the category matches common context patterns
        const categoryLower = concept.category.toLowerCase();
        if (contextLower.includes(categoryLower)) {
            return true;
        }

        // Language mapping: if context mentions a language, relate to its categories
        const languageCategories: Record<string, string[]> = {
            'typescript': ['Variables', 'Functions', 'OOP', 'Async', 'Design Patterns', 'Testing'],
            'javascript': ['Variables', 'Functions', 'Control Flow', 'Async', 'DOM/Web', 'Design Patterns', 'Testing'],
            'css': ['CSS'],
            'html': ['DOM/Web', 'CSS'],
            'git': ['Git'],
            'python': ['Variables', 'Functions', 'Control Flow', 'Data Structures', 'OOP', 'Algorithms'],
        };

        for (const [lang, categories] of Object.entries(languageCategories)) {
            if (contextLower.includes(lang) && categories.includes(concept.category)) {
                return true;
            }
        }

        return false;
    }

    // ─── Persistence ───

    protected loadLastReviewed(): void {
        try {
            const raw = localStorage.getItem(REVIEW_TIMESTAMPS_KEY);
            if (raw) {
                const parsed: Record<string, number> = JSON.parse(raw);
                this.lastReviewedMap = new Map(Object.entries(parsed));
            }
        } catch {
            this.lastReviewedMap = new Map();
        }
    }

    protected saveLastReviewed(): void {
        try {
            const obj: Record<string, number> = {};
            for (const [k, v] of this.lastReviewedMap) {
                obj[k] = v;
            }
            localStorage.setItem(REVIEW_TIMESTAMPS_KEY, JSON.stringify(obj));
        } catch {
            /* localStorage may be disabled */
        }
    }

    protected loadShownSuggestions(): void {
        try {
            const raw = sessionStorage.getItem(SHOWN_SUGGESTIONS_KEY);
            if (raw) {
                const parsed: string[] = JSON.parse(raw);
                this.shownThisSession = new Set(parsed);
                this.suggestionsShownCount = parsed.length;
            }
        } catch {
            this.shownThisSession = new Set();
        }
    }

    protected saveShownSuggestions(): void {
        try {
            sessionStorage.setItem(SHOWN_SUGGESTIONS_KEY, JSON.stringify([...this.shownThisSession]));
        } catch {
            /* sessionStorage may be disabled */
        }
    }
}
