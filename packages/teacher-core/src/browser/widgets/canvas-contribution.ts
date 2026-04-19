import { injectable, inject } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, nls } from '@theia/core/lib/common';
import { AbstractViewContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { CanvasWidget } from './canvas-widget';
import { CanvasService } from '../canvas-service';

export const CanvasOpenCommand: Command = {
    id: 'teacher.canvas.open',
    category: 'Teacher',
    label: nls.localize('theia/teacher/canvasOpen', 'Teacher: Open Canvas'),
};

export const CanvasDemoCommand: Command = {
    id: 'teacher.canvas.demo',
    category: 'Teacher',
    label: nls.localize('theia/teacher/canvasDemo', 'Teacher: Canvas — Seed Demo Artifacts'),
};

export const CanvasClearCommand: Command = {
    id: 'teacher.canvas.clear',
    category: 'Teacher',
    label: nls.localize('theia/teacher/canvasClear', 'Teacher: Canvas — Clear All'),
};

@injectable()
export class CanvasContribution extends AbstractViewContribution<CanvasWidget> {

    @inject(CanvasService)
    protected readonly canvasService: CanvasService;

    constructor() {
        super({
            widgetId: CanvasWidget.ID,
            widgetName: CanvasWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 400,
            },
            toggleCommandId: CanvasOpenCommand.id,
            toggleKeybinding: 'ctrlcmd+alt+c',
        });
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);

        registry.registerCommand(CanvasDemoCommand, {
            execute: () => {
                this.canvasService.add({
                    kind: 'table',
                    title: 'Skill Library — by category',
                    sourceAgent: 'Teacher Canvas demo',
                    headers: ['Category', 'Skills', 'Avg. quality'],
                    rows: [
                        ['Security',   '22', '8.4'],
                        ['AI / ML',     '9', '8.7'],
                        ['Creative',   '17', '8.2'],
                        ['Client ops',  '7', '8.1'],
                        ['Ethics',      '6', '9.1'],
                    ],
                });
                this.canvasService.add({
                    kind: 'keyValue',
                    title: 'ASI Health',
                    sourceAgent: 'Teacher Canvas demo',
                    entries: [
                        { key: 'Ollama',     value: 'up' },
                        { key: 'KB entries', value: '20 (avg 10.05)' },
                        { key: 'Skills',     value: '317' },
                        { key: 'Agents',     value: '5 x 3 rounds' },
                    ],
                });
                this.canvasService.add({
                    kind: 'chart',
                    chartType: 'bar',
                    title: 'Recent score history',
                    sourceAgent: 'Teacher Canvas demo',
                    unit: '/ 10',
                    series: [
                        { label: 'Signal flow',    value: 8.4 },
                        { label: '808 synthesis',  value: 8.2 },
                        { label: 'Small biz sec',  value: 8.6 },
                        { label: '808 synthesis',  value: 7.8 },
                        { label: 'Small biz sec',  value: 8.6 },
                    ],
                });
                this.canvasService.add({
                    kind: 'list',
                    title: 'Cursor-inspired features shipping today',
                    sourceAgent: 'Teacher Canvas demo',
                    ordered: true,
                    items: [
                        'Canvas widget with six artifact kinds',
                        'Voice input (Ctrl+Alt+M) via the Web Speech API',
                        'Learning Workspace preset command',
                        'Keybindings for fast toggle',
                    ],
                });
                this.openView({ reveal: true, activate: true });
            },
        });

        registry.registerCommand(CanvasClearCommand, {
            execute: () => this.canvasService.clear(),
        });
    }

    override registerKeybindings(bindings: KeybindingRegistry): void {
        super.registerKeybindings(bindings);
    }
}
