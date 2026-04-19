import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution, FrontendApplication } from '@theia/core/lib/browser';
import { Emitter, Event } from '@theia/core/lib/common';

/**
 * AGENTS.md Provider — looks for AGENTS.md or agents.md in the workspace
 * root and injects its content as system context for all AI agents.
 *
 * Follows the convention from the AI agent playbook: if a project
 * contains an AGENTS.md, it serves as persistent instructions for
 * any agent working within that workspace.
 */

const AGENTS_MD_FILENAMES = ['AGENTS.md', 'agents.md'];
const POLL_INTERVAL_MS = 30_000; // Re-check every 30 seconds

@injectable()
export class AgentsMdProvider implements FrontendApplicationContribution {

    private agentsMdContent: string | undefined;
    private agentsMdPath: string | undefined;
    private pollTimer: ReturnType<typeof setInterval> | undefined;

    private readonly onDidChangeContentEmitter = new Emitter<string | undefined>();
    readonly onDidChangeContent: Event<string | undefined> = this.onDidChangeContentEmitter.event;

    @postConstruct()
    protected init(): void {
        console.info('[AgentsMdProvider] Initialized, will look for AGENTS.md on start');
    }

    async onStart(_app: FrontendApplication): Promise<void> {
        await this.loadAgentsMd();

        // Poll periodically for changes (filesystem watchers would be better,
        // but this works without backend dependencies)
        this.pollTimer = setInterval(() => {
            this.loadAgentsMd();
        }, POLL_INTERVAL_MS);
    }

    onStop(): void {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = undefined;
        }
    }

    /** Get the current AGENTS.md content, or undefined if not found. */
    getAgentsMdContent(): string | undefined {
        return this.agentsMdContent;
    }

    /** Get the path where AGENTS.md was found. */
    getAgentsMdPath(): string | undefined {
        return this.agentsMdPath;
    }

    /** Check if AGENTS.md has been loaded. */
    hasAgentsMd(): boolean {
        return this.agentsMdContent !== undefined;
    }

    private async loadAgentsMd(): Promise<void> {
        // Try to find AGENTS.md using the workspace root
        // In a browser context, we attempt to use the Fetch API for local files
        // or check common workspace path patterns
        try {
            for (const filename of AGENTS_MD_FILENAMES) {
                const content = await this.tryReadFile(filename);
                if (content !== undefined) {
                    const changed = content !== this.agentsMdContent;
                    this.agentsMdContent = content;
                    this.agentsMdPath = filename;
                    if (changed) {
                        console.info(`[AgentsMdProvider] Loaded ${filename} (${content.length} chars)`);
                        this.onDidChangeContentEmitter.fire(content);
                    }
                    return;
                }
            }

            // Not found — clear if previously loaded
            if (this.agentsMdContent !== undefined) {
                this.agentsMdContent = undefined;
                this.agentsMdPath = undefined;
                this.onDidChangeContentEmitter.fire(undefined);
                console.info('[AgentsMdProvider] AGENTS.md no longer found');
            }
        } catch (err) {
            console.warn('[AgentsMdProvider] Error loading AGENTS.md:', err);
        }
    }

    private async tryReadFile(filename: string): Promise<string | undefined> {
        try {
            // Attempt to read via the workspace file service
            // In a Theia browser context, files are served from the backend
            const response = await fetch(`/workspace/${filename}`);
            if (response.ok) {
                return await response.text();
            }
        } catch {
            // File not accessible, that is fine
        }
        return undefined;
    }
}
