import { ReactWidget } from '@theia/core/lib/browser';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';

/**
 * §2 item #6 — Teachable Moments panel.
 *
 * Tracks concepts the learner has encountered via AI assistance.
 * Each concept shows a name, explanation, confidence indicator
 * (new / learning / known), and a "Got it" dismiss button.
 * Concepts are grouped by category and searchable.
 */

type ConfidenceLevel = 'new' | 'learning' | 'known';

interface TeachableConcept {
    readonly id: string;
    readonly name: string;
    readonly explanation: string;
    readonly category: string;
    readonly timesSeen: number;
    readonly firstSeen: number;
    mastered: boolean;
}

const DEMO_CONCEPTS: TeachableConcept[] = [
    { id: 'c1', name: 'async/await', explanation: 'Syntactic sugar for Promises that makes asynchronous code read like synchronous code.', category: 'JavaScript', timesSeen: 1, firstSeen: Date.now() - 3600000, mastered: false },
    { id: 'c2', name: 'Array.map()', explanation: 'Creates a new array by calling a function on every element of the original array.', category: 'JavaScript', timesSeen: 3, firstSeen: Date.now() - 86400000, mastered: false },
    { id: 'c3', name: 'Array.filter()', explanation: 'Returns a new array containing only elements that pass the provided test function.', category: 'JavaScript', timesSeen: 5, firstSeen: Date.now() - 172800000, mastered: false },
    { id: 'c4', name: 'Destructuring', explanation: 'Unpacks values from arrays or properties from objects into distinct variables.', category: 'JavaScript', timesSeen: 4, firstSeen: Date.now() - 259200000, mastered: false },
    { id: 'c5', name: 'CSS Grid', explanation: 'A two-dimensional layout system that handles both rows and columns simultaneously.', category: 'CSS', timesSeen: 1, firstSeen: Date.now() - 1800000, mastered: false },
    { id: 'c6', name: 'Flexbox', explanation: 'A one-dimensional layout model for distributing space among items in a container.', category: 'CSS', timesSeen: 6, firstSeen: Date.now() - 345600000, mastered: false },
    { id: 'c7', name: 'CSS Variables', explanation: 'Custom properties defined with -- prefix that can be reused throughout stylesheets.', category: 'CSS', timesSeen: 2, firstSeen: Date.now() - 43200000, mastered: false },
    { id: 'c8', name: 'useState()', explanation: 'React Hook that adds local state to a function component, returning the value and a setter.', category: 'React', timesSeen: 7, firstSeen: Date.now() - 432000000, mastered: false },
    { id: 'c9', name: 'useEffect()', explanation: 'React Hook for performing side effects like data fetching, subscriptions, or DOM manipulation.', category: 'React', timesSeen: 3, firstSeen: Date.now() - 172800000, mastered: false },
    { id: 'c10', name: 'JSX', explanation: 'A syntax extension that lets you write HTML-like markup inside JavaScript for defining UI structure.', category: 'React', timesSeen: 8, firstSeen: Date.now() - 518400000, mastered: false },
    { id: 'c11', name: 'Props', explanation: 'Read-only inputs passed from a parent component to a child component to configure its behavior.', category: 'React', timesSeen: 2, firstSeen: Date.now() - 86400000, mastered: false },
    { id: 'c12', name: 'DRY Principle', explanation: 'Don\'t Repeat Yourself — extract shared logic to reduce duplication and maintenance burden.', category: 'General', timesSeen: 1, firstSeen: Date.now() - 7200000, mastered: false },
    { id: 'c13', name: 'Template Literals', explanation: 'Backtick-delimited strings that support embedded expressions via ${} and multi-line content.', category: 'JavaScript', timesSeen: 4, firstSeen: Date.now() - 259200000, mastered: false },
    { id: 'c14', name: 'Dependency Injection', explanation: 'A pattern where objects receive their dependencies from an external source rather than creating them.', category: 'General', timesSeen: 2, firstSeen: Date.now() - 129600000, mastered: false },
    { id: 'c15', name: 'box-shadow', explanation: 'CSS property that adds shadow effects around an element\'s frame for depth and elevation.', category: 'CSS', timesSeen: 1, firstSeen: Date.now() - 900000, mastered: false },
];

