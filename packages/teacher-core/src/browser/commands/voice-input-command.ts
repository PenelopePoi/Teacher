import { injectable, inject } from '@theia/core/shared/inversify';
import { Command, CommandContribution, CommandRegistry, nls } from '@theia/core/lib/common';
import { KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { MessageService } from '@theia/core/lib/common/message-service';

export const VoiceInputStartCommand: Command = {
    id: 'teacher.voiceInput.start',
    category: 'Teacher',
    label: nls.localize('theia/teacher/voiceInputStart', 'Teacher: Voice Input — Start Dictation'),
};

export const VoiceInputStopCommand: Command = {
    id: 'teacher.voiceInput.stop',
    category: 'Teacher',
    label: nls.localize('theia/teacher/voiceInputStop', 'Teacher: Voice Input — Stop Dictation'),
};

/*
 * Minimal Web Speech API wrapper. Dictation is written into the focused
 * input / textarea / contenteditable element, which in practice is the
 * active AI Chat input. Activation is press-to-toggle (Ctrl+Alt+M).
 *
 * Availability check is runtime-only because `window.webkitSpeechRecognition`
 * is not in the TypeScript lib.dom yet for all target versions.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

@injectable()
export class VoiceInputContribution implements CommandContribution, KeybindingContribution {

    @inject(MessageService)
    protected readonly messageService: MessageService;

    protected recognition: any;
    protected active = false;
    protected overlay: HTMLElement | undefined;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(VoiceInputStartCommand, {
            execute: () => this.toggle(),
        });
        registry.registerCommand(VoiceInputStopCommand, {
            execute: () => this.stop(),
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: VoiceInputStartCommand.id,
            keybinding: 'ctrlcmd+alt+m',
        });
    }

    protected toggle(): void {
        if (this.active) {
            this.stop();
        } else {
            this.start();
        }
    }

    protected start(): void {
        const target = this.activeTextTarget();
        if (!target) {
            this.messageService.warn(nls.localize(
                'theia/teacher/voiceInputNoFocus',
                'Voice input: focus a text input (e.g. the AI Chat box) first, then activate again.',
            ));
            return;
        }
        const Ctor = (globalThis as any).SpeechRecognition
            ?? (globalThis as any).webkitSpeechRecognition;
        if (!Ctor) {
            this.messageService.error(nls.localize(
                'theia/teacher/voiceInputUnavailable',
                'Voice input: your browser does not support the Web Speech API. Try Chrome, Edge, or Safari.',
            ));
            return;
        }

        const rec = new Ctor();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = (navigator.language || 'en-US');

        rec.onresult = (event: any) => {
            let final = '';
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcript = result[0]?.transcript ?? '';
                if (result.isFinal) {
                    final += transcript;
                } else {
                    interim += transcript;
                }
            }
            if (final) {
                this.appendText(target, final);
            }
            if (this.overlay) {
                this.overlay.textContent = (final + interim).slice(-120).trim()
                    || nls.localize('theia/teacher/voiceInputListening', 'Listening…');
            }
        };
        rec.onerror = (event: any) => {
            this.messageService.warn(`Voice input error: ${String(event.error ?? 'unknown')}`);
            this.stop();
        };
        rec.onend = () => {
            if (this.active) {
                try { rec.start(); } catch { this.stop(); }
            }
        };

        this.recognition = rec;
        this.active = true;
        this.showOverlay();
        try {
            rec.start();
        } catch {
            this.stop();
        }
    }

    protected stop(): void {
        this.active = false;
        try { this.recognition?.stop(); } catch { /* ignore */ }
        this.recognition = undefined;
        this.hideOverlay();
    }

    protected appendText(target: HTMLElement, text: string): void {
        if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
            const start = target.selectionStart ?? target.value.length;
            const end = target.selectionEnd ?? target.value.length;
            const before = target.value.slice(0, start);
            const after = target.value.slice(end);
            const insert = before.length > 0 && !before.endsWith(' ') ? ' ' + text : text;
            target.value = before + insert + after;
            const caret = (before + insert).length;
            target.setSelectionRange(caret, caret);
            target.dispatchEvent(new Event('input', { bubbles: true }));
            return;
        }
        if ((target as HTMLElement).isContentEditable) {
            const sel = document.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(text));
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            } else {
                target.textContent = (target.textContent ?? '') + text;
            }
            target.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }));
        }
    }

    protected activeTextTarget(): HTMLElement | undefined {
        const el = document.activeElement as HTMLElement | null;
        if (!el) {
            return undefined;
        }
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            return el;
        }
        if (el.isContentEditable) {
            return el;
        }
        return undefined;
    }

    protected showOverlay(): void {
        if (this.overlay) {
            return;
        }
        const el = document.createElement('div');
        el.className = 'teacher-voice-overlay';
        el.innerHTML = `
            <span class="teacher-voice-dot"></span>
            <span class="teacher-voice-overlay-text">${nls.localize('theia/teacher/voiceInputListening', 'Listening…')}</span>
            <button type="button" class="teacher-voice-overlay-stop" aria-label="Stop">
                <span class="codicon codicon-debug-stop"></span>
            </button>
        `;
        const stopButton = el.querySelector<HTMLButtonElement>('.teacher-voice-overlay-stop');
        stopButton?.addEventListener('click', () => this.stop());
        document.body.appendChild(el);
        this.overlay = el;
    }

    protected hideOverlay(): void {
        this.overlay?.remove();
        this.overlay = undefined;
    }
}
