import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  Panel,
  useReactFlow,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Download, FileCode, Plus, ZoomIn, ZoomOut, Maximize, Layout, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import TableNode from '@/components/dashboard/TableNode';
import dagre from 'dagre';
import { connectionService } from '@/services/connection.service';
import { TableSchema, ERDRelation, DatabaseSchemaPublic } from '@/types';

const nodeTypes = {
  table: TableNode,
};

const nodeWidth = 280;
const nodeHeight = 300;

// Color palette for different tables
const TABLE_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#f43f5e', // rose
  '#84cc16', // lime
  '#06b6d4', // cyan
];

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 150 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// Transform API data to ReactFlow nodes
function transformTablesToNodes(tables: TableSchema[]): Node[] {
  return tables.map((table, index) => ({
    id: `${table.schema_name}.${table.table_name}`,
    type: 'table',
    position: { x: 0, y: 0 },
    data: {
      label: table.table_name,
      color: TABLE_COLORS[index % TABLE_COLORS.length],
      columns: table.columns?.map(col => ({
        name: col.name,
        type: col.data_type,
        isPrimary: col.is_primary_key,
        isForeign: col.is_foreign_key,
      })) || [],
    },
  }));
}

// Transform API relations to ReactFlow edges
function transformRelationsToEdges(relations: ERDRelation[]): Edge[] {
  return relations.map((rel, index) => ({
    id: `e_${rel.source_table}_${rel.target_table}_${index}`,
    source: `${rel.source_schema}.${rel.source_table}`,
    target: `${rel.target_schema}.${rel.target_table}`,
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#64748b', strokeWidth: 1.5 },
    label: rel.source_column,
    labelStyle: { fill: '#94a3b8', fontSize: 10 },
  }));
}

