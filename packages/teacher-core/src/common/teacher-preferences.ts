import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

/**
 * Preference schema for all Teacher IDE settings.
 * These preferences are exposed in the Settings UI and can be configured
 * per-user or per-workspace.
 */
export const TeacherPreferencesSchema: PreferenceSchema = {
    properties: {
        /**
         * Master toggle for the local ASI multi-agent system.
         * When disabled, ASI-powered features (deep explanations, anomaly detection,
         * knowledge export) fall back to the standard LLM chat agent.
         * Used by: ASIBridgeService, TutorAgent (deep-dive mode).
         */
        'teacher.asi.enabled': {
            type: 'boolean',
            default: true,
            description: 'Enable the Local ASI multi-agent system for deep explanations.'
        },
        /**
         * Base URL for the ASI bridge HTTP service.
         * The bridge exposes a REST API that the Teacher extension calls
         * to communicate with the local ASI swarm.
         * Used by: ASIBridgeService (all methods).
         */
        'teacher.asi.host': {
            type: 'string',
            default: 'http://localhost:8765',
            description: 'Host URL for the ASI bridge HTTP service.'
        },
        /**
         * Filesystem path to the asi.py entry point.
         * When empty, the extension uses the version bundled with the Teacher package.
         * Set this to point at a development or custom-modified ASI installation.
         * Used by: ASI process launcher in the backend.
         */
        'teacher.asi.path': {
            type: 'string',
            default: '',
            description: 'Path to asi.py. Leave empty to use the bundled version.'
        },
        /**
         * Directory containing curriculum definition JSON/YAML files.
         * Each file defines one CurriculumDefinition with modules and lessons.
         * When empty, the extension looks in the workspace root for a `.teacher/curriculum/` folder.
         * Used by: TeacherService.getCurriculum().
         */
        'teacher.curriculum.directory': {
            type: 'string',
            default: '',
            description: 'Directory containing curriculum definition files.'
        },
        /**
         * Directory for persisting student progress data (JSON files).
         * When empty, defaults to the Theia user data directory (~/.theia/teacher/progress/).
         * Used by: ProgressTrackingService (all methods).
         */
        'teacher.progress.storageDirectory': {
            type: 'string',
            default: '',
            description: 'Directory for storing student progress. Defaults to user data directory.'
        },
        /**
         * The student's self-reported skill level.
         * Controls prompt selection in agents (beginner/intermediate/advanced variants),
         * explanation depth, Socratic questioning intensity, and code example complexity.
         * Used by: TutorAgent, ExplainAgent, TeachingReviewAgent (prompt variant selection).
         */
        'teacher.tutor.skillLevel': {
            type: 'string',
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'beginner',
            description: 'Student skill level. Adjusts explanation depth and Socratic questioning intensity.'
        },
        /**
         * When enabled, the tutor asks guiding questions before revealing answers.
         * When disabled, the tutor gives direct explanations (useful for quick reference).
         * Used by: TutorAgent (response structure).
         */
        'teacher.tutor.useSocraticMethod': {
            type: 'boolean',
            default: true,
            description: 'Use Socratic questioning to guide learning instead of giving direct answers.'
        },
        /**
         * Ordered list of Ollama model identifiers.
         * The first model is tried first; if unavailable, the next is used as fallback.
         * Models must be pre-pulled in Ollama (`ollama pull <model>`).
         * Used by: ASI bridge, all chat agents when using local models.
         */
        'teacher.ollama.defaultModels': {
            type: 'array',
            items: { type: 'string' },
            default: ['qwen2.5:7b', 'bonsai-8b'],
            description: 'Default Ollama models for Teacher. First model is primary, rest are fallbacks.'
        }
    }
};
