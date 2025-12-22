import { useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Relationship } from '../../types';
import { Database, BarChart3, Bell, Network } from 'lucide-react';

interface EntityGraphProps {
  relationships: Relationship[];
}

const getNodeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'dataset':
      return { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' };
    case 'dashboard':
      return { bg: '#e9d5ff', border: '#a855f7', text: '#7e22ce' };
    case 'monitor':
      return { bg: '#dcfce7', border: '#22c55e', text: '#15803d' };
    default:
      return { bg: '#f3f4f6', border: '#6b7280', text: '#374151' };
  }
};

const getIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'dataset':
      return Database;
    case 'dashboard':
      return BarChart3;
    case 'monitor':
      return Bell;
    default:
      return Network;
  }
};

export default function EntityGraph({ relationships }: EntityGraphProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodeMap = new Map<string, Node>();
    const edges: Edge[] = [];

    // Create nodes from relationships
    relationships.forEach((rel) => {
      // Source node
      if (!nodeMap.has(rel.sourceId)) {
        const colors = getNodeColor(rel.sourceType);
        nodeMap.set(rel.sourceId, {
          id: rel.sourceId,
          type: 'default',
          data: {
            label: (
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="w-6 h-6 flex items-center justify-center">
                  {(() => {
                    const Icon = getIcon(rel.sourceType);
                    return <Icon className="w-4 h-4" style={{ color: colors.text }} />;
                  })()}
                </div>
                <div>
                  <div className="font-medium text-sm" style={{ color: colors.text }}>
                    {rel.sourceName}
                  </div>
                  <div className="text-xs opacity-75" style={{ color: colors.text }}>
                    {rel.sourceType}
                  </div>
                </div>
              </div>
            )
          },
          position: { x: 0, y: 0 },
          style: {
            background: colors.bg,
            border: `2px solid ${colors.border}`,
            borderRadius: '8px',
            padding: 0,
            width: 'auto',
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
      }

      // Target node
      if (!nodeMap.has(rel.targetId)) {
        const colors = getNodeColor(rel.targetType);
        nodeMap.set(rel.targetId, {
          id: rel.targetId,
          type: 'default',
          data: {
            label: (
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="w-6 h-6 flex items-center justify-center">
                  {(() => {
                    const Icon = getIcon(rel.targetType);
                    return <Icon className="w-4 h-4" style={{ color: colors.text }} />;
                  })()}
                </div>
                <div>
                  <div className="font-medium text-sm" style={{ color: colors.text }}>
                    {rel.targetName}
                  </div>
                  <div className="text-xs opacity-75" style={{ color: colors.text }}>
                    {rel.targetType}
                  </div>
                </div>
              </div>
            )
          },
          position: { x: 0, y: 0 },
          style: {
            background: colors.bg,
            border: `2px solid ${colors.border}`,
            borderRadius: '8px',
            padding: 0,
            width: 'auto',
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
      }

      // Create edge
      edges.push({
        id: `${rel.sourceId}-${rel.targetId}`,
        source: rel.sourceId,
        target: rel.targetId,
        label: rel.relationshipType,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        style: {
          stroke: '#9333ea',
          strokeWidth: 2,
        },
        labelStyle: {
          fontSize: 10,
          fontWeight: 500,
        },
        labelBgStyle: {
          fill: '#f3e8ff',
        },
      });
    });

    // Simple layout algorithm
    const nodes = Array.from(nodeMap.values());
    const cols = Math.ceil(Math.sqrt(nodes.length));
    nodes.forEach((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      node.position = {
        x: col * 300,
        y: row * 150,
      };
    });

    return { nodes, edges };
  }, [relationships]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  if (relationships.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No relationships to display
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      attributionPosition="bottom-left"
    >
      <Background />
      <Controls />
      <MiniMap
        nodeColor={(node) => {
          const type = relationships.find(
            (r) => r.sourceId === node.id || r.targetId === node.id
          );
          if (type) {
            const colors = getNodeColor(
              type.sourceId === node.id ? type.sourceType : type.targetType
            );
            return colors.border;
          }
          return '#6b7280';
        }}
        maskColor="rgba(0, 0, 0, 0.1)"
      />
    </ReactFlow>
  );
}
