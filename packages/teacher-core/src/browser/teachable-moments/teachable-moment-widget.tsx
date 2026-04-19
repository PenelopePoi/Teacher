/**
 * C9 — Teachable Moment Widget
 *
 * A floating explainer card that appears when the user hovers
 * over a gold-underlined concept. Shows the one-line explanation,
 * expandable full explanation with code, playground launcher,
 * and "Got it" dismissal button.
 *
 * The pedagogy primitive that survives 100 years.
 */

import { ReactWidget } from '@theia/core/lib/browser';
import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';
import { ConceptDefinition, CATEGORY_COLORS, ConceptCategory } from './concept-library';
import { TeachableMomentService } from './teachable-moment-service';
import { TeachableMomentDetector, DetectedConcept } from './teachable-moment-detector';

/* ─── Sub-components ─── */

interface ConceptCardProps {
    readonly detected: DetectedConcept;
    readonly onDismiss: (id: string) => void;
    readonly onOpenPlayground: (concept: ConceptDefinition) => void;
}

function ConceptCard({ detected, onDismiss, onOpenPlayground }: ConceptCardProps): React.ReactElement {
    const [expanded, setExpanded] = React.useState(false);
    const { concept } = detected;
    const categoryColor = CATEGORY_COLORS[concept.category as ConceptCategory] ?? '#E8A948';

    const handleDismiss = React.useCallback((): void => {
        onDismiss(concept.id);
    }, [concept.id, onDismiss]);

    const handleExpand = React.useCallback((): void => {
        setExpanded(prev => !prev);
    }, []);

    const handlePlayground = React.useCallback((): void => {
        onOpenPlayground(concept);
    }, [concept, onOpenPlayground]);

    return (
        <div className='teacher-tm-card' style={{ borderLeftColor: categoryColor }}>
            <div className='teacher-tm-card-header'>
                <span className='teacher-tm-card-name'>{concept.name}</span>
                <span
                    className='teacher-tm-card-badge'
                    style={{ backgroundColor: categoryColor + '22', color: categoryColor }}
                >
                    {concept.category}
                </span>
            </div>

            <p className='teacher-tm-card-oneliner'>{concept.oneLineExplanation}</p>

            {expanded && (
                <div className='teacher-tm-card-expanded'>
                    <p className='teacher-tm-card-full'>{concept.fullExplanation}</p>
                    {concept.playgroundCode && (
                        <pre className='teacher-tm-card-code'>
                            <code>{concept.playgroundCode.slice(0, 300)}
                                {concept.playgroundCode.length > 300 ? '\n...' : ''}
                            </code>
                        </pre>
                    )}
                </div>
            )}

            <div className='teacher-tm-card-actions'>
                <button
                    type='button'
                    className='teacher-tm-expand-btn'
                    onClick={handleExpand}
                    title={expanded
                        ? nls.localize('theia/teacher/tmCollapse', 'Show less')
                        : nls.localize('theia/teacher/tmExpand', 'Show full explanation')
                    }
                >
                    <i className={`codicon codicon-chevron-${expanded ? 'up' : 'down'}`} />
                    {expanded
                        ? nls.localize('theia/teacher/tmLess', 'Less')
                        : nls.localize('theia/teacher/tmMore', 'More')
                    }
                </button>

                {concept.playgroundCode && (
                    <button
                        type='button'
                        className='teacher-tm-playground-btn'
                        onClick={handlePlayground}
                        title={nls.localize('theia/teacher/tmPlayground', 'Open interactive sandbox')}
                    >
                        <i className='codicon codicon-play' />
                        {nls.localize('theia/teacher/tmOpenPlayground', 'Open Playground')}
                    </button>
                )}

                <button
                    type='button'
                    className='teacher-tm-gotit-btn'
                    onClick={handleDismiss}
                    title={nls.localize('theia/teacher/tmGotItTitle', 'I understand this concept')}
                >
                    <i className='codicon codicon-check' />
                    {nls.localize('theia/teacher/tmGotIt', 'Got it')}
                </button>
            </div>
        </div>
    );
}

/* ─── Main Widget ─── */

@injectable()
export class TeachableMomentExplainerWidget extends ReactWidget {

    static readonly ID = 'teacher-teachable-moment-explainer';
    static readonly LABEL = nls.localize('theia/teacher/tmExplainer', 'Teachable Moments');

    @inject(TeachableMomentService)
    protected readonly service: TeachableMomentService;

    @inject(TeachableMomentDetector)
    protected readonly detector: TeachableMomentDetector;

    protected detectedConcepts: DetectedConcept[] = [];
    protected lastScanText: string = '';

    @postConstruct()
    protected init(): void {
        this.id = TeachableMomentExplainerWidget.ID;
        this.title.label = TeachableMomentExplainerWidget.LABEL;
        this.title.caption = TeachableMomentExplainerWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-mortar-board';
        this.addClass('teacher-tm-explainer');

        this.service.onDidChange(() => this.update());
    }

    /**
     * Feed text (e.g. from an AI agent response) to detect teachable concepts.
     */
    scanText(text: string): void {
        this.lastScanText = text;
        this.detectedConcepts = this.detector.detect(text);
        this.update();
    }

    protected handleDismiss = (conceptId: string): void => {
        this.service.dismiss(conceptId);
        this.detectedConcepts = this.detectedConcepts.filter(d => d.concept.id !== conceptId);
        this.update();
    };

    protected handleOpenPlayground = (concept: ConceptDefinition): void => {
        if (!concept.playgroundCode) {
            return;
        }
        // Create a temporary playground file in the workspace
        // This integrates with Teacher's editor — opens a new untitled editor
        // with the playground code pre-filled
        console.info(`[TeachableMoments] Opening playground for concept: ${concept.name}`);
        // In a full implementation, this would use EditorManager to open an untitled editor
        // For now, we log and copy to clipboard as a fallback
        try {
            navigator.clipboard.writeText(concept.playgroundCode);
            console.info('[TeachableMoments] Playground code copied to clipboard');
        } catch {
            /* clipboard may not be available */
        }
    };

    protected render(): React.ReactNode {
        if (this.detectedConcepts.length === 0) {
            return (
                <div className='teacher-tm-empty'>
                    <div className='teacher-tm-empty-icon'>
                        <i className='codicon codicon-mortar-board' />
                    </div>
                    <h3>{nls.localize('theia/teacher/tmEmptyTitle', 'No Teachable Moments')}</h3>
                    <p>{nls.localize(
                        'theia/teacher/tmEmptyDesc',
                        'When the AI uses a concept you haven\'t seen, it will appear here with a gold underline. Hover to learn, click "Got it" when you understand.'
                    )}</p>
                </div>
            );
        }

        return (
            <div className='teacher-tm-container'>
                <div className='teacher-tm-header'>
                    <h2>
                        <i className='codicon codicon-mortar-board' />
                        {nls.localize('theia/teacher/tmTitle', 'Teachable Moments')}
                    </h2>
                    <span className='teacher-tm-count'>
                        {this.detectedConcepts.length} {nls.localize('theia/teacher/tmFound', 'concepts detected')}
                    </span>
                </div>

                <div className='teacher-tm-list'>
                    {this.detectedConcepts.map(detected => (
                        <ConceptCard
                            key={detected.concept.id}
                            detected={detected}
                            onDismiss={this.handleDismiss}
                            onOpenPlayground={this.handleOpenPlayground}
                        />
                    ))}
                </div>
            </div>
        );
    }
}
