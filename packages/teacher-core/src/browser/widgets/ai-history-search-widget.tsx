import { ReactWidget } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';

interface ConversationEntry {
    id: string;
    date: string;
    agent: string;
    question: string;
    answerPreview: string;
    fullAnswer: string;
}

const DEMO_CONVERSATIONS: ConversationEntry[] = [
    {
        id: 'conv-001', date: '2026-04-19', agent: 'Tutor',
        question: 'How do I use generics in TypeScript?',
        answerPreview: 'Generics let you write functions and classes that work with any type while maintaining type safety...',
        fullAnswer: 'Generics let you write functions and classes that work with any type while maintaining type safety. You declare a type parameter using angle brackets, for example: function identity<T>(arg: T): T { return arg; }. The T acts as a placeholder that gets replaced with the actual type when the function is called.'
    },
    {
        id: 'conv-002', date: '2026-04-18', agent: 'Explain',
        question: 'What is the difference between let and const?',
        answerPreview: 'Both let and const are block-scoped declarations introduced in ES6. The key difference is...',
        fullAnswer: 'Both let and const are block-scoped declarations introduced in ES6. The key difference is that const creates a binding that cannot be reassigned after initialization, while let allows reassignment. Note that const does not make the value immutable; objects and arrays declared with const can still be mutated.'
    },
    {
        id: 'conv-003', date: '2026-04-17', agent: 'Review',
        question: 'Review my quicksort implementation',
        answerPreview: 'Your implementation looks correct but there are a few improvements to consider: the pivot selection...',
        fullAnswer: 'Your implementation looks correct but there are a few improvements to consider: the pivot selection could use median-of-three to avoid worst-case performance on sorted arrays, and you can reduce memory allocation by partitioning in-place rather than creating new arrays for each recursive call.'
    },
    {
        id: 'conv-004', date: '2026-04-16', agent: 'Tutor',
        question: 'Explain async/await in JavaScript',
        answerPreview: 'Async/await is syntactic sugar built on top of Promises that makes asynchronous code look...',
        fullAnswer: 'Async/await is syntactic sugar built on top of Promises that makes asynchronous code look and behave like synchronous code. An async function always returns a Promise. Inside an async function, you can use the await keyword before a Promise to pause execution until the Promise resolves, making the code much more readable than chaining .then() calls.'
    },
    {
        id: 'conv-005', date: '2026-04-15', agent: 'Explain',
        question: 'What are React hooks?',
        answerPreview: 'React hooks are functions that let you use state and other React features in functional components...',
        fullAnswer: 'React hooks are functions that let you use state and other React features in functional components without writing a class. The most common hooks are useState for managing state, useEffect for side effects, and useContext for consuming context. Hooks follow two rules: only call them at the top level, and only call them from React functions.'
    },
    {
        id: 'conv-006', date: '2026-04-14', agent: 'Tutor',
        question: 'How does dependency injection work in InversifyJS?',
        answerPreview: 'InversifyJS uses decorators and a container to manage object creation. You mark classes with...',
        fullAnswer: 'InversifyJS uses decorators and a container to manage object creation. You mark classes with @injectable(), declare dependencies with @inject(), and register bindings in a Container. When you request an instance, the container resolves all dependencies automatically, creating a loosely coupled architecture.'
    },
];

const AGENT_OPTIONS = ['All', 'Tutor', 'Explain', 'Review'];

@injectable()
export class AIHistorySearchWidget extends ReactWidget {

    static readonly ID = 'teacher-ai-history-search';
    static readonly LABEL = nls.localize('theia/teacher/aiHistorySearch', 'AI Chat History');

    protected searchQuery: string = '';
    protected selectedAgent: string = 'All';
    protected selectedDate: string = '';
    protected expandedConversation: string | undefined;
    protected conversations: ConversationEntry[] = DEMO_CONVERSATIONS;

    @postConstruct()
    protected init(): void {
        this.id = AIHistorySearchWidget.ID;
        this.title.label = AIHistorySearchWidget.LABEL;
        this.title.caption = AIHistorySearchWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-search';
        this.addClass('teacher-ai-history-search');
        this.update();
    }

