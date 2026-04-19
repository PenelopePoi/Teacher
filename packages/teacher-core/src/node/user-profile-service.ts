import { injectable } from '@theia/core/shared/inversify';
import {
    UserProfileService, UserProfile, UserProfileMutable,
    LearningSession, Achievement, StreakInfo, BUILT_IN_ACHIEVEMENTS
} from '../common/user-profile-protocol';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

@injectable()
export class UserProfileServiceImpl implements UserProfileService {

    protected readonly profileDir = path.join(os.homedir(), '.teacher', 'profile');
    protected readonly profilePath = path.join(this.profileDir, 'user-profile.json');
    protected readonly sessionsPath = path.join(this.profileDir, 'sessions.json');

    protected ensureDir(): void {
        if (!fs.existsSync(this.profileDir)) {
            fs.mkdirSync(this.profileDir, { recursive: true });
        }
    }

    async getProfile(): Promise<UserProfile> {
        this.ensureDir();
        if (fs.existsSync(this.profilePath)) {
            try {
                const raw = fs.readFileSync(this.profilePath, 'utf-8');
                return JSON.parse(raw);
            } catch {
                console.warn('[UserProfile] Corrupted profile, creating fresh');
            }
        }
        const profile = this.createDefault();
        this.saveProfile(profile);
        return profile;
    }

    async updateProfile(updates: Partial<UserProfileMutable>): Promise<UserProfile> {
        const profile = await this.getProfile();
        Object.assign(profile, updates);
        profile.lastActiveAt = new Date().toISOString();
        this.saveProfile(profile);
        return profile;
    }

    async recordSession(session: LearningSession): Promise<void> {
        const profile = await this.getProfile();
        profile.totalSessions += 1;
        profile.totalMinutes += session.durationMinutes;
        profile.lessonsCompleted += session.assessmentScores.filter(s => s.score >= 70).length;
        profile.conceptsMastered += session.conceptsEncountered.length;
        profile.lastActiveAt = new Date().toISOString();

        // Auto-level based on total time + concepts
        profile.level = this.calculateLevel(profile);

        // Check for achievements
        await this.checkAchievements(profile, session);

        this.saveProfile(profile);

        // Append to sessions log
        const sessions = this.loadSessions();
        sessions.push(session);
        // Keep last 500 sessions
        if (sessions.length > 500) {
            sessions.splice(0, sessions.length - 500);
        }
        this.saveSessions(sessions);
    }

    async getSessions(limit: number = 20): Promise<LearningSession[]> {
        const sessions = this.loadSessions();
        return sessions.slice(-limit).reverse();
    }

    async awardAchievement(achievement: Achievement): Promise<void> {
        const profile = await this.getProfile();
        if (!profile.achievements.find(a => a.id === achievement.id)) {
            profile.achievements.push(achievement);
            this.saveProfile(profile);
            console.info(`[UserProfile] Achievement unlocked: ${achievement.name}`);
        }
    }

    async getAchievements(): Promise<Achievement[]> {
        const profile = await this.getProfile();
        return profile.achievements;
    }

    async recordDailyActivity(): Promise<StreakInfo> {
        const profile = await this.getProfile();
        const today = new Date().toISOString().split('T')[0];

        if (!profile.activityDates.includes(today)) {
            profile.activityDates.push(today);
            // Keep last 90 days
            if (profile.activityDates.length > 90) {
                profile.activityDates = profile.activityDates.slice(-90);
            }
        }

        // Calculate streak
        const sorted = [...profile.activityDates].sort().reverse();
        let streak = 0;
        const now = new Date();
        for (let i = 0; i < sorted.length; i++) {
            const expected = new Date(now);
            expected.setDate(expected.getDate() - i);
            const expectedStr = expected.toISOString().split('T')[0];
            if (sorted[i] === expectedStr) {
                streak++;
            } else {
                break;
            }
        }

        profile.currentStreak = streak;
        if (streak > profile.longestStreak) {
            profile.longestStreak = streak;
        }

        // Check streak achievements
        if (streak >= 3) { await this.maybeAward(profile, 'streak-3'); }
        if (streak >= 7) { await this.maybeAward(profile, 'streak-7'); }
        if (streak >= 30) { await this.maybeAward(profile, 'streak-30'); }

        this.saveProfile(profile);
        return this.buildStreakInfo(profile);
    }

