import { ReactWidget } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { CanvasService } from '../canvas-service';
import {
    CanvasArtifact,
    CanvasChartArtifact,
    CanvasCodeArtifact,
    CanvasConnectionsArtifact,
    CanvasKeyValueArtifact,
    CanvasListArtifact,
    CanvasMarkdownArtifact,
    CanvasTableArtifact,
} from '../../common/canvas-protocol';

@injectable()
export class CanvasWidget extends ReactWidget {

    static readonly ID = 'teacher-canvas-widget';
    static readonly LABEL = nls.localize('theia/teacher/canvas', 'Teacher Canvas');

    @inject(CanvasService)
    protected readonly canvasService: CanvasService;

    @postConstruct()
    protected init(): void {
        this.id = CanvasWidget.ID;
        this.title.label = CanvasWidget.LABEL;
        this.title.caption = CanvasWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-preview';
        this.addClass('teacher-canvas-widget');
        this.toDispose.push(this.canvasService.onDidChange(() => this.update()));
    }

    protected render(): React.ReactNode {
        const artifacts = this.canvasService.artifacts;
        if (artifacts.length === 0) {
            return this.renderEmpty();
        }
        return (
            <div className="teacher-canvas-container">
                <div className="teacher-canvas-header">
                    <h2 className="teacher-canvas-title">
                        <i className="codicon codicon-preview" />
                        {CanvasWidget.LABEL}
                        <span className="teacher-canvas-count">{artifacts.length}</span>
                    </h2>
                    <button
                        type="button"
                        className="theia-button secondary teacher-canvas-clear-btn"
                        onClick={this.clearAll}
                        title={nls.localize('theia/teacher/canvasClear', 'Clear all artifacts')}
                        aria-label={nls.localize('theia/teacher/canvasClear', 'Clear all artifacts')}
                    >
                        <i className="codicon codicon-clear-all" aria-hidden="true" />
                        {nls.localize('theia/teacher/canvasClearLabel', 'Clear')}
                    </button>
                </div>
                <div className="teacher-canvas-artifacts">
                    {artifacts.map(a => this.renderArtifact(a))}
                </div>
            </div>
        );
    }

    protected renderEmpty(): React.ReactNode {
        return (
            <div className="teacher-canvas-empty">
                <i className="codicon codicon-preview teacher-canvas-empty-icon" aria-hidden="true" />
                <p className="teacher-canvas-empty-title">
                    {nls.localize('theia/teacher/canvasEmptyTitle', 'Canvas is empty')}
                </p>
                <p className="teacher-canvas-empty-body">
                    {nls.localize(
                        'theia/teacher/canvasEmptyBody',
                        'Agents can send structured artifacts here — tables, diagrams, code, lists, and charts. Artifacts appear as durable cards you can reference later.',
                    )}
                </p>
            </div>
        );
    }

    protected renderArtifact(artifact: CanvasArtifact): React.ReactNode {
        return (
            <article key={artifact.id} className="teacher-canvas-artifact" data-kind={artifact.kind}>
                <header className="teacher-canvas-artifact-header">
                    <span className="teacher-canvas-artifact-kind">{artifact.kind}</span>
                    <h3 className="teacher-canvas-artifact-title">{artifact.title}</h3>
                    <span className="teacher-canvas-artifact-time">{this.formatTime(artifact.createdAt)}</span>
                    <button
                        type="button"
                        className="teacher-canvas-artifact-remove"
                        title={nls.localize('theia/teacher/canvasRemove', 'Remove artifact')}
                        aria-label={nls.localize('theia/teacher/canvasRemove', 'Remove artifact')}
                        onClick={() => this.canvasService.remove(artifact.id)}
                    >
                        <i className="codicon codicon-close" aria-hidden="true" />
                    </button>
                </header>
                <div className="teacher-canvas-artifact-body">
                    {this.renderBody(artifact)}
                </div>
                {artifact.sourceAgent && (
                    <footer className="teacher-canvas-artifact-footer">
                        <i className="codicon codicon-hubot" />
                        <span>{artifact.sourceAgent}</span>
                    </footer>
                )}
            </article>
        );
    }

    protected renderBody(artifact: CanvasArtifact): React.ReactNode {
        switch (artifact.kind) {
            case 'table':       return this.renderTable(artifact);
            case 'markdown':    return this.renderMarkdown(artifact);
            case 'code':        return this.renderCode(artifact);
            case 'list':        return this.renderList(artifact);
            case 'keyValue':    return this.renderKeyValue(artifact);
            case 'chart':       return this.renderChart(artifact);
            case 'connections': return this.renderConnections(artifact);
            default:            return undefined;
        }
    }

