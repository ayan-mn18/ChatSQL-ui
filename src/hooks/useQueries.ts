/**
 * React Query hooks for data fetching with caching
 * 
 * These hooks provide automatic caching, background refetching,
 * and optimistic updates for a faster UI experience.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionService } from '../services/connection.service';
import { ConnectionPublic, DatabaseSchemaPublic, TableSchema } from '../types';

// ============================================
// QUERY KEYS - Centralized for cache invalidation
// ============================================
export const queryKeys = {
  // Connections
  connections: ['connections'] as const,
  connection: (id: string) => ['connection', id] as const,
  
  // Schemas
  schemas: (connectionId: string) => ['schemas', connectionId] as const,
  
  // Tables
  tables: (connectionId: string, schemaName: string) => 
    ['tables', connectionId, schemaName] as const,
  
  // Columns
  columns: (connectionId: string, schemaName: string, tableName: string) => 
    ['columns', connectionId, schemaName, tableName] as const,
  
  // Table Data
  tableData: (connectionId: string, schemaName: string, tableName: string, page: number, pageSize: number) => 
    ['tableData', connectionId, schemaName, tableName, page, pageSize] as const,
  
  // ERD Relations
  erdRelations: (connectionId: string) => ['erdRelations', connectionId] as const,
  
  // Analytics
  connectionAnalytics: (connectionId: string) => ['connectionAnalytics', connectionId] as const,
  workspaceAnalytics: ['workspaceAnalytics'] as const,
};

// ============================================
// STALE TIMES - How long data is considered fresh
// ============================================
const STALE_TIMES = {
  CONNECTIONS: 5 * 60 * 1000,      // 5 minutes
  SCHEMAS: 30 * 60 * 1000,         // 30 minutes (stable, changes rarely)
  TABLES: 30 * 60 * 1000,          // 30 minutes (stable, changes rarely)
  COLUMNS: 30 * 60 * 1000,         // 30 minutes (stable, changes rarely)
  TABLE_DATA: 60 * 1000,           // 1 minute (can change frequently)
  ERD_RELATIONS: 30 * 60 * 1000,   // 30 minutes (stable)
  ANALYTICS: 2 * 60 * 1000,        // 2 minutes
};

// ============================================
// CONNECTIONS HOOKS
// ============================================

/**
 * Fetch all connections for the current user
 * Cached for 5 minutes
 */
export function useConnectionsQuery() {
  return useQuery({
    queryKey: queryKeys.connections,
    queryFn: async () => {
      const response = await connectionService.getAllConnections();
      return response.data || [];
    },
    staleTime: STALE_TIMES.CONNECTIONS,
  });
}

/**
 * Fetch a single connection by ID
 */
export function useConnectionQuery(connectionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.connection(connectionId || ''),
    queryFn: async () => {
      if (!connectionId) throw new Error('Connection ID required');
      const response = await connectionService.getConnection(connectionId);
      return response.data;
    },
    enabled: !!connectionId,
    staleTime: STALE_TIMES.CONNECTIONS,
  });
}

// ============================================
// SCHEMA HOOKS
// ============================================

/**
 * Fetch schemas for a connection
 * Cached for 30 minutes (schemas rarely change)
 */
export function useSchemasQuery(connectionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.schemas(connectionId || ''),
    queryFn: async () => {
      if (!connectionId) throw new Error('Connection ID required');
      const response = await connectionService.getSchemas(connectionId);
      return (response as any).schemas || response.data || [];
    },
    enabled: !!connectionId,
    staleTime: STALE_TIMES.SCHEMAS,
  });
}

/**
 * Fetch tables for a specific schema
 * Cached for 30 minutes (tables rarely change)
 */
export function useTablesQuery(connectionId: string | undefined, schemaName: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tables(connectionId || '', schemaName || ''),
    queryFn: async () => {
      if (!connectionId || !schemaName) throw new Error('Connection ID and Schema name required');
      const response = await connectionService.getTablesBySchema(connectionId, schemaName);
      return (response as any).tables || response.data || [];
    },
    enabled: !!connectionId && !!schemaName,
    staleTime: STALE_TIMES.TABLES,
  });
}

/**
 * Fetch columns for a specific table
 * Cached for 30 minutes (columns rarely change)
 */
export function useColumnsQuery(
  connectionId: string | undefined, 
  schemaName: string | undefined, 
  tableName: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.columns(connectionId || '', schemaName || '', tableName || ''),
    queryFn: async () => {
      if (!connectionId || !schemaName || !tableName) {
        throw new Error('Connection ID, Schema name, and Table name required');
      }
      const response = await connectionService.getTableColumns(connectionId, schemaName, tableName);
      return (response as any).columns || response.data || [];
    },
    enabled: !!connectionId && !!schemaName && !!tableName,
    staleTime: STALE_TIMES.COLUMNS,
  });
}

