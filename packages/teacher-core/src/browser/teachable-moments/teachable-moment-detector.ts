/**
 * C9 — Teachable Moment Detector
 *
 * Scans AI agent responses for concepts the user hasn't seen before.
 * Uses keyword matching against the concept library to identify
 * teachable moments in natural language text.
 */

import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { CONCEPT_LIBRARY, buildKeywordIndex, ConceptDefinition } from './concept-library';
import { TeachableMomentService } from './teachable-moment-service';

export interface DetectedConcept {
    readonly concept: ConceptDefinition;
    readonly matchedKeyword: string;
    readonly position: number;
}

@injectable()
export class TeachableMomentDetector {

    @inject(TeachableMomentService)
    protected readonly service: TeachableMomentService;

    protected conceptMap: Map<string, ConceptDefinition> = new Map();
    protected keywordIndex: Map<string, string[]> = new Map();

    @postConstruct()
    protected init(): void {
        // Build lookup maps
        for (const concept of CONCEPT_LIBRARY) {
            this.conceptMap.set(concept.id, concept);
        }
        this.keywordIndex = buildKeywordIndex();
    }

    /**
     * Scan a text string (e.g. an AI response) for concepts
     * the user has not yet dismissed. Returns detected concepts
     * sorted by position in the text.
     */
    detect(text: string): DetectedConcept[] {
        const lowerText = text.toLowerCase();
        const seen = new Set<string>(); // avoid duplicates within one scan
        const results: DetectedConcept[] = [];

        for (const [keyword, conceptIds] of this.keywordIndex) {
            const pos = lowerText.indexOf(keyword);
            if (pos === -1) {
                continue;
            }

            for (const conceptId of conceptIds) {
                if (seen.has(conceptId)) {
                    continue;
                }
                if (this.service.isDismissed(conceptId)) {
                    continue;
                }

                const concept = this.conceptMap.get(conceptId);
                if (!concept) {
                    continue;
                }

                seen.add(conceptId);
                results.push({ concept, matchedKeyword: keyword, position: pos });

                // Record the encounter
                this.service.recordEncounter(conceptId);
            }
        }

        // Sort by position in text so underlines appear in reading order
        results.sort((a, b) => a.position - b.position);
        return results;
    }

    /**
     * Get a concept definition by ID.
     */
    getConcept(id: string): ConceptDefinition | undefined {
        return this.conceptMap.get(id);
    }

    /**
     * Get all registered concepts.
     */
    getAllConcepts(): readonly ConceptDefinition[] {
        return CONCEPT_LIBRARY;
    }

    /**
     * Get concepts filtered by category.
     */
    getConceptsByCategory(category: string): ConceptDefinition[] {
        return CONCEPT_LIBRARY.filter(c => c.category === category);
    }

    /**
     * Search concepts by name or explanation text.
     */
    searchConcepts(query: string): ConceptDefinition[] {
        const lower = query.toLowerCase();
        return CONCEPT_LIBRARY.filter(c =>
            c.name.toLowerCase().includes(lower) ||
            c.oneLineExplanation.toLowerCase().includes(lower) ||
            c.keywords.some(k => k.toLowerCase().includes(lower))
        );
    }
}
