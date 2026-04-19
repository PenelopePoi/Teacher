export const ASI_BRIDGE_SERVICE_PATH = '/services/asi-bridge';

export const ASIBridgeService = Symbol('ASIBridgeService');
export interface ASIBridgeService {
    query(prompt: string, context?: Record<string, unknown>): Promise<ASIResponse>;
    getStatus(): Promise<ASIStatus>;
    teach(topic: string, studentLevel: string): Promise<ASIResponse>;
}

export interface ASIResponse {
    answer: string;
    confidence: number;
    sources: string[];
    researcherCount: number;
    processingTimeMs: number;
}

export interface ASIStatus {
    running: boolean;
    ollamaConnected: boolean;
    knowledgeEntries: number;
    modelName: string;
}