function SchemaVisualizerContent() {
  const { id: connectionId } = useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schemas, setSchemas] = useState<DatabaseSchemaPublic[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<string>('all');
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();

  // Fetch all data for ERD
  const fetchERDData = useCallback(async () => {
    if (!connectionId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch schemas first
      const schemasResponse = await connectionService.getSchemas(connectionId);
      const schemasData = (schemasResponse as any).schemas || schemasResponse.data || [];
      setSchemas(schemasData);

      // Fetch tables for all selected schemas
      const allTables: TableSchema[] = [];
      for (const schema of schemasData.filter((s: DatabaseSchemaPublic) => s.is_selected)) {
        try {
          const tablesResponse = await connectionService.getTablesBySchema(connectionId, schema.schema_name);
          const tables = (tablesResponse as any).tables || tablesResponse.data || [];
          allTables.push(...tables);
        } catch {
          console.warn(`Failed to fetch tables for schema: ${schema.schema_name}`);
        }
      }

      // Fetch relations
      const relationsResponse = await connectionService.getRelations(connectionId);
      const relations = (relationsResponse as any).relations || relationsResponse.data || [];

      // Transform to ReactFlow format
      const newNodes = transformTablesToNodes(allTables);
      const newEdges = transformRelationsToEdges(relations);

      // Apply layout
      if (newNodes.length > 0) {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges, 'LR');
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);

        // Fit view after layout
        setTimeout(() => fitView(), 100);
      } else {
        setNodes([]);
        setEdges([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load ERD data');
    } finally {
      setIsLoading(false);
    }
  }, [connectionId, setNodes, setEdges, fitView]);

  // Load data on mount
  useEffect(() => {
    fetchERDData();
  }, [fetchERDData]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true, style: { stroke: '#64748b', strokeWidth: 1.5 } }, eds)),
    [setEdges]
  );

  const onLayout = useCallback(
    (direction: string) => {
      if (nodes.length === 0) return;

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        direction
      );

      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);

      window.requestAnimationFrame(() => {
        fitView();
      });
    },
    [nodes, edges, setNodes, setEdges, fitView]
  );

  const downloadImage = () => {
    if (reactFlowWrapper.current === null) {
      return;
    }

    toPng(reactFlowWrapper.current, { backgroundColor: '#0f172a' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'schema-diagram.png';
        link.href = dataUrl;
        link.click();
      });
  };

  const exportSQL = () => {
    let sql = '';
    nodes.forEach((node) => {
      const columns = (node.data as any).columns || [];
      sql += `CREATE TABLE ${node.data.label} (\n`;
      columns.forEach((col: any, index: number) => {
        sql += `  ${col.name} ${col.type}${col.isPrimary ? ' PRIMARY KEY' : ''}${index < columns.length - 1 ? ',' : ''}\n`;
      });
      sql += `);\n\n`;
    });

    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'schema.sql';
    link.href = url;
    link.click();
  };

  return (
    <div className="h-screen flex flex-col bg-[#0f172a]">
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-[#1B2431] shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-white">ERD Visualizer</h1>
          <p className="text-xs text-gray-400 hidden md:block">
            {nodes.length > 0
              ? `${nodes.length} tables • ${edges.length} relationships`
              : 'Interactive Entity Relationship Diagram'}
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
            onClick={fetchERDData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 md:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/5 hover:bg-white/10 text-white hidden md:flex"
            onClick={() => onLayout('LR')}
            disabled={nodes.length === 0}
          >
            <Layout className="w-4 h-4 mr-2" />
            Auto Layout
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/5 hover:bg-white/10 text-white hidden md:flex"
            onClick={exportSQL}
            disabled={nodes.length === 0}
          >
            <FileCode className="w-4 h-4 mr-2" />
            Export SQL
          </Button>
          <Button
            size="sm"
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
            onClick={downloadImage}
            disabled={nodes.length === 0}
          >
            <Download className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Export PNG</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 relative pb-24 md:pb-0" ref={reactFlowWrapper}>
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a]/80 z-50">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-gray-400">Loading schema data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a] z-50">
            <div className="flex flex-col items-center gap-3 text-center px-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <p className="text-white font-medium">Failed to load ERD data</p>
              <p className="text-gray-400 text-sm max-w-md">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-white/10 bg-white/5 hover:bg-white/10 text-white"
                onClick={fetchERDData}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a] z-40">
            <div className="flex flex-col items-center gap-3 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                <Layout className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-white font-medium">No tables to visualize</p>
              <p className="text-gray-400 text-sm max-w-md">
                The database schema hasn't been synced yet, or there are no tables in the selected schemas.
              </p>
            </div>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-[#0f172a]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/20 via-[#0f172a] to-[#0f172a] pointer-events-none" />
          <Background color="#334155" gap={20} size={1} variant={undefined} />
          <Controls className="bg-[#1e293b] border-white/10 text-white fill-white [&>button]:border-white/10 [&>button]:bg-[#1e293b] [&>button:hover]:bg-[#334155] [&>button]:text-white mb-24 md:mb-0" />
          <MiniMap
            className="bg-[#1e293b] border border-white/10 rounded-lg overflow-hidden hidden md:block"
            nodeColor={(node) => (node.data as any).color || '#3b82f6'}
            maskColor="rgba(15, 23, 42, 0.8)"
          />
          <Panel position="top-left" className="bg-[#1e293b]/90 backdrop-blur p-2 rounded-lg border border-white/10 shadow-xl hidden md:block">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2">Tools</span>
              <Button variant="ghost" size="sm" className="justify-start text-gray-300 hover:text-white hover:bg-white/5">
                <Plus className="w-4 h-4 mr-2" />
                Add Table
              </Button>
              <Button variant="ghost" size="sm" className="justify-start text-gray-300 hover:text-white hover:bg-white/5">
                <ZoomIn className="w-4 h-4 mr-2" />
                Zoom In
              </Button>
              <Button variant="ghost" size="sm" className="justify-start text-gray-300 hover:text-white hover:bg-white/5">
                <ZoomOut className="w-4 h-4 mr-2" />
                Zoom Out
              </Button>
              <Button variant="ghost" size="sm" className="justify-start text-gray-300 hover:text-white hover:bg-white/5">
                <Maximize className="w-4 h-4 mr-2" />
                Fit View
              </Button>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export default function SchemaVisualizer() {
  return (
    <ReactFlowProvider>
      <SchemaVisualizerContent />
    </ReactFlowProvider>
  );
}
