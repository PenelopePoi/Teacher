import { ReactWidget } from '@theia/core/lib/browser';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';

/**
 * Permission Mode Indicator — trust level display and mode cycle.
 *
 * Claude Code's Shift+Tab pattern as a visual widget.
 * Four modes: Supervised, Auto-edit, Plan Only, Autonomous.
 */

type TrustMode = 'supervised' | 'auto-edit' | 'plan-only' | 'autonomous';

interface ModeDefinition {
    readonly mode: TrustMode;
    readonly label: string;
    readonly description: string;
    readonly icon: string;
    readonly accent: string;
}

@injectable()
export class PermissionModeWidget extends ReactWidget {

    static readonly ID = 'teacher-permission-mode';
    static readonly LABEL = nls.localize('theia/teacher/permissionMode', 'Trust Level');

    protected currentMode: TrustMode = 'supervised';
    protected readonly denylist: string[] = ['rm -rf', 'force push', 'DROP TABLE', 'deploy'];

    protected readonly modes: ModeDefinition[] = [
        {
            mode: 'supervised',
            label: nls.localize('theia/teacher/modeSupervised', 'Supervised'),
            description: nls.localize('theia/teacher/modeSupervisedDesc', 'Ask before every change'),
            icon: 'codicon codicon-shield',
            accent: 'blue',
        },
        {
            mode: 'auto-edit',
            label: nls.localize('theia/teacher/modeAutoEdit', 'Auto-edit'),
            description: nls.localize('theia/teacher/modeAutoEditDesc', 'Auto-accept file edits, ask for commands'),
            icon: 'codicon codicon-edit',
            accent: 'amber',
        },
        {
            mode: 'plan-only',
            label: nls.localize('theia/teacher/modePlanOnly', 'Plan Only'),
            description: nls.localize('theia/teacher/modePlanOnlyDesc', 'Read-only analysis, no changes'),
            icon: 'codicon codicon-eye',
            accent: 'green',
        },
        {
            mode: 'autonomous',
            label: nls.localize('theia/teacher/modeAutonomous', 'Autonomous'),
            description: nls.localize('theia/teacher/modeAutonomousDesc', 'Auto-accept with safety checks'),
            icon: 'codicon codicon-rocket',
            accent: 'red',
        },
    ];

    @postConstruct()
    protected init(): void {
        this.id = PermissionModeWidget.ID;
        this.title.label = PermissionModeWidget.LABEL;
        this.title.caption = PermissionModeWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-shield';
        this.addClass('teacher-permission-mode');
    }

    protected handleSelectMode = (mode: TrustMode): void => {
        this.currentMode = mode;
        this.update();
    };

    protected render(): React.ReactNode {
        return (
            <div className='teacher-permission-container'>
                <div className='teacher-permission-header'>
                    <h3 className='teacher-permission-title'>
                        <i className='codicon codicon-shield' />
                        {nls.localize('theia/teacher/trustLevelTitle', 'Trust Level')}
                    </h3>
                </div>
                <div className='teacher-permission-grid'>
                    {this.modes.map(m => this.renderModeCard(m))}
                </div>
                <div className='teacher-permission-denylist'>
                    <span className='teacher-permission-denylist-title'>
                        <i className='codicon codicon-error' />
                        {nls.localize('theia/teacher/denylistTitle', 'Denylist')}
                    </span>
                    <div className='teacher-permission-denylist-chips'>
                        {this.denylist.map(item => (
                            <span key={item} className='teacher-permission-deny-chip'>
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
                <div className='teacher-permission-shortcut-hint'>
                    <i className='codicon codicon-keyboard' />
                    {nls.localize('theia/teacher/trustShortcutHint', 'Shift+Tab to cycle')}
                </div>
            </div>
        );
    }

    protected renderModeCard(m: ModeDefinition): React.ReactNode {
        const isActive = this.currentMode === m.mode;

        return (
            <button
                key={m.mode}
                type='button'
                className={`teacher-permission-card teacher-permission-card--${m.accent} ${isActive ? 'teacher-permission-card--active' : ''}`}
                onClick={() => this.handleSelectMode(m.mode)}
            >
                <i className={m.icon} />
                <span className='teacher-permission-card-label'>{m.label}</span>
                <span className='teacher-permission-card-desc'>{m.description}</span>
            </button>
        );
    }
}
