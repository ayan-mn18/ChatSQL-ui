/**
 * TanStack React Query hooks — the SINGLE source of truth for all data fetching.
 *
 * Every page/component imports from here instead of managing its own
 * useState + useEffect + try/catch + setLoading boilerplate.
 *
 * Features:
 *  - Automatic caching & deduplication (same query = 1 network request)
 *  - Background refetching when stale
 *  - Automatic retries on failure (2 retries with exponential backoff)
 *  - Optimistic/pessimistic mutation with cache invalidation
 *  - Request cancellation on unmount
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { connectionService, type TableDataOptions, type ColumnUpdate } from '../services/connection.service';
import { savedQueriesService, type CreateSavedQueryRequest, type UpdateSavedQueryRequest } from '../services/saved-queries.service';
import { usageService } from '../services/usage.service';
import { viewerService } from '../services/viewer.service';
import type { ConnectionPublic, TestConnectionRequest, CreateConnectionRequest, UpdateConnectionRequest } from '../types';
import toast from 'react-hot-toast';

// ============================================
// QUERY KEYS — centralized for cache invalidation
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

  // Table Data — includes all query params so pagination/sort/filter each get their own cache entry
  tableData: (
    connectionId: string,
    schemaName: string,
    tableName: string,
    options?: TableDataOptions
  ) => ['tableData', connectionId, schemaName, tableName, options ?? {}] as const,

  // ERD Relations
  erdRelations: (connectionId: string) => ['erdRelations', connectionId] as const,

  // Analytics
  connectionAnalytics: (connectionId: string) => ['connectionAnalytics', connectionId] as const,
  workspaceAnalytics: ['workspaceAnalytics'] as const,

  // Saved Queries
  savedQueries: (connectionId: string) => ['savedQueries', connectionId] as const,
  savedQuery: (connectionId: string, queryId: string) => ['savedQuery', connectionId, queryId] as const,

  // Usage
  usageDashboard: ['usageDashboard'] as const,
  availablePlans: ['availablePlans'] as const,
  subscription: ['subscription'] as const,
  payments: ['payments'] as const,
  readOnlyStatus: ['readOnlyStatus'] as const,
  tokenHistory: (page: number, pageSize: number) => ['tokenHistory', page, pageSize] as const,

  // Viewers
  viewers: ['viewers'] as const,
  viewerAccessRequests: ['viewerAccessRequests'] as const,
  myAccess: ['myAccess'] as const,
  currentUserRole: ['currentUserRole'] as const,
};

// ============================================
// STALE TIMES — how long data is considered fresh
// ============================================
const STALE_TIMES = {
  CONNECTIONS: 5 * 60 * 1000,      // 5 min
  SCHEMAS: 30 * 60 * 1000,         // 30 min (stable)
  TABLES: 30 * 60 * 1000,          // 30 min (stable)
  COLUMNS: 30 * 60 * 1000,         // 30 min (stable)
  TABLE_DATA: 60 * 1000,           // 1 min (can change frequently)
  ERD_RELATIONS: 30 * 60 * 1000,   // 30 min (stable)
  ANALYTICS: 2 * 60 * 1000,        // 2 min
  SAVED_QUERIES: 5 * 60 * 1000,    // 5 min
  USAGE: 2 * 60 * 1000,            // 2 min
  VIEWERS: 3 * 60 * 1000,          // 3 min
};

// ============================================
//  CONNECTIONS — Query + Mutations
// ============================================

/** Fetch all connections for the current user */
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

/** Fetch a single connection by ID */
export function useConnectionQuery(connectionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.connection(connectionId || ''),
    queryFn: async () => {
      if (!connectionId) throw new Error('Connection ID required');
      const response = await connectionService.getConnectionById(connectionId);
      return response.data;
    },
    enabled: !!connectionId,
    staleTime: STALE_TIMES.CONNECTIONS,
  });
}

/** Test a database connection */
export function useTestConnectionMutation() {
  return useMutation({
    mutationFn: (data: TestConnectionRequest) => connectionService.testConnection(data),
  });
}

/** Create a new connection — invalidates connections list on success */
export function useCreateConnectionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateConnectionRequest) => connectionService.createConnection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections });
    },
  });
}

/** Update a connection — invalidates connections list + that connection's cache */
export function useUpdateConnectionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConnectionRequest }) =>
      connectionService.updateConnection(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections });
      queryClient.invalidateQueries({ queryKey: queryKeys.connection(variables.id) });
    },
  });
}

