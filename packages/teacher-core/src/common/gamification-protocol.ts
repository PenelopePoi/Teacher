/** Service path for the gamification backend service. */
export const GAMIFICATION_PATH = '/services/gamification';

/** Symbol for dependency injection of the GamificationService. */
export const GamificationService = Symbol('GamificationService');

/**
 * Player profile containing XP, level, streak, and achievement data.
 */
export interface PlayerProfile {
    xp: number;
    level: number;
    title: string;
    streak: number;
    longestStreak: number;
    totalLessons: number;
    totalChallenges: number;
    achievements: Achievement[];
    unlockedRewards: string[];
    dailyXPEarned: number;
    weeklyXPEarned: number;
}

/**
 * A single achievement (trophy) that can be unlocked through actions.
 */
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    unlockedAt?: string;
    progress?: number;
    maxProgress?: number;
}

/**
 * An event recording XP earned from a specific source.
 */
export interface XPEvent {
    source: string;
    amount: number;
    multiplier: number;
    timestamp: string;
}

/**
 * Definition of a single level with its title, XP threshold, and rewards.
 */
export interface LevelDefinition {
    level: number;
    title: string;
    xpRequired: number;
    rewards: string[];
}

/**
 * A challenge (daily, weekly, or milestone) with XP reward.
 */
export interface Challenge {
    id: string;
    name: string;
    description: string;
    type: 'daily' | 'weekly' | 'milestone';
    xpReward: number;
    progress: number;
    target: number;
    completed: boolean;
    expiresAt?: string;
}

/**
 * Gamification service providing XP, levels, achievements, and challenges.
 */
export interface GamificationService {
    getProfile(): Promise<PlayerProfile>;
    addXP(source: string, amount: number): Promise<XPEvent>;
    getLevel(xp: number): LevelDefinition;
    getAchievements(): Promise<Achievement[]>;
    unlockAchievement(id: string): Promise<Achievement>;
    getChallenges(): Promise<Challenge[]>;
    getLeaderboard(): Promise<Array<{ name: string; xp: number; level: number }>>;
    getXPHistory(days: number): Promise<XPEvent[]>;
}
