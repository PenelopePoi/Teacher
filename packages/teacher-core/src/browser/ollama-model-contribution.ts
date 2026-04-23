import { inject, injectable } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { PreferenceService } from '@theia/core';

/**
 * Ensures Ollama models are registered on startup.
 *
 * Sets `ai-features.ollama.ollamaModels` to include the Teacher defaults
 * (qwen2.5:7b + weatherspoon-asi) if the preference is empty.
 * This makes Ollama models available to agents via `ollama/qwen2.5:7b`.
 */
@injectable()
export class OllamaModelContribution implements FrontendApplicationContribution {

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    onStart(): void {
        this.preferenceService.ready.then(() => {
            const existing = this.preferenceService.get<string[]>('ai-features.ollama.ollamaModels', []);
            const teacherModels = ['qwen2.5:7b', 'weatherspoon-asi'];

            const toAdd = teacherModels.filter(m => !existing.includes(m));
            if (toAdd.length > 0) {
                const merged = [...existing, ...toAdd];
                this.preferenceService.set('ai-features.ollama.ollamaModels', merged);
                console.info(`[OllamaModelContribution] Registered Ollama models: ${merged.join(', ')}`);
            }

            // Ensure host is set
            const host = this.preferenceService.get<string>('ai-features.ollama.ollamaHost', '');
            if (!host) {
                this.preferenceService.set('ai-features.ollama.ollamaHost', 'http://localhost:11434');
            }
        });
    }
}
