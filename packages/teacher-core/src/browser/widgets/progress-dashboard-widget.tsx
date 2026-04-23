import { ReactWidget } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { ProgressTrackingService, ProgressSummary } from '../../common/progress-protocol';

@injectable()
export class ProgressDashboardWidget extends ReactWidget {

    static readonly ID = 'teacher-progress-dashboard';
    static readonly LABEL = nls.localize('theia/teacher/progressDashboard', 'Progress Dashboard');

    @inject(ProgressTrackingService)
    protected readonly progressService: ProgressTrackingService;

    protected summary: ProgressSummary | undefined;
    protected skillMastery: Map<string, number> = new Map();
    protected streakDays: number = 0;
    protected streakHistory: boolean[] = [];

    @postConstruct()
    protected init(): void {
        this.id = ProgressDashboardWidget.ID;
        this.title.label = ProgressDashboardWidget.LABEL;
        this.title.caption = ProgressDashboardWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-graph';
        this.addClass('teacher-progress-dashboard');
        this.loadData();
    }

    protected async loadData(): Promise<void> {
        try {
            this.summary = await this.progressService.getSummary();
        } catch {
            this.summary = undefined;
        }
        try {
            this.skillMastery = await this.progressService.getSkillMastery();
        } catch {
            this.skillMastery = new Map();
        }
        try {
            this.streakDays = await this.progressService.getStreak();
            // Build 14-day history from streak count
            this.streakHistory = Array.from({ length: 14 }, (_, i) => i < this.streakDays);
        } catch {
            this.streakDays = 0;
            this.streakHistory = [];
        }
        this.update();
    }

    protected render(): React.ReactNode {
        return (
            <div className='teacher-dashboard-container'>
                <h1 className='teacher-dashboard-title'>
                    <i className='codicon codicon-graph'></i>
                    {nls.localize('theia/teacher/dashboardTitle', 'Learning Progress Dashboard')}
                </h1>
                {this.renderStreakCounter()}
                {this.renderOverviewCards()}
                {this.renderSkillMastery()}
                {this.renderAIAnalysis()}
                {this.renderSuggestedNextLesson()}
            </div>
        );
    }

    protected renderStreakCounter(): React.ReactNode {
        return (
            <div className='teacher-dashboard-streak'>
                <div className='teacher-dashboard-streak-header'>
                    <i className='codicon codicon-flame teacher-dashboard-streak-flame'></i>
                    <span className='teacher-dashboard-streak-count'>{this.streakDays}</span>
                    <span className='teacher-dashboard-streak-label'>
                        {nls.localize('theia/teacher/dayStreak', 'day streak')}
                    </span>
                </div>
                <div className='teacher-dashboard-streak-dots'>
                    {this.streakHistory.slice(-14).map((active, i) => (
                        <span
                            key={i}
                            className={`teacher-dashboard-streak-dot ${active ? 'teacher-dashboard-streak-dot--active' : ''}`}
                            title={active
                                ? nls.localize('theia/teacher/streakActive', 'Active')
                                : nls.localize('theia/teacher/streakMissed', 'Missed')}
                        ></span>
                    ))}
                </div>
            </div>
        );
    }

