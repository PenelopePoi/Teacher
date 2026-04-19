import { ReactWidget } from '@theia/core/lib/browser';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import { Emitter, Event } from '@theia/core/lib/common/event';
import * as React from '@theia/core/shared/react';
import { IntentObject } from '../../common/intent-protocol';

/**
 * Intent Dock (A5/A6) — sidebar widget showing pending intent cards.
 *
 * Each card shows: source icon, cleaned text, inferred action, confidence bar.
 * Actions: Apply (routes to agent), Dismiss (fade-out), Refine (text input).
 * Cards animate in with a shimmer-on-arrival effect.
 */
@injectable()
export class IntentDockWidget extends ReactWidget {

    static readonly ID = 'teacher-intent-dock';
    static readonly LABEL = nls.localize('theia/teacher/intentDock', 'Intent Dock');

    protected intents: IntentObject[] = [];
    protected refiningId: string | undefined;
    protected refineText: string = '';

    protected readonly _onApply = new Emitter<string>();
    readonly onApply: Event<string> = this._onApply.event;

    protected readonly _onDismiss = new Emitter<string>();
    readonly onDismiss: Event<string> = this._onDismiss.event;

    protected readonly _onRefine = new Emitter<{ id: string; text: string }>();
    readonly onRefine: Event<{ id: string; text: string }> = this._onRefine.event;

    @postConstruct()
    protected init(): void {
        this.id = IntentDockWidget.ID;
        this.title.label = IntentDockWidget.LABEL;
        this.title.caption = IntentDockWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-lightbulb';
        this.addClass('teacher-intent-dock');
    }

    setIntents(intents: IntentObject[]): void {
        this.intents = intents;
        this.update();
    }

    addIntent(intent: IntentObject): void {
        this.intents = [intent, ...this.intents];
        this.update();
    }

    removeIntent(id: string): void {
        this.intents = this.intents.filter(i => i.id !== id);
        this.update();
    }

    protected handleApply = (id: string): void => {
        this._onApply.fire(id);
    };

    protected handleDismiss = (id: string): void => {
        this.removeIntent(id);
        this._onDismiss.fire(id);
    };

    protected handleRefineStart = (id: string): void => {
        this.refiningId = id;
        this.refineText = '';
        this.update();
    };

    protected handleRefineCancel = (): void => {
        this.refiningId = undefined;
        this.refineText = '';
        this.update();
    };

    protected handleRefineSubmit = (id: string): void => {
        if (this.refineText.trim()) {
            this._onRefine.fire({ id, text: this.refineText.trim() });
        }
        this.refiningId = undefined;
        this.refineText = '';
        this.update();
    };

    protected handleRefineInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.refineText = e.target.value;
    };

    protected render(): React.ReactNode {
        const pending = this.intents.filter(i => i.status === 'pending');
        if (pending.length === 0) {
            return this.renderEmpty();
        }
        return (
            <div className='teacher-intent-dock-container'>
                <div className='teacher-intent-dock-header'>
                    <span className='teacher-intent-dock-title'>
                        {nls.localize('theia/teacher/intentPending', 'Pending Intents')}
                    </span>
                    <span className='teacher-intent-dock-count'>{pending.length}</span>
                </div>
                <div className='teacher-intent-dock-cards'>
                    {pending.map(intent => this.renderCard(intent))}
                </div>
            </div>
        );
    }

    protected renderEmpty(): React.ReactNode {
        return (
            <div className='teacher-intent-dock-empty'>
                <i className='codicon codicon-comment-discussion' />
                <p>
                    {nls.localize(
                        'theia/teacher/intentEmpty',
                        "Capture ideas anywhere. They'll appear here when you sit down to work."
                    )}
                </p>
            </div>
        );
    }

    protected renderCard(intent: IntentObject): React.ReactNode {
        const sourceIcon = this.getSourceIcon(intent.source);
        const isRefining = this.refiningId === intent.id;

        return (
            <div key={intent.id} className='teacher-intent-card teacher-intent-card--shimmer'>
                <div className='teacher-intent-card-header'>
                    <i className={`codicon ${sourceIcon}`} />
                    <span className='teacher-intent-card-source'>{intent.source}</span>
                    <span className='teacher-intent-card-time'>
                        {new Date(intent.timestamp).toLocaleTimeString()}
                    </span>
                </div>
                <div className='teacher-intent-card-body'>
                    <p className='teacher-intent-card-text'>{intent.cleanedText}</p>
                    <div className='teacher-intent-card-action'>
                        <span className='teacher-intent-card-verb'>{intent.inferredAction.verb}</span>
                        <span className='teacher-intent-card-target'>{intent.inferredAction.target}</span>
                    </div>
                    <div className='teacher-intent-card-confidence'>
                        <div
                            className='teacher-intent-card-confidence-bar'
                            style={{ width: `${Math.round(intent.confidence * 100)}%` }}
                        />
                        <span className='teacher-intent-card-confidence-label'>
                            {Math.round(intent.confidence * 100)}%
                        </span>
                    </div>
                </div>
                {isRefining ? (
                    <div className='teacher-intent-card-refine'>
                        <input
                            type='text'
                            className='teacher-intent-card-refine-input'
                            placeholder={nls.localize('theia/teacher/intentRefine', 'Clarify this intent...')}
                            onChange={this.handleRefineInput}
                            autoFocus
                        />
                        <button
                            type='button'
                            className='teacher-intent-card-btn teacher-intent-card-btn--confirm'
                            onClick={() => this.handleRefineSubmit(intent.id)}
                        >
                            <i className='codicon codicon-check' />
                        </button>
                        <button
                            type='button'
                            className='teacher-intent-card-btn teacher-intent-card-btn--cancel'
                            onClick={this.handleRefineCancel}
                        >
                            <i className='codicon codicon-close' />
                        </button>
                    </div>
                ) : (
                    <div className='teacher-intent-card-actions'>
                        <button
                            type='button'
                            className='teacher-intent-card-btn teacher-intent-card-btn--apply'
                            onClick={() => this.handleApply(intent.id)}
                        >
                            <i className='codicon codicon-play' />
                            {nls.localize('theia/teacher/intentApply', 'Apply')}
                        </button>
                        <button
                            type='button'
                            className='teacher-intent-card-btn teacher-intent-card-btn--refine'
                            onClick={() => this.handleRefineStart(intent.id)}
                        >
                            <i className='codicon codicon-edit' />
                            {nls.localize('theia/teacher/intentRefineBtn', 'Refine')}
                        </button>
                        <button
                            type='button'
                            className='teacher-intent-card-btn teacher-intent-card-btn--dismiss'
                            onClick={() => this.handleDismiss(intent.id)}
                        >
                            <i className='codicon codicon-close' />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    protected getSourceIcon(source: 'voice' | 'text' | 'gesture'): string {
        switch (source) {
            case 'voice': return 'codicon-mic';
            case 'text': return 'codicon-keyboard';
            case 'gesture': return 'codicon-hand';
        }
    }
}
