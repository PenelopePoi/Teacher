import { injectable } from '@theia/core/shared/inversify';
import {
    GamificationService,
    PlayerProfile,
    Achievement,
    XPEvent,
    LevelDefinition,
    Challenge,
} from '../common/gamification-protocol';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/** Level definitions — XP thresholds, titles, and unlocked rewards. */
const LEVELS: LevelDefinition[] = [
    { level: 1, title: 'Newcomer', xpRequired: 0, rewards: [] },
    { level: 2, title: 'Curious', xpRequired: 100, rewards: ['dark-theme'] },
    { level: 3, title: 'Explorer', xpRequired: 300, rewards: ['custom-snippets'] },
    { level: 4, title: 'Apprentice', xpRequired: 600, rewards: ['focus-mode'] },
    { level: 5, title: 'Builder', xpRequired: 1000, rewards: ['workspace-templates'] },
    { level: 6, title: 'Craftsman', xpRequired: 1500, rewards: ['ai-review'] },
    { level: 7, title: 'Specialist', xpRequired: 2200, rewards: ['skill-workflows'] },
    { level: 8, title: 'Expert', xpRequired: 3000, rewards: ['plan-mode'] },
    { level: 9, title: 'Master', xpRequired: 4000, rewards: ['autonomous-mode'] },
    { level: 10, title: 'Teacher', xpRequired: 5500, rewards: ['curriculum-authoring'] },
];

/** Built-in achievements that can be unlocked. */
const BUILTIN_ACHIEVEMENTS: Achievement[] = [
    { id: 'first-xp', name: 'First Steps', description: 'Earn your first XP.', icon: 'codicon-star-empty', rarity: 'common' },
    { id: 'level-5', name: 'Builder Badge', description: 'Reach Level 5.', icon: 'codicon-star-half', rarity: 'uncommon' },
    { id: 'level-10', name: 'Teacher Badge', description: 'Reach Level 10.', icon: 'codicon-star-full', rarity: 'legendary' },
    { id: 'streak-3', name: 'Three-Day Streak', description: 'Code 3 days in a row.', icon: 'codicon-flame', rarity: 'common' },
    { id: 'streak-7', name: 'Week Warrior', description: 'Code 7 days in a row.', icon: 'codicon-flame', rarity: 'uncommon' },
    { id: 'streak-30', name: 'Monthly Master', description: 'Code 30 days in a row.', icon: 'codicon-flame', rarity: 'epic' },
    { id: 'xp-1000', name: 'Kilopoint', description: 'Accumulate 1,000 XP.', icon: 'codicon-zap', rarity: 'uncommon' },
    { id: 'xp-5000', name: 'XP Hoarder', description: 'Accumulate 5,000 XP.', icon: 'codicon-zap', rarity: 'rare' },
    { id: 'challenge-10', name: 'Challenger', description: 'Complete 10 challenges.', icon: 'codicon-trophy', rarity: 'uncommon' },
    { id: 'lesson-complete', name: 'First Lesson', description: 'Complete your first lesson.', icon: 'codicon-book', rarity: 'common' },
];

@injectable()
export class GamificationServiceImpl implements GamificationService {

    protected dataDir(): string {
        return path.join(os.homedir(), '.teacher', 'gamification');
    }

    protected profilePath(): string {
        return path.join(this.dataDir(), 'profile.json');
    }

    protected xpHistoryPath(): string {
        return path.join(this.dataDir(), 'xp-history.json');
    }

    protected ensureDir(): void {
        const dir = this.dataDir();
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    protected loadProfile(): PlayerProfile {
        try {
            const raw = fs.readFileSync(this.profilePath(), 'utf-8');
            return JSON.parse(raw);
        } catch {
            return this.createDefaultProfile();
        }
    }

    protected saveProfile(profile: PlayerProfile): void {
        this.ensureDir();
        const tmp = this.profilePath() + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(profile, undefined, 2), 'utf-8');
        fs.renameSync(tmp, this.profilePath());
    }