/** Delete a connection — removes from cache optimistically */
export function useDeleteConnectionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => connectionService.deleteConnection(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.connections });
      const previous = queryClient.getQueryData<ConnectionPublic[]>(queryKeys.connections);
      queryClient.setQueryData<ConnectionPublic[]>(queryKeys.connections, (old) =>
        old ? old.filter((c) => c.id !== id) : []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.connections, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections });
    },
  });
}

/** Sync schema for a connection */
export function useSyncSchemaMutation() {
  return useMutation({
    mutationFn: (id: string) => connectionService.syncSchema(id),
  });
}

/** Enable extension for a connection */
export function useEnableExtensionMutation() {
  return useMutation({
    mutationFn: ({ connectionId, extensionName }: { connectionId: string; extensionName: string }) =>
      connectionService.enableExtension(connectionId, extensionName),
  });
}

// ============================================
//  SCHEMAS — Query + Mutations
// ============================================

/** Fetch schemas for a connection */
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

/** Fetch tables for a specific schema */
export function useTablesQuery(connectionId: string | undefined, schemaName: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tables(connectionId || '', schemaName || ''),
    queryFn: async () => {
      if (!connectionId || !schemaName) throw new Error('Connection ID and schema name required');
      const response = await connectionService.getTablesBySchema(connectionId, schemaName);
      return (response as any).tables || response.data || [];
    },
    enabled: !!connectionId && !!schemaName,
    staleTime: STALE_TIMES.TABLES,
  });
}

/** Fetch columns for a specific table */
export function useColumnsQuery(
  connectionId: string | undefined,
  schemaName: string | undefined,
  tableName: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.columns(connectionId || '', schemaName || '', tableName || ''),
    queryFn: async () => {
      if (!connectionId || !schemaName || !tableName) {
        throw new Error('Connection ID, schema, and table required');
      }
      const response = await connectionService.getTableColumns(connectionId, schemaName, tableName);
      return response;
    },
    enabled: !!connectionId && !!schemaName && !!tableName,
    staleTime: STALE_TIMES.COLUMNS,
  });
}

/** Update schema selection (is_selected) */
export function useUpdateSchemaSelectionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      connectionId,
      schemas,
    }: {
      connectionId: string;
      schemas: Array<{ schema_name: string; is_selected: boolean }>;
    }) => connectionService.updateSchemas(connectionId, schemas),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schemas(variables.connectionId) });
    },
  });
}

// ============================================
//  TABLE DATA — Query + CRUD Mutations
// ============================================

/**
 * Fetch table data with pagination, sorting, and filtering.
 * Uses `keepPreviousData` so the old page stays visible while next page loads.
 */
export function useTableDataQuery(
  connectionId: string | undefined,
  schemaName: string | undefined,
  tableName: string | undefined,
  options: TableDataOptions = {},
  enabled: boolean = true
) {
  return useQuery({
    queryKey: queryKeys.tableData(connectionId || '', schemaName || '', tableName || '', options),
    queryFn: async () => {
      if (!connectionId || !schemaName || !tableName) {
        throw new Error('Connection ID, schema, and table required');
      }
      const response = await connectionService.getTableData(connectionId, schemaName, tableName, options);
      return response;
    },
    enabled: enabled && !!connectionId && !!schemaName && !!tableName,
    staleTime: STALE_TIMES.TABLE_DATA,
    placeholderData: keepPreviousData,
  });
}

/** Insert a row — invalidates table data cache */
export function useInsertRowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      connectionId,
      schemaName,
      tableName,
      values,
    }: {
      connectionId: string;
      schemaName: string;
      tableName: string;
      values: Record<string, any>;
    }) => connectionService.insertRow(connectionId, schemaName, tableName, values),
    onSuccess: (_data, variables) => {
      toast.success('Row inserted successfully');
      queryClient.invalidateQueries({
        queryKey: ['tableData', variables.connectionId, variables.schemaName, variables.tableName],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || 'Failed to insert row');
    },
  });
}

/** Update a row — invalidates table data cache */
export function useUpdateRowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      connectionId,
      schemaName,
      tableName,
      rowId,
      primaryKeyColumn,
      updates,
    }: {
      connectionId: string;
      schemaName: string;
      tableName: string;
      rowId: string | number;
      primaryKeyColumn: string;
      updates: ColumnUpdate[];
    }) => connectionService.updateRow(connectionId, schemaName, tableName, rowId, primaryKeyColumn, updates),
    onSuccess: (_data, variables) => {
      toast.success('Row updated successfully');
      queryClient.invalidateQueries({
        queryKey: ['tableData', variables.connectionId, variables.schemaName, variables.tableName],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || 'Failed to update row');
    },
  });
}

