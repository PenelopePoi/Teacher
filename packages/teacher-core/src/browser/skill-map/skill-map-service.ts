/**
 * H5 -- Skill Map Service
 *
 * Aggregates data from TeachableMomentService to produce
 * category-level statistics for the Skill Map visualization.
 * A working map of accumulated competence across domains.
 */

import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common';
import { TeachableMomentService } from '../teachable-moments/teachable-moment-service';
import { CONCEPT_LIBRARY, ConceptCategory, ConceptDefinition } from '../teachable-moments/concept-library';

const TIME_SPENT_KEY = 'teacher.skillMap.timeSpent';

export interface CategoryStat {
    readonly category: ConceptCategory;
    readonly conceptCount: number;
    readonly masteredCount: number;
    readonly totalTimeMinutes: number;
    readonly averageMastery: number;
}

export interface OverallStats {
    readonly totalConceptsLearned: number;
    readonly totalHoursSpent: number;
    readonly categoriesTouched: number;
}

@injectable()
export class SkillMapService {

    @inject(TeachableMomentService)
    protected readonly teachableService: TeachableMomentService;

    /** Tracks estimated time spent per category in minutes */
    protected timeSpentMap: Map<string, number> = new Map();

    protected readonly onDidChangeEmitter = new Emitter<void>();
    readonly onDidChange: Event<void> = this.onDidChangeEmitter.event;

    @postConstruct()
    protected init(): void {
        this.loadTimeSpent();
        this.teachableService.onDidChange(() => {
            this.onDidChangeEmitter.fire();
        });
    }

    /**
     * Get stats for each concept category the user has touched.
     */
    getCategoryStats(): CategoryStat[] {
        const library = this.teachableService.getLibrary();

        // Build concept lookup
        const conceptMap = new Map<string, ConceptDefinition>();
        for (const c of CONCEPT_LIBRARY) {
            conceptMap.set(c.id, c);
        }

        // Aggregate by category
        const categoryData = new Map<string, {
            conceptCount: number;
            masteredCount: number;
            totalEncounters: number;
        }>();

        for (const [id, encounter] of library) {
            const concept = conceptMap.get(id);
            if (!concept) {
                continue;
            }

            const cat = concept.category;
            const existing = categoryData.get(cat) ?? {
                conceptCount: 0,
                masteredCount: 0,
                totalEncounters: 0,
            };

            existing.conceptCount++;
            if (encounter.dismissed) {
                existing.masteredCount++;
            }
            existing.totalEncounters += encounter.encounterCount;

            categoryData.set(cat, existing);
        }

        const stats: CategoryStat[] = [];
        for (const [cat, data] of categoryData) {
            const timeMinutes = this.timeSpentMap.get(cat) ?? this.estimateTimeMinutes(data.totalEncounters);
            const averageMastery = data.conceptCount > 0
                ? data.masteredCount / data.conceptCount
                : 0;

            stats.push({
                category: cat as ConceptCategory,
                conceptCount: data.conceptCount,
                masteredCount: data.masteredCount,
                totalTimeMinutes: timeMinutes,
                averageMastery: Math.round(averageMastery * 100) / 100,
            });
        }

        // Sort by concept count descending
        stats.sort((a, b) => b.conceptCount - a.conceptCount);
        return stats;
    }

    /**
     * Get overall learning statistics.
     */
    getOverallStats(): OverallStats {
        const categoryStats = this.getCategoryStats();
        const totalConceptsLearned = categoryStats.reduce((sum, c) => sum + c.conceptCount, 0);
        const totalMinutes = categoryStats.reduce((sum, c) => sum + c.totalTimeMinutes, 0);

        return {
            totalConceptsLearned,
            totalHoursSpent: Math.round((totalMinutes / 60) * 10) / 10,
            categoriesTouched: categoryStats.length,
        };
    }

    /**
     * Get all concepts within a specific category, with their encounter data.
     */
    getConceptsInCategory(category: ConceptCategory): Array<{
        concept: ConceptDefinition;
        mastered: boolean;
        encounterCount: number;
    }> {
        const library = this.teachableService.getLibrary();
        const results: Array<{
            concept: ConceptDefinition;
            mastered: boolean;
            encounterCount: number;
        }> = [];

        for (const c of CONCEPT_LIBRARY) {
            if (c.category !== category) {
                continue;
            }
            const encounter = library.get(c.id);
            if (encounter) {
                results.push({
                    concept: c,
                    mastered: encounter.dismissed,
                    encounterCount: encounter.encounterCount,
                });
            }
        }

        return results;
    }

    /**
     * Record time spent in a category (called by external tracking).
     */
    recordTimeSpent(category: string, minutes: number): void {
        const current = this.timeSpentMap.get(category) ?? 0;
        this.timeSpentMap.set(category, current + minutes);
        this.saveTimeSpent();
        this.onDidChangeEmitter.fire();
    }

    // ─── Private Helpers ───

    /**
     * Estimate time spent based on encounter count.
     * Rough heuristic: each encounter is approximately 2 minutes of engagement.
     */
    protected estimateTimeMinutes(encounters: number): number {
        return encounters * 2;
    }

    // ─── Persistence ───

    protected loadTimeSpent(): void {
        try {
            const raw = localStorage.getItem(TIME_SPENT_KEY);
            if (raw) {
                const parsed: Record<string, number> = JSON.parse(raw);
                this.timeSpentMap = new Map(Object.entries(parsed));
            }
        } catch {
            this.timeSpentMap = new Map();
        }
    }

    protected saveTimeSpent(): void {
        try {
            const obj: Record<string, number> = {};
            for (const [k, v] of this.timeSpentMap) {
                obj[k] = v;
            }
            localStorage.setItem(TIME_SPENT_KEY, JSON.stringify(obj));
        } catch {
            /* localStorage may be disabled */
        }
    }
}