    protected renderTable(a: CanvasTableArtifact): React.ReactNode {
        return (
            <table className="teacher-canvas-table">
                <thead>
                    <tr>{a.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
                </thead>
                <tbody>
                    {a.rows.map((row, i) => (
                        <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                    ))}
                </tbody>
            </table>
        );
    }

    protected renderMarkdown(a: CanvasMarkdownArtifact): React.ReactNode {
        // Plain-text fallback rendering. For full markdown, a MarkdownRenderer could be injected.
        return <pre className="teacher-canvas-markdown">{a.body}</pre>;
    }

    protected renderCode(a: CanvasCodeArtifact): React.ReactNode {
        return (
            <pre className={`teacher-canvas-code language-${a.language}`}>
                <code>{a.content}</code>
            </pre>
        );
    }

    protected renderList(a: CanvasListArtifact): React.ReactNode {
        const Tag = a.ordered ? 'ol' : 'ul';
        return (
            <Tag className="teacher-canvas-list">
                {a.items.map((item, i) => <li key={i}>{item}</li>)}
            </Tag>
        );
    }

    protected renderKeyValue(a: CanvasKeyValueArtifact): React.ReactNode {
        return (
            <dl className="teacher-canvas-keyvalue">
                {a.entries.map((entry, i) => (
                    <div key={i} className="teacher-canvas-keyvalue-row">
                        <dt>{entry.key}</dt>
                        <dd>{entry.value}</dd>
                    </div>
                ))}
            </dl>
        );
    }

    protected renderChart(a: CanvasChartArtifact): React.ReactNode {
        const max = Math.max(1, ...a.series.map(s => s.value));
        return (
            <div className="teacher-canvas-chart">
                {a.series.map((s, i) => (
                    <div key={i} className="teacher-canvas-chart-row">
                        <span className="teacher-canvas-chart-label">{s.label}</span>
                        <div className="teacher-canvas-chart-bar">
                            <div className="teacher-canvas-chart-bar-fill" style={{ width: `${(s.value / max) * 100}%` }} />
                        </div>
                        <span className="teacher-canvas-chart-value">
                            {s.value}{a.unit ? ` ${a.unit}` : ''}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    protected renderConnections(a: CanvasConnectionsArtifact): React.ReactNode {
        const size = 420;
        const cx = size / 2;
        const cy = size / 2;
        const radius = size / 2 - 60;
        const n = Math.max(1, a.nodes.length);

        const nodePos = new Map<string, { x: number; y: number; angle: number }>();
        a.nodes.forEach((node, i) => {
            const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
            nodePos.set(node.id, {
                x: cx + Math.cos(angle) * radius,
                y: cy + Math.sin(angle) * radius,
                angle,
            });
        });

        const groups = Array.from(new Set(a.nodes.map(node => node.group ?? '_default')));
        const groupColorVar = (group: string | undefined): string => {
            const idx = groups.indexOf(group ?? '_default');
            const palette = [
                'var(--theia-textLink-foreground)',
                'var(--theia-testing-iconPassed)',
                'var(--theia-testing-iconFailed)',
                'var(--theia-progressBar-background)',
                'var(--theia-button-background)',
            ];
            return palette[idx % palette.length];
        };

        return (
            <div className="teacher-canvas-connections">
                {a.caption && <p className="teacher-canvas-connections-caption">{a.caption}</p>}
                <svg
                    viewBox={`0 0 ${size} ${size}`}
                    className="teacher-canvas-connections-svg"
                    role="img"
                    aria-label={a.title}
                >
                    <g className="teacher-canvas-connections-edges">
                        {a.edges.map((edge, i) => {
                            const src = nodePos.get(edge.source);
                            const tgt = nodePos.get(edge.target);
                            if (!src || !tgt) { return undefined; }
                            const midX = (src.x + tgt.x) / 2;
                            const midY = (src.y + tgt.y) / 2;
                            const strokeWidth = 0.8 + (edge.weight ?? 0.5) * 2.2;
                            return (
                                <g key={`edge-${i}`}>
                                    <line
                                        x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                                        strokeWidth={strokeWidth}
                                        className="teacher-canvas-connections-edge"
                                    />
                                    {edge.label && (
                                        <text
                                            x={midX} y={midY}
                                            textAnchor="middle"
                                            dy="-4"
                                            className="teacher-canvas-connections-edge-label"
                                        >
                                            {edge.label}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </g>
                    <g className="teacher-canvas-connections-nodes">
                        {a.nodes.map(node => {
                            const pos = nodePos.get(node.id);
                            if (!pos) { return undefined; }
                            const labelOffset = Math.cos(pos.angle) >= 0 ? 16 : -16;
                            const labelAnchor = Math.cos(pos.angle) >= 0 ? 'start' : 'end';
                            const attrsSummary = node.attrs
                                ? Object.entries(node.attrs).map(([k, v]) => `${k}: ${v}`).join('\n')
                                : node.label;
                            return (
                                <g key={node.id} className="teacher-canvas-connections-node">
                                    <title>{attrsSummary}</title>
                                    <circle
                                        cx={pos.x} cy={pos.y} r="8"
                                        fill={groupColorVar(node.group)}
                                    />
                                    <text
                                        x={pos.x + labelOffset}
                                        y={pos.y + 4}
                                        textAnchor={labelAnchor}
                                        className="teacher-canvas-connections-node-label"
                                    >
                                        {node.label}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                </svg>
                {groups.length > 1 && (
                    <ul className="teacher-canvas-connections-legend">
                        {groups.map(g => (
                            <li key={g}>
                                <span
                                    className="teacher-canvas-connections-legend-dot"
                                    style={{ background: groupColorVar(g) }}
                                />
                                {g === '_default' ? 'other' : g}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    }

    protected clearAll = (): void => {
        this.canvasService.clear();
    };

    protected formatTime(ts: number): string {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}