/** Delete a row — invalidates table data cache */
export function useDeleteRowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      connectionId,
      schemaName,
      tableName,
      rowId,
      primaryKeyColumn,
    }: {
      connectionId: string;
      schemaName: string;
      tableName: string;
      rowId: string | number;
      primaryKeyColumn: string;
    }) => connectionService.deleteRow(connectionId, schemaName, tableName, rowId, primaryKeyColumn),
    onSuccess: (_data, variables) => {
      toast.success('Row deleted successfully');
      queryClient.invalidateQueries({
        queryKey: ['tableData', variables.connectionId, variables.schemaName, variables.tableName],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || 'Failed to delete row');
    },
  });
}

/** Execute a raw SQL query (SELECT, INSERT, UPDATE, DELETE, DDL) */
export function useExecuteQueryMutation() {
  return useMutation({
    mutationFn: ({
      connectionId,
      query,
      readOnly,
    }: {
      connectionId: string;
      query: string;
      readOnly?: boolean;
    }) => connectionService.executeQuery(connectionId, query, readOnly),
  });
}

// ============================================
//  ERD RELATIONS
// ============================================

/** Fetch ERD relations (foreign keys) for a connection */
export function useErdRelationsQuery(connectionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.erdRelations(connectionId || ''),
    queryFn: async () => {
      if (!connectionId) throw new Error('Connection ID required');
      const response = await connectionService.getRelations(connectionId);
      return (response as any).relations || response.data || [];
    },
    enabled: !!connectionId,
    staleTime: STALE_TIMES.ERD_RELATIONS,
  });
}

// ============================================
//  ANALYTICS
// ============================================

/** Fetch analytics for a specific connection */
export function useConnectionAnalyticsQuery(connectionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.connectionAnalytics(connectionId || ''),
    queryFn: async () => {
      if (!connectionId) throw new Error('Connection ID required');
      const response = await connectionService.getConnectionAnalytics(connectionId);
      return response;
    },
    enabled: !!connectionId,
    staleTime: STALE_TIMES.ANALYTICS,
  });
}

/** Fetch workspace-wide analytics */
export function useWorkspaceAnalyticsQuery() {
  return useQuery({
    queryKey: queryKeys.workspaceAnalytics,
    queryFn: async () => {
      const response = await connectionService.getWorkspaceAnalytics();
      return response;
    },
    staleTime: STALE_TIMES.ANALYTICS,
  });
}

// ============================================
//  SAVED QUERIES
// ============================================

/** Fetch all saved queries for a connection */
export function useSavedQueriesQuery(connectionId: string | undefined, search?: string) {
  return useQuery({
    queryKey: [...queryKeys.savedQueries(connectionId || ''), search || ''],
    queryFn: async () => {
      if (!connectionId) throw new Error('Connection ID required');
      const response = await savedQueriesService.getAll(connectionId, search);
      return response.data || [];
    },
    enabled: !!connectionId,
    staleTime: STALE_TIMES.SAVED_QUERIES,
  });
}

/** Create a saved query */
export function useCreateSavedQueryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ connectionId, data }: { connectionId: string; data: CreateSavedQueryRequest }) =>
      savedQueriesService.create(connectionId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedQueries(variables.connectionId) });
      toast.success('Query saved');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || 'Failed to save query');
    },
  });
}

/** Update a saved query */
export function useUpdateSavedQueryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      connectionId,
      queryId,
      data,
    }: {
      connectionId: string;
      queryId: string;
      data: UpdateSavedQueryRequest;
    }) => savedQueriesService.update(connectionId, queryId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedQueries(variables.connectionId) });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || 'Failed to update query');
    },
  });
}

/** Delete a saved query */
export function useDeleteSavedQueryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ connectionId, queryId }: { connectionId: string; queryId: string }) =>
      savedQueriesService.delete(connectionId, queryId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedQueries(variables.connectionId) });
      toast.success('Query deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || 'Failed to delete query');
    },
  });
}

// ============================================
//  USAGE & BILLING
// ============================================

/** Fetch full usage dashboard data */
export function useUsageDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.usageDashboard,
    queryFn: () => usageService.getDashboard(),
    staleTime: STALE_TIMES.USAGE,
  });
}