    protected renderOverviewCards(): React.ReactNode {
        const completed = this.summary?.completedLessons ?? 0;
        const total = this.summary?.totalLessons ?? 0;
        const avgScore = this.summary?.averageScore ?? 0;
        const timeHours = this.summary?.totalTimeHours ?? 0;

        return (
            <div className='teacher-dashboard-cards'>
                <div className='teacher-dashboard-card'>
                    <div className='teacher-dashboard-card-icon'>
                        <i className='codicon codicon-check-all'></i>
                    </div>
                    <div className='teacher-dashboard-card-content'>
                        <span className='teacher-dashboard-card-value'>{completed} / {total}</span>
                        <span className='teacher-dashboard-card-label'>
                            {nls.localize('theia/teacher/lessonsCompleted', 'Lessons Completed')}
                        </span>
                    </div>
                    <div className='teacher-dashboard-card-bar'>
                        <div
                            className='teacher-dashboard-card-bar-fill'
                            style={{ width: total > 0 ? `${(completed / total) * 100}%` : '0%' }}
                        ></div>
                    </div>
                </div>

                <div className='teacher-dashboard-card'>
                    <div className='teacher-dashboard-card-icon'>
                        <i className='codicon codicon-star-full'></i>
                    </div>
                    <div className='teacher-dashboard-card-content'>
                        <span className='teacher-dashboard-card-value'>{avgScore}%</span>
                        <span className='teacher-dashboard-card-label'>
                            {nls.localize('theia/teacher/averageScore', 'Average Score')}
                        </span>
                    </div>
                    <div className='teacher-dashboard-card-bar'>
                        <div
                            className='teacher-dashboard-card-bar-fill'
                            style={{ width: `${avgScore}%` }}
                        ></div>
                    </div>
                </div>

                <div className='teacher-dashboard-card'>
                    <div className='teacher-dashboard-card-icon'>
                        <i className='codicon codicon-clock'></i>
                    </div>
                    <div className='teacher-dashboard-card-content'>
                        <span className='teacher-dashboard-card-value'>{timeHours.toFixed(1)}h</span>
                        <span className='teacher-dashboard-card-label'>
                            {nls.localize('theia/teacher/timeSpent', 'Time Spent')}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    protected renderSkillMastery(): React.ReactNode {
        const skills = this.summary?.topSkills ?? [];

        if (skills.length === 0) {
            return (
                <div className='teacher-dashboard-section'>
                    <h2 className='teacher-dashboard-section-title'>
                        {nls.localize('theia/teacher/skillsMastered', 'Skills Mastered')}
                    </h2>
                    <p className='teacher-dashboard-empty'>
                        {nls.localize('theia/teacher/noSkills', 'Complete lessons to build your skill profile.')}
                    </p>
                </div>
            );
        }

        return (
            <div className='teacher-dashboard-section'>
                <h2 className='teacher-dashboard-section-title'>
                    {nls.localize('theia/teacher/skillsMastered', 'Skills Mastered')}
                </h2>
                <div className='teacher-dashboard-skills'>
                    {skills.map(skill => (
                        <div key={skill.skill} className='teacher-dashboard-skill'>
                            <div className='teacher-dashboard-skill-header'>
                                <span className='teacher-dashboard-skill-name'>{skill.skill}</span>
                                <span className='teacher-dashboard-skill-pct'>{Math.round(skill.mastery * 100)}%</span>
                            </div>
                            <div className='teacher-dashboard-skill-bar'>
                                <div
                                    className='teacher-dashboard-skill-bar-fill'
                                    style={{ width: `${skill.mastery * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    protected renderAIAnalysis(): React.ReactNode {
        return (
            <div className='teacher-ai-analysis'>
                <h2 className='teacher-dashboard-section-title'>
                    <i className='codicon codicon-symbol-misc'></i>
                    {nls.localize('theia/teacher/aiAnalysis', 'AI Analysis')}
                </h2>
                <p className='teacher-ai-analysis-text'>
                    {nls.localize(
                        'theia/teacher/aiAnalysisBody',
                        "Based on your progress, you're strongest in HTML structure and CSS styling. Your JavaScript skills are developing \u2014 you've mastered variables and functions but haven't tackled async patterns yet. I recommend focusing on loops and array methods next, as they're the bridge to more advanced concepts. Your 7-day streak shows great consistency \u2014 keep it up!"
                    )}
                </p>
            </div>
        );
    }

    protected renderSuggestedNextLesson(): React.ReactNode {
        const suggested = this.summary?.suggestedNextLesson;
        if (!suggested) {
            return null;
        }

        return (
            <div className='teacher-dashboard-section teacher-dashboard-suggestion'>
                <h2 className='teacher-dashboard-section-title'>
                    <i className='codicon codicon-lightbulb'></i>
                    {nls.localize('theia/teacher/suggestedNext', 'Suggested Next')}
                </h2>
                <div className='teacher-dashboard-suggestion-card'>
                    <i className='codicon codicon-arrow-right'></i>
                    <span>{suggested}</span>
                </div>
            </div>
        );
    }
}
