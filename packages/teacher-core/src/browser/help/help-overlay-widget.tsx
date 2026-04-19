import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { nls } from '@theia/core';
import * as React from '@theia/core/shared/react';

/**
 * B7 Help Overlay — press ? to see all keyboard shortcuts.
 *
 * Glass-background modal organized by category. Closes on Escape or
 * clicking the backdrop. Shortcuts the user hasn't triggered yet are
 * marked with an amber dot.
 */

interface ShortcutEntry {
    keys: string;
    label: string;
    commandId: string;
}

interface ShortcutCategory {
    title: string;
    shortcuts: ShortcutEntry[];
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
    {
        title: 'Navigation',
        shortcuts: [
            { keys: 'Cmd+P', label: 'Search files', commandId: 'workbench.action.quickOpen' },
            { keys: 'Cmd+Shift+.', label: 'Cycle permission mode', commandId: 'teacher.modeCycle' },
        ],
    },
    {
        title: 'AI',
        shortcuts: [
            { keys: 'Cmd+Shift+A', label: 'Ask about selection', commandId: 'teacher.askAboutSelection' },
            { keys: 'Cmd+Shift+M', label: 'Queue message to agent', commandId: 'teacher.messageQueue.open' },
        ],
    },
    {
        title: 'Lessons',
        shortcuts: [
            { keys: 'Ctrl+Shift+L', label: 'Start lesson', commandId: 'teacher.lesson.start' },
            { keys: 'Ctrl+Shift+C', label: 'Check my work', commandId: 'teacher.lesson.checkWork' },
            { keys: 'Ctrl+Shift+H', label: 'Get hint', commandId: 'teacher.lesson.getHint' },
        ],
    },
    {
        title: 'Modes',
        shortcuts: [
            { keys: 'Cmd+Shift+.', label: 'Cycle permission mode', commandId: 'teacher.modeCycle' },
        ],
    },
    {
        title: 'General',
        shortcuts: [
            { keys: '?', label: 'This overlay', commandId: 'teacher.helpOverlay.toggle' },
            { keys: 'Cmd+K', label: 'Command palette', commandId: 'workbench.action.showCommands' },
        ],
    },
];

const USED_COMMANDS_KEY = 'teacher.helpOverlay.usedCommands';

@injectable()
export class HelpOverlayWidget extends ReactWidget {

    static readonly ID = 'teacher-help-overlay';
    static readonly LABEL = nls.localize('theia/teacher/helpOverlay', 'Keyboard Shortcuts');

    protected usedCommands: Set<string> = new Set();

    constructor() {
        super();
        this.id = HelpOverlayWidget.ID;
        this.title.label = HelpOverlayWidget.LABEL;
        this.title.closable = true;
        this.addClass('teacher-help-overlay-widget');
    }

    @postConstruct()
    protected init(): void {
        this.loadUsedCommands();
        this.update();
    }

    markCommandUsed(commandId: string): void {
        if (!this.usedCommands.has(commandId)) {
            this.usedCommands.add(commandId);
            this.saveUsedCommands();
            this.update();
        }
    }

    protected loadUsedCommands(): void {
        try {
            const raw = localStorage.getItem(USED_COMMANDS_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    this.usedCommands = new Set(parsed);
                }
            }
        } catch {
            // ignore
        }
    }

    protected saveUsedCommands(): void {
        try {
            localStorage.setItem(USED_COMMANDS_KEY, JSON.stringify([...this.usedCommands]));
        } catch {
            // ignore
        }
    }

    protected render(): React.ReactNode {
        return (
            <div className="teacher-help-overlay-backdrop" onClick={this.handleBackdropClick}>
                <div className="teacher-help-overlay-panel" onClick={this.stopPropagation}>
                    <div className="teacher-help-overlay-header">
                        <h2 className="teacher-help-overlay-title">
                            {nls.localize('theia/teacher/shortcutSheet', 'Keyboard Shortcuts')}
                        </h2>
                        <button
                            className="teacher-help-overlay-close"
                            aria-label="Close"
                            onClick={this.handleClose}
                        >
                            <span className="codicon codicon-close" />
                        </button>
                    </div>
                    <div className="teacher-help-overlay-body">
                        {SHORTCUT_CATEGORIES.map(category => this.renderCategory(category))}
                    </div>
                    <div className="teacher-help-overlay-footer">
                        <span className="teacher-help-overlay-legend-dot teacher-help-overlay-amber-dot" />
                        <span className="teacher-help-overlay-legend-label">
                            {nls.localize('theia/teacher/unusedShortcut', 'Not yet used')}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    protected renderCategory(category: ShortcutCategory): React.ReactNode {
        return (
            <div className="teacher-help-overlay-category" key={category.title}>
                <h3 className="teacher-help-overlay-category-title">{category.title}</h3>
                <div className="teacher-help-overlay-shortcut-list">
                    {category.shortcuts.map(shortcut => this.renderShortcut(shortcut))}
                </div>
            </div>
        );
    }

    protected renderShortcut(shortcut: ShortcutEntry): React.ReactNode {
        const isUsed = this.usedCommands.has(shortcut.commandId);
        return (
            <div className="teacher-help-overlay-shortcut-row" key={shortcut.commandId + shortcut.keys}>
                {!isUsed && <span className="teacher-help-overlay-amber-dot" />}
                <kbd className="teacher-help-overlay-kbd">{shortcut.keys}</kbd>
                <span className="teacher-help-overlay-shortcut-label">{shortcut.label}</span>
            </div>
        );
    }

    protected handleBackdropClick = (): void => {
        this.close();
    };

    protected stopPropagation = (e: React.MouseEvent): void => {
        e.stopPropagation();
    };

    protected handleClose = (): void => {
        this.close();
    };
}
