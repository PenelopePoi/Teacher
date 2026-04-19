import * as React from 'react';
import { injectable } from 'inversify';
import { StatusBarImpl } from '@theia/core/lib/browser/status-bar/status-bar';
import { StatusBarViewEntry, StatusBarAlignment } from '@theia/core/lib/browser/status-bar/status-bar-types';

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

    protected override render(): React.ReactElement {
        const leftEntries: React.ReactNode[] = [];
        const rightEntries: React.ReactNode[] = [];

        // Inject the AI Pulse indicator as the first left element
        leftEntries.push(
            React.createElement('div', {
                key: 'teacher-pulse-indicator',
                className: 'element teacher-pulse-dot-container',
                title: 'AI Status',
            },
                React.createElement('span', { className: 'teacher-pulse-dot' }),
                React.createElement('span', { className: 'teacher-pulse-label' }, 'AI Ready')
            )
        );

        // Inject current lesson objective placeholder
        leftEntries.push(
            React.createElement('div', {
                key: 'teacher-lesson-objective',
                className: 'element teacher-lesson-objective',
            }, '')
        );

        // Filter and render remaining entries
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
