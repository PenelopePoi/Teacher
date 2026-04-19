import { injectable, inject } from '@theia/core/shared/inversify';
import { Command, CommandContribution, CommandRegistry, nls } from '@theia/core/lib/common';
import { MessageService } from '@theia/core/lib/common/message-service';
import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';
import { ASIBridgeService } from '../../common/asi-bridge-protocol';
import { CanvasService } from '../canvas-service';

export const ExportSnapshotCommand: Command = {
    id: 'teacher.knowledge.export',
    category: 'Teacher',
    label: nls.localize(
        'theia/teacher/exportSnapshot',
        'Teacher: Export Knowledge Snapshot',
    ),
};

export const DetectAnomaliesCommand: Command = {
    id: 'teacher.knowledge.detectAnomalies',
    category: 'Teacher',
    label: nls.localize(
        'theia/teacher/detectAnomalies',
        'Teacher: Knowledge — Scan for Anomalies',
    ),
};

@injectable()
export class KnowledgeSurvivorshipContribution implements CommandContribution {

    @inject(ASIBridgeService)
    protected readonly asiBridge: ASIBridgeService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(ClipboardService)
    protected readonly clipboard: ClipboardService;

    @inject(CanvasService)
    protected readonly canvasService: CanvasService;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(ExportSnapshotCommand, {
            execute: () => this.runExport(),
        });
        registry.registerCommand(DetectAnomaliesCommand, {
            execute: () => this.runAnomalyScan(),
        });
    }

    protected async runExport(): Promise<void> {
        const pending = this.messageService.info(
            nls.localize('theia/teacher/exportRunning', 'Exporting knowledge snapshot…'),
        );
        try {
            const result = await this.asiBridge.exportKnowledgeSnapshot();
            if (!result.ok || !result.path) {
                this.messageService.error(nls.localize(
                    'theia/teacher/exportFailed',
                    'Snapshot failed: {0}',
                    result.error || 'unknown error',
                ));
                return;
            }
            const kb = ((result.bytes ?? 0) / 1024).toFixed(1);
            const copy = nls.localize('theia/teacher/exportCopyPath', 'Copy path');
            const showInCanvas = nls.localize('theia/teacher/exportShowCanvas', 'Show in Canvas');
            const action = await this.messageService.info(
                nls.localize(
                    'theia/teacher/exportDone',
                    'Snapshot written: {0} ({1} files, {2} KB).',
                    result.path,
                    String(result.fileCount ?? '?'),
                    kb,
                ),
                copy,
                showInCanvas,
            );
            if (action === copy) {
                await this.clipboard.writeText(result.path);
            } else if (action === showInCanvas) {
                this.canvasService.add({
                    kind: 'keyValue',
                    title: 'Last knowledge snapshot',
                    sourceAgent: 'Teacher export',
                    entries: [
                        { key: 'Path',      value: result.path },
                        { key: 'Bytes',     value: String(result.bytes ?? '—') },
                        { key: 'File count', value: String(result.fileCount ?? '—') },
                        { key: 'Elapsed (s)', value: String(result.elapsedSeconds ?? '—') },
                    ],
                });
            }
        } finally {
            pending.then(msg => { /* info messages resolve when dismissed — swallow */ return msg; });
        }
    }

    protected async runAnomalyScan(): Promise<void> {
        const result = await this.asiBridge.detectAnomalies();
        if (!result.ok) {
            this.messageService.error(nls.localize(
                'theia/teacher/anomaliesFailed',
                'Anomaly scan failed: {0}',
                result.error || 'unknown error',
            ));
            return;
        }
        if (result.findingsTotal === 0) {
            this.messageService.info(nls.localize(
                'theia/teacher/anomaliesClear',
                'Anomaly scan: no findings. Report: {0}',
                result.markdownPath || result.jsonPath || '—',
            ));
            return;
        }
        const copy = nls.localize('theia/teacher/exportCopyPath', 'Copy path');
        const showInCanvas = nls.localize('theia/teacher/exportShowCanvas', 'Show in Canvas');
        const action = await this.messageService.warn(
            nls.localize(
                'theia/teacher/anomaliesFound',
                'Anomaly scan: {0} findings. Report: {1}',
                String(result.findingsTotal),
                result.markdownPath || result.jsonPath || '—',
            ),
            copy,
            showInCanvas,
        );
        if (action === copy && result.markdownPath) {
            await this.clipboard.writeText(result.markdownPath);
        } else if (action === showInCanvas) {
            this.canvasService.add({
                kind: 'keyValue',
                title: 'Last anomaly scan',
                sourceAgent: 'Teacher anomaly detector',
                entries: [
                    { key: 'Findings',  value: String(result.findingsTotal) },
                    { key: 'Markdown',  value: result.markdownPath || '—' },
                    { key: 'JSON',      value: result.jsonPath || '—' },
                ],
            });
        }
    }
}
