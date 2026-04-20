import { ReactWidget } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';
import { SkillEngineService, SkillExecutionResult } from '../../common/skill-engine-protocol';

/**
 * Skill Command Panel — command-palette-style skill launcher.
 *
 * The primary way users search, browse, and invoke skills
 * from the 343-skill library.
 */

type SkillDomain = 'meta' | 'security' | 'creativity' | 'business' | 'engineering' | 'education';
type SkillIntent = 'analyze' | 'generate' | 'audit' | 'transform' | 'teach' | 'guard' | 'compose';

interface SkillEntry {
    readonly name: string;
    readonly domain: SkillDomain | string;
    readonly intent: SkillIntent | string;
    readonly description: string;
    readonly content: string;
}

const DEMO_SKILLS: SkillEntry[] = [
    { name: 'quality-loop', domain: 'meta', intent: 'analyze', description: 'Evaluator-optimizer pattern — generate, critique, refine', content: 'Implements the evaluator-optimizer loop from Anthropic\'s agent architecture. Generates output, scores it against criteria, feeds the delta back into the generator until quality threshold is met.' },
    { name: 'simplify', domain: 'meta', intent: 'transform', description: 'Review changed code for reuse, quality, and efficiency', content: 'Scans modified files for unnecessary complexity, duplicated logic, and missed abstraction opportunities. Suggests concrete refactors that reduce line count while preserving semantics.' },
    { name: 'anti-ai-language', domain: 'meta', intent: 'transform', description: 'Detect and remove AI-sounding language from text', content: 'Identifies and replaces AI-typical patterns: "delve", "utilize", "it\'s important to note", hedging phrases, and over-structured formatting. Outputs natural human-sounding prose.' },
    { name: 'cognitive-load-guard', domain: 'meta', intent: 'guard', description: 'Protect operator from compensatory task accumulation', content: 'Monitors cognitive load indicators in the conversation. Flags when task complexity exceeds safe thresholds and suggests decomposition strategies.' },
    { name: 'honest-mirror', domain: 'meta', intent: 'analyze', description: 'Anti-yes-man protocol — support vision, correct gently', content: 'Balances encouragement with truth-telling. Identifies when a plan has structural flaws and delivers feedback that respects the user\'s autonomy while preventing costly mistakes.' },
    { name: 'web-vuln-audit', domain: 'security', intent: 'audit', description: 'Audit code for web vulnerabilities — XSS, SSRF, SQLi', content: 'Systematic code review using CTBB podcast techniques. Checks for injection points, authentication bypasses, IDOR, CSRF, and misconfigured CORS policies.' },
    { name: 'supply-chain-audit', domain: 'security', intent: 'audit', description: 'Detect slopsquatting, dependency confusion, typosquatting', content: 'Analyzes package manifests for known-malicious packages, suspicious version pinning, and dependency confusion attack vectors. Cross-references with threat intelligence feeds.' },
    { name: 'threat-model', domain: 'security', intent: 'analyze', description: 'STRIDE threat modeling for applications and systems', content: 'Walks through Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege for each component in the system architecture.' },
    { name: 'api-pentest', domain: 'security', intent: 'audit', description: 'API security testing — REST, GraphQL, gRPC, WebSocket', content: 'Tests authentication, authorization, rate limiting, input validation, and business logic flaws across API endpoints. Generates proof-of-concept exploits for confirmed vulnerabilities.' },
    { name: 'music-prompt-engineer', domain: 'creativity', intent: 'generate', description: 'Craft optimized prompts for AI music generation', content: 'Translates musical intent into structured prompts for Suno, Udio, and other generative music platforms. Captures genre, tempo, mood, instrumentation, and vocal characteristics.' },
    { name: 'constraint-designer', domain: 'creativity', intent: 'compose', description: 'Propose tightest useful constraint set for creative goals', content: 'Analyzes a creative objective and designs constraints that channel creativity rather than limiting it. Based on the principle that constraints breed innovation.' },
    { name: 'creativity-spectrum-classifier', domain: 'creativity', intent: 'analyze', description: 'Place output on interpolation-to-extrapolation spectrum', content: 'Classifies creative output as interpolative (recombining known patterns), boundary-pushing (extending known patterns), or extrapolative (generating genuinely novel patterns).' },
    { name: 'xela-brand-voice', domain: 'business', intent: 'generate', description: 'XELA Creative Branding Studio brand voice guidelines', content: 'Premium, confident, warm, Florida-rooted brand voice. Guides all client-facing communications, proposals, and marketing materials for XELA Creative Branding Studio.' },
    { name: 'proposal-generator', domain: 'business', intent: 'generate', description: 'Generate branded client proposals — scope, pricing, timeline', content: 'Creates professional branding proposals with service tiers, deliverable timelines, pricing breakdowns, and add-on options. Uses XELA brand templates and voice.' },
    { name: 'client-onboarding', domain: 'business', intent: 'teach', description: 'Guide new branding clients through intake process', content: 'Structured intake workflow: collect business info, brand aspirations, competitor analysis, target audience, and deliverable preferences. Produces a creative brief.' },
    { name: 'firebase-ops', domain: 'engineering', intent: 'audit', description: 'Firebase operational management for React/Vite apps', content: 'Manages Firestore schema design, security rules, Cloud Functions deployment, hosting configuration, and performance monitoring for Firebase-backed applications.' },
    { name: 'concurrency-audit', domain: 'engineering', intent: 'audit', description: 'Audit code for race conditions, deadlocks, TOCTOU', content: 'Identifies concurrency bugs including race conditions, deadlocks, livelocks, TOCTOU vulnerabilities, and thread-safety violations in multi-threaded or async code.' },
    { name: 'learning-teaching-suite', domain: 'education', intent: 'teach', description: 'Design accelerated learning experiences and curricula', content: 'Creates structured learning paths with adaptive difficulty, spaced repetition, and mastery gates. Supports multiple learning modalities and tracks progress metrics.' },
    { name: 'teacherbaby-core', domain: 'education', intent: 'teach', description: 'Pedagogical engine for TeacherBaby platform', content: 'Child-teaches-AI education model. The learner explains concepts to the AI, which asks clarifying questions that reveal gaps in understanding. Socratic method in reverse.' },
    { name: 'ask-interview', domain: 'education', intent: 'analyze', description: 'Interview mode — Claude asks you questions to build context', content: 'Flips the interaction model: Claude interviews the user with targeted questions to gather requirements, context, and constraints before generating any output.' },
];

