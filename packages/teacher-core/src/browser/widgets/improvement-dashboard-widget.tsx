import { ReactWidget } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import { MessageService } from '@theia/core/lib/common/message-service';
import * as React from '@theia/core/shared/react';
import { SkillEngineService } from '../../common/skill-engine-protocol';
import { PulseService } from '../pulse/pulse-service';

/**
 * Improvement Dashboard — skill metrics and self-improvement loop status.
 *
 * Shows skill health across the 343-skill library with
 * scores, execution history, and the self-improvement engine status.
 */

interface SkillMetric {
    readonly name: string;
    readonly score: number;
    readonly executions: number;
    readonly domain: string;
}

interface ExecutionEntry {
    readonly skillName: string;
    readonly inputPreview: string;
    readonly score: number;
    readonly timestamp: number;
}

type LoopStatus = 'idle' | 'running' | 'completed';

const TOP_PERFORMERS: SkillMetric[] = [
    { name: 'quality-loop', score: 9.4, executions: 87, domain: 'meta' },
    { name: 'anti-ai-language', score: 9.2, executions: 124, domain: 'meta' },
    { name: 'web-vuln-audit', score: 9.1, executions: 43, domain: 'security' },
    { name: 'xela-brand-voice', score: 8.9, executions: 56, domain: 'business' },
    { name: 'firebase-ops', score: 8.8, executions: 38, domain: 'engineering' },
];

const NEEDS_IMPROVEMENT: SkillMetric[] = [
    { name: 'creativity-spectrum-classifier', score: 3.2, executions: 5, domain: 'creativity' },
    { name: 'container-escape', score: 3.8, executions: 2, domain: 'security' },
    { name: 'vinyl-release', score: 4.1, executions: 7, domain: 'creativity' },
    { name: 'protobuf-attack', score: 4.5, executions: 3, domain: 'security' },
    { name: 'frida-script-gen', score: 4.9, executions: 4, domain: 'engineering' },
];

const RECENT_EXECUTIONS: ExecutionEntry[] = [
    { skillName: 'quality-loop', inputPreview: 'Review PR #247 changes...', score: 9.1, timestamp: Date.now() - 120000 },
    { skillName: 'anti-ai-language', inputPreview: 'Clean proposal draft for...', score: 8.7, timestamp: Date.now() - 480000 },
    { skillName: 'web-vuln-audit', inputPreview: 'Audit /api/auth endpoint...', score: 9.3, timestamp: Date.now() - 900000 },
    { skillName: 'simplify', inputPreview: 'Refactor canvas-widget.tsx...', score: 7.8, timestamp: Date.now() - 1800000 },
    { skillName: 'xela-brand-voice', inputPreview: 'Generate tagline for...', score: 8.5, timestamp: Date.now() - 2700000 },
    { skillName: 'threat-model', inputPreview: 'STRIDE analysis for user...', score: 6.4, timestamp: Date.now() - 3600000 },
    { skillName: 'cognitive-load-guard', inputPreview: 'Monitor session complexity...', score: 7.2, timestamp: Date.now() - 5400000 },
    { skillName: 'firebase-ops', inputPreview: 'Deploy security rules...', score: 8.1, timestamp: Date.now() - 7200000 },
    { skillName: 'honest-mirror', inputPreview: 'Evaluate business plan...', score: 6.9, timestamp: Date.now() - 9000000 },
    { skillName: 'supply-chain-audit', inputPreview: 'Scan package-lock.json...', score: 9.0, timestamp: Date.now() - 10800000 },
];

@injectable()
export class ImprovementDashboardWidget extends ReactWidget {

    static readonly ID = 'teacher-improvement-dashboard';
    static readonly LABEL = nls.localize('theia/teacher/improvementDashboard', 'Skill Health');

    @inject(SkillEngineService)
    protected readonly skillEngine: SkillEngineService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(PulseService)
    protected readonly pulse: PulseService;

    protected topPerformers: SkillMetric[] = TOP_PERFORMERS;
    protected needsImprovement: SkillMetric[] = NEEDS_IMPROVEMENT;
    protected recentExecutions: ExecutionEntry[] = RECENT_EXECUTIONS;
    protected loopStatus: LoopStatus = 'idle';
    protected lastLoopRun: number = Date.now() - 7200000;
    protected improvementsMade: number = 14;
    protected nextScheduled: number = Date.now() + 14400000;

    @postConstruct()
    protected init(): void {
        this.id = ImprovementDashboardWidget.ID;
        this.title.label = ImprovementDashboardWidget.LABEL;
        this.title.caption = ImprovementDashboardWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-dashboard';
        this.addClass('teacher-improvement-dashboard');
        this.loadFromBackend();
    }

