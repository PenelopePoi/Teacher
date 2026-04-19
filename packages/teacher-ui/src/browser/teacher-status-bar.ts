import * as React from 'react';
import { injectable, inject } from 'inversify';
import { StatusBarImpl } from '@theia/core/lib/browser/status-bar/status-bar';
import { StatusBarViewEntry } from '@theia/core/lib/browser/status-bar/status-bar-types';
import { nls } from '@theia/core/lib/common/nls';
import { AgentModeService } from './agent-mode-service';
import { AgentSessionManager } from './agent-session-manager';
import { AgentContextProvider } from './agent-context-provider';

/**
 * Enhanced status bar for Teacher IDE — agent-first.
 *
 * Strips encoding, line-ending, and other confetti entries that distract.
 * Renders:
 *   [*] SUPERVISED | 12 actions * 3 ckpts | 5 files | 2E 1W | 45m
 *
 * Enhancements over v1:
 *   - Error/warning count indicator with color coding
 *   - Files touched count
 *   - Mode lock indicator
 *   - Git branch display
 *   - Plan progress indicator (when active)
 *   - Click-to-cycle mode with tooltip showing permissions
 *   - Smooth mode transition animation via CSS class cycling
 */
@injectable()
export class TeacherStatusBar extends StatusBarImpl {

    @inject(AgentModeService)
    protected readonly agentModeService: AgentModeService;

    @inject(AgentSessionManager)
    protected readonly sessionManager: AgentSessionManager;

    @inject(AgentContextProvider)
    protected readonly contextProvider: AgentContextProvider;

    /** IDs of status-bar entries that beginners don't need to see. */
    private static readonly HIDDEN_ENTRY_PATTERNS = [
        'editor-status-encoding',
        'editor-status-eol',
        'status.editor.mode',
        'status.editor.indentation',
        'vcs',
        'status-bar-branch-item',
        'editor-status-tabFocusMode',
    ];

    /** Current lesson objective text. */
    private lessonObjective = '';

    /** Timer handle for session clock updates. */
    private sessionTimerHandle: ReturnType<typeof setInterval> | undefined;

    /** Update the lesson objective shown in the status bar. */
    setLessonObjective(text: string): void {
        this.lessonObjective = text;
        this.update();
    }

    protected override onAfterAttach(msg: any): void {
        super.onAfterAttach(msg);

        // Listen for mode changes to re-render
        this.agentModeService.onDidChangeMode(() => this.update());
        this.agentModeService.onDidChangeLock(() => this.update());
        this.sessionManager.onDidRecordAction(() => this.update());
        this.sessionManager.onDidCreateCheckpoint(() => this.update());
        this.sessionManager.onDidChangePlan(() => this.update());
        this.sessionManager.onDidRewind(() => this.update());
        this.sessionManager.onDidUndo(() => this.update());
        this.sessionManager.onDidClearSession(() => this.update());
        this.contextProvider.onDidUpdateContext(() => this.update());

        // Update session timer every 30 seconds
        this.sessionTimerHandle = setInterval(() => this.update(), 30_000);
    }

    protected override onBeforeDetach(msg: any): void {
        if (this.sessionTimerHandle) {
            clearInterval(this.sessionTimerHandle);
            this.sessionTimerHandle = undefined;
        }
        super.onBeforeDetach(msg);
    }

