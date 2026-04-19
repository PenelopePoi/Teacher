import { injectable } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';

/**
 * Four states — matches §6 motion signature:
 *   idle        — 2400ms breathing glow, cool periwinkle
 *   listening   — 1200ms cadence, amplitude-reactive radius
 *   thinking    — 1800ms breath + secondary ring per cycle
 *   suggesting  — 600ms spring, amber
 *
 * Extra:
 *   error       — short red flash, not used in ambient mode
 *   off         — hidden
 */
export type PulseState = 'off' | 'idle' | 'listening' | 'thinking' | 'suggesting' | 'error';

export interface PulseChange {
    readonly state: PulseState;
    /** Last microphone amplitude 0..1 when `listening`; undefined otherwise. */
    readonly amplitude?: number;
    /** Optional short human label shown alongside the orb ("Thinking…"). */
    readonly label?: string;
}

/**
 * Central Pulse state — a single service the whole Workshop reads.
 * §2 Pulse Panel + §6 breathing-glow signature both reference this.
 * Only one state is ever active. Widgets subscribe via onDidChange
 * and render their own visual — a status-bar orb, a side-panel
 * border glow, a Canvas empty-state indicator, etc.
 */
@injectable()
export class PulseService {

    protected readonly _onDidChange = new Emitter<PulseChange>();
    readonly onDidChange: Event<PulseChange> = this._onDidChange.event;

    protected _state: PulseState = 'idle';
    protected _amplitude?: number;
    protected _label?: string;

    get state(): PulseState { return this._state; }
    get amplitude(): number | undefined { return this._amplitude; }
    get label(): string | undefined { return this._label; }

    set(state: PulseState, opts: { amplitude?: number; label?: string } = {}): void {
        const next: PulseChange = {
            state,
            amplitude: opts.amplitude,
            label:     opts.label,
        };
        this._state = next.state;
        this._amplitude = next.amplitude;
        this._label = next.label;
        this._onDidChange.fire(next);
    }

    reset(): void {
        this.set('idle');
    }

    /** Temporarily pulse an amber suggestion, then return to prior state after duration ms. */
    flashSuggestion(duration = 1800, label = 'Proposal ready'): void {
        const prior = this._state;
        const priorLabel = this._label;
        this.set('suggesting', { label });
        setTimeout(() => {
            if (this._state === 'suggesting' && this._label === label) {
                this.set(prior, { label: priorLabel });
            }
        }, duration);
    }
}