const CATEGORIES = ['JavaScript', 'CSS', 'React', 'General'];

@injectable()
export class TeachableMomentsWidget extends ReactWidget {

    static readonly ID = 'teacher-teachable-moments';
    static readonly LABEL = nls.localize('theia/teacher/teachableMoments', 'Learned Concepts');

    protected concepts: TeachableConcept[] = DEMO_CONCEPTS.map(c => ({ ...c }));
    protected searchQuery: string = '';
    protected revisitId: string | undefined;
    protected quizId: string | undefined;
    protected quizQuestion: string | undefined;
    protected quizAnswered: boolean = false;
    protected quizCorrect: boolean = false;

    @postConstruct()
    protected init(): void {
        this.id = TeachableMomentsWidget.ID;
        this.title.label = TeachableMomentsWidget.LABEL;
        this.title.caption = TeachableMomentsWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-lightbulb';
        this.addClass('teacher-teachable-moments');
    }

    protected getConfidence(timesSeen: number): ConfidenceLevel {
        if (timesSeen <= 1) {
            return 'new';
        }
        if (timesSeen <= 3) {
            return 'learning';
        }
        return 'known';
    }

    protected confidenceLabel(level: ConfidenceLevel): string {
        switch (level) {
            case 'new': return nls.localize('theia/teacher/conceptNew', 'New');
            case 'learning': return nls.localize('theia/teacher/conceptLearning', 'Learning');
            case 'known': return nls.localize('theia/teacher/conceptKnown', 'Known');
        }
    }

