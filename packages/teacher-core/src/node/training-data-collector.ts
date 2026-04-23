import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { PromptCategory } from '../common/model-router-protocol';
import { ModelRouter } from './model-router';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * A single training interaction — system prompt + user message + model response.
 * Stored in JSONL format for direct use with fine-tuning pipelines
 * (Axolotl, Unsloth, OpenAI fine-tuning API format).
 */
export interface TrainingRecord {
    /** ISO 8601 timestamp. */
    timestamp: string;
    /** Agent that generated this interaction. */
    agentId: string;
    /** Which model produced this response. */
    model: string;
    /** Classified prompt category. */
    category: PromptCategory;
    /** The system prompt used (truncated to 2000 chars). */
    system: string;
    /** The user's message. */
    user: string;
    /** The model's response. */
    assistant: string;
    /** Quality score (0-10). Auto-scored or human-scored. */
    score: number;
    /** Whether a human explicitly rated this (vs auto-scored). */
    humanRated: boolean;
    /** Metadata: lesson context, friction state, etc. */
    context: Record<string, unknown>;
}

/**
 * Training Data Collector — captures every agent interaction as fine-tuning data.
 *
 * Flow:
 * 1. Agent generates a response → collector.record() is called
 * 2. Record is auto-scored based on response length, code presence, etc.
 * 3. Record is appended to daily JSONL file at ~/.teacher/training/YYYY-MM-DD.jsonl
 * 4. Human can rate interactions via the Feedback Pipeline → updates score
 * 5. When enough high-quality data accumulates, export for fine-tuning
 *
 * The weatherspoon-asi model is built from this data:
 *   1. Collect 1000+ high-score (≥7) interactions
 *   2. Export as fine-tuning dataset
 *   3. Fine-tune qwen2.5:7b → weatherspoon-asi
 *   4. ModelRouter gradually shifts traffic to the custom model
 *   5. Continue collecting → continue improving → the model evolves
 */
@injectable()
export class TrainingDataCollector {

    @inject(ModelRouter)
    protected readonly router: ModelRouter;

    protected trainingDir: string = '';

    @postConstruct()
    protected init(): void {
        this.trainingDir = path.join(os.homedir(), '.teacher', 'training');
        if (!fs.existsSync(this.trainingDir)) {
            fs.mkdirSync(this.trainingDir, { recursive: true });
        }
    }

    /**
     * Record an interaction. Called after every agent response.
     */
    record(params: {
        agentId: string;
        model: string;
        category: PromptCategory;
        system: string;
        user: string;
        assistant: string;
        context?: Record<string, unknown>;
    }): void {
        const score = this.autoScore(params.assistant, params.category);
        const record: TrainingRecord = {
            timestamp: new Date().toISOString(),
            agentId: params.agentId,
            model: params.model,
            category: params.category,
            system: params.system.substring(0, 2000),
            user: params.user,
            assistant: params.assistant,
            score,
            humanRated: false,
            context: params.context ?? {},
        };

        this.appendRecord(record);

        // Feed score back to the model router
        this.router.recordInteraction(params.model, params.category, score);
    }

    /**
     * Update an existing record's score (human feedback).
     */
    rateInteraction(timestamp: string, score: number): void {
        // We don't rewrite the JSONL — instead append a correction record
        const correction: Partial<TrainingRecord> = {
            timestamp,
            score: Math.max(0, Math.min(10, score)),
            humanRated: true,
        };
        const line = JSON.stringify({ type: 'rating', ...correction });
        const filePath = this.todayFilePath();
        fs.appendFileSync(filePath, line + '\n', 'utf-8');
    }

