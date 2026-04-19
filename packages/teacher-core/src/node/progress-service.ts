import { injectable } from '@theia/core/shared/inversify';
import {
    ProgressTrackingService, StudentProgress, ProgressSummary, LessonProgress
} from '../common/progress-protocol';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

@injectable()
export class ProgressTrackingServiceImpl implements ProgressTrackingService {

    protected storageDir: string = path.join(os.homedir(), '.teacher', 'progress');

    /**
     * Allow the storage directory to be overridden from preferences.
     * Called by the backend module after reading `teacher.progress.storageDirectory`.
     */
    setStorageDirectory(dir: string): void {
        if (dir) {
            this.storageDir = dir;
        }
    }

    // ── File helpers ─────────────────────────────────────────────

    protected async ensureStorageDir(): Promise<void> {
        await fs.promises.mkdir(this.storageDir, { recursive: true });
    }

    protected getProgressFilePath(): string {
        return path.join(this.storageDir, 'student-progress.json');
    }

    protected getLessonHistoryPath(): string {
        return path.join(this.storageDir, 'lesson-history.json');
    }

    protected getLockPath(): string {
        return path.join(this.storageDir, '.progress.lock');
    }

    // ── Locking ──────────────────────────────────────────────────

    protected async acquireLock(maxWaitMs: number = 3000): Promise<void> {
        await this.ensureStorageDir();
        const lockPath = this.getLockPath();
        const start = Date.now();
        while (true) {
            try {
                await fs.promises.writeFile(lockPath, String(process.pid), { flag: 'wx' });
                return; // lock acquired
            } catch {
                if (Date.now() - start > maxWaitMs) {
                    // Stale lock — force remove and retry once
                    try { await fs.promises.unlink(lockPath); } catch { /* ignore */ }
                    try {
                        await fs.promises.writeFile(lockPath, String(process.pid), { flag: 'wx' });
                        return;
                    } catch {
                        throw new Error('Unable to acquire progress lock after timeout');
                    }
                }
                await new Promise(r => setTimeout(r, 50));
            }
        }
    }

    protected async releaseLock(): Promise<void> {
        try {
            await fs.promises.unlink(this.getLockPath());
        } catch { /* ignore */ }
    }

    // ── Atomic file I/O ──────────────────────────────────────────

    protected async atomicWrite(filePath: string, data: string): Promise<void> {
        const tmpPath = filePath + '.tmp';
        await fs.promises.writeFile(tmpPath, data, 'utf-8');
        await fs.promises.rename(tmpPath, filePath);
    }

    protected async safeReadJson<T>(filePath: string, fallback: T): Promise<T> {
        try {
            const raw = await fs.promises.readFile(filePath, 'utf-8');
            if (!raw.trim()) {
                return fallback;
            }
            return JSON.parse(raw) as T;
        } catch {
            return fallback;
        }
    }

    // ── Progress CRUD ────────────────────────────────────────────

    protected async loadProgress(): Promise<StudentProgress> {
        await this.ensureStorageDir();
        return this.safeReadJson(this.getProgressFilePath(), this.createDefaultProgress());
    }

    protected async saveProgress(progress: StudentProgress): Promise<void> {
        await this.ensureStorageDir();
        progress.lastActive = new Date().toISOString();
        await this.atomicWrite(this.getProgressFilePath(), JSON.stringify(progress, undefined, 2));
    }

    protected createDefaultProgress(): StudentProgress {
        return {
            studentId: crypto.randomUUID(),
            enrolledCourses: [],
            skillMastery: {},
            totalTimeMinutes: 0,
            lastActive: new Date().toISOString(),
            lessonsCompleted: 0,
            lessonsInProgress: 0
        };
    }

    // ── Lesson history ───────────────────────────────────────────

    protected async loadLessonHistory(): Promise<LessonProgress[]> {
        return this.safeReadJson<LessonProgress[]>(this.getLessonHistoryPath(), []);
    }

    protected async saveLessonHistory(history: LessonProgress[]): Promise<void> {
        await this.atomicWrite(this.getLessonHistoryPath(), JSON.stringify(history, undefined, 2));
    }

