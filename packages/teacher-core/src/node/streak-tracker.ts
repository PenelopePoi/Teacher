import { injectable } from '@theia/core/shared/inversify';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Persistent streak data stored on disk.
 */
interface StreakData {
    /** ISO date strings of each day with activity (YYYY-MM-DD). */
    activeDates: string[];
    /** The current consecutive-day streak. */
    currentStreak: number;
    /** The longest streak ever recorded. */
    longestStreak: number;
    /** ISO date of the last recorded activity day. */
    lastActiveDate: string;
}

/**
 * Tracks daily coding streaks, storing data in ~/.teacher/streak.json.
 * A streak is a consecutive sequence of calendar days with at least
 * one recorded activity.
 */
@injectable()
export class StreakTracker {

    protected readonly teacherDir: string = path.join(
        process.env.HOME || '~', '.teacher'
    );

    protected readonly streakPath: string = path.join(
        this.teacherDir, 'streak.json'
    );

    /**
     * Record activity for today. If today is already recorded, this is a no-op.
     * Updates the current streak and longest streak accordingly.
     */
    recordToday(): StreakData {
        const data = this.loadData();
        const today = this.todayString();

        if (data.lastActiveDate === today) {
            return data; // Already recorded
        }

        // Check if yesterday was active (streak continues) or not (streak resets)
        const yesterday = this.dateString(new Date(Date.now() - 86400000));

        if (data.lastActiveDate === yesterday) {
            data.currentStreak++;
        } else if (data.lastActiveDate === '') {
            // First ever activity
            data.currentStreak = 1;
        } else {
            // Streak broken
            data.currentStreak = 1;
        }

        data.lastActiveDate = today;
        data.activeDates.push(today);

        if (data.currentStreak > data.longestStreak) {
            data.longestStreak = data.currentStreak;
        }

        this.saveData(data);
        return data;
    }

    /**
     * Return the current consecutive-day streak.
     */
    getStreak(): number {
        const data = this.loadData();
        // If the last active date is not today or yesterday, the streak is broken
        const today = this.todayString();
        const yesterday = this.dateString(new Date(Date.now() - 86400000));
        if (data.lastActiveDate !== today && data.lastActiveDate !== yesterday) {
            return 0;
        }
        return data.currentStreak;
    }

    /**
     * Return the longest streak ever recorded.
     */
    getLongestStreak(): number {
        const data = this.loadData();
        return data.longestStreak;
    }

    /**
     * Return the full streak data for display purposes.
     */
    getData(): StreakData {
        return this.loadData();
    }

    protected loadData(): StreakData {
        this.ensureDirectory();
        try {
            if (fs.existsSync(this.streakPath)) {
                const raw = fs.readFileSync(this.streakPath, 'utf-8');
                return JSON.parse(raw) as StreakData;
            }
        } catch (err) {
            console.warn('[StreakTracker] Could not read streak file:', err);
        }
        return {
            activeDates: [],
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: '',
        };
    }

    protected saveData(data: StreakData): void {
        this.ensureDirectory();
        try {
            fs.writeFileSync(this.streakPath, JSON.stringify(data, undefined, 2), 'utf-8');
        } catch (err) {
            console.error('[StreakTracker] Could not save streak file:', err);
        }
    }

    protected todayString(): string {
        return this.dateString(new Date());
    }

    protected dateString(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    protected ensureDirectory(): void {
        if (!fs.existsSync(this.teacherDir)) {
            fs.mkdirSync(this.teacherDir, { recursive: true });
        }
    }
}
