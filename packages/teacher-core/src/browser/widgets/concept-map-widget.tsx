import { ReactWidget } from '@theia/core/lib/browser';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';

interface ConceptNode {
    readonly id: string;
    readonly name: string;
    readonly cluster: string;
    readonly x: number;
    readonly y: number;
    readonly mastery: number; // 0-1
}

interface ConceptEdge {
    readonly from: string;
    readonly to: string;
}

const DEMO_CLUSTERS = ['JavaScript', 'CSS', 'React', 'Tools'];

const DEMO_NODES: ConceptNode[] = [
    // JavaScript cluster (left area)
    { id: 'n1', name: 'Variables', cluster: 'JavaScript', x: 80, y: 60, mastery: 0.9 },
    { id: 'n2', name: 'Functions', cluster: 'JavaScript', x: 160, y: 40, mastery: 0.85 },
    { id: 'n3', name: 'Arrays', cluster: 'JavaScript', x: 140, y: 110, mastery: 0.7 },
    { id: 'n4', name: 'Promises', cluster: 'JavaScript', x: 60, y: 140, mastery: 0.3 },
    // CSS cluster (top-right)
    { id: 'n5', name: 'Flexbox', cluster: 'CSS', x: 340, y: 50, mastery: 0.75 },
    { id: 'n6', name: 'Grid', cluster: 'CSS', x: 420, y: 30, mastery: 0.4 },
    { id: 'n7', name: 'Variables', cluster: 'CSS', x: 380, y: 100, mastery: 0.6 },
    { id: 'n8', name: 'Animations', cluster: 'CSS', x: 460, y: 90, mastery: 0.2 },
    // React cluster (bottom-right)
    { id: 'n9', name: 'Components', cluster: 'React', x: 340, y: 200, mastery: 0.5 },
    { id: 'n10', name: 'Hooks', cluster: 'React', x: 420, y: 220, mastery: 0.25 },
    { id: 'n11', name: 'JSX', cluster: 'React', x: 360, y: 260, mastery: 0.65 },
    { id: 'n12', name: 'Props', cluster: 'React', x: 440, y: 170, mastery: 0.55 },
    // Tools cluster (bottom-left)
    { id: 'n13', name: 'Git', cluster: 'Tools', x: 100, y: 230, mastery: 0.6 },
    { id: 'n14', name: 'npm', cluster: 'Tools', x: 170, y: 260, mastery: 0.5 },
    { id: 'n15', name: 'TypeScript', cluster: 'Tools', x: 60, y: 280, mastery: 0.15 },
];

const DEMO_EDGES: ConceptEdge[] = [
    { from: 'n1', to: 'n2' }, { from: 'n1', to: 'n3' }, { from: 'n2', to: 'n4' },
    { from: 'n3', to: 'n4' }, { from: 'n5', to: 'n6' }, { from: 'n5', to: 'n7' },
    { from: 'n7', to: 'n8' }, { from: 'n9', to: 'n10' }, { from: 'n9', to: 'n11' },
    { from: 'n9', to: 'n12' }, { from: 'n2', to: 'n9' }, { from: 'n3', to: 'n9' },
    { from: 'n13', to: 'n14' }, { from: 'n14', to: 'n15' }, { from: 'n1', to: 'n15' },
    { from: 'n6', to: 'n11' },
];

const CLUSTER_COLORS: Record<string, string> = {
    'JavaScript': 'var(--teacher-accent)',
    'CSS': '#7B9BD1',
    'React': '#4FB286',
    'Tools': '#C79BE8',
};

@injectable()
export class ConceptMapWidget extends ReactWidget {

    static readonly ID = 'teacher-concept-map';
    static readonly LABEL = nls.localize('theia/teacher/conceptMap', 'Concept Map');

    protected nodes: ConceptNode[] = DEMO_NODES;
    protected edges: ConceptEdge[] = DEMO_EDGES;
    protected selectedNode: string | undefined;

