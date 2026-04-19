import { PreferenceSchema } from '@theia/core/lib/browser/preferences/preference-contribution';

export const TeacherPreferencesSchema: PreferenceSchema = {
    type: 'object',
    properties: {
        'teacher.asi.enabled': {
            type: 'boolean',
            default: true,
            description: 'Enable the Local ASI multi-agent system for deep explanations.'
        },
        'teacher.asi.host': {
            type: 'string',
            default: 'http://localhost:8765',
            description: 'Host URL for the ASI bridge HTTP service.'
        },
        'teacher.asi.path': {
            type: 'string',
            default: '',
            description: 'Path to asi.py. Leave empty to use the bundled version.'
        },
        'teacher.curriculum.directory': {
            type: 'string',
            default: '',
            description: 'Directory containing curriculum definition files.'
        },
        'teacher.progress.storageDirectory': {
            type: 'string',
            default: '',
            description: 'Directory for storing student progress. Defaults to user data directory.'
        },
        'teacher.tutor.skillLevel': {
            type: 'string',
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'beginner',
            description: 'Student skill level. Adjusts explanation depth and Socratic questioning intensity.'
        },
        'teacher.tutor.useSocraticMethod': {
            type: 'boolean',
            default: true,
            description: 'Use Socratic questioning to guide learning instead of giving direct answers.'
        },
        'teacher.ollama.defaultModels': {
            type: 'array',
            items: { type: 'string' },
            default: ['qwen2.5:7b', 'bonsai-8b'],
            description: 'Default Ollama models for Teacher. First model is primary, rest are fallbacks.'
        }
    }
};
