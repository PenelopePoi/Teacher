import { ReactWidget } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';

interface SkillEntry {
    name: string;
    description: string;
    category: string;
    type: string;
}

const AI_RELEVANCE: Record<string, number> = {
    'Variables & Types': 78, 'Control Flow': 82, 'Functions': 88, 'Array Methods': 91,
    'Object Destructuring': 74, 'Promises & Async/Await': 65, 'DOM Manipulation': 87,
    'Event Handling': 83, 'REST API Calls': 59, 'Error Handling': 92,
    'TypeScript Generics': 45, 'React Components': 71, 'State Management': 68,
    'CSS Flexbox': 86, 'CSS Grid': 84, 'Git Branching': 77,
    'Unit Testing': 63, 'Dependency Injection': 52, 'Accessibility (a11y)': 79,
    'WebSocket Communication': 41,
};

const USED_BY_COUNT: Record<string, number> = {
    'Variables & Types': 4521, 'Control Flow': 3987, 'Functions': 5102, 'Array Methods': 3456,
    'Object Destructuring': 2891, 'Promises & Async/Await': 2234, 'DOM Manipulation': 3778,
    'Event Handling': 3201, 'REST API Calls': 1876, 'Error Handling': 4102,
    'TypeScript Generics': 1234, 'React Components': 2567, 'State Management': 1998,
    'CSS Flexbox': 3654, 'CSS Grid': 3102, 'Git Branching': 2789,
    'Unit Testing': 1567, 'Dependency Injection': 987, 'Accessibility (a11y)': 2345,
    'WebSocket Communication': 756,
};

const DEMO_SKILLS: SkillEntry[] = [
    { name: 'Variables & Types', description: 'Declare, assign, and use variables with primitive and complex types.', category: 'Fundamentals', type: 'concept' },
    { name: 'Control Flow', description: 'Use conditionals and loops to direct program execution.', category: 'Fundamentals', type: 'concept' },
    { name: 'Functions', description: 'Define reusable blocks of code with parameters and return values.', category: 'Fundamentals', type: 'concept' },
    { name: 'Array Methods', description: 'Transform, filter, and reduce collections with built-in array methods.', category: 'Data Structures', type: 'practice' },
    { name: 'Object Destructuring', description: 'Extract values from objects and arrays into distinct variables.', category: 'ES6+', type: 'practice' },
    { name: 'Promises & Async/Await', description: 'Handle asynchronous operations with modern JavaScript patterns.', category: 'Async', type: 'concept' },
    { name: 'DOM Manipulation', description: 'Select, create, and modify HTML elements programmatically.', category: 'Browser', type: 'practice' },
    { name: 'Event Handling', description: 'Attach and manage event listeners for user interactions.', category: 'Browser', type: 'practice' },
    { name: 'REST API Calls', description: 'Fetch data from remote services using fetch and XMLHttpRequest.', category: 'Networking', type: 'project' },
    { name: 'Error Handling', description: 'Use try/catch and error boundaries to handle failures gracefully.', category: 'Fundamentals', type: 'concept' },
    { name: 'TypeScript Generics', description: 'Write flexible, type-safe code with generic type parameters.', category: 'TypeScript', type: 'concept' },
    { name: 'React Components', description: 'Build composable UI with functional and class-based React components.', category: 'React', type: 'project' },
    { name: 'State Management', description: 'Manage application state with hooks, context, and external stores.', category: 'React', type: 'concept' },
    { name: 'CSS Flexbox', description: 'Create flexible one-dimensional layouts with the flexbox model.', category: 'Styling', type: 'practice' },
    { name: 'CSS Grid', description: 'Build two-dimensional layouts with CSS Grid.', category: 'Styling', type: 'practice' },
    { name: 'Git Branching', description: 'Create, merge, and rebase branches for collaborative development.', category: 'Tools', type: 'practice' },
    { name: 'Unit Testing', description: 'Write and run tests to verify individual units of code.', category: 'Testing', type: 'project' },
    { name: 'Dependency Injection', description: 'Decouple components by injecting dependencies at runtime.', category: 'Architecture', type: 'concept' },
    { name: 'Accessibility (a11y)', description: 'Build inclusive interfaces with ARIA roles, labels, and keyboard navigation.', category: 'Browser', type: 'practice' },
    { name: 'WebSocket Communication', description: 'Establish persistent two-way communication channels between client and server.', category: 'Networking', type: 'project' },
];

@injectable()
export class SkillBrowserWidget extends ReactWidget {

    static readonly ID = 'teacher-skill-browser';
    static readonly LABEL = nls.localize('theia/teacher/skillBrowser', 'Skill Library');

    protected searchQuery: string = '';
    protected selectedCategory: string = '';
    protected skills: SkillEntry[] = DEMO_SKILLS;

    protected recentlyUsed: SkillEntry[] = [
        DEMO_SKILLS[5],  // Promises & Async/Await
        DEMO_SKILLS[11], // React Components
        DEMO_SKILLS[3],  // Array Methods
        DEMO_SKILLS[14], // CSS Grid
        DEMO_SKILLS[0],  // Variables & Types
    ];

