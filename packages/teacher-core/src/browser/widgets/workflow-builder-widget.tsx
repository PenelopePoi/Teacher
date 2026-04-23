import { ReactWidget } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import { MessageService } from '@theia/core/lib/common/message-service';
import * as React from '@theia/core/shared/react';
import { SkillEngineService } from '../../common/skill-engine-protocol';
import { PulseService } from '../pulse/pulse-service';

/**
 * Workflow Builder — visual pipeline editor for chaining skills.
 *
 * Pre-built workflows + custom builder for composing
 * multi-skill pipelines with auto-trigger support.
 */

type WorkflowTrigger = 'pre-commit' | 'session-start' | 'daily' | 'manual';
type StepDomain = 'meta' | 'security' | 'creativity' | 'business' | 'engineering' | 'education';

interface WorkflowStep {
    readonly skillName: string;
    readonly domain: StepDomain;
}

interface Workflow {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly steps: WorkflowStep[];
    readonly trigger: WorkflowTrigger;
}

const PREBUILT_WORKFLOWS: Workflow[] = [
    {
        id: 'code-review',
        name: 'Code Review Pipeline',
        description: 'Quality loop, simplify, then strip AI language for human-ready output',
        steps: [
            { skillName: 'quality-loop', domain: 'meta' },
            { skillName: 'simplify', domain: 'meta' },
            { skillName: 'anti-ai-language', domain: 'meta' },
        ],
        trigger: 'pre-commit',
    },
    {
        id: 'learning-session',
        name: 'Learning Session',
        description: 'Interview for context, teach, then debrief for retention',
        steps: [
            { skillName: 'ask-interview', domain: 'education' },
            { skillName: 'learning-teaching-suite', domain: 'education' },
            { skillName: 'portable-debrief', domain: 'education' },
        ],
        trigger: 'manual',
    },
    {
        id: 'security-audit',
        name: 'Security Audit',
        description: 'Full web vulnerability scan, supply chain check, and report generation',
        steps: [
            { skillName: 'web-vuln-audit', domain: 'security' },
            { skillName: 'supply-chain-audit', domain: 'security' },
            { skillName: 'report-writer', domain: 'security' },
        ],
        trigger: 'manual',
    },
    {
        id: 'brand-package',
        name: 'Brand Package',
        description: 'Apply brand voice, create package, then verify consistency',
        steps: [
            { skillName: 'xela-brand-voice', domain: 'business' },
            { skillName: 'brand-package-creator', domain: 'business' },
            { skillName: 'xela-brand-checker', domain: 'business' },
        ],
        trigger: 'manual',
    },
    {
        id: 'self-improvement',
        name: 'Self-Improvement',
        description: 'Measure skill metrics, improve weak skills, gate for quality',
        steps: [
            { skillName: 'skill-metrics', domain: 'meta' },
            { skillName: 'skill-improve', domain: 'meta' },
            { skillName: 'skill-quality-gate', domain: 'meta' },
        ],
        trigger: 'daily',
    },
    {
        id: 'session-start',
        name: 'Session Start',
        description: 'Morning briefing, timeline alignment, and energy state assessment',
        steps: [
            { skillName: 'morning-briefing', domain: 'meta' },
            { skillName: 'best-timeline-aligner', domain: 'meta' },
            { skillName: 'energy-state-reader', domain: 'meta' },
        ],
        trigger: 'session-start',
    },
];

@injectable()
export class WorkflowBuilderWidget extends ReactWidget {

    static readonly ID = 'teacher-workflow-builder';
    static readonly LABEL = nls.localize('theia/teacher/workflowBuilder', 'Workflows');

    @inject(SkillEngineService)
    protected readonly skillEngine: SkillEngineService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(PulseService)
    protected readonly pulse: PulseService;

    protected workflows: Workflow[] = [...PREBUILT_WORKFLOWS];
    protected expandedWorkflow: string | null = null;
    protected newWorkflowName: string = '';
    protected runningWorkflow: string | undefined;

    @postConstruct()
    protected init(): void {
        this.id = WorkflowBuilderWidget.ID;
        this.title.label = WorkflowBuilderWidget.LABEL;
        this.title.caption = WorkflowBuilderWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-git-merge';
        this.addClass('teacher-workflow-builder');
    }

    protected handleToggleWorkflow = (id: string): void => {
        this.expandedWorkflow = this.expandedWorkflow === id ? null : id;
        this.update();
    };

    protected handleRunWorkflow = async (workflow: Workflow): Promise<void> => {
        this.runningWorkflow = workflow.id;
        this.pulse.set('thinking', { label: `Running: ${workflow.name}` });
        this.update();

        try {
            const input = JSON.stringify({ workflowId: workflow.id, trigger: 'manual' });
            for (let i = 0; i < workflow.steps.length; i++) {
                const step = workflow.steps[i];
                this.pulse.set('thinking', { label: `Step ${i + 1}/${workflow.steps.length}: ${step.skillName}` });
                await this.skillEngine.executeSkill(step.skillName, input);
            }
            this.messageService.info(nls.localize('theia/teacher/workflowComplete',
                'Workflow "{0}" completed ({1} steps)', workflow.name, workflow.steps.length));
            this.pulse.flashSuggestion(2000, 'Workflow done');
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.messageService.warn(nls.localize('theia/teacher/workflowFailed',
                'Workflow "{0}" failed: {1}', workflow.name, msg));
            this.pulse.reset();
        }
        this.runningWorkflow = undefined;
        this.update();
    };

