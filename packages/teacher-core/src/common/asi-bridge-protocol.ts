/** Service path for the ASI bridge backend service. */
export const ASI_BRIDGE_SERVICE_PATH = '/services/asi-bridge';

/** Symbol for dependency injection of the ASIBridgeService. */
export const ASIBridgeService = Symbol('ASIBridgeService');

/**
 * Bridge to the local ASI (Artificial Superintelligence) multi-agent system.
 *
 * The ASI swarm consists of 5 parallel researcher agents, a critic, synthesizer,
 * improver, and scorer. It runs locally via Ollama and accumulates knowledge
 * in a persistent knowledge base.
 *
 * **Timeout behavior**: All methods that reach the ASI process have a default
 * timeout of 120 seconds. If the ASI process does not respond within that window,
 * the promise rejects with a timeout error.
 *
 * **Retry behavior**: Network-level failures (connection refused, socket hang-up)
 * are retried up to 3 times with exponential backoff (1s, 2s, 4s). Application-level
 * errors (e.g., model not found) are not retried.
 */
export interface ASIBridgeService {
    /**
     * Sends a free-form query to the ASI swarm and returns a synthesized response.
     * @param prompt The question or instruction to send.
     * @param context Optional key-value context to provide to the researchers (e.g., current file, lesson objectives).
     * @returns A response with the synthesized answer, confidence score, and metadata.
     */
    query(prompt: string, context?: Record<string, unknown>): Promise<ASIResponse>;

    /**
     * Returns the current status of the ASI bridge — whether it's running,
     * connected to Ollama, and how many knowledge entries exist.
     */
    getStatus(): Promise<ASIStatus>;

    /**
     * Asks the ASI to generate a teaching explanation for a topic at the given student level.
     * @param topic The concept or topic to teach.
     * @param studentLevel One of 'beginner', 'intermediate', or 'advanced'.
     */
    teach(topic: string, studentLevel: string): Promise<ASIResponse>;

    /**
     * Exports a snapshot of the ASI's accumulated knowledge base to disk.
     * Useful for backup, transfer, or offline analysis.
     */
    exportKnowledgeSnapshot(): Promise<ExportSnapshotResult>;

    /**
     * Runs an anomaly scan across the knowledge base to detect inconsistencies,
     * contradictions, or low-quality entries.
     */
    detectAnomalies(): Promise<AnomalyScanResult>;
}

/**
 * Response from the ASI multi-agent system.
 */
export interface ASIResponse {
    /** The synthesized answer from the ASI swarm. */
    answer: string;
    /**
     * Confidence score from 0.0 to 1.0.
     * - 0.0-0.3: low confidence — limited evidence or conflicting sources
     * - 0.4-0.6: moderate confidence — partial evidence
     * - 0.7-0.9: high confidence — strong consensus among researchers
     * - 1.0: maximum confidence — well-established fact with full agreement
     */
    confidence: number;
    /** Source references used by the researchers to form this answer. */
    sources: string[];
    /** Number of researcher agents that contributed to this response. */
    researcherCount: number;
    /** Wall-clock processing time in milliseconds. */
    processingTimeMs: number;
}

/**
 * Health/status information for the ASI bridge.
 */
export interface ASIStatus {
    /** Whether the ASI bridge process is currently running. */
    running: boolean;
    /** Whether the bridge has an active connection to the Ollama model server. */
    ollamaConnected: boolean;
    /** Number of entries in the persistent knowledge base. */
    knowledgeEntries: number;
    /** Name of the currently loaded Ollama model (e.g., "qwen2.5:7b"). */
    modelName: string;
}

/**
 * Result of a knowledge base export operation.
 */
export interface ExportSnapshotResult {
    /** Whether the export completed successfully. */
    ok: boolean;
    /** Filesystem path where the snapshot was written, if successful. */
    path?: string;
    /** Total size of the exported snapshot in bytes. */
    bytes?: number;
    /** Number of files included in the snapshot. */
    fileCount?: number;
    /** Time the export took, in seconds. */
    elapsedSeconds?: number;
    /** Error message if the export failed. */
    error?: string;
    /** Raw stderr output from the export process, if any. */
    stderr?: string;
}

/**
 * Result of an anomaly detection scan on the knowledge base.
 */
export interface AnomalyScanResult {
    /** Whether the scan completed successfully. */
    ok: boolean;
    /** Total number of anomalies or issues detected. */
    findingsTotal: number;
    /** Path to the detailed findings in JSON format. */
    jsonPath?: string;
    /** Path to a human-readable markdown report of the findings. */
    markdownPath?: string;
    /** Error message if the scan failed. */
    error?: string;
    /** Raw stderr output from the scan process, if any. */
    stderr?: string;
}
