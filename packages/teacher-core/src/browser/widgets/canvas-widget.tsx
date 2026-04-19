import { ReactWidget } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { CanvasService } from '../canvas-service';
import {
    CanvasArtifact,
    CanvasChartArtifact,
    CanvasCodeArtifact,
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
                    >
                        <i className="codicon codicon-clear-all" />
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
                <i className="codicon codicon-preview teacher-canvas-empty-icon" />
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
                        onClick={() => this.canvasService.remove(artifact.id)}
                    >
                        <i className="codicon codicon-close" />
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
            case 'table':    return this.renderTable(artifact);
            case 'markdown': return this.renderMarkdown(artifact);
            case 'code':     return this.renderCode(artifact);
            case 'list':     return this.renderList(artifact);
            case 'keyValue': return this.renderKeyValue(artifact);
            case 'chart':    return this.renderChart(artifact);
            default:         return undefined;
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

    protected clearAll = (): void => {
        this.canvasService.clear();
    };

    protected formatTime(ts: number): string {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}