/** Fetch available plans (pricing page) */
export function useAvailablePlansQuery() {
  return useQuery({
    queryKey: queryKeys.availablePlans,
    queryFn: () => usageService.getAvailablePlans(),
    staleTime: 30 * 60 * 1000, // 30 min — rarely changes
  });
}

/** Fetch subscription info */
export function useSubscriptionQuery() {
  return useQuery({
    queryKey: queryKeys.subscription,
    queryFn: () => usageService.getSubscription(),
    staleTime: STALE_TIMES.USAGE,
  });
}

/** Fetch payment history */
export function usePaymentsQuery(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...queryKeys.payments, page, pageSize],
    queryFn: () => usageService.getPaymentHistory(page, pageSize),
    staleTime: STALE_TIMES.USAGE,
  });
}

/** Fetch read-only status (plan limits) */
export function useReadOnlyStatusQuery() {
  return useQuery({
    queryKey: queryKeys.readOnlyStatus,
    queryFn: () => usageService.getReadOnlyStatus(),
    staleTime: 60 * 1000, // 1 min
  });
}

/** Fetch token history */
export function useTokenHistoryQuery(page = 1, pageSize = 50) {
  return useQuery({
    queryKey: queryKeys.tokenHistory(page, pageSize),
    queryFn: () => usageService.getTokenHistory(page, pageSize),
    staleTime: STALE_TIMES.USAGE,
    placeholderData: keepPreviousData,
  });
}

/** Create checkout session */
export function useCreateCheckoutMutation() {
  return useMutation({
    mutationFn: (planType: 'pro_monthly' | 'pro_yearly' | 'lifetime') =>
      usageService.createCheckout(planType),
  });
}

/** Cancel subscription */
export function useCancelSubscriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => usageService.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription });
      queryClient.invalidateQueries({ queryKey: queryKeys.usageDashboard });
    },
  });
}

// ============================================
//  VIEWERS
// ============================================

/** Fetch current user role */
export function useCurrentUserRoleQuery() {
  return useQuery({
    queryKey: queryKeys.currentUserRole,
    queryFn: () => viewerService.getCurrentUserRole(),
    staleTime: STALE_TIMES.VIEWERS,
  });
}

/** Fetch all viewers (admin) */
export function useViewersQuery() {
  return useQuery({
    queryKey: queryKeys.viewers,
    queryFn: () => viewerService.getViewers(),
    staleTime: STALE_TIMES.VIEWERS,
  });
}

/** Fetch my viewer access info */
export function useMyAccessQuery() {
  return useQuery({
    queryKey: queryKeys.myAccess,
    queryFn: () => viewerService.getMyAccess(),
    staleTime: STALE_TIMES.VIEWERS,
  });
}

/** Fetch access requests (admin) */
export function useAccessRequestsQuery() {
  return useQuery({
    queryKey: queryKeys.viewerAccessRequests,
    queryFn: () => viewerService.getAccessRequests(),
    staleTime: STALE_TIMES.VIEWERS,
  });
}

// ============================================
//  CACHE INVALIDATION HELPERS
// ============================================

export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  return {
    invalidateConnections: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.connections }),

    invalidateSchemas: (connectionId: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.schemas(connectionId) }),

    invalidateTables: (connectionId: string, schemaName: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.tables(connectionId, schemaName) }),

    invalidateColumns: (connectionId: string, schemaName: string, tableName: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.columns(connectionId, schemaName, tableName) }),

    invalidateTableData: (connectionId: string, schemaName: string, tableName: string) =>
      queryClient.invalidateQueries({ queryKey: ['tableData', connectionId, schemaName, tableName] }),

    invalidateAllSchemaData: (connectionId: string) => {
      queryClient.invalidateQueries({ queryKey: ['schemas', connectionId] });
      queryClient.invalidateQueries({ queryKey: ['tables', connectionId] });
      queryClient.invalidateQueries({ queryKey: ['columns', connectionId] });
      queryClient.invalidateQueries({ queryKey: ['erdRelations', connectionId] });
    },

    invalidateAnalytics: (connectionId?: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaceAnalytics });
      if (connectionId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.connectionAnalytics(connectionId) });
      }
    },

    invalidateUsage: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.usageDashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.readOnlyStatus });
    },

    invalidateViewers: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.viewers }),
  };
}

// ============================================
//  PREFETCH HELPERS
// ============================================

export function usePrefetch() {
  const queryClient = useQueryClient();

  return {
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
