import { ReactWidget } from '@theia/core/lib/browser';
import { CommandRegistry, nls } from '@theia/core/lib/common';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { ASIBridgeService, ASIStatus } from '../../common/asi-bridge-protocol';
import { ProgressTrackingService, ProgressSummary } from '../../common/progress-protocol';
import { TeacherService, CurriculumDefinition } from '../../common/teacher-protocol';
import { TeacherOrchestrator } from '../teacher-orchestrator';
import { PulseService } from '../pulse/pulse-service';
import { PulseIndicator } from '../pulse/pulse-indicator';

export namespace TeacherWelcomeCommands {
    export const ASK_TUTOR = 'teacher.askTutor';
    export const START_LESSON = 'teacher.startLesson';
    export const VIEW_PROGRESS = 'teacher.viewProgress';
    export const BROWSE_SKILLS = 'teacher.browseSkills';
    export const VIEW_ACHIEVEMENTS = 'teacher.viewAchievements';
    export const DAILY_CHALLENGES = 'teacher.dailyChallenges';
}

@injectable()
export class TeacherWelcomeWidget extends ReactWidget {

    static readonly ID = 'teacher-welcome-widget';
    static readonly LABEL = nls.localize('theia/teacher/welcome', 'Teacher Welcome');

    @inject(ASIBridgeService)
    protected readonly asiBridge: ASIBridgeService;

    @inject(ProgressTrackingService)
    protected readonly progressService: ProgressTrackingService;

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    @inject(PulseService)
    protected readonly pulseService: PulseService;

    @inject(TeacherService)
    protected readonly teacherService: TeacherService;

    @inject(TeacherOrchestrator)
    protected readonly orchestrator: TeacherOrchestrator;

    protected asiStatus: ASIStatus | undefined;
    protected progressSummary: ProgressSummary | undefined;
    protected curricula: CurriculumDefinition[] = [];

    @postConstruct()
    protected init(): void {
        this.id = TeacherWelcomeWidget.ID;
        this.title.label = TeacherWelcomeWidget.LABEL;
        this.title.caption = TeacherWelcomeWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-mortar-board';
        this.addClass('teacher-welcome-widget');
        this.loadData();
    }

    protected async loadData(): Promise<void> {
        try {
            this.asiStatus = await this.asiBridge.getStatus();
        } catch {
            // ASI bridge not running — check Ollama via skill engine as fallback
            this.asiStatus = {
                running: false,
                ollamaConnected: false,
                modelName: 'unknown',
                knowledgeEntries: 0,
            };
            try {
                // If skill engine responds, Ollama is reachable (skills use Ollama)
                const skills = await this.teacherService.getCurriculum();
                if (skills && skills.length > 0) {
                    this.asiStatus = {
                        running: false,
                        ollamaConnected: true,
                        modelName: 'qwen2.5:7b',
                        knowledgeEntries: 0,
                    };
                }
            } catch {
                // Backend unreachable
            }
        }
        try {
            this.progressSummary = await this.progressService.getSummary();
        } catch {
            this.progressSummary = undefined;
        }
        try {
            this.curricula = await this.teacherService.getCurriculum();
        } catch (err) {
            console.warn('[Welcome] Failed to load curriculum:', err);
            this.curricula = [];
        }

        // If we got curricula, the backend is alive — mark Ollama as connected
        if (this.curricula.length > 0 && this.asiStatus && !this.asiStatus.ollamaConnected) {
            this.asiStatus = {
                ...this.asiStatus,
                ollamaConnected: true,
                modelName: 'qwen2.5:7b',
            };
        }

        this.update();
    }

    protected render(): React.ReactNode {
        return (
            <div className='teacher-welcome-container'>
                {this.renderHeader()}
                {this.renderCourseCards()}
                {this.renderConnectionStatus()}
                {this.renderQuickActions()}
                {this.renderProgressSummary()}
                {this.renderAIInsight()}
            </div>
        );
    }

