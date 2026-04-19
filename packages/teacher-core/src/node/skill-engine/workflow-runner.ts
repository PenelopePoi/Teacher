import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkflowDefinition, SkillExecutionResult } from '../../common/skill-engine-protocol';
import { SkillExecutor } from './skill-executor';

/**
 * Built-in workflow definitions that chain multiple skills together.
 */
const BUILT_IN_WORKFLOWS: WorkflowDefinition[] = [
    {
        name: 'code-review-pipeline',
        description: 'Full code review: quality check → simplify → remove AI language',
        steps: [
            { skillName: 'quality-loop' },
            { skillName: 'simplify' },
            { skillName: 'anti-ai-language' },
        ],
        autoTrigger: 'pre-commit',
    },
    {
        name: 'learning-session',
        description: 'Structured learning: assess level → teach → evaluate understanding',
        steps: [
            { skillName: 'ask-interview' },
            { skillName: 'learning-teaching-suite' },
            { skillName: 'portable-debrief' },
        ],
    },
    {
        name: 'security-audit',
        description: 'Security review pipeline: scan → audit → report',
        steps: [
            { skillName: 'web-vuln-audit' },
            { skillName: 'supply-chain-audit' },
            { skillName: 'report-writer' },
        ],
    },
    {
        name: 'brand-package',
        description: 'Full branding workflow: voice → package → check consistency',
        steps: [
            { skillName: 'xela-brand-voice' },
            { skillName: 'brand-package-creator' },
            { skillName: 'xela-brand-checker' },
        ],
    },
    {
        name: 'self-improvement',
        description: 'Meta-improvement: evaluate skills → identify weak ones → improve them',
        steps: [
            { skillName: 'skill-metrics' },
            { skillName: 'skill-improve' },
            { skillName: 'skill-quality-gate' },
        ],
        autoTrigger: 'daily',
    },
    {
        name: 'session-start',
        description: 'Morning routine: briefing → timeline alignment → energy check',
        steps: [
            { skillName: 'morning-briefing' },
            { skillName: 'best-timeline-aligner' },
            { skillName: 'energy-state-reader' },
        ],
        autoTrigger: 'session-start',
    },
    {
        name: 'morning-learning',
        description: 'Morning learning flow: read energy → set daily objective → structured learning',
        steps: [
            { skillName: 'energy-state-reader' },
            { skillName: 'best-timeline-aligner' },
            { skillName: 'learning-teaching-suite' },
        ],
    },
    {
        name: 'project-kickoff',
        description: 'New project setup: interview for requirements → design constraints → scaffold',
        steps: [
            { skillName: 'ask-interview' },
            { skillName: 'constraint-designer' },
            { skillName: 'firebase-ops' },
        ],
    },
    {
        name: 'music-production',
        description: 'Music production pipeline: craft prompts → generate brand audio → master for release',
        steps: [
            { skillName: 'music-prompt-engineer' },
            { skillName: 'suno-brand-audio' },
            { skillName: 'album-mastering' },
        ],
    },
    {
        name: 'grant-application',
        description: 'Grant writing pipeline: draft application → remove AI language → generate proposal',
        steps: [
            { skillName: 'grant-writing' },
            { skillName: 'anti-ai-language' },
            { skillName: 'proposal-generator' },
        ],
    },
];

/**
 * Executes multi-step workflows by chaining skill executions sequentially,
 * passing each step's output as the next step's input.
 */
@injectable()
export class WorkflowRunner {

    @inject(SkillExecutor)
    protected readonly executor: SkillExecutor;

    /** All available workflows (built-in + any dynamically added). */
    protected readonly workflows: Map<string, WorkflowDefinition> = new Map();

    constructor() {
        for (const wf of BUILT_IN_WORKFLOWS) {
            this.workflows.set(wf.name, wf);
        }
    }

    /**
     * Return all registered workflow definitions.
     */
    getWorkflows(): WorkflowDefinition[] {
        return Array.from(this.workflows.values());
    }

    /**
     * Look up a single workflow by name.
     */
    getWorkflow(name: string): WorkflowDefinition | undefined {
        return this.workflows.get(name);
    }

    /**
     * Execute a named workflow with an initial input string.
     * Each step runs sequentially; the output of step N becomes the input of step N+1
     * unless the step has an explicit input override.
     */
    async executeWorkflow(name: string, input: string): Promise<SkillExecutionResult[]> {
        const workflow = this.workflows.get(name);
        if (!workflow) {
            console.warn(`[WorkflowRunner] Workflow "${name}" not found`);
            return [];
        }

        console.info(`[WorkflowRunner] Starting workflow "${name}" with ${workflow.steps.length} steps`);

        const results: SkillExecutionResult[] = [];
        let currentInput = input;

        for (const step of workflow.steps) {
            // Check condition (simple truthy string check)
            if (step.condition) {
                const conditionMet = this.evaluateCondition(step.condition, currentInput, results);
                if (!conditionMet) {
                    console.info(`[WorkflowRunner] Skipping step "${step.skillName}" — condition not met: ${step.condition}`);
                    continue;
                }
            }

            const stepInput = step.input || currentInput;
            const result = await this.executor.executeSkill(step.skillName, stepInput);
            results.push(result);

            // Feed this step's output into the next step
            currentInput = result.output;
        }

        console.info(`[WorkflowRunner] Completed workflow "${name}": ${results.length} steps executed`);
        return results;
    }

    /**
     * Register a custom workflow definition.
     */
    registerWorkflow(workflow: WorkflowDefinition): void {
        this.workflows.set(workflow.name, workflow);
        console.info(`[WorkflowRunner] Registered workflow "${workflow.name}"`);
    }

    /**
     * Evaluate a simple condition string.
     * Currently supports checking if a keyword appears in the current input
     * or if the previous step scored above a threshold.
     */
    protected evaluateCondition(
        condition: string,
        currentInput: string,
        previousResults: SkillExecutionResult[]
    ): boolean {
        // "score > N" — check if the last result scored above N
        const scoreMatch = condition.match(/^score\s*>\s*(\d+(?:\.\d+)?)$/);
        if (scoreMatch) {
            const threshold = parseFloat(scoreMatch[1]);
            const lastResult = previousResults[previousResults.length - 1];
            return lastResult ? lastResult.score > threshold : false;
        }

        // "contains:KEYWORD" — check if keyword is in current input
        const containsMatch = condition.match(/^contains:(.+)$/);
        if (containsMatch) {
            return currentInput.toLowerCase().includes(containsMatch[1].toLowerCase().trim());
        }

        // Default: treat as truthy (non-empty string = run the step)
        return true;
    }
}
