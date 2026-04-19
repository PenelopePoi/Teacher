/**
 * C9 — Pedagogy Library Widget
 *
 * A panel showing all concepts the user has encountered,
 * grouped by category. This is the user's personal curriculum
 * built through working — not through coursework.
 *
 * Shows: concept name, date encountered, encounter count,
 * dismissed status, and "revisit" button.
 * Searchable and filterable.
 */

import { ReactWidget } from '@theia/core/lib/browser';
import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';
import { CONCEPT_LIBRARY, CATEGORY_COLORS, ConceptCategory, ConceptDefinition } from './concept-library';
import { TeachableMomentService, EncounteredConcept } from './teachable-moment-service';

/* ─── Sub-components ─── */

interface LibraryEntryProps {
    readonly concept: ConceptDefinition;
    readonly encounter: EncounteredConcept;
    readonly onRevisit: (id: string) => void;
}

function LibraryEntry({ concept, encounter, onRevisit }: LibraryEntryProps): React.ReactElement {
    const categoryColor = CATEGORY_COLORS[concept.category as ConceptCategory] ?? '#E8A948';

    const handleRevisit = React.useCallback((): void => {
        onRevisit(concept.id);
    }, [concept.id, onRevisit]);

    return (
        <div className={`teacher-pl-entry ${encounter.dismissed ? 'teacher-pl-entry--dismissed' : ''}`}>
            <div className='teacher-pl-entry-main'>
                <span className='teacher-pl-entry-name'>{concept.name}</span>
                <span
                    className='teacher-pl-entry-badge'
                    style={{ backgroundColor: categoryColor + '22', color: categoryColor }}
                >
                    {concept.category}
                </span>
            </div>
            <p className='teacher-pl-entry-explanation'>{concept.oneLineExplanation}</p>
            <div className='teacher-pl-entry-meta'>
                <span className='teacher-pl-entry-date'>
                    <i className='codicon codicon-calendar' />
                    {formatDate(encounter.firstEncountered)}
                </span>
                <span className='teacher-pl-entry-count'>
                    <i className='codicon codicon-eye' />
                    {encounter.encounterCount}x
                </span>
                {encounter.dismissed ? (
                    <button
                        type='button'
                        className='teacher-pl-revisit-btn'
                        onClick={handleRevisit}
                        title={nls.localize('theia/teacher/plRevisit', 'Revisit this concept')}
                    >
                        <i className='codicon codicon-refresh' />
                        {nls.localize('theia/teacher/plRevisitLabel', 'Revisit')}
                    </button>
                ) : (
                    <span className='teacher-pl-active-badge'>
                        <i className='codicon codicon-circle-filled' />
                        {nls.localize('theia/teacher/plActive', 'Active')}
                    </span>
                )}
            </div>
        </div>
    );
}

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/* ─── Main Widget ─── */

@injectable()
export class PedagogyLibraryWidget extends ReactWidget {

    static readonly ID = 'teacher-pedagogy-library';
    static readonly LABEL = nls.localize('theia/teacher/pedagogyLibrary', 'Pedagogy Library');

    @inject(TeachableMomentService)
    protected readonly service: TeachableMomentService;

    protected searchQuery: string = '';
    protected filterCategory: string = 'all';
    protected filterStatus: 'all' | 'active' | 'mastered' = 'all';

    @postConstruct()
    protected init(): void {
        this.id = PedagogyLibraryWidget.ID;
        this.title.label = PedagogyLibraryWidget.LABEL;
        this.title.caption = PedagogyLibraryWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-book';
        this.addClass('teacher-pedagogy-library');

        this.service.onDidChange(() => this.update());
    }

