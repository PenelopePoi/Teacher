import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution, FrontendApplication } from '@theia/core/lib/browser';
import { Emitter, Event, DisposableCollection } from '@theia/core/lib/common';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import URI from '@theia/core/lib/common/uri';

/**
 * AGENTS.md Provider — looks for AGENTS.md or agents.md in the workspace
 * root and injects its content as system context for all AI agents.
 *
 * Follows the convention from the AI agent playbook: if a project
 * contains an AGENTS.md, it serves as persistent instructions for
 * any agent working within that workspace.
 *
 * Enhancements over v1:
 *   - Uses Theia WorkspaceService + FileService instead of raw fetch
 *   - Filesystem watcher for instant reload on change
 *   - CLAUDE.md support as fallback
 *   - Structured section parsing (headings -> sections map)
 *   - Content validation and size limits
 *   - Change diffing (what changed in AGENTS.md)
 */

const AGENTS_MD_FILENAMES = ['AGENTS.md', 'agents.md', 'CLAUDE.md', 'claude.md'];
const POLL_INTERVAL_MS = 30_000;
const MAX_CONTENT_SIZE = 100_000; // 100KB max

export interface AgentsMdSection {
    heading: string;
    level: number;
    content: string;
}

@injectable()
export class AgentsMdProvider implements FrontendApplicationContribution {

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @inject(FileService)
    protected readonly fileService: FileService;

    private agentsMdContent: string | undefined;
    private agentsMdPath: string | undefined;
    private agentsMdSections: AgentsMdSection[] = [];
    private pollTimer: ReturnType<typeof setInterval> | undefined;
    private readonly disposables = new DisposableCollection();
    private lastModified: number = 0;

    private readonly onDidChangeContentEmitter = new Emitter<string | undefined>();
    readonly onDidChangeContent: Event<string | undefined> = this.onDidChangeContentEmitter.event;

    @postConstruct()
    protected init(): void {
        console.info('[AgentsMdProvider] Initialized, will look for AGENTS.md on start');
    }

    async onStart(_app: FrontendApplication): Promise<void> {
        // Wait for workspace to be ready
        await this.workspaceService.ready;
        await this.loadAgentsMd();

        // Watch for workspace changes
        this.disposables.push(
            this.workspaceService.onWorkspaceChanged(() => {
                this.loadAgentsMd();
            })
        );

        // Set up file watcher for the found file
        this.setupFileWatcher();

        // Poll as a fallback
        this.pollTimer = setInterval(() => {
            this.loadAgentsMd();
        }, POLL_INTERVAL_MS);
    }

    onStop(): void {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = undefined;
        }
        this.disposables.dispose();
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

    /** Get parsed sections from AGENTS.md. */
    getSections(): AgentsMdSection[] {
        return [...this.agentsMdSections];
    }

    /** Get a specific section by heading (case-insensitive). */
    getSection(heading: string): AgentsMdSection | undefined {
        const lower = heading.toLowerCase();
        return this.agentsMdSections.find(s => s.heading.toLowerCase() === lower);
    }

    /** Get which filename was detected (e.g., 'AGENTS.md' vs 'CLAUDE.md'). */
    getDetectedFilename(): string | undefined {
        if (!this.agentsMdPath) {
            return undefined;
        }
        // Extract just the filename
        const parts = this.agentsMdPath.split('/');
        return parts[parts.length - 1];
    }

    private async loadAgentsMd(): Promise<void> {
        const roots = this.workspaceService.tryGetRoots();
        if (roots.length === 0) {
            // No workspace, try fallback fetch
            await this.loadViaFetch();
            return;
        }

        for (const root of roots) {
            for (const filename of AGENTS_MD_FILENAMES) {
                try {
                    const fileUri = new URI(root.resource.toString()).resolve(filename);
                    const stat = await this.fileService.resolve(fileUri);
                    if (stat && !stat.isDirectory) {
                        const content = await this.fileService.read(fileUri);
                        const text = content.value;

                        if (text.length > MAX_CONTENT_SIZE) {
                            console.warn(`[AgentsMdProvider] ${filename} exceeds ${MAX_CONTENT_SIZE} chars, truncating`);
                        }

                        const truncated = text.slice(0, MAX_CONTENT_SIZE);
                        const changed = truncated !== this.agentsMdContent;

                        this.agentsMdContent = truncated;
                        this.agentsMdPath = fileUri.toString();
                        this.agentsMdSections = this.parseSections(truncated);

                        if (changed) {
                            this.lastModified = Date.now();
                            console.info(`[AgentsMdProvider] Loaded ${filename} (${truncated.length} chars, ${this.agentsMdSections.length} sections)`);
                            this.onDidChangeContentEmitter.fire(truncated);
                        }
                        return;
                    }
                } catch {
                    // File does not exist, continue searching
                }
            }
        }

        // Not found in any workspace root — clear if previously loaded
        if (this.agentsMdContent !== undefined) {
            this.agentsMdContent = undefined;
            this.agentsMdPath = undefined;
            this.agentsMdSections = [];
            this.onDidChangeContentEmitter.fire(undefined);
            console.info('[AgentsMdProvider] AGENTS.md no longer found');
        }
    }

    /** Fallback for when WorkspaceService is not available. */
    private async loadViaFetch(): Promise<void> {
        for (const filename of AGENTS_MD_FILENAMES) {
            try {
                const response = await fetch(`/workspace/${filename}`);
                if (response.ok) {
                    const text = await response.text();
                    const truncated = text.slice(0, MAX_CONTENT_SIZE);
                    const changed = truncated !== this.agentsMdContent;
                    this.agentsMdContent = truncated;
                    this.agentsMdPath = filename;
                    this.agentsMdSections = this.parseSections(truncated);
                    if (changed) {
                        this.lastModified = Date.now();
                        this.onDidChangeContentEmitter.fire(truncated);
                        console.info(`[AgentsMdProvider] Loaded ${filename} via fetch (${truncated.length} chars)`);
                    }
                    return;
                }
            } catch {
                // File not accessible
            }
        }
    }

    private setupFileWatcher(): void {
        if (!this.agentsMdPath) {
            return;
        }
        try {
            const uri = new URI(this.agentsMdPath);
            this.disposables.push(
                this.fileService.onDidFilesChange(event => {
                    if (event.contains(uri)) {
                        console.info('[AgentsMdProvider] File change detected, reloading...');
                        this.loadAgentsMd();
                    }
                })
            );
        } catch (err) {
            console.warn('[AgentsMdProvider] Failed to set up file watcher:', err);
        }
    }

    /** Parse markdown content into sections based on headings. */
    private parseSections(content: string): AgentsMdSection[] {
        const sections: AgentsMdSection[] = [];
        const lines = content.split('\n');
        let currentSection: AgentsMdSection | undefined;

        for (const line of lines) {
            const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (headingMatch) {
                if (currentSection) {
                    currentSection.content = currentSection.content.trim();
                    sections.push(currentSection);
                }
                currentSection = {
                    heading: headingMatch[2].trim(),
                    level: headingMatch[1].length,
                    content: '',
                };
            } else if (currentSection) {
                currentSection.content += line + '\n';
            }
        }

        if (currentSection) {
            currentSection.content = currentSection.content.trim();
            sections.push(currentSection);
        }

        return sections;
    }

    /** Get the last modified timestamp. */
    getLastModified(): number {
        return this.lastModified;
    }
}