    @postConstruct()
    protected init(): void {
        this.id = ConceptMapWidget.ID;
        this.title.label = ConceptMapWidget.LABEL;
        this.title.caption = ConceptMapWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-type-hierarchy-sub';
        this.addClass('teacher-concept-map');
        this.update();
    }

    protected handleNodeClick = (nodeId: string): void => {
        this.selectedNode = this.selectedNode === nodeId ? undefined : nodeId;
        this.update();
    };

    protected render(): React.ReactNode {
        const selected = this.nodes.find(n => n.id === this.selectedNode);

        return (
            <div className='teacher-concept-map-container'>
                <div className='teacher-concept-map-header'>
                    <h2 className='teacher-concept-map-title'>
                        <i className='codicon codicon-type-hierarchy-sub'></i>
                        {nls.localize('theia/teacher/conceptMapTitle', 'Concept Map')}
                    </h2>
                    <span className='teacher-concept-map-count'>
                        {nls.localize('theia/teacher/conceptMapNodes', '{0} concepts', this.nodes.length)}
                    </span>
                </div>
                <div className='teacher-concept-map-legend'>
                    {DEMO_CLUSTERS.map(cluster => (
                        <span key={cluster} className='teacher-concept-map-legend-item'>
                            <span
                                className='teacher-concept-map-legend-dot'
                                style={{ background: CLUSTER_COLORS[cluster] }}
                            ></span>
                            {cluster}
                        </span>
                    ))}
                </div>
                <div className='teacher-concept-map-canvas'>
                    <svg className='teacher-concept-map-svg' viewBox='0 0 520 320' preserveAspectRatio='xMidYMid meet'>
                        {this.edges.map((edge, i) => this.renderEdge(edge, i))}
                        {this.nodes.map(node => this.renderNode(node))}
                    </svg>
                </div>
                {selected && this.renderDetail(selected)}
            </div>
        );
    }

    protected renderEdge(edge: ConceptEdge, index: number): React.ReactNode {
        const from = this.nodes.find(n => n.id === edge.from);
        const to = this.nodes.find(n => n.id === edge.to);
        if (!from || !to) {
            return null;
        }
        return (
            <line
                key={`edge-${index}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className='teacher-concept-map-edge'
                stroke='var(--teacher-border-subtle)'
                strokeWidth='1.5'
                strokeOpacity='0.5'
            />
        );
    }

    protected renderNode(node: ConceptNode): React.ReactNode {
        const color = CLUSTER_COLORS[node.cluster] ?? 'var(--teacher-text-tertiary)';
        const radius = 14 + node.mastery * 8;
        const isSelected = this.selectedNode === node.id;

        return (
            <g key={node.id} onClick={() => this.handleNodeClick(node.id)} style={{ cursor: 'pointer' }}>
                <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius}
                    fill={color}
                    fillOpacity={0.15 + node.mastery * 0.5}
                    stroke={isSelected ? 'var(--teacher-text-primary)' : color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeOpacity={0.8}
                />
                <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor='middle'
                    fill='var(--teacher-text-primary)'
                    fontSize='10'
                    fontFamily='var(--teacher-font-ui)'
                >
                    {node.name}
                </text>
            </g>
        );
    }

    protected renderDetail(node: ConceptNode): React.ReactNode {
        return (
            <div className='teacher-concept-map-detail'>
                <div className='teacher-concept-map-detail-header'>
                    <span
                        className='teacher-concept-map-detail-dot'
                        style={{ background: CLUSTER_COLORS[node.cluster] }}
                    ></span>
                    <strong>{node.name}</strong>
                    <span className='teacher-concept-map-detail-cluster'>{node.cluster}</span>
                </div>
                <div className='teacher-concept-map-detail-bar'>
                    <div
                        className='teacher-concept-map-detail-bar-fill'
                        style={{ width: `${node.mastery * 100}%`, background: CLUSTER_COLORS[node.cluster] }}
                    ></div>
                </div>
                <span className='teacher-concept-map-detail-mastery'>
                    {nls.localize('theia/teacher/conceptMastery', '{0}% mastered', Math.round(node.mastery * 100))}
                </span>
            </div>
        );
    }
}