    protected handleRemoveStep = (workflowId: string, stepIndex: number): void => {
        const wf = this.workflows.find(w => w.id === workflowId);
        if (wf) {
            const newSteps = wf.steps.filter((_, i) => i !== stepIndex);
            this.workflows = this.workflows.map(w =>
                w.id === workflowId ? { ...w, steps: newSteps } : w
            );
            this.update();
        }
    };

    protected handleNewWorkflowNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.newWorkflowName = e.target.value;
        this.update();
    };

    protected handleCreateWorkflow = (): void => {
        if (this.newWorkflowName.trim()) {
            const newWorkflow: Workflow = {
                id: `custom-${Date.now()}`,
                name: this.newWorkflowName.trim(),
                description: 'Custom workflow',
                steps: [],
                trigger: 'manual',
            };
            this.workflows = [...this.workflows, newWorkflow];
            this.newWorkflowName = '';
            this.expandedWorkflow = newWorkflow.id;
            this.update();
        }
    };

    protected triggerLabel = (trigger: WorkflowTrigger): string => {
        switch (trigger) {
            case 'pre-commit': return nls.localize('theia/teacher/triggerPreCommit', 'Triggers on: pre-commit');
            case 'session-start': return nls.localize('theia/teacher/triggerSessionStart', 'Triggers on: session-start');
            case 'daily': return nls.localize('theia/teacher/triggerDaily', 'Triggers on: daily');
            case 'manual': return nls.localize('theia/teacher/triggerManual', 'Manual');
        }
    };

    protected render(): React.ReactNode {
        return (
            <div className='teacher-workflow-builder-container'>
                <div className='teacher-workflow-builder-header'>
                    <input
                        type='text'
                        className='teacher-workflow-builder-name-input'
                        placeholder={nls.localize('theia/teacher/workflowNamePlaceholder', 'New workflow name...')}
                        value={this.newWorkflowName}
                        onChange={this.handleNewWorkflowNameChange}
                    />
                    <button
                        type='button'
                        className='teacher-workflow-builder-new-btn'
                        onClick={this.handleCreateWorkflow}
                    >
                        <i className='codicon codicon-add' />
                        {nls.localize('theia/teacher/newWorkflow', 'New Workflow')}
                    </button>
                </div>

                <div className='teacher-workflow-builder-list'>
                    {this.workflows.map(wf => (
                        <div key={wf.id} className='teacher-workflow-builder-card'>
                            <div
                                className='teacher-workflow-builder-card-header'
                                onClick={() => this.handleToggleWorkflow(wf.id)}
                            >
                                <div className='teacher-workflow-builder-card-title-row'>
                                    <i className={`codicon ${this.expandedWorkflow === wf.id ? 'codicon-chevron-down' : 'codicon-chevron-right'}`} />
                                    <span className='teacher-workflow-builder-card-name'>{wf.name}</span>
                                    <span className='teacher-workflow-builder-step-badge'>
                                        {wf.steps.length} {nls.localize('theia/teacher/steps', 'steps')}
                                    </span>
                                    {wf.trigger !== 'manual' && (
                                        <span className='teacher-workflow-builder-trigger-badge'>
                                            {this.triggerLabel(wf.trigger)}
                                        </span>
                                    )}
                                </div>
                                <span className='teacher-workflow-builder-card-desc'>{wf.description}</span>
                            </div>

                            {this.expandedWorkflow === wf.id && (
                                <div className='teacher-workflow-builder-card-expanded'>
                                    <div className='teacher-workflow-builder-pipeline'>
                                        {wf.steps.map((step, i) => (
                                            <React.Fragment key={step.skillName}>
                                                <div className={`teacher-workflow-builder-step teacher-workflow-builder-step--${step.domain}`}>
                                                    <span className={`teacher-workflow-builder-step-dot teacher-workflow-builder-step-dot--${step.domain}`} />
                                                    <span className='teacher-workflow-builder-step-name'>{step.skillName}</span>
                                                    <button
                                                        type='button'
                                                        className='teacher-workflow-builder-step-remove'
                                                        onClick={() => this.handleRemoveStep(wf.id, i)}
                                                        title={nls.localize('theia/teacher/removeStep', 'Remove step')}
                                                        aria-label={nls.localize('theia/teacher/removeStep', 'Remove step')}
                                                    >
                                                        <i className='codicon codicon-close' aria-hidden='true' />
                                                    </button>
                                                </div>
                                                {i < wf.steps.length - 1 && (
                                                    <span className='teacher-workflow-builder-arrow'>
                                                        <i className='codicon codicon-arrow-right' />
                                                    </span>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                    <button
                                        type='button'
                                        className='teacher-workflow-builder-run-btn'
                                        onClick={() => this.handleRunWorkflow(wf)}
                                    >
                                        <i className='codicon codicon-play' />
                                        {nls.localize('theia/teacher/runWorkflow', 'Run Workflow')}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}
