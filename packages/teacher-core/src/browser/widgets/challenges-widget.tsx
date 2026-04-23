import { ReactWidget } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { GamificationService, Challenge } from '../../common/gamification-protocol';

const DEMO_CHALLENGES: Challenge[] = [
    // Daily
    { id: 'daily-write-50', name: 'Write 50 Lines', description: 'Write 50 lines of code today', type: 'daily', xpReward: 100, progress: 0, target: 50, completed: false, expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString() },
    { id: 'daily-fix-3', name: 'Fix 3 Bugs', description: 'Fix 3 bugs today', type: 'daily', xpReward: 150, progress: 1, target: 3, completed: false, expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString() },
    { id: 'daily-learn-2', name: 'Learn 2 Concepts', description: 'Learn 2 new concepts today', type: 'daily', xpReward: 200, progress: 0, target: 2, completed: false, expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString() },
    // Weekly
    { id: 'weekly-5-lessons', name: 'Complete 5 Lessons', description: 'Complete 5 lessons this week', type: 'weekly', xpReward: 500, progress: 2, target: 5, completed: false, expiresAt: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString() },
    { id: 'weekly-streak-7', name: 'Maintain 7-Day Streak', description: 'Keep your streak going for 7 days', type: 'weekly', xpReward: 1000, progress: 5, target: 7, completed: false, expiresAt: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString() },
    // Milestone
    { id: 'milestone-level-15', name: 'Reach Level 15', description: 'Level up to 15', type: 'milestone', xpReward: 2000, progress: 12, target: 15, completed: false },
];

const formatTimeLeft = (expiresAt?: string): string => {
    if (!expiresAt) { return ''; }
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) { return 'Expired'; }
    const hours = Math.floor(ms / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) { return `${days}d left`; }
    return `${hours}h left`;
};

@injectable()
export class ChallengesWidget extends ReactWidget {

    static readonly ID = 'teacher-challenges';
    static readonly LABEL = nls.localize('theia/teacher/challenges', 'Challenges');

    @inject(GamificationService)
    protected readonly gamificationService: GamificationService;

    protected challenges: Challenge[] = DEMO_CHALLENGES;

    @postConstruct()
    protected init(): void {
        this.id = ChallengesWidget.ID;
        this.title.label = ChallengesWidget.LABEL;
        this.title.caption = ChallengesWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-flame';
        this.addClass('teacher-challenges');
        this.loadFromBackend();
        this.update();
    }

    protected async loadFromBackend(): Promise<void> {
        try {
            const challenges = await this.gamificationService.getChallenges();
            if (challenges && challenges.length > 0) {
                this.challenges = challenges;
                this.update();
            }
        } catch {
            // Backend unavailable, keep demo data
        }
    }

    protected render(): React.ReactNode {
        const daily = this.challenges.filter(c => c.type === 'daily');
        const weekly = this.challenges.filter(c => c.type === 'weekly');
        const milestone = this.challenges.filter(c => c.type === 'milestone');

        const streakDays = 7;

        return (
            <div className='teacher-challenges-container'>
                <h1 className='teacher-challenges-title'>
                    <i className='codicon codicon-flame'></i>
                    {nls.localize('theia/teacher/challengesTitle', 'Challenges')}
                </h1>

                {streakDays >= 7 && (
                    <div className='teacher-streak-banner'>
                        <i className='codicon codicon-flame'></i>
                        <span>{nls.localize('theia/teacher/streakBonusBanner', '2x XP active \u2014 7-day streak!')}</span>
                    </div>
                )}

                <div className='teacher-challenges-ai-generated'>
                    <div className='teacher-challenges-ai-generated-header'>
                        <i className='codicon codicon-sparkle'></i>
                        <span className='teacher-challenges-ai-generated-title'>
                            {nls.localize('theia/teacher/aiGeneratedChallenge', 'AI-Generated Challenge')}
                        </span>
                        <span className='teacher-challenges-ai-generated-xp'>250 XP</span>
                    </div>
                    <p className='teacher-challenges-ai-generated-desc'>
                        {nls.localize(
                            'theia/teacher/aiChallengeDesc',
                            'Based on your recent work: Write a function that converts Celsius to Fahrenheit using what you learned about parameters'
                        )}
                    </p>
                    <div className='teacher-challenges-ai-generated-bar'>
                        <div className='teacher-challenges-ai-generated-bar-fill' style={{ width: '0%' }}></div>
                    </div>
                </div>

                {this.renderSection(nls.localize('theia/teacher/dailyChallenges', 'Daily Challenges'), daily)}
                {this.renderSection(nls.localize('theia/teacher/weeklyChallenges', 'Weekly Challenges'), weekly)}
                {this.renderSection(nls.localize('theia/teacher/milestoneChallenges', 'Milestone Challenges'), milestone)}
            </div>
        );
    }

    protected renderSection(title: string, challenges: Challenge[]): React.ReactNode {
        return (
            <div className='teacher-challenges-section'>
                <h2 className='teacher-challenges-section-title'>{title}</h2>
                <div className='teacher-challenges-list'>
                    {challenges.map(c => this.renderChallenge(c))}
                </div>
            </div>
        );
    }

    protected renderChallenge(c: Challenge): React.ReactNode {
        const pct = Math.min(100, (c.progress / c.target) * 100);
        const isExpiringSoon = c.expiresAt && (new Date(c.expiresAt).getTime() - Date.now()) < 4 * 3600 * 1000;

        return (
            <div
                key={c.id}
                className={`teacher-challenges-card ${c.completed ? 'teacher-challenges-card--completed' : ''}`}
            >
                <div className='teacher-challenges-card-progress-bar' style={{ height: `${pct}%` }}></div>
                <div className='teacher-challenges-card-content'>
                    <div className='teacher-challenges-card-header'>
                        <span className='teacher-challenges-card-name'>{c.name}</span>
                        <span className='teacher-challenges-card-xp'>
                            {c.completed
                                ? nls.localize('theia/teacher/claimed', 'Claimed')
                                : `${c.xpReward} XP`
                            }
                        </span>
                    </div>
                    <span className='teacher-challenges-card-desc'>{c.description}</span>
                    <div className='teacher-challenges-card-footer'>
                        <div className='teacher-challenges-card-bar'>
                            <div className='teacher-challenges-card-bar-fill' style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className='teacher-challenges-card-progress-text'>
                            {c.progress} / {c.target}
                        </span>
                        {c.expiresAt && (
                            <span className={`teacher-challenges-card-timer ${isExpiringSoon ? 'teacher-challenges-card-timer--urgent' : ''}`}>
                                {formatTimeLeft(c.expiresAt)}
                            </span>
                        )}
                    </div>
                </div>
                {c.completed && (
                    <div className='teacher-challenges-card-check'>
                        <i className='codicon codicon-check'></i>
                    </div>
                )}
            </div>
        );
    }
}
