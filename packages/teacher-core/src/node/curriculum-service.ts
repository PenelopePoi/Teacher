import { injectable } from '@theia/core/shared/inversify';
import { CurriculumDefinition, CurriculumModule, LessonManifest } from '../common/teacher-protocol';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export const CurriculumService = Symbol('CurriculumService');
export const CURRICULUM_SERVICE_PATH = '/services/curriculum';

export interface CurriculumService {
    getCourses(): Promise<CurriculumDefinition[]>;
    getCourse(id: string): Promise<CurriculumDefinition | undefined>;
    getLesson(id: string): Promise<LessonManifest | undefined>;
    getLessonsByModule(moduleId: string): Promise<LessonManifest[]>;
}

@injectable()
export class CurriculumServiceImpl implements CurriculumService {

    protected curriculumDir: string = '';

    protected getCurriculumDirectory(): string {
        if (this.curriculumDir) {
            return this.curriculumDir;
        }
        // Default: look in common locations
        const candidates = [
            path.join(process.cwd(), 'curriculum'),
            path.join(os.homedir(), '.teacher', 'curriculum'),
        ];
        for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
                return candidate;
            }
        }
        return candidates[0];
    }

    async getCourses(): Promise<CurriculumDefinition[]> {
        const dir = this.getCurriculumDirectory();
        if (!fs.existsSync(dir)) {
            return [];
        }
        const courses: CurriculumDefinition[] = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const courseFile = path.join(dir, entry.name, 'course.json');
                if (fs.existsSync(courseFile)) {
                    try {
                        const raw = fs.readFileSync(courseFile, 'utf-8');
                        const course: CurriculumDefinition = JSON.parse(raw);
                        // Enrich modules with lesson manifests from disk
                        course.modules = await this.enrichModules(course.modules, path.join(dir, entry.name));
                        courses.push(course);
                    } catch {
                        console.warn(`Failed to parse course file: ${courseFile}`);
                    }
                }
            }
        }
        return courses;
    }

    async getCourse(id: string): Promise<CurriculumDefinition | undefined> {
        const courses = await this.getCourses();
        return courses.find(c => c.id === id);
    }

    async getLesson(id: string): Promise<LessonManifest | undefined> {
        const courses = await this.getCourses();
        for (const course of courses) {
            for (const mod of course.modules) {
                const lesson = mod.lessons.find(l => l.id === id);
                if (lesson) {
                    return lesson;
                }
            }
        }
        return undefined;
    }

    async getLessonsByModule(moduleId: string): Promise<LessonManifest[]> {
        const courses = await this.getCourses();
        for (const course of courses) {
            const mod = course.modules.find(m => m.id === moduleId);
            if (mod) {
                return mod.lessons;
            }
        }
        return [];
    }

    protected async enrichModules(modules: CurriculumModule[], courseDir: string): Promise<CurriculumModule[]> {
        const lessonsDir = path.join(courseDir, 'lessons');
        if (!fs.existsSync(lessonsDir)) {
            return modules;
        }
        for (const mod of modules) {
            const enrichedLessons: LessonManifest[] = [];
            for (const lesson of mod.lessons) {
                const manifestPath = path.join(lessonsDir, lesson.id, '.teacher', 'lesson.json');
                if (fs.existsSync(manifestPath)) {
                    try {
                        const raw = fs.readFileSync(manifestPath, 'utf-8');
                        const manifest: LessonManifest = JSON.parse(raw);
                        enrichedLessons.push(manifest);
                    } catch {
                        enrichedLessons.push(lesson);
                    }
                } else {
                    enrichedLessons.push(lesson);
                }
            }
            mod.lessons = enrichedLessons;
        }
        return modules;
    }
}
