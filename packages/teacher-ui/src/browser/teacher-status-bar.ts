import * as React from 'react';
import { injectable, inject } from 'inversify';
import { StatusBarImpl } from '@theia/core/lib/browser/status-bar/status-bar';
import { StatusBarViewEntry } from '@theia/core/lib/browser/status-bar/status-bar-types';
import { nls } from '@theia/core/lib/common/nls';
import { AgentModeService } from './agent-mode-service';
import { AgentSessionManager } from './agent-session-manager';

/**
 * Enhanced status bar for Teacher IDE — agent-first.
 *
 * Strips encoding, line-ending, and other confetti entries that distract.
 * Adds:
 *   - Agent mode indicator with color dot (click cycles mode)
 *   - Action counter + checkpoint count
 *   - Session timer
 *
 * Format: [*] SUPERVISED | 12 actions * 3 ckpts | 45m
 */
@injectable()
export class TeacherStatusBar extends StatusBarImpl {

    @inject(AgentModeService)
    protected readonly agentModeService: AgentModeService;

    @inject(AgentSessionManager)
    protected readonly sessionManager: AgentSessionManager;

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
        this.sessionManager.onDidRecordAction(() => this.update());
        this.sessionManager.onDidCreateCheckpoint(() => this.update());

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
        leftEntries.push(
            React.createElement('div', {
                key: 'teacher-agent-mode',
                className: 'element teacher-agent-mode-indicator',
                title: nls.localize('theia/teacher/agentMode', 'Agent Mode: {0} (Shift+Tab to cycle)', meta.label),
                'aria-label': meta.label,
                onClick: () => this.agentModeService.cycleMode(),
            },
                React.createElement('span', {
                    className: `teacher-agent-mode-dot ${meta.dotClass}`,
                }),
                React.createElement('span', {
                    className: 'teacher-agent-mode-label',
                }, meta.label)
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

        // --- Action Counter + Checkpoints (right side) ---
        const actionCount = this.sessionManager.getActionCount();
        const checkpointCount = this.sessionManager.getCheckpoints().length;
        rightEntries.push(
            React.createElement('div', {
                key: 'teacher-action-counter',
                className: 'element teacher-agent-action-counter',
                title: nls.localize('theia/teacher/agentActions', '{0} actions, {1} checkpoints', actionCount, checkpointCount),
            },
                `${actionCount} actions \u00B7 ${checkpointCount} ckpts`
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
