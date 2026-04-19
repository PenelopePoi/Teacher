export const ASI_BRIDGE_SERVICE_PATH = '/services/asi-bridge';

export const ASIBridgeService = Symbol('ASIBridgeService');
export interface ASIBridgeService {
    query(prompt: string, context?: Record<string, unknown>): Promise<ASIResponse>;
    getStatus(): Promise<ASIStatus>;
    teach(topic: string, studentLevel: string): Promise<ASIResponse>;
    exportKnowledgeSnapshot(): Promise<ExportSnapshotResult>;
    detectAnomalies(): Promise<AnomalyScanResult>;
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

export interface ExportSnapshotResult {
    ok: boolean;
    path?: string;
    bytes?: number;
    fileCount?: number;
    elapsedSeconds?: number;
    error?: string;
    stderr?: string;
}

export interface AnomalyScanResult {
    ok: boolean;
    findingsTotal: number;
    jsonPath?: string;
    markdownPath?: string;
    error?: string;
    stderr?: string;
}