    async getStreakInfo(): Promise<StreakInfo> {
        const profile = await this.getProfile();
        return this.buildStreakInfo(profile);
    }

    async exportProfile(): Promise<string> {
        const profile = await this.getProfile();
        const sessions = this.loadSessions();
        return JSON.stringify({ profile, sessions, exportedAt: new Date().toISOString() }, undefined, 2);
    }

    // --- Private helpers ---

    protected createDefault(): UserProfile {
        return {
            id: crypto.randomUUID(),
            displayName: 'Learner',
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            level: 'beginner',
            preferredStyle: 'kinesthetic',
            goals: [],
            interests: [],
            totalSessions: 0,
            totalMinutes: 0,
            lessonsCompleted: 0,
            conceptsMastered: 0,
            assessmentsPassed: 0,
            currentStreak: 0,
            longestStreak: 0,
            activityDates: [],
            achievements: [],
            aiPreferences: {
                verbosity: 'normal',
                socraticMode: true,
                defaultMode: 'assist',
                showTeachableMoments: true,
                showSpiralReview: true,
            },
        };
    }

    protected calculateLevel(profile: UserProfile): UserProfile['level'] {
        const hours = profile.totalMinutes / 60;
        const concepts = profile.conceptsMastered;
        if (hours > 100 && concepts > 40) { return 'expert'; }
        if (hours > 30 && concepts > 20) { return 'advanced'; }
        if (hours > 5 && concepts > 5) { return 'intermediate'; }
        return 'beginner';
    }

    protected async checkAchievements(profile: UserProfile, session: LearningSession): Promise<void> {
        if (profile.lessonsCompleted >= 1) { await this.maybeAward(profile, 'first-lesson'); }
        if (session.agentInteractions > 0) { await this.maybeAward(profile, 'first-ask'); }
        if (session.agentInteractions >= 100) { await this.maybeAward(profile, 'teacher-pet'); }
        if (profile.conceptsMastered >= 10) { await this.maybeAward(profile, 'concepts-10'); }
        if (profile.conceptsMastered >= 25) { await this.maybeAward(profile, 'concepts-25'); }
        if (profile.conceptsMastered >= 50) { await this.maybeAward(profile, 'concepts-50'); }
        if (session.assessmentScores.some(s => s.score === 100)) { await this.maybeAward(profile, 'perfect-score'); }
        if (session.checkpointsCreated >= 10) { await this.maybeAward(profile, 'checkpoint-master'); }

        const hour = new Date().getHours();
        if (hour >= 0 && hour < 5) { await this.maybeAward(profile, 'night-owl'); }
        if (hour >= 5 && hour < 7) { await this.maybeAward(profile, 'early-bird'); }
    }

    protected async maybeAward(profile: UserProfile, achievementId: string): Promise<void> {
        if (profile.achievements.find(a => a.id === achievementId)) { return; }
        const template = BUILT_IN_ACHIEVEMENTS.find(a => a.id === achievementId);
        if (template) {
            profile.achievements.push({ ...template, earnedAt: new Date().toISOString() });
        }
    }

    protected buildStreakInfo(profile: UserProfile): StreakInfo {
        const today = new Date().toISOString().split('T')[0];
        const weekView: boolean[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            weekView.push(profile.activityDates.includes(d.toISOString().split('T')[0]));
        }
        return {
            current: profile.currentStreak,
            longest: profile.longestStreak,
            todayRecorded: profile.activityDates.includes(today),
            weekView,
        };
    }

    protected saveProfile(profile: UserProfile): void {
        this.ensureDir();
        const tmp = this.profilePath + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(profile, undefined, 2), 'utf-8');
        fs.renameSync(tmp, this.profilePath);
    }

    protected loadSessions(): LearningSession[] {
        if (fs.existsSync(this.sessionsPath)) {
            try {
                return JSON.parse(fs.readFileSync(this.sessionsPath, 'utf-8'));
            } catch {
                return [];
            }
        }
        return [];
    }

    protected saveSessions(sessions: LearningSession[]): void {
        this.ensureDir();
        const tmp = this.sessionsPath + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(sessions, undefined, 2), 'utf-8');
        fs.renameSync(tmp, this.sessionsPath);
    }
}
