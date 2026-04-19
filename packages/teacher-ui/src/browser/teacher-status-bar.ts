import * as React from 'react';
import { injectable } from 'inversify';
import { StatusBarImpl } from '@theia/core/lib/browser/status-bar/status-bar';
import { StatusBarViewEntry } from '@theia/core/lib/browser/status-bar/status-bar-types';
import { nls } from '@theia/core/lib/common/nls';

/**
 * Filtered status bar for Teacher IDE.
 *
 * Strips encoding, line-ending, and other confetti entries that distract
 * beginners. Keeps: cursor position, language mode, AI Pulse indicator,
 * and the current lesson objective.
 */
@injectable()
export class TeacherStatusBar extends StatusBarImpl {

    /** IDs of status-bar entries that beginners don't need to see. */
    private static readonly HIDDEN_ENTRY_PATTERNS = [
        'editor-status-encoding',
        'editor-status-eol',
        'status.editor.mode',          // indentation mode
        'status.editor.indentation',
        'vcs',                          // git branch
        'status-bar-branch-item',
        'editor-status-tabFocusMode',
    ];

    /** Current lesson objective text. */
    private lessonObjective = '';

    /** Update the lesson objective shown in the status bar. */
    setLessonObjective(text: string): void {
        this.lessonObjective = text;
        this.update();
    }

    protected override render(): React.ReactElement {
        const leftEntries: React.ReactNode[] = [];
        const rightEntries: React.ReactNode[] = [];

        const pulseLabel = nls.localize('theia/teacher/aiPulse', 'AI Pulse');

        // Inject the AI Pulse indicator as the first left element
        leftEntries.push(
            React.createElement('div', {
                key: 'teacher-pulse-indicator',
                className: 'element teacher-pulse-dot-container',
                title: pulseLabel,
                'aria-label': pulseLabel,
            },
                React.createElement('span', { className: 'teacher-pulse-dot teacher-pulse-breathing-dot' }),
                React.createElement('span', { className: 'teacher-pulse-label' }, pulseLabel)
            )
        );

        // Inject current lesson objective
        leftEntries.push(
            React.createElement('div', {
                key: 'teacher-lesson-objective',
                className: 'element teacher-lesson-objective',
                'aria-label': nls.localize('theia/teacher/lessonObjective', 'Lesson Objective'),
            }, this.lessonObjective)
        );

        // Filter and render remaining entries with error handling
        try {
            if (this.viewModel) {
                for (const entry of this.viewModel.getLeft()) {
                    if (!this.isHiddenEntry(entry)) {
                        leftEntries.push(this.renderElement(entry));
                    }
                }

                for (const entry of this.viewModel.getRight()) {
                    if (!this.isHiddenEntry(entry)) {
                        rightEntries.push(this.renderElement(entry));
                    }
                }
            }
        } catch (err) {
            console.error('[TeacherStatusBar] Error rendering entries:', err);
        }

        return React.createElement(React.Fragment, null,
            React.createElement('div', { className: 'area left' }, ...leftEntries),
            React.createElement('div', { className: 'area right' }, ...rightEntries),
        );
    }

    private isHiddenEntry(viewEntry: StatusBarViewEntry): boolean {
        const id = viewEntry.id.toLowerCase();
        return TeacherStatusBar.HIDDEN_ENTRY_PATTERNS.some(
            pattern => id.includes(pattern.toLowerCase())
        );
    }
}
