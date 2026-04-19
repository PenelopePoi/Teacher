import { ReactWidget } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { Achievement } from '../../common/gamification-protocol';

type FilterMode = 'all' | 'unlocked' | 'locked' | 'rarity';

const RARITY_ORDER: Achievement['rarity'][] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

const ALL_ACHIEVEMENTS: Achievement[] = [
    // Code Milestones
    { id: 'hello-world', name: 'Hello World', description: 'Write your first program', icon: 'codicon codicon-code', rarity: 'common', unlockedAt: '2026-03-01T10:00:00Z' },
    { id: 'bug-hunter', name: 'Bug Hunter', description: 'Fix your first error', icon: 'codicon codicon-bug', rarity: 'common', unlockedAt: '2026-03-02T14:00:00Z' },
    { id: 'loop-de-loop', name: 'Loop de Loop', description: 'Use a loop for the first time', icon: 'codicon codicon-sync', rarity: 'common', unlockedAt: '2026-03-03T09:00:00Z' },
    { id: 'function-junction', name: 'Function Junction', description: 'Write your first function', icon: 'codicon codicon-symbol-method', rarity: 'common', unlockedAt: '2026-03-05T11:00:00Z' },
    { id: 'array-master', name: 'Array Master', description: 'Use 5 different array methods', icon: 'codicon codicon-symbol-array', rarity: 'uncommon', unlockedAt: '2026-03-10T16:00:00Z' },
    { id: 'promise-keeper', name: 'Promise Keeper', description: 'Write your first async/await', icon: 'codicon codicon-clock', rarity: 'uncommon' },
    { id: 'dom-wizard', name: 'DOM Wizard', description: 'Manipulate the DOM 10 times', icon: 'codicon codicon-browser', rarity: 'uncommon', progress: 6, maxProgress: 10 },
    { id: 'api-explorer', name: 'API Explorer', description: 'Make your first API call', icon: 'codicon codicon-cloud', rarity: 'uncommon' },
    { id: 'test-writer', name: 'Test Writer', description: 'Write your first unit test', icon: 'codicon codicon-beaker', rarity: 'rare' },
    { id: 'type-safe', name: 'Type Safe', description: 'Use TypeScript types in a project', icon: 'codicon codicon-shield', rarity: 'rare' },

    // Learning Milestones
    { id: 'first-lesson', name: 'First Lesson', description: 'Complete your first lesson', icon: 'codicon codicon-book', rarity: 'common', unlockedAt: '2026-03-01T10:30:00Z' },
    { id: 'week-warrior', name: 'Week Warrior', description: 'Complete 7 lessons in a week', icon: 'codicon codicon-calendar', rarity: 'uncommon', unlockedAt: '2026-03-08T18:00:00Z' },
    { id: 'perfect-score', name: 'Perfect Score', description: 'Get 100% on a quiz', icon: 'codicon codicon-verified', rarity: 'uncommon', unlockedAt: '2026-03-12T12:00:00Z' },
    { id: 'speed-learner', name: 'Speed Learner', description: 'Complete a lesson in under 10 min', icon: 'codicon codicon-rocket', rarity: 'rare' },
    { id: 'knowledge-base', name: 'Knowledge Base', description: 'Master 20 concepts', icon: 'codicon codicon-database', rarity: 'rare', progress: 14, maxProgress: 20 },
    { id: 'curriculum-complete', name: 'Curriculum Complete', description: 'Finish an entire course', icon: 'codicon codicon-mortar-board', rarity: 'epic' },
    { id: 'polyglot', name: 'Polyglot', description: 'Complete lessons in 3 languages', icon: 'codicon codicon-globe', rarity: 'epic' },
    { id: 'unstoppable', name: 'Unstoppable', description: '30-day streak', icon: 'codicon codicon-flame', rarity: 'legendary' },

    // Social & Meta
    { id: 'night-owl', name: 'Night Owl', description: 'Code after midnight', icon: 'codicon codicon-eye', rarity: 'common', unlockedAt: '2026-03-15T01:00:00Z' },
    { id: 'early-bird', name: 'Early Bird', description: 'Code before 7am', icon: 'codicon codicon-light-bulb', rarity: 'common', unlockedAt: '2026-04-01T06:30:00Z' },
    { id: 'marathon-coder', name: 'Marathon Coder', description: '4+ hours in one session', icon: 'codicon codicon-watch', rarity: 'uncommon', unlockedAt: '2026-03-20T22:00:00Z' },
    { id: 'skill-collector', name: 'Skill Collector', description: 'Use 10 different skills', icon: 'codicon codicon-extensions', rarity: 'uncommon', progress: 7, maxProgress: 10 },
    { id: 'workflow-builder', name: 'Workflow Builder', description: 'Create a custom workflow', icon: 'codicon codicon-git-merge', rarity: 'rare' },
    { id: 'ai-whisperer', name: 'AI Whisperer', description: 'Have 50 AI conversations', icon: 'codicon codicon-comment-discussion', rarity: 'rare', progress: 32, maxProgress: 50 },
    { id: 'deep-thinker', name: 'Deep Thinker', description: 'Use Plan Mode 10 times', icon: 'codicon codicon-lightbulb', rarity: 'rare', unlockedAt: '2026-04-10T14:00:00Z' },
    { id: 'time-traveler', name: 'Time Traveler', description: 'Use rewind 5 times', icon: 'codicon codicon-history', rarity: 'uncommon' },
    { id: 'teachers-pet', name: "Teacher's Pet", description: 'Rate 20 AI suggestions', icon: 'codicon codicon-thumbsup', rarity: 'epic' },
    { id: 'open-source', name: 'Open Source', description: 'Export a project', icon: 'codicon codicon-github', rarity: 'epic' },
    { id: 'mentor', name: 'Mentor', description: "Help debug someone else's code", icon: 'codicon codicon-heart', rarity: 'legendary' },
    { id: 'grand-master', name: 'Grand Master', description: 'Reach Level 50', icon: 'codicon codicon-star-full', rarity: 'legendary' },
];