    /**
     * Export high-quality training data for fine-tuning.
     * Returns records with score >= minScore in ChatML format.
     */
    async exportForFineTuning(minScore: number = 7.0): Promise<{ path: string; count: number }> {
        const files = this.getTrainingFiles();
        const records: TrainingRecord[] = [];
        const ratings = new Map<string, number>();

        // First pass: collect all ratings
        for (const file of files) {
            const lines = fs.readFileSync(file, 'utf-8').split('\n').filter(l => l.trim());
            for (const line of lines) {
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.type === 'rating' && parsed.humanRated) {
                        ratings.set(parsed.timestamp, parsed.score);
                    }
                } catch { /* skip malformed */ }
            }
        }

        // Second pass: collect records with final scores
        for (const file of files) {
            const lines = fs.readFileSync(file, 'utf-8').split('\n').filter(l => l.trim());
            for (const line of lines) {
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.type === 'rating') {
                        continue;
                    }
                    // Apply human rating if available
                    const finalScore = ratings.get(parsed.timestamp) ?? parsed.score;
                    if (finalScore >= minScore) {
                        records.push({ ...parsed, score: finalScore });
                    }
                } catch { /* skip malformed */ }
            }
        }

        // Export as ChatML JSONL (Axolotl/Unsloth format)
        const exportPath = path.join(this.trainingDir, `export-${Date.now()}.jsonl`);
        const exportLines = records.map(r => JSON.stringify({
            conversations: [
                { role: 'system', content: r.system },
                { role: 'user', content: r.user },
                { role: 'assistant', content: r.assistant },
            ],
            metadata: {
                agent: r.agentId,
                category: r.category,
                score: r.score,
                source_model: r.model,
            },
        }));
        fs.writeFileSync(exportPath, exportLines.join('\n'), 'utf-8');

        console.info(`[TrainingCollector] Exported ${records.length} records (score ≥ ${minScore}) to ${exportPath}`);
        return { path: exportPath, count: records.length };
    }

    /**
     * Get training stats.
     */
    getStats(): { totalRecords: number; highQualityRecords: number; humanRated: number; oldestDate: string; newestDate: string } {
        const files = this.getTrainingFiles();
        let total = 0;
        let highQuality = 0;
        let humanRated = 0;
        let oldest = '';
        let newest = '';

        for (const file of files) {
            const lines = fs.readFileSync(file, 'utf-8').split('\n').filter(l => l.trim());
            for (const line of lines) {
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.type === 'rating') {
                        humanRated++;
                        continue;
                    }
                    total++;
                    if (parsed.score >= 7) {
                        highQuality++;
                    }
                    if (!oldest || parsed.timestamp < oldest) {
                        oldest = parsed.timestamp;
                    }
                    if (!newest || parsed.timestamp > newest) {
                        newest = parsed.timestamp;
                    }
                } catch { /* skip */ }
            }
        }

        return { totalRecords: total, highQualityRecords: highQuality, humanRated, oldestDate: oldest, newestDate: newest };
    }

    // ── Auto-scoring heuristics ─────────────────────────────────────

    protected autoScore(response: string, category: PromptCategory): number {
        let score = 5.0; // baseline

        // Length quality (too short = low quality, sweet spot = 200-1500 chars)
        const len = response.length;
        if (len < 50) {
            score -= 3;
        } else if (len < 100) {
            score -= 1;
        } else if (len >= 200 && len <= 1500) {
            score += 1;
        } else if (len > 3000) {
            score -= 0.5; // possibly over-verbose
        }

        // Code presence for code-related categories
        if (['code-generation', 'code-review', 'debugging'].includes(category)) {
            if (response.includes('```')) {
                score += 1.5; // has code blocks
            } else {
                score -= 1; // code category but no code
            }
        }

        // Structure indicators
        if (response.includes('**') || response.includes('##') || response.includes('- ')) {
            score += 0.5; // well-formatted
        }

        // Explanation quality signals
        if (['explanation', 'motivation'].includes(category)) {
            if (response.includes('because') || response.includes('reason') || response.includes('why')) {
                score += 0.5; // explains reasoning
            }
            if (response.includes('example') || response.includes('for instance') || response.includes('like')) {
                score += 0.5; // uses examples
            }
        }

        // Anti-patterns
        if (response.includes('As an AI') || response.includes('I cannot') || response.includes('I apologize')) {
            score -= 2; // AI slop
        }

        return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
    }

    // ── File management ─────────────────────────────────────────────

    protected todayFilePath(): string {
        const date = new Date().toISOString().split('T')[0];
        return path.join(this.trainingDir, `${date}.jsonl`);
    }

    protected appendRecord(record: TrainingRecord): void {
        const line = JSON.stringify(record);
        fs.appendFileSync(this.todayFilePath(), line + '\n', 'utf-8');
    }

    protected getTrainingFiles(): string[] {
        try {
            return fs.readdirSync(this.trainingDir)
                .filter(f => f.endsWith('.jsonl') && !f.startsWith('export-'))
                .map(f => path.join(this.trainingDir, f))
                .sort();
        } catch {
            return [];
        }
    }
}
