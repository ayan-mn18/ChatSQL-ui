import { useState, useCallback, useMemo } from 'react';
import { connectionService, TableDataOptions, TableDataResponse, ColumnUpdate, FilterCondition, TableColumnsResponse } from '../services/connection.service';
import toast from 'react-hot-toast';

// ============================================
// HOOK STATE
// ============================================

interface UseTableDataState {
  data: TableDataResponse | null;
  columns: TableColumnsResponse | null;
  loading: boolean;
  mutating: boolean;
  error: string | null;
}

interface UseTableDataReturn extends UseTableDataState {
  // Data operations
  fetchData: (options?: Partial<TableDataOptions>) => Promise<void>;
  fetchColumns: () => Promise<void>;
  refetch: () => Promise<void>;
  
  // Pagination
  goToPage: (page: number) => Promise<void>;
  setPageSize: (pageSize: number) => Promise<void>;
  
  // Sorting
  setSorting: (sortBy: string, sortOrder: 'ASC' | 'DESC') => Promise<void>;
  toggleSort: (column: string) => Promise<void>;
  
  // Filtering
  setFilters: (filters: FilterCondition[]) => Promise<void>;
  addFilter: (filter: FilterCondition) => Promise<void>;
  removeFilter: (columnName: string) => Promise<void>;
  clearFilters: () => Promise<void>;
  
  // CRUD operations
  insertRow: (values: Record<string, any>) => Promise<boolean>;
  updateRow: (rowId: string | number, updates: ColumnUpdate[]) => Promise<boolean>;
  deleteRow: (rowId: string | number) => Promise<boolean>;
  
  // Current options
  currentOptions: TableDataOptions;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useTableData(
  connectionId: string,
  schemaName: string,
  tableName: string,
  initialOptions: TableDataOptions = {}
): UseTableDataReturn {
  // State
  const [state, setState] = useState<UseTableDataState>({
    data: null,
    columns: null,
    loading: false,
    mutating: false,
    error: null,
  });
  
  // Current query options
  const [options, setOptions] = useState<TableDataOptions>({
    page: 1,
    pageSize: 50,
    sortOrder: 'ASC',
    filters: [],
    ...initialOptions,
  });
  
  // Derive primary key column
  const primaryKeyColumn = useMemo(() => {
    return state.columns?.primaryKey || state.data?.primaryKeyColumn || 'id';
  }, [state.columns, state.data]);
  
  // ============================================
  // DATA FETCHING
  // ============================================
  
  const fetchData = useCallback(async (newOptions?: Partial<TableDataOptions>) => {
    if (!connectionId || !schemaName || !tableName) return;
    
    const fetchOptions = { ...options, ...newOptions };
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await connectionService.getTableData(
        connectionId,
        schemaName,
        tableName,
        fetchOptions
      );
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          data: response as unknown as TableDataResponse,
          loading: false,
        }));
        
