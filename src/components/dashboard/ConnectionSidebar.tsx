import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Table, Code, Network, ArrowLeft, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConnections } from '@/hooks/useConnections';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConnectionSidebarProps {
  className?: string;
  onClose?: () => void;
}

export function ConnectionSidebar({ className, onClose }: ConnectionSidebarProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { connections } = useConnections();
  const connection = connections.find(c => c.id === id);
  const [tablesOpen, setTablesOpen] = useState(true);

  // Mock tables
  const tables = ['users', 'orders', 'products', 'categories', 'reviews', 'audit_logs'];

  if (!connection) return (
    <div className={cn("h-full w-64 bg-[#1B2431] border-r border-white/10 flex items-center justify-center text-gray-500", className)}>
      Loading...
    </div>
  );

  return (
    <div className={cn("h-full w-64 bg-[#1B2431] border-r border-white/10 flex flex-col text-white", className)}>
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b border-white/5 gap-3">
        <button
          onClick={() => navigate('/dashboard/connections')}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold truncate">{connection.name}</h2>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs text-gray-500">Connected</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavLink
          to={`/dashboard/connection/${id}/overview`}
          onClick={onClose}
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            isActive ? "bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20" : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          Overview
        </NavLink>

        <NavLink
          to={`/dashboard/connection/${id}/sql`}
          onClick={onClose}
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            isActive ? "bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20" : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Code className="w-4 h-4" />
          SQL Editor
        </NavLink>

        <NavLink
          to={`/dashboard/connection/${id}/visualizer`}
          onClick={onClose}
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            isActive ? "bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20" : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Network className="w-4 h-4" />
          Visualizer
        </NavLink>

        {/* Tables Section */}
        <div className="pt-4">
          <button
            onClick={() => setTablesOpen(!tablesOpen)}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-white transition-colors"
          >
            Tables
            <ChevronDown className={cn("w-3 h-3 transition-transform", tablesOpen ? "" : "-rotate-90")} />
          </button>

          {tablesOpen && (
            <div className="mt-2 space-y-1">
              <div className="px-3 mb-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                  <Input
                    placeholder="Search tables..."
                    className="h-8 pl-8 bg-[#273142] border-none text-xs text-white focus:ring-1 focus:ring-[#3b82f6]"
                  />
                </div>
              </div>
              <ScrollArea className="h-[300px]">
                {tables.map(table => (
                  <NavLink
                    key={table}
                    to={`/dashboard/connection/${id}/tables/${table}`}
                    onClick={onClose}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      isActive ? "text-[#3b82f6] bg-[#3b82f6]/10" : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Table className="w-3 h-3" />
                    {table}
                  </NavLink>
                ))}
              </ScrollArea>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
