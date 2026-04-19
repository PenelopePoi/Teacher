/**
 * H5 -- Skill Map Widget
 *
 * A personal visualization of the user's accumulated competence across domains.
 * Not gamified badges -- a working map.
 *
 * Grid/treemap of concept categories. Each cell shows:
 * category name, count of concepts learned, average mastery.
 * Cell size proportional to time spent. Cell color gradient from surface-3 to amber.
 * Clicking a cell expands to show individual concepts within that category.
 */

import { ReactWidget } from '@theia/core/lib/browser';
import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';
import { SkillMapService, CategoryStat } from './skill-map-service';
import { CATEGORY_COLORS, ConceptCategory, ConceptDefinition } from '../teachable-moments/concept-library';

@injectable()
export class SkillMapWidget extends ReactWidget {

    static readonly ID = 'teacher-skill-map';
    static readonly LABEL = nls.localize('theia/teacher/skillMap', 'Skill Map');

    @inject(SkillMapService)
    protected readonly skillMapService: SkillMapService;

    protected expandedCategory: ConceptCategory | undefined = undefined;

    @postConstruct()
    protected init(): void {
        this.id = SkillMapWidget.ID;
        this.title.label = SkillMapWidget.LABEL;
        this.title.caption = SkillMapWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-map';
        this.addClass('teacher-skill-map');

        this.skillMapService.onDidChange(() => this.update());
    }

    protected handleCellClick = (category: ConceptCategory): void => {
        this.expandedCategory = this.expandedCategory === category ? undefined : category;
        this.update();
    };

    protected handleBackClick = (): void => {
        this.expandedCategory = undefined;
        this.update();
    };

    protected render(): React.ReactNode {
        const categoryStats = this.skillMapService.getCategoryStats();
        const overallStats = this.skillMapService.getOverallStats();

        if (categoryStats.length === 0) {
            return (
                <div className='teacher-sm-container'>
                    <div className='teacher-sm-empty'>
                        <i className='codicon codicon-map' />
                        <h3>{nls.localize('theia/teacher/smEmptyTitle', 'Your Skill Map')}</h3>
                        <p>{nls.localize(
                            'theia/teacher/smEmptyDesc',
                            'Your skill map builds as you learn. Start a lesson to begin.'
                        )}</p>
                    </div>
                </div>
            );
        }

        return (
            <div className='teacher-sm-container'>
                <div className='teacher-sm-header'>
                    <h2>
                        <i className='codicon codicon-map' />
                        {nls.localize('theia/teacher/smTitle', 'Skill Map')}
                    </h2>
                    <div className='teacher-sm-overall'>
                        <span className='teacher-sm-stat'>
                            <strong>{overallStats.totalConceptsLearned}</strong>
                            {' '}{nls.localize('theia/teacher/smConcepts', 'concepts learned')}
                        </span>
                        <span className='teacher-sm-stat'>
                            <strong>{overallStats.totalHoursSpent}</strong>
                            {' '}{nls.localize('theia/teacher/smHours', 'hours spent')}
                        </span>
                        <span className='teacher-sm-stat'>
                            <strong>{overallStats.categoriesTouched}</strong>
                            {' '}{nls.localize('theia/teacher/smCategories', 'categories touched')}
                        </span>
                    </div>
                </div>

                {this.expandedCategory
                    ? this.renderExpandedCategory(this.expandedCategory)
                    : this.renderGrid(categoryStats)
                }
            </div>
        );
    }

    protected renderGrid(stats: CategoryStat[]): React.ReactNode {
        // Calculate max time for proportional sizing
        const maxTime = Math.max(...stats.map(s => s.totalTimeMinutes), 1);

        return (
            <div className='teacher-sm-grid'>
                {stats.map(stat => (
                    <CategoryCell
                        key={stat.category}
                        stat={stat}
                        maxTime={maxTime}
                        onClick={this.handleCellClick}
                    />
                ))}
            </div>
        );
    }

