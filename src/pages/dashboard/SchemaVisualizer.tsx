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
  useReactFlow,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  FileCode,
  Loader2,
  RefreshCw,
  AlertCircle,
  Layout,
  ChevronDown,
  Database,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import TableNode from '@/components/dashboard/TableNode';
import dagre from 'dagre';
import { connectionService } from '@/services/connection.service';
import { TableSchema, ERDRelation, DatabaseSchemaPublic } from '@/types';

const nodeTypes = {
  table: TableNode,
};

const nodeWidth = 280;
const nodeHeight = 300;

// Color palette for different schemas (each schema gets a distinct color)
const COLOR_PALETTE = [
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
  '#f97316', // orange
  '#a855f7', // purple
  '#22c55e', // green
  '#ef4444', // red
  '#0ea5e9', // sky
];

// Get color for a schema based on its index
const getSchemaColor = (index: number): string => {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
};

// Get a slightly varied color for tables within a schema
const getTableColor = (schemaColor: string, tableIndex: number): string => {
  // Slight variation in brightness for tables within same schema
  const variation = (tableIndex % 3) * 10 - 10; // -10, 0, or 10
  return adjustColorBrightness(schemaColor, variation);
};

// Adjust color brightness
const adjustColorBrightness = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  if (nodes.length === 0) return { nodes: [], edges: [] };

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

// Transform API data to ReactFlow nodes with vibrant colors
function transformTablesToNodes(tables: TableSchema[], schemaColors: Map<string, string>): Node[] {
  // Group tables by schema to get index within schema
  const schemaTableIndex = new Map<string, number>();

  return tables.map((table) => {
    const schemaColor = schemaColors.get(table.schema_name) || '#3b82f6';
    const tableIndexInSchema = schemaTableIndex.get(table.schema_name) || 0;
    schemaTableIndex.set(table.schema_name, tableIndexInSchema + 1);

    // Vary color slightly for each table within a schema
    const tableColor = getTableColor(schemaColor, tableIndexInSchema);

    return {
      id: `${table.schema_name}.${table.table_name}`,
      type: 'table',
      position: { x: 0, y: 0 },
      data: {
        label: table.table_name,
        schemaName: table.schema_name,
        color: tableColor,
        columns: table.columns?.map(col => ({
          name: col.name,
          type: col.data_type,
          isPrimary: col.is_primary_key,
          isForeign: col.is_foreign_key,
        })) || [],
      },
    };
  });
}

// Transform API relations to ReactFlow edges with colored connections
function transformRelationsToEdges(relations: ERDRelation[], schemaColors: Map<string, string>): Edge[] {
  return relations.map((rel, index) => {
    const sourceColor = schemaColors.get(rel.source_schema) || '#64748b';

    return {
      id: `e_${rel.source_table}_${rel.target_table}_${index}`,
      source: `${rel.source_schema}.${rel.source_table}`,
      target: `${rel.target_schema}.${rel.target_table}`,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: sourceColor,
        strokeWidth: 2,
        opacity: 0.7,
      },
      label: rel.source_column,
      labelStyle: {
        fill: '#e2e8f0',
        fontSize: 10,
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: '#1e293b',
        fillOpacity: 0.8,
      },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
    };
  });
}

