import { ReactWidget } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';
import { PulseService, PulseState } from '../pulse/pulse-service';
import { ModeCycleContribution, PermissionMode, MODE_DEFINITIONS } from '../commands/mode-cycle-command';

/**
 * §2 — Pulse Panel.
 *
 * A thin 32px horizontal strip that shows ambient AI status.
 * Left = breathing orb, Center = one-line status text,
 * Right = model name badge.
 * Click the orb to expand an activity log overlay.
 */

type PulsePanelState = 'idle' | 'thinking' | 'suggesting' | 'error';

interface ActivityLogEntry {
    readonly timestamp: number;
    readonly state: PulsePanelState;
    readonly message: string;
}

@injectable()
export class PulsePanelWidget extends ReactWidget {

    static readonly ID = 'teacher-pulse-panel';
    static readonly LABEL = nls.localize('theia/teacher/pulsePanel', 'AI Pulse');

    @inject(PulseService)
    protected readonly pulseService: PulseService;

    @inject(ModeCycleContribution)
    protected readonly modeCycle: ModeCycleContribution;

    protected currentAgentMode: PermissionMode = 'assist';
    protected currentState: PulsePanelState = 'idle';
    protected statusText: string = nls.localize('theia/teacher/pulseReady', 'Ready');
    protected modelName: string = 'qwen2.5:7b';
    protected expanded: boolean = false;
    protected activityLog: ActivityLogEntry[] = [];
    protected demoMode: boolean = false;
    protected demoTimer: ReturnType<typeof setInterval> | undefined;

    @postConstruct()
    protected init(): void {
        this.id = PulsePanelWidget.ID;
        this.title.label = PulsePanelWidget.LABEL;
        this.title.caption = PulsePanelWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-pulse';
        this.addClass('teacher-pulse-panel');

        this.toDispose.push(this.pulseService.onDidChange(change => {
            this.currentState = this.mapPulseState(change.state);
            this.statusText = change.label ?? this.defaultLabel(this.currentState);
            this.addLogEntry(this.currentState, this.statusText);
            this.update();
        }));

        // Connect to mode cycle
        this.currentAgentMode = this.modeCycle.getMode();
        this.toDispose.push(this.modeCycle.onDidChangeMode(mode => {
            this.currentAgentMode = mode;
            this.update();
        }));

        // Start demo mode for visual testing
        this.startDemo();
    }

    protected mapPulseState(state: PulseState): PulsePanelState {
        switch (state) {
            case 'thinking': return 'thinking';
            case 'suggesting': return 'suggesting';
            case 'error': return 'error';
            case 'listening': return 'thinking';
            default: return 'idle';
        }
    }

    protected defaultLabel(state: PulsePanelState): string {
        switch (state) {
            case 'idle': return nls.localize('theia/teacher/pulseReady', 'Ready');
            case 'thinking': return nls.localize('theia/teacher/pulseThinking', 'Thinking...');
            case 'suggesting': return nls.localize('theia/teacher/pulseSuggesting', '3 suggestions');
            case 'error': return nls.localize('theia/teacher/pulseError', 'Error');
        }
    }

    protected addLogEntry(state: PulsePanelState, message: string): void {
        this.activityLog.unshift({
            timestamp: Date.now(),
            state,
            message,
        });
        if (this.activityLog.length > 50) {
            this.activityLog.pop();
        }
    }

    protected startDemo(): void {
        this.demoMode = true;
        const demoStates: Array<{ state: PulsePanelState; text: string }> = [
            { state: 'idle', text: nls.localize('theia/teacher/pulseReady', 'Ready') },
            { state: 'thinking', text: nls.localize('theia/teacher/pulseThinking', 'Thinking...') },
            { state: 'suggesting', text: nls.localize('theia/teacher/pulseSuggesting', '3 suggestions') },
            { state: 'error', text: nls.localize('theia/teacher/pulseError', 'Connection lost') },
        ];
        let idx = 0;

        this.addLogEntry('idle', nls.localize('theia/teacher/pulseDemoStart', 'Demo mode started'));

        this.demoTimer = setInterval(() => {
            if (!this.demoMode) {
                return;
            }
            const demo = demoStates[idx % demoStates.length];
            this.currentState = demo.state;
            this.statusText = demo.text;
            this.addLogEntry(demo.state, demo.text);
            this.update();
            idx++;
        }, 5000);

        this.toDispose.push({ dispose: () => {
            if (this.demoTimer) {
                clearInterval(this.demoTimer);
            }
        }});
    }

    protected toggleExpanded = (): void => {
        this.expanded = !this.expanded;
        this.update();
    };

    protected render(): React.ReactNode {
        const stateClass = `teacher-pulse-panel-state--${this.currentState}`;

        return (
            <div className='teacher-pulse-panel-container'>
                <div className='teacher-pulse-panel-strip'>
                    <button
                        type='button'
                        className={`teacher-pulse-panel-orb-btn ${stateClass}`}
                        onClick={this.toggleExpanded}
                        title={nls.localize('theia/teacher/pulseToggleLog', 'Toggle activity log')}
                        aria-label={nls.localize('theia/teacher/pulseToggleLog', 'Toggle activity log')}
                    >
                        <span className={`teacher-pulse-panel-orb ${stateClass}`} aria-hidden='true' />
                        {this.currentState === 'thinking' && (
                            <span className='teacher-pulse-panel-ring' aria-hidden='true' />
                        )}
                    </button>

                    <span className={`teacher-pulse-panel-status ${stateClass}`}>
                        {this.statusText}
                    </span>

                    {this.renderModeBadge()}

                    <span className='teacher-pulse-panel-model-badge'>
                        {this.modelName}
                    </span>
                </div>

                {this.expanded && this.renderActivityLog()}
            </div>
        );
    }

    protected renderModeBadge(): React.ReactNode {
        const def = MODE_DEFINITIONS.find(m => m.mode === this.currentAgentMode) ?? MODE_DEFINITIONS[1];
        return (
            <span
                className={`teacher-pulse-panel-mode-badge teacher-pulse-panel-mode-badge--${def.color}`}
                title={nls.localize('theia/teacher/currentMode', 'Current mode: {0}', def.label)}
            >
                <i className={def.icon} />
                <span>{def.label}</span>
            </span>
        );
    }

    protected renderActivityLog(): React.ReactNode {
        return (
            <div className='teacher-pulse-panel-log'>
                <div className='teacher-pulse-panel-log-header'>
                    <span className='teacher-pulse-panel-log-title'>
                        <i className='codicon codicon-list-flat' />
                        {nls.localize('theia/teacher/pulseActivityLog', 'Activity Log')}
                    </span>
                </div>
                <div className='teacher-pulse-panel-log-entries'>
                    {this.activityLog.map((entry, i) => (
                        <div
                            key={`${entry.timestamp}-${i}`}
                            className={`teacher-pulse-panel-log-entry teacher-pulse-panel-state--${entry.state}`}
                        >
                            <span className='teacher-pulse-panel-log-time'>
                                {this.formatTime(entry.timestamp)}
                            </span>
                            <span className={`teacher-pulse-panel-log-dot teacher-pulse-panel-state--${entry.state}`} />
                            <span className='teacher-pulse-panel-log-msg'>
                                {entry.message}
                            </span>
                        </div>
                    ))}
                    {this.activityLog.length === 0 && (
                        <div className='teacher-pulse-panel-log-empty'>
                            {nls.localize('theia/teacher/pulseNoActivity', 'No activity yet.')}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    protected formatTime(ts: number): string {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
}
