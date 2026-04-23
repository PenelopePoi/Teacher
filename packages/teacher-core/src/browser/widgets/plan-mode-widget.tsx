import { ReactWidget } from '@theia/core/lib/browser';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import { Emitter, Event } from '@theia/core/lib/common/event';
import * as React from '@theia/core/shared/react';

/**
 * Plan Mode Panel — the single highest-leverage pattern in agent IDEs.
 *
 * Shows a read-only plan before any code executes. Each step has a
 * risk level, affected files, and can be individually toggled on/off.
 */

type PlanState = 'drafting' | 'reviewing' | 'approved' | 'executing';
type RiskLevel = 'low' | 'medium' | 'high';

interface PlanStep {
    readonly id: number;
    readonly description: string;
    readonly files: string[];
    readonly risk: RiskLevel;
    readonly estimatedMinutes: number;
    readonly dependsOn: number[];
    enabled: boolean;
    status: 'pending' | 'approved' | 'executing' | 'completed';
}

@injectable()
export class PlanModeWidget extends ReactWidget {

    static readonly ID = 'teacher-plan-mode';
    static readonly LABEL = nls.localize('theia/teacher/planMode', 'Plan Mode');

    protected readonly _onDidRequestApprove = new Emitter<void>();
    readonly onDidRequestApprove: Event<void> = this._onDidRequestApprove.event;

    protected readonly _onDidRequestReject = new Emitter<void>();
    readonly onDidRequestReject: Event<void> = this._onDidRequestReject.event;

    protected planTitle: string = 'No active plan';
    protected planState: PlanState = 'drafting';
    protected steps: PlanStep[] = [];
    protected executingIndex: number = -1;

    @postConstruct()
    protected init(): void {
        this.id = PlanModeWidget.ID;
        this.title.label = PlanModeWidget.LABEL;
        this.title.caption = PlanModeWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-map';
        this.addClass('teacher-plan-mode');
    }

    /**
     * Called externally (by orchestrator or session manager) to load a plan.
     */
    setPlan(title: string, state: PlanState, steps: PlanStep[]): void {
        this.planTitle = title;
        this.planState = state;
        this.steps = steps;
        this.executingIndex = steps.findIndex(s => s.status === 'executing');
        this.update();
    }

    /**
     * Update the state of the plan (e.g., from reviewing → executing).
     */
    setPlanState(state: PlanState): void {
        this.planState = state;
        this.update();
    }

    /**
     * Update a single step's status.
     */
    updateStepStatus(stepId: number, status: PlanStep['status']): void {
        const step = this.steps.find(s => s.id === stepId);
        if (step) {
            step.status = status;
            if (status === 'executing') {
                this.executingIndex = this.steps.indexOf(step);
            }
            this.update();
        }
    }

    hasPlan(): boolean {
        return this.steps.length > 0;
    }

    protected handleToggleStep = (stepId: number): void => {
        const step = this.steps.find(s => s.id === stepId);
        if (step) {
            step.enabled = !step.enabled;
            this.update();
        }
    };

    protected handleApprove = (): void => {
        this.planState = 'approved';
        this.steps.forEach(s => {
            if (s.enabled && s.status === 'pending') {
                s.status = 'approved';
            }
        });
        this.update();
        this._onDidRequestApprove.fire();
    };

    protected handleReject = (): void => {
        this.planState = 'drafting';
        this.steps.forEach(s => {
            s.status = 'pending';
        });
        this.update();
        this._onDidRequestReject.fire();
    };

    protected stateLabel(state: PlanState): string {
        switch (state) {
            case 'drafting': return nls.localize('theia/teacher/planDrafting', 'Drafting');
            case 'reviewing': return nls.localize('theia/teacher/planReviewing', 'Reviewing');
            case 'approved': return nls.localize('theia/teacher/planApproved', 'Approved');
            case 'executing': return nls.localize('theia/teacher/planExecuting', 'Executing');
        }
    }

    protected render(): React.ReactNode {
        return (
            <div className='teacher-plan-mode-container'>
                {this.renderTopBar()}
                <div className='teacher-plan-mode-steps'>
                    {this.steps.map(step => this.renderStep(step))}
                </div>
            </div>
        );
    }

    protected renderTopBar(): React.ReactNode {
        return (
            <div className='teacher-plan-mode-topbar'>
                <span className={`teacher-plan-mode-badge teacher-plan-mode-badge--${this.planState}`}>
                    {this.stateLabel(this.planState)}
                </span>
                <span className='teacher-plan-mode-plan-title'>
                    {this.planTitle}
                </span>
                <div className='teacher-plan-mode-actions'>
                    <button
                        type='button'
                        className='teacher-plan-mode-btn teacher-plan-mode-btn--approve'
                        onClick={this.handleApprove}
                    >
                        <i className='codicon codicon-check' />
                        {nls.localize('theia/teacher/planApproveBtn', 'Approve Plan')}
                    </button>
                    <button
                        type='button'
                        className='teacher-plan-mode-btn teacher-plan-mode-btn--reject'
                        onClick={this.handleReject}
                    >
                        <i className='codicon codicon-close' />
                        {nls.localize('theia/teacher/planRejectBtn', 'Reject')}
                    </button>
                </div>
            </div>
        );
    }