    protected override render(): React.ReactElement {
        const leftEntries: React.ReactNode[] = [];
        const rightEntries: React.ReactNode[] = [];

        // --- Agent Mode Indicator ---
        const mode = this.agentModeService.getMode();
        const meta = AgentModeService.MODE_META[mode];
        const locked = this.agentModeService.isLocked();
        const perms = this.agentModeService.getPermissions();
        const permStr = [
            perms.readFiles ? 'R' : '-',
            perms.writeFiles ? 'W' : '-',
            perms.runCommands ? 'X' : '-',
            perms.networkAccess ? 'N' : '-',
        ].join('');

        leftEntries.push(
            React.createElement('div', {
                key: 'teacher-agent-mode',
                className: `element teacher-agent-mode-indicator ${locked ? 'teacher-agent-mode-locked' : ''}`,
                title: nls.localize(
                    'theia/teacher/agentModeTooltip',
                    'Agent Mode: {0}\nPermissions: {1}\n{2}\nShift+Tab to cycle',
                    meta.label,
                    permStr,
                    meta.description
                ),
                'aria-label': `${meta.label}${locked ? ' (locked)' : ''}`,
                onClick: this.handleModeClick,
            },
                locked
                    ? React.createElement('span', { className: 'teacher-agent-lock-icon codicon codicon-lock', 'aria-hidden': 'true' })
                    : React.createElement('span', { className: `teacher-agent-mode-dot ${meta.dotClass}` }),
                React.createElement('span', { className: 'teacher-agent-mode-label' }, meta.label)
            )
        );

        // --- AI Pulse Indicator ---
        const pulseLabel = nls.localize('theia/teacher/aiPulse', 'AI Pulse');
        leftEntries.push(
            React.createElement('div', {
                key: 'teacher-pulse-indicator',
                className: 'element teacher-pulse-dot-container',
                title: pulseLabel,
                'aria-label': pulseLabel,
            },
                React.createElement('span', { className: 'teacher-pulse-dot teacher-pulse-breathing-dot' }),
                React.createElement('span', { className: 'teacher-pulse-label' }, pulseLabel)
            )
        );

        // --- Plan Progress (when active) ---
        const plan = this.sessionManager.getPlan();
        if (plan) {
            const progress = this.sessionManager.getPlanProgress();
            const risk = this.sessionManager.getPlanRiskLevel();
            const riskClass = `teacher-plan-risk-${risk}`;
            leftEntries.push(
                React.createElement('div', {
                    key: 'teacher-plan-progress',
                    className: `element teacher-plan-progress ${riskClass}`,
                    title: nls.localize('theia/teacher/planProgress', 'Plan: {0} [{1}] {2}%', plan.title, plan.status, progress),
                },
                    React.createElement('span', { className: 'teacher-plan-progress-bar-bg' },
                        React.createElement('span', {
                            className: 'teacher-plan-progress-bar-fill',
                            style: { width: `${progress}%` },
                        })
                    ),
                    React.createElement('span', { className: 'teacher-plan-progress-text' },
                        `${progress}%`
                    )
                )
            );
        }

        // --- Lesson Objective ---
        if (this.lessonObjective) {
            leftEntries.push(
                React.createElement('div', {
                    key: 'teacher-lesson-objective',
                    className: 'element teacher-lesson-objective',
                    'aria-label': nls.localize('theia/teacher/lessonObjective', 'Lesson Objective'),
                }, this.lessonObjective)
            );
        }

        // --- Git Branch (right side) ---
        const gitBranch = this.contextProvider.getGitBranch();
        if (gitBranch) {
            rightEntries.push(
                React.createElement('div', {
                    key: 'teacher-git-branch',
                    className: 'element teacher-git-branch',
                    title: nls.localize('theia/teacher/gitBranch', 'Git branch: {0}', gitBranch),
                },
                    React.createElement('span', { className: 'codicon codicon-source-control', 'aria-hidden': 'true' }),
                    ` ${gitBranch}`
                )
            );
        }

        // --- Error/Warning Count (right side) ---
        const errorCounts = this.contextProvider.getErrorCounts();
        if (errorCounts.error > 0 || errorCounts.warning > 0) {
            rightEntries.push(
                React.createElement('div', {
                    key: 'teacher-error-count',
                    className: 'element teacher-error-count',
                    title: nls.localize('theia/teacher/errorCount', '{0} errors, {1} warnings', errorCounts.error, errorCounts.warning),
                },
                    errorCounts.error > 0
                        ? React.createElement('span', { className: 'teacher-error-count-errors' },
                            React.createElement('span', { className: 'codicon codicon-error', 'aria-hidden': 'true' }),
                            ` ${errorCounts.error}`
                        )
                        : null,
                    errorCounts.warning > 0
                        ? React.createElement('span', { className: 'teacher-error-count-warnings' },
                            React.createElement('span', { className: 'codicon codicon-warning', 'aria-hidden': 'true' }),
                            ` ${errorCounts.warning}`
                        )
                        : null
                )
            );
        }

        // --- Action Counter + Checkpoints (right side) ---
        const actionCount = this.sessionManager.getActionCount();
        const checkpointCount = this.sessionManager.getCheckpoints().length;
        const filesTouched = this.sessionManager.getFilesTouchedCount();
        rightEntries.push(
            React.createElement('div', {
                key: 'teacher-action-counter',
                className: 'element teacher-agent-action-counter',
                title: nls.localize(
                    'theia/teacher/agentActionsDetail',
                    '{0} actions, {1} checkpoints, {2} files touched',
                    actionCount, checkpointCount, filesTouched
                ),
            },
                `${actionCount} actions \u00B7 ${checkpointCount} ckpts \u00B7 ${filesTouched} files`
            )
        );

        // --- Session Timer (right side) ---
        const duration = this.sessionManager.getSessionDuration();
        const timerText = this.formatDuration(duration);
        rightEntries.push(
            React.createElement('div', {
                key: 'teacher-session-timer',
                className: 'element teacher-agent-session-timer',
                title: nls.localize('theia/teacher/sessionTimer', 'Session duration: {0}', timerText),
            }, timerText)
        );

        // Filter and render remaining entries with error handling
        try {
            if (this.viewModel) {
                for (const entry of this.viewModel.getLeft()) {
                    if (!this.isHiddenEntry(entry)) {
                        leftEntries.push(this.renderElement(entry));
                    }
                }

                for (const entry of this.viewModel.getRight()) {
                    if (!this.isHiddenEntry(entry)) {
                        rightEntries.push(this.renderElement(entry));
                    }
                }
            }
        } catch (err) {
            console.error('[TeacherStatusBar] Error rendering entries:', err);
        }

        return React.createElement(React.Fragment, null,
            React.createElement('div', { className: 'area left' }, ...leftEntries),
            React.createElement('div', { className: 'area right' }, ...rightEntries),
        );
    }

    protected handleModeClick = (): void => {
        this.agentModeService.cycleMode();
    };

    private isHiddenEntry(viewEntry: StatusBarViewEntry): boolean {
        const id = viewEntry.id.toLowerCase();
        return TeacherStatusBar.HIDDEN_ENTRY_PATTERNS.some(
            pattern => id.includes(pattern.toLowerCase())
        );
    }

    private formatDuration(ms: number): string {
        const totalMinutes = Math.floor(ms / 60_000);
        if (totalMinutes < 60) {
            return `${totalMinutes}m`;
        }
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
    }
}
