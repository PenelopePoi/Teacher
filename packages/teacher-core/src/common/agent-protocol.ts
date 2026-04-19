/**
 * Protocol interfaces for inter-agent communication within Teacher IDE.
 * Agents use these to send messages and hand off context to one another.
 */

/** Types of messages agents can exchange. */
export type AgentMessageType = 'handoff' | 'query' | 'response' | 'update' | 'notification';

/**
 * A message sent between Teacher agents.
 */
export interface AgentMessage {
    /** Agent ID of the sender (e.g., 'teacher-debugger'). */
    from: string;
    /** Agent ID of the recipient (e.g., 'teacher-tutor'). */
    to: string;
    /** The type of this message. */
    type: AgentMessageType;
    /** Arbitrary payload — structure depends on the message type. */
    payload: unknown;
}

/**
 * Represents a handoff from one agent to another, including the
 * conversational context and the reason for the transfer.
 */
export interface AgentHandoff {
    /** Agent ID that is handing off. */
    fromAgent: string;
    /** Agent ID that should take over. */
    toAgent: string;
    /**
     * Serializable context to pass to the receiving agent.
     * Typically includes conversation history, current file, and student state.
     */
    context: Record<string, unknown>;
    /** Human-readable reason for the handoff (e.g., "Student needs concept explanation"). */
    reason: string;
}

/** Symbol for dependency injection of the AgentCommunicationService. */
export const AgentCommunicationService = Symbol('AgentCommunicationService');

/**
 * Service for routing messages and handoffs between Teacher agents.
 */
export interface AgentCommunicationService {
    /** Send a message to another agent. */
    sendMessage(message: AgentMessage): Promise<void>;
    /** Initiate a handoff from one agent to another. */
    initiateHandoff(handoff: AgentHandoff): Promise<void>;
    /** Register a handler for incoming messages to a specific agent. */
    onMessage(agentId: string, handler: (message: AgentMessage) => void): void;
    /** Register a handler for incoming handoffs to a specific agent. */
    onHandoff(agentId: string, handler: (handoff: AgentHandoff) => void): void;
}
