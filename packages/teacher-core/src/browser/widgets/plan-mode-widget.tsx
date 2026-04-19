import { ReactWidget } from '@theia/core/lib/browser';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
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

    protected planState: PlanState = 'reviewing';
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

        this.loadDemoData();
    }

    protected loadDemoData(): void {
        this.steps = [
            { id: 1, description: 'Create auth service', files: ['src/auth/service.ts'], risk: 'low', estimatedMinutes: 5, dependsOn: [], enabled: true, status: 'completed' },
            { id: 2, description: 'Add login component', files: ['src/components/Login.tsx'], risk: 'low', estimatedMinutes: 8, dependsOn: [1], enabled: true, status: 'approved' },
            { id: 3, description: 'Set up JWT middleware', files: ['src/middleware/auth.ts'], risk: 'medium', estimatedMinutes: 12, dependsOn: [1], enabled: true, status: 'executing' },
            { id: 4, description: 'Update database schema', files: ['migrations/004_users.sql'], risk: 'high', estimatedMinutes: 15, dependsOn: [1, 3], enabled: true, status: 'pending' },
            { id: 5, description: 'Add route guards', files: ['src/router/guards.ts'], risk: 'low', estimatedMinutes: 6, dependsOn: [3], enabled: true, status: 'pending' },
            { id: 6, description: 'Write integration tests', files: ['tests/auth.spec.ts'], risk: 'low', estimatedMinutes: 10, dependsOn: [2, 3, 4, 5], enabled: true, status: 'pending' },
        ];
        this.executingIndex = 2;
        this.planState = 'executing';
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
    };

    protected handleReject = (): void => {
        this.planState = 'drafting';
        this.steps.forEach(s => {
            s.status = 'pending';
        });
        this.update();
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
                    {nls.localize('theia/teacher/planTitle', 'Add user authentication')}
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