const RARITY_LABEL: Record<Achievement['rarity'], string> = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
};

@injectable()
export class AchievementsWidget extends ReactWidget {

    static readonly ID = 'teacher-achievements';
    static readonly LABEL = nls.localize('theia/teacher/achievements', 'Achievements');

    protected achievements: Achievement[] = ALL_ACHIEVEMENTS;
    protected filter: FilterMode = 'all';

    @postConstruct()
    protected init(): void {
        this.id = AchievementsWidget.ID;
        this.title.label = AchievementsWidget.LABEL;
        this.title.caption = AchievementsWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-trophy';
        this.addClass('teacher-achievements');
        this.update();
    }

    protected setFilter = (mode: FilterMode): void => {
        this.filter = mode;
        this.update();
    };

    protected renderNextAchievement(): React.ReactNode {
        const inProgress = this.achievements.filter(a => !a.unlockedAt && a.progress !== undefined && a.maxProgress !== undefined);
        if (inProgress.length === 0) { return null; }
        const closest = inProgress.sort((a, b) => ((b.progress ?? 0) / (b.maxProgress ?? 1)) - ((a.progress ?? 0) / (a.maxProgress ?? 1)))[0];
        const pct = Math.round(((closest.progress ?? 0) / (closest.maxProgress ?? 1)) * 100);

        return (
            <div className='teacher-achievements-next'>
                <i className='codicon codicon-star-half'></i>
                <span className='teacher-achievements-next-text'>
                    {nls.localize('theia/teacher/almostThere', "Almost there! '{0}' \u2014 {1}/{2}", closest.name, closest.progress ?? 0, closest.maxProgress ?? 0)}
                </span>
                <div className='teacher-achievements-next-bar'>
                    <div className='teacher-achievements-next-bar-fill' style={{ width: `${pct}%` }}></div>
                </div>
            </div>
        );
    }

