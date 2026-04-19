import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common';
import { PreferenceService } from '@theia/core/lib/browser/preferences/preference-service';
import { AgentSessionManager } from './agent-session-manager';
import { AutoCapConfig, TrustEvent } from '../common/trust-protocol';

/**
 * Auto-Cap Middleware (G5a) — forced checkpoint after N tool calls.
 *
 * Counts tool calls per agent session. When the configurable threshold
 * (default 20) is reached without a user-initiated checkpoint, the
 * middleware forces a checkpoint and emits an event so the UI can
 * surface a review prompt.
 *
 * The counter is visible in the Pulse Panel as a badge (e.g. "7/20").
 */

const DEFAULT_THRESHOLD = 20;
const PREFERENCE_KEY = 'teacher.agent.autoCapThreshold';

@injectable()
export class AutoCapMiddleware {

    @inject(AgentSessionManager)
    protected readonly sessionManager: AgentSessionManager;

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    private callCount = 0;
    private config: AutoCapConfig = { threshold: DEFAULT_THRESHOLD, enabled: true };

    private readonly onDidTriggerAutoCapEmitter = new Emitter<TrustEvent.AutoCapTriggered>();
    readonly onDidTriggerAutoCap: Event<TrustEvent.AutoCapTriggered> = this.onDidTriggerAutoCapEmitter.event;

    private readonly onDidResetEmitter = new Emitter<TrustEvent.AutoCapReset>();
    readonly onDidReset: Event<TrustEvent.AutoCapReset> = this.onDidResetEmitter.event;

    private readonly onDidChangeCallCountEmitter = new Emitter<{ current: number; threshold: number }>();
    readonly onDidChangeCallCount: Event<{ current: number; threshold: number }> = this.onDidChangeCallCountEmitter.event;

    @postConstruct()
    protected init(): void {
        // Read initial preference
        this.syncThresholdPreference();

        // Watch for preference changes
        this.preferenceService.onPreferenceChanged(change => {
            if (change.preferenceName === PREFERENCE_KEY) {
                this.syncThresholdPreference();
            }
        });

        // Listen for actions recorded by the session manager
        this.sessionManager.onDidRecordAction(() => {
            if (this.config.enabled) {
                this.incrementAndCheck();
            }
        });

        // Reset counter when user manually creates a checkpoint
        this.sessionManager.onDidCreateCheckpoint(checkpoint => {
            if (!checkpoint.auto) {
                this.resetCounter();
            }
        });

        console.info(`[AutoCapMiddleware] Initialized — threshold: ${this.config.threshold}`);
    }

    /** Manually increment the call counter. Used when tool calls bypass AgentSessionManager. */
    recordToolCall(): void {
        if (this.config.enabled) {
            this.incrementAndCheck();
        }
    }

    /** Get current call count. */
    getCallCount(): number {
        return this.callCount;
    }

    /** Get the active threshold. */
    getThreshold(): number {
        return this.config.threshold;
    }

    /** Get the badge text for Pulse Panel display. */
    getBadgeText(): string {
        return `${this.callCount}/${this.config.threshold}`;
    }

    /** Check whether auto-cap is enabled. */
    isEnabled(): boolean {
        return this.config.enabled;
    }

    /** Enable or disable auto-cap at runtime. */
    setEnabled(enabled: boolean): void {
        this.config.enabled = enabled;
        console.info(`[AutoCapMiddleware] ${enabled ? 'Enabled' : 'Disabled'}`);
    }

    /** Reset the call counter to zero. */
    resetCounter(): void {
        this.callCount = 0;
        this.onDidChangeCallCountEmitter.fire({ current: 0, threshold: this.config.threshold });
        this.onDidResetEmitter.fire({ kind: 'auto-cap-reset', timestamp: Date.now() });
    }

    private incrementAndCheck(): void {
        this.callCount++;
        this.onDidChangeCallCountEmitter.fire({ current: this.callCount, threshold: this.config.threshold });

        if (this.callCount >= this.config.threshold) {
            this.triggerAutoCap();
        }
    }

    private triggerAutoCap(): void {
        const checkpointId = this.sessionManager.createCheckpoint(
            `Auto-cap (${this.config.threshold} calls)`,
            true
        );

        const event: TrustEvent.AutoCapTriggered = {
            kind: 'auto-cap-triggered',
            callCount: this.callCount,
            threshold: this.config.threshold,
            checkpointId,
            timestamp: Date.now(),
        };

        this.onDidTriggerAutoCapEmitter.fire(event);
        console.info(
            `[AutoCapMiddleware] Auto-checkpoint after ${this.callCount} calls — checkpoint ${checkpointId}`
        );

        // Reset for next window
        this.resetCounter();
    }

    private syncThresholdPreference(): void {
        const value = this.preferenceService.get<number>(PREFERENCE_KEY);
        if (typeof value === 'number' && value > 0) {
            this.config.threshold = value;
        } else {
            this.config.threshold = DEFAULT_THRESHOLD;
        }
    }
}
