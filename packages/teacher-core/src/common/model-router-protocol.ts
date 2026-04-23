/**
 * Protocol for the Model Router + Training Data Collector.
 * Enables frontend agents to report interactions for model training
 * and query which model to use.
 */

export const ModelRouterService = Symbol('ModelRouterService');
export const MODEL_ROUTER_SERVICE_PATH = '/services/model-router';

export type PromptCategory =
    | 'code-generation'
    | 'code-review'
    | 'debugging'
    | 'explanation'
    | 'planning'
    | 'motivation'
    | 'assessment'
    | 'general';

export interface ModelSelectionResult {
    model: string;
    category: PromptCategory;
}

export interface CustomModelStatus {
    model: string;
    interactions: number;
    avgScore: number;
    isPrimary: boolean;
}

export interface TrainingStats {
    totalRecords: number;
    highQualityRecords: number;
    humanRated: number;
    oldestDate: string;
    newestDate: string;
}

export interface ModelRouterService {
    /** Select the best model for a given agent and prompt. */
    selectModel(agentId: string, promptPreview: string): Promise<ModelSelectionResult>;
    /** Record an interaction for training data collection. */
    recordInteraction(params: {
        agentId: string;
        model: string;
        category: string;
        system: string;
        user: string;
        assistant: string;
        context?: Record<string, unknown>;
    }): Promise<void>;
    /** Rate an interaction (human feedback). */
    rateInteraction(timestamp: string, score: number): Promise<void>;
    /** Get custom model readiness status. */
    getCustomModelStatus(): Promise<CustomModelStatus | undefined>;
    /** Get training data stats. */
    getTrainingStats(): Promise<TrainingStats>;
    /** Export high-quality training data for fine-tuning. */
    exportTrainingData(minScore?: number): Promise<{ path: string; count: number }>;
}
