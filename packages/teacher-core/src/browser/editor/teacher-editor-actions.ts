import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry, Command } from '@theia/core';
import { KeybindingContribution, KeybindingRegistry, FrontendApplicationContribution } from '@theia/core/lib/browser';
import { EditorManager } from '@theia/editor/lib/browser';
import { AgentHandoffService } from '../agents/agent-handoff-service';
import { PulseService } from '../pulse/pulse-service';
import { TimelineService } from '../ghost-timeline/timeline-service';
import { TeachableMomentDetector } from '../teachable-moments/teachable-moment-detector';
import { TeachableMomentService } from '../teachable-moments/teachable-moment-service';

export namespace TeacherEditorCommands {
    export const EXPLAIN_SELECTION: Command = {
        id: 'teacher.editor.explainSelection',
        label: 'Teacher: Explain Selection',
        category: 'Teacher',
    };
    export const REVIEW_SELECTION: Command = {
        id: 'teacher.editor.reviewSelection',
        label: 'Teacher: Review This Code',
        category: 'Teacher',
    };
    export const DEBUG_ERROR: Command = {
        id: 'teacher.editor.debugError',
        label: 'Teacher: Help Debug This',
        category: 'Teacher',
    };
    export const ASK_WHY: Command = {
        id: 'teacher.editor.askWhy',
        label: 'Teacher: Why Does This Work?',
        category: 'Teacher',
    };
    export const SUGGEST_IMPROVEMENT: Command = {
        id: 'teacher.editor.suggestImprovement',
        label: 'Teacher: Suggest Improvement',
        category: 'Teacher',
    };
}

/**
 * Editor-integrated AI actions — adds right-click context menu items
 * and keybindings for inline AI interactions.
 *
 * These are the "many ways AI can interact" — the student doesn't always
 * have to open the chat panel. They can:
 * - Select code → right-click → Explain / Review / Debug / Ask Why
 * - Use keyboard shortcuts for rapid AI consultation
 * - Each action routes to the appropriate specialized agent
 */
@injectable()
export class TeacherEditorActionsContribution implements CommandContribution, KeybindingContribution, FrontendApplicationContribution {

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(AgentHandoffService)
    protected readonly handoff: AgentHandoffService;

    @inject(PulseService)
    protected readonly pulse: PulseService;

    @inject(TimelineService)
    protected readonly timeline: TimelineService;

    @inject(TeachableMomentDetector)
    protected readonly detector: TeachableMomentDetector;

    @inject(TeachableMomentService)
    protected readonly teachable: TeachableMomentService;

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    @postConstruct()
    protected init(): void {
        // nothing — wiring happens in registerCommands
    }

    onStart(): void {
        // Scan for teachable moments whenever active editor changes
        this.editorManager.onActiveEditorChanged(editor => {
            if (editor) {
                const text = editor.editor.document.getText();
                const detected = this.detector.detect(text.substring(0, 5000));
                for (const match of detected) {
                    if (!this.teachable.isDismissed(match.concept.id)) {
                        this.teachable.recordEncounter(match.concept.id);
                    }
                }
            }
        });
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(TeacherEditorCommands.EXPLAIN_SELECTION, {
            execute: () => this.sendSelectionToAgent('teacher-explain', 'Explain this code'),
            isEnabled: () => this.hasSelection(),
        });

        registry.registerCommand(TeacherEditorCommands.REVIEW_SELECTION, {
            execute: () => this.sendSelectionToAgent('teacher-review', 'Review this code'),
            isEnabled: () => this.hasSelection(),
        });

        registry.registerCommand(TeacherEditorCommands.DEBUG_ERROR, {
            execute: () => this.sendSelectionToAgent('teacher-debugger', 'Help debug this'),
            isEnabled: () => this.hasSelection(),
        });

        registry.registerCommand(TeacherEditorCommands.ASK_WHY, {
            execute: () => this.sendSelectionToAgent('teacher-tutor', 'Why does this work this way?'),
            isEnabled: () => this.hasSelection(),
        });

        registry.registerCommand(TeacherEditorCommands.SUGGEST_IMPROVEMENT, {
            execute: () => this.sendSelectionToAgent('teacher-review', 'How can I improve this code?'),
            isEnabled: () => this.hasSelection(),
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: TeacherEditorCommands.EXPLAIN_SELECTION.id,
            keybinding: 'ctrlcmd+shift+e',
            when: 'editorTextFocus && editorHasSelection',
        });
        registry.registerKeybinding({
            command: TeacherEditorCommands.DEBUG_ERROR.id,
            keybinding: 'ctrlcmd+shift+d',
            when: 'editorTextFocus && editorHasSelection',
        });
        registry.registerKeybinding({
            command: TeacherEditorCommands.ASK_WHY.id,
            keybinding: 'ctrlcmd+shift+w',
            when: 'editorTextFocus && editorHasSelection',
        });
    }

    protected hasSelection(): boolean {
        const editor = this.editorManager.currentEditor;
        if (!editor) {
            return false;
        }
        const selection = editor.editor.selection;
        return selection.start.line !== selection.end.line || selection.start.character !== selection.end.character;
    }

    protected getSelection(): { text: string; file: string; range: string } | undefined {
        const editor = this.editorManager.currentEditor;
        if (!editor) {
            return undefined;
        }
        const selection = editor.editor.selection;
        const fullText = editor.editor.document.getText();
        const lines = fullText.split('\n');
        const startLine = selection.start.line;
        const endLine = selection.end.line;
        const selectedLines = lines.slice(startLine, endLine + 1);
        if (selectedLines.length > 0) {
            selectedLines[0] = selectedLines[0].substring(selection.start.character);
            selectedLines[selectedLines.length - 1] = selectedLines[selectedLines.length - 1].substring(0, selection.end.character);
        }
        const text = selectedLines.join('\n');
        if (!text.trim()) {
            return undefined;
        }
        const uri = editor.editor.uri.toString();
        const parts = uri.split('/');
        const file = parts.slice(-2).join('/');
        const range = `L${selection.start.line + 1}-L${selection.end.line + 1}`;
        return { text, file, range };
    }

    protected async sendSelectionToAgent(agentId: string, prompt: string): Promise<void> {
        const sel = this.getSelection();
        if (!sel) {
            return;
        }

        const agentNames: Record<string, string> = {
            'teacher-tutor': 'Tutor',
            'teacher-explain': 'Explain',
            'teacher-review': 'Review',
            'teacher-debugger': 'Debugger',
        };
        const agentName = agentNames[agentId] || agentId;

        this.pulse.set('thinking', { label: `${agentName} analyzing...` });

        // Log to timeline
        this.timeline.addClip({
            agentId,
            agentName,
            action: `${prompt}: ${sel.file}:${sel.range}`,
            category: agentId === 'teacher-review' ? 'review' : agentId === 'teacher-debugger' ? 'code' : 'explanation',
        });

        // Send to agent via handoff
        this.handoff.initiateHandoff({
            fromAgent: 'teacher-editor',
            toAgent: agentId,
            context: {
                selectedCode: sel.text,
                file: sel.file,
                range: sel.range,
                prompt,
            },
            reason: `${prompt} — ${sel.file}:${sel.range}`,
        });

        // Open chat panel to show the response
        try {
            await this.commandRegistry.executeCommand('ai-chat:open');
        } catch {
            // chat panel unavailable
        }

        setTimeout(() => {
            if (this.pulse.state === 'thinking') {
                this.pulse.flashSuggestion(2000, agentName);
            }
        }, 1500);
    }
}