    protected loadXPHistory(): XPEvent[] {
        try {
            const raw = fs.readFileSync(this.xpHistoryPath(), 'utf-8');
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    protected saveXPHistory(history: XPEvent[]): void {
        this.ensureDir();
        const tmp = this.xpHistoryPath() + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(history, undefined, 2), 'utf-8');
        fs.renameSync(tmp, this.xpHistoryPath());
    }

    protected createDefaultProfile(): PlayerProfile {
        return {
            xp: 0,
            level: 1,
            title: 'Newcomer',
            streak: 0,
            longestStreak: 0,
            totalLessons: 0,
            totalChallenges: 0,
            achievements: [],
            unlockedRewards: [],
            dailyXPEarned: 0,
            weeklyXPEarned: 0,
        };
    }

    async getProfile(): Promise<PlayerProfile> {
        return this.loadProfile();
    }

    async addXP(source: string, amount: number): Promise<XPEvent> {
        const profile = this.loadProfile();
        const multiplier = profile.streak >= 7 ? 1.5 : profile.streak >= 3 ? 1.2 : 1.0;
        const finalAmount = Math.round(amount * multiplier);

        const event: XPEvent = {
            source,
            amount: finalAmount,
            multiplier,
            timestamp: new Date().toISOString(),
        };

        profile.xp += finalAmount;
        profile.dailyXPEarned += finalAmount;
        profile.weeklyXPEarned += finalAmount;

        // Level up check
        const newLevel = this.getLevel(profile.xp);
        if (newLevel.level > profile.level) {
            profile.level = newLevel.level;
            profile.title = newLevel.title;
            profile.unlockedRewards.push(...newLevel.rewards);
            console.info(`[Gamification] Level up! ${newLevel.level} — ${newLevel.title}`);
        }

        // Auto-unlock achievements
        if (profile.achievements.every(a => a.id !== 'first-xp')) {
            profile.achievements.push({ ...BUILTIN_ACHIEVEMENTS[0], unlockedAt: new Date().toISOString() });
        }
        if (profile.xp >= 1000 && profile.achievements.every(a => a.id !== 'xp-1000')) {
            profile.achievements.push({ ...BUILTIN_ACHIEVEMENTS.find(a => a.id === 'xp-1000')!, unlockedAt: new Date().toISOString() });
        }
        if (profile.xp >= 5000 && profile.achievements.every(a => a.id !== 'xp-5000')) {
            profile.achievements.push({ ...BUILTIN_ACHIEVEMENTS.find(a => a.id === 'xp-5000')!, unlockedAt: new Date().toISOString() });
        }

        this.saveProfile(profile);

        // Append to history
        const history = this.loadXPHistory();
        history.push(event);
        this.saveXPHistory(history);

        return event;
    }

    getLevel(xp: number): LevelDefinition {
        let result = LEVELS[0];
        for (const level of LEVELS) {
            if (xp >= level.xpRequired) {
                result = level;
            } else {
                break;
            }
        }
        return result;
    }

    async getAchievements(): Promise<Achievement[]> {
        const profile = this.loadProfile();
        // Merge unlocked status into the full list
        return BUILTIN_ACHIEVEMENTS.map(a => {
            const unlocked = profile.achievements.find(u => u.id === a.id);
            return unlocked ? { ...a, ...unlocked } : a;
        });
    }

    async unlockAchievement(id: string): Promise<Achievement> {
        const profile = this.loadProfile();
        const existing = profile.achievements.find(a => a.id === id);
        if (existing) {
            return existing;
        }

        const template = BUILTIN_ACHIEVEMENTS.find(a => a.id === id);
        const achievement: Achievement = {
            ...(template || { id, name: id, description: '', icon: 'codicon-trophy', rarity: 'common' as const }),
            unlockedAt: new Date().toISOString(),
        };
        profile.achievements.push(achievement);
        this.saveProfile(profile);
        console.info(`[Gamification] Achievement unlocked: ${achievement.name}`);
        return achievement;
    }

    async getChallenges(): Promise<Challenge[]> {
        const today = new Date().toISOString().split('T')[0];
        return [
            {
                id: `daily-lesson-${today}`,
                name: 'Daily Lesson',
                description: 'Complete one lesson today.',
                type: 'daily',
                xpReward: 50,
                progress: 0,
                target: 1,
                completed: false,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                id: `daily-concept-${today}`,
                name: 'Concept Explorer',
                description: 'Learn 3 new concepts today.',
                type: 'daily',
                xpReward: 30,
                progress: 0,
                target: 3,
                completed: false,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                id: 'weekly-streak',
                name: 'Streak Week',
                description: 'Maintain a 7-day coding streak.',
                type: 'weekly',
                xpReward: 200,
                progress: 0,
                target: 7,
                completed: false,
            },
            {
                id: 'milestone-10-lessons',
                name: 'Ten Down',
                description: 'Complete 10 lessons total.',
                type: 'milestone',
                xpReward: 500,
                progress: 0,
                target: 10,
                completed: false,
            },
        ];
    }

    async getLeaderboard(): Promise<Array<{ name: string; xp: number; level: number }>> {
        // Single-player for now — return the current profile
        const profile = this.loadProfile();
        return [{ name: 'You', xp: profile.xp, level: profile.level }];
    }

    async getXPHistory(days: number): Promise<XPEvent[]> {
        const history = this.loadXPHistory();
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        return history.filter(e => new Date(e.timestamp).getTime() >= cutoff);
    }
}
