import { ReactWidget } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { ProgressTrackingService, StudentProgress, CourseProgress } from '../../common/progress-protocol';

interface SkillTimeEntry {
    skill: string;
    minutes: number;
}

@injectable()
export class LearningAnalyticsWidget extends ReactWidget {

    static readonly ID = 'teacher-learning-analytics';
    static readonly LABEL = nls.localize('theia/teacher/learningAnalytics', 'Learning Analytics');

    @inject(ProgressTrackingService)
    protected readonly progressService: ProgressTrackingService;

    protected progress: StudentProgress | undefined;
    protected skillMastery: Map<string, number> = new Map();
    protected streakDays: number = 7;

    protected demoTimeData: SkillTimeEntry[] = [
        { skill: 'Variables & Types', minutes: 45 },
        { skill: 'Control Flow', minutes: 62 },
        { skill: 'Functions', minutes: 38 },
        { skill: 'Array Methods', minutes: 55 },
        { skill: 'Promises & Async', minutes: 28 },
        { skill: 'DOM Manipulation', minutes: 71 },
        { skill: 'React Components', minutes: 90 },
        { skill: 'TypeScript Generics', minutes: 15 },
    ];

    @postConstruct()
    protected init(): void {
        this.id = LearningAnalyticsWidget.ID;
        this.title.label = LearningAnalyticsWidget.LABEL;
        this.title.caption = LearningAnalyticsWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-pulse';
        this.addClass('teacher-learning-analytics');
        this.loadData();
    }

    protected async loadData(): Promise<void> {
        try {
            this.progress = await this.progressService.getProgress();
        } catch {
            this.progress = undefined;
        }
        try {
            this.skillMastery = await this.progressService.getSkillMastery();
        } catch {
            this.skillMastery = new Map();
        }
        this.update();
    }

    protected render(): React.ReactNode {
        return (
            <div className='teacher-analytics-container'>
                <div className='teacher-analytics-header'>
                    <h1 className='teacher-analytics-title'>
                        <i className='codicon codicon-pulse'></i>
                        {nls.localize('theia/teacher/analyticsTitle', 'Learning Analytics')}
                    </h1>
                    <button className='theia-button teacher-analytics-refresh-btn' onClick={this.onRefresh}>
                        <i className='codicon codicon-refresh'></i>
                    </button>
                </div>
                {this.renderStreakCard()}
                {this.renderCourseBreakdown()}
                {this.renderTimeDistribution()}
                {this.renderSkillHeatmap()}
                {this.renderWeakAreas()}
            </div>
        );
    }

    protected renderStreakCard(): React.ReactNode {
        return (
            <div className='teacher-analytics-streak-card'>
                <i className='codicon codicon-flame'></i>
                <div className='teacher-analytics-streak-content'>
                    <span className='teacher-analytics-streak-value'>{this.streakDays}</span>
                    <span className='teacher-analytics-streak-label'>
                        {nls.localize('theia/teacher/dayStreak', 'day streak')}
                    </span>
                </div>
                <div className='teacher-analytics-streak-dots'>
                    {Array.from({ length: 7 }, (_, i) => (
                        <span
                            key={i}
                            className={`teacher-analytics-streak-dot ${i < this.streakDays ? 'teacher-analytics-streak-dot-active' : ''}`}
                        ></span>
                    ))}
                </div>
            </div>
        );
    }

