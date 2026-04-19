/**
 * H3 -- Spiral Review Widget
 *
 * Small, non-intrusive banner that appears at the top of the editor area.
 * "You learned [concept] [time ago]. Want a refresher?"
 *
 * Two buttons: "Refresh" (opens the concept card), "Not now" (dismisses for 7 more days)
 * Slides in from top, auto-dismisses after 15 seconds if not interacted with.
 * Amber left border, glass background.
 */

import { ReactWidget } from '@theia/core/lib/browser';
import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';
import { SpiralReviewService } from './spiral-review-service';
import { ConceptDefinition } from './concept-library';

interface SuggestionState {
    readonly concept: ConceptDefinition;
    readonly timeAgo: string;
    visible: boolean;
}

@injectable()
export class SpiralReviewWidget extends ReactWidget {

    static readonly ID = 'teacher-spiral-review';
    static readonly LABEL = nls.localize('theia/teacher/spiralReview', 'Spiral Review');

    @inject(SpiralReviewService)
    protected readonly reviewService: SpiralReviewService;

    protected suggestions: SuggestionState[] = [];
    protected autoDismissTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

    @postConstruct()
    protected init(): void {
        this.id = SpiralReviewWidget.ID;
        this.title.label = SpiralReviewWidget.LABEL;
        this.title.caption = SpiralReviewWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-history';
        this.addClass('teacher-spiral-review');

        this.reviewService.onDidChangeSuggestions(() => this.update());
    }

    /**
     * Trigger review suggestions for the current editing context.
     * Called externally when the user opens a file or changes context.
     */
    triggerReview(currentContext: string): void {
        if (!this.reviewService.shouldSuggestReview()) {
            return;
        }

        const concepts = this.reviewService.getReviewSuggestions(currentContext);
        if (concepts.length === 0) {
            return;
        }

        for (const concept of concepts) {
            const timeAgo = this.reviewService.getTimeAgo(concept.id);
            this.suggestions.push({ concept, timeAgo, visible: true });
            this.reviewService.markSuggestionShown(concept.id);

            // Auto-dismiss after 15 seconds
            const timer = setTimeout(() => {
                this.dismissSuggestion(concept.id);
            }, 15000);
            this.autoDismissTimers.set(concept.id, timer);
        }

        this.update();
    }

    protected handleRefresh = (conceptId: string): void => {
        this.clearAutoDismiss(conceptId);
        this.reviewService.markReviewed(conceptId);
        this.dismissSuggestion(conceptId);
        // The concept card opening would be handled by the TeachableMomentService
        // via undismiss to resurface the full concept card
        this.reviewService['teachableService'].undismiss(conceptId);
    };

    protected handleNotNow = (conceptId: string): void => {
        this.clearAutoDismiss(conceptId);
        this.reviewService.snooze(conceptId);
        this.dismissSuggestion(conceptId);
    };

    protected dismissSuggestion(conceptId: string): void {
        const idx = this.suggestions.findIndex(s => s.concept.id === conceptId);
        if (idx !== -1) {
            this.suggestions[idx].visible = false;
            this.update();

            // Remove from list after animation completes
            setTimeout(() => {
                this.suggestions = this.suggestions.filter(s => s.concept.id !== conceptId);
                this.update();
            }, 300);
        }
    }

    protected clearAutoDismiss(conceptId: string): void {
        const timer = this.autoDismissTimers.get(conceptId);
        if (timer) {
            clearTimeout(timer);
            this.autoDismissTimers.delete(conceptId);
        }
    }

    override dispose(): void {
        for (const timer of this.autoDismissTimers.values()) {
            clearTimeout(timer);
        }
        this.autoDismissTimers.clear();
        super.dispose();
    }

    protected render(): React.ReactNode {
        const visibleSuggestions = this.suggestions.filter(s => s.visible || s.concept);

        if (visibleSuggestions.length === 0) {
            return null;
        }

        return (
            <div className='teacher-sr-container'>
                {visibleSuggestions.map(suggestion => (
                    <SpiralReviewBanner
                        key={suggestion.concept.id}
                        concept={suggestion.concept}
                        timeAgo={suggestion.timeAgo}
                        visible={suggestion.visible}
                        onRefresh={this.handleRefresh}
                        onNotNow={this.handleNotNow}
                    />
                ))}
            </div>
        );
    }
}

/* ─── Banner Sub-component ─── */

interface BannerProps {
    readonly concept: ConceptDefinition;
    readonly timeAgo: string;
    readonly visible: boolean;
    readonly onRefresh: (id: string) => void;
    readonly onNotNow: (id: string) => void;
}

function SpiralReviewBanner({ concept, timeAgo, visible, onRefresh, onNotNow }: BannerProps): React.ReactElement {
    const handleRefresh = React.useCallback((): void => {
        onRefresh(concept.id);
    }, [concept.id, onRefresh]);

    const handleNotNow = React.useCallback((): void => {
        onNotNow(concept.id);
    }, [concept.id, onNotNow]);

    return (
        <div className={`teacher-sr-banner ${visible ? 'teacher-sr-banner--visible' : 'teacher-sr-banner--hidden'}`}>
            <div className='teacher-sr-banner-content'>
                <i className='codicon codicon-history teacher-sr-icon' />
                <span className='teacher-sr-message'>
                    {nls.localize(
                        'theia/teacher/srMessage',
                        'You learned {0} {1}. Want a refresher?',
                        concept.name,
                        timeAgo
                    )}
                </span>
            </div>
            <div className='teacher-sr-actions'>
                <button
                    type='button'
                    className='teacher-sr-btn teacher-sr-btn--refresh'
                    onClick={handleRefresh}
                    title={nls.localize('theia/teacher/srRefresh', 'Open the concept card for a refresher')}
                >
                    <i className='codicon codicon-book' />
                    {nls.localize('theia/teacher/srRefreshLabel', 'Refresh')}
                </button>
                <button
                    type='button'
                    className='teacher-sr-btn teacher-sr-btn--dismiss'
                    onClick={handleNotNow}
                    title={nls.localize('theia/teacher/srNotNow', 'Dismiss for 7 more days')}
                >
                    {nls.localize('theia/teacher/srNotNowLabel', 'Not now')}
                </button>
            </div>
        </div>
    );
}
