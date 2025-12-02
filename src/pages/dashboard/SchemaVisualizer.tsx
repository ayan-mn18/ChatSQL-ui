import { useCallback, useRef } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Download, FileCode, Plus, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import TableNode from '@/components/dashboard/TableNode';

const nodeTypes = {
  table: TableNode,
};

const initialNodes: Node[] = [
  {
    id: 'users',
    type: 'table',
    position: { x: 100, y: 100 },
    data: {
      label: 'users',
      color: '#3b82f6', // Blue
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'email', type: 'varchar(255)' },
        { name: 'full_name', type: 'varchar(100)' },
        { name: 'created_at', type: 'timestamp' },
      ],
    },
  },
  {
    id: 'orders',
    type: 'table',
    position: { x: 500, y: 100 },
    data: {
      label: 'orders',
      color: '#10b981', // Emerald
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'user_id', type: 'uuid', isForeign: true },
        { name: 'status', type: 'varchar(50)' },
        { name: 'total_amount', type: 'decimal' },
        { name: 'created_at', type: 'timestamp' },
      ],
    },
  },
  {
    id: 'products',
    type: 'table',
    position: { x: 500, y: 400 },
    data: {
      label: 'products',
      color: '#f59e0b', // Amber
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'name', type: 'varchar(255)' },
        { name: 'price', type: 'decimal' },
        { name: 'stock', type: 'integer' },
      ],
    },
  },
  {
    id: 'order_items',
    type: 'table',
    position: { x: 900, y: 250 },
    data: {
      label: 'order_items',
      color: '#8b5cf6', // Violet
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'order_id', type: 'uuid', isForeign: true },
        { name: 'product_id', type: 'uuid', isForeign: true },
        { name: 'quantity', type: 'integer' },
        { name: 'unit_price', type: 'decimal' },
      ],
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'users', target: 'orders', type: 'smoothstep', animated: true, style: { stroke: '#64748b', strokeWidth: 1.5 } },
  { id: 'e2-4', source: 'orders', target: 'order_items', type: 'smoothstep', animated: true, style: { stroke: '#64748b', strokeWidth: 1.5 } },
  { id: 'e3-4', source: 'products', target: 'order_items', type: 'smoothstep', animated: true, style: { stroke: '#64748b', strokeWidth: 1.5 } },
];

export default function SchemaVisualizer() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true, style: { stroke: '#64748b', strokeWidth: 1.5 } }, eds)),
    [setEdges]
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
      sql += `CREATE TABLE ${node.data.label} (\n`;
      node.data.columns.forEach((col: any, index: number) => {
        sql += `  ${col.name} ${col.type}${col.isPrimary ? ' PRIMARY KEY' : ''}${index < node.data.columns.length - 1 ? ',' : ''}\n`;
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
    <div className="h-full flex flex-col bg-[#0f172a]">
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#1B2431]">
        <div>
          <h1 className="text-lg font-semibold text-white">Schema Visualizer</h1>
          <p className="text-xs text-gray-400">Interactive Entity Relationship Diagram</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="border-white/10 bg-white/5 hover:bg-white/10 text-white" onClick={exportSQL}>
            <FileCode className="w-4 h-4 mr-2" />
            Export SQL
          </Button>
          <Button size="sm" className="bg-[#3b82f6] hover:bg-[#2563eb] text-white" onClick={downloadImage}>
            <Download className="w-4 h-4 mr-2" />
            Export PNG
          </Button>
        </div>
      </div>

      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlowProvider>
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
            <Controls className="bg-[#1e293b] border-white/10 text-white fill-white [&>button]:border-white/10 [&>button]:bg-[#1e293b] [&>button:hover]:bg-[#334155] [&>button]:text-white" />
            <MiniMap
              className="bg-[#1e293b] border border-white/10 rounded-lg overflow-hidden"
              nodeColor={(node) => (node.data as any).color || '#3b82f6'}
              maskColor="rgba(15, 23, 42, 0.8)"
            />
            <Panel position="top-left" className="bg-[#1e293b]/90 backdrop-blur p-2 rounded-lg border border-white/10 shadow-xl">
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
        </ReactFlowProvider>
      </div>
    </div>
  );
}
