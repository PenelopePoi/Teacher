import { inject, injectable } from '@theia/core/shared/inversify';
import * as fs from 'fs';
import * as path from 'path';
import { SkillExecutionResult, SkillMetrics } from '../../common/skill-engine-protocol';
import { SkillRegistry } from './skill-registry';

/** Shape of a single metric record stored in the JSON file. */
interface MetricRecord {
    skillName: string;
    executionCount: number;
    totalScore: number;
    successCount: number;
    lastUsed: string;
}

/**
 * Executes skills by formatting their content for AI agent injection
 * and tracks execution metrics to a persistent JSON file.
 */
@injectable()
export class SkillExecutor {

    @inject(SkillRegistry)
    protected readonly registry: SkillRegistry;

    /** In-memory metrics cache (flushed to disk on each execution). */
    protected metrics: Map<string, MetricRecord> = new Map();

    /** Path to the metrics JSON file. */
    protected metricsPath: string = path.join(
        process.env.HOME || '~', '.claude', 'skills', '_metrics', 'metrics.json'
    );

    /** Whether metrics have been loaded from disk. */
    protected metricsLoaded: boolean = false;

    /**
     * Execute a skill by name with user input.
     * Returns the skill content formatted for agent system-prompt injection.
     */
    async executeSkill(name: string, input: string): Promise<SkillExecutionResult> {
        const startTime = Date.now();
        const skill = this.registry.getSkill(name);

        if (!skill) {
            return {
                skillName: name,
                input,
                output: `[SkillExecutor] Skill "${name}" not found in registry.`,
                score: 0,
                duration: Date.now() - startTime,
                timestamp: new Date().toISOString(),
            };
        }

        // Format the skill content for agent injection
        const output = this.formatForInjection(skill.name, skill.description, skill.content, input);
        const duration = Date.now() - startTime;
        const timestamp = new Date().toISOString();
        const defaultScore = 7.0;

        // Track metrics
        this.recordExecution(name, defaultScore);

        // Warn if execution took longer than 10 seconds
        if (duration > 10_000) {
            console.warn(
                `[SkillExecutor] SLOW SKILL: "${name}" took ${duration}ms (>${Math.round(duration / 1000)}s). ` +
                'Consider optimizing this skill or splitting it into smaller steps.'
            );
        }

        console.info(`[SkillExecutor] Executed "${name}" in ${duration}ms`);

        return {
            skillName: name,
            input,
            output,
            score: defaultScore,
            duration,
            timestamp,
        };
    }

    /**
     * Return aggregated metrics for all executed skills.
     */
    async getMetrics(): Promise<SkillMetrics[]> {
        this.loadMetricsIfNeeded();
        return Array.from(this.metrics.values()).map(r => this.toSkillMetrics(r));
    }

    /**
     * Return the top N skills by execution count.
     */
    async getTopSkills(limit: number): Promise<SkillMetrics[]> {
        const all = await this.getMetrics();
        return all
            .sort((a, b) => b.executionCount - a.executionCount)
            .slice(0, limit);
    }

    /**
     * Return skills whose average score falls below the threshold.
     */
    async getLowPerformers(threshold: number): Promise<SkillMetrics[]> {
        const all = await this.getMetrics();
        return all.filter(m => m.avgScore < threshold);
    }

    /**
     * Format skill content for injection into an AI agent's system prompt.
     */
    protected formatForInjection(name: string, description: string, content: string, input: string): string {
        return [
            `<skill name="${name}">`,
            `<description>${description}</description>`,
            `<instructions>`,
            content,
            `</instructions>`,
            `<user-input>${input}</user-input>`,
            `</skill>`,
        ].join('\n');
    }

    /**
     * Record a single execution in the metrics store and flush to disk.
     */
    protected recordExecution(skillName: string, score: number): void {
        this.loadMetricsIfNeeded();

        const existing = this.metrics.get(skillName) || {
            skillName,
            executionCount: 0,
            totalScore: 0,
            successCount: 0,
            lastUsed: '',
        };

        existing.executionCount++;
        existing.totalScore += score;
        existing.lastUsed = new Date().toISOString();
        if (score >= 5.0) {
            existing.successCount++;
        }

        this.metrics.set(skillName, existing);
        this.flushMetrics();
    }

    /**
     * Convert an internal MetricRecord to the public SkillMetrics interface.
     */
    protected toSkillMetrics(record: MetricRecord): SkillMetrics {
        return {
            skillName: record.skillName,
            executionCount: record.executionCount,
            avgScore: record.executionCount > 0
                ? record.totalScore / record.executionCount
                : 0,
            lastUsed: record.lastUsed,
            successRate: record.executionCount > 0
                ? record.successCount / record.executionCount
                : 0,
        };
    }

    /**
     * Load metrics from the JSON file on disk (once).
     */
    protected loadMetricsIfNeeded(): void {
        if (this.metricsLoaded) {
            return;
        }
        this.metricsLoaded = true;

        try {
            if (fs.existsSync(this.metricsPath)) {
                const raw = fs.readFileSync(this.metricsPath, 'utf-8');
                const records: MetricRecord[] = JSON.parse(raw);
                for (const record of records) {
                    this.metrics.set(record.skillName, record);
                }
                console.info(`[SkillExecutor] Loaded ${records.length} metric records from disk`);
            }
        } catch (err) {
            console.warn('[SkillExecutor] Could not load metrics file:', err);
        }
    }

    /**
     * Flush the in-memory metrics to the JSON file on disk.
     */
    protected flushMetrics(): void {
        try {
            const dir = path.dirname(this.metricsPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const data = JSON.stringify(Array.from(this.metrics.values()), undefined, 2);
            fs.writeFileSync(this.metricsPath, data, 'utf-8');
        } catch (err) {
            console.warn('[SkillExecutor] Could not write metrics file:', err);
        }
    }
}