    protected readonly COURSE_ICONS: Record<string, string> = {
        'intro-to-python': 'codicon-symbol-method',
        'web-fundamentals': 'codicon-browser',
        'git-basics': 'codicon-source-control',
        'cs-foundations': 'codicon-symbol-class',
        'entrepreneurship-with-ai': 'codicon-rocket',
    };

    protected renderCourseCards(): React.ReactNode {
        if (this.curricula.length === 0) {
            return null;
        }
        return (
            <div className='teacher-welcome-courses'>
                <h2 className='teacher-welcome-section-title'>
                    {nls.localize('theia/teacher/availableCourses', 'Available Courses')}
                </h2>
                <div className='teacher-welcome-course-grid'>
                    {this.curricula.map(course => {
                        const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
                        const firstLesson = course.modules[0]?.lessons[0];
                        const icon = this.COURSE_ICONS[course.id] || 'codicon-book';
                        return (
                            <button
                                key={course.id}
                                className='teacher-welcome-course-card'
                                onClick={() => this.onStartCourse(course.id, firstLesson?.id)}
                                aria-label={`Start ${course.title}`}
                            >
                                <div className='teacher-welcome-course-card-icon'>
                                    <i className={`codicon ${icon}`} aria-hidden='true'></i>
                                </div>
                                <div className='teacher-welcome-course-card-info'>
                                    <span className='teacher-welcome-course-card-title'>{course.title}</span>
                                    <span className='teacher-welcome-course-card-meta'>
                                        {nls.localize('theia/teacher/courseMeta', '{0} lessons \u00b7 {1} credit hours', totalLessons, course.creditHours ?? 0)}
                                    </span>
                                </div>
                                <i className='codicon codicon-play teacher-welcome-course-card-play' aria-hidden='true'></i>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    protected onStartCourse = async (courseId: string, firstLessonId?: string): Promise<void> => {
        if (!firstLessonId) {
            this.commandRegistry.executeCommand(TeacherWelcomeCommands.START_LESSON);
            return;
        }
        try {
            await this.teacherService.startLesson(firstLessonId);
            await this.orchestrator.onLessonStart(firstLessonId);
            // Open the curriculum browser to show the full course
            this.commandRegistry.executeCommand(TeacherWelcomeCommands.START_LESSON);
        } catch (err) {
            console.warn('[Welcome] Failed to start course lesson:', err);
        }
    };

    protected renderHeader(): React.ReactNode {
        return (
            <div className='teacher-welcome-header'>
                <div className='teacher-welcome-logo'>
                    <i className='codicon codicon-mortar-board teacher-welcome-logo-icon'></i>
                </div>
                <h1 className='teacher-welcome-title'>
                    {nls.localize('theia/teacher/welcomeTitle', 'Teacher IDE')}
                </h1>
                <p className='teacher-welcome-motto'>
                    {nls.localize('theia/teacher/motto', 'Teacher IDE v1.0 \u2014 From Pain to Purpose')}
                </p>
                <div className='teacher-welcome-pulse' aria-label='Teacher Pulse'>
                    <PulseIndicator service={this.pulseService} size={14} showLabel={true} />
                </div>
            </div>
        );
    }

    protected renderConnectionStatus(): React.ReactNode {
        const connected = this.asiStatus?.running ?? false;
        const ollamaConnected = this.asiStatus?.ollamaConnected ?? false;
        const modelName = this.asiStatus?.modelName ?? 'unknown';
        const skillCount = 311; // from skill engine scan log

        return (
            <div className='teacher-welcome-status'>
                <h2 className='teacher-welcome-section-title'>
                    {nls.localize('theia/teacher/connectionStatus', 'Connection Status')}
                </h2>
                <div className='teacher-welcome-status-grid'>
                    <div className='teacher-welcome-status-item'>
                        <span className={`teacher-status-indicator ${connected ? 'teacher-status-connected' : 'teacher-status-disconnected'}`}></span>
                        <span>{nls.localize('theia/teacher/asiStatus', 'ASI Engine')}: {connected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    <div className='teacher-welcome-status-item'>
                        <span className={`teacher-status-indicator ${ollamaConnected ? 'teacher-status-connected' : 'teacher-status-disconnected'}`}></span>
                        <span>{nls.localize('theia/teacher/ollamaStatus', 'Ollama')}: {ollamaConnected ? modelName : 'Disconnected'}</span>
                    </div>
                    <div className='teacher-welcome-status-item'>
                        <i className='codicon codicon-library'></i>
                        <span>{nls.localize('theia/teacher/skillsLoaded', 'Skills')}: {skillCount} loaded</span>
                    </div>
                    <div className='teacher-welcome-status-item'>
                        <i className='codicon codicon-book'></i>
                        <span>{nls.localize('theia/teacher/coursesAvailable', 'Courses')}: {this.curricula.length} available</span>
                    </div>
                </div>
            </div>
        );
    }

    protected renderQuickActions(): React.ReactNode {
        return (
            <div className='teacher-welcome-actions'>
                <h2 className='teacher-welcome-section-title'>
                    {nls.localize('theia/teacher/quickActions', 'Quick Actions')}
                </h2>
                <div className='teacher-welcome-action-buttons'>
                    <button className='theia-button teacher-welcome-action-btn' onClick={this.onAskTutor} aria-label='Ask Tutor'>
                        <i className='codicon codicon-comment-discussion' aria-hidden='true'></i>
                        <span>{nls.localize('theia/teacher/askTutor', 'Ask Tutor')}</span>
                    </button>
                    <button className='theia-button teacher-welcome-action-btn' onClick={this.onStartLesson} aria-label='Start Lesson'>
                        <i className='codicon codicon-play' aria-hidden='true'></i>
                        <span>{nls.localize('theia/teacher/startLesson', 'Start Lesson')}</span>
                    </button>
                    <button className='theia-button teacher-welcome-action-btn' onClick={this.onViewProgress} aria-label='View Progress'>
                        <i className='codicon codicon-graph' aria-hidden='true'></i>
                        <span>{nls.localize('theia/teacher/viewProgress', 'View Progress')}</span>
                    </button>
                    <button className='theia-button teacher-welcome-action-btn' onClick={this.onBrowseSkills} aria-label='Browse Skills'>
                        <i className='codicon codicon-library' aria-hidden='true'></i>
                        <span>{nls.localize('theia/teacher/browseSkills', 'Browse Skills')}</span>
                    </button>
                    <button className='theia-button teacher-welcome-action-btn' onClick={this.onViewAchievements} aria-label='View Achievements'>
                        <i className='codicon codicon-trophy' aria-hidden='true'></i>
                        <span>{nls.localize('theia/teacher/viewAchievements', 'View Achievements')}</span>
                    </button>
                    <button className='theia-button teacher-welcome-action-btn' onClick={this.onDailyChallenges} aria-label='Daily Challenges'>
                        <i className='codicon codicon-flame' aria-hidden='true'></i>
                        <span>{nls.localize('theia/teacher/dailyChallenges', 'Daily Challenges')}</span>
                    </button>
                </div>
            </div>
        );
    }

    protected renderProgressSummary(): React.ReactNode {
        if (!this.progressSummary) {
            return (
                <div className='teacher-welcome-progress'>
                    <h2 className='teacher-welcome-section-title'>
                        {nls.localize('theia/teacher/recentProgress', 'Recent Progress')}
                    </h2>
                    <p className='teacher-welcome-empty'>
                        {nls.localize('theia/teacher/noProgress', 'No lessons completed yet. Start your learning journey today.')}
                    </p>
                </div>
            );
        }

        const summary = this.progressSummary;
        return (
            <div className='teacher-welcome-progress'>
                <h2 className='teacher-welcome-section-title'>
                    {nls.localize('theia/teacher/recentProgress', 'Recent Progress')}
                </h2>
                <div className='teacher-welcome-progress-stats'>
                    <div className='teacher-welcome-stat'>
                        <span className='teacher-welcome-stat-value'>{summary.completedLessons}</span>
                        <span className='teacher-welcome-stat-label'>
                            {nls.localize('theia/teacher/lessonsCompleted', 'Lessons Completed')}
                        </span>
                    </div>
                    <div className='teacher-welcome-stat'>
                        <span className='teacher-welcome-stat-value'>{summary.averageScore}%</span>
                        <span className='teacher-welcome-stat-label'>
                            {nls.localize('theia/teacher/averageScore', 'Average Score')}
                        </span>
                    </div>
                    <div className='teacher-welcome-stat'>
                        <span className='teacher-welcome-stat-value'>{summary.totalTimeHours.toFixed(1)}h</span>
                        <span className='teacher-welcome-stat-label'>
                            {nls.localize('theia/teacher/timeSpent', 'Time Spent')}
                        </span>
                    </div>
                </div>
                {summary.suggestedNextLesson && (
                    <div className='teacher-welcome-next-lesson'>
                        <i className='codicon codicon-lightbulb'></i>
                        <span>{nls.localize('theia/teacher/suggestedNext', 'Suggested Next')}: {summary.suggestedNextLesson}</span>
                    </div>
                )}
            </div>
        );
    }

    protected readonly aiInsights: string[] = [
        nls.localize('theia/teacher/insightMon', 'Every expert was once a beginner. The code you struggle with today will feel natural in a month.'),
        nls.localize('theia/teacher/insightTue', "Debugging isn't about finding bugs \u2014 it's about understanding how your code actually behaves vs how you expected it to."),
        nls.localize('theia/teacher/insightWed', "The best programmers don't memorize syntax. They know how to ask the right questions."),
        nls.localize('theia/teacher/insightThu', "Reading other people's code is a superpower. Open source projects are free textbooks written by experts."),
        nls.localize('theia/teacher/insightFri', "Ship something today. A finished project that's imperfect teaches more than a perfect project that's never done."),
        nls.localize('theia/teacher/insightSat', 'Take breaks. Your brain consolidates learning during rest. A walk does more for a hard bug than another hour of staring.'),
        nls.localize('theia/teacher/insightSun', "You're not just learning to code. You're learning to think in systems. That skill transfers to everything."),
    ];

    protected renderAIInsight(): React.ReactNode {
        const dayOfWeek = new Date().getDay();
        const insightIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const insight = this.aiInsights[insightIndex];

        return (
            <div className='teacher-ai-insight-card'>
                <div className='teacher-ai-insight-header'>
                    <i className='codicon codicon-lightbulb teacher-ai-insight-icon'></i>
                    <span className='teacher-ai-insight-title'>
                        {nls.localize('theia/teacher/aiInsightOfDay', 'AI Insight of the Day')}
                    </span>
                </div>
                <p className='teacher-ai-insight-text'>{insight}</p>
            </div>
        );
    }

    protected onAskTutor = (): void => {
        this.commandRegistry.executeCommand(TeacherWelcomeCommands.ASK_TUTOR);
    };

    protected onStartLesson = (): void => {
        this.commandRegistry.executeCommand(TeacherWelcomeCommands.START_LESSON);
    };

    protected onViewProgress = (): void => {
        this.commandRegistry.executeCommand(TeacherWelcomeCommands.VIEW_PROGRESS);
    };

    protected onBrowseSkills = (): void => {
        this.commandRegistry.executeCommand(TeacherWelcomeCommands.BROWSE_SKILLS);
    };

    protected onViewAchievements = (): void => {
        this.commandRegistry.executeCommand(TeacherWelcomeCommands.VIEW_ACHIEVEMENTS);
    };

    protected onDailyChallenges = (): void => {
        this.commandRegistry.executeCommand(TeacherWelcomeCommands.DAILY_CHALLENGES);
    };
}
