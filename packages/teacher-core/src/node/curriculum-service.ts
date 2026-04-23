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

    // ── Cache ────────────────────────────────────────────────────
    protected cachedCourses: CurriculumDefinition[] | undefined;
    protected cacheTimestamp: number = 0;
    protected fsWatcher: fs.FSWatcher | undefined;

    /**
     * Allow the curriculum directory to be overridden from preferences.
     * Called by the backend module after reading `teacher.curriculum.directory`.
     */
    setCurriculumDirectory(dir: string): void {
        if (dir && dir !== this.curriculumDir) {
            console.info(`[Curriculum] Directory set: ${dir}`);
            this.curriculumDir = dir;
            this.invalidateCache();
        }
    }

    // ── Directory resolution ─────────────────────────────────────

    protected async getCurriculumDirectory(): Promise<string> {
        if (this.curriculumDir) {
            return this.curriculumDir;
        }
        const candidates = [
            path.join(process.cwd(), 'curriculum'),
            path.join(process.cwd(), '..', '..', 'curriculum'),  // examples/electron → monorepo root
            path.join(process.cwd(), '..', 'curriculum'),         // examples/ → monorepo root
            path.join(__dirname, '..', '..', '..', '..', '..', 'curriculum'), // from lib/node/ → monorepo root
            path.join(os.homedir(), '.teacher', 'curriculum'),
        ];
        for (const candidate of candidates) {
            try {
                await fs.promises.access(candidate, fs.constants.R_OK);
                return candidate;
            } catch {
                // not accessible, try next
            }
        }
        return candidates[0];
    }

    // ── Cache management ─────────────────────────────────────────

    protected invalidateCache(): void {
        this.cachedCourses = undefined;
        this.cacheTimestamp = 0;
        if (this.fsWatcher) {
            this.fsWatcher.close();
            this.fsWatcher = undefined;
        }
    }

    protected startWatching(dir: string): void {
        if (this.fsWatcher) {
            return;
        }
        try {
            this.fsWatcher = fs.watch(dir, { recursive: true }, (_event, _filename) => {
                console.info(`[Curriculum] Change detected, invalidating cache`);
                this.cachedCourses = undefined;
                this.cacheTimestamp = 0;
            });
        } catch {
            // fs.watch not supported on every platform/dir combo — degrade gracefully
        }
    }

    // ── Validation ───────────────────────────────────────────────

    protected validateCourseJson(data: unknown, filePath: string): CurriculumDefinition | undefined {
        if (!data || typeof data !== 'object') {
            console.warn(`[Curriculum] ${filePath}: not a valid JSON object`);
            return undefined;
        }
        const obj = data as Record<string, unknown>;
        if (typeof obj.id !== 'string' || !obj.id) {
            console.warn(`[Curriculum] ${filePath}: missing or empty "id" field`);
            return undefined;
        }
        if (typeof obj.title !== 'string' || !obj.title) {
            console.warn(`[Curriculum] ${filePath}: missing or empty "title" field`);
            return undefined;
        }
        if (!Array.isArray(obj.modules)) {
            console.warn(`[Curriculum] ${filePath}: missing "modules" array`);
            return undefined;
        }
        return obj as unknown as CurriculumDefinition;
    }

    // ── Core loading (async) ─────────────────────────────────────

    async getCourses(): Promise<CurriculumDefinition[]> {
        if (this.cachedCourses) {
            return this.cachedCourses;
        }

        const dir = await this.getCurriculumDirectory();
        let entries: fs.Dirent[];
        try {
            entries = await fs.promises.readdir(dir, { withFileTypes: true });
        } catch {
            return [];
        }

        this.startWatching(dir);

        const courses: CurriculumDefinition[] = [];
        for (const entry of entries) {
            if (!entry.isDirectory()) {
                continue;
            }
            const courseFile = path.join(dir, entry.name, 'course.json');
            try {
                const raw = await fs.promises.readFile(courseFile, 'utf-8');
                let parsed: unknown;
                try {
                    parsed = JSON.parse(raw);
                } catch (parseErr) {
                    console.warn(`[Curriculum] Failed to parse JSON in ${courseFile}: ${parseErr instanceof Error ? parseErr.message : parseErr}`);
                    continue;
                }

                const course = this.validateCourseJson(parsed, courseFile);
                if (!course) {
                    continue;
                }

                course.modules = await this.enrichModules(course.modules, path.join(dir, entry.name));
                courses.push(course);
                console.info(`[Curriculum] Discovered course: ${course.id} — "${course.title}" (${course.modules.length} modules)`);
            } catch {
                // course.json doesn't exist in this directory — skip
            }
        }

        this.cachedCourses = courses;
        this.cacheTimestamp = Date.now();
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
        try {
            await fs.promises.access(lessonsDir, fs.constants.R_OK);
        } catch {
            return modules;
        }

        for (const mod of modules) {
            const enrichedLessons: LessonManifest[] = [];
            for (const lesson of mod.lessons) {
                const manifestPath = path.join(lessonsDir, lesson.id, '.teacher', 'lesson.json');
                try {
                    const raw = await fs.promises.readFile(manifestPath, 'utf-8');
                    const manifest: LessonManifest = JSON.parse(raw);
                    enrichedLessons.push(manifest);
                } catch {
                    enrichedLessons.push(lesson);
                }
            }
            mod.lessons = enrichedLessons;
        }
        return modules;
    }
}
