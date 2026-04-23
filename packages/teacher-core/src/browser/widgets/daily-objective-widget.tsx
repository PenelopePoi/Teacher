import { ReactWidget } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';
import { ProgressTrackingService } from '../../common/progress-protocol';

interface DailyObjective {
    readonly goal: string;
    readonly progressPercent: number;
    readonly tasksCompleted: number;
    readonly tasksTotal: number;
}

const FALLBACK_OBJECTIVE: DailyObjective = {
    goal: 'Learn CSS Grid',
    progressPercent: 40,
    tasksCompleted: 2,
    tasksTotal: 5,
};

@injectable()
export class DailyObjectiveWidget extends ReactWidget {

    static readonly ID = 'teacher-daily-objective';
    static readonly LABEL = nls.localize('theia/teacher/dailyObjective', 'Daily Objective');

    @inject(ProgressTrackingService)
    protected readonly progressService: ProgressTrackingService;

    protected objective: DailyObjective = FALLBACK_OBJECTIVE;
    protected isEditing: boolean = false;
    protected editValue: string = '';

    @postConstruct()
    protected init(): void {
        this.id = DailyObjectiveWidget.ID;
        this.title.label = DailyObjectiveWidget.LABEL;
        this.title.caption = DailyObjectiveWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-target';
        this.addClass('teacher-daily-objective');
        this.loadFromBackend();
        this.update();
    }

    protected async loadFromBackend(): Promise<void> {
        try {
            const summary = await this.progressService.getSummary();
            const weakAreas = await this.progressService.getWeakAreas();
            const recommended = await this.progressService.getRecommendedNext();

            const goal = recommended ? recommended.title : (weakAreas.length > 0 ? `Practice: ${weakAreas[0]}` : 'Complete your next lesson');
            const completed = summary.completedLessons || 0;
            const total = Math.max(summary.totalLessons || completed + 1, 5);

            this.objective = {
                goal,
                progressPercent: Math.min(100, Math.round((completed / total) * 100)),
                tasksCompleted: completed,
                tasksTotal: total,
            };
            this.update();
        } catch (err) {
            console.warn('[DailyObjectiveWidget] Backend unavailable, using fallback:', err);
        }
    }

    protected handleUpdateGoal = (): void => {
        this.isEditing = true;
        this.editValue = this.objective.goal;
        this.update();
    };

    protected handleEditChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.editValue = e.target.value;
        this.update();
    };

    protected handleEditSubmit = (): void => {
        if (this.editValue.trim()) {
            this.objective = {
                goal: this.editValue.trim(),
                progressPercent: 0,
                tasksCompleted: 0,
                tasksTotal: 5,
            };
        }
        this.isEditing = false;
        this.update();
    };

    protected handleEditCancel = (): void => {
        this.isEditing = false;
        this.update();
    };

    protected handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            this.handleEditSubmit();
        } else if (e.key === 'Escape') {
            this.handleEditCancel();
        }
    };

    protected render(): React.ReactNode {
        return (
            <div className='teacher-daily-objective-container'>
                <div className='teacher-daily-objective-header'>
                    <i className='codicon codicon-target teacher-daily-objective-icon'></i>
                    <h3 className='teacher-daily-objective-title'>
                        {nls.localize('theia/teacher/todaysGoal', "Today's Goal")}
                    </h3>
                </div>
                {this.isEditing ? this.renderEditor() : this.renderObjective()}
            </div>
        );
    }

    protected renderObjective(): React.ReactNode {
        return (
            <div className='teacher-daily-objective-body'>
                <div className='teacher-daily-objective-goal'>
                    <span className='teacher-daily-objective-goal-text'>{this.objective.goal}</span>
                    <span className='teacher-ai-recommended-badge'>
                        {nls.localize('theia/teacher/aiSuggested', 'AI suggested')}
                    </span>
                    <span className='teacher-daily-objective-goal-pct'>{this.objective.progressPercent}%</span>
                </div>
                <div className='teacher-daily-objective-micro-goals'>
                    <div className='teacher-daily-objective-micro-goal'>
                        <i className='codicon codicon-circle-outline'></i>
                        <span>{nls.localize('theia/teacher/microGoal1', '1. Read the docs (5 min)')}</span>
                    </div>
                    <div className='teacher-daily-objective-micro-goal'>
                        <i className='codicon codicon-circle-outline'></i>
                        <span>{nls.localize('theia/teacher/microGoal2', '2. Try the example (10 min)')}</span>
                    </div>
                    <div className='teacher-daily-objective-micro-goal'>
                        <i className='codicon codicon-circle-outline'></i>
                        <span>{nls.localize('theia/teacher/microGoal3', '3. Build your own (15 min)')}</span>
                    </div>
                </div>
                <div className='teacher-daily-objective-bar'>
                    <div
                        className='teacher-daily-objective-bar-fill'
                        style={{ width: `${this.objective.progressPercent}%` }}
                    ></div>
                </div>
                <div className='teacher-daily-objective-meta'>
                    <span className='teacher-daily-objective-tasks'>
                        <i className='codicon codicon-check'></i>
                        {nls.localize('theia/teacher/tasksComplete', '{0} of {1} tasks', this.objective.tasksCompleted, this.objective.tasksTotal)}
                    </span>
                    <button
                        type='button'
                        className='teacher-daily-objective-update-btn'
                        onClick={this.handleUpdateGoal}
                    >
                        <i className='codicon codicon-edit'></i>
                        {nls.localize('theia/teacher/updateGoal', 'Update Goal')}
                    </button>
                </div>
            </div>
        );
    }

    protected renderEditor(): React.ReactNode {
        return (
            <div className='teacher-daily-objective-editor'>
                <input
                    type='text'
                    className='theia-input teacher-daily-objective-edit-input'
                    value={this.editValue}
                    onChange={this.handleEditChange}
                    onKeyDown={this.handleEditKeyDown}
                    placeholder={nls.localize('theia/teacher/goalPlaceholder', 'Enter your learning goal...')}
                    autoFocus
                />
                <div className='teacher-daily-objective-edit-actions'>
                    <button
                        type='button'
                        className='teacher-daily-objective-edit-btn teacher-daily-objective-edit-btn--save'
                        onClick={this.handleEditSubmit}
                    >
                        <i className='codicon codicon-check'></i>
                        {nls.localize('theia/teacher/save', 'Save')}
                    </button>
                    <button
                        type='button'
                        className='teacher-daily-objective-edit-btn teacher-daily-objective-edit-btn--cancel'
                        onClick={this.handleEditCancel}
                    >
                        <i className='codicon codicon-close'></i>
                        {nls.localize('theia/teacher/cancel', 'Cancel')}
                    </button>
                </div>
            </div>
        );
    }
}
