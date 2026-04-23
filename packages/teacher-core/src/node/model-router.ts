import { injectable, postConstruct } from '@theia/core/shared/inversify';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PromptCategory } from '../common/model-router-protocol';

/**
 * Model capability profile — what each model is good at.
 */
interface ModelProfile {
    /** Ollama model identifier (e.g., 'qwen2.5:7b'). */
    model: string;
    /** Categories this model excels at, ranked by strength. */
    strengths: PromptCategory[];
    /** Parameter count for tie-breaking (larger = more capable). */
    parameterSize: number;
    /** Whether this is the custom Teacher model (gets priority when available + calibrated). */
    isCustom: boolean;
    /** Running average quality score (0-10) from training data feedback. */
    avgScore: number;
    /** Total interactions completed. */
    interactions: number;
}

/**
 * Model Router — selects the best available Ollama model for each prompt.
 *
 * Strategy:
 * 1. Classify the prompt by category (code, review, debug, explain, plan, etc.)
 * 2. Check which models are available in Ollama
 * 3. Pick the model with the highest strength match + quality score
 * 4. Prefer weatherspoon-asi (custom model) once it has >100 interactions
 *    and avgScore >= 7.0 — this is how the custom model gradually replaces third-party
 *
 * The router also logs every interaction for training data collection.
 */
@injectable()
export class ModelRouter {

    protected host = process.env.OLLAMA_HOST || 'http://localhost:11434';
    protected availableModels: string[] = [];
    protected profiles: Map<string, ModelProfile> = new Map();
    protected lastModelCheck = 0;

    @postConstruct()
    protected init(): void {
        this.initProfiles();
        this.refreshAvailableModels();
    }

    protected initProfiles(): void {
        // Load stored profiles (accumulated quality scores)
        const stored = this.loadProfiles();

        // Built-in profiles with defaults
        const defaults: ModelProfile[] = [
            {
                model: 'qwen2.5:7b',
                strengths: ['code-generation', 'code-review', 'debugging', 'explanation'],
                parameterSize: 7,
                isCustom: false,
                avgScore: 7.5,
                interactions: 0,
            },
            {
                model: 'weatherspoon-asi',
                strengths: ['explanation', 'motivation', 'planning', 'assessment', 'code-generation', 'code-review', 'debugging'],
                parameterSize: 7,
                isCustom: true,
                avgScore: 0,
                interactions: 0,
            },
        ];

        for (const def of defaults) {
            const saved = stored.find(s => s.model === def.model);
            this.profiles.set(def.model, saved ? { ...def, avgScore: saved.avgScore, interactions: saved.interactions } : def);
        }
    }

    /**
     * Select the best model for a given agent and prompt.
     */
    async selectModel(agentId: string, promptPreview: string): Promise<string> {
        await this.refreshAvailableModels();
        const category = this.classifyPrompt(agentId, promptPreview);
        const best = this.rankModels(category);
        console.info(`[ModelRouter] ${agentId} → category=${category} → model=${best}`);
        return best;
    }

    /**
     * Classify a prompt into a category based on agent ID and content signals.
     */
    classifyPrompt(agentId: string, prompt: string): PromptCategory {
        // Agent ID is the strongest signal
        const agentMap: Record<string, PromptCategory> = {
            'teacher-tutor': 'explanation',
            'teacher-explain': 'explanation',
            'teacher-review': 'code-review',
            'teacher-debugger': 'debugging',
            'teacher-growth-tracker': 'assessment',
            'teacher-motivator': 'motivation',
            'teacher-project-builder': 'planning',
            'teacher-strategic-planner': 'planning',
            'teacher-thinking-debugger': 'debugging',
        };
        if (agentMap[agentId]) {
            return agentMap[agentId];
        }

        // Content-based fallback
        const lower = prompt.toLowerCase();
        if (lower.includes('write') || lower.includes('create') || lower.includes('implement') || lower.includes('build')) {
            return 'code-generation';
        }
        if (lower.includes('review') || lower.includes('improve') || lower.includes('refactor')) {
            return 'code-review';
        }
        if (lower.includes('error') || lower.includes('bug') || lower.includes('fix') || lower.includes('debug')) {
            return 'debugging';
        }
        if (lower.includes('explain') || lower.includes('what is') || lower.includes('how does') || lower.includes('why')) {
            return 'explanation';
        }
        if (lower.includes('plan') || lower.includes('roadmap') || lower.includes('milestone') || lower.includes('strategy')) {
            return 'planning';
        }
        if (lower.includes('quiz') || lower.includes('test') || lower.includes('assess') || lower.includes('grade')) {
            return 'assessment';
        }

        return 'general';
    }

