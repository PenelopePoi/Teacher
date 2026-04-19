import * as React from '@theia/core/shared/react';
import { PulseChange, PulseService, PulseState } from './pulse-service';

export interface PulseIndicatorProps {
    readonly service: PulseService;
    /** Visual size in px; default 12 matches the §6 peripheral spec. */
    readonly size?: number;
    /** Render a small label next to the orb. Auto-uses service.label when true. */
    readonly showLabel?: boolean;
    /** Optional className for the wrapper. */
    readonly className?: string;
}

const STATE_TO_ANIM: Record<PulseState, string> = {
    off:         '',
    idle:        'teacher-breathing',
    listening:   'teacher-listening',
    thinking:    'teacher-thinking',
    suggesting:  'teacher-suggestion',
    error:       '',
};

const STATE_TO_COLOR: Record<PulseState, string> = {
    off:        'transparent',
    idle:       'var(--teacher-ai-thinking)',
    listening:  'var(--teacher-ai-thinking)',
    thinking:   'var(--teacher-ai-thinking)',
    suggesting: 'var(--teacher-ai-suggesting)',
    error:      'var(--teacher-semantic-error)',
};

/**
 * The §6 signature primitive. A single orb that breathes at exactly
 * 2,400ms in idle, speeds up when listening, emits a secondary ring
 * while thinking, and spring-shifts to amber when a suggestion is
 * ready. Used in the welcome widget, any AI panel header, and
 * (eventually) the status bar via `StatusBarContribution`.
 *
 * Reads state from PulseService and re-renders on onDidChange.
 * Stateless besides its own subscription — the service owns state.
 */
export function PulseIndicator({
    service, size = 12, showLabel = false, className,
}: PulseIndicatorProps): React.ReactElement {
    const [change, setChange] = React.useState<PulseChange>(() => ({
        state:     service.state,
        amplitude: service.amplitude,
        label:     service.label,
    }));

    React.useEffect(() => {
        const sub = service.onDidChange(next => setChange(next));
        return () => sub.dispose();
    }, [service]);

    const { state, amplitude, label } = change;

    const wrapperStyle: React.CSSProperties = {
        ['--teacher-pulse-amp' as unknown as string]: amplitude ?? 0,
    };

    const orbStyle: React.CSSProperties = {
        width:       size,
        height:      size,
        borderRadius: '50%',
        background:  STATE_TO_COLOR[state],
        boxShadow:   state === 'suggesting'
            ? 'var(--teacher-glow-amber)'
            : (state !== 'off' ? 'var(--teacher-glow-mid)' : 'none'),
        display:     state === 'off' ? 'none' : 'inline-block',
    };

    return (
        <span className={`teacher-pulse-wrapper ${className ?? ''}`} style={wrapperStyle}>
            <span className="teacher-pulse-orb-stack">
                <span className={`teacher-pulse-orb ${STATE_TO_ANIM[state]}`} style={orbStyle} />
                {state === 'thinking' && (
                    <span
                        className="teacher-pulse-ring teacher-thinking-ring"
                        style={{
                            width:  size * 2.4,
                            height: size * 2.4,
                            borderRadius: '50%',
                            border: `1px solid ${STATE_TO_COLOR.thinking}`,
                            background: 'transparent',
                        }}
                    />
                )}
            </span>
            {showLabel && label && <span className="teacher-pulse-label">{label}</span>}
        </span>
    );
}