// ============================================
// TABLE DATA HOOKS
// ============================================

/**
 * Fetch table data with pagination
 * Short cache time (1 minute) since data changes frequently
 */
export function useTableDataQuery(
  connectionId: string | undefined,
  schemaName: string | undefined,
  tableName: string | undefined,
  page: number = 1,
  pageSize: number = 50,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: queryKeys.tableData(connectionId || '', schemaName || '', tableName || '', page, pageSize),
    queryFn: async () => {
      if (!connectionId || !schemaName || !tableName) {
        throw new Error('Connection ID, Schema name, and Table name required');
      }
      const response = await connectionService.getTableData(connectionId, schemaName, tableName, page, pageSize);
      return response;
    },
    enabled: enabled && !!connectionId && !!schemaName && !!tableName,
    staleTime: STALE_TIMES.TABLE_DATA,
  });
}

// ============================================
// ERD RELATIONS HOOK
// ============================================

/**
 * Fetch ERD relations for a connection
 * Cached for 30 minutes (relations are stable)
 */
export function useErdRelationsQuery(connectionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.erdRelations(connectionId || ''),
    queryFn: async () => {
      if (!connectionId) throw new Error('Connection ID required');
      const response = await connectionService.getErdRelations(connectionId);
      return (response as any).relations || response.data || [];
    },
    enabled: !!connectionId,
    staleTime: STALE_TIMES.ERD_RELATIONS,
  });
}

// ============================================
// ANALYTICS HOOKS
// ============================================

/**
 * Fetch connection analytics
 * Short cache time (2 minutes) for relatively fresh data
 */
export function useConnectionAnalyticsQuery(connectionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.connectionAnalytics(connectionId || ''),
    queryFn: async () => {
      if (!connectionId) throw new Error('Connection ID required');
      const response = await connectionService.getAnalytics(connectionId);
      return response.data;
    },
    enabled: !!connectionId,
    staleTime: STALE_TIMES.ANALYTICS,
  });
}

/**
 * Fetch workspace analytics
 * Short cache time (2 minutes) for relatively fresh data
 */
export function useWorkspaceAnalyticsQuery() {
  return useQuery({
    queryKey: queryKeys.workspaceAnalytics,
    queryFn: async () => {
      const response = await connectionService.getWorkspaceAnalytics();
      return response.data;
    },
    staleTime: STALE_TIMES.ANALYTICS,
  });
}

// ============================================
// CACHE INVALIDATION HELPERS
// ============================================

/**
 * Hook to get cache invalidation functions
 * Use these after mutations to refresh stale data
 */
export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  return {
    // Invalidate all connections
    invalidateConnections: () => 
      queryClient.invalidateQueries({ queryKey: queryKeys.connections }),
    
    // Invalidate schemas for a connection
    invalidateSchemas: (connectionId: string) => 
      queryClient.invalidateQueries({ queryKey: queryKeys.schemas(connectionId) }),
    
    // Invalidate tables for a schema
    invalidateTables: (connectionId: string, schemaName: string) => 
      queryClient.invalidateQueries({ queryKey: queryKeys.tables(connectionId, schemaName) }),
    
    // Invalidate columns for a table
    invalidateColumns: (connectionId: string, schemaName: string, tableName: string) => 
      queryClient.invalidateQueries({ queryKey: queryKeys.columns(connectionId, schemaName, tableName) }),
    
    // Invalidate all schema data for a connection (after sync)
    invalidateAllSchemaData: (connectionId: string) => {
      queryClient.invalidateQueries({ queryKey: ['schemas', connectionId] });
      queryClient.invalidateQueries({ queryKey: ['tables', connectionId] });
      queryClient.invalidateQueries({ queryKey: ['columns', connectionId] });
      queryClient.invalidateQueries({ queryKey: ['erdRelations', connectionId] });
    },
    
    // Invalidate analytics
    invalidateAnalytics: (connectionId?: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaceAnalytics });
      if (connectionId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.connectionAnalytics(connectionId) });
      }
    },
  };
}

// ============================================
// PREFETCH HELPERS
// ============================================

/**
 * Hook to get prefetch functions
 * Use these to pre-load data before navigation
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  return {
    // Prefetch schemas when hovering over a connection
    prefetchSchemas: (connectionId: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.schemas(connectionId),
        queryFn: async () => {
          const response = await connectionService.getSchemas(connectionId);
          return (response as any).schemas || response.data || [];
        },
        staleTime: STALE_TIMES.SCHEMAS,
      });
    },
    
    // Prefetch tables when expanding a schema
    prefetchTables: (connectionId: string, schemaName: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.tables(connectionId, schemaName),
        queryFn: async () => {
          const response = await connectionService.getTablesBySchema(connectionId, schemaName);
          return (response as any).tables || response.data || [];
        },
        staleTime: STALE_TIMES.TABLES,
      });
    },
  };
}
