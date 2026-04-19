/**
 * Centralized constants for Teacher IDE.
 * Import from '@theia/teacher-core/lib/common/constants'.
 */

/** Current Teacher IDE version. */
export const TEACHER_VERSION = '1.0.0';

/** Default filesystem path for the SKILL.md library. */
export const SKILL_LIBRARY_PATH = '~/.claude/skills';

/** Default directory for student learning profile persistence. */
export const LEARNING_PROFILE_DIR = '~/.theia/teacher/progress';

/** Default Ollama model identifier. */
export const DEFAULT_MODEL = 'qwen2.5:7b';

/**
 * All registered AI agent identifiers.
 * Each maps to a class in `packages/teacher-core/src/browser/agents/`.
 */
export const AGENT_IDS = {
    TUTOR: 'teacher-tutor',
    EXPLAIN: 'teacher-explain',
    REVIEW: 'teacher-review',
    DEBUGGER: 'teacher-debugger',
    GROWTH_TRACKER: 'teacher-growth-tracker',
    MOTIVATOR: 'teacher-motivator',
    PROJECT_BUILDER: 'teacher-project-builder',
    STRATEGIC_PLANNER: 'teacher-strategic-planner',
    THINKING_DEBUGGER: 'teacher-thinking-debugger',
} as const;

/**
 * All registered widget identifiers.
 * Each maps to a widget class in `packages/teacher-core/src/browser/widgets/`
 * (except Pulse Panel, which also exists in `teacher-ui`).
 */
export const WIDGET_IDS = {
    WELCOME: 'teacher-welcome-widget',
    PROGRESS_DASHBOARD: 'teacher-progress-dashboard',
    CURRICULUM_BROWSER: 'teacher-curriculum-browser',
    CANVAS: 'teacher-canvas-widget',
    CANVAS_REVIEW: 'teacher-canvas-review',
    LEARNING_ANALYTICS: 'teacher-learning-analytics',
    LEARNING_PATH: 'teacher-learning-path',
    SKILL_BROWSER: 'teacher-skill-browser',
    SKILL_COMMAND: 'teacher-skill-command',
    AI_HISTORY_SEARCH: 'teacher-ai-history-search',
    GHOST_TIMELINE: 'teacher-ghost-timeline',
    IMPROVEMENT_DASHBOARD: 'teacher-improvement-dashboard',
    PERMISSION_MODE: 'teacher-permission-mode',
    PLAN_MODE: 'teacher-plan-mode',
    TEACHABLE_MOMENTS: 'teacher-teachable-moments',
    REWIND_PANEL: 'teacher-rewind-panel',
    WORKFLOW_BUILDER: 'teacher-workflow-builder',
    PULSE_PANEL: 'teacher-pulse-panel',
} as const;