    protected async loadFromBackend(): Promise<void> {
        try {
            const metrics = await this.skillEngine.getTopSkills(5);
            if (metrics && metrics.length > 0) {
                this.topPerformers = metrics.map(m => ({
                    name: m.skillName,
                    score: m.avgScore,
                    executions: m.executionCount,
                    domain: 'meta',
                }));
            }
            const lowPerformers = await this.skillEngine.getLowPerformers(5.0);
            if (lowPerformers && lowPerformers.length > 0) {
                this.needsImprovement = lowPerformers.slice(0, 5).map(m => ({
                    name: m.skillName,
                    score: m.avgScore,
                    executions: m.executionCount,
                    domain: 'meta',
                }));
            }
            this.update();
        } catch {
            // Keep demo data
        }
    }

    protected handleRunLoop = async (): Promise<void> => {
        this.loopStatus = 'running';
        this.pulse.set('thinking', { label: 'Self-improvement loop running...' });
        this.update();

        try {
            const loopSkills = ['skill-metrics', 'skill-improve', 'skill-quality-gate'];
            for (const skill of loopSkills) {
                await this.skillEngine.executeSkill(skill, JSON.stringify({ trigger: 'manual-loop' }));
            }
            this.loopStatus = 'completed';
            this.lastLoopRun = Date.now();
            this.improvementsMade += 3;
            this.pulse.flashSuggestion(2000, 'Improvement loop complete');
            this.messageService.info(nls.localize('theia/teacher/loopDone', 'Self-improvement loop completed'));
            this.loadFromBackend(); // Refresh metrics
        } catch (err) {
            this.loopStatus = 'idle';
            this.pulse.reset();
            const msg = err instanceof Error ? err.message : String(err);
            this.messageService.warn(nls.localize('theia/teacher/loopError', 'Improvement loop failed: {0}', msg));
        }
        this.update();
    };

    protected handleImproveSkill = async (skillName: string): Promise<void> => {
        this.pulse.set('thinking', { label: `Improving: ${skillName}` });
        try {
            await this.skillEngine.executeSkill('skill-improve', JSON.stringify({ target: skillName }));
            this.messageService.info(nls.localize('theia/teacher/skillImproved', 'Skill "{0}" improved', skillName));
            this.pulse.flashSuggestion(1500, 'Skill improved');
            this.loadFromBackend();
        } catch {
            this.messageService.warn(nls.localize('theia/teacher/skillImproveError', 'Could not improve "{0}"', skillName));
            this.pulse.reset();
        }
    };

    protected scoreColorClass = (score: number): string => {
        if (score >= 8) { return 'teacher-improvement-score--green'; }
        if (score >= 5) { return 'teacher-improvement-score--amber'; }
        return 'teacher-improvement-score--red';
    };

