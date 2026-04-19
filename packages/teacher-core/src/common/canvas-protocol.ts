/* eslint-disable @typescript-eslint/no-explicit-any */

export type CanvasArtifactKind =
    | 'table'
    | 'markdown'
    | 'code'
    | 'list'
    | 'keyValue'
    | 'chart'
    | 'connections';

export interface CanvasArtifactBase {
    id: string;
    kind: CanvasArtifactKind;
    title: string;
    createdAt: number;
    sourceAgent?: string;
}

export interface CanvasTableArtifact extends CanvasArtifactBase {
    kind: 'table';
    headers: string[];
    rows: string[][];
}

export interface CanvasMarkdownArtifact extends CanvasArtifactBase {
    kind: 'markdown';
    body: string;
}

export interface CanvasCodeArtifact extends CanvasArtifactBase {
    kind: 'code';
    language: string;
    content: string;
}

export interface CanvasListArtifact extends CanvasArtifactBase {
    kind: 'list';
    items: string[];
    ordered?: boolean;
}

export interface CanvasKeyValueArtifact extends CanvasArtifactBase {
    kind: 'keyValue';
    entries: { key: string; value: string }[];
}

export interface CanvasChartBarSeries {
    label: string;
    value: number;
}

export interface CanvasChartArtifact extends CanvasArtifactBase {
    kind: 'chart';
    chartType: 'bar';
    series: CanvasChartBarSeries[];
    unit?: string;
}

export interface CanvasConnectionsNode {
    id: string;
    label: string;
    /** Optional cluster tag — nodes sharing a group render in the same color band. */
    group?: string;
    /** Optional free-form attributes. Rendered on hover. */
    attrs?: Record<string, string>;
}

export interface CanvasConnectionsEdge {
    source: string;
    target: string;
    /** Optional explanation: why are these two connected? Drives the "coincidence" → "pattern" reveal. */
    label?: string;
    /** Optional weight 0..1 — thicker edge = stronger / more load-bearing connection. */
    weight?: number;
}

/**
 * A node-edge graph rendered in-widget as an SVG circle layout.
 *
 * Use case: pattern recognition across "unrelated" entities. When you lay
 * names side by side and draw edges for shared attributes, the
 * coincidences stop looking like coincidences. Surfaces structure in
 * skill libraries, knowledge-base entries, incident timelines, or any
 * set of items with overlapping metadata.
 */
export interface CanvasConnectionsArtifact extends CanvasArtifactBase {
    kind: 'connections';
    nodes: CanvasConnectionsNode[];
    edges: CanvasConnectionsEdge[];
    /** Optional caption shown above the graph. */
    caption?: string;
}

export type CanvasArtifact =
    | CanvasTableArtifact
    | CanvasMarkdownArtifact
    | CanvasCodeArtifact
    | CanvasListArtifact
    | CanvasKeyValueArtifact
    | CanvasChartArtifact
    | CanvasConnectionsArtifact;

/**
 * Input accepted by CanvasService#add. A discriminated union where each
 * member matches its CanvasArtifact counterpart but with `id` optional
 * and `createdAt` omitted (assigned by the service). Written out member
 * by member because `Omit<CanvasArtifact, 'id' | 'createdAt'>` collapses
 * kind-specific fields on a TS discriminated union.
 */
export type CanvasArtifactInput =
    | (Omit<CanvasTableArtifact,       'id' | 'createdAt'> & { id?: string })
    | (Omit<CanvasMarkdownArtifact,    'id' | 'createdAt'> & { id?: string })
    | (Omit<CanvasCodeArtifact,        'id' | 'createdAt'> & { id?: string })
    | (Omit<CanvasListArtifact,        'id' | 'createdAt'> & { id?: string })
    | (Omit<CanvasKeyValueArtifact,    'id' | 'createdAt'> & { id?: string })
    | (Omit<CanvasChartArtifact,       'id' | 'createdAt'> & { id?: string })
    | (Omit<CanvasConnectionsArtifact, 'id' | 'createdAt'> & { id?: string });