    protected handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.searchQuery = e.target.value;
        this.update();
    };

    protected handleCategoryFilter = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        this.filterCategory = e.target.value;
        this.update();
    };

    protected handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        this.filterStatus = e.target.value as 'all' | 'active' | 'mastered';
        this.update();
    };

    protected handleRevisit = (conceptId: string): void => {
        this.service.undismiss(conceptId);
    };

    protected render(): React.ReactNode {
        const library = this.service.getLibrary();
        const conceptMap = new Map<string, ConceptDefinition>();
        for (const c of CONCEPT_LIBRARY) {
            conceptMap.set(c.id, c);
        }

        // Build entries: encountered concepts with their definitions
        const entries: Array<{ concept: ConceptDefinition; encounter: EncounteredConcept }> = [];
        for (const [id, encounter] of library) {
            const concept = conceptMap.get(id);
            if (concept) {
                entries.push({ concept, encounter });
            }
        }

        // Apply filters
        const query = this.searchQuery.toLowerCase();
        const filtered = entries.filter(({ concept, encounter }) => {
            if (query && !concept.name.toLowerCase().includes(query)
                && !concept.oneLineExplanation.toLowerCase().includes(query)
                && !concept.category.toLowerCase().includes(query)) {
                return false;
            }
            if (this.filterCategory !== 'all' && concept.category !== this.filterCategory) {
                return false;
            }
            if (this.filterStatus === 'active' && encounter.dismissed) {
                return false;
            }
            if (this.filterStatus === 'mastered' && !encounter.dismissed) {
                return false;
            }
            return true;
        });

        // Group by category
        const grouped = new Map<string, Array<{ concept: ConceptDefinition; encounter: EncounteredConcept }>>();
        for (const entry of filtered) {
            const cat = entry.concept.category;
            if (!grouped.has(cat)) {
                grouped.set(cat, []);
            }
            grouped.get(cat)!.push(entry);
        }

        // Sort groups by category name
        const sortedGroups = [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]));

        // Collect unique categories for filter dropdown
        const allCategories = [...new Set(entries.map(e => e.concept.category))].sort();

        const totalEncountered = entries.length;
        const totalDismissed = entries.filter(e => e.encounter.dismissed).length;

        return (
            <div className='teacher-pl-container'>
                <div className='teacher-pl-header'>
                    <h2>
                        <i className='codicon codicon-book' />
                        {nls.localize('theia/teacher/plTitle', 'Pedagogy Library')}
                    </h2>
                    <div className='teacher-pl-stats'>
                        <span className='teacher-pl-stat'>
                            {totalEncountered} {nls.localize('theia/teacher/plEncountered', 'encountered')}
                        </span>
                        <span className='teacher-pl-stat'>
                            {totalDismissed} {nls.localize('theia/teacher/plMastered', 'mastered')}
                        </span>
                    </div>
                </div>

                <div className='teacher-pl-filters'>
                    <div className='teacher-pl-search'>
                        <i className='codicon codicon-search' />
                        <input
                            type='text'
                            className='theia-input teacher-pl-search-input'
                            placeholder={nls.localize('theia/teacher/plSearch', 'Search concepts...')}
                            value={this.searchQuery}
                            onChange={this.handleSearch}
                        />
                    </div>
                    <select
                        className='theia-select teacher-pl-select'
                        value={this.filterCategory}
                        onChange={this.handleCategoryFilter}
                    >
                        <option value='all'>{nls.localize('theia/teacher/plAllCategories', 'All Categories')}</option>
                        {allCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <select
                        className='theia-select teacher-pl-select'
                        value={this.filterStatus}
                        onChange={this.handleStatusFilter}
                    >
                        <option value='all'>{nls.localize('theia/teacher/plAllStatus', 'All')}</option>
                        <option value='active'>{nls.localize('theia/teacher/plStatusActive', 'Active')}</option>
                        <option value='mastered'>{nls.localize('theia/teacher/plStatusMastered', 'Mastered')}</option>
                    </select>
                </div>

                <div className='teacher-pl-list'>
                    {sortedGroups.length === 0 && (
                        <div className='teacher-pl-empty'>
                            <i className='codicon codicon-book' />
                            <h3>{nls.localize('theia/teacher/plEmptyTitle', 'Your Library is Empty')}</h3>
                            <p>{nls.localize(
                                'theia/teacher/plEmptyDesc',
                                'Concepts will appear here as you work with AI. Every gold-underlined term you encounter becomes part of your personal curriculum.'
                            )}</p>
                        </div>
                    )}
                    {sortedGroups.map(([category, items]) => (
                        <div key={category} className='teacher-pl-group'>
                            <div
                                className='teacher-pl-group-header'
                                style={{ borderLeftColor: CATEGORY_COLORS[category as ConceptCategory] ?? '#E8A948' }}
                            >
                                <span className='teacher-pl-group-name'>{category}</span>
                                <span className='teacher-pl-group-count'>{items.length}</span>
                            </div>
                            {items.map(({ concept, encounter }) => (
                                <LibraryEntry
                                    key={concept.id}
                                    concept={concept}
                                    encounter={encounter}
                                    onRevisit={this.handleRevisit}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}