        // Update options if different
        if (newOptions) {
          setOptions(fetchOptions);
        }
      } else {
        throw new Error((response as any).error || 'Failed to fetch data');
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch table data',
      }));
      toast.error(error.message || 'Failed to fetch table data');
    }
  }, [connectionId, schemaName, tableName, options]);
  
  const fetchColumns = useCallback(async () => {
    if (!connectionId || !schemaName || !tableName) return;
    
    try {
      const response = await connectionService.getTableColumns(
        connectionId,
        schemaName,
        tableName
      );
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          columns: response as unknown as TableColumnsResponse,
        }));
      }
    } catch (error: any) {
      // Non-critical - columns are optional
      console.warn('Failed to fetch columns:', error);
    }
  }, [connectionId, schemaName, tableName]);
  
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);
  
  // ============================================
  // PAGINATION
  // ============================================
  
  const goToPage = useCallback(async (page: number) => {
    await fetchData({ page });
  }, [fetchData]);
  
  const setPageSize = useCallback(async (pageSize: number) => {
    await fetchData({ page: 1, pageSize });
  }, [fetchData]);
  
  // ============================================
  // SORTING
  // ============================================
  
  const setSorting = useCallback(async (sortBy: string, sortOrder: 'ASC' | 'DESC') => {
    await fetchData({ sortBy, sortOrder, page: 1 });
  }, [fetchData]);
  
  const toggleSort = useCallback(async (column: string) => {
    const currentSortBy = options.sortBy;
    const currentSortOrder = options.sortOrder;
    
    if (currentSortBy === column) {
      // Toggle order
      const newOrder = currentSortOrder === 'ASC' ? 'DESC' : 'ASC';
      await setSorting(column, newOrder);
    } else {
      // New column, start with ASC
      await setSorting(column, 'ASC');
    }
  }, [options.sortBy, options.sortOrder, setSorting]);
  
  // ============================================
  // FILTERING
  // ============================================
  
  const setFilters = useCallback(async (filters: FilterCondition[]) => {
    await fetchData({ filters, page: 1 });
  }, [fetchData]);
  
  const addFilter = useCallback(async (filter: FilterCondition) => {
    const currentFilters = options.filters || [];
    // Replace if same column exists
    const newFilters = currentFilters.filter(f => f.column !== filter.column);
    newFilters.push(filter);
    await setFilters(newFilters);
  }, [options.filters, setFilters]);
  
  const removeFilter = useCallback(async (columnName: string) => {
    const currentFilters = options.filters || [];
    const newFilters = currentFilters.filter(f => f.column !== columnName);
    await setFilters(newFilters);
  }, [options.filters, setFilters]);
  
  const clearFilters = useCallback(async () => {
    await setFilters([]);
  }, [setFilters]);
  
  // ============================================
  // CRUD OPERATIONS
  // ============================================
  
  const insertRow = useCallback(async (values: Record<string, any>): Promise<boolean> => {
    setState(prev => ({ ...prev, mutating: true }));
    
    try {
      const response = await connectionService.insertRow(
        connectionId,
        schemaName,
        tableName,
        values
      );
      
      if (response.success) {
        toast.success('Row inserted successfully');
        // Refresh data
        await fetchData();
        return true;
      } else {
        throw new Error((response as any).error || 'Insert failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to insert row');
      return false;
    } finally {
      setState(prev => ({ ...prev, mutating: false }));
    }
  }, [connectionId, schemaName, tableName, fetchData]);
  
  const updateRow = useCallback(async (rowId: string | number, updates: ColumnUpdate[]): Promise<boolean> => {
    setState(prev => ({ ...prev, mutating: true }));
    
    try {
      const response = await connectionService.updateRow(
        connectionId,
        schemaName,
        tableName,
        rowId,
        primaryKeyColumn,
        updates
      );
      
      if (response.success) {
        toast.success('Row updated successfully');
        // Refresh data
        await fetchData();
        return true;
      } else {
        throw new Error((response as any).error || 'Update failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update row');
      return false;
    } finally {
      setState(prev => ({ ...prev, mutating: false }));
    }
  }, [connectionId, schemaName, tableName, primaryKeyColumn, fetchData]);
  
  const deleteRow = useCallback(async (rowId: string | number): Promise<boolean> => {
    setState(prev => ({ ...prev, mutating: true }));
    
    try {
      const response = await connectionService.deleteRow(
        connectionId,
        schemaName,
        tableName,
        rowId,
        primaryKeyColumn
      );
      
      if (response.success) {
        toast.success('Row deleted successfully');
        // Refresh data
        await fetchData();
        return true;
      } else {
        throw new Error((response as any).error || 'Delete failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete row');
      return false;
    } finally {
      setState(prev => ({ ...prev, mutating: false }));
    }
  }, [connectionId, schemaName, tableName, primaryKeyColumn, fetchData]);
  
  // ============================================
  // RETURN VALUE
  // ============================================
  
  return {
    // State
    data: state.data,
    columns: state.columns,
    loading: state.loading,
    mutating: state.mutating,
    error: state.error,
    
    // Data operations
    fetchData,
    fetchColumns,
    refetch,
    
    // Pagination
    goToPage,
    setPageSize,
    
    // Sorting
    setSorting,
    toggleSort,
    
    // Filtering
    setFilters,
    addFilter,
    removeFilter,
    clearFilters,
    
    // CRUD
    insertRow,
    updateRow,
    deleteRow,
    
    // Current options
    currentOptions: options,
  };
}

export default useTableData;
