import { ReactWidget } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';
import { ModeCycleContribution, MODE_DEFINITIONS, PermissionMode } from '../commands/mode-cycle-command';

/**
 * C16 Permission Mode Widget — Trust level display and mode cycle.
 *
 * Four modes from the 2126 catalog:
 *   Review     (blue)  — propose only, nothing executes
 *   Assist     (amber) — propose + auto-accept reversible, ask for shell/deploy (DEFAULT)
 *   Autonomous (green) — auto-accept allowlist, ask for denylist
 *   Observer   (gray)  — read-only, agent analyzes but cannot edit
 */

@injectable()
export class PermissionModeWidget extends ReactWidget {

    static readonly ID = 'teacher-permission-mode';
    static readonly LABEL = nls.localize('theia/teacher/permissionMode', 'Trust Level');

    @inject(ModeCycleContribution) protected readonly modeCycle: ModeCycleContribution;

    protected readonly denylist: string[] = ['rm -rf', 'force push', 'DROP TABLE', 'deploy'];

    @postConstruct()
    protected init(): void {
        this.id = PermissionModeWidget.ID;
        this.title.label = PermissionModeWidget.LABEL;
        this.title.caption = PermissionModeWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-shield';
        this.addClass('teacher-permission-mode');
        this.toDispose.push(this.modeCycle.onDidChangeMode(() => this.update()));
    }

    protected handleSelectMode = (mode: PermissionMode): void => {
        this.modeCycle.setMode(mode);
    };

    protected render(): React.ReactNode {
        const currentMode = this.modeCycle.getMode();
        return (
            <div className='teacher-permission-container'>
                <div className='teacher-permission-header'>
                    <h3 className='teacher-permission-title'>
                        <i className='codicon codicon-shield' />
                        {nls.localize('theia/teacher/trustLevelTitle', 'Trust Level')}
                    </h3>
                    <span className='teacher-permission-shortcut-hint'>
                        <i className='codicon codicon-keyboard' />
                        {nls.localize('theia/teacher/modeCycleHint', 'Cmd+Shift+. to cycle')}
                    </span>
                </div>
                <div className='teacher-permission-grid'>
                    {MODE_DEFINITIONS.map(m => this.renderModeCard(m, currentMode))}
                </div>
                {currentMode === 'autonomous' && (
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
                )}
            </div>
        );
    }

    protected renderModeCard(m: typeof MODE_DEFINITIONS[number], currentMode: PermissionMode): React.ReactNode {
        const isActive = currentMode === m.mode;

        return (
            <button
                key={m.mode}
                type='button'
                className={`teacher-permission-card teacher-permission-card--${m.color} ${isActive ? 'teacher-permission-card--active' : ''}`}
                onClick={() => this.handleSelectMode(m.mode)}
            >
                <i className={m.icon} />
                <span className='teacher-permission-card-label'>{m.label}</span>
                <span className='teacher-permission-card-desc'>{m.description}</span>
            </button>
        );
    }
}