    protected handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.searchQuery = e.target.value;
        this.update();
    };

    protected handleGotIt = (id: string): void => {
        const concept = this.concepts.find(c => c.id === id);
        if (concept) {
            concept.mastered = true;
            this.update();
        }
    };

    protected handleRevisit = (id: string): void => {
        this.revisitId = this.revisitId === id ? undefined : id;
        this.quizId = undefined;
        this.quizQuestion = undefined;
        this.quizAnswered = false;
        this.update();
    };

    protected handleQuizMe = (id: string): void => {
        const concept = this.concepts.find(c => c.id === id);
        if (!concept) {
            return;
        }
        this.quizId = id;
        this.revisitId = undefined;
        this.quizQuestion = nls.localize(
            'theia/teacher/quizQuestion',
            'In your own words, what does {0} do and when would you use it?',
            concept.name,
        );
        this.quizAnswered = false;
        this.update();
    };

    protected handleQuizAnswer = (correct: boolean): void => {
        this.quizAnswered = true;
        this.quizCorrect = correct;
        this.update();
    };

    protected render(): React.ReactNode {
        const query = this.searchQuery.toLowerCase();
        const filtered = this.concepts.filter(c =>
            !c.mastered &&
            (c.name.toLowerCase().includes(query) ||
             c.explanation.toLowerCase().includes(query) ||
             c.category.toLowerCase().includes(query))
        );

        const grouped = new Map<string, TeachableConcept[]>();
        for (const cat of CATEGORIES) {
            const items = filtered.filter(c => c.category === cat);
            if (items.length > 0) {
                grouped.set(cat, items);
            }
        }

        return (
            <div className='teacher-teachable-moments-container'>
                <div className='teacher-teachable-moments-header'>
                    <h2 className='teacher-teachable-moments-title'>
                        <i className='codicon codicon-lightbulb' />
                        {nls.localize('theia/teacher/learnedConcepts', 'Learned Concepts')}
                    </h2>
                    <span className='teacher-teachable-moments-count'>
                        {filtered.length} {nls.localize('theia/teacher/conceptsActive', 'active')}
                    </span>
                </div>

                <div className='teacher-teachable-moments-search'>
                    <i className='codicon codicon-search' />
                    <input
                        type='text'
                        className='theia-input teacher-teachable-moments-search-input'
                        placeholder={nls.localize('theia/teacher/searchConcepts', 'Filter concepts...')}
                        value={this.searchQuery}
                        onChange={this.handleSearch}
                    />
                </div>

                <div className='teacher-teachable-moments-list'>
                    {grouped.size === 0 && (
                        <div className='teacher-teachable-moments-empty'>
                            <i className='codicon codicon-lightbulb' />
                            <p>{nls.localize('theia/teacher/noConcepts', 'No concepts to show. Keep coding and AI will surface new ideas.')}</p>
                        </div>
                    )}
                    {[...grouped.entries()].map(([category, items]) => (
                        <div key={category} className='teacher-teachable-moments-group'>
                            <div className='teacher-teachable-moments-category'>
                                {category}
                            </div>
                            {items.map(concept => this.renderConcept(concept))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    protected renderConcept(concept: TeachableConcept): React.ReactNode {
        const confidence = this.getConfidence(concept.timesSeen);
        const borderClass = `teacher-teachable-moments-card--${confidence}`;

        return (
            <div key={concept.id} className={`teacher-teachable-moments-card ${borderClass}`}>
                <div className='teacher-teachable-moments-card-header'>
                    <span className={`teacher-teachable-moments-card-name ${confidence === 'new' ? 'teacher-teachable-moments-card-name--new' : ''}`}>
                        {concept.name}
                    </span>
                    <span className={`teacher-teachable-moments-card-confidence teacher-teachable-moments-confidence--${confidence}`}>
                        {concept.timesSeen}x · {this.confidenceLabel(confidence)}
                    </span>
                </div>
                <p className='teacher-teachable-moments-card-explanation'>
                    {concept.explanation}
                </p>
                <div className='teacher-spaced-repetition'>
                    <i className='codicon codicon-clock' />
                    <span>{this.getSpacedRepetitionLabel(concept)}</span>
                </div>
                <div className='teacher-teachable-moments-related'>
                    <i className='codicon codicon-link' />
                    <span className='teacher-teachable-moments-related-label'>
                        {nls.localize('theia/teacher/relatedConcepts', 'Related:')}
                    </span>
                    {this.getRelatedConcepts(concept.id).map(rc => (
                        <span key={rc} className='teacher-teachable-moments-related-chip'>{rc}</span>
                    ))}
                </div>
                <div className='teacher-teachable-moments-card-footer'>
                    <span className='teacher-teachable-moments-card-time'>
                        <i className='codicon codicon-clock' />
                        {this.formatRelative(concept.firstSeen)}
                    </span>
                    <div className='teacher-teachable-moments-card-actions'>
                        <button
                            type='button'
                            className='teacher-teachable-moments-revisit-btn'
                            onClick={() => this.handleRevisit(concept.id)}
                            title={nls.localize('theia/teacher/revisitExplanation', 'Revisit explanation')}
                        >
                            <i className='codicon codicon-refresh' />
                            {nls.localize('theia/teacher/revisit', 'Revisit')}
                        </button>
                        <button
                            type='button'
                            className='teacher-teachable-moments-quiz-btn'
                            onClick={() => this.handleQuizMe(concept.id)}
                            title={nls.localize('theia/teacher/quizMeTitle', 'Test your knowledge')}
                        >
                            <i className='codicon codicon-beaker' />
                            {nls.localize('theia/teacher/quizMe', 'Quiz Me')}
                        </button>
                        <button
                            type='button'
                            className='teacher-teachable-moments-got-it'
                            onClick={() => this.handleGotIt(concept.id)}
                            title={nls.localize('theia/teacher/markMastered', 'Mark as mastered')}
                        >
                            <i className='codicon codicon-check' />
                            {nls.localize('theia/teacher/gotIt', 'Got it')}
                        </button>
                    </div>
                </div>
                {this.revisitId === concept.id && (
                    <div className='teacher-teachable-moments-revisit-panel'>
                        <i className='codicon codicon-info' />
                        <p>{concept.explanation}</p>
                    </div>
                )}
                {this.quizId === concept.id && this.quizQuestion && (
                    <div className='teacher-teachable-moments-quiz-panel'>
                        <p className='teacher-teachable-moments-quiz-question'>
                            <i className='codicon codicon-question' />
                            {this.quizQuestion}
                        </p>
                        {!this.quizAnswered ? (
                            <div className='teacher-teachable-moments-quiz-actions'>
                                <button
                                    type='button'
                                    className='teacher-teachable-moments-quiz-answer-btn teacher-teachable-moments-quiz-answer-btn--yes'
                                    onClick={() => this.handleQuizAnswer(true)}
                                >
                                    <i className='codicon codicon-check' />
                                    {nls.localize('theia/teacher/quizKnewIt', 'I knew it')}
                                </button>
                                <button
                                    type='button'
                                    className='teacher-teachable-moments-quiz-answer-btn teacher-teachable-moments-quiz-answer-btn--no'
                                    onClick={() => this.handleQuizAnswer(false)}
                                >
                                    <i className='codicon codicon-close' />
                                    {nls.localize('theia/teacher/quizNeedReview', 'Need review')}
                                </button>
                            </div>
                        ) : (
                            <div className={`teacher-teachable-moments-quiz-result ${this.quizCorrect ? 'teacher-teachable-moments-quiz-result--correct' : 'teacher-teachable-moments-quiz-result--review'}`}>
                                <i className={`codicon ${this.quizCorrect ? 'codicon-pass-filled' : 'codicon-book'}`} />
                                <span>
                                    {this.quizCorrect
                                        ? nls.localize('theia/teacher/quizGreat', 'Great job! Keep reinforcing this concept.')
                                        : nls.localize('theia/teacher/quizReviewSuggestion', 'No worries! Here is the explanation: {0}', concept.explanation)}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    protected getSpacedRepetitionLabel = (concept: TeachableConcept): string => {
        if (concept.timesSeen >= 6) {
            return nls.localize('theia/teacher/srMastered', 'Mastered \u2014 no review needed');
        }
        if (concept.timesSeen >= 3) {
            return nls.localize('theia/teacher/srWeek', 'Review in: 1 week');
        }
        return nls.localize('theia/teacher/srDays', 'Review in: 2 days');
    };

    protected readonly relatedConceptsMap: Record<string, string[]> = {
        c1: ['Promises', 'callbacks', 'event loop'],
        c2: ['Array.filter()', 'Array.reduce()', 'for...of'],
        c3: ['Array.map()', 'Array.find()', 'Array.some()'],
        c4: ['spread operator', 'rest parameters', 'default values'],
        c5: ['Flexbox', 'grid-template-areas', 'auto-fit'],
        c6: ['CSS Grid', 'align-items', 'justify-content'],
        c7: ['calc()', 'currentColor', 'theming'],
        c8: ['useReducer()', 'state lifting', 'immutability'],
        c9: ['cleanup functions', 'dependency arrays', 'useMemo()'],
        c10: ['React.createElement', 'fragments', 'conditional rendering'],
        c11: ['children prop', 'PropTypes', 'default props'],
        c12: ['abstraction', 'modularity', 'single responsibility'],
        c13: ['tagged templates', 'String.raw', 'interpolation'],
        c14: ['InversifyJS', 'service locator', 'IoC containers'],
        c15: ['border-radius', 'backdrop-filter', 'elevation'],
    };

    protected getRelatedConcepts = (conceptId: string): string[] => {
        return this.relatedConceptsMap[conceptId] ?? ['functions', 'variables', 'scope'];
    };

    protected formatRelative(ts: number): string {
        const diff = Date.now() - ts;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) {
            return nls.localize('theia/teacher/justNow', 'just now');
        }
        if (minutes < 60) {
            return `${minutes}m ago`;
        }
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return `${hours}h ago`;
        }
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }
}
