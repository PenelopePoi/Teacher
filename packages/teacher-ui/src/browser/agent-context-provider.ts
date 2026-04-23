import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { Emitter, Event, DisposableCollection } from '@theia/core/lib/common';
import { AgentModeService, AgentMode } from './agent-mode-service';
import { AgentSessionManager, Plan } from './agent-session-manager';
import { AgentsMdProvider } from './agents-md-provider';

/**
 * Agent Context Provider — collects IDE state for agent context injection.
 *
 * Provides Windsurf-style "Flow Awareness": recent files, errors,
 * terminal output, and active editor info bundled into a single
 * AgentContext object agents can consume.
 *
 * Enhancements over v1:
 *   - AGENTS.md integration (workspace-level agent instructions)
 *   - Git branch awareness (current branch name)
 *   - Workspace root tracking
 *   - Context serialization for prompt injection
 *   - Configurable context window size
 *   - Error deduplication and ranking
 *   - Terminal command+output pairing
 */

export interface DiagnosticInfo {
    file: string;
    line: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
    source?: string;
}

export interface ActiveEditorInfo {
    file: string;
    language: string;
    selection?: string;
    cursorLine: number;
    lineCount?: number;
    isDirty?: boolean;
}

export interface TerminalEntry {
    command: string;
    output: string;
    exitCode?: number;
    timestamp: number;
}

export interface LearningContext {
    activeLesson?: string;
    skillLevel: string;
    streak: number;
    conceptsLearned: number;
    weakAreas: string[];
    recentConcepts: string[];
    frictionState?: string;
    xp: number;
    level: number;
}

export interface AgentContext {
    mode: AgentMode;
    activeFile: string | undefined;
    openFiles: string[];
    recentFiles: string[];
    recentErrors: string[];
    terminalContext: string;
    sessionDuration: number;
    actionCount: number;
    currentPlan: Plan | undefined;
    agentsMd: string | undefined;
    gitBranch: string | undefined;
    workspaceRoot: string | undefined;
    filesTouchedCount: number;
    learning: LearningContext | undefined;
}

const MAX_RECENT_FILES = 20;
const MAX_RECENT_ERRORS = 50;
const MAX_TERMINAL_LINES = 100;
const MAX_TERMINAL_COMMANDS = 20;

@injectable()
export class AgentContextProvider {

    @inject(AgentModeService)
    protected readonly modeService: AgentModeService;

    @inject(AgentSessionManager)
    protected readonly sessionManager: AgentSessionManager;

    @inject(AgentsMdProvider)
    protected readonly agentsMdProvider: AgentsMdProvider;

    private readonly disposables = new DisposableCollection();

    private recentFiles: string[] = [];
    private recentErrors: DiagnosticInfo[] = [];
    private terminalBuffer: string[] = [];
    private terminalCommands: TerminalEntry[] = [];
    private activeFile: string | undefined;
    private openFiles: string[] = [];
    private activeEditorInfo: ActiveEditorInfo | undefined;
    private gitBranch: string | undefined;
    private workspaceRoot: string | undefined;

    private readonly onDidUpdateContextEmitter = new Emitter<AgentContext>();
    readonly onDidUpdateContext: Event<AgentContext> = this.onDidUpdateContextEmitter.event;

    @postConstruct()
    protected init(): void {
        // Listen for session actions to track recent files
        this.disposables.push(
            this.sessionManager.onDidRecordAction(action => {
                for (const file of action.files) {
                    this.trackRecentFile(file);
                }
                this.fireContextUpdate();
            })
        );

        // Listen for mode changes
        this.disposables.push(
            this.modeService.onDidChangeMode(() => {
                this.fireContextUpdate();
            })
        );

        // Listen for AGENTS.md changes
        this.disposables.push(
            this.agentsMdProvider.onDidChangeContent(() => {
                this.fireContextUpdate();
            })
        );

        // Listen for session clear
        this.disposables.push(
            this.sessionManager.onDidClearSession(() => {
                this.recentFiles = [];
                this.recentErrors = [];
                this.terminalBuffer = [];
                this.terminalCommands = [];
                this.fireContextUpdate();
            })
        );

        console.info('[AgentContextProvider] Initialized');
    }

    /** Collect current IDE state for agent context injection. */
    protected learningContext: LearningContext | undefined;

