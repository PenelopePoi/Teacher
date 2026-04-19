import { injectable } from '@theia/core/shared/inversify';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export const TemplateService = Symbol('TemplateService');
export const TEMPLATE_SERVICE_PATH = '/services/template';

export interface TemplateInfo {
    lessonId: string;
    title: string;
    description: string;
    files: string[];
}

export interface TemplateService {
    createWorkspaceFromTemplate(lessonId: string): Promise<string>;
    getAvailableTemplates(): Promise<TemplateInfo[]>;
}

@injectable()
export class TemplateServiceImpl implements TemplateService {

    protected getCurriculumDirectory(): string {
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

    protected getWorkspacesDirectory(): string {
        const dir = path.join(os.homedir(), '.teacher', 'workspaces');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        return dir;
    }

    async createWorkspaceFromTemplate(lessonId: string): Promise<string> {
        const templateDir = this.findLessonDirectory(lessonId);
        if (!templateDir) {
            throw new Error(`No template found for lesson: ${lessonId}`);
        }

        const workspaceDir = path.join(this.getWorkspacesDirectory(), `${lessonId}-${Date.now()}`);
        fs.mkdirSync(workspaceDir, { recursive: true });

        this.copyDirectoryRecursive(templateDir, workspaceDir);

        return workspaceDir;
    }

    async getAvailableTemplates(): Promise<TemplateInfo[]> {
        const curriculumDir = this.getCurriculumDirectory();
        if (!fs.existsSync(curriculumDir)) {
            return [];
        }

        const templates: TemplateInfo[] = [];
        const courseDirs = fs.readdirSync(curriculumDir, { withFileTypes: true });

        for (const courseEntry of courseDirs) {
            if (!courseEntry.isDirectory()) {
                continue;
            }
            const lessonsDir = path.join(curriculumDir, courseEntry.name, 'lessons');
            if (!fs.existsSync(lessonsDir)) {
                continue;
            }
            const lessonDirs = fs.readdirSync(lessonsDir, { withFileTypes: true });
            for (const lessonEntry of lessonDirs) {
                if (!lessonEntry.isDirectory()) {
                    continue;
                }
                const manifestPath = path.join(lessonsDir, lessonEntry.name, '.teacher', 'lesson.json');
                if (fs.existsSync(manifestPath)) {
                    try {
                        const raw = fs.readFileSync(manifestPath, 'utf-8');
                        const manifest = JSON.parse(raw);
                        const files = this.listFiles(path.join(lessonsDir, lessonEntry.name));
                        templates.push({
                            lessonId: manifest.id || lessonEntry.name,
                            title: manifest.title || lessonEntry.name,
                            description: manifest.objectives?.[0] || '',
                            files
                        });
                    } catch {
                        // Skip invalid manifests
                    }
                }
            }
        }

        return templates;
    }

    protected findLessonDirectory(lessonId: string): string | undefined {
        const curriculumDir = this.getCurriculumDirectory();
        if (!fs.existsSync(curriculumDir)) {
            return undefined;
        }
        const courseDirs = fs.readdirSync(curriculumDir, { withFileTypes: true });
        for (const courseEntry of courseDirs) {
            if (!courseEntry.isDirectory()) {
                continue;
            }
            const lessonDir = path.join(curriculumDir, courseEntry.name, 'lessons', lessonId);
            if (fs.existsSync(lessonDir)) {
                return lessonDir;
            }
        }
        return undefined;
    }

    protected copyDirectoryRecursive(source: string, destination: string): void {
        const entries = fs.readdirSync(source, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path.join(source, entry.name);
            const destPath = path.join(destination, entry.name);
            if (entry.isDirectory()) {
                fs.mkdirSync(destPath, { recursive: true });
                this.copyDirectoryRecursive(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    protected listFiles(dir: string): string[] {
        const files: string[] = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                if (entry.name !== '.teacher') {
                    const subFiles = this.listFiles(path.join(dir, entry.name));
                    files.push(...subFiles.map(f => path.join(entry.name, f)));
                }
            } else {
                files.push(entry.name);
            }
        }
        return files;
    }
}
