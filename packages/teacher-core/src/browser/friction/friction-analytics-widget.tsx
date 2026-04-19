/**
 * Friction Analytics Widget
 *
 * Panel widget showing friction analytics for the current session.
 * Displays a timeline of friction events, the most common friction type,
 * resolution rate, and a session health score.
 *
 * Warm, supportive tone -- the student should feel helped, not surveilled.
 */

import { ReactWidget } from '@theia/core/lib/browser';
import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';
import { StudentFrictionService } from './student-friction-service';
import {
    FrictionEvent,
    FrictionType,
    FrictionSeverity,
    SessionHealthScore,
} from '../../common/friction-protocol';

/** Human-readable names for friction types. */
const TYPE_LABELS: Record<FrictionType, string> = {
    [FrictionType.UndoRedoCycle]: 'Undo/Redo Loop',
    [FrictionType.ErrorPause]: 'Error Pause',
    [FrictionType.RepeatedTestFailure]: 'Test Failures',
    [FrictionType.ExcessiveDeletions]: 'Excessive Deletions',
    [FrictionType.HelpSeeking]: 'Help Seeking',
    [FrictionType.AssessmentRetries]: 'Assessment Retries',
    [FrictionType.SessionAbandonment]: 'Session Pause',
    [FrictionType.ConceptConfusion]: 'Concept Confusion',
};

/** Codicon classes for each friction type. */
const TYPE_ICONS: Record<FrictionType, string> = {
    [FrictionType.UndoRedoCycle]: 'codicon-debug-step-back',
    [FrictionType.ErrorPause]: 'codicon-error',
    [FrictionType.RepeatedTestFailure]: 'codicon-testing-error-icon',
    [FrictionType.ExcessiveDeletions]: 'codicon-trash',
    [FrictionType.HelpSeeking]: 'codicon-search',
    [FrictionType.AssessmentRetries]: 'codicon-notebook',
    [FrictionType.SessionAbandonment]: 'codicon-clock',
    [FrictionType.ConceptConfusion]: 'codicon-question',
};

@injectable()
export class FrictionAnalyticsWidget extends ReactWidget {

    static readonly ID = 'teacher-friction-analytics';
    static readonly LABEL = nls.localize('theia/teacher/frictionAnalytics', 'Friction Analytics');

    @inject(StudentFrictionService)
    protected readonly frictionService: StudentFrictionService;

    @postConstruct()
    protected init(): void {
        this.id = FrictionAnalyticsWidget.ID;
        this.title.label = FrictionAnalyticsWidget.LABEL;
        this.title.caption = FrictionAnalyticsWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-pulse';
        this.addClass('teacher-friction-analytics');

        this.frictionService.onDidDetectFriction(() => this.update());
    }

    protected render(): React.ReactNode {
        const history = this.frictionService.getFrictionHistory();
        const health = this.frictionService.computeHealthScore();

        return (
            <div className='teacher-friction-container'>
                {this.renderHeader(health)}
                {this.renderHealthBar(health)}
                {this.renderSummary(health)}
                {history.length > 0
                    ? this.renderTimeline(history)
                    : this.renderEmpty()
                }
            </div>
        );
    }

    protected renderHeader(health: SessionHealthScore): React.ReactNode {
        return (
            <div className='teacher-friction-header'>
                <span className='codicon codicon-pulse teacher-friction-header-icon' />
                <span className='teacher-friction-header-title'>
                    {nls.localize('theia/teacher/frictionSession', 'Session Wellness')}
                </span>
                <span className={`teacher-friction-score teacher-friction-score--${this.scoreLevel(health.score)}`}>
                    {health.score}
                </span>
            </div>
        );
    }

    protected renderHealthBar(health: SessionHealthScore): React.ReactNode {
        const level = this.scoreLevel(health.score);
        return (
            <div className='teacher-friction-health-bar'>
                <div
                    className={`teacher-friction-health-fill teacher-friction-health-fill--${level}`}
                    style={{ width: `${health.score}%` }}
                />
            </div>
        );
    }

    protected renderSummary(health: SessionHealthScore): React.ReactNode {
        const resolutionRate = health.totalFrictions > 0
            ? Math.round((health.resolvedFrictions / health.totalFrictions) * 100)
            : 100;

        return (
            <div className='teacher-friction-summary'>
                <div className='teacher-friction-summary-stat'>
                    <span className='teacher-friction-summary-value'>{health.totalFrictions}</span>
                    <span className='teacher-friction-summary-label'>
                        {nls.localize('theia/teacher/frictionDetected', 'moments detected')}
                    </span>
                </div>
                <div className='teacher-friction-summary-stat'>
                    <span className='teacher-friction-summary-value'>{health.resolvedFrictions}</span>
                    <span className='teacher-friction-summary-label'>
                        {nls.localize('theia/teacher/frictionResolved', 'resolved')}
                    </span>
                </div>
                <div className='teacher-friction-summary-stat'>
                    <span className='teacher-friction-summary-value'>{resolutionRate}%</span>
                    <span className='teacher-friction-summary-label'>
                        {nls.localize('theia/teacher/frictionRate', 'resolution rate')}
                    </span>
                </div>
                {health.dominantFrictionType && (
                    <div className='teacher-friction-summary-stat'>
                        <span className='teacher-friction-summary-value'>
                            {TYPE_LABELS[health.dominantFrictionType]}
                        </span>
                        <span className='teacher-friction-summary-label'>
                            {nls.localize('theia/teacher/frictionDominant', 'most common')}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    protected renderTimeline(history: FrictionEvent[]): React.ReactNode {
        // Show newest first
        const sorted = [...history].reverse();
        return (
            <div className='teacher-friction-timeline'>
                <div className='teacher-friction-timeline-header'>
                    {nls.localize('theia/teacher/frictionTimeline', 'Timeline')}
                </div>
                {sorted.map(event => this.renderTimelineEvent(event))}
            </div>
        );
    }

    protected renderTimelineEvent = (event: FrictionEvent): React.ReactNode => {
        const time = new Date(event.timestamp);
        const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
        const severityClass = `teacher-friction-event--${event.severity}`;
        const resolvedClass = event.resolved ? 'teacher-friction-event--resolved' : '';

        return (
            <div
                key={event.id}
                className={`teacher-friction-event ${severityClass} ${resolvedClass}`}
            >
                <span className={`codicon ${TYPE_ICONS[event.type]} teacher-friction-event-icon`} />
                <div className='teacher-friction-event-body'>
                    <div className='teacher-friction-event-title'>
                        {TYPE_LABELS[event.type]}
                        {event.resolved && (
                            <span className='teacher-friction-event-badge teacher-friction-event-badge--resolved'>
                                {nls.localize('theia/teacher/frictionResolvedBadge', 'resolved')}
                            </span>
                        )}
                    </div>
                    <div className='teacher-friction-event-context'>{event.context}</div>
                </div>
                <span className='teacher-friction-event-time'>{timeStr}</span>
            </div>
        );
    };

    protected renderEmpty(): React.ReactNode {
        return (
            <div className='teacher-friction-empty'>
                <span className='codicon codicon-heart teacher-friction-empty-icon' />
                <p>{nls.localize('theia/teacher/frictionAllClear', 'Smooth sailing so far. Keep going!')}</p>
            </div>
        );
    }

    protected scoreLevel(score: number): string {
        if (score >= 75) {
            return 'good';
        }
        if (score >= 50) {
            return 'moderate';
        }
        return 'struggling';
    }
}
