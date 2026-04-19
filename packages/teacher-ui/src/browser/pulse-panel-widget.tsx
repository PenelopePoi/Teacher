import * as React from 'react';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { Message } from '@theia/core/shared/@lumino/messaging';

export type PulseState = 'idle' | 'thinking' | 'suggesting' | 'ready';

interface LogEntry {
    message: string;
    timestamp: number;
}

interface PulsePanelState {
    aiState: PulseState;
    expanded: boolean;
    log: LogEntry[];
    error: string | undefined;
}

/** CSS variable names for each pulse state color. */
const STATE_COLOR_VAR: Record<PulseState, string> = {
    idle: 'var(--ai-thinking)',
    thinking: 'var(--ai-thinking)',
    suggesting: 'var(--ai-suggesting)',
    ready: 'var(--ai-confident)',
};

@injectable()
export class PulsePanelWidget extends ReactWidget {

    static readonly ID = 'teacher-pulse-panel';
    static readonly LABEL = 'AI Pulse';

    private panelState: PulsePanelState = {
        aiState: 'idle',
        expanded: false,
        log: [],
        error: undefined,
    };

    @postConstruct()
    protected init(): void {
        this.id = PulsePanelWidget.ID;
        this.title.label = PulsePanelWidget.LABEL;
        this.title.caption = PulsePanelWidget.LABEL;
        this.title.closable = true;
        this.addClass('teacher-pulse-panel');
        this.node.tabIndex = 0;
        this.update();
    }

    setAIState(state: PulseState): void {
        try {
            this.panelState.aiState = state;
            this.panelState.error = undefined;
            this.update();
        } catch (err) {
            console.error('[PulsePanelWidget] Failed to set AI state:', err);
            this.panelState.error = `State transition failed: ${err}`;
            this.update();
        }
    }

    appendLog(message: string): void {
        this.panelState.log.push({
            message,
            timestamp: Date.now(),
        });
        if (this.panelState.log.length > 200) {
            this.panelState.log = this.panelState.log.slice(-100);
        }
        this.update();
    }

    clearLog(): void {
        this.panelState.log = [];
        this.update();
    }

    protected override onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.focus();
    }

    protected render(): React.ReactNode {
        const { aiState, expanded, log, error } = this.panelState;

        if (error) {
            return (
                <div className='teacher-pulse-strip teacher-pulse-error'>
                    <span className='teacher-pulse-error-icon' aria-hidden='true'>&#9888;</span>
                    <span className='teacher-pulse-error-message'>{error}</span>
                </div>
            );
        }

        const color = STATE_COLOR_VAR[aiState];
        const stateLabel = aiState.charAt(0).toUpperCase() + aiState.slice(1);

        const dotClass = `teacher-pulse-indicator-dot ${aiState === 'thinking' ? 'teacher-pulse-thinking' : 'teacher-pulse-breathing'}`;

        return (
            <div className='teacher-pulse-strip' onClick={this.handleClick} role='region' aria-label='AI Pulse status'>
                <span className={dotClass} style={{ backgroundColor: color, transition: 'background-color 0.6s ease' }} />
                <span className='teacher-pulse-state-label' style={{ color, transition: 'color 0.6s ease' }}>
                    {stateLabel}
                </span>
                <span className='teacher-pulse-spacer' />
                <span className='teacher-pulse-expand-hint'>
                    {expanded ? 'Click to collapse' : 'Click to expand'}
                </span>
                {expanded && (
                    <div className='teacher-pulse-log'>
                        {log.length > 0 && (
                            <div className='teacher-pulse-log-toolbar'>
                                <button
                                    className='teacher-pulse-clear-btn'
                                    onClick={this.handleClearLog}
                                    title='Clear log'
                                    aria-label='Clear pulse log'
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                        {log.length === 0 && (
                            <div className='teacher-pulse-log-empty'>
                                The Pulse breathes. When Teacher thinks, you'll see it here.
                            </div>
                        )}
                        {log.map((entry, i) => (
                            <div key={i} className='teacher-pulse-log-entry'>
                                <span className='teacher-pulse-log-ts'>
                                    {this.formatTimestamp(entry.timestamp)}
                                </span>
                                {entry.message}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    protected handleClick = (): void => {
        this.panelState.expanded = !this.panelState.expanded;
        this.update();
    };

    protected handleClearLog = (e: React.MouseEvent): void => {
        e.stopPropagation();
        this.clearLog();
    };

    private formatTimestamp(ts: number): string {
        const d = new Date(ts);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    }
}
