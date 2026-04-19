import { inject, injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { MessageQueueWidget } from './message-queue-widget';
import { MessageQueueService } from './message-queue-service';

export const QueueMessageCommand: Command = {
    id: 'teacher.queueMessage',
    category: 'Teacher',
    label: nls.localize('theia/teacher/queueMessage', 'Teacher: Queue Message for Agent'),
};

@injectable()
export class MessageQueueContribution extends AbstractViewContribution<MessageQueueWidget> {

    @inject(MessageQueueService)
    protected readonly queueService: MessageQueueService;

    constructor() {
        super({
            widgetId: MessageQueueWidget.ID,
            widgetName: MessageQueueWidget.LABEL,
            defaultWidgetOptions: {
                area: 'bottom',
                rank: 200,
            },
            toggleCommandId: QueueMessageCommand.id,
            toggleKeybinding: 'ctrlcmd+shift+m',
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }

    override async openView(args?: Partial<{ activate: boolean; reveal: boolean }>): Promise<MessageQueueWidget> {
        const widget = await super.openView(args);
        widget.focusInput();
        return widget;
    }
}