    protected render(): React.ReactNode {
        const filtered = this.conversations.filter(conv => {
            const matchesSearch = !this.searchQuery ||
                conv.question.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                conv.answerPreview.toLowerCase().includes(this.searchQuery.toLowerCase());
            const matchesAgent = this.selectedAgent === 'All' || conv.agent === this.selectedAgent;
            const matchesDate = !this.selectedDate || conv.date === this.selectedDate;
            return matchesSearch && matchesAgent && matchesDate;
        });

        return (
            <div className='teacher-ai-history-container'>
                <div className='teacher-ai-history-header'>
                    <h2 className='teacher-ai-history-title'>
                        <i className='codicon codicon-search'></i>
                        {nls.localize('theia/teacher/aiHistory', 'AI Chat History')}
                    </h2>
                    <span className='teacher-ai-history-count'>
                        {nls.localize('theia/teacher/conversationCount', '{0} conversations', filtered.length)}
                    </span>
                </div>
                <div className='teacher-ai-history-filters'>
                    <div className='teacher-ai-history-search-row'>
                        <i className='codicon codicon-search'></i>
                        <input
                            className='theia-input teacher-ai-history-search-input'
                            type='text'
                            placeholder={nls.localize('theia/teacher/searchConversations', 'Search conversations...')}
                            value={this.searchQuery}
                            onChange={this.onSearchChange}
                        />
                    </div>
                    <div className='teacher-ai-history-filter-row'>
                        <select
                            className='theia-select teacher-ai-history-agent-select'
                            value={this.selectedAgent}
                            onChange={this.onAgentChange}
                        >
                            {AGENT_OPTIONS.map(agent => (
                                <option key={agent} value={agent}>{agent}</option>
                            ))}
                        </select>
                        <input
                            className='theia-input teacher-ai-history-date-input'
                            type='date'
                            value={this.selectedDate}
                            onChange={this.onDateChange}
                        />
                        {(this.selectedAgent !== 'All' || this.selectedDate || this.searchQuery) && (
                            <button className='theia-button teacher-ai-history-clear-btn' onClick={this.onClearFilters}>
                                <i className='codicon codicon-close'></i>
                                {nls.localize('theia/teacher/clearFilters', 'Clear')}
                            </button>
                        )}
                    </div>
                </div>
                <div className='teacher-ai-history-results'>
                    {filtered.length === 0 ? (
                        <div className='teacher-ai-history-empty'>
                            <i className='codicon codicon-info'></i>
                            <p>{nls.localize('theia/teacher/noConversations', 'No conversations match your filters.')}</p>
                        </div>
                    ) : (
                        filtered.map(conv => this.renderConversation(conv))
                    )}
                </div>
            </div>
        );
    }

    protected renderConversation(conv: ConversationEntry): React.ReactNode {
        const isExpanded = this.expandedConversation === conv.id;

        return (
            <div key={conv.id} className={`teacher-ai-history-item ${isExpanded ? 'teacher-ai-history-item-expanded' : ''}`}>
                <div className='teacher-ai-history-item-header' onClick={() => this.onToggleConversation(conv.id)}>
                    <div className='teacher-ai-history-item-meta'>
                        <span className='teacher-ai-history-item-agent'>
                            <i className='codicon codicon-hubot'></i>
                            {conv.agent}
                        </span>
                        <span className='teacher-ai-history-item-date'>
                            <i className='codicon codicon-calendar'></i>
                            {conv.date}
                        </span>
                    </div>
                    <div className='teacher-ai-history-item-question'>
                        <i className='codicon codicon-comment-discussion'></i>
                        <span>{conv.question}</span>
                    </div>
                    <i className={`codicon ${isExpanded ? 'codicon-chevron-down' : 'codicon-chevron-right'} teacher-ai-history-item-toggle`}></i>
                </div>
                {isExpanded && (
                    <div className='teacher-ai-history-item-body'>
                        <div className='teacher-ai-history-item-answer'>
                            <p>{conv.fullAnswer}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    protected onToggleConversation(convId: string): void {
        this.expandedConversation = this.expandedConversation === convId ? undefined : convId;
        this.update();
    }

    protected onSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.searchQuery = e.target.value;
        this.update();
    };

    protected onAgentChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        this.selectedAgent = e.target.value;
        this.update();
    };

    protected onDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.selectedDate = e.target.value;
        this.update();
    };

    protected onClearFilters = (): void => {
        this.searchQuery = '';
        this.selectedAgent = 'All';
        this.selectedDate = '';
        this.expandedConversation = undefined;
        this.update();
    };
}
