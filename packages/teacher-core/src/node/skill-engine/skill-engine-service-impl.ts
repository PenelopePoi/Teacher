import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import {
    SkillEngineService,
    SkillDefinition,
    SkillMatch,
    SkillExecutionResult,
    WorkflowDefinition,
    SkillMetrics,
} from '../../common/skill-engine-protocol';
import { SkillRegistry } from './skill-registry';
import { SkillExecutor } from './skill-executor';
import { WorkflowRunner } from './workflow-runner';
import { AutoTriggerService } from './auto-trigger-service';

/**
 * Facade implementation of SkillEngineService that delegates to
 * the registry, executor, workflow runner, and auto-trigger service.
 */
@injectable()
export class SkillEngineServiceImpl implements SkillEngineService {

    @inject(SkillRegistry)
    protected readonly registry: SkillRegistry;

    @inject(SkillExecutor)
    protected readonly executor: SkillExecutor;

    @inject(WorkflowRunner)
    protected readonly workflowRunner: WorkflowRunner;

    @inject(AutoTriggerService)
    protected readonly autoTriggerService: AutoTriggerService;

    @postConstruct()
    protected init(): void {
        // Kick off an initial scan so skills are ready on startup
        this.scanSkills().then(count => {
            console.info(`[SkillEngine] Initial scan complete: ${count} skills loaded`);
        }).catch(err => {
            console.error('[SkillEngine] Initial scan failed:', err);
        });
    }

    // ── Registry ──────────────────────────────────────────────

    async scanSkills(): Promise<number> {
        return this.registry.scanSkills();
    }

    async getAllSkills(): Promise<SkillDefinition[]> {
        return this.registry.getAllSkills();
    }

    async getSkill(name: string): Promise<SkillDefinition | undefined> {
        return this.registry.getSkill(name);
    }

    async searchSkills(query: string): Promise<SkillMatch[]> {
        return this.registry.searchSkills(query);
    }

    async getSkillsByDomain(domain: string): Promise<SkillDefinition[]> {
        return this.registry.getSkillsByDomain(domain);
    }

    async getSkillsByIntent(intent: string): Promise<SkillDefinition[]> {
        return this.registry.getSkillsByIntent(intent);
    }

    // ── Execution ─────────────────────────────────────────────

    async executeSkill(name: string, input: string): Promise<SkillExecutionResult> {
        return this.executor.executeSkill(name, input);
    }

    // ── Workflows ─────────────────────────────────────────────

    async getWorkflows(): Promise<WorkflowDefinition[]> {
        return this.workflowRunner.getWorkflows();
    }

    async executeWorkflow(name: string, input: string): Promise<SkillExecutionResult[]> {
        return this.workflowRunner.executeWorkflow(name, input);
    }

    // ── Metrics ───────────────────────────────────────────────

    async getMetrics(): Promise<SkillMetrics[]> {
        return this.executor.getMetrics();
    }

    async getTopSkills(limit: number): Promise<SkillMetrics[]> {
        return this.executor.getTopSkills(limit);
    }

    async getLowPerformers(threshold: number): Promise<SkillMetrics[]> {
        return this.executor.getLowPerformers(threshold);
    }

    // ── Auto-trigger ──────────────────────────────────────────

    async getAutoTriggers(): Promise<Record<string, string[]>> {
        return this.autoTriggerService.getAutoTriggers();
    }
}
