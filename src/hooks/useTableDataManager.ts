/**
 * useTableDataManager — drop-in replacement for the old useTableData hook.
 *
 * Internally powered by TanStack Query for caching, deduplication,
 * automatic retries, and background refetching.
 *
 * Exposes the EXACT same return shape (data, columns, loading, mutating,
 * error, fetchData, fetchColumns, refetch, goToPage, setPageSize,
 * toggleSort, setFilters, clearFilters, insertRow, updateRow, deleteRow,
 * currentOptions) so TableView.tsx needs minimal changes.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  useTableDataQuery,
  useColumnsQuery,
  useInsertRowMutation,
  useUpdateRowMutation,
  useDeleteRowMutation,
} from './useQueries';
import type {
  TableDataOptions,
  TableDataResponse,
  TableColumnsResponse,
  ColumnUpdate,
  FilterCondition,
} from '../services/connection.service';

export interface UseTableDataManagerReturn {
  // State
  data: TableDataResponse | null;
  columns: TableColumnsResponse | null;
  loading: boolean;
  mutating: boolean;
  error: string | null;

  // Data operations
  fetchData: (options?: Partial<TableDataOptions>) => void;
  fetchColumns: () => void;
  refetch: () => Promise<void>;

  // Pagination
  goToPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;

  // Sorting
  setSorting: (sortBy: string, sortOrder: 'ASC' | 'DESC') => void;
  toggleSort: (column: string) => void;

  // Filtering
  setFilters: (filters: FilterCondition[]) => void;
  addFilter: (filter: FilterCondition) => void;
  removeFilter: (columnName: string) => void;
  clearFilters: () => void;

  // CRUD
  insertRow: (values: Record<string, any>) => Promise<boolean>;
  updateRow: (rowId: string | number, updates: ColumnUpdate[]) => Promise<boolean>;
  deleteRow: (rowId: string | number) => Promise<boolean>;

  // Current options
  currentOptions: TableDataOptions;
}

export function useTableDataManager(
  connectionId: string,
  schemaName: string,
  tableName: string,
  initialOptions: TableDataOptions = {}
): UseTableDataManagerReturn {
  // ── Pagination / sort / filter state ──────────────────────────────
  const [options, setOptions] = useState<TableDataOptions>({
    page: 1,
    pageSize: 50,
    sortOrder: 'ASC',
    filters: [],
    ...initialOptions,
  });

  // ── TanStack Queries ──────────────────────────────────────────────
  const tableDataQuery = useTableDataQuery(
    connectionId,
    schemaName,
    tableName,
    options,
    !!connectionId && !!schemaName && !!tableName
  );

  const columnsQuery = useColumnsQuery(connectionId, schemaName, tableName);

  // ── Mutations ─────────────────────────────────────────────────────
  const insertMutation = useInsertRowMutation();
  const updateMutation = useUpdateRowMutation();
  const deleteMutation = useDeleteRowMutation();

  // ── Derived values ────────────────────────────────────────────────
  const data: TableDataResponse | null = useMemo(() => {
    if (!tableDataQuery.data) return null;
    // The API returns { success, data: { rows, ... } } — flatten
    const raw = tableDataQuery.data as any;
    return raw?.data ?? raw ?? null;
  }, [tableDataQuery.data]);

  const columns: TableColumnsResponse | null = useMemo(() => {
    if (!columnsQuery.data) return null;
    const raw = columnsQuery.data as any;
    return raw?.data ?? raw ?? null;
  }, [columnsQuery.data]);

  const primaryKeyColumn = useMemo(() => {
    return columns?.primaryKey || data?.primaryKeyColumn || 'id';
  }, [columns, data]);

  const loading = tableDataQuery.isLoading || tableDataQuery.isFetching;
  const mutating = insertMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const error = tableDataQuery.error
    ? (tableDataQuery.error as any)?.message || 'Failed to fetch table data'
    : null;

  // ── Data operations ───────────────────────────────────────────────
  const fetchData = useCallback(
    (newOptions?: Partial<TableDataOptions>) => {
      if (newOptions) {
        setOptions(prev => ({ ...prev, ...newOptions }));
      }
      // TanStack automatically refetches when options (queryKey) change
    },
    []
  );

  const fetchColumns = useCallback(() => {
    columnsQuery.refetch();
  }, [columnsQuery]);

  const refetch = useCallback(async () => {
    await tableDataQuery.refetch();
  }, [tableDataQuery]);

  // ── Pagination ────────────────────────────────────────────────────
  const goToPage = useCallback(
    (page: number) => setOptions(prev => ({ ...prev, page })),
    []
  );

  const setPageSize = useCallback(
    (pageSize: number) => setOptions(prev => ({ ...prev, page: 1, pageSize })),
    []
  );

  // ── Sorting ───────────────────────────────────────────────────────
  const setSorting = useCallback(
    (sortBy: string, sortOrder: 'ASC' | 'DESC') =>
      setOptions(prev => ({ ...prev, sortBy, sortOrder, page: 1 })),
    []
  );

  const toggleSort = useCallback(
    (column: string) => {
      setOptions(prev => {
        if (prev.sortBy === column) {
          return { ...prev, sortOrder: prev.sortOrder === 'ASC' ? 'DESC' : 'ASC', page: 1 };
        }
        return { ...prev, sortBy: column, sortOrder: 'ASC', page: 1 };
      });
    },
    []
  );

  // ── Filtering ─────────────────────────────────────────────────────
  const setFilters = useCallback(
    (filters: FilterCondition[]) => setOptions(prev => ({ ...prev, filters, page: 1 })),
    []
  );

  const addFilter = useCallback(
    (filter: FilterCondition) =>
      setOptions(prev => {
        const existing = (prev.filters || []).filter(f => f.column !== filter.column);
        existing.push(filter);
        return { ...prev, filters: existing, page: 1 };
      }),
    []
  );

  const removeFilter = useCallback(
    (columnName: string) =>
      setOptions(prev => ({
        ...prev,
        filters: (prev.filters || []).filter(f => f.column !== columnName),
        page: 1,
      })),
    []
  );

  const clearFilters = useCallback(
    () => setOptions(prev => ({ ...prev, filters: [], page: 1 })),
    []
  );

  // ── CRUD ──────────────────────────────────────────────────────────
  const insertRow = useCallback(
    async (values: Record<string, any>): Promise<boolean> => {
      try {
        await insertMutation.mutateAsync({
          connectionId,
          schemaName,
          tableName,
          values,
        });
        return true;
      } catch {
        return false;
      }
    },
    [connectionId, schemaName, tableName, insertMutation]
  );

  const updateRow = useCallback(
    async (rowId: string | number, updates: ColumnUpdate[]): Promise<boolean> => {
      try {
        await updateMutation.mutateAsync({
          connectionId,
          schemaName,
          tableName,
          rowId,
          primaryKeyColumn,
          updates,
        });
        return true;
      } catch {
        return false;
      }
    },
    [connectionId, schemaName, tableName, primaryKeyColumn, updateMutation]
  );

  const deleteRow = useCallback(
    async (rowId: string | number): Promise<boolean> => {
      try {
        await deleteMutation.mutateAsync({
          connectionId,
          schemaName,
          tableName,
          rowId,
          primaryKeyColumn,
        });
        return true;
      } catch {
        return false;
      }
    },
    [connectionId, schemaName, tableName, primaryKeyColumn, deleteMutation]
  );

  // ── Return ────────────────────────────────────────────────────────
  return {
    data,
    columns,
    loading,
    mutating,
    error,
    fetchData,
    fetchColumns,
    refetch,
    goToPage,
    setPageSize,
    setSorting,
    toggleSort,
    setFilters,
    addFilter,
    removeFilter,
    clearFilters,
    insertRow,
    updateRow,
    deleteRow,
    currentOptions: options,
  };
}

export default useTableDataManager;
