import { injectable, inject } from '@theia/core/shared/inversify';
import { CommandRegistry, DisposableCollection, nls } from '@theia/core/lib/common';
import {
    FrontendApplicationContribution,
    StatusBar,
    StatusBarAlignment,
    StatusBarEntry,
} from '@theia/core/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { ASIBridgeService } from '../../common/asi-bridge-protocol';
import { PulseService } from '../pulse/pulse-service';

/**
 * §1 Priority #5 — Status-bar rebuild.
 *
 * Stock Theia fills the status bar with git branch, encoding, LF/CRLF,
 * tabs-vs-spaces, language mode, and a half-dozen LSP blinkers — the
 * "confetti" the spec flags. We add a class to <body> that CSS hides
 * unwanted entries, and register three Teacher-owned entries in a
 * fixed order:
 *
 *   LEFT  · Pulse orb with state label
 *   LEFT  · active-project breadcrumb (workspace root basename)
 *   RIGHT · AI model indicator (current Ollama model + green/red dot)
 *
 * No progress spinners. State surfaces exclusively via the Pulse.
 */

const TEACHER_STATUS_CLASS = 'teacher-status-rebuilt';

const PULSE_ENTRY_ID     = 'teacher.status.pulse';
const PROJECT_ENTRY_ID   = 'teacher.status.project';
const MODEL_ENTRY_ID     = 'teacher.status.model';
const GAMIFY_ENTRY_ID    = 'teacher.status.gamification';

const PULSE_GLYPH: Record<string, string> = {
    off:        '$(circle-slash)',
    idle:       '$(record)',
    listening:  '$(record)',
    thinking:   '$(record)',
    suggesting: '$(record)',
    error:      '$(alert)',
};

@injectable()
export class TeacherStatusContribution implements FrontendApplicationContribution {

    @inject(StatusBar)         protected readonly statusBar: StatusBar;
    @inject(PulseService)      protected readonly pulseService: PulseService;
    @inject(WorkspaceService)  protected readonly workspaceService: WorkspaceService;
    @inject(ASIBridgeService)  protected readonly asiBridge: ASIBridgeService;
    @inject(CommandRegistry)   protected readonly commandRegistry: CommandRegistry;

    protected readonly toDispose = new DisposableCollection();
    protected modelPollTimer: ReturnType<typeof setInterval> | undefined;

    onStart(): void {
        document.body.classList.add(TEACHER_STATUS_CLASS);

        this.renderPulse(this.pulseService.state, this.pulseService.label);
        this.toDispose.push(
            this.pulseService.onDidChange(change =>
                this.renderPulse(change.state, change.label),
            ),
        );

        this.workspaceService.ready.then(() => this.renderProject());
        this.toDispose.push(
            this.workspaceService.onWorkspaceChanged(() => this.renderProject()),
        );

        this.renderModel();
        this.modelPollTimer = setInterval(() => this.renderModel(), 15_000);

        this.renderGamification();
    }

    onStop(): void {
        document.body.classList.remove(TEACHER_STATUS_CLASS);
        if (this.modelPollTimer) {
            clearInterval(this.modelPollTimer);
            this.modelPollTimer = undefined;
        }
        this.toDispose.dispose();
    }

    protected renderPulse(state: string, label?: string): void {
        const text = `${PULSE_GLYPH[state] ?? PULSE_GLYPH.idle} ${label ?? this.defaultLabel(state)}`;
        const entry: StatusBarEntry = {
            text,
            alignment: StatusBarAlignment.LEFT,
            priority: 10_000,
            className: `teacher-status-pulse teacher-status-pulse-${state}`,
            tooltip: nls.localize(
                'theia/teacher/pulseTooltip',
                'Teacher Pulse — {0}. Click to open the Learning Workspace.',
                state,
            ),
            command: 'teacher.workspace.learningPreset',
        };
        this.statusBar.setElement(PULSE_ENTRY_ID, entry);
    }

    protected renderProject(): void {
        const roots = this.workspaceService.tryGetRoots();
        const label = roots.length === 0
            ? nls.localize('theia/teacher/noWorkspace', 'no workspace')
            : roots.map(r => this.basename(r.resource.path.toString())).join(' · ');

        const entry: StatusBarEntry = {
            text: `$(folder-opened) ${label}`,
            alignment: StatusBarAlignment.LEFT,
            priority: 9_500,
            className: 'teacher-status-project',
            tooltip: nls.localize(
                'theia/teacher/projectTooltip',
                'Active workspace. Click to pick a new one.',
            ),
            command: 'workspace:openWorkspace',
        };
        this.statusBar.setElement(PROJECT_ENTRY_ID, entry);
    }

    protected async renderModel(): Promise<void> {
        const status = await this.asiBridge.getStatus().catch(() => undefined);
        const ok = status?.running && status.ollamaConnected;
        const modelName = status?.modelName ?? 'ollama offline';
        const glyph = ok ? '$(circle-filled)' : '$(circle-outline)';
        const className = ok ? 'teacher-status-model teacher-status-model-up'
                             : 'teacher-status-model teacher-status-model-down';
        const entry: StatusBarEntry = {
            text: `${glyph} ${modelName}`,
            alignment: StatusBarAlignment.RIGHT,
            priority: 10_000,
            className,
            tooltip: ok
                ? nls.localize('theia/teacher/modelOk',   'Ollama connected · {0}', modelName)
                : nls.localize('theia/teacher/modelDown', 'Ollama offline — start it with `ollama serve`'),
        };
        this.statusBar.setElement(MODEL_ENTRY_ID, entry);
    }

    protected renderGamification(): void {
        const level = 12;
        const pct = 62;
        const streak = 7;
        const bar = this.buildProgressBar(pct);
        const entry: StatusBarEntry = {
            text: `$(star-full) Lv.${level} | ${bar} ${pct}% | $(flame) ${streak}`,
            alignment: StatusBarAlignment.RIGHT,
            priority: 9_000,
            className: 'teacher-status-gamification',
            tooltip: nls.localize(
                'theia/teacher/gamificationTooltip',
                'Level {0} — {1}% to next level — {2} day streak. Click to open Player Profile.',
                String(level), String(pct), String(streak),
            ),
            command: 'teacher.xpLevel.open',
        };
        this.statusBar.setElement(GAMIFY_ENTRY_ID, entry);
    }

    protected buildProgressBar(pct: number): string {
        const filled = Math.round(pct / 20);
        const empty = 5 - filled;
        return '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
    }

    protected defaultLabel(state: string): string {
        switch (state) {
            case 'listening':  return 'Listening';
            case 'thinking':   return 'Thinking';
            case 'suggesting': return 'Proposal ready';
            case 'error':      return 'Error';
            case 'off':        return 'Off';
            case 'idle':
            default:           return 'Idle';
        }
    }

    protected basename(uri: string): string {
        return uri.split('/').filter(Boolean).pop() ?? uri;
    }
}