    protected renderExpandedCategory(category: ConceptCategory): React.ReactNode {
        const concepts = this.skillMapService.getConceptsInCategory(category);
        const categoryColor = CATEGORY_COLORS[category] ?? '#E8A948';

        return (
            <div className='teacher-sm-expanded'>
                <button
                    type='button'
                    className='teacher-sm-back-btn'
                    onClick={this.handleBackClick}
                >
                    <i className='codicon codicon-arrow-left' />
                    {nls.localize('theia/teacher/smBack', 'Back to map')}
                </button>
                <h3
                    className='teacher-sm-expanded-title'
                    style={{ borderLeftColor: categoryColor }}
                >
                    {category}
                </h3>
                <div className='teacher-sm-concept-list'>
                    {concepts.map(({ concept, mastered, encounterCount }) => (
                        <ConceptRow
                            key={concept.id}
                            concept={concept}
                            mastered={mastered}
                            encounterCount={encounterCount}
                            color={categoryColor}
                        />
                    ))}
                    {concepts.length === 0 && (
                        <p className='teacher-sm-no-concepts'>
                            {nls.localize('theia/teacher/smNoConcepts', 'No concepts encountered in this category yet.')}
                        </p>
                    )}
                </div>
            </div>
        );
    }
}

/* ─── Sub-components ─── */

interface CategoryCellProps {
    readonly stat: CategoryStat;
    readonly maxTime: number;
    readonly onClick: (category: ConceptCategory) => void;
}

function CategoryCell({ stat, maxTime, onClick }: CategoryCellProps): React.ReactElement {
    const categoryColor = CATEGORY_COLORS[stat.category] ?? '#E8A948';

    // Cell size: min 1, max 3 based on time proportion
    const sizeRatio = stat.totalTimeMinutes / maxTime;
    const gridSpan = sizeRatio > 0.6 ? 2 : 1;

    // Color intensity based on mastery
    const intensity = stat.averageMastery;
    const bgColor = `rgba(232, 169, 72, ${0.05 + intensity * 0.2})`;

    const masteryPercent = Math.round(stat.averageMastery * 100);

    const handleClick = React.useCallback((): void => {
        onClick(stat.category);
    }, [stat.category, onClick]);

    return (
        <div
            className='teacher-sm-cell'
            style={{
                gridColumn: `span ${gridSpan}`,
                backgroundColor: bgColor,
                borderLeftColor: categoryColor,
            }}
            onClick={handleClick}
            role='button'
            tabIndex={0}
        >
            <span className='teacher-sm-cell-name'>{stat.category}</span>
            <div className='teacher-sm-cell-stats'>
                <span className='teacher-sm-cell-count'>
                    {stat.conceptCount} {stat.conceptCount === 1 ? 'concept' : 'concepts'}
                </span>
                <span className='teacher-sm-cell-mastery'>
                    {masteryPercent}% mastered
                </span>
            </div>
            <div className='teacher-sm-cell-bar'>
                <div
                    className='teacher-sm-cell-bar-fill'
                    style={{
                        width: `${masteryPercent}%`,
                        backgroundColor: categoryColor,
                    }}
                />
            </div>
        </div>
    );
}

interface ConceptRowProps {
    readonly concept: ConceptDefinition;
    readonly mastered: boolean;
    readonly encounterCount: number;
    readonly color: string;
}

function ConceptRow({ concept, mastered, encounterCount, color }: ConceptRowProps): React.ReactElement {
    return (
        <div className={`teacher-sm-concept-row ${mastered ? 'teacher-sm-concept-row--mastered' : ''}`}>
            <i
                className={`codicon ${mastered ? 'codicon-check' : 'codicon-circle-outline'}`}
                style={{ color: mastered ? color : undefined }}
            />
            <span className='teacher-sm-concept-name'>{concept.name}</span>
            <span className='teacher-sm-concept-encounters'>
                {encounterCount}x
            </span>
            <span className='teacher-sm-concept-desc'>{concept.oneLineExplanation}</span>
        </div>
    );
}