    protected formatTimeAgo = (ts: number): string => {
        const diff = Date.now() - ts;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) { return nls.localize('theia/teacher/justNow', 'just now'); }
        if (minutes < 60) { return `${minutes}m ago`; }
        const hours = Math.floor(minutes / 60);
        if (hours < 24) { return `${hours}h ago`; }
        return `${Math.floor(hours / 24)}d ago`;
    };

    protected formatTimeUntil = (ts: number): string => {
        const diff = ts - Date.now();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    };

    protected render(): React.ReactNode {
        return (
            <div className='teacher-improvement-dashboard-container'>
                {this.renderSummaryCards()}
                {this.renderSelfImprovementLoop()}
                {this.renderTopPerformers()}
                {this.renderNeedsImprovement()}
                {this.renderRecentExecutions()}
            </div>
        );
    }

    protected renderSummaryCards(): React.ReactNode {
        const cards = [
            { label: nls.localize('theia/teacher/totalSkills', 'Total Skills'), value: '343', icon: 'codicon-library' },
            { label: nls.localize('theia/teacher/avgScore', 'Avg Score'), value: '7.2', icon: 'codicon-graph' },
            { label: nls.localize('theia/teacher/execToday', 'Executions Today'), value: '12', icon: 'codicon-play-circle' },
            { label: nls.localize('theia/teacher/lowPerformers', 'Low Performers'), value: '8', icon: 'codicon-warning' },
        ];

        return (
            <div className='teacher-improvement-summary-grid'>
                {cards.map(card => (
                    <div key={card.label} className='teacher-improvement-summary-card'>
                        <i className={`codicon ${card.icon} teacher-improvement-summary-icon`} />
                        <span className='teacher-improvement-summary-value'>{card.value}</span>
                        <span className='teacher-improvement-summary-label'>{card.label}</span>
                    </div>
                ))}
            </div>
        );
    }

    protected renderSelfImprovementLoop(): React.ReactNode {
        const isRunning = this.loopStatus === 'running';

        return (
            <div className={`teacher-improvement-loop-card ${isRunning ? 'teacher-improvement-loop-card--running' : ''}`}>
                <div className='teacher-improvement-loop-header'>
                    <i className='codicon codicon-sync teacher-improvement-loop-icon' />
                    <span className='teacher-improvement-loop-title'>
                        {nls.localize('theia/teacher/selfImprovementLoop', 'Self-Improvement Loop')}
                    </span>
                </div>
                <div className='teacher-improvement-loop-details'>
                    <div className='teacher-improvement-loop-stat'>
                        <span className='teacher-improvement-loop-stat-label'>
                            {nls.localize('theia/teacher/status', 'Status')}
                        </span>
                        <span className={`teacher-improvement-loop-status teacher-improvement-loop-status--${this.loopStatus}`}>
                            {isRunning
                                ? nls.localize('theia/teacher/loopRunning', 'Running...')
                                : nls.localize('theia/teacher/loopLastRun', 'Last run: {0}', this.formatTimeAgo(this.lastLoopRun))
                            }
                        </span>
                    </div>
                    <div className='teacher-improvement-loop-stat'>
                        <span className='teacher-improvement-loop-stat-label'>
                            {nls.localize('theia/teacher/improvementsMade', 'Improvements')}
                        </span>
                        <span className='teacher-improvement-loop-improvements-badge'>{this.improvementsMade}</span>
                    </div>
                    <div className='teacher-improvement-loop-stat'>
                        <span className='teacher-improvement-loop-stat-label'>
                            {nls.localize('theia/teacher/nextScheduled', 'Next Scheduled')}
                        </span>
                        <span className='teacher-improvement-loop-next'>
                            {this.formatTimeUntil(this.nextScheduled)}
                        </span>
                    </div>
                </div>
                <button
                    type='button'
                    className='teacher-improvement-loop-run-btn'
                    onClick={this.handleRunLoop}
                    disabled={isRunning}
                >
                    <i className={`codicon ${isRunning ? 'codicon-loading codicon-modifier-spin' : 'codicon-play'}`} />
                    {isRunning
                        ? nls.localize('theia/teacher/loopProcessing', 'Processing...')
                        : nls.localize('theia/teacher/runNow', 'Run Now')
                    }
                </button>
            </div>
        );
    }

    protected renderTopPerformers(): React.ReactNode {
        return (
            <div className='teacher-improvement-section'>
                <h3 className='teacher-improvement-section-title'>
                    <i className='codicon codicon-star-full' />
                    {nls.localize('theia/teacher/topPerformers', 'Top Performers')}
                </h3>
                <div className='teacher-improvement-skill-list'>
                    {TOP_PERFORMERS.map(skill => (
                        <div key={skill.name} className='teacher-improvement-skill-row'>
                            <span className='teacher-improvement-skill-name'>{skill.name}</span>
                            <div className='teacher-improvement-score-bar-container'>
                                <div
                                    className={`teacher-improvement-score-bar ${this.scoreColorClass(skill.score)}`}
                                    style={{ width: `${skill.score * 10}%` }}
                                />
                            </div>
                            <span className={`teacher-improvement-score-value ${this.scoreColorClass(skill.score)}`}>
                                {skill.score.toFixed(1)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    protected renderNeedsImprovement(): React.ReactNode {
        return (
            <div className='teacher-improvement-section'>
                <h3 className='teacher-improvement-section-title'>
                    <i className='codicon codicon-warning' />
                    {nls.localize('theia/teacher/needsImprovement', 'Needs Improvement')}
                </h3>
                <div className='teacher-improvement-skill-list'>
                    {NEEDS_IMPROVEMENT.map(skill => (
                        <div key={skill.name} className='teacher-improvement-skill-row'>
                            <span className='teacher-improvement-skill-name'>{skill.name}</span>
                            <div className='teacher-improvement-score-bar-container'>
                                <div
                                    className={`teacher-improvement-score-bar ${this.scoreColorClass(skill.score)}`}
                                    style={{ width: `${skill.score * 10}%` }}
                                />
                            </div>
                            <span className={`teacher-improvement-score-value ${this.scoreColorClass(skill.score)}`}>
                                {skill.score.toFixed(1)}
                            </span>
                            <button
                                type='button'
                                className='teacher-improvement-improve-btn'
                                onClick={() => this.handleImproveSkill(skill.name)}
                            >
                                <i className='codicon codicon-sparkle' />
                                {nls.localize('theia/teacher/improve', 'Improve')}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    protected renderRecentExecutions(): React.ReactNode {
        return (
            <div className='teacher-improvement-section'>
                <h3 className='teacher-improvement-section-title'>
                    <i className='codicon codicon-history' />
                    {nls.localize('theia/teacher/recentExecutions', 'Recent Executions')}
                </h3>
                <div className='teacher-improvement-execution-list'>
                    {RECENT_EXECUTIONS.map((exec, i) => (
                        <div key={`${exec.skillName}-${i}`} className='teacher-improvement-execution-row'>
                            <span className='teacher-improvement-execution-name'>{exec.skillName}</span>
                            <span className='teacher-improvement-execution-preview'>{exec.inputPreview}</span>
                            <span className={`teacher-improvement-execution-score ${this.scoreColorClass(exec.score)}`}>
                                {exec.score.toFixed(1)}
                            </span>
                            <span className='teacher-improvement-execution-time'>
                                {this.formatTimeAgo(exec.timestamp)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}
