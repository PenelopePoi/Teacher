/**
 * Student Friction Service — Qualtrics-inspired struggle detection.
 *
 * Monitors student behavior for friction signals and detects when a
 * student is struggling BEFORE they ask for help.
 * Proactive, not reactive. Non-interrupting.
 *
 * Injectable singleton that tracks behavioral patterns and emits
 * FrictionEvents when thresholds are crossed.
 */

import { injectable } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';
import {
    FrictionEvent,
    FrictionType,
    FrictionSeverity,
    SessionHealthScore,
} from '../../common/friction-protocol';

// ── Threshold constants ────────────────────────────────────────────────

/** Undo/redo threshold: >5 in 30 seconds. */
const UNDO_REDO_COUNT_THRESHOLD = 5;
const UNDO_REDO_WINDOW_MS = 30_000;

/** Error pause threshold: no typing for >60 seconds after an error. */
const ERROR_PAUSE_THRESHOLD_MS = 60_000;

/** Repeated test failure: same test fails 3+ times. */
const TEST_FAILURE_THRESHOLD = 3;

/** Excessive deletions: deletion ratio >0.6 over a rolling window. */
const DELETION_RATIO_THRESHOLD = 0.6;
const DELETION_WINDOW_SIZE = 50;

/** Session abandonment: no activity for 5+ minutes. */
const ABANDONMENT_THRESHOLD_MS = 5 * 60 * 1000;

/** Cooldown before re-firing the same friction type (2 minutes). */
const FRICTION_COOLDOWN_MS = 2 * 60 * 1000;

// ── Suggested interventions ────────────────────────────────────────────

const INTERVENTIONS: Record<FrictionType, string> = {
    [FrictionType.UndoRedoCycle]:
        'Looks like you\'re trying different approaches. Want the Tutor to explain the concept?',
    [FrictionType.ErrorPause]:
        'That error can be confusing. Want me to explain what it means?',
    [FrictionType.RepeatedTestFailure]:
        'This test is tricky. Want a hint?',
    [FrictionType.ExcessiveDeletions]:
        'Starting fresh can help. Want to see the lesson objectives again?',
    [FrictionType.HelpSeeking]:
        'Looking for answers? The Tutor can walk you through this step by step.',
    [FrictionType.AssessmentRetries]:
        'Assessments are for learning, not grading. Want to review the material first?',
    [FrictionType.SessionAbandonment]:
        'Still there? No rush \u2014 pick up whenever you\'re ready.',
    [FrictionType.ConceptConfusion]:
        'This concept takes time. Want a different explanation?',
};

// ── Severity mapping ───────────────────────────────────────────────────

function severityFor(type: FrictionType): FrictionSeverity {
    switch (type) {
        case FrictionType.SessionAbandonment:
        case FrictionType.RepeatedTestFailure:
        case FrictionType.AssessmentRetries:
            return 'high';
        case FrictionType.UndoRedoCycle:
        case FrictionType.ErrorPause:
        case FrictionType.ExcessiveDeletions:
            return 'moderate';
        case FrictionType.HelpSeeking:
        case FrictionType.ConceptConfusion:
            return 'mild';
    }
}

@injectable()
export class StudentFrictionService {

    // ── Event emitter ──────────────────────────────────────────────────

    protected readonly _onDidDetectFriction = new Emitter<FrictionEvent>();
    readonly onDidDetectFriction: Event<FrictionEvent> = this._onDidDetectFriction.event;

    // ── State ──────────────────────────────────────────────────────────

    protected nextId = 1;
    protected activeFrictions: FrictionEvent[] = [];
    protected frictionHistory: FrictionEvent[] = [];
    protected lastFrictionTime = new Map<FrictionType, number>();

    // Undo/redo tracking
    protected undoRedoTimestamps: number[] = [];

    // Error pause tracking
    protected lastErrorTime: number | undefined;
    protected lastErrorText: string | undefined;
    protected errorPauseTimer: ReturnType<typeof setTimeout> | undefined;