    @postConstruct()
    protected init(): void {
        this.id = SkillBrowserWidget.ID;
        this.title.label = SkillBrowserWidget.LABEL;
        this.title.caption = SkillBrowserWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-library';
        this.addClass('teacher-skill-browser');
        this.update();
    }

    protected render(): React.ReactNode {
        const categories = Array.from(new Set(this.skills.map(s => s.category))).sort();
        const filtered = this.skills.filter(s => {
            const matchesSearch = !this.searchQuery ||
                s.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                s.description.toLowerCase().includes(this.searchQuery.toLowerCase());
            const matchesCategory = !this.selectedCategory || s.category === this.selectedCategory;
            return matchesSearch && matchesCategory;
        });

        return (
            <div className='teacher-skill-browser-container'>
                <div className='teacher-skill-browser-header'>
                    <h2 className='teacher-skill-browser-title'>
                        <i className='codicon codicon-library'></i>
                        {nls.localize('theia/teacher/skillLibrary', 'Skill Library')}
                    </h2>
                    <span className='teacher-skill-browser-count'>
                        {nls.localize('theia/teacher/skillCount', '{0} skills', filtered.length)}
                    </span>
                </div>
                <div className='teacher-skill-browser-filters'>
                    <div className='teacher-skill-browser-search'>
                        <i className='codicon codicon-search'></i>
                        <input
                            className='theia-input teacher-skill-browser-search-input'
                            type='text'
                            placeholder={nls.localize('theia/teacher/searchSkills', 'Search skills...')}
                            value={this.searchQuery}
                            onChange={this.onSearchChange}
                        />
                    </div>
                    <select
                        className='theia-select teacher-skill-browser-category-select'
                        value={this.selectedCategory}
                        onChange={this.onCategoryChange}
                    >
                        <option value=''>{nls.localize('theia/teacher/allCategories', 'All Categories')}</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                {!this.searchQuery && !this.selectedCategory && this.renderRecentlyUsed()}
                <div className='teacher-skill-browser-list'>
                    {filtered.length === 0 ? (
                        <div className='teacher-skill-browser-empty'>
                            <i className='codicon codicon-info'></i>
                            <p>{nls.localize('theia/teacher/noSkillsFound', 'No skills match your search.')}</p>
                        </div>
                    ) : (
                        filtered.map(skill => this.renderSkillCard(skill))
                    )}
                </div>
            </div>
        );
    }

    protected renderSkillCard(skill: SkillEntry): React.ReactNode {
        return (
            <div key={skill.name} className='teacher-skill-browser-card'>
                <div className='teacher-skill-browser-card-header'>
                    <span className='teacher-skill-browser-card-name'>{skill.name}</span>
                    <span className='teacher-skill-browser-card-type'>{skill.type}</span>
                </div>
                <p className='teacher-skill-browser-card-desc'>{skill.description}</p>
                <div className='teacher-ai-relevance'>
                    <span className='teacher-ai-relevance-label'>
                        {nls.localize('theia/teacher/aiRelevance', 'AI Relevance')}
                    </span>
                    <div className='teacher-ai-relevance-bar'>
                        <div className='teacher-ai-relevance-bar-fill' style={{ width: `${AI_RELEVANCE[skill.name] ?? 50}%` }}></div>
                    </div>
                    <span className='teacher-ai-relevance-pct'>{AI_RELEVANCE[skill.name] ?? 50}%</span>
                </div>
                <div className='teacher-skill-browser-card-bottom'>
                    <span className='teacher-skill-browser-card-category'>
                        <i className='codicon codicon-tag'></i>
                        {skill.category}
                    </span>
                    <span className='teacher-skill-browser-card-used-by'>
                        <i className='codicon codicon-person'></i>
                        {nls.localize('theia/teacher/usedByLearners', 'Used by {0} learners', (USED_BY_COUNT[skill.name] ?? 500).toLocaleString())}
                    </span>
                </div>
            </div>
        );
    }

    protected renderRecentlyUsed(): React.ReactNode {
        return (
            <div className='teacher-skill-browser-recent'>
                <h3 className='teacher-skill-browser-recent-title'>
                    <i className='codicon codicon-history'></i>
                    {nls.localize('theia/teacher/recentlyUsed', 'Recently Used')}
                </h3>
                <div className='teacher-skill-browser-recent-list'>
                    {this.recentlyUsed.map(skill => (
                        <div key={skill.name} className='teacher-skill-browser-recent-chip'>
                            <span className='teacher-skill-browser-recent-chip-name'>{skill.name}</span>
                            <span className='teacher-skill-browser-recent-chip-category'>
                                <i className='codicon codicon-tag'></i>
                                {skill.category}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    protected onSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.searchQuery = e.target.value;
        this.update();
    };

    protected onCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        this.selectedCategory = e.target.value;
        this.update();
    };
}
