import { injectable } from '@theia/core/shared/inversify';
import * as fs from 'fs';

/**
 * Symbol for dependency injection of the AutoReviewService.
 */
export const AutoReviewServiceSymbol = Symbol('AutoReviewService');

/**
 * Review result from the auto-review agent.
 */
export interface AutoReviewResult {
    /** The file that was reviewed. */
    filePath: string;
    /** Whether the review found issues. */
    hasIssues: boolean;
    /** Summary of findings. */
    summary: string;
    /** ISO 8601 timestamp of the review. */
    timestamp: string;
}

/**
 * Watches file saves and triggers the review agent.
 * Respects the `teacher.learning.autoReview` preference:
 * when disabled, file saves are ignored.
 */
@injectable()
export class AutoReviewService {

    /** Whether auto-review is currently enabled. */
    protected enabled: boolean = true;

    /** Paths currently being reviewed (to avoid duplicate triggers). */
    protected readonly reviewing: Set<string> = new Set();

    /** History of recent reviews. */
    protected readonly history: AutoReviewResult[] = [];

    /** Maximum number of history entries to keep. */
    protected readonly maxHistory: number = 50;

    /**
     * Set whether auto-review is enabled.
     * Called when the `teacher.learning.autoReview` preference changes.
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        console.info(`[AutoReviewService] Auto-review ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Returns whether auto-review is currently enabled.
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Called when a file is saved. If auto-review is enabled and the file
     * is reviewable, triggers the review agent.
     */
    async onFileSaved(filePath: string): Promise<AutoReviewResult | undefined> {
        if (!this.enabled) {
            return undefined;
        }

        if (!this.isReviewableFile(filePath)) {
            return undefined;
        }

        if (this.reviewing.has(filePath)) {
            return undefined; // Already reviewing this file
        }

        this.reviewing.add(filePath);
        try {
            const result = await this.performReview(filePath);
            this.addToHistory(result);
            return result;
        } finally {
            this.reviewing.delete(filePath);
        }
    }

    /**
     * Return recent auto-review results.
     */
    getHistory(): AutoReviewResult[] {
        return [...this.history];
    }

    /**
     * Check whether a file path is eligible for auto-review.
     * Reviews source code files only (ts, js, py, java, etc.).
     */
    protected isReviewableFile(filePath: string): boolean {
        const reviewableExtensions = [
            '.ts', '.tsx', '.js', '.jsx', '.py', '.java',
            '.go', '.rs', '.c', '.cpp', '.cs', '.rb',
        ];
        return reviewableExtensions.some(ext => filePath.endsWith(ext));
    }

    /**
     * Perform a review of the given file.
     * In production, this would delegate to the review agent.
     * Here it checks basic file properties as a placeholder.
     */
    protected async performReview(filePath: string): Promise<AutoReviewResult> {
        const timestamp = new Date().toISOString();

        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            const issues: string[] = [];

            // Check for common issues
            if (lines.length > 500) {
                issues.push(`File has ${lines.length} lines — consider splitting into smaller modules.`);
            }

            const longLines = lines.filter(l => l.length > 120);
            if (longLines.length > 5) {
                issues.push(`${longLines.length} lines exceed 120 characters.`);
            }

            if (content.includes('console.log(') && !filePath.includes('.spec.')) {
                issues.push('Contains console.log statements — consider using a logger.');
            }

            return {
                filePath,
                hasIssues: issues.length > 0,
                summary: issues.length > 0
                    ? `Found ${issues.length} issue(s): ${issues.join(' ')}`
                    : 'No issues found.',
                timestamp,
            };
        } catch (err) {
            return {
                filePath,
                hasIssues: false,
                summary: `Could not read file for review: ${err}`,
                timestamp,
            };
        }
    }

    /**
     * Add a result to history, capping at maxHistory entries.
     */
    protected addToHistory(result: AutoReviewResult): void {
        this.history.unshift(result);
        if (this.history.length > this.maxHistory) {
            this.history.length = this.maxHistory;
        }
    }
}
