import { injectable } from '@theia/core/shared/inversify';

/**
 * Maps IDE events to skill names that should be auto-triggered
 * when those events occur.
 */
const AUTO_TRIGGERS: Record<string, string[]> = {
    'file-save-error': ['quality-loop', 'error-retry-trigger'],
    'file-created': ['constraint-designer'],
    'session-start': ['morning-briefing', 'best-timeline-aligner'],
    'session-long': ['cognitive-load-guard', 'portable-debrief'],
    'terminal-error': ['error-retry-trigger'],
    'pre-commit': ['anti-ai-language', 'quality-loop'],
    'code-review': ['honest-mirror', 'simplify'],
    'new-concept': ['learning-teaching-suite'],
    'security-scan': ['web-vuln-audit', 'supply-chain-audit'],
    'deploy': ['xela-brand-checker'],
};

/**
 * Service that maps IDE lifecycle events to skills that should
 * fire automatically when those events occur.
 */
@injectable()
export class AutoTriggerService {

    /**
     * Return the full trigger map: event name → list of skill names.
     */
    getAutoTriggers(): Record<string, string[]> {
        // Return a defensive copy
        const copy: Record<string, string[]> = {};
        for (const [event, skills] of Object.entries(AUTO_TRIGGERS)) {
            copy[event] = [...skills];
        }
        return copy;
    }

    /**
     * Return the skill names that should fire for a given IDE event.
     */
    getSkillsForEvent(event: string): string[] {
        return AUTO_TRIGGERS[event] || [];
    }

    /**
     * Check whether a given event has any auto-trigger skills.
     */
    hasTriggersFor(event: string): boolean {
        return event in AUTO_TRIGGERS && AUTO_TRIGGERS[event].length > 0;
    }

    /**
     * Return all event names that have registered triggers.
     */
    getRegisteredEvents(): string[] {
        return Object.keys(AUTO_TRIGGERS);
    }
}
