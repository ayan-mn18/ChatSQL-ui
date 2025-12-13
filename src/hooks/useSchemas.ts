import { useState, useCallback } from 'react';
import { connectionService } from '../services/connection.service';
import { DatabaseSchemaPublic, TableSchema } from '../types';

// ============================================
// SCHEMA HOOK STATE
// ============================================
interface UseSchemasState {
  schemas: DatabaseSchemaPublic[];
  tables: Record<string, TableSchema[]>; // Keyed by schema_name
  isLoading: boolean;
  isLoadingTables: Record<string, boolean>; // Loading state per schema
  error: string | null;
  connectionId: string | null;
}

// ============================================
// SCHEMA HOOK
// Manages schemas and tables for a connection
// ============================================
export function useSchemas() {
  const [state, setState] = useState<UseSchemasState>({
    schemas: [],
    tables: {},
    isLoading: false,
    isLoadingTables: {},
    error: null,
    connectionId: null,
  });

  // ============================================
  // FETCH SCHEMAS FOR A CONNECTION
  // ============================================
  const fetchSchemas = useCallback(async (connectionId: string): Promise<DatabaseSchemaPublic[]> => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      connectionId,
      // Clear previous data if switching connections
      schemas: prev.connectionId === connectionId ? prev.schemas : [],
      tables: prev.connectionId === connectionId ? prev.tables : {},
    }));
    
    try {
      const response = await connectionService.getSchemas(connectionId);
      const schemas = (response as any).schemas || response.data || [];
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        schemas,
        connectionId,
      }));
      
      return schemas;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch schemas';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, []);

  // ============================================
  // FETCH TABLES FOR A SPECIFIC SCHEMA
  // ============================================
  const fetchTables = useCallback(async (connectionId: string, schemaName: string): Promise<TableSchema[]> => {
    setState(prev => ({ 
      ...prev, 
      isLoadingTables: { ...prev.isLoadingTables, [schemaName]: true },
      error: null,
    }));
    
    try {
      const response = await connectionService.getTablesBySchema(connectionId, schemaName);
      const tables = (response as any).tables || response.data || [];
      
      setState(prev => ({ 
        ...prev, 
        isLoadingTables: { ...prev.isLoadingTables, [schemaName]: false },
        tables: { ...prev.tables, [schemaName]: tables },
      }));
      
      return tables;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch tables';
      setState(prev => ({ 
        ...prev, 
        isLoadingTables: { ...prev.isLoadingTables, [schemaName]: false },
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  }, []);

  // ============================================
  // UPDATE SCHEMA SELECTION
  // ============================================
  const updateSchemaSelection = useCallback(async (
    connectionId: string, 
    schemaName: string, 
    isSelected: boolean
  ): Promise<void> => {
    try {
      await connectionService.updateSchemas(connectionId, [{ schema_name: schemaName, is_selected: isSelected }]);
      
      // Update local state
      setState(prev => ({
        ...prev,
        schemas: prev.schemas.map(s => 
          s.schema_name === schemaName ? { ...s, is_selected: isSelected } : s
        ),
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update schema';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, []);

  // ============================================
  // GET ALL TABLES FLAT (for ERD visualization)
  // ============================================
  const getAllTables = useCallback((): TableSchema[] => {
    return Object.values(state.tables).flat();
  }, [state.tables]);

  // ============================================
  // GET TABLES FOR A SCHEMA (from cache)
  // ============================================
  const getTablesForSchema = useCallback((schemaName: string): TableSchema[] => {
    return state.tables[schemaName] || [];
  }, [state.tables]);

  // ============================================
  // CHECK IF TABLES ARE LOADED FOR A SCHEMA
  // ============================================
  const areTablesLoaded = useCallback((schemaName: string): boolean => {
    return schemaName in state.tables;
  }, [state.tables]);

  // ============================================
  // CLEAR STATE
  // ============================================
  const clearSchemas = useCallback(() => {
    setState({
      schemas: [],
      tables: {},
      isLoading: false,
      isLoadingTables: {},
      error: null,
      connectionId: null,
    });
  }, []);

  // ============================================
  // CLEAR ERROR
  // ============================================
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    schemas: state.schemas,
    tables: state.tables,
    isLoading: state.isLoading,
    isLoadingTables: state.isLoadingTables,
    error: state.error,
    connectionId: state.connectionId,
    
    // Actions
    fetchSchemas,
    fetchTables,
    updateSchemaSelection,
    getAllTables,
    getTablesForSchema,
    areTablesLoaded,
    clearSchemas,
    clearError,
  };
}

export default useSchemas;
