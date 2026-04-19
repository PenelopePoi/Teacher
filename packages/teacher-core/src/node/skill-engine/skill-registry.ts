import { injectable, postConstruct } from '@theia/core/shared/inversify';
import * as fs from 'fs';
import * as path from 'path';
import { SkillDefinition, SkillMatch } from '../../common/skill-engine-protocol';
import { SkillParser } from './skill-parser';

/**
 * In-memory registry of all discovered SKILL.md definitions.
 * Scans the skills directory recursively, indexes by name/domain/intent,
 * and watches for file-system changes to stay current.
 */
@injectable()
export class SkillRegistry {

    protected readonly parser: SkillParser = new SkillParser();

    /** Primary index: skill name → definition. */
    protected readonly byName: Map<string, SkillDefinition> = new Map();
    /** Secondary index: domain → skill names. */
    protected readonly byDomain: Map<string, Set<string>> = new Map();
    /** Secondary index: intent → skill names. */
    protected readonly byIntent: Map<string, Set<string>> = new Map();

    /** Active fs.watch handle, if any. */
    protected watcher: fs.FSWatcher | undefined;

    /** The root directory to scan for SKILL.md files. */
    protected skillsDir: string = path.join(process.env.HOME || '~', '.claude', 'skills');

    @postConstruct()
    protected init(): void {
        // Initial scan happens lazily on first call to scanSkills()
    }

    /**
     * Scan the skills directory recursively for SKILL.md files.
     * Returns the total number of skills discovered.
     */
    async scanSkills(directory?: string): Promise<number> {
        if (directory) {
            this.skillsDir = directory;
        }
        this.clearIndexes();

        if (!fs.existsSync(this.skillsDir)) {
            console.warn(`[SkillRegistry] Skills directory not found: ${this.skillsDir}`);
            return 0;
        }

        const files = this.findSkillFiles(this.skillsDir);
        let loaded = 0;
        for (const filePath of files) {
            try {
                const def = this.parser.parse(filePath);
                if (def) {
                    this.index(def);
                    loaded++;
                }
            } catch (err) {
                console.warn(`[SkillRegistry] Failed to parse ${filePath}:`, err);
            }
        }

        console.info(`[SkillRegistry] Scanned ${files.length} files, loaded ${loaded} skills from ${this.skillsDir}`);
        this.startWatching();
        return loaded;
    }

    /**
     * Return all registered skill definitions.
     */
    getAllSkills(): SkillDefinition[] {
        return Array.from(this.byName.values());
    }

    /**
     * Look up a single skill by name.
     */
    getSkill(name: string): SkillDefinition | undefined {
        return this.byName.get(name);
    }

    /**
     * Fuzzy-search skills by query string.
     * Matches against name, description, and trigger phrases.
     */
    searchSkills(query: string): SkillMatch[] {
        const q = query.toLowerCase();
        const terms = q.split(/\s+/).filter(t => t.length > 1);
        const results: SkillMatch[] = [];

        for (const skill of this.byName.values()) {
            const { score, matchedTrigger } = this.computeScore(skill, terms, q);
            if (score > 0) {
                results.push({ skill, score, matchedTrigger });
            }
        }

        return results.sort((a, b) => b.score - a.score);
    }

    /**
     * Return all skills in the given domain.
     */
    getSkillsByDomain(domain: string): SkillDefinition[] {
        const names = this.byDomain.get(domain.toLowerCase());
        if (!names) {
            return [];
        }
        return Array.from(names)
            .map(n => this.byName.get(n))
            .filter((d): d is SkillDefinition => d !== undefined);
    }

    /**
     * Return all skills with the given intent.
     */
    getSkillsByIntent(intent: string): SkillDefinition[] {
        const names = this.byIntent.get(intent.toLowerCase());
        if (!names) {
            return [];
        }
        return Array.from(names)
            .map(n => this.byName.get(n))
            .filter((d): d is SkillDefinition => d !== undefined);
    }

    /**
     * Recursively find all SKILL.md files under a directory.
     */
    protected findSkillFiles(dir: string): string[] {
        const results: string[] = [];
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return results;
        }
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                // Skip hidden dirs and _metrics
                if (!entry.name.startsWith('.') && entry.name !== '_metrics' && entry.name !== 'node_modules') {
                    results.push(...this.findSkillFiles(fullPath));
                }
            } else if (entry.name === 'SKILL.md') {
                results.push(fullPath);
            }
        }
        return results;
    }

    /**
     * Add a skill definition to all indexes.
     */
    protected index(def: SkillDefinition): void {
        this.byName.set(def.name, def);

        if (def.domain) {
            const domain = def.domain.toLowerCase();
            if (!this.byDomain.has(domain)) {
                this.byDomain.set(domain, new Set());
            }
            this.byDomain.get(domain)!.add(def.name);
        }

        if (def.intent) {
            const intent = def.intent.toLowerCase();
            if (!this.byIntent.has(intent)) {
                this.byIntent.set(intent, new Set());
            }
            this.byIntent.get(intent)!.add(def.name);
        }
    }

    /**
     * Clear all indexes.
     */
    protected clearIndexes(): void {
        this.byName.clear();
        this.byDomain.clear();
        this.byIntent.clear();
    }

    /**
     * Compute a fuzzy match score for a skill against search terms.
     */
    protected computeScore(
        skill: SkillDefinition,
        terms: string[],
        fullQuery: string
    ): { score: number; matchedTrigger: string } {
        let score = 0;
        let matchedTrigger = '';

        // Exact name match
        if (skill.name.toLowerCase() === fullQuery) {
            return { score: 1.0, matchedTrigger: skill.name };
        }

        // Name contains query
        if (skill.name.toLowerCase().includes(fullQuery)) {
            score = Math.max(score, 0.8);
            matchedTrigger = skill.name;
        }

        // Term matching across name + description
        const searchable = `${skill.name} ${skill.description}`.toLowerCase();
        let termHits = 0;
        for (const term of terms) {
            if (searchable.includes(term)) {
                termHits++;
            }
        }
        if (terms.length > 0) {
            const termScore = (termHits / terms.length) * 0.6;
            if (termScore > score) {
                score = termScore;
                matchedTrigger = terms.filter(t => searchable.includes(t)).join(' ');
            }
        }

        // Trigger phrase matching
        for (const trigger of skill.triggers) {
            if (trigger.includes(fullQuery)) {
                score = Math.max(score, 0.7);
                matchedTrigger = trigger;
            }
            for (const term of terms) {
                if (trigger.includes(term)) {
                    score = Math.max(score, 0.4);
                    if (!matchedTrigger) {
                        matchedTrigger = trigger;
                    }
                }
            }
        }

        // Domain/intent exact match
        if (skill.domain?.toLowerCase() === fullQuery || skill.intent?.toLowerCase() === fullQuery) {
            score = Math.max(score, 0.5);
            matchedTrigger = skill.domain || skill.intent || '';
        }

        return { score, matchedTrigger };
    }

    /**
     * Start watching the skills directory for changes and re-index on modifications.
     */
    protected startWatching(): void {
        if (this.watcher) {
            this.watcher.close();
        }
        try {
            this.watcher = fs.watch(this.skillsDir, { recursive: true }, (eventType, filename) => {
                if (filename && filename.endsWith('SKILL.md')) {
                    console.info(`[SkillRegistry] Detected change in ${filename}, re-scanning...`);
                    // Debounce: re-scan after a brief delay
                    setTimeout(() => this.scanSkills(), 500);
                }
            });
        } catch (err) {
            console.warn('[SkillRegistry] Could not watch skills directory:', err);
        }
    }
}
