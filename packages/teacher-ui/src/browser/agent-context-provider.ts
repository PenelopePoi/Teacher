import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { Emitter, Event, DisposableCollection } from '@theia/core/lib/common';
import { AgentModeService, AgentMode } from './agent-mode-service';
import { AgentSessionManager, Plan } from './agent-session-manager';

/**
 * Agent Context Provider — collects IDE state for agent context injection.
 *
 * Provides Windsurf-style "Flow Awareness": recent files, errors,
 * terminal output, and active editor info bundled into a single
 * AgentContext object agents can consume.
 */

export interface DiagnosticInfo {
    file: string;
    line: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
}

export interface ActiveEditorInfo {
    file: string;
    language: string;
    selection?: string;
    cursorLine: number;
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
}

const MAX_RECENT_FILES = 20;
const MAX_RECENT_ERRORS = 50;
const MAX_TERMINAL_LINES = 100;

@injectable()
export class AgentContextProvider {

    @inject(AgentModeService)
    protected readonly modeService: AgentModeService;

    @inject(AgentSessionManager)
    protected readonly sessionManager: AgentSessionManager;

    private readonly disposables = new DisposableCollection();

    private recentFiles: string[] = [];
    private recentErrors: DiagnosticInfo[] = [];
    private terminalBuffer: string[] = [];
    private activeFile: string | undefined;
    private openFiles: string[] = [];
    private activeEditorInfo: ActiveEditorInfo | undefined;

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

        console.info('[AgentContextProvider] Initialized');
    }

    /** Collect current IDE state for agent context injection. */
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
        };
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

    /** Record a diagnostic error. */
    recordError(error: DiagnosticInfo): void {
        this.recentErrors.unshift(error);
        if (this.recentErrors.length > MAX_RECENT_ERRORS) {
            this.recentErrors = this.recentErrors.slice(0, MAX_RECENT_ERRORS);
        }
        this.fireContextUpdate();
    }

    /** Get recent errors. */
    getRecentErrors(): DiagnosticInfo[] {
        return [...this.recentErrors];
    }

    /** Append terminal output to the buffer. */
    appendTerminalOutput(line: string): void {
        this.terminalBuffer.push(line);
        if (this.terminalBuffer.length > MAX_TERMINAL_LINES * 2) {
            this.terminalBuffer = this.terminalBuffer.slice(-MAX_TERMINAL_LINES);
        }
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

    private fireContextUpdate(): void {
        this.onDidUpdateContextEmitter.fire(this.getContext());
    }

    dispose(): void {
        this.disposables.dispose();
        this.onDidUpdateContextEmitter.dispose();
    }
}
