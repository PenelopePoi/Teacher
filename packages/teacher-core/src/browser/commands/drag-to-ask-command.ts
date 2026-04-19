import { inject, injectable } from '@theia/core/shared/inversify';
import { Command, CommandContribution, CommandRegistry, nls } from '@theia/core';
import { KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import { EditorManager } from '@theia/editor/lib/browser';
import { MessageService } from '@theia/core/lib/common/message-service';
import { DragToAskService } from '../components/drag-to-ask-service';

/**
 * C8 Drag-to-Ask Command — Cmd+Shift+A
 *
 * Grabs the current editor selection, sets it as the subject via
 * DragToAskService, and opens the AI chat panel. If nothing is
 * selected, shows an info message guiding the user.
 *
 * Direct manipulation replaces @-mentions.
 */

export const AskAboutSelectionCommand: Command = Command.toLocalizedCommand(
    { id: 'teacher.askAboutSelection', category: 'Teacher', label: 'Ask About Selection' },
    'theia/teacher/askAboutSelection'
);

@injectable()
export class DragToAskCommandContribution implements CommandContribution, KeybindingContribution {

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(DragToAskService)
    protected readonly dragToAskService: DragToAskService;

    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(AskAboutSelectionCommand, {
            execute: async () => {
                const editor = this.editorManager.currentEditor;
                if (!editor) {
                    this.messageService.info(nls.localize(
                        'theia/teacher/noEditorOpen',
                        'Open a file first, then select code to ask about.'
                    ));
                    return;
                }

                const selection = editor.editor.selection;
                const selectedText = editor.editor.document.getLineContent
                    ? this.getSelectedText(editor)
                    : '';

                if (!selectedText || selectedText.trim().length === 0) {
                    this.messageService.info(nls.localize(
                        'theia/teacher/noSelection',
                        'Select some code first, then press Cmd+Shift+A to ask about it'
                    ));
                    return;
                }

                const uri = editor.editor.uri;
                const fileName = uri.path.base || uri.toString();
                const lineInfo = selection.start.line !== selection.end.line
                    ? `L${selection.start.line + 1}-${selection.end.line + 1}`
                    : `L${selection.start.line + 1}`;
                const source = `${fileName}:${lineInfo}`;

                this.dragToAskService.setSubject(selectedText, source);

                // Open the AI chat panel — the widget ID used by Theia AI chat
                try {
                    await this.shell.activateWidget('ai-chat-view');
                } catch {
                    // Chat panel may not be available; subject is still set
                    // for whenever the user opens chat manually.
                }

                this.messageService.info(nls.localize(
                    'theia/teacher/subjectSet',
                    'Selection staged ({0} chars from {1}). Type your question in the chat.',
                    String(selectedText.length),
                    source
                ));
            },
            isEnabled: () => !!this.editorManager.currentEditor,
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: AskAboutSelectionCommand.id,
            keybinding: 'ctrlcmd+shift+a',
        });
    }

    protected getSelectedText(editor: ReturnType<EditorManager['currentEditor']>): string {
        if (!editor) {
            return '';
        }
        const e = editor.editor;
        const sel = e.selection;
        const doc = e.document;

        // Single-line selection
        if (sel.start.line === sel.end.line) {
            const line = doc.getLineContent(sel.start.line + 1);
            return line.substring(sel.start.character, sel.end.character);
        }

        // Multi-line selection
        const lines: string[] = [];
        for (let i = sel.start.line; i <= sel.end.line; i++) {
            const line = doc.getLineContent(i + 1);
            if (i === sel.start.line) {
                lines.push(line.substring(sel.start.character));
            } else if (i === sel.end.line) {
                lines.push(line.substring(0, sel.end.character));
            } else {
                lines.push(line);
            }
        }
        return lines.join('\n');
    }
}
