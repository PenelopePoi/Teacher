import { inject, injectable } from '@theia/core/shared/inversify';
import { AssessmentResult, LessonManifest } from '../common/teacher-protocol';
import { CurriculumService } from './curriculum-service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';

export const AssessmentService = Symbol('AssessmentService');
export const ASSESSMENT_SERVICE_PATH = '/services/assessment';

export interface AssessmentType {
    type: 'code-challenge' | 'ai-evaluated' | 'quiz';
    testCommand?: string;
    rubric?: string;
    questions?: QuizQuestion[];
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
}

export interface AssessmentService {
    runAssessment(lessonId: string, workspacePath?: string, answers?: Record<string, string>): Promise<AssessmentResult>;
    getAssessmentResults(lessonId: string): Promise<AssessmentResult[]>;
}

/** Allowlisted test runner commands (prefix match). */
const ALLOWED_RUNNERS = ['pytest', 'python -m pytest', 'node', 'jest', 'npx jest', 'npm test'];

/** Hard timeout for any test execution (30 seconds). */
const TEST_TIMEOUT_MS = 30_000;

@injectable()
export class AssessmentServiceImpl implements AssessmentService {

    @inject(CurriculumService)
    protected readonly curriculumService: CurriculumService;

    protected async getResultsDir(): Promise<string> {
        const dir = path.join(os.homedir(), '.teacher', 'assessment-results');
        await fs.promises.mkdir(dir, { recursive: true });
        return dir;
    }

    async runAssessment(lessonId: string, workspacePath?: string, answers?: Record<string, string>): Promise<AssessmentResult> {
        console.info(`[Assessment] Starting assessment for lesson: ${lessonId}`);
        const lesson = await this.curriculumService.getLesson(lessonId);
        if (!lesson) {
            console.warn(`[Assessment] Lesson not found: ${lessonId}`);
            return this.createFailResult(lessonId, ['Lesson not found: ' + lessonId]);
        }

        // Try to find assessment config in the lesson manifest directory
        const assessmentConfig = await this.loadAssessmentConfig(lessonId);
        if (!assessmentConfig) {
            // Default: evaluate based on lesson criteria
            return this.evaluateWithCriteria(lessonId, lesson);
        }

        switch (assessmentConfig.type) {
            case 'code-challenge':
                return this.runCodeChallenge(lessonId, lesson, assessmentConfig, workspacePath);
            case 'ai-evaluated':
                return this.runAIEvaluation(lessonId, lesson, assessmentConfig);
            case 'quiz':
                return this.runQuiz(lessonId, lesson, assessmentConfig, answers);
            default:
                return this.evaluateWithCriteria(lessonId, lesson);
        }
    }

