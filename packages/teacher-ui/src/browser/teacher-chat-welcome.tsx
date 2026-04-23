import { ChatWelcomeMessageProvider } from '@theia/ai-chat-ui/lib/browser/chat-tree-view';
import * as React from '@theia/core/shared/react';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class TeacherChatWelcomeProvider implements ChatWelcomeMessageProvider {

    readonly priority = 200; // Higher than default (100) to override

    async provide(): Promise<React.ReactNode> {
        return React.createElement('div', { style: { padding: '20px', maxWidth: '600px' } },
            React.createElement('h2', {
                style: { fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: 'var(--accent-amber, #E8A948)' }
            }, 'Welcome to Teacher'),
            React.createElement('p', {
                style: { fontSize: '14px', color: 'var(--text-secondary, #B8BEC7)', marginBottom: '20px', lineHeight: 1.6 }
            }, 'From Pain to Purpose. From Passion to Prophet.'),

            React.createElement('h3', {
                style: { fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary, #F2F4F7)' }
            }, 'Start Learning'),

            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' } },
                courseCard('Intro to Python', '5 lessons \u00b7 3 credits', 'Your first program, variables, conditionals, loops, functions', 'codicon-symbol-method'),
                courseCard('Web Fundamentals', '6 lessons \u00b7 3 credits', 'HTML structure, CSS styling, JavaScript basics', 'codicon-globe'),
                courseCard('Git Basics', '4 lessons \u00b7 2 credits', 'Init & commit, staging & status, branching, merging', 'codicon-git-branch'),
                courseCard('CS Foundations', '7 lessons \u00b7 4 credits', 'Data structures, algorithms, systems thinking, how AI works', 'codicon-symbol-class'),
                courseCard('Build a Business with AI', '7 lessons \u00b7 4 credits', 'Find a problem, build an MVP, get your first customer, scale with AI', 'codicon-rocket'),
            ),

            React.createElement('h3', {
                style: { fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary, #F2F4F7)' }
            }, 'Try These'),

            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
                promptChip('Explain what a closure is and why I should care'),
                promptChip('Help me build a simple beat sequencer in Python'),
                promptChip('Review my code and teach me what I can improve'),
                promptChip('What should I learn first if I want to build websites?'),
            ),

            React.createElement('p', {
                style: { fontSize: '12px', color: 'var(--text-tertiary, #7A828E)', marginTop: '20px', fontStyle: 'italic' }
            }, 'The Tutor uses Socratic questioning — it guides you to answers instead of giving them. Ask anything.'),
        );
    }
}

function courseCard(title: string, lessons: string, description: string, icon: string): React.ReactNode {
    return React.createElement('div', {
        style: {
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 14px', borderRadius: '8px',
            background: 'var(--surface-3, #24282F)',
            border: '1px solid var(--border-subtle, #23272E)',
            cursor: 'pointer',
        }
    },
        React.createElement('span', { className: `codicon ${icon}`, style: { fontSize: '20px', color: 'var(--accent-amber, #E8A948)' } }),
        React.createElement('div', { style: { flex: 1 } },
            React.createElement('div', { style: { fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #F2F4F7)' } }, title),
            React.createElement('div', { style: { fontSize: '11px', color: 'var(--text-tertiary, #7A828E)' } }, `${lessons} — ${description}`),
        ),
    );
}

function promptChip(text: string): React.ReactNode {
    return React.createElement('div', {
        style: {
            padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
            background: 'var(--surface-2, #1A1D22)',
            border: '1px solid var(--border-subtle, #23272E)',
            color: 'var(--text-secondary, #B8BEC7)',
            cursor: 'pointer',
        }
    }, `"${text}"`);
}
