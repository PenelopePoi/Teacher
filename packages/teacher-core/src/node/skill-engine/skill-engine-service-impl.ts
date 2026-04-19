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
 * Structured error returned from RPC handlers when an operation fails.
 */
interface RpcError {
    code: string;
    message: string;
    detail?: string;
}

/**
 * Wraps an async function in a try/catch that returns structured errors
 * instead of throwing uncaught exceptions across the RPC boundary.
 */
async function withErrorBoundary<T>(
    operation: string,
    fn: () => Promise<T>
): Promise<T> {
    try {
        return await fn();
    } catch (err) {
        const error: RpcError = {
            code: 'SKILL_ENGINE_ERROR',
            message: `Operation "${operation}" failed`,
            detail: err instanceof Error ? err.message : String(err),
        };
        console.error(`[SkillEngine] ${error.message}: ${error.detail}`);
        throw error;
    }
}

/**
 * Facade implementation of SkillEngineService that delegates to
 * the registry, executor, workflow runner, and auto-trigger service.
 * All RPC handlers are wrapped in error boundaries that return structured errors.
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
        return withErrorBoundary('scanSkills', () => this.registry.scanSkills());
    }

    async getAllSkills(): Promise<SkillDefinition[]> {
        return withErrorBoundary('getAllSkills', () =>
            Promise.resolve(this.registry.getAllSkills())
        );
    }

    async getSkill(name: string): Promise<SkillDefinition | undefined> {
        return withErrorBoundary('getSkill', () =>
            Promise.resolve(this.registry.getSkill(name))
        );
    }

    async searchSkills(query: string): Promise<SkillMatch[]> {
        return withErrorBoundary('searchSkills', () =>
            Promise.resolve(this.registry.searchSkills(query))
        );
    }

    async getSkillsByDomain(domain: string): Promise<SkillDefinition[]> {
        return withErrorBoundary('getSkillsByDomain', () =>
            Promise.resolve(this.registry.getSkillsByDomain(domain))
        );
    }

    async getSkillsByIntent(intent: string): Promise<SkillDefinition[]> {
        return withErrorBoundary('getSkillsByIntent', () =>
            Promise.resolve(this.registry.getSkillsByIntent(intent))
        );
    }

    // ── Execution ─────────────────────────────────────────────

    async executeSkill(name: string, input: string): Promise<SkillExecutionResult> {
        return withErrorBoundary('executeSkill', () =>
            this.executor.executeSkill(name, input)
        );
    }

    // ── Workflows ─────────────────────────────────────────────

    async getWorkflows(): Promise<WorkflowDefinition[]> {
        return withErrorBoundary('getWorkflows', () =>
            Promise.resolve(this.workflowRunner.getWorkflows())
        );
    }

    async executeWorkflow(name: string, input: string): Promise<SkillExecutionResult[]> {
        return withErrorBoundary('executeWorkflow', () =>
            this.workflowRunner.executeWorkflow(name, input)
        );
    }

    // ── Metrics ───────────────────────────────────────────────

    async getMetrics(): Promise<SkillMetrics[]> {
        return withErrorBoundary('getMetrics', () =>
            this.executor.getMetrics()
        );
    }

    async getTopSkills(limit: number): Promise<SkillMetrics[]> {
        return withErrorBoundary('getTopSkills', () =>
            this.executor.getTopSkills(limit)
        );
    }

    async getLowPerformers(threshold: number): Promise<SkillMetrics[]> {
        return withErrorBoundary('getLowPerformers', () =>
            this.executor.getLowPerformers(threshold)
        );
    }

    // ── Auto-trigger ──────────────────────────────────────────

    async getAutoTriggers(): Promise<Record<string, string[]>> {
        return withErrorBoundary('getAutoTriggers', () =>
            Promise.resolve(this.autoTriggerService.getAutoTriggers())
        );
    }
}
