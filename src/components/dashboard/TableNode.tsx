import { Handle, Position } from '@xyflow/react';

interface Column {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
}

interface TableNodeData {
  label: string;
  schemaName?: string;
  columns: Column[];
  color?: string;
}

export default function TableNode({ data }: { data: TableNodeData }) {
  const color = data.color || '#3b82f6'; // Default blue

  return (
    <div className="relative group">
      {/* Glow effect behind the node */}
      <div
        className="absolute -inset-1 rounded-xl opacity-30 group-hover:opacity-50 transition duration-500 blur-md"
        style={{ backgroundColor: color }}
      ></div>

      <div className="relative bg-[#0f172a]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl min-w-[260px] overflow-hidden">
        {/* Header with colored accent */}
        <div
          className="relative px-4 py-3 border-b border-white/10 flex items-center justify-between"
          style={{
            background: `linear-gradient(135deg, ${color}15 0%, transparent 50%)`,
          }}
        >
          {/* Colored left bar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
            style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}80` }}
          ></div>

          <div className="pl-3">
            <span className="font-bold text-slate-100 text-sm block">{data.label}</span>
            {data.schemaName && (
              <span className="text-[10px] text-slate-400 font-medium">{data.schemaName}</span>
            )}
          </div>

          {/* Decorative dots with color */}
          <div className="flex gap-1.5">
            <div
              className="w-2 h-2 rounded-full opacity-60"
              style={{ backgroundColor: color }}
            ></div>
            <div className="w-2 h-2 rounded-full bg-white/20"></div>
            <div className="w-2 h-2 rounded-full bg-white/10"></div>
          </div>
        </div>

        {/* Columns */}
        <div className="py-2 max-h-[280px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
          {data.columns.map((col, index) => (
            <div
              key={index}
              className="group/row flex items-center justify-between text-xs px-4 py-1.5 hover:bg-white/5 transition-colors cursor-default"
            >
              <div className="flex items-center gap-2">
                <span className={`font-medium group-hover/row:text-white transition-colors ${col.isPrimary ? 'text-yellow-400' : col.isForeign ? 'text-blue-400' : 'text-slate-300'
                  }`}>
                  {col.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-mono text-[10px]">{col.type}</span>
                {col.isPrimary && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color: '#fbbf24',
                      backgroundColor: 'rgba(251, 191, 36, 0.15)',
                      border: '1px solid rgba(251, 191, 36, 0.3)'
                    }}
                  >
                    PK
                  </span>
                )}
                {col.isForeign && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color: color,
                      backgroundColor: `${color}20`,
                      border: `1px solid ${color}40`
                    }}
                  >
                    FK
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom accent line */}
        <div
          className="h-0.5 w-full opacity-50"
          style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
        ></div>
      </div>

      {/* Main Handles with colored ring on hover */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-[#1e293b] !border-2 transition-all duration-200"
        style={{
          left: -6,
          borderColor: color,
          boxShadow: `0 0 0 2px ${color}30`
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-[#1e293b] !border-2 transition-all duration-200"
        style={{
          right: -6,
          borderColor: color,
          boxShadow: `0 0 0 2px ${color}30`
        }}
      />
    </div>
  );
}