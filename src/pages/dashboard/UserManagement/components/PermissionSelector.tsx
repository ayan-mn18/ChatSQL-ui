import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Table2,
  ChevronDown,
  ChevronRight,
  Check,
  Minus,
  Lock,
  Unlock,
  Eye,
  Edit3,
  Search,
  FolderOpen,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Connection, PermissionState } from '../types';

interface PermissionSelectorProps {
  connections: Connection[];
  permissions: PermissionState;
  onChange: (permissions: PermissionState) => void;
  mode?: 'connections' | 'tables' | 'both';
}

export function PermissionSelector({
  connections,
  permissions,
  onChange,
  mode = 'both',
}: PermissionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedConnections, setExpandedConnections] = useState<Set<string>>(
    new Set()
  );
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(
    new Set()
  );

  const toggleConnection = (connectionId: string) => {
    setExpandedConnections((prev) => {
      const next = new Set(prev);
      if (next.has(connectionId)) {
        next.delete(connectionId);
      } else {
        next.add(connectionId);
      }
      return next;
    });
  };

  const toggleSchema = (schemaKey: string) => {
    setExpandedSchemas((prev) => {
      const next = new Set(prev);
      if (next.has(schemaKey)) {
        next.delete(schemaKey);
      } else {
        next.add(schemaKey);
      }
      return next;
    });
  };

  const handleConnectionAccessChange = (
    connectionId: string,
    access: 'full' | 'limited' | 'none'
  ) => {
    const newPermissions = { ...permissions };
    newPermissions.connectionAccess = {
      ...newPermissions.connectionAccess,
      [connectionId]: access,
    };

    // If setting to 'none', remove all table permissions for this connection
    if (access === 'none') {
      Object.keys(newPermissions.tablePermissions).forEach((key) => {
        if (key.startsWith(`${connectionId}:`)) {
          delete newPermissions.tablePermissions[key];
        }
      });
    }

    // If setting to 'full', grant read access to all tables
    if (access === 'full') {
      const connection = connections.find((c) => c.id === connectionId);
      if (connection?.schemas) {
        connection.schemas.forEach((schema) => {
          schema.tables.forEach((table) => {
            const key = `${connectionId}:${schema.name}.${table.name}`;
            newPermissions.tablePermissions[key] = {
              read: true,
              write: false,
            };
          });
        });
      }
    }

    onChange(newPermissions);
  };

  const handleTablePermissionChange = (
    connectionId: string,
    schemaName: string,
    tableName: string,
    permission: 'read' | 'write',
    value: boolean
  ) => {
    const key = `${connectionId}:${schemaName}.${tableName}`;
    const current = permissions.tablePermissions[key] || {
      read: false,
      write: false,
    };

    const newPermissions = { ...permissions };
    newPermissions.tablePermissions = {
      ...newPermissions.tablePermissions,
      [key]: {
        ...current,
        [permission]: value,
        // If granting write, also grant read
        ...(permission === 'write' && value ? { read: true } : {}),
        // If removing read, also remove write
        ...(permission === 'read' && !value ? { write: false } : {}),
      },
    };

    // If any table has permissions, ensure connection is at least 'limited'
    const hasAnyTablePermission = Object.keys(
      newPermissions.tablePermissions
    ).some(
      (k) =>
        k.startsWith(`${connectionId}:`) &&
        (newPermissions.tablePermissions[k].read ||
          newPermissions.tablePermissions[k].write)
    );

    if (
      hasAnyTablePermission &&
      newPermissions.connectionAccess[connectionId] === 'none'
    ) {
      newPermissions.connectionAccess[connectionId] = 'limited';
    }

    onChange(newPermissions);
  };

  const handleSelectAllTables = (
    connectionId: string,
    schemaName: string,
    permission: 'read' | 'write',
    value: boolean
  ) => {
    const connection = connections.find((c) => c.id === connectionId);
    if (!connection?.schemas) return;

    const schema = connection.schemas.find((s) => s.name === schemaName);
    if (!schema) return;

    const newPermissions = { ...permissions };
    schema.tables.forEach((table) => {
      const key = `${connectionId}:${schemaName}.${table.name}`;
      const current = newPermissions.tablePermissions[key] || {
        read: false,
        write: false,
      };
      newPermissions.tablePermissions[key] = {
        ...current,
        [permission]: value,
        ...(permission === 'write' && value ? { read: true } : {}),
        ...(permission === 'read' && !value ? { write: false } : {}),
      };
    });

    if (value && newPermissions.connectionAccess[connectionId] === 'none') {
      newPermissions.connectionAccess[connectionId] = 'limited';
    }

    onChange(newPermissions);
  };

  // Filter connections based on search
  const filteredConnections = useMemo(() => {
    if (!searchQuery) return connections;

    return connections
      .map((conn) => {
        const matchesConnection = conn.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        const filteredSchemas = conn.schemas
          ?.map((schema) => ({
            ...schema,
            tables: schema.tables.filter((table) =>
              table.name.toLowerCase().includes(searchQuery.toLowerCase())
            ),
          }))
          .filter(
            (schema) =>
              schema.tables.length > 0 ||
              schema.name.toLowerCase().includes(searchQuery.toLowerCase())
          );

        if (matchesConnection || (filteredSchemas && filteredSchemas.length > 0)) {
          return {
            ...conn,
            schemas: matchesConnection ? conn.schemas : filteredSchemas,
          };
        }
        return null;
      })
      .filter(Boolean) as Connection[];
  }, [connections, searchQuery]);

  const getConnectionStats = (connection: Connection) => {
    let totalTables = 0;
    let accessibleTables = 0;
    let writableTables = 0;

    connection.schemas?.forEach((schema) => {
      schema.tables.forEach((table) => {
        totalTables++;
        const key = `${connection.id}:${schema.name}.${table.name}`;
        const perm = permissions.tablePermissions[key];
        if (perm?.read) accessibleTables++;
        if (perm?.write) writableTables++;
      });
    });

    return { totalTables, accessibleTables, writableTables };
  };

  const getSchemaStats = (connectionId: string, schemaName: string, tables: any[]) => {
    let totalTables = tables.length;
    let accessibleTables = 0;
    let writableTables = 0;

    tables.forEach((table) => {
      const key = `${connectionId}:${schemaName}.${table.name}`;
      const perm = permissions.tablePermissions[key];
      if (perm?.read) accessibleTables++;
      if (perm?.write) writableTables++;
    });

    return { totalTables, accessibleTables, writableTables };
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          placeholder="Search connections, schemas, or tables..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-white/10 bg-white/[0.03] text-white placeholder:text-slate-500"
        />
      </div>

      {/* Permission Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg bg-white/[0.03] p-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/20">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <span className="text-slate-400">Full Access</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-500/20">
            <Minus className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <span className="text-slate-400">Limited Access</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-500/20">
            <Lock className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <span className="text-slate-400">No Access</span>
        </div>
        <div className="ml-auto flex items-center gap-4 border-l border-white/10 pl-4">
          <div className="flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-cyan-400" />
            <span className="text-slate-400">Read</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Edit3 className="h-4 w-4 text-violet-400" />
            <span className="text-slate-400">Write</span>
          </div>
        </div>
      </div>

      {/* Connections List */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredConnections.map((connection) => {
              const isExpanded = expandedConnections.has(connection.id);
              const access = permissions.connectionAccess[connection.id] || 'none';
              const stats = getConnectionStats(connection);

              return (
                <motion.div
                  key={connection.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]"
                >
                  {/* Connection Header */}
                  <div
                    className={cn(
                      'flex items-center gap-3 p-4 transition-colors',
                      access !== 'none' && 'bg-white/[0.02]'
                    )}
                  >
                    <button
                      onClick={() => toggleConnection(connection.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                      <Database className="h-5 w-5 text-violet-400" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {connection.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-white/10 text-xs text-slate-400"
                        >
                          {connection.type}
                        </Badge>
                      </div>
                      <div className="mt-0.5 text-sm text-slate-500">
                        {connection.host} • {connection.database}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-3 text-sm">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-2.5 py-1">
                              <Eye className="h-3.5 w-3.5 text-cyan-400" />
                              <span className="text-white">
                                {stats.accessibleTables}
                              </span>
                              <span className="text-slate-500">
                                /{stats.totalTables}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {stats.accessibleTables} of {stats.totalTables}{' '}
                              tables readable
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-2.5 py-1">
                              <Edit3 className="h-3.5 w-3.5 text-violet-400" />
                              <span className="text-white">
                                {stats.writableTables}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{stats.writableTables} tables writable</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Access Level Selector */}
                    {mode !== 'tables' && (
                      <div className="flex items-center gap-1 rounded-lg bg-white/[0.03] p-1">
                        {(['none', 'limited', 'full'] as const).map((level) => (
                          <button
                            key={level}
                            onClick={() =>
                              handleConnectionAccessChange(connection.id, level)
                            }
                            className={cn(
                              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                              access === level
                                ? level === 'full'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : level === 'limited'
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-slate-500/20 text-slate-400'
                                : 'text-slate-500 hover:text-slate-300'
                            )}
                          >
                            {level === 'full' && <Unlock className="h-3.5 w-3.5" />}
                            {level === 'limited' && <Minus className="h-3.5 w-3.5" />}
                            {level === 'none' && <Lock className="h-3.5 w-3.5" />}
                            <span className="capitalize">{level}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Schemas & Tables */}
                  <AnimatePresence>
                    {isExpanded && connection.schemas && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-white/[0.06]"
                      >
                        <div className="p-2">
                          {connection.schemas.map((schema) => {
                            const schemaKey = `${connection.id}:${schema.name}`;
                            const isSchemaExpanded = expandedSchemas.has(schemaKey);
                            const schemaStats = getSchemaStats(
                              connection.id,
                              schema.name,
                              schema.tables
                            );

                            return (
                              <div
                                key={schema.name}
                                className="rounded-lg overflow-hidden"
                              >
                                {/* Schema Header */}
                                <div className="flex items-center gap-2 px-3 py-2 hover:bg-white/[0.02]">
                                  <button
                                    onClick={() => toggleSchema(schemaKey)}
                                    className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-white/10 hover:text-white"
                                  >
                                    {isSchemaExpanded ? (
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    )}
                                  </button>

                                  <FolderOpen className="h-4 w-4 text-amber-400" />
                                  <span className="text-sm font-medium text-slate-300">
                                    {schema.name}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="ml-1 border-white/10 text-[10px] text-slate-500"
                                  >
                                    {schema.tables.length} tables
                                  </Badge>

                                  <div className="ml-auto flex items-center gap-2">
                                    {/* Select All Read */}
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            onClick={() =>
                                              handleSelectAllTables(
                                                connection.id,
                                                schema.name,
                                                'read',
                                                schemaStats.accessibleTables !==
                                                schemaStats.totalTables
                                              )
                                            }
                                            className={cn(
                                              'flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
                                              schemaStats.accessibleTables ===
                                                schemaStats.totalTables
                                                ? 'bg-cyan-500/20 text-cyan-400'
                                                : 'bg-white/[0.05] text-slate-400 hover:bg-white/10'
                                            )}
                                          >
                                            <Eye className="h-3 w-3" />
                                            All
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>
                                            {schemaStats.accessibleTables ===
                                              schemaStats.totalTables
                                              ? 'Remove read access from all'
                                              : 'Grant read access to all'}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>

                                    {/* Select All Write */}
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            onClick={() =>
                                              handleSelectAllTables(
                                                connection.id,
                                                schema.name,
                                                'write',
                                                schemaStats.writableTables !==
                                                schemaStats.totalTables
                                              )
                                            }
                                            className={cn(
                                              'flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
                                              schemaStats.writableTables ===
                                                schemaStats.totalTables
                                                ? 'bg-violet-500/20 text-violet-400'
                                                : 'bg-white/[0.05] text-slate-400 hover:bg-white/10'
                                            )}
                                          >
                                            <Edit3 className="h-3 w-3" />
                                            All
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>
                                            {schemaStats.writableTables ===
                                              schemaStats.totalTables
                                              ? 'Remove write access from all'
                                              : 'Grant write access to all'}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </div>

                                {/* Tables */}
                                <AnimatePresence>
                                  {isSchemaExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.15 }}
                                      className="ml-8 border-l border-white/[0.06] pl-4"
                                    >
                                      {schema.tables.map((table) => {
                                        const tableKey = `${connection.id}:${schema.name}.${table.name}`;
                                        const perm =
                                          permissions.tablePermissions[tableKey] || {
                                            read: false,
                                            write: false,
                                          };

                                        return (
                                          <div
                                            key={table.name}
                                            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/[0.02]"
                                          >
                                            <Table2 className="h-4 w-4 text-cyan-400" />
                                            <span className="flex-1 text-sm text-slate-300">
                                              {table.name}
                                            </span>

                                            {/* Read Permission */}
                                            <div className="flex items-center gap-2">
                                              <label className="flex items-center gap-1.5 text-xs text-slate-400">
                                                <Switch
                                                  checked={perm.read}
                                                  onCheckedChange={(checked) =>
                                                    handleTablePermissionChange(
                                                      connection.id,
                                                      schema.name,
                                                      table.name,
                                                      'read',
                                                      checked
                                                    )
                                                  }
                                                  className="data-[state=checked]:bg-cyan-500"
                                                />
                                                <Eye className="h-3.5 w-3.5" />
                                              </label>

                                              {/* Write Permission */}
                                              <label className="flex items-center gap-1.5 text-xs text-slate-400">
                                                <Switch
                                                  checked={perm.write}
                                                  onCheckedChange={(checked) =>
                                                    handleTablePermissionChange(
                                                      connection.id,
                                                      schema.name,
                                                      table.name,
                                                      'write',
                                                      checked
                                                    )
                                                  }
                                                  className="data-[state=checked]:bg-violet-500"
                                                />
                                                <Edit3 className="h-3.5 w-3.5" />
                                              </label>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredConnections.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-12 w-12 text-slate-600" />
              <p className="mt-4 text-sm text-slate-400">
                No connections match your search
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
