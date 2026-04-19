/** Service path for the Skill Engine backend service. */
export const SKILL_ENGINE_PATH = '/services/skill-engine';

/** Symbol for dependency injection of the SkillEngineService. */
export const SkillEngineService = Symbol('SkillEngineService');

/**
 * Parsed representation of a single SKILL.md file.
 */
export interface SkillDefinition {
    /** Skill name from frontmatter (e.g. "quality-loop"). */
    name: string;
    /** Human-readable description from frontmatter. */
    description: string;
    /** Skill intent: analyze | generate | classify | evaluate | transform | extract. */
    intent?: string;
    /** Domain: meta | security | creativity | business | engineering | education | health | ethics. */
    domain?: string;
    /** Lifecycle stage: stable | experimental | deprecated. */
    lifecycle?: string;
    /** Semantic version string. */
    version?: string;
    /** Bloom's taxonomy level: Remember | Understand | Apply | Analyze | Evaluate | Create. */
    bloomLevel?: string;
    /** Skill type (e.g. "skill", "suite", "bundle"). */
    type?: string;
    /** Hint for the argument expected by this skill. */
    argumentHint?: string;
    /** Tools this skill is allowed to use. */
    allowedTools?: string[];
    /** Absolute path to the SKILL.md file on disk. */
    filePath: string;
    /** Full markdown body (everything after the second ---). */
    content: string;
    /** Trigger phrases extracted from the description field. */
    triggers: string[];
}

/**
 * A skill matched against a search query, with relevance score.
 */
export interface SkillMatch {
    /** The matched skill definition. */
    skill: SkillDefinition;
    /** Relevance score from 0 (no match) to 1 (perfect match). */
    score: number;
    /** The trigger phrase or term that caused the match. */
    matchedTrigger: string;
}

/**
 * Result of executing a single skill against user input.
 */
export interface SkillExecutionResult {
    /** Name of the skill that was executed. */
    skillName: string;
    /** The user-supplied input text. */
    input: string;
    /** The skill content formatted for agent injection. */
    output: string;
    /** Quality score from 0 to 10 (defaults to 7.0 until rated). */
    score: number;
    /** Execution duration in milliseconds. */
    duration: number;
    /** ISO 8601 timestamp of execution. */
    timestamp: string;
}

/**
 * A single step in a multi-skill workflow.
 */
export interface WorkflowStep {
    /** Name of the skill to execute at this step. */
    skillName: string;
    /** Override input; otherwise uses the previous step's output. */
    input?: string;
    /** Skip this step if the condition string is not met. */
    condition?: string;
}

/**
 * A named workflow composed of sequential skill steps.
 */
export interface WorkflowDefinition {
    /** Unique workflow name. */
    name: string;
    /** Human-readable description. */
    description: string;
    /** Ordered list of skill steps. */
    steps: WorkflowStep[];
    /** IDE event that auto-triggers this workflow. */
    autoTrigger?: string;
}

/**
 * Aggregated execution metrics for a single skill.
 */
export interface SkillMetrics {
    /** Skill name. */
    skillName: string;
    /** Total number of executions. */
    executionCount: number;
    /** Average quality score across all executions. */
    avgScore: number;
    /** ISO 8601 timestamp of the most recent execution. */
    lastUsed: string;
    /** Fraction of executions that scored >= 5.0 (0.0 to 1.0). */
    successRate: number;
}

/**
 * Core service for discovering, executing, and managing SKILL.md files
 * as first-class IDE citizens.
 */
export interface SkillEngineService {
    // ── Registry ──────────────────────────────────────────────
    /** Scan the skills directory and return the count of discovered skills. */
    scanSkills(): Promise<number>;
    /** Return all registered skill definitions. */
    getAllSkills(): Promise<SkillDefinition[]>;
    /** Look up a single skill by name. */
    getSkill(name: string): Promise<SkillDefinition | undefined>;
    /** Fuzzy-search skills by query string. */
    searchSkills(query: string): Promise<SkillMatch[]>;
    /** Return all skills in a given domain. */
    getSkillsByDomain(domain: string): Promise<SkillDefinition[]>;
    /** Return all skills with a given intent. */
    getSkillsByIntent(intent: string): Promise<SkillDefinition[]>;

    // ── Execution ─────────────────────────────────────────────
    /** Execute a skill by name with the given input text. */
    executeSkill(name: string, input: string): Promise<SkillExecutionResult>;

    // ── Workflows ─────────────────────────────────────────────
    /** Return all registered workflow definitions. */
    getWorkflows(): Promise<WorkflowDefinition[]>;
    /** Execute a named workflow with the given initial input. */
    executeWorkflow(name: string, input: string): Promise<SkillExecutionResult[]>;

    // ── Metrics ───────────────────────────────────────────────
    /** Return metrics for all executed skills. */
    getMetrics(): Promise<SkillMetrics[]>;
    /** Return the top N skills by execution count. */
    getTopSkills(limit: number): Promise<SkillMetrics[]>;
    /** Return skills whose average score is below the given threshold. */
    getLowPerformers(threshold: number): Promise<SkillMetrics[]>;

    // ── Auto-trigger ──────────────────────────────────────────
    /** Return a map of IDE event names to the skill names they trigger. */
    getAutoTriggers(): Promise<Record<string, string[]>>;
}
