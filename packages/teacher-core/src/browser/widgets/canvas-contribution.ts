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
                        'Canvas widget with seven artifact kinds',
                        'Voice input (Ctrl+Alt+M) via the Web Speech API',
                        'Learning Workspace preset command',
                        'Keybindings for fast toggle',
                    ],
                });
                this.canvasService.add({
                    kind: 'connections',
                    title: 'Reconsumeralization ecosystem — shared infrastructure',
                    sourceAgent: 'Teacher Canvas demo',
                    caption: 'Lay the projects side by side. The coincidences stop looking like coincidences.',
                    nodes: [
                        { id: 'teacher',   label: 'Teacher IDE',        group: 'product' },
                        { id: 'sands',     label: 'Soul & Sentence',    group: 'product' },
                        { id: 'xela',      label: 'XELA Creative',      group: 'product' },
                        { id: 'asi',       label: 'Local ASI',          group: 'infra',  attrs: { role: 'multi-agent swarm' } },
                        { id: 'mcp',       label: 'teacher-link MCP',   group: 'infra' },
                        { id: 'skills',    label: '326-skill library',  group: 'infra' },
                        { id: 'vercel',    label: 'Vercel hosting',     group: 'infra' },
                        { id: 'github',    label: 'PenelopePoi GitHub', group: 'infra' },
                    ],
                    edges: [
                        { source: 'teacher', target: 'asi',    label: 'runs against', weight: 0.9 },
                        { source: 'teacher', target: 'mcp',    label: 'exposes',      weight: 0.9 },
                        { source: 'teacher', target: 'skills', label: 'uses',         weight: 0.7 },
                        { source: 'asi',     target: 'skills', label: 'indexes',      weight: 0.6 },
                        { source: 'asi',     target: 'mcp',    label: 'behind',       weight: 0.8 },
                        { source: 'teacher', target: 'github', label: 'published',    weight: 0.6 },
                        { source: 'sands',   target: 'github', label: 'published',    weight: 0.6 },
                        { source: 'sands',   target: 'vercel', label: 'deployed',     weight: 0.7 },
                        { source: 'teacher', target: 'vercel', label: 'marketing',    weight: 0.5 },
                        { source: 'xela',    target: 'vercel', label: 'marketing',    weight: 0.5 },
                        { source: 'xela',    target: 'teacher', label: 'funds',       weight: 1.0 },
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
