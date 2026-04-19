import { injectable } from '@theia/core/shared/inversify';
import {
    AgentCommunicationService,
    AgentHandoff,
    AgentMessage
} from '../../common/agent-protocol';

/**
 * Manages handoffs and message routing between Teacher agents.
 *
 * When one agent determines that another is better suited to handle the
 * current student interaction (e.g., debugger detects a concept gap and
 * hands off to the tutor), it routes through this service.
 */
@injectable()
export class AgentHandoffService implements AgentCommunicationService {

    protected readonly messageHandlers = new Map<string, Array<(message: AgentMessage) => void>>();
    protected readonly handoffHandlers = new Map<string, Array<(handoff: AgentHandoff) => void>>();

    async sendMessage(message: AgentMessage): Promise<void> {
        const handlers = this.messageHandlers.get(message.to);
        if (handlers) {
            for (const handler of handlers) {
                handler(message);
            }
        }
    }

    async initiateHandoff(handoff: AgentHandoff): Promise<void> {
        const handlers = this.handoffHandlers.get(handoff.toAgent);
        if (handlers) {
            for (const handler of handlers) {
                handler(handoff);
            }
        }
    }

    onMessage(agentId: string, handler: (message: AgentMessage) => void): void {
        const existing = this.messageHandlers.get(agentId) ?? [];
        existing.push(handler);
        this.messageHandlers.set(agentId, existing);
    }

    onHandoff(agentId: string, handler: (handoff: AgentHandoff) => void): void {
        const existing = this.handoffHandlers.get(agentId) ?? [];
        existing.push(handler);
        this.handoffHandlers.set(agentId, existing);
    }
}
