import { injectable } from '@theia/core/shared/inversify';
import {
    ProgressTrackingService, StudentProgress, ProgressSummary
} from '../common/progress-protocol';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

@injectable()
export class ProgressTrackingServiceImpl implements ProgressTrackingService {

    protected storageDir: string = path.join(os.homedir(), '.teacher', 'progress');

    protected getProgressFilePath(): string {
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
        }
        return path.join(this.storageDir, 'student-progress.json');
    }

    protected loadProgress(): StudentProgress {
        const filePath = this.getProgressFilePath();
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(raw);
        }
        return this.createDefaultProgress();
    }

    protected saveProgress(progress: StudentProgress): void {
        const filePath = this.getProgressFilePath();
        progress.lastActive = new Date().toISOString();
        fs.writeFileSync(filePath, JSON.stringify(progress, undefined, 2), 'utf-8');
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

    async getProgress(): Promise<StudentProgress> {
        return this.loadProgress();
    }

    async recordLessonStart(lessonId: string): Promise<void> {
        const progress = this.loadProgress();
        progress.lessonsInProgress += 1;
        this.saveProgress(progress);
    }

    async recordLessonCompletion(lessonId: string, score: number): Promise<void> {
        const progress = this.loadProgress();
        progress.lessonsCompleted += 1;
        if (progress.lessonsInProgress > 0) {
            progress.lessonsInProgress -= 1;
        }
        this.saveProgress(progress);
    }

    async recordSkillPractice(skill: string, duration: number): Promise<void> {
        const progress = this.loadProgress();
        const current = progress.skillMastery[skill] || 0;
        progress.skillMastery[skill] = Math.min(1.0, current + (duration / 60) * 0.01);
        progress.totalTimeMinutes += duration;
        this.saveProgress(progress);
    }

    async getSkillMastery(): Promise<Map<string, number>> {
        const progress = this.loadProgress();
        return new Map(Object.entries(progress.skillMastery));
    }

    async getSummary(): Promise<ProgressSummary> {
        const progress = this.loadProgress();
        const skills = Object.entries(progress.skillMastery)
            .map(([skill, mastery]) => ({ skill, mastery }))
            .sort((a, b) => b.mastery - a.mastery)
            .slice(0, 5);

        return {
            totalLessons: progress.lessonsCompleted + progress.lessonsInProgress,
            completedLessons: progress.lessonsCompleted,
            averageScore: 0,
            totalTimeHours: Math.round(progress.totalTimeMinutes / 60 * 10) / 10,
            topSkills: skills,
            suggestedNextLesson: undefined
        };
    }
}