    protected renderCourseBreakdown(): React.ReactNode {
        const courses: CourseProgress[] = this.progress?.enrolledCourses ?? [
            { courseId: 'js-fundamentals', courseTitle: 'JavaScript Fundamentals', lessonsTotal: 24, lessonsCompleted: 18, startedAt: '2026-03-01', lastActivityAt: '2026-04-19' },
            { courseId: 'typescript-essentials', courseTitle: 'TypeScript Essentials', lessonsTotal: 16, lessonsCompleted: 7, startedAt: '2026-03-15', lastActivityAt: '2026-04-18' },
            { courseId: 'react-mastery', courseTitle: 'React Mastery', lessonsTotal: 20, lessonsCompleted: 3, startedAt: '2026-04-10', lastActivityAt: '2026-04-17' },
        ];

        return (
            <div className='teacher-analytics-section'>
                <h2 className='teacher-analytics-section-title'>
                    <i className='codicon codicon-book'></i>
                    {nls.localize('theia/teacher/courseBreakdown', 'Course Breakdown')}
                </h2>
                <table className='teacher-analytics-course-table'>
                    <thead>
                        <tr>
                            <th>{nls.localize('theia/teacher/course', 'Course')}</th>
                            <th>{nls.localize('theia/teacher/progress', 'Progress')}</th>
                            <th>{nls.localize('theia/teacher/completed', 'Completed')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.map(course => {
                            const pct = course.lessonsTotal > 0
                                ? Math.round((course.lessonsCompleted / course.lessonsTotal) * 100)
                                : 0;
                            return (
                                <tr key={course.courseId}>
                                    <td className='teacher-analytics-course-name'>{course.courseTitle}</td>
                                    <td>
                                        <div className='teacher-analytics-course-bar'>
                                            <div
                                                className='teacher-analytics-course-bar-fill'
                                                style={{ width: `${pct}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                    <td className='teacher-analytics-course-pct'>{pct}%</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    protected renderTimeDistribution(): React.ReactNode {
        const maxMinutes = Math.max(...this.demoTimeData.map(d => d.minutes), 1);

        return (
            <div className='teacher-analytics-section'>
                <h2 className='teacher-analytics-section-title'>
                    <i className='codicon codicon-clock'></i>
                    {nls.localize('theia/teacher/timePerSkill', 'Time Per Skill')}
                </h2>
                <div className='teacher-analytics-time-bars'>
                    {this.demoTimeData.map(entry => (
                        <div key={entry.skill} className='teacher-analytics-time-row'>
                            <span className='teacher-analytics-time-label'>{entry.skill}</span>
                            <div className='teacher-analytics-time-bar'>
                                <div
                                    className='teacher-analytics-time-bar-fill'
                                    style={{ width: `${(entry.minutes / maxMinutes) * 100}%` }}
                                ></div>
                            </div>
                            <span className='teacher-analytics-time-value'>{entry.minutes}m</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    protected renderSkillHeatmap(): React.ReactNode {
        const heatmapData: Array<{ skill: string; level: number }> = [
            { skill: 'Variables', level: 4 }, { skill: 'Control Flow', level: 4 }, { skill: 'Functions', level: 3 },
            { skill: 'Arrays', level: 3 }, { skill: 'Objects', level: 3 }, { skill: 'Strings', level: 2 },
            { skill: 'ES6+', level: 2 }, { skill: 'Promises', level: 1 }, { skill: 'Async/Await', level: 1 },
            { skill: 'DOM', level: 3 }, { skill: 'Events', level: 2 }, { skill: 'Fetch API', level: 2 },
            { skill: 'TypeScript', level: 1 }, { skill: 'Generics', level: 0 }, { skill: 'React', level: 1 },
            { skill: 'Hooks', level: 0 }, { skill: 'State Mgmt', level: 0 }, { skill: 'Testing', level: 1 },
            { skill: 'Git', level: 2 }, { skill: 'CSS Grid', level: 2 },
        ];

        return (
            <div className='teacher-analytics-section'>
                <h2 className='teacher-analytics-section-title'>
                    <i className='codicon codicon-symbol-color'></i>
                    {nls.localize('theia/teacher/skillHeatmap', 'Skill Heatmap')}
                </h2>
                <div className='teacher-analytics-heatmap'>
                    {heatmapData.map(cell => (
                        <div
                            key={cell.skill}
                            className={`teacher-analytics-heatmap-cell teacher-analytics-heatmap-level-${cell.level}`}
                            title={`${cell.skill}: ${['Not started', 'Beginner', 'Developing', 'Proficient', 'Mastered'][cell.level]}`}
                        >
                            <span className='teacher-analytics-heatmap-label'>{cell.skill}</span>
                        </div>
                    ))}
                </div>
                <div className='teacher-analytics-heatmap-legend'>
                    <span className='teacher-analytics-heatmap-legend-label'>{nls.localize('theia/teacher/notStarted', 'Not started')}</span>
                    <span className='teacher-analytics-heatmap-cell teacher-analytics-heatmap-level-0 teacher-analytics-heatmap-legend-cell'></span>
                    <span className='teacher-analytics-heatmap-cell teacher-analytics-heatmap-level-1 teacher-analytics-heatmap-legend-cell'></span>
                    <span className='teacher-analytics-heatmap-cell teacher-analytics-heatmap-level-2 teacher-analytics-heatmap-legend-cell'></span>
                    <span className='teacher-analytics-heatmap-cell teacher-analytics-heatmap-level-3 teacher-analytics-heatmap-legend-cell'></span>
                    <span className='teacher-analytics-heatmap-cell teacher-analytics-heatmap-level-4 teacher-analytics-heatmap-legend-cell'></span>
                    <span className='teacher-analytics-heatmap-legend-label'>{nls.localize('theia/teacher/mastered', 'Mastered')}</span>
                </div>
            </div>
        );
    }

    protected renderWeakAreas(): React.ReactNode {
        const weakSkills = [
            { skill: 'TypeScript Generics', mastery: 0.12, suggestion: 'Practice generic utility types with the TypeScript Fundamentals course.' },
            { skill: 'React Hooks', mastery: 0.08, suggestion: 'Start with useState and useEffect exercises in the React Mastery course.' },
            { skill: 'State Management', mastery: 0.05, suggestion: 'Explore the Context API lessons before moving to external state libraries.' },
        ];

        return (
            <div className='teacher-analytics-section'>
                <h2 className='teacher-analytics-section-title'>
                    <i className='codicon codicon-warning'></i>
                    {nls.localize('theia/teacher/weakAreas', 'Areas Needing Attention')}
                </h2>
                <div className='teacher-analytics-weak-list'>
                    {weakSkills.map(ws => (
                        <div key={ws.skill} className='teacher-analytics-weak-item'>
                            <div className='teacher-analytics-weak-header'>
                                <span className='teacher-analytics-weak-name'>{ws.skill}</span>
                                <span className='teacher-analytics-weak-pct'>{Math.round(ws.mastery * 100)}%</span>
                            </div>
                            <div className='teacher-analytics-weak-bar'>
                                <div
                                    className='teacher-analytics-weak-bar-fill'
                                    style={{ width: `${ws.mastery * 100}%` }}
                                ></div>
                            </div>
                            <p className='teacher-analytics-weak-suggestion'>
                                <i className='codicon codicon-lightbulb'></i>
                                {ws.suggestion}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    protected onRefresh = (): void => {
        this.loadData();
    };
}
