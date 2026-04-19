import { ReactWidget } from '@theia/core/lib/browser';
import { CommandRegistry, nls } from '@theia/core/lib/common';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { ASIBridgeService, ASIStatus } from '../../common/asi-bridge-protocol';
import { ProgressTrackingService, ProgressSummary } from '../../common/progress-protocol';
import { PulseService } from '../pulse/pulse-service';
import { PulseIndicator } from '../pulse/pulse-indicator';

export namespace TeacherWelcomeCommands {
    export const ASK_TUTOR = 'teacher.askTutor';
    export const START_LESSON = 'teacher.startLesson';
    export const VIEW_PROGRESS = 'teacher.viewProgress';
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

    protected asiStatus: ASIStatus | undefined;
    protected progressSummary: ProgressSummary | undefined;

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
            this.asiStatus = undefined;
        }
        try {
            this.progressSummary = await this.progressService.getSummary();
        } catch {
            this.progressSummary = undefined;
        }
        this.update();
    }

    protected render(): React.ReactNode {
        return (
            <div className='teacher-welcome-container'>
                {this.renderHeader()}
                {this.renderConnectionStatus()}
                {this.renderQuickActions()}
                {this.renderProgressSummary()}
            </div>
        );
    }

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
                    {nls.localize('theia/teacher/motto', 'From Pain to Purpose. From Passion to Prophet.')}
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
        const knowledgeEntries = this.asiStatus?.knowledgeEntries ?? 0;

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
                        <i className='codicon codicon-database'></i>
                        <span>{nls.localize('theia/teacher/knowledgeEntries', 'Knowledge Base')}: {knowledgeEntries} entries</span>
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
                    <button className='theia-button teacher-welcome-action-btn' onClick={this.onAskTutor}>
                        <i className='codicon codicon-comment-discussion'></i>
                        <span>{nls.localize('theia/teacher/askTutor', 'Ask Tutor')}</span>
                    </button>
                    <button className='theia-button teacher-welcome-action-btn' onClick={this.onStartLesson}>
                        <i className='codicon codicon-play'></i>
                        <span>{nls.localize('theia/teacher/startLesson', 'Start Lesson')}</span>
                    </button>
                    <button className='theia-button teacher-welcome-action-btn' onClick={this.onViewProgress}>
                        <i className='codicon codicon-graph'></i>
                        <span>{nls.localize('theia/teacher/viewProgress', 'View Progress')}</span>
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

    protected onAskTutor = (): void => {
        this.commandRegistry.executeCommand(TeacherWelcomeCommands.ASK_TUTOR);
    };

    protected onStartLesson = (): void => {
        this.commandRegistry.executeCommand(TeacherWelcomeCommands.START_LESSON);
    };

    protected onViewProgress = (): void => {
        this.commandRegistry.executeCommand(TeacherWelcomeCommands.VIEW_PROGRESS);
    };
}