    /** Set the learning context (called by the orchestrator in teacher-core). */
    setLearningContext(ctx: LearningContext): void {
        this.learningContext = ctx;
        this.onDidUpdateContextEmitter.fire(this.getContext());
    }

    getContext(): AgentContext {
        return {
            mode: this.modeService.getMode(),
            activeFile: this.activeFile,
            openFiles: [...this.openFiles],
            recentFiles: [...this.recentFiles],
            recentErrors: this.recentErrors.map(e => `${e.file}:${e.line} [${e.severity}] ${e.message}`),
            terminalContext: this.terminalBuffer.slice(-MAX_TERMINAL_LINES).join('\n'),
            sessionDuration: this.sessionManager.getSessionDuration(),
            actionCount: this.sessionManager.getActionCount(),
            currentPlan: this.sessionManager.getPlan(),
            agentsMd: this.agentsMdProvider.getAgentsMdContent(),
            gitBranch: this.gitBranch,
            workspaceRoot: this.workspaceRoot,
            filesTouchedCount: this.sessionManager.getFilesTouchedCount(),
            learning: this.learningContext,
        };
    }

    /**
     * Serialize context as a structured text block suitable for prompt injection.
     * This is the primary interface for feeding context to AI agents.
     */
    serializeForPrompt(): string {
        const ctx = this.getContext();
        const lines: string[] = [];

        lines.push('--- Agent Context ---');
        lines.push(`Mode: ${ctx.mode}`);
        lines.push(`Session: ${this.formatDuration(ctx.sessionDuration)} | ${ctx.actionCount} actions | ${ctx.filesTouchedCount} files touched`);

        if (ctx.gitBranch) {
            lines.push(`Branch: ${ctx.gitBranch}`);
        }
        if (ctx.workspaceRoot) {
            lines.push(`Workspace: ${ctx.workspaceRoot}`);
        }
        if (ctx.activeFile) {
            lines.push(`Active file: ${ctx.activeFile}`);
        }
        if (ctx.openFiles.length > 0) {
            lines.push(`Open files: ${ctx.openFiles.join(', ')}`);
        }
        if (ctx.recentFiles.length > 0) {
            lines.push(`Recent files: ${ctx.recentFiles.slice(0, 5).join(', ')}`);
        }
        if (ctx.recentErrors.length > 0) {
            lines.push('Recent errors:');
            for (const err of ctx.recentErrors.slice(0, 5)) {
                lines.push(`  ${err}`);
            }
        }
        if (ctx.currentPlan) {
            const progress = this.sessionManager.getPlanProgress();
            lines.push(`Plan: "${ctx.currentPlan.title}" [${ctx.currentPlan.status}] ${progress}% complete`);
        }
        if (ctx.learning) {
            lines.push('');
            lines.push('--- Student Profile ---');
            lines.push(`Level: ${ctx.learning.skillLevel} (XP: ${ctx.learning.xp}, Level ${ctx.learning.level})`);
            lines.push(`Streak: ${ctx.learning.streak} days`);
            lines.push(`Concepts learned: ${ctx.learning.conceptsLearned}`);
            if (ctx.learning.activeLesson) {
                lines.push(`Active lesson: ${ctx.learning.activeLesson}`);
            }
            if (ctx.learning.weakAreas.length > 0) {
                lines.push(`Weak areas: ${ctx.learning.weakAreas.join(', ')}`);
            }
            if (ctx.learning.recentConcepts.length > 0) {
                lines.push(`Recent concepts: ${ctx.learning.recentConcepts.join(', ')}`);
            }
            if (ctx.learning.frictionState) {
                lines.push(`Friction: ${ctx.learning.frictionState}`);
            }
        }

        if (ctx.agentsMd) {
            lines.push('');
            lines.push('--- AGENTS.md ---');
            lines.push(ctx.agentsMd);
        }

        lines.push('--- End Context ---');
        return lines.join('\n');
    }

    /** Track a file as recently accessed. */
    trackRecentFile(file: string): void {
        const idx = this.recentFiles.indexOf(file);
        if (idx >= 0) {
            this.recentFiles.splice(idx, 1);
        }
        this.recentFiles.unshift(file);
        if (this.recentFiles.length > MAX_RECENT_FILES) {
            this.recentFiles = this.recentFiles.slice(0, MAX_RECENT_FILES);
        }
    }

    /** Get recently accessed files. */
    getRecentFiles(limit: number = MAX_RECENT_FILES): string[] {
        return this.recentFiles.slice(0, limit);
    }

