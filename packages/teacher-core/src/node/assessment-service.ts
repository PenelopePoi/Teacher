import { inject, injectable } from '@theia/core/shared/inversify';
import { AssessmentResult, LessonManifest } from '../common/teacher-protocol';
import { CurriculumService } from './curriculum-service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

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

@injectable()
export class AssessmentServiceImpl implements AssessmentService {

    @inject(CurriculumService)
    protected readonly curriculumService: CurriculumService;

    protected getResultsDir(): string {
        const dir = path.join(os.homedir(), '.teacher', 'assessment-results');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        return dir;
    }

    async runAssessment(lessonId: string, workspacePath?: string, answers?: Record<string, string>): Promise<AssessmentResult> {
        const lesson = await this.curriculumService.getLesson(lessonId);
        if (!lesson) {
            return this.createFailResult(lessonId, ['Lesson not found: ' + lessonId]);
        }

        // Try to find assessment config in the lesson manifest directory
        const assessmentConfig = this.loadAssessmentConfig(lessonId);
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
        const resultsFile = path.join(this.getResultsDir(), `${lessonId}.json`);
        if (!fs.existsSync(resultsFile)) {
            return [];
        }
        try {
            const raw = fs.readFileSync(resultsFile, 'utf-8');
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    protected loadAssessmentConfig(lessonId: string): AssessmentType | undefined {
        const candidates = [
            path.join(process.cwd(), 'curriculum'),
            path.join(os.homedir(), '.teacher', 'curriculum'),
        ];

        for (const currDir of candidates) {
            if (!fs.existsSync(currDir)) {
                continue;
            }
            const courseDirs = fs.readdirSync(currDir, { withFileTypes: true });
            for (const courseEntry of courseDirs) {
                if (!courseEntry.isDirectory()) {
                    continue;
                }
                const assessmentPath = path.join(currDir, courseEntry.name, 'lessons', lessonId, '.teacher', 'lesson.json');
                if (fs.existsSync(assessmentPath)) {
                    try {
                        const raw = fs.readFileSync(assessmentPath, 'utf-8');
                        const manifest = JSON.parse(raw);
                        if (manifest.assessment) {
                            return manifest.assessment;
                        }
                    } catch {
                        // continue
                    }
                }
            }
        }
        return undefined;
    }

    protected async runCodeChallenge(
        lessonId: string,
        lesson: LessonManifest,
        config: AssessmentType,
        workspacePath?: string
    ): Promise<AssessmentResult> {
        const testCommand = config.testCommand || 'python -m pytest test_main.py -v';
        const cwd = workspacePath || process.cwd();

        try {
            const output = execSync(testCommand, {
                cwd,
                timeout: 30000,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe']
            });

            const result: AssessmentResult = {
                lessonId,
                passed: true,
                score: 100,
                feedback: ['All tests passed.', output.trim().split('\n').slice(-3).join('\n')],
                timestamp: new Date().toISOString()
            };
            this.saveResult(lessonId, result);
            return result;
        } catch (error: unknown) {
            const stderr = error instanceof Error && 'stderr' in error ? String((error as { stderr: unknown }).stderr) : '';
            const stdout = error instanceof Error && 'stdout' in error ? String((error as { stdout: unknown }).stdout) : '';
            const outputLines = (stdout + '\n' + stderr).trim().split('\n');
            const passedCount = outputLines.filter(l => l.includes('PASSED')).length;
            const failedCount = outputLines.filter(l => l.includes('FAILED')).length;
            const total = passedCount + failedCount;
            const score = total > 0 ? Math.round((passedCount / total) * 100) : 0;

            const result: AssessmentResult = {
                lessonId,
                passed: false,
                score,
                feedback: [
                    `${passedCount}/${total} tests passed.`,
                    ...outputLines.filter(l => l.includes('FAILED') || l.includes('AssertionError')).slice(0, 5)
                ],
                timestamp: new Date().toISOString()
            };
            this.saveResult(lessonId, result);
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
        this.saveResult(lessonId, result);
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
        this.saveResult(lessonId, result);
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
        this.saveResult(lessonId, result);
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

    protected saveResult(lessonId: string, result: AssessmentResult): void {
        const resultsFile = path.join(this.getResultsDir(), `${lessonId}.json`);
        let existing: AssessmentResult[] = [];
        if (fs.existsSync(resultsFile)) {
            try {
                existing = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
            } catch {
                existing = [];
            }
        }
        existing.push(result);
        fs.writeFileSync(resultsFile, JSON.stringify(existing, undefined, 2), 'utf-8');
    }
}