type FilterCategory = 'all' | SkillDomain;

@injectable()
export class SkillCommandWidget extends ReactWidget {

    static readonly ID = 'teacher-skill-command';
    static readonly LABEL = nls.localize('theia/teacher/skillCommand', 'Skill Launcher');

    @inject(SkillEngineService)
    protected readonly skillEngine: SkillEngineService;

    protected searchQuery: string = '';
    protected activeFilter: FilterCategory = 'all';
    protected selectedIndex: number = 0;
    protected expandedSkill: string | null = null;
    protected skills: SkillEntry[] = DEMO_SKILLS;
    protected isLoading: boolean = true;
    protected lastExecution: SkillExecutionResult | undefined;
    protected executionError: string | undefined;
    protected executingSkill: string | undefined;

    @postConstruct()
    protected init(): void {
        this.id = SkillCommandWidget.ID;
        this.title.label = SkillCommandWidget.LABEL;
        this.title.caption = SkillCommandWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-rocket';
        this.addClass('teacher-skill-command');
        this.loadSkills();
    }

    protected async loadSkills(): Promise<void> {
        try {
            const defs = await this.skillEngine.getAllSkills();
            if (defs && defs.length > 0) {
                this.skills = defs.map(d => ({
                    name: d.name,
                    domain: d.domain ?? 'meta',
                    intent: d.intent ?? 'analyze',
                    description: d.description || '',
                    content: d.content || '',
                }));
            }
        } catch (err) {
            console.warn('[SkillCommandWidget] Falling back to demo skills:', err);
        } finally {
            this.isLoading = false;
            this.update();
        }
    }