    /** Record a diagnostic error with deduplication. */
    recordError(error: DiagnosticInfo): void {
        // Deduplicate: remove existing errors with same file+line+message
        this.recentErrors = this.recentErrors.filter(
            e => !(e.file === error.file && e.line === error.line && e.message === error.message)
        );
        this.recentErrors.unshift(error);
        if (this.recentErrors.length > MAX_RECENT_ERRORS) {
            this.recentErrors = this.recentErrors.slice(0, MAX_RECENT_ERRORS);
        }
        this.fireContextUpdate();
    }

    /** Clear errors for a specific file (e.g., when the file is saved and errors resolve). */
    clearErrorsForFile(file: string): void {
        const before = this.recentErrors.length;
        this.recentErrors = this.recentErrors.filter(e => e.file !== file);
        if (this.recentErrors.length !== before) {
            this.fireContextUpdate();
        }
    }

    /** Get recent errors, optionally filtered by severity. */
    getRecentErrors(severity?: DiagnosticInfo['severity']): DiagnosticInfo[] {
        if (severity) {
            return this.recentErrors.filter(e => e.severity === severity);
        }
        return [...this.recentErrors];
    }

    /** Get error count by severity. */
    getErrorCounts(): Record<DiagnosticInfo['severity'], number> {
        const counts: Record<DiagnosticInfo['severity'], number> = { error: 0, warning: 0, info: 0 };
        for (const e of this.recentErrors) {
            counts[e.severity]++;
        }
        return counts;
    }

    /** Append terminal output to the buffer. */
    appendTerminalOutput(line: string): void {
        this.terminalBuffer.push(line);
        if (this.terminalBuffer.length > MAX_TERMINAL_LINES * 2) {
            this.terminalBuffer = this.terminalBuffer.slice(-MAX_TERMINAL_LINES);
        }
    }

    /** Record a terminal command + output pair. */
    recordTerminalCommand(entry: TerminalEntry): void {
        this.terminalCommands.unshift(entry);
        if (this.terminalCommands.length > MAX_TERMINAL_COMMANDS) {
            this.terminalCommands = this.terminalCommands.slice(0, MAX_TERMINAL_COMMANDS);
        }
        this.appendTerminalOutput(`$ ${entry.command}`);
        if (entry.output) {
            for (const line of entry.output.split('\n').slice(0, 20)) {
                this.appendTerminalOutput(line);
            }
        }
    }

    /** Get recent terminal commands. */
    getRecentTerminalCommands(limit: number = MAX_TERMINAL_COMMANDS): TerminalEntry[] {
        return this.terminalCommands.slice(0, limit);
    }

    /** Get recent terminal output. */
    getRecentTerminalOutput(lines: number = MAX_TERMINAL_LINES): string {
        return this.terminalBuffer.slice(-lines).join('\n');
    }

    /** Set the active editor file. */
    setActiveEditor(info: ActiveEditorInfo): void {
        this.activeFile = info.file;
        this.activeEditorInfo = info;
        this.trackRecentFile(info.file);
        this.fireContextUpdate();
    }

    /** Get active editor info. */
    getActiveEditorInfo(): ActiveEditorInfo | undefined {
        return this.activeEditorInfo;
    }

    /** Set the list of open tabs. */
    setOpenTabs(files: string[]): void {
        this.openFiles = [...files];
    }

    /** Get open tabs. */
    getOpenTabs(): string[] {
        return [...this.openFiles];
    }

    /** Set the current git branch. */
    setGitBranch(branch: string | undefined): void {
        this.gitBranch = branch;
        this.fireContextUpdate();
    }

    /** Get the current git branch. */
    getGitBranch(): string | undefined {
        return this.gitBranch;
    }

    /** Set the workspace root path. */
    setWorkspaceRoot(root: string | undefined): void {
        this.workspaceRoot = root;
    }

    /** Get the workspace root path. */
    getWorkspaceRoot(): string | undefined {
        return this.workspaceRoot;
    }

    private fireContextUpdate(): void {
        this.onDidUpdateContextEmitter.fire(this.getContext());
    }

    private formatDuration(ms: number): string {
        const totalMinutes = Math.floor(ms / 60_000);
        if (totalMinutes < 60) {
            return `${totalMinutes}m`;
        }
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
    }

    dispose(): void {
        this.disposables.dispose();
        this.onDidUpdateContextEmitter.dispose();
    }
}
