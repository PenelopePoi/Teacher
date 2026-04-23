import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { exec, ChildProcess } from 'child_process';

/**
 * Ensures Ollama is running when Teacher IDE starts.
 *
 * - Checks if Ollama is reachable at localhost:11434
 * - If not, spawns `ollama serve` as a detached background process
 * - Waits up to 10 seconds for it to become ready
 * - Pulls the default model if not already available
 */
@injectable()
export class OllamaBootstrapService {

    protected ollamaProcess: ChildProcess | undefined;
    protected ready = false;

    @postConstruct()
    protected init(): void {
        this.bootstrap();
    }

    protected async bootstrap(): Promise<void> {
        const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
        const model = process.env.TEACHER_MODEL || 'qwen2.5:7b';

        // Check if already running
        if (await this.isReachable(host)) {
            console.info('[OllamaBootstrap] Ollama already running');
            this.ready = true;
            await this.ensureModel(host, model);
            return;
        }

        // Try to start it
        console.info('[OllamaBootstrap] Ollama not running — attempting to start...');
        try {
            this.ollamaProcess = exec('ollama serve', {
                env: { ...process.env },
            });

            // Detach so it doesn't block IDE shutdown
            this.ollamaProcess.unref();

            // Suppress output noise
            this.ollamaProcess.stdout?.resume();
            this.ollamaProcess.stderr?.resume();

            // Wait for readiness
            const started = await this.waitForReady(host, 10_000);
            if (started) {
                console.info('[OllamaBootstrap] Ollama started successfully');
                this.ready = true;
                await this.ensureModel(host, model);
            } else {
                console.warn('[OllamaBootstrap] Ollama did not become ready within 10s — agents will use fallback');
            }
        } catch (err) {
            console.warn('[OllamaBootstrap] Could not start Ollama:', err);
        }
    }

    protected async isReachable(host: string): Promise<boolean> {
        try {
            const response = await fetch(`${host}/api/tags`, {
                signal: AbortSignal.timeout(2000),
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    protected async waitForReady(host: string, timeoutMs: number): Promise<boolean> {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            if (await this.isReachable(host)) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        return false;
    }

    protected async ensureModel(host: string, model: string): Promise<void> {
        try {
            const response = await fetch(`${host}/api/tags`, {
                signal: AbortSignal.timeout(5000),
            });
            if (!response.ok) {
                return;
            }
            const data = await response.json() as { models?: Array<{ name: string }> };
            const models = data.models?.map(m => m.name) ?? [];

            if (models.some(m => m === model || m.startsWith(model.split(':')[0]))) {
                console.info(`[OllamaBootstrap] Model "${model}" available`);
                return;
            }

            console.info(`[OllamaBootstrap] Pulling model "${model}"...`);
            await fetch(`${host}/api/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: model, stream: false }),
                signal: AbortSignal.timeout(300_000), // 5 min for model pull
            });
            console.info(`[OllamaBootstrap] Model "${model}" pulled successfully`);
        } catch (err) {
            console.warn(`[OllamaBootstrap] Could not verify/pull model:`, err);
        }
    }

    isReady(): boolean {
        return this.ready;
    }
}