    async getAssessmentResults(lessonId: string): Promise<AssessmentResult[]> {
        const resultsDir = await this.getResultsDir();
        const resultsFile = path.join(resultsDir, `${lessonId}.json`);
        try {
            const raw = await fs.promises.readFile(resultsFile, 'utf-8');
            if (!raw.trim()) {
                return [];
            }
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    // ── Command validation ───────────────────────────────────────

    protected isAllowedCommand(command: string): boolean {
        const trimmed = command.trim();
        return ALLOWED_RUNNERS.some(runner => trimmed.startsWith(runner));
    }

    // ── Async exec helper ────────────────────────────────────────

    protected execAsync(command: string, cwd: string): Promise<{ stdout: string; stderr: string }> {
        return new Promise((resolve, reject) => {
            exec(command, {
                cwd,
                timeout: TEST_TIMEOUT_MS,
                encoding: 'utf-8',
                maxBuffer: 4 * 1024 * 1024,
            }, (error, stdout, stderr) => {
                if (error) {
                    const wrapped = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
                    wrapped.stdout = stdout;
                    wrapped.stderr = stderr;
                    reject(wrapped);
                    return;
                }
                resolve({ stdout, stderr });
            });
        });
    }

    // ── Config loading (async) ───────────────────────────────────

    protected async loadAssessmentConfig(lessonId: string): Promise<AssessmentType | undefined> {
        const candidates = [
            path.join(process.cwd(), 'curriculum'),
            path.join(os.homedir(), '.teacher', 'curriculum'),
        ];

        for (const currDir of candidates) {
            try {
                await fs.promises.access(currDir, fs.constants.R_OK);
            } catch {
                continue;
            }

            let courseDirs: fs.Dirent[];
            try {
                courseDirs = await fs.promises.readdir(currDir, { withFileTypes: true });
            } catch {
                continue;
            }

            for (const courseEntry of courseDirs) {
                if (!courseEntry.isDirectory()) {
                    continue;
                }
                const assessmentPath = path.join(currDir, courseEntry.name, 'lessons', lessonId, '.teacher', 'lesson.json');
                try {
                    const raw = await fs.promises.readFile(assessmentPath, 'utf-8');
                    const manifest = JSON.parse(raw);
                    if (manifest.assessment) {
                        return manifest.assessment;
                    }
                } catch {
                    // continue
                }
            }
        }
        return undefined;
    }

    // ── Code challenge (async exec) ──────────────────────────────

    protected async runCodeChallenge(
        lessonId: string,
        lesson: LessonManifest,
        config: AssessmentType,
        workspacePath?: string
    ): Promise<AssessmentResult> {
        const testCommand = config.testCommand || 'python -m pytest test_main.py -v';
        const cwd = workspacePath || process.cwd();

        // Validate the command against the allowlist
        if (!this.isAllowedCommand(testCommand)) {
            console.warn(`[Assessment] Blocked disallowed test command: ${testCommand}`);
            const result = this.createFailResult(lessonId, [
                `Test command not allowed: "${testCommand}"`,
                `Permitted runners: ${ALLOWED_RUNNERS.join(', ')}`
            ]);
            await this.saveResult(lessonId, result);
            return result;
        }

        console.info(`[Assessment] Running code challenge: ${testCommand} in ${cwd}`);

        try {
            const { stdout } = await this.execAsync(testCommand, cwd);

            const result: AssessmentResult = {
                lessonId,
                passed: true,
                score: 100,
                feedback: ['All tests passed.', stdout.trim().split('\n').slice(-3).join('\n')],
                timestamp: new Date().toISOString()
            };
            await this.saveResult(lessonId, result);
            console.info(`[Assessment] ${lessonId} PASSED (100%)`);
            return result;
        } catch (error: unknown) {
            const stderr = error instanceof Error && 'stderr' in error ? String((error as { stderr: unknown }).stderr) : '';
            const stdout = error instanceof Error && 'stdout' in error ? String((error as { stdout: unknown }).stdout) : '';
            const isTimeout = error instanceof Error && error.message.includes('TIMEOUT');

            if (isTimeout) {
                console.warn(`[Assessment] ${lessonId} timed out after ${TEST_TIMEOUT_MS}ms`);
                const result = this.createFailResult(lessonId, [
                    `Test execution timed out after ${TEST_TIMEOUT_MS / 1000} seconds.`,
                    'Your code may have an infinite loop or is taking too long to execute.'
                ]);
                await this.saveResult(lessonId, result);
                return result;
            }

            const outputLines = (stdout + '\n' + stderr).trim().split('\n');
            const passedCount = outputLines.filter(l => l.includes('PASSED')).length;
            const failedCount = outputLines.filter(l => l.includes('FAILED')).length;
            const total = passedCount + failedCount;
            const score = total > 0 ? Math.round((passedCount / total) * 100) : 0;

            const failureDetails = outputLines
                .filter(l => l.includes('FAILED') || l.includes('AssertionError') || l.includes('AssertionError'))
                .slice(0, 5);

            const result: AssessmentResult = {
                lessonId,
                passed: false,
                score,
                feedback: [
                    `${passedCount}/${total} tests passed.`,
                    ...(failureDetails.length > 0 ? failureDetails : ['Review your implementation and try again.'])
                ],
                timestamp: new Date().toISOString()
            };
            await this.saveResult(lessonId, result);
            console.info(`[Assessment] ${lessonId} FAILED (${score}%)`);
            return result;
        }
    }

    protected async runAIEvaluation(
        lessonId: string,
        lesson: LessonManifest,
        config: AssessmentType
    ): Promise<AssessmentResult> {
        // AI evaluation sends code to the LLM with a rubric
        // For now, return a placeholder that the tutor agent can fill in
        const result: AssessmentResult = {
            lessonId,
            passed: false,
            score: 0,
            feedback: [
                'AI evaluation requested. Please use the "Submit for Review" command to have the tutor agent evaluate your work.',
                `Rubric: ${config.rubric || lesson.assessmentCriteria.join(', ')}`
            ],
            timestamp: new Date().toISOString()
        };
        await this.saveResult(lessonId, result);
        return result;
    }

    protected async runQuiz(
        lessonId: string,
        lesson: LessonManifest,
        config: AssessmentType,
        answers?: Record<string, string>
    ): Promise<AssessmentResult> {
        if (!config.questions || !answers) {
            return this.createFailResult(lessonId, ['Quiz requires questions and answers.']);
        }

        let correct = 0;
        const feedback: string[] = [];
        for (let i = 0; i < config.questions.length; i++) {
            const q = config.questions[i];
            const userAnswer = answers[String(i)];
            if (userAnswer !== undefined && Number(userAnswer) === q.correctIndex) {
                correct++;
            } else {
                feedback.push(`Question ${i + 1}: "${q.question}" — correct answer was option ${q.correctIndex + 1}`);
            }
        }

        const score = Math.round((correct / config.questions.length) * 100);
        const result: AssessmentResult = {
            lessonId,
            passed: score >= 70,
            score,
            feedback: [
                `${correct}/${config.questions.length} correct (${score}%)`,
                ...feedback
            ],
            timestamp: new Date().toISOString()
        };
        await this.saveResult(lessonId, result);
        console.info(`[Assessment] Quiz ${lessonId}: ${score}% (${score >= 70 ? 'PASSED' : 'FAILED'})`);
        return result;
    }

    protected evaluateWithCriteria(lessonId: string, lesson: LessonManifest): AssessmentResult {
        const result: AssessmentResult = {
            lessonId,
            passed: false,
            score: 0,
            feedback: [
                'Manual review needed. Assessment criteria:',
                ...lesson.assessmentCriteria.map((c, i) => `  ${i + 1}. ${c}`)
            ],
            timestamp: new Date().toISOString()
        };
        // Fire-and-forget save for sync return path
        this.saveResult(lessonId, result).catch(() => { /* ignore */ });
        return result;
    }

    protected createFailResult(lessonId: string, feedback: string[]): AssessmentResult {
        return {
            lessonId,
            passed: false,
            score: 0,
            feedback,
            timestamp: new Date().toISOString()
        };
    }

    // ── Atomic result persistence ────────────────────────────────

    protected async saveResult(lessonId: string, result: AssessmentResult): Promise<void> {
        const resultsDir = await this.getResultsDir();
        const resultsFile = path.join(resultsDir, `${lessonId}.json`);
        let existing: AssessmentResult[] = [];
        try {
            const raw = await fs.promises.readFile(resultsFile, 'utf-8');
            if (raw.trim()) {
                const parsed = JSON.parse(raw);
                existing = Array.isArray(parsed) ? parsed : [];
            }
        } catch {
            existing = [];
        }
        existing.push(result);

        // Atomic write: tmp then rename
        const tmpFile = resultsFile + '.tmp';
        await fs.promises.writeFile(tmpFile, JSON.stringify(existing, undefined, 2), 'utf-8');
        await fs.promises.rename(tmpFile, resultsFile);
    }
}
