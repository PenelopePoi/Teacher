import { ReactWidget } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { PlayerProfile, LevelDefinition } from '../../common/gamification-protocol';

/** Level title map — level number to title string. */
const LEVEL_TITLES: Record<number, string> = {
    1: 'Curious Beginner',
    2: 'First Steps',
    3: 'Getting the Hang of It',
    5: 'Code Padawan',
    8: 'Bug Squasher',
    10: 'Loop Master',
    13: 'Function Wizard',
    15: 'Code Apprentice',
    18: 'Debug Detective',
    20: 'Algorithm Alchemist',
    25: 'Full Stack Explorer',
    30: 'Code Architect',
    35: 'Open Source Hero',
    40: 'Teaching Assistant',
    50: 'Grand Master',
};

const getTitleForLevel = (level: number): string => {
    const levels = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a);
    for (const l of levels) {
        if (level >= l) {
            return LEVEL_TITLES[l];
        }
    }
    return 'Curious Beginner';
};

const getXPForLevel = (level: number): number => level * 200;

const getLevelTierClass = (level: number): string => {
    if (level >= 31) { return 'teacher-xp-level-badge--purple'; }
    if (level >= 21) { return 'teacher-xp-level-badge--amber'; }
    if (level >= 11) { return 'teacher-xp-level-badge--green'; }
    return 'teacher-xp-level-badge--blue';
};

const getLevelDefinition = (xp: number): LevelDefinition => {
    let level = 1;
    let accumulated = 0;
    while (accumulated + getXPForLevel(level) <= xp) {
        accumulated += getXPForLevel(level);
        level++;
    }
    return {
        level,
        title: getTitleForLevel(level),
        xpRequired: getXPForLevel(level),
        rewards: [],
    };
};

@injectable()
export class XPLevelWidget extends ReactWidget {

    static readonly ID = 'teacher-xp-level';
    static readonly LABEL = nls.localize('theia/teacher/playerProfile', 'Player Profile');

    protected profile: PlayerProfile;
    protected weeklyXPBars: number[] = [45, 80, 120, 60, 95, 150, 340];

    @postConstruct()
    protected init(): void {
        this.id = XPLevelWidget.ID;
        this.title.label = XPLevelWidget.LABEL;
        this.title.caption = XPLevelWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-star-full';
        this.addClass('teacher-xp-level');
        this.loadDemoData();
    }

    protected loadDemoData(): void {
        this.profile = {
            xp: 11250,
            level: 12,
            title: 'Code Apprentice',
            streak: 7,
            longestStreak: 14,
            totalLessons: 42,
            totalChallenges: 18,
            achievements: [],
            unlockedRewards: [],
            dailyXPEarned: 340,
            weeklyXPEarned: 890,
        };
        this.update();
    }

    protected render(): React.ReactNode {
        const p = this.profile;
        const levelDef = getLevelDefinition(p.xp);
        const currentLevelXP = getXPForLevel(p.level);
        let xpIntoLevel = p.xp;
        for (let i = 1; i < p.level; i++) {
            xpIntoLevel -= getXPForLevel(i);
        }
        const pct = Math.min(100, (xpIntoLevel / currentLevelXP) * 100);
        const streakMultiplier = p.streak >= 7 ? 2 : p.streak >= 3 ? 1.5 : 1;
        const maxBar = Math.max(...this.weeklyXPBars, 1);

        return (
            <div className='teacher-xp-level-container'>
                <div className='teacher-xp-level-header'>
                    <div className={`teacher-xp-level-badge ${getLevelTierClass(p.level)}`}>
                        <span className='teacher-xp-level-badge-num'>{p.level}</span>
                    </div>
                    <div className='teacher-xp-level-info'>
                        <span className='teacher-xp-level-title'>{levelDef.title}</span>
                        <div className='teacher-xp-level-bar-wrap'>
                            <div className='teacher-xp-level-bar'>
                                <div className='teacher-xp-level-bar-fill' style={{ width: `${pct}%` }}></div>
                            </div>
                            <span className='teacher-xp-level-bar-text'>
                                {xpIntoLevel.toLocaleString()} / {currentLevelXP.toLocaleString()} {nls.localize('theia/teacher/xp', 'XP')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className='teacher-xp-level-streak'>
                    <div className='teacher-xp-level-streak-left'>
                        <i className='codicon codicon-flame teacher-xp-level-flame'></i>
                        <span className='teacher-xp-level-streak-count'>{p.streak}</span>
                        <span className='teacher-xp-level-streak-label'>
                            {nls.localize('theia/teacher/dayStreak', 'day streak')}
                        </span>
                    </div>
                    {streakMultiplier > 1 && (
                        <span className='teacher-xp-level-multiplier'>{streakMultiplier}x {nls.localize('theia/teacher/xp', 'XP')}</span>
                    )}
                </div>

                <div className='teacher-xp-level-today'>
                    <div className='teacher-xp-level-today-header'>
                        <span className='teacher-xp-level-today-amount'>+{p.dailyXPEarned} {nls.localize('theia/teacher/xpToday', 'XP today')}</span>
                    </div>
                    <div className='teacher-xp-level-today-chart'>
                        {this.weeklyXPBars.map((v, i) => (
                            <div
                                key={i}
                                className='teacher-xp-level-today-bar'
                                style={{ height: `${(v / maxBar) * 100}%` }}
                                title={`${v} XP`}
                            ></div>
                        ))}
                    </div>
                </div>

                <div className='teacher-xp-level-stats'>
                    <div className='teacher-xp-level-stat'>
                        <span className='teacher-xp-level-stat-value'>{p.totalLessons}</span>
                        <span className='teacher-xp-level-stat-label'>
                            {nls.localize('theia/teacher/totalLessons', 'Lessons')}
                        </span>
                    </div>
                    <div className='teacher-xp-level-stat'>
                        <span className='teacher-xp-level-stat-value'>{p.totalChallenges}</span>
                        <span className='teacher-xp-level-stat-label'>
                            {nls.localize('theia/teacher/challengesDone', 'Challenges')}
                        </span>
                    </div>
                    <div className='teacher-xp-level-stat'>
                        <span className='teacher-xp-level-stat-value'>{p.achievements.length}</span>
                        <span className='teacher-xp-level-stat-label'>
                            {nls.localize('theia/teacher/achievementsLabel', 'Achievements')}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
}
