import * as fs from 'fs';
import { SkillDefinition } from '../../common/skill-engine-protocol';

/**
 * Parses a SKILL.md file into a SkillDefinition.
 *
 * Handles YAML frontmatter (simple key:value pairs) and extracts
 * trigger phrases from the description field.
 */
export class SkillParser {

    /**
     * Parse a single SKILL.md file at the given absolute path.
     * Returns undefined if the file cannot be read or has no valid frontmatter.
     */
    parse(filePath: string): SkillDefinition | undefined {
        let raw: string;
        try {
            raw = fs.readFileSync(filePath, 'utf-8');
        } catch (err) {
            console.warn(`[SkillParser] Could not read ${filePath}:`, err);
            return undefined;
        }

        const { frontmatter, body } = this.splitFrontmatter(raw);
        if (!frontmatter) {
            console.warn(`[SkillParser] No valid frontmatter in ${filePath}`);
            return undefined;
        }

        const fields = this.parseYaml(frontmatter);
        const name = fields['name'] || this.nameFromPath(filePath);
        const description = fields['description'] || '';

        return {
            name,
            description,
            intent: fields['intent'],
            domain: fields['domain'],
            lifecycle: fields['lifecycle'] || 'stable',
            version: fields['version'],
            bloomLevel: fields['bloom_level'] || fields['bloomLevel'],
            type: fields['type'] || 'skill',
            argumentHint: fields['argument-hint'] || fields['argumentHint'],
            allowedTools: this.parseList(fields['allowed-tools'] || fields['allowedTools']),
            filePath,
            content: body,
            triggers: this.extractTriggers(description),
        };
    }

    /**
     * Split the raw file into frontmatter (between first pair of ---) and body.
     */
    private splitFrontmatter(raw: string): { frontmatter: string | undefined; body: string } {
        const trimmed = raw.trimStart();
        if (!trimmed.startsWith('---')) {
            return { frontmatter: undefined, body: raw };
        }
        const secondDash = trimmed.indexOf('---', 3);
        if (secondDash === -1) {
            return { frontmatter: undefined, body: raw };
        }
        const frontmatter = trimmed.substring(3, secondDash).trim();
        const body = trimmed.substring(secondDash + 3).trim();
        return { frontmatter, body };
    }

    /**
     * Simple YAML parser for key: value pairs (no nested objects).
     * Handles multi-word values and quoted strings.
     */
    private parseYaml(yaml: string): Record<string, string> {
        const result: Record<string, string> = {};
        for (const line of yaml.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) {
                continue;
            }
            const colonIdx = trimmed.indexOf(':');
            if (colonIdx === -1) {
                continue;
            }
            const key = trimmed.substring(0, colonIdx).trim();
            let value = trimmed.substring(colonIdx + 1).trim();
            // Strip surrounding quotes
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length - 1);
            }
            if (key && value) {
                result[key] = value;
            }
        }
        return result;
    }

    /**
     * Parse a comma-separated or YAML-list string into an array of strings.
     */
    private parseList(value: string | undefined): string[] | undefined {
        if (!value) {
            return undefined;
        }
        return value
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }

    /**
     * Extract trigger phrases from a description string.
     * Splits on commas, semicolons, em-dashes, and "triggers on:" patterns.
     */
    private extractTriggers(description: string): string[] {
        if (!description) {
            return [];
        }
        // Remove "triggers on:" prefix if present
        let cleaned = description.replace(/triggers?\s+on\s*:\s*/gi, '');
        // Split on multiple delimiters
        const parts = cleaned.split(/[,;—–]/)
            .map(s => s.trim().toLowerCase())
            .filter(s => s.length > 2 && s.length < 120);
        return parts;
    }

    /**
     * Derive a skill name from its file path (parent directory name).
     */
    private nameFromPath(filePath: string): string {
        const parts = filePath.split('/');
        // The parent directory of SKILL.md is typically the skill name
        if (parts.length >= 2) {
            return parts[parts.length - 2];
        }
        return 'unknown-skill';
    }
}
