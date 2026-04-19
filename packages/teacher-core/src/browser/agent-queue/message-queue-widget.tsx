import { ReactWidget } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';
import { MessageQueueService, QueuedMessage } from './message-queue-service';

/**
 * G6a — Message Queue Widget.
 *
 * Floating panel showing messages queued for the current agent run.
 * Input field at bottom lets the user type a message and press Enter
 * to append it to the running agent's context without breaking the loop.
 */

@injectable()
export class MessageQueueWidget extends ReactWidget {

    static readonly ID = 'teacher-message-queue';
    static readonly LABEL = nls.localize('theia/teacher/messageQueue', 'Agent Message Queue');

    @inject(MessageQueueService)
    protected readonly queueService: MessageQueueService;

    protected inputValue: string = '';

    @postConstruct()
    protected init(): void {
        this.id = MessageQueueWidget.ID;
        this.title.label = MessageQueueWidget.LABEL;
        this.title.caption = MessageQueueWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-comment-discussion';
        this.addClass('teacher-message-queue');

        this.toDispose.push(this.queueService.onDidChange(() => {
            this.update();
        }));
    }

    /** Called by the contribution to focus the input field */
    focusInput(): void {
        const input = this.node.querySelector<HTMLInputElement>('.teacher-mq-input');
        if (input) {
            input.focus();
        }
    }

    protected handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.inputValue = e.target.value;
    };

    protected handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter' && this.inputValue.trim().length > 0) {
            this.queueService.enqueue(this.inputValue.trim());
            this.inputValue = '';
            this.update();
            // Re-focus after React re-render
            setTimeout(() => this.focusInput(), 0);
        }
    };

    protected handleRemove = (id: string): void => {
        this.queueService.remove(id);
    };

    protected render(): React.ReactNode {
        const messages = this.queueService.getAll();
        const count = messages.length;

        return (
            <div className='teacher-mq-container'>
                <div className='teacher-mq-header'>
                    <span className='teacher-mq-title'>
                        <i className='codicon codicon-comment-discussion' />
                        {nls.localize('theia/teacher/mqTitle', 'Queued Messages')}
                    </span>
                    {count > 0 && (
                        <span className='teacher-mq-badge'>{count}</span>
                    )}
                </div>

                <div className='teacher-mq-list'>
                    {messages.length === 0 && (
                        <div className='teacher-mq-empty'>
                            {nls.localize(
                                'theia/teacher/mqEmpty',
                                'Type a message to send to the agent mid-run'
                            )}
                        </div>
                    )}

                    {messages.map(msg => (
                        <MessageEntry
                            key={msg.id}
                            message={msg}
                            onRemove={this.handleRemove}
                        />
                    ))}
                </div>

                <div className='teacher-mq-input-row'>
                    <input
                        className='teacher-mq-input'
                        type='text'
                        value={this.inputValue}
                        onChange={this.handleInputChange}
                        onKeyDown={this.handleInputKeyDown}
                        placeholder={nls.localize(
                            'theia/teacher/mqPlaceholder',
                            'Message the agent... (Enter to queue)'
                        )}
                    />
                </div>
            </div>
        );
    }
}

/* ── Extracted child component (avoids bind-in-render) ── */

interface MessageEntryProps {
    message: QueuedMessage;
    onRemove: (id: string) => void;
}

function MessageEntry({ message, onRemove }: MessageEntryProps): React.ReactElement {
    const time = new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    const handleCancel = React.useCallback(() => {
        onRemove(message.id);
    }, [message.id, onRemove]);

    return (
        <div className='teacher-mq-entry'>
            <div className='teacher-mq-entry-body'>
                <span className='teacher-mq-entry-text'>{message.text}</span>
                <span className='teacher-mq-entry-time'>{time}</span>
            </div>
            <button
                type='button'
                className='teacher-mq-entry-cancel'
                onClick={handleCancel}
                title={nls.localize('theia/teacher/mqRemove', 'Remove from queue')}
            >
                <i className='codicon codicon-close' />
            </button>
        </div>
    );
}