    // Test failure tracking
    protected testFailureCounts = new Map<string, number>();

    // Keystroke/deletion tracking (rolling window)
    protected keystrokeWindow: Array<{ keystrokes: number; deletions: number }> = [];

    // Session abandonment tracking
    protected abandonmentTimer: ReturnType<typeof setTimeout> | undefined;
    protected sessionActive = false;

    // ── Public API ─────────────────────────────────────────────────────

    /**
     * Record keystroke activity. Tracks the ratio of deletions to
     * total keystrokes to detect negative progress.
     */
    recordKeystrokes(count: number, deletions: number): void {
        this.resetAbandonmentTimer();

        this.keystrokeWindow.push({ keystrokes: count, deletions });
        if (this.keystrokeWindow.length > DELETION_WINDOW_SIZE) {
            this.keystrokeWindow.shift();
        }

        // Check deletion ratio
        const totalKeystrokes = this.keystrokeWindow.reduce((s, e) => s + e.keystrokes, 0);
        const totalDeletions = this.keystrokeWindow.reduce((s, e) => s + e.deletions, 0);

        if (totalKeystrokes > 20 && totalDeletions / totalKeystrokes > DELETION_RATIO_THRESHOLD) {
            this.emitFriction(
                FrictionType.ExcessiveDeletions,
                `Deletion ratio: ${Math.round((totalDeletions / totalKeystrokes) * 100)}%`,
            );
        }

        // Clear error-pause if student starts typing after an error
        if (this.errorPauseTimer !== undefined) {
            clearTimeout(this.errorPauseTimer);
            this.errorPauseTimer = undefined;
        }
    }

    /**
     * Record an undo or redo action.
     * Detects rapid undo/redo cycles (>5 in 30 seconds).
     */
    recordUndoRedo(): void {
        this.resetAbandonmentTimer();

        const now = Date.now();
        this.undoRedoTimestamps.push(now);

        // Prune timestamps outside the window
        const cutoff = now - UNDO_REDO_WINDOW_MS;
        this.undoRedoTimestamps = this.undoRedoTimestamps.filter(t => t >= cutoff);

        if (this.undoRedoTimestamps.length > UNDO_REDO_COUNT_THRESHOLD) {
            this.emitFriction(
                FrictionType.UndoRedoCycle,
                `${this.undoRedoTimestamps.length} undo/redo actions in ${UNDO_REDO_WINDOW_MS / 1000}s`,
            );
        }
    }

    /**
     * Record a compiler/runtime error.
     * Starts a pause timer — if the student doesn't type for >60s, it's friction.
     */
    recordError(error: string): void {
        this.resetAbandonmentTimer();

        this.lastErrorTime = Date.now();
        this.lastErrorText = error;

        // Clear any existing pause timer
        if (this.errorPauseTimer !== undefined) {
            clearTimeout(this.errorPauseTimer);
        }

        this.errorPauseTimer = setTimeout(() => {
            this.emitFriction(
                FrictionType.ErrorPause,
                `Paused ${ERROR_PAUSE_THRESHOLD_MS / 1000}s after error: ${error.substring(0, 120)}`,
            );
            this.errorPauseTimer = undefined;
        }, ERROR_PAUSE_THRESHOLD_MS);
    }

    /**
     * Record a test result.
     * Tracks consecutive failures per test name.
     */
    recordTestResult(passed: boolean, testName: string): void {
        this.resetAbandonmentTimer();

        if (passed) {
            this.testFailureCounts.delete(testName);
            return;
        }

        const count = (this.testFailureCounts.get(testName) ?? 0) + 1;
        this.testFailureCounts.set(testName, count);

        if (count >= TEST_FAILURE_THRESHOLD) {
            this.emitFriction(
                FrictionType.RepeatedTestFailure,
                `Test "${testName}" failed ${count} times in a row`,
            );
        }
    }

