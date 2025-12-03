import { Handle, Position } from '@xyflow/react';

interface Column {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
}

interface TableNodeData {
  label: string;
  columns: Column[];
  color?: string;
}

export default function TableNode({ data }: { data: TableNodeData }) {
  const color = data.color || '#3b82f6'; // Default blue

  return (
    <div className="relative group">
      {/* Glow effect behind the node */}
      <div
        className="absolute -inset-0.5 rounded-lg opacity-20 group-hover:opacity-40 transition duration-500 blur"
        style={{ backgroundColor: color }}
      ></div>

      <div className="relative bg-[#0f172a]/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl min-w-[240px] overflow-hidden">
        {/* Header with colored accent line */}
        <div className="relative bg-white/5 px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
          ></div>
          <span className="font-semibold text-slate-100 text-sm pl-2">{data.label}</span>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
          </div>
        </div>

        {/* Columns */}
        <div className="py-2 max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
          {data.columns.map((col, index) => (
            <div key={index} className="group/row flex items-center justify-between text-xs px-4 py-1.5 hover:bg-white/5 transition-colors cursor-default">
              <div className="flex items-center gap-2">
                {/* Connection handle for each row (optional, but good for detailed ERDs) */}
                <span className={`text-slate-300 font-medium group-hover/row:text-white transition-colors ${col.isPrimary ? 'text-white' : ''}`}>
                  {col.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-500 font-mono text-[10px]">{col.type}</span>
                <div className="w-8 flex justify-end">
                  {col.isPrimary && (
                    <span className="text-[10px] font-bold text-yellow-500/80 bg-yellow-500/10 px-1 rounded">PK</span>
                  )}
                  {col.isForeign && (
                    <span className="text-[10px] font-bold text-blue-400/80 bg-blue-400/10 px-1 rounded">FK</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-[#1e293b] !border-2 !border-slate-500"
        style={{ left: -5 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-[#1e293b] !border-2 !border-slate-500"
        style={{ right: -5 }}
      />
    </div>
  );
}