    protected renderRarityStats(): React.ReactNode {
        const counts: Record<string, { unlocked: number; total: number }> = {};
        for (const rarity of RARITY_ORDER) {
            const all = this.achievements.filter(a => a.rarity === rarity);
            const unlocked = all.filter(a => !!a.unlockedAt);
            counts[rarity] = { unlocked: unlocked.length, total: all.length };
        }

        return (
            <div className='teacher-achievements-rarity-stats'>
                {RARITY_ORDER.slice().reverse().map(r => (
                    <span key={r} className={`teacher-achievements-rarity-stat teacher-achievements-rarity-stat--${r}`}>
                        {RARITY_LABEL[r]}: {counts[r].unlocked}/{counts[r].total}
                    </span>
                ))}
            </div>
        );
    }

    protected getFiltered(): Achievement[] {
        switch (this.filter) {
            case 'unlocked':
                return this.achievements.filter(a => !!a.unlockedAt);
            case 'locked':
                return this.achievements.filter(a => !a.unlockedAt);
            case 'rarity':
                return [...this.achievements].sort((a, b) =>
                    RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)
                );
            default:
                return this.achievements;
        }
    }

    protected render(): React.ReactNode {
        const unlocked = this.achievements.filter(a => !!a.unlockedAt).length;
        const total = this.achievements.length;
        const pct = Math.round((unlocked / total) * 100);
        const filtered = this.getFiltered();

        return (
            <div className='teacher-achievements-container'>
                <h1 className='teacher-achievements-title'>
                    <i className='codicon codicon-trophy'></i>
                    {nls.localize('theia/teacher/achievementsTitle', 'Achievements')}
                </h1>

                <div className='teacher-achievements-summary'>
                    <span className='teacher-achievements-summary-count'>{unlocked} / {total}</span>
                    <span className='teacher-achievements-summary-label'>
                        {nls.localize('theia/teacher/unlocked', 'Unlocked')} ({pct}%)
                    </span>
                </div>

                {this.renderNextAchievement()}
                {this.renderRarityStats()}

                <div className='teacher-achievements-filters'>
                    {(['all', 'unlocked', 'locked', 'rarity'] as FilterMode[]).map(mode => (
                        <button
                            key={mode}
                            className={`teacher-achievements-filter ${this.filter === mode ? 'teacher-achievements-filter--active' : ''}`}
                            onClick={() => this.setFilter(mode)}
                        >
                            {nls.localize(`theia/teacher/filter${mode}`, mode.charAt(0).toUpperCase() + mode.slice(1))}
                        </button>
                    ))}
                </div>

                <div className='teacher-achievements-grid'>
                    {filtered.map(a => this.renderCard(a))}
                </div>
            </div>
        );
    }

    protected renderCard(a: Achievement): React.ReactNode {
        const isUnlocked = !!a.unlockedAt;
        const hasProgress = a.progress !== undefined && a.maxProgress !== undefined;

        return (
            <div
                key={a.id}
                className={`teacher-achievements-card teacher-achievements-card--${a.rarity} ${!isUnlocked ? 'teacher-achievements-card--locked' : ''}`}
            >
                <div className='teacher-achievements-card-icon'>
                    <i className={isUnlocked ? a.icon : 'codicon codicon-question'}></i>
                </div>
                <div className='teacher-achievements-card-body'>
                    <span className='teacher-achievements-card-name'>{a.name}</span>
                    <span className='teacher-achievements-card-desc'>{a.description}</span>
                    {hasProgress && !isUnlocked && (
                        <div className='teacher-achievements-card-progress'>
                            <div className='teacher-achievements-card-progress-bar'>
                                <div
                                    className='teacher-achievements-card-progress-fill'
                                    style={{ width: `${((a.progress ?? 0) / (a.maxProgress ?? 1)) * 100}%` }}
                                ></div>
                            </div>
                            <span className='teacher-achievements-card-progress-text'>
                                {a.progress}/{a.maxProgress}
                            </span>
                        </div>
                    )}
                    {isUnlocked && (
                        <span className='teacher-achievements-card-date'>
                            {new Date(a.unlockedAt!).toLocaleDateString()}
                        </span>
                    )}
                </div>
                <span className={`teacher-achievements-card-rarity teacher-achievements-card-rarity--${a.rarity}`}>
                    {RARITY_LABEL[a.rarity]}
                </span>
            </div>
        );
    }
}