    protected getFilteredSkills = (): SkillEntry[] => {
        let skills = this.skills;
        if (this.activeFilter !== 'all') {
            skills = skills.filter(s => s.domain === this.activeFilter);
        }
        if (this.searchQuery.trim()) {
            const q = this.searchQuery.toLowerCase();
            skills = skills.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.description.toLowerCase().includes(q) ||
                s.domain.toLowerCase().includes(q)
            );
        }
        return skills;
    };

    protected handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.searchQuery = e.target.value;
        this.selectedIndex = 0;
        this.update();
    };

    protected handleFilterClick = (filter: FilterCategory): void => {
        this.activeFilter = filter;
        this.selectedIndex = 0;
        this.update();
    };

    protected handleSkillClick = (skillName: string): void => {
        this.expandedSkill = this.expandedSkill === skillName ? null : skillName;
        this.update();
    };

    protected handleExecute = async (skill: SkillEntry): Promise<void> => {
        this.executingSkill = skill.name;
        this.executionError = undefined;
        this.update();
        try {
            this.lastExecution = await this.skillEngine.executeSkill(skill.name, this.searchQuery);
        } catch (err) {
            this.lastExecution = undefined;
            this.executionError = err instanceof Error ? err.message : String(err);
        } finally {
            this.executingSkill = undefined;
            this.update();
        }
    };

    protected handleAddToWorkflow = (skill: SkillEntry): void => {
        console.log(`[Skill Engine] Adding to workflow: ${skill.name}`);
    };

    protected handleKeyDown = (e: React.KeyboardEvent): void => {
        const filtered = this.getFilteredSkills();
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = Math.min(this.selectedIndex + 1, filtered.length - 1);
            this.update();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
            this.update();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered[this.selectedIndex]) {
                this.handleExecute(filtered[this.selectedIndex]);
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (filtered[this.selectedIndex]) {
                this.handleSkillClick(filtered[this.selectedIndex].name);
            }
        }
    };

    protected render(): React.ReactNode {
        const filtered = this.getFilteredSkills();
        const filters: Array<{ key: FilterCategory; label: string }> = [
            { key: 'all', label: nls.localize('theia/teacher/filterAll', 'All') },
            { key: 'meta', label: nls.localize('theia/teacher/filterMeta', 'Meta') },
            { key: 'security', label: nls.localize('theia/teacher/filterSecurity', 'Security') },
            { key: 'creativity', label: nls.localize('theia/teacher/filterCreativity', 'Creativity') },
            { key: 'business', label: nls.localize('theia/teacher/filterBusiness', 'Business') },
            { key: 'engineering', label: nls.localize('theia/teacher/filterEngineering', 'Engineering') },
            { key: 'education', label: nls.localize('theia/teacher/filterEducation', 'Education') },
        ];

        return (
            <div className='teacher-skill-command-container' onKeyDown={this.handleKeyDown}>
                <div className='teacher-skill-command-search'>
                    <i className='codicon codicon-search teacher-skill-command-search-icon' />
                    <input
                        type='text'
                        className='teacher-skill-command-search-input'
                        placeholder={this.isLoading
                            ? nls.localize('theia/teacher/skillSearchLoading', 'Loading skills...')
                            : nls.localize('theia/teacher/skillSearchPlaceholder', 'Search {0} skills...', this.skills.length)}
                        value={this.searchQuery}
                        onChange={this.handleSearchChange}
                    />
                </div>

                {(this.lastExecution || this.executionError) && (
                    <div className='teacher-skill-command-execution'>
                        {this.executionError ? (
                            <div className='teacher-skill-command-execution-error'>
                                <i className='codicon codicon-error' /> {this.executionError}
                            </div>
                        ) : this.lastExecution && (
                            <div className='teacher-skill-command-execution-result'>
                                <div className='teacher-skill-command-execution-header'>
                                    <i className='codicon codicon-check' />
                                    <span>{nls.localize('theia/teacher/skillExecuted', 'Executed {0}', this.lastExecution.skillName)}</span>
                                    <span className='teacher-skill-command-execution-meta'>
                                        {this.lastExecution.duration}ms · score {this.lastExecution.score.toFixed(1)}
                                    </span>
                                </div>
                                <pre className='teacher-skill-command-execution-output'>{this.lastExecution.output}</pre>
                            </div>
                        )}
                    </div>
                )}

                <div className='teacher-skill-command-filters'>
                    {filters.map(f => (
                        <button
                            key={f.key}
                            type='button'
                            className={`teacher-skill-command-chip ${this.activeFilter === f.key ? 'teacher-skill-command-chip--active' : ''} teacher-skill-command-chip--${f.key}`}
                            onClick={() => this.handleFilterClick(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className='teacher-skill-command-results'>
                    {filtered.map((skill, i) => (
                        <div
                            key={skill.name}
                            className={`teacher-skill-command-card teacher-skill-command-card--${skill.domain} ${i === this.selectedIndex ? 'teacher-skill-command-card--selected' : ''}`}
                        >
                            <div
                                className='teacher-skill-command-card-header'
                                onClick={() => this.handleSkillClick(skill.name)}
                            >
                                <span className='teacher-skill-command-card-name'>{skill.name}</span>
                                <span className={`teacher-skill-command-domain-badge teacher-skill-command-domain-badge--${skill.domain}`}>
                                    {skill.domain}
                                </span>
                                <span className='teacher-skill-command-intent-badge'>
                                    {skill.intent}
                                </span>
                                <span className='teacher-skill-command-card-desc'>{skill.description}</span>
                            </div>

                            {this.expandedSkill === skill.name && (
                                <div className='teacher-skill-command-card-expanded'>
                                    <p className='teacher-skill-command-card-content'>{skill.content}</p>
                                    <div className='teacher-skill-command-card-actions'>
                                        <button
                                            type='button'
                                            className='teacher-skill-command-btn teacher-skill-command-btn--execute'
                                            onClick={() => this.handleExecute(skill)}
                                            disabled={this.executingSkill === skill.name}
                                        >
                                            <i className={`codicon ${this.executingSkill === skill.name ? 'codicon-loading codicon-modifier-spin' : 'codicon-play'}`} />
                                            {this.executingSkill === skill.name
                                                ? nls.localize('theia/teacher/skillExecuting', 'Executing...')
                                                : nls.localize('theia/teacher/skillExecute', 'Execute')}
                                        </button>
                                        <button
                                            type='button'
                                            className='teacher-skill-command-btn teacher-skill-command-btn--workflow'
                                            onClick={() => this.handleAddToWorkflow(skill)}
                                        >
                                            <i className='codicon codicon-git-merge' />
                                            {nls.localize('theia/teacher/skillAddToWorkflow', 'Add to Workflow')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className='teacher-skill-command-empty'>
                            <i className='codicon codicon-search' />
                            {nls.localize('theia/teacher/skillNoResults', 'No skills match your search.')}
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