    protected renderStep(step: PlanStep): React.ReactNode {
        const riskClass = `teacher-plan-mode-step--${step.risk}`;
        const statusClass = `teacher-plan-mode-step--${step.status}`;

        return (
            <div
                key={step.id}
                className={`teacher-plan-mode-step ${riskClass} ${statusClass} ${!step.enabled ? 'teacher-plan-mode-step--disabled' : ''}`}
            >
                <div className='teacher-plan-mode-step-left'>
                    <input
                        type='checkbox'
                        className='teacher-plan-mode-step-checkbox'
                        checked={step.enabled}
                        onChange={() => this.handleToggleStep(step.id)}
                    />
                    <span className='teacher-plan-mode-step-number'>{step.id}</span>
                </div>
                <div className='teacher-plan-mode-step-body'>
                    <div className='teacher-plan-mode-step-header'>
                        <span className='teacher-plan-mode-step-desc'>{step.description}</span>
                        {this.renderStatusIcon(step)}
                    </div>
                    <div className='teacher-plan-mode-step-meta'>
                        {step.files.map(file => (
                            <span key={file} className='teacher-plan-mode-file-badge'>
                                <i className='codicon codicon-file' />
                                {file}
                            </span>
                        ))}
                        <span className={`teacher-plan-mode-risk-badge teacher-plan-mode-risk-badge--${step.risk}`}>
                            {step.risk === 'high' && <i className='codicon codicon-warning' />}
                            {step.risk.toUpperCase()}
                        </span>
                        <span className='teacher-plan-mode-time-badge'>
                            <i className='codicon codicon-clock' />
                            {nls.localize('theia/teacher/planEstMinutes', '~{0}m', step.estimatedMinutes)}
                        </span>
                    </div>
                    {this.renderAIReasoning(step)}
                    {step.dependsOn.length > 0 && (
                        <div className='teacher-plan-mode-dependencies'>
                            <i className='codicon codicon-git-merge' />
                            <span className='teacher-plan-mode-dep-label'>
                                {nls.localize('theia/teacher/planDependsOn', 'Depends on:')}
                            </span>
                            {step.dependsOn.map(depId => (
                                <span key={depId} className='teacher-plan-mode-dep-badge'>
                                    {nls.localize('theia/teacher/planStep', 'Step {0}', depId)}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    protected readonly aiReasoningMap: Record<number, string> = {
        1: nls.localize('theia/teacher/planReason1', 'Authentication service is the foundation \u2014 all other auth features depend on it. Starting here ensures clean separation of concerns.'),
        2: nls.localize('theia/teacher/planReason2', 'The login component provides the user-facing entry point. Building it right after the service keeps the feedback loop tight.'),
        3: nls.localize('theia/teacher/planReason3', 'JWT middleware secures all API routes. Setting this up before database changes ensures no unprotected endpoints exist during development.'),
        4: nls.localize('theia/teacher/planReason4', 'Schema changes are high-risk and irreversible in production. Placing this step after middleware ensures the auth layer is verified first.'),
        5: nls.localize('theia/teacher/planReason5', 'Route guards enforce frontend access control. They depend on the JWT middleware being functional to validate tokens.'),
        6: nls.localize('theia/teacher/planReason6', 'Integration tests come last to verify the entire auth flow end-to-end after all components are in place.'),
    };

    protected readonly altApproachSteps: Record<number, string> = {
        3: nls.localize('theia/teacher/planAlt3', 'The AI considered using session-based auth instead of JWT, but JWT is more scalable for API-first architectures.'),
        4: nls.localize('theia/teacher/planAlt4', 'The AI considered using an ORM migration tool, but raw SQL gives more control over the schema for this use case.'),
    };

    protected expandedReasoningSteps: Set<number> = new Set();

    protected handleToggleReasoning = (stepId: number): void => {
        if (this.expandedReasoningSteps.has(stepId)) {
            this.expandedReasoningSteps.delete(stepId);
        } else {
            this.expandedReasoningSteps.add(stepId);
        }
        this.update();
    };

    protected renderAIReasoning(step: PlanStep): React.ReactNode {
        const reasoning = this.aiReasoningMap[step.id];
        if (!reasoning) { return null; }
        const isExpanded = this.expandedReasoningSteps.has(step.id);
        const altApproach = this.altApproachSteps[step.id];

        return (
            <div className='teacher-ai-reasoning'>
                <button
                    type='button'
                    className='teacher-ai-reasoning-toggle'
                    onClick={() => this.handleToggleReasoning(step.id)}
                >
                    <i className={`codicon ${isExpanded ? 'codicon-chevron-down' : 'codicon-chevron-right'}`} />
                    <i className='codicon codicon-info' />
                    {nls.localize('theia/teacher/whyThisStep', 'Why this step?')}
                </button>
                {isExpanded && (
                    <div className='teacher-ai-reasoning-body'>
                        <p className='teacher-ai-reasoning-text'>{reasoning}</p>
                        {altApproach && (
                            <div className='teacher-ai-reasoning-alt'>
                                <i className='codicon codicon-git-compare' />
                                <span>{altApproach}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    protected renderStatusIcon(step: PlanStep): React.ReactNode {
        switch (step.status) {
            case 'completed':
                return <i className='codicon codicon-check-all teacher-plan-mode-status-icon teacher-plan-mode-status-icon--completed' />;
            case 'approved':
                return <i className='codicon codicon-check teacher-plan-mode-status-icon teacher-plan-mode-status-icon--approved' />;
            case 'executing':
                return <span className='teacher-plan-mode-spinner' />;
            default:
                return null;
        }
    }
}
