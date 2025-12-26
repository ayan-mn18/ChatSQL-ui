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
import { UserAvatar } from '@/components/UserAvatar';
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ConnectionSidebar({ className, onClose, isCollapsed = false, onToggleCollapse }: ConnectionSidebarProps) {
  const { connectionId } = useParams();
  const id = connectionId;
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
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Sidebar is expanded when not collapsed, or when hovered/dropdown open
  const isExpanded = !isCollapsed || isHovered || isDropdownOpen;

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

  // Render table with columns - Compact
  const renderTable = (table: TableSchema, schemaName: string) => {
    const isTableExpanded = expandedTables[`${schemaName}.${table.table_name}`];
    const tableKey = `${schemaName}.${table.table_name}`;

    return (
      <div key={tableKey}>
        <div className="flex items-center">
          {/* Toggle columns button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleTable(tableKey);
            }}
            className="p-0.5 text-gray-500 hover:text-white rounded transition-colors"
          >
            {isTableExpanded ? (
              <ChevronDown className="w-2.5 h-2.5" />
            ) : (
              <ChevronRight className="w-2.5 h-2.5" />
            )}
          </button>

          {/* Table name */}
          <button
            onClick={() => navigateToTable(schemaName, table.table_name)}
            className="flex items-center gap-1 flex-1 px-1 py-0.5 text-[11px] text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
          >
            <Table className="w-2.5 h-2.5 shrink-0 text-gray-500" />
            <span className="truncate flex-1 text-left">{table.table_name}</span>
            {table.table_type === 'VIEW' && (
              <span className="text-[8px] bg-purple-500/20 text-purple-400 px-0.5 rounded">V</span>
            )}
          </button>
        </div>

        {/* Columns - Compact */}
        {isTableExpanded && table.columns && (
          <div className="ml-4 border-l border-white/5 pl-1.5 py-0.5">
            {table.columns.map((col, idx) => (
              <TooltipProvider key={idx}>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 px-1 py-px text-[10px] text-gray-500 hover:text-gray-300 cursor-default">
                      <span className="w-2.5 h-2.5 flex items-center justify-center shrink-0">
                        {col.is_primary_key ? (
                          <Key className="w-2 h-2 text-yellow-500" />
                        ) : col.is_foreign_key ? (
                          <Link2 className="w-2 h-2 text-blue-400" />
                        ) : null}
                      </span>
                      <span className={cn(
                        "truncate flex-1",
                        col.is_primary_key && "text-yellow-500/80",
                        col.is_foreign_key && "text-blue-400/80"
                      )}>
                        {col.name}
                      </span>
                      <span className="text-gray-600 font-mono text-[9px] shrink-0">
                        {col.udt_name || col.data_type}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs text-xs">
                    <div className="space-y-0.5">
                      <p className="font-medium">{col.name}</p>
                      <p className="text-gray-400">Type: {col.data_type}</p>
                      {col.is_nullable && <p className="text-gray-400">Nullable</p>}
                      {col.default_value && <p className="text-gray-400">Default: {col.default_value}</p>}
                      {col.foreign_key_ref && (
                        <p className="text-blue-400">
                          FK → {col.foreign_key_ref.table}.{col.foreign_key_ref.column}
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
      <div className={cn(
        "h-full bg-[#0f172a] border-r border-white/10 flex items-center justify-center transition-all duration-300",
        isExpanded ? "w-60" : "w-14",
        className
      )}>
        <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "h-full bg-[#0f172a] border-r border-white/10 flex flex-col text-white transition-all duration-300 ease-in-out overflow-hidden",
        isExpanded ? "w-60" : "w-14",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header - Compact */}
      <div className={cn(
        "h-11 flex items-center border-b border-white/5 bg-[#0f172a] shrink-0",
        isExpanded ? "px-2 gap-2" : "justify-center"
      )}>
        <button
          onClick={() => navigate('/dashboard/connections')}
          className="p-1.5 hover:bg-white/5 rounded transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-gray-400" />
        </button>
        {isExpanded && (
          <div className="flex-1 min-w-0 overflow-hidden">
            <h2 className="text-xs font-semibold truncate leading-tight">{connection.name}</h2>
            <div className="flex items-center gap-1">
              <span className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                connection.is_valid ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-[10px] text-gray-500 truncate">
                {connection.is_valid ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation - Compact */}
      <nav className="flex-1 py-1.5 overflow-hidden flex flex-col">
        <div className={cn("space-y-0.5", isExpanded ? "px-1.5" : "px-1")}>
          {[
            { to: `/dashboard/connection/${id}/overview`, icon: LayoutDashboard, label: 'Overview' },
            { to: `/dashboard/connection/${id}/sql`, icon: Code, label: 'SQL Editor' },
            { to: `/dashboard/connection/${id}/visualizer`, icon: Network, label: 'ERD' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => cn(
                "flex items-center rounded text-xs font-medium transition-all duration-200 group relative",
                isExpanded ? "gap-2 px-2 py-1.5" : "justify-center w-10 h-8 mx-auto",
                isActive
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-3.5 h-3.5 shrink-0" />
              {isExpanded && <span className="truncate">{item.label}</span>}
              {!isExpanded && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-[#1e293b] text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </div>

        {/* Schemas & Tables Section - Only show when expanded */}
        {isExpanded && (
          <div className="pt-2 flex-1 overflow-hidden flex flex-col border-t border-white/5 mt-1.5">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Schemas
              </span>
              {isLoading && <Loader2 className="w-2.5 h-2.5 text-gray-500 animate-spin" />}
            </div>

            {/* Search - Compact */}
            <div className="px-1.5 mb-1">
              <div className="relative group">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 pl-7 pr-2 bg-[#1e293b] border-white/5 text-[11px] text-white placeholder:text-gray-600 focus:ring-1 focus:ring-blue-500/50 rounded"
                />
              </div>
            </div>

            {/* Schema sync notice - Compact */}
            {!connection.schema_synced && (
              <div className="px-1.5 py-1 mx-1.5 mb-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] text-yellow-500">
                Schema not synced
              </div>
            )}

            {/* Schemas Tree - Compact */}
            <ScrollArea className="flex-1">
              <div className="space-y-px pb-2 px-1">
                {filteredData.schemas.length === 0 && !isLoading ? (
                  <div className="px-2 py-3 text-center text-gray-500 text-[10px]">
                    {connection.schema_synced ? 'No schemas' : 'Syncing...'}
                  </div>
                ) : (
                  filteredData.schemas.map(schema => {
                    const isSchemaExpanded = expandedSchemas[schema.schema_name];
                    const schemaTables = tables[schema.schema_name] || [];
                    const isLoadingThisSchema = isLoadingTables[schema.schema_name];

                    return (
                      <div key={schema.id}>
                        {/* Schema Header - Compact */}
                        <button
                          onClick={() => toggleSchema(schema.schema_name)}
                          className={cn(
                            "flex items-center gap-1 w-full px-1.5 py-1 text-[11px] rounded transition-colors group",
                            isSchemaExpanded ? "text-white bg-white/5" : "text-gray-400 hover:text-white hover:bg-white/5"
                          )}
                        >
                          {isLoadingThisSchema ? (
                            <Loader2 className="w-3 h-3 text-gray-500 animate-spin shrink-0" />
                          ) : (
                            <ChevronRight className={cn(
                              "w-3 h-3 text-gray-500 transition-transform shrink-0",
                              isSchemaExpanded && "rotate-90"
                            )} />
                          )}
                          <Database className={cn(
                            "w-3 h-3 shrink-0",
                            isSchemaExpanded ? "text-blue-400" : "text-gray-500"
                          )} />
                          <span className="truncate flex-1 text-left font-medium">{schema.schema_name}</span>
                          <span className="text-[9px] text-gray-600 bg-white/5 px-1 rounded">
                            {schema.table_count}
                          </span>
                        </button>

                        {/* Tables - Compact */}
                        {isSchemaExpanded && (
                          <div className="ml-3 pl-2 border-l border-white/10 space-y-px">
                            {schemaTables.length === 0 && !isLoadingThisSchema ? (
                              <div className="px-2 py-1.5 text-[10px] text-gray-500 italic">
                                Empty
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
        )}

        {/* Collapsed state - show database icon */}
        {!isExpanded && (
          <div className="flex-1 flex flex-col items-center pt-2 border-t border-white/5 mt-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-2 text-gray-500">
                    <Database className="w-4 h-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {schemas.length} schema(s)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </nav>

      {/* User Profile - Compact */}
      <div className={cn(
        "border-t border-white/5 bg-[#0f172a] shrink-0",
        isExpanded ? "p-1.5" : "p-1"
      )}>
        <DropdownMenu onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center rounded bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer w-full outline-none",
              isExpanded ? "gap-2 px-2 py-1.5" : "justify-center p-1.5"
            )}>
              <UserAvatar user={user} className="w-6 h-6" fallbackClassName="text-[10px]" />
              {isExpanded && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[11px] font-medium text-white truncate">{user?.username || 'User'}</p>
                    <p className="text-[9px] text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <ChevronUp className="w-3 h-3 text-gray-500 shrink-0" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isExpanded ? "end" : "start"} side={isExpanded ? "top" : "right"} className="w-48 bg-[#1B2431] border-gray-800 text-white">
            <DropdownMenuLabel className="text-xs">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-800" />
            <DropdownMenuItem
              className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white text-xs"
              onClick={() => navigate('/dashboard/profile')}
            >
              <UserIcon className="mr-2 h-3 w-3" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-red-400 hover:text-red-400 focus:text-red-400 text-xs"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-3 w-3" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
