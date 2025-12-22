import { NavLink, useParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Table,
  Code,
  Network,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Search,
  Database,
  Loader2,
  Key,
  Link2,
  User as UserIcon,
  LogOut,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TableSchema } from '@/types';
import useConnections from '@/hooks/useConnections';
import useSchemas from '@/hooks/useSchemas';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ConnectionSidebarProps {
  className?: string;
  onClose?: () => void;
}

export function ConnectionSidebar({ className, onClose }: ConnectionSidebarProps) {
  const { connectionId } = useParams();
  const id = connectionId; // Keep using id locally for easier transition
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { connections, fetchConnections } = useConnections();
  const {
    schemas,
    tables,
    isLoading,
    isLoadingTables,
    fetchSchemas,
    fetchTables,
    areTablesLoaded
  } = useSchemas();

  const [expandedSchemas, setExpandedSchemas] = useState<Record<string, boolean>>({});
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const connection = connections.find(c => c.id === id);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/signin');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  // Fetch connection if not loaded
  useEffect(() => {
    if (connections.length === 0) {
      fetchConnections();
    }
  }, [connections.length, fetchConnections]);

  // Fetch schemas when connection changes
  useEffect(() => {
    if (id && connection?.schema_synced) {
      fetchSchemas(id);
    }
  }, [id, connection?.schema_synced, fetchSchemas]);

  // Auto-expand public schema and fetch its tables
  const hasAutoExpandedRef = useRef(false);

  useEffect(() => {
    if (schemas.length > 0 && id && !hasAutoExpandedRef.current) {
      const publicSchema = schemas.find(s => s.schema_name === 'public');
      if (publicSchema) {
        setExpandedSchemas(prev => ({ ...prev, public: true }));
        if (!areTablesLoaded('public')) {
          fetchTables(id, 'public');
        }
        hasAutoExpandedRef.current = true;
      }
    }
  }, [schemas, id, areTablesLoaded, fetchTables]);

  // Toggle schema expansion
  const toggleSchema = async (schemaName: string) => {
    const isExpanding = !expandedSchemas[schemaName];
    setExpandedSchemas(prev => ({ ...prev, [schemaName]: isExpanding }));

    // Fetch tables if expanding and not yet loaded
    if (isExpanding && id && !areTablesLoaded(schemaName)) {
      await fetchTables(id, schemaName);
    }
  };

  // Toggle table expansion to show columns
  const toggleTable = (tableName: string) => {
    setExpandedTables(prev => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  // Filter schemas and tables based on search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return { schemas, matchedTables: {} as Record<string, string[]> };
    }

    const query = searchQuery.toLowerCase();
    const matchedTables: Record<string, string[]> = {};

    const filteredSchemas = schemas.filter(schema => {
      // Check if schema name matches
      if (schema.schema_name.toLowerCase().includes(query)) {
        return true;
      }

      // Check if any table in this schema matches
      const schemaTables = tables[schema.schema_name] || [];
      const matchingTables = schemaTables.filter(t =>
        t.table_name.toLowerCase().includes(query) ||
        t.columns?.some(c => c.name.toLowerCase().includes(query))
      );

      if (matchingTables.length > 0) {
        matchedTables[schema.schema_name] = matchingTables.map(t => t.table_name);
        return true;
      }

      return false;
    });

    return { schemas: filteredSchemas, matchedTables };
  }, [schemas, tables, searchQuery]);

  // Navigate to table view
  const navigateToTable = (schemaName: string, tableName: string) => {
    navigate(`/dashboard/connection/${id}/table/${schemaName}/${tableName}`);
    if (onClose) onClose();
  };

  // Render table with columns
  const renderTable = (table: TableSchema, schemaName: string) => {
    const isExpanded = expandedTables[`${schemaName}.${table.table_name}`];
    const tableKey = `${schemaName}.${table.table_name}`;

    return (
      <div key={tableKey} className="ml-4">
        <div className="flex items-center gap-1">
          {/* Toggle columns button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleTable(tableKey);
            }}
            className="p-1 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>

          {/* Table name - click to navigate to table view */}
          <button
            onClick={() => navigateToTable(schemaName, table.table_name)}
            className="flex items-center gap-2 flex-1 px-2 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
          >
            <Table className="w-3 h-3 flex-shrink-0" />
            <span className="truncate flex-1 text-left">{table.table_name}</span>
            {table.table_type === 'VIEW' && (
              <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1 rounded">VIEW</span>
            )}
          </button>
        </div>

        {/* Columns */}
        {isExpanded && table.columns && (
          <div className="ml-6 mt-1 space-y-0.5 border-l border-white/5 pl-2">
            {table.columns.map((col, idx) => (
              <TooltipProvider key={idx}>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500 hover:text-gray-300 cursor-default">
                      <span className="flex-shrink-0">
                        {col.is_primary_key ? (
                          <Key className="w-3 h-3 text-yellow-500" />
                        ) : col.is_foreign_key ? (
                          <Link2 className="w-3 h-3 text-blue-400" />
                        ) : (
                          <span className="w-3 h-3 block" />
                        )}
                      </span>
                      <span className={cn(
                        "truncate flex-1",
                        col.is_primary_key && "text-yellow-500/80",
                        col.is_foreign_key && "text-blue-400/80"
                      )}>
                        {col.name}
                      </span>
                      <span className="text-gray-600 font-mono text-[10px] flex-shrink-0">
                        {col.data_type.length > 15 ? col.udt_name : col.data_type}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-medium">{col.name}</p>
                      <p className="text-xs text-gray-400">Type: {col.data_type}</p>
                      {col.is_nullable && <p className="text-xs text-gray-400">Nullable</p>}
                      {col.default_value && (
                        <p className="text-xs text-gray-400">Default: {col.default_value}</p>
                      )}
                      {col.foreign_key_ref && (
                        <p className="text-xs text-blue-400">
                          FK → {col.foreign_key_ref.schema}.{col.foreign_key_ref.table}.{col.foreign_key_ref.column}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!connection) {
    return (
      <div className={cn("h-full w-64 bg-[#0f172a] border-r border-white/10 flex items-center justify-center", className)}>
        <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("h-full w-64 bg-[#0f172a] border-r border-white/10 flex flex-col text-white", className)}>
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-white/5 gap-3 bg-[#0f172a]">
        <button
          onClick={() => navigate('/dashboard/connections')}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold truncate">{connection.name}</h2>
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              connection.is_valid ? "bg-green-500 animate-pulse" : "bg-red-500"
            )} />
            <span className="text-xs text-gray-500">
              {connection.is_valid ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-hidden flex flex-col">
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
          ERD Visualizer
        </NavLink>

        {/* Schemas & Tables Section */}
        <div className="pt-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Schemas & Tables
            </span>
            {isLoading && <Loader2 className="w-3 h-3 text-gray-500 animate-spin" />}
          </div>

          {/* Search */}
          <div className="px-3 mb-3 mt-2">
            <div className="relative group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
              <Input
                placeholder="Search tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 bg-[#1e293b] border-white/5 text-xs text-white placeholder:text-gray-500 focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all rounded-md"
              />
            </div>
          </div>

          {/* Schema sync notice */}
          {!connection.schema_synced && (
            <div className="px-3 py-2 mx-3 mb-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-500">
              <p>Schema not synced yet.</p>
              <p className="text-yellow-500/70 mt-1">Syncing happens automatically after connection is saved.</p>
            </div>
          )}

          {/* Schemas Tree */}
          <ScrollArea className="flex-1 scrollbar-thin">
            <div className="space-y-0.5 pb-4 px-2">
              {filteredData.schemas.length === 0 && !isLoading ? (
                <div className="px-3 py-4 text-center text-gray-500 text-xs">
                  {connection.schema_synced ? 'No schemas found' : 'Waiting for schema sync...'}
                </div>
              ) : (
                filteredData.schemas.map(schema => {
                  const isExpanded = expandedSchemas[schema.schema_name];
                  const schemaTables = tables[schema.schema_name] || [];
                  const isLoadingThisSchema = isLoadingTables[schema.schema_name];

                  return (
                    <div key={schema.id} className="space-y-0.5">
                      {/* Schema Header */}
                      <button
                        onClick={() => toggleSchema(schema.schema_name)}
                        className={cn(
                          "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors group",
                          isExpanded ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                      >
                        {isLoadingThisSchema ? (
                          <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin flex-shrink-0" />
                        ) : (
                          <ChevronRight className={cn(
                            "w-3.5 h-3.5 text-gray-500 transition-transform duration-200",
                            isExpanded && "rotate-90 text-gray-300"
                          )} />
                        )}
                        <Database className={cn(
                          "w-3.5 h-3.5 flex-shrink-0 transition-colors",
                          isExpanded ? "text-blue-400" : "text-gray-500 group-hover:text-blue-400"
                        )} />
                        <span className="truncate flex-1 text-left font-medium text-xs tracking-wide">{schema.schema_name}</span>
                        <span className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded min-w-[20px] text-center">
                          {schema.table_count}
                        </span>
                      </button>

                      {/* Tables */}
                      {isExpanded && (
                        <div className="ml-[11px] pl-2 border-l border-white/10 space-y-0.5 my-1">
                          {schemaTables.length === 0 && !isLoadingThisSchema ? (
                            <div className="px-3 py-2 text-xs text-gray-500 italic">
                              No tables found
                            </div>
                          ) : (
                            schemaTables
                              .filter(t => {
                                if (!searchQuery.trim()) return true;
                                const matched = filteredData.matchedTables[schema.schema_name];
                                return matched?.includes(t.table_name);
                              })
                              .map(table => renderTable(table, schema.schema_name))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/5 bg-[#0f172a]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group w-full outline-none px-3 py-2">
              <Avatar className="w-8 h-8 border border-white/10 shrink-0">
                <AvatarImage src={user?.profile_url || "https://github.com/shadcn.png"} />
                <AvatarFallback>{user?.username?.substring(0, 2).toUpperCase() || 'US'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user?.username || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || 'user@chatsql.app'}</p>
              </div>
              <ChevronUp className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#1B2431] border-gray-800 text-white">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-800" />
            <DropdownMenuItem
              className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white"
              onClick={() => navigate('/dashboard/profile')}
            >
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-red-400 hover:text-red-400 focus:text-red-400"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