function SchemaVisualizerContent() {
  const { connectionId } = useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cache for all data
  const [allSchemas, setAllSchemas] = useState<DatabaseSchemaPublic[]>([]);
  const [allTables, setAllTables] = useState<TableSchema[]>([]);
  const [allRelations, setAllRelations] = useState<ERDRelation[]>([]);

  // Selected schemas for display
  const [selectedSchemas, setSelectedSchemas] = useState<Set<string>>(new Set());

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();

  // Create schema color map based on available schemas order
  const schemaColors = useMemo(() => {
    const colorMap = new Map<string, string>();
    // Use availableSchemas to ensure consistent ordering
    const selectedSchemasList = allSchemas.filter(s => s.is_selected);
    selectedSchemasList.forEach((schema, index) => {
      colorMap.set(schema.schema_name, getSchemaColor(index));
    });
    return colorMap;
  }, [allSchemas]);

  // Get available schemas (only those that are selected in the connection)
  const availableSchemas = useMemo(() => {
    return allSchemas.filter(s => s.is_selected);
  }, [allSchemas]);

  // Filter tables and relations based on selected schemas
  const filteredData = useMemo(() => {
    if (selectedSchemas.size === 0) {
      return { tables: [], relations: [] };
    }

    const filteredTables = allTables.filter(table => selectedSchemas.has(table.schema_name));
    const filteredTableIds = new Set(filteredTables.map(t => `${t.schema_name}.${t.table_name}`));

    // Only include relations where both source and target tables are visible
    const filteredRelations = allRelations.filter(rel => {
      const sourceId = `${rel.source_schema}.${rel.source_table}`;
      const targetId = `${rel.target_schema}.${rel.target_table}`;
      return filteredTableIds.has(sourceId) && filteredTableIds.has(targetId);
    });

    return { tables: filteredTables, relations: filteredRelations };
  }, [allTables, allRelations, selectedSchemas]);

  // Update nodes and edges when filtered data changes
  useEffect(() => {
    const { tables, relations } = filteredData;

    if (tables.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const newNodes = transformTablesToNodes(tables, schemaColors);
    const newEdges = transformRelationsToEdges(relations, schemaColors);

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges, 'LR');
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    setTimeout(() => fitView(), 100);
  }, [filteredData, schemaColors, setNodes, setEdges, fitView]);

  // Fetch all data for ERD (cached)
  const fetchERDData = useCallback(async () => {
    if (!connectionId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch schemas first
      const schemasResponse = await connectionService.getSchemas(connectionId);
      const schemasData = (schemasResponse as any).schemas || schemasResponse.data || [];
      setAllSchemas(schemasData);

      // Fetch tables for all selected schemas
      const tables: TableSchema[] = [];
      for (const schema of schemasData.filter((s: DatabaseSchemaPublic) => s.is_selected)) {
        try {
          const tablesResponse = await connectionService.getTablesBySchema(connectionId, schema.schema_name);
          const schemaTables = (tablesResponse as any).tables || tablesResponse.data || [];
          tables.push(...schemaTables);
        } catch {
          console.warn(`Failed to fetch tables for schema: ${schema.schema_name}`);
        }
      }
      setAllTables(tables);

      // Fetch relations
      const relationsResponse = await connectionService.getRelations(connectionId);
      const relations = (relationsResponse as any).relations || relationsResponse.data || [];
      setAllRelations(relations);

      // Auto-select the first schema if none selected
      const selectedSchemasList = schemasData.filter((s: DatabaseSchemaPublic) => s.is_selected);
      if (selectedSchemasList.length > 0) {
        // Set all schemas selected by default on first load
        setSelectedSchemas(prev => {
          if (prev.size === 0) {
            return new Set([selectedSchemasList[0].schema_name]);
          }
          return prev;
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load ERD data');
    } finally {
      setIsLoading(false);
    }
  }, [connectionId]);

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
      const schemaName = (node.data as any).schemaName || 'public';
      sql += `CREATE TABLE ${schemaName}.${node.data.label} (\n`;
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

  // Toggle schema selection
  const toggleSchema = (schemaName: string) => {
    setSelectedSchemas(prev => {
      const next = new Set(prev);
      if (next.has(schemaName)) {
        next.delete(schemaName);
      } else {
        next.add(schemaName);
      }
      return next;
    });
  };

  // Select all schemas
  const selectAllSchemas = () => {
    setSelectedSchemas(new Set(availableSchemas.map(s => s.schema_name)));
  };

  // Clear all schema selections
  const clearSchemaSelection = () => {
    setSelectedSchemas(new Set());
  };

  return (
    <div className="h-screen flex flex-col bg-[#0f172a]">
      {/* Header */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-[#1B2431] shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-semibold text-white">ERD Visualizer</h1>
            <p className="text-xs text-gray-400 hidden md:block">
              {nodes.length > 0
                ? `${nodes.length} tables • ${edges.length} relationships`
                : 'Interactive Entity Relationship Diagram'}
            </p>
          </div>

          {/* Schema Filter Dropdown */}
          {availableSchemas.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 bg-white/5 hover:bg-white/10 text-white min-w-[180px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    <span>
                      {selectedSchemas.size === 0
                        ? 'Select Schemas'
                        : selectedSchemas.size === availableSchemas.length
                          ? 'All Schemas'
                          : `${selectedSchemas.size} Schema${selectedSchemas.size > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-64 bg-[#1B2431] border-white/10 text-white"
                align="start"
              >
                <DropdownMenuLabel className="text-gray-400 text-xs uppercase">
                  Filter by Schema
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />

                {/* Quick actions */}
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-gray-400 hover:text-white hover:bg-white/10"
                    onClick={selectAllSchemas}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-gray-400 hover:text-white hover:bg-white/10"
                    onClick={clearSchemaSelection}
                  >
                    Clear All
                  </Button>
                </div>
                <DropdownMenuSeparator className="bg-white/10" />

                {/* Schema list */}
                {availableSchemas.map((schema) => (
                  <DropdownMenuCheckboxItem
                    key={schema.schema_name}
                    checked={selectedSchemas.has(schema.schema_name)}
                    onCheckedChange={() => toggleSchema(schema.schema_name)}
                    className="text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: schemaColors.get(schema.schema_name) }}
                      />
                      <span className="flex-1">{schema.schema_name}</span>
                      <span className="text-xs text-gray-500">
                        {allTables.filter(t => t.schema_name === schema.schema_name).length} tables
                      </span>
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Selected schema badges (for quick removal) */}
          <div className="hidden lg:flex items-center gap-1.5 flex-wrap max-w-md">
            {Array.from(selectedSchemas).slice(0, 3).map(schemaName => (
              <Badge
                key={schemaName}
                variant="secondary"
                className="bg-white/10 text-white border-0 pr-1 cursor-pointer hover:bg-white/20"
                onClick={() => toggleSchema(schemaName)}
              >
                <div
                  className="w-2 h-2 rounded-sm mr-1.5"
                  style={{ backgroundColor: schemaColors.get(schemaName) }}
                />
                {schemaName}
                <X className="w-3 h-3 ml-1 opacity-60" />
              </Badge>
            ))}
            {selectedSchemas.size > 3 && (
              <Badge variant="secondary" className="bg-white/10 text-white border-0">
                +{selectedSchemas.size - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Action buttons */}
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

      {/* Main content */}
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

        {/* Empty State - No schemas selected */}
        {!isLoading && !error && selectedSchemas.size === 0 && availableSchemas.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a] z-40">
            <div className="flex flex-col items-center gap-3 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                <Database className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-white font-medium">Select a schema to visualize</p>
              <p className="text-gray-400 text-sm max-w-md">
                Use the dropdown above to select one or more schemas to display their tables and relationships.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-white/10 bg-white/5 hover:bg-white/10 text-white"
                onClick={selectAllSchemas}
              >
                Show All Schemas
              </Button>
            </div>
          </div>
        )}

        {/* Empty State - No tables */}
        {!isLoading && !error && selectedSchemas.size > 0 && nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a] z-40">
            <div className="flex flex-col items-center gap-3 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                <Layout className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-white font-medium">No tables to visualize</p>
              <p className="text-gray-400 text-sm max-w-md">
                The selected schemas don't have any tables, or the schema hasn't been synced yet.
              </p>
            </div>
          </div>
        )}

        {/* Empty State - No data at all */}
        {!isLoading && !error && availableSchemas.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a] z-40">
            <div className="flex flex-col items-center gap-3 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                <Layout className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-white font-medium">No schemas available</p>
              <p className="text-gray-400 text-sm max-w-md">
                The database schema hasn't been synced yet. Please sync the schema from the connection settings.
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