    /**
     * Rank available models for a category and return the best one.
     */
    protected rankModels(category: PromptCategory): string {
        const candidates: Array<{ model: string; score: number }> = [];

        for (const modelName of this.availableModels) {
            const profile = this.profiles.get(modelName);
            if (!profile) {
                // Unknown model — give it a baseline score
                candidates.push({ model: modelName, score: 5 });
                continue;
            }

            let score = profile.avgScore;

            // Strength bonus: +2 if this category is the model's top strength, +1 if in top 3
            const strengthIndex = profile.strengths.indexOf(category);
            if (strengthIndex === 0) {
                score += 2;
            } else if (strengthIndex > 0 && strengthIndex < 3) {
                score += 1;
            }

            // Custom model bonus: prefer once calibrated (>100 interactions, score >= 7)
            if (profile.isCustom && profile.interactions >= 100 && profile.avgScore >= 7.0) {
                score += 3; // Strong preference for our own model when it's proven
            }

            // Custom model penalty when uncalibrated — don't trust it yet
            if (profile.isCustom && profile.interactions < 100) {
                score -= 2;
            }

            // Parameter size as tiebreaker
            score += profile.parameterSize * 0.01;

            candidates.push({ model: modelName, score });
        }

        candidates.sort((a, b) => b.score - a.score);
        return candidates[0]?.model ?? 'qwen2.5:7b';
    }

    /**
     * Record interaction quality feedback — feeds the training loop.
     */
    recordInteraction(model: string, category: PromptCategory, qualityScore: number): void {
        const profile = this.profiles.get(model);
        if (!profile) {
            return;
        }

        // Exponential moving average of quality scores
        const alpha = 0.1; // smooth slowly
        profile.avgScore = profile.interactions === 0
            ? qualityScore
            : profile.avgScore * (1 - alpha) + qualityScore * alpha;
        profile.interactions++;

        this.saveProfiles();

        if (profile.isCustom && profile.interactions % 50 === 0) {
            console.info(
                `[ModelRouter] Custom model "${model}" milestone: ${profile.interactions} interactions, ` +
                `avgScore=${profile.avgScore.toFixed(2)} (threshold: 100 interactions + 7.0 score to become primary)`
            );
        }
    }

    /**
     * Get the custom model's readiness status.
     */
    getCustomModelStatus(): { model: string; interactions: number; avgScore: number; isPrimary: boolean } | undefined {
        for (const profile of this.profiles.values()) {
            if (profile.isCustom) {
                return {
                    model: profile.model,
                    interactions: profile.interactions,
                    avgScore: profile.avgScore,
                    isPrimary: profile.interactions >= 100 && profile.avgScore >= 7.0,
                };
            }
        }
        return undefined;
    }

    // ── Available model discovery ────────────────────────────────────

    protected async refreshAvailableModels(): Promise<void> {
        // Refresh every 30 seconds
        if (Date.now() - this.lastModelCheck < 30_000) {
            return;
        }
        try {
            const response = await fetch(`${this.host}/api/tags`, {
                signal: AbortSignal.timeout(3000),
            });
            if (response.ok) {
                const data = await response.json() as { models?: Array<{ name: string }> };
                this.availableModels = data.models?.map(m => m.name.replace(/:latest$/, '')) ?? [];
                this.lastModelCheck = Date.now();
            }
        } catch {
            // Keep last known list
        }
    }

    // ── Profile persistence ─────────────────────────────────────────

    protected profilesPath(): string {
        return path.join(os.homedir(), '.teacher', 'model-profiles.json');
    }

    protected loadProfiles(): ModelProfile[] {
        try {
            const raw = fs.readFileSync(this.profilesPath(), 'utf-8');
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    protected saveProfiles(): void {
        const dir = path.dirname(this.profilesPath());
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const profiles = [...this.profiles.values()];
        const tmp = this.profilesPath() + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(profiles, undefined, 2), 'utf-8');
        fs.renameSync(tmp, this.profilesPath());
    }
}