    /**
     * Record a pause duration (called by whatever monitors idle time).
     * Used for session abandonment detection.
     */
    recordPause(durationMs: number): void {
        if (durationMs >= ABANDONMENT_THRESHOLD_MS) {
            this.emitFriction(
                FrictionType.SessionAbandonment,
                `No activity for ${Math.round(durationMs / 60_000)} minutes`,
            );
        }
    }

    /**
     * Start monitoring for session abandonment.
     * Should be called when a lesson or coding session begins.
     */
    startSession(): void {
        this.sessionActive = true;
        this.resetAbandonmentTimer();
    }

    /**
     * Stop monitoring for session abandonment.
     */
    stopSession(): void {
        this.sessionActive = false;
        if (this.abandonmentTimer !== undefined) {
            clearTimeout(this.abandonmentTimer);
            this.abandonmentTimer = undefined;
        }
    }

    /** Return currently active (unresolved) friction events. */
    getActiveFrictions(): FrictionEvent[] {
        return [...this.activeFrictions];
    }

    /** Return full friction history for this session. */
    getFrictionHistory(): FrictionEvent[] {
        return [...this.frictionHistory];
    }

    /** Mark a friction event as resolved (student used the intervention). */
    resolveFriction(id: string): void {
        const event = this.activeFrictions.find(e => e.id === id);
        if (event) {
            event.resolved = true;
            this.activeFrictions = this.activeFrictions.filter(e => e.id !== id);
        }
    }

    /** Compute a session health score from the friction history. */
    computeHealthScore(): SessionHealthScore {
        const total = this.frictionHistory.length;
        const resolved = this.frictionHistory.filter(e => e.resolved).length;

        // Score: start at 100, subtract per friction, add back for resolved
        let score = 100;
        for (const event of this.frictionHistory) {
            const penalty = event.severity === 'high' ? 15 : event.severity === 'moderate' ? 10 : 5;
            score -= penalty;
            if (event.resolved) {
                score += Math.floor(penalty * 0.5);
            }
        }
        score = Math.max(0, Math.min(100, score));

        // Find dominant friction type
        const typeCounts = new Map<FrictionType, number>();
        for (const event of this.frictionHistory) {
            typeCounts.set(event.type, (typeCounts.get(event.type) ?? 0) + 1);
        }
        let dominantType: FrictionType | undefined;
        let maxCount = 0;
        for (const [type, count] of typeCounts) {
            if (count > maxCount) {
                maxCount = count;
                dominantType = type;
            }
        }

        return {
            score,
            totalFrictions: total,
            resolvedFrictions: resolved,
            dominantFrictionType: dominantType,
            computedAt: new Date().toISOString(),
        };
    }

    // ── Internal helpers ───────────────────────────────────────────────

    protected emitFriction(type: FrictionType, context: string): void {
        // Cooldown: don't re-fire the same type within the window
        const lastTime = this.lastFrictionTime.get(type);
        if (lastTime !== undefined && Date.now() - lastTime < FRICTION_COOLDOWN_MS) {
            return;
        }

        const event: FrictionEvent = {
            id: `friction-${this.nextId++}`,
            type,
            severity: severityFor(type),
            timestamp: new Date().toISOString(),
            context,
            suggestedIntervention: INTERVENTIONS[type],
            resolved: false,
        };

        this.activeFrictions.push(event);
        this.frictionHistory.push(event);
        this.lastFrictionTime.set(type, Date.now());
        this._onDidDetectFriction.fire(event);
    }

    protected resetAbandonmentTimer(): void {
        if (!this.sessionActive) {
            return;
        }
        if (this.abandonmentTimer !== undefined) {
            clearTimeout(this.abandonmentTimer);
        }
        this.abandonmentTimer = setTimeout(() => {
            this.emitFriction(
                FrictionType.SessionAbandonment,
                `No activity for ${ABANDONMENT_THRESHOLD_MS / 60_000} minutes`,
            );
        }, ABANDONMENT_THRESHOLD_MS);
    }
}