    protected findOrCreateLesson(history: LessonProgress[], lessonId: string): LessonProgress {
        let record = history.find(l => l.lessonId === lessonId);
        if (!record) {
            record = {
                lessonId,
                status: 'not-started',
                attempts: 0,
                timeSpentMinutes: 0
            };
            history.push(record);
        }
        return record;
    }

    // ── Public API ───────────────────────────────────────────────

    async getProgress(): Promise<StudentProgress> {
        return this.loadProgress();
    }

    async recordLessonStart(lessonId: string): Promise<void> {
        await this.acquireLock();
        try {
            const progress = await this.loadProgress();
            progress.lessonsInProgress += 1;
            await this.saveProgress(progress);

            const history = await this.loadLessonHistory();
            const lesson = this.findOrCreateLesson(history, lessonId);
            lesson.status = 'in-progress';
            lesson.attempts += 1;
            await this.saveLessonHistory(history);
        } finally {
            await this.releaseLock();
        }
    }

    async recordLessonCompletion(lessonId: string, score: number): Promise<void> {
        await this.acquireLock();
        try {
            const progress = await this.loadProgress();
            progress.lessonsCompleted += 1;
            if (progress.lessonsInProgress > 0) {
                progress.lessonsInProgress -= 1;
            }
            await this.saveProgress(progress);

            const history = await this.loadLessonHistory();
            const lesson = this.findOrCreateLesson(history, lessonId);
            lesson.score = score;
            lesson.status = score >= 90 ? 'mastered' : 'completed';
            lesson.completedAt = new Date().toISOString();
            await this.saveLessonHistory(history);
        } finally {
            await this.releaseLock();
        }
    }

    async recordSkillPractice(skill: string, duration: number): Promise<void> {
        await this.acquireLock();
        try {
            const progress = await this.loadProgress();
            const current = progress.skillMastery[skill] || 0;
            progress.skillMastery[skill] = Math.min(1.0, current + (duration / 60) * 0.01);
            progress.totalTimeMinutes += duration;
            await this.saveProgress(progress);
        } finally {
            await this.releaseLock();
        }
    }

    async getSkillMastery(): Promise<Map<string, number>> {
        const progress = await this.loadProgress();
        return new Map(Object.entries(progress.skillMastery));
    }

    async getSummary(): Promise<ProgressSummary> {
        const progress = await this.loadProgress();
        const history = await this.loadLessonHistory();

        const skills = Object.entries(progress.skillMastery)
            .map(([skill, mastery]) => ({ skill, mastery }))
            .sort((a, b) => b.mastery - a.mastery)
            .slice(0, 5);

        // Calculate average score from completed lessons
        const scoredLessons = history.filter(l => l.score !== undefined && l.score !== null);
        const averageScore = scoredLessons.length > 0
            ? Math.round(scoredLessons.reduce((sum, l) => sum + (l.score ?? 0), 0) / scoredLessons.length)
            : 0;

        // Suggest next lesson: first incomplete from history, or undefined
        const incompletion = history.find(
            l => l.status === 'not-started' || l.status === 'in-progress'
        );
        const suggestedNextLesson = incompletion?.lessonId;

        return {
            totalLessons: progress.lessonsCompleted + progress.lessonsInProgress,
            completedLessons: progress.lessonsCompleted,
            averageScore,
            totalTimeHours: Math.round(progress.totalTimeMinutes / 60 * 10) / 10,
            topSkills: skills,
            suggestedNextLesson
        };
    }

    async getWeeklyReport(): Promise<any> {
        const summary = await this.getSummary();
        return {
            lessonsCompleted: summary.completedLessons,
            timeSpentHours: summary.totalTimeHours,
            skillsImproved: summary.topSkills.map(s => s.skill),
            areasNeedingAttention: [],
            streakDays: 0,
            periodStart: new Date(Date.now() - 7 * 86400000).toISOString(),
            periodEnd: new Date().toISOString()
        };
    }

    async getStreak(): Promise<number> {
        return 0;
    }

    async getWeakAreas(): Promise<string[]> {
        return [];
    }

    async getRecommendedNext(): Promise<any> {
        const summary = await this.getSummary();
        return {
            lessonId: summary.suggestedNextLesson,
            reason: 'Continue where you left off',
            estimatedMinutes: 30,
            skillsTargeted: []
        };
    }
}
