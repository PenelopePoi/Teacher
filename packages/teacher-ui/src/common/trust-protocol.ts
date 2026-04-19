/**
 * Trust Protocol — shared types for auto-cap and destructive-op guard.
 *
 * These interfaces define the trust-calibration layer that prevents
 * runaway autonomous sessions and labels dangerous operations.
 */

/** Severity of a destructive operation. */
export type DestructiveOpSeverity = 'warn' | 'block';

/** Configuration for the auto-cap middleware. */
export interface AutoCapConfig {
    /** Number of tool calls before a forced checkpoint. Default: 20. */
    threshold: number;
    /** Whether auto-cap is enabled. */
    enabled: boolean;
}

/** Information about a classified destructive operation. */
export interface DestructiveOpInfo {
    /** Unique pattern identifier, e.g. "deletes-files". */
    id: string;
    /** Human-readable label, e.g. "Deletes files". */
    label: string;
    /** Explanation of why this is dangerous. */
    description: string;
    /** Whether the UI should warn or hard-block. */
    severity: DestructiveOpSeverity;
    /** The raw command or code that was classified. */
    command: string;
}

/** Discriminated union of trust-layer events. */
export type TrustEvent =
    | TrustEvent.AutoCapTriggered
    | TrustEvent.AutoCapReset
    | TrustEvent.DestructiveOpDetected
    | TrustEvent.DestructiveOpAccepted
    | TrustEvent.DestructiveOpRejected;

export namespace TrustEvent {
    export interface AutoCapTriggered {
        kind: 'auto-cap-triggered';
        callCount: number;
        threshold: number;
        checkpointId: string;
        timestamp: number;
    }

    export interface AutoCapReset {
        kind: 'auto-cap-reset';
        timestamp: number;
    }

    export interface DestructiveOpDetected {
        kind: 'destructive-op-detected';
        info: DestructiveOpInfo;
        timestamp: number;
    }

    export interface DestructiveOpAccepted {
        kind: 'destructive-op-accepted';
        info: DestructiveOpInfo;
        timestamp: number;
    }

    export interface DestructiveOpRejected {
        kind: 'destructive-op-rejected';
        info: DestructiveOpInfo;
        timestamp: number;
    }
}
