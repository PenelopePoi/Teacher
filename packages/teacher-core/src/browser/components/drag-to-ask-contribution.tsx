import { injectable, inject } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { QuickInputService } from '@theia/core/lib/common';
import { MessageService } from '@theia/core/lib/common/message-service';
import { CanvasService } from '../canvas-service';
import { PulseService } from '../pulse/pulse-service';

/**
 * §2 item #3 — Drag-to-Ask.
 *
 * A floating orb anchored at bottom-right. Accepts dropped text selections
 * from anywhere in the workspace. On drop, opens a QuickInput pre-seeded
 * with the dragged text and routes the resulting prompt as a Canvas
 * artifact (a markdown artifact titled "Ask about: …").
 *
 * Keeps the chat surface out of the way: selection → orb → one-line
 * prompt. Gesture replaces @-mention.
 *
 * Renders imperatively (not via ReactWidget) because it must exist at
 * the <body> z-top layer, above every Theia panel, regardless of dock
 * state.
 */

const HOST_ID = 'teacher-drag-to-ask-host';

@injectable()
export class DragToAskContribution implements FrontendApplicationContribution {

    @inject(QuickInputService) protected readonly quickInput: QuickInputService;
    @inject(MessageService)    protected readonly messageService: MessageService;
    @inject(CanvasService)     protected readonly canvasService: CanvasService;
    @inject(PulseService)      protected readonly pulseService: PulseService;

    protected host: HTMLElement | undefined;
    protected isHot = false;

    onStart(): void {
        this.mount();
    }

    onStop(): void {
        this.host?.remove();
        this.host = undefined;
    }

    protected mount(): void {
        if (document.getElementById(HOST_ID)) { return; }

        const host = document.createElement('div');
        host.id = HOST_ID;
        host.className = 'teacher-drag-to-ask';
        host.setAttribute('role', 'button');
        host.setAttribute('aria-label', 'Drag selection here to ask Teacher');
        host.title = 'Drag a selection here, or click to ask';
        host.innerHTML = `
            <span class="teacher-drag-to-ask-orb teacher-breathing" aria-hidden="true"></span>
            <span class="teacher-drag-to-ask-label">Ask</span>
        `;
        host.addEventListener('dragover',  this.onDragOver);
        host.addEventListener('dragleave', this.onDragLeave);
        host.addEventListener('drop',      this.onDrop);
        host.addEventListener('click',     this.onClick);
        document.body.appendChild(host);
        this.host = host;
    }

    protected onDragOver = (e: DragEvent): void => {
        if (!e.dataTransfer) { return; }
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (!this.isHot) {
            this.isHot = true;
            this.host?.classList.add('teacher-drag-to-ask--hot');
        }
    };

    protected onDragLeave = (): void => {
        this.isHot = false;
        this.host?.classList.remove('teacher-drag-to-ask--hot');
    };

    protected onDrop = async (e: DragEvent): Promise<void> => {
        e.preventDefault();
        this.isHot = false;
        this.host?.classList.remove('teacher-drag-to-ask--hot');
        const text = (e.dataTransfer?.getData('text/plain') ?? '').trim();
        if (!text) {
            this.messageService.warn('Drag-to-Ask: the drop had no text. Select something first, then drag.');
            return;
        }
        await this.askAbout(text);
    };

    protected onClick = async (): Promise<void> => {
        await this.askAbout();
    };

    protected async askAbout(seed?: string): Promise<void> {
        const preview = seed && seed.length > 120 ? seed.slice(0, 120) + '…' : seed;
        const prompt = await this.quickInput.input({
            prompt: seed
                ? `Ask about this selection (${preview?.length} chars)`
                : 'What do you want to ask Teacher?',
            placeHolder: seed ? 'e.g. explain · refactor · write a test for this' : 'Free-form prompt',
        });
        if (prompt === undefined || prompt.trim() === '') {
            return;
        }

        this.pulseService.flashSuggestion(1200, 'Ask queued');

        const body = seed
            ? `**Prompt:** ${prompt}\n\n---\n\n\`\`\`\n${seed}\n\`\`\``
            : `**Prompt:** ${prompt}`;

        this.canvasService.add({
            kind: 'markdown',
            title: `Ask · ${prompt.slice(0, 60)}${prompt.length > 60 ? '…' : ''}`,
            sourceAgent: 'Drag-to-Ask',
            body,
        });
    }
}
