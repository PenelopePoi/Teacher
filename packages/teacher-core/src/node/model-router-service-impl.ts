import { inject, injectable } from '@theia/core/shared/inversify';
import {
    ModelRouterService,
    ModelSelectionResult,
    CustomModelStatus,
    TrainingStats,
    PromptCategory,
} from '../common/model-router-protocol';
import { ModelRouter } from './model-router';
import { TrainingDataCollector } from './training-data-collector';

@injectable()
export class ModelRouterServiceImpl implements ModelRouterService {

    @inject(ModelRouter)
    protected readonly router: ModelRouter;

    @inject(TrainingDataCollector)
    protected readonly collector: TrainingDataCollector;

    async selectModel(agentId: string, promptPreview: string): Promise<ModelSelectionResult> {
        const model = await this.router.selectModel(agentId, promptPreview);
        const category = this.router.classifyPrompt(agentId, promptPreview);
        return { model, category };
    }

    async recordInteraction(params: {
        agentId: string;
        model: string;
        category: string;
        system: string;
        user: string;
        assistant: string;
        context?: Record<string, unknown>;
    }): Promise<void> {
        this.collector.record({
            ...params,
            category: params.category as PromptCategory,
        });
    }

    async rateInteraction(timestamp: string, score: number): Promise<void> {
        this.collector.rateInteraction(timestamp, score);
    }

    async getCustomModelStatus(): Promise<CustomModelStatus | undefined> {
        return this.router.getCustomModelStatus();
    }

    async getTrainingStats(): Promise<TrainingStats> {
        return this.collector.getStats();
    }

    async exportTrainingData(minScore?: number): Promise<{ path: string; count: number }> {
        return this.collector.exportForFineTuning(minScore);
    }
}
