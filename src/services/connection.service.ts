import { api } from '../lib/api';
import {
  TestConnectionRequest,
  TestConnectionResponse,
  CreateConnectionRequest,
  UpdateConnectionRequest,
  ConnectionPublic,
  DatabaseSchemaPublic,
  TableSchema,
  ERDRelation,
  ApiResponse,
} from '../types';

/**
 * Connection Service
 * Handles all database connection API calls
 */
export const connectionService = {
  // ============================================
  // TEST CONNECTION
  // ============================================
  
  /**
   * Test a database connection without saving
   * @param data - Connection credentials to test
   * @returns TestConnectionResponse with success status, latency, and available schemas
   */
  testConnection: async (data: TestConnectionRequest): Promise<TestConnectionResponse> => {
    const response = await api.post<TestConnectionResponse>('/connections/test', data);
    return response.data;
  },

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Create a new database connection
   * @param data - Connection details including name and credentials
   * @returns Created connection (without password)
   */
  createConnection: async (data: CreateConnectionRequest): Promise<ApiResponse<ConnectionPublic>> => {
    const response = await api.post<ApiResponse<ConnectionPublic>>('/connections', data);
    return response.data;
  },

  /**
   * Get all connections for the authenticated user
   * @returns List of user's connections (without passwords)
   */
  getAllConnections: async (): Promise<ApiResponse<ConnectionPublic[]>> => {
    const response = await api.get<ApiResponse<ConnectionPublic[]>>('/connections');
    return response.data;
  },

  /**
   * Get a single connection by ID
   * @param id - Connection UUID
   * @returns Connection details (without password)
   */
  getConnectionById: async (id: string): Promise<ApiResponse<ConnectionPublic>> => {
    const response = await api.get<ApiResponse<ConnectionPublic>>(`/connections/${id}`);
    return response.data;
  },

  /**
   * Update an existing connection
   * @param id - Connection UUID
   * @param data - Fields to update
   * @returns Updated connection (without password)
   */
  updateConnection: async (id: string, data: UpdateConnectionRequest): Promise<ApiResponse<ConnectionPublic>> => {
    const response = await api.put<ApiResponse<ConnectionPublic>>(`/connections/${id}`, data);
    return response.data;
  },

  /**
   * Delete a connection
   * @param id - Connection UUID
   * @returns Success status
   */
  deleteConnection: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/connections/${id}`);
    return response.data;
  },

  // ============================================
  // SCHEMA OPERATIONS
  // ============================================

  /**
   * Manually trigger schema sync for a connection
   * @param id - Connection UUID
   * @returns Schema sync job status
   */
  syncSchema: async (id: string): Promise<ApiResponse<{ jobId: string; message: string }>> => {
    const response = await api.post<ApiResponse<{ jobId: string; message: string }>>(`/connections/${id}/sync-schema`);
    return response.data;
  },

  /**
   * Get all PostgreSQL schemas for a connection
   * @param id - Connection UUID
   * @returns List of schemas with table counts and selection status
   */
  getSchemas: async (id: string): Promise<ApiResponse<DatabaseSchemaPublic[]>> => {
    const response = await api.get<ApiResponse<DatabaseSchemaPublic[]>>(`/connections/${id}/schemas`);
    return response.data;
  },

  /**
   * Get full schema metadata including all tables and columns for autocomplete
   * @param id - Connection UUID
   * @returns Full schema metadata for SQL editor autocomplete
   */
  getFullSchema: async (id: string): Promise<ApiResponse<{
    tables: Array<{
      schema: string;
      name: string;
      columns: Array<{ name: string; type: string }>;
    }>;
  }>> => {
    const response = await api.get<ApiResponse<any>>(`/connections/${id}/schema-metadata`);
    return response.data;
  },

  /**
   * Update which schemas are selected for use
   * @param id - Connection UUID
   * @param schemas - Array of schema selections
   * @returns Updated schemas list
   */
  updateSchemas: async (
    id: string, 
    schemas: Array<{ schema_name: string; is_selected: boolean }>
  ): Promise<ApiResponse<DatabaseSchemaPublic[]>> => {
    const response = await api.put<ApiResponse<DatabaseSchemaPublic[]>>(`/connections/${id}/schemas`, { schemas });
    return response.data;
  },

  /**
   * Get all tables for a specific PostgreSQL schema
   * @param connectionId - Connection UUID
   * @param schemaName - PostgreSQL schema name (e.g., 'public')
   * @returns List of tables with full metadata
   */
  getTablesBySchema: async (connectionId: string, schemaName: string): Promise<ApiResponse<TableSchema[]>> => {
    const response = await api.get<ApiResponse<TableSchema[]>>(`/connections/${connectionId}/schemas/${schemaName}/tables`);
    return response.data;
  },

  /**
   * Get all ERD relations (foreign keys) for a connection
   * @param connectionId - Connection UUID
   * @returns List of foreign key relationships for ERD visualization
   */
  getRelations: async (id: string): Promise<ApiResponse<ERDRelation[]>> => {
    const response = await api.get<ApiResponse<ERDRelation[]>>(`/connections/${id}/relations`);
    return response.data;
  },

  /**
   * Get real-time database analytics and statistics
   * @param id - Connection UUID
   * @returns Analytics data including DB size, connections, and query stats
   */
  getConnectionAnalytics: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.get<ApiResponse<any>>(`/connections/${id}/analytics`);
    return response.data;
  },

  /**
   * Enable a PostgreSQL extension on the database
   * @param id - Connection UUID
   * @param extensionName - Name of the extension (e.g., 'pg_stat_statements')
   * @returns Success status and message
   */
  enableExtension: async (id: string, extensionName: string): Promise<ApiResponse<any>> => {
    const response = await api.post<ApiResponse<any>>(`/connections/${id}/extensions`, { extensionName });
    return response.data;
  },

  // ============================================
  // TABLE DATA OPERATIONS
  // ============================================

  /**
   * Get table columns with metadata
   * @param connectionId - Connection UUID
   * @param schemaName - PostgreSQL schema name
   * @param tableName - Table name
   * @returns Column definitions and primary key info
   */
  getTableColumns: async (
    connectionId: string,
    schemaName: string,
    tableName: string
  ): Promise<ApiResponse<TableColumnsResponse>> => {
    const response = await api.get<ApiResponse<TableColumnsResponse>>(
      `/connections/${connectionId}/tables/${schemaName}/${tableName}/columns`
    );
    return response.data;
  },

  /**
   * Get table data with pagination, sorting, and filtering
   * @param connectionId - Connection UUID
   * @param schemaName - PostgreSQL schema name
   * @param tableName - Table name
   * @param options - Pagination, sorting, and filtering options
   * @returns Paginated table data
   */
  getTableData: async (
    connectionId: string,
    schemaName: string,
    tableName: string,
    options: TableDataOptions = {}
  ): Promise<ApiResponse<TableDataResponse>> => {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', String(options.page));
    if (options.pageSize) params.append('pageSize', String(options.pageSize));
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    if (options.filters && options.filters.length > 0) {
      params.append('filters', JSON.stringify(options.filters));
    }
    
    const queryString = params.toString();
    const url = `/connections/${connectionId}/tables/${schemaName}/${tableName}/data${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<ApiResponse<TableDataResponse>>(url);
    return response.data;
  },

  /**
   * Insert a new row into a table
   * @param connectionId - Connection UUID
   * @param schemaName - PostgreSQL schema name
   * @param tableName - Table name
   * @param values - Column values for the new row
   * @returns Mutation result
   */
  insertRow: async (
    connectionId: string,
    schemaName: string,
    tableName: string,
    values: Record<string, any>
  ): Promise<ApiResponse<MutationResult>> => {
    const response = await api.post<ApiResponse<MutationResult>>(
      `/connections/${connectionId}/tables/${schemaName}/${tableName}/data`,
      { values }
    );
    return response.data;
  },

  /**
   * Update a row in a table
   * @param connectionId - Connection UUID
   * @param schemaName - PostgreSQL schema name
   * @param tableName - Table name
   * @param rowId - Primary key value
   * @param primaryKeyColumn - Primary key column name
   * @param updates - Column updates
   * @returns Mutation result
   */
  updateRow: async (
    connectionId: string,
    schemaName: string,
    tableName: string,
    rowId: string | number,
    primaryKeyColumn: string,
    updates: ColumnUpdate[]
  ): Promise<ApiResponse<MutationResult>> => {
    const response = await api.put<ApiResponse<MutationResult>>(
      `/connections/${connectionId}/tables/${schemaName}/${tableName}/data/${rowId}`,
      { primaryKeyColumn, updates }
    );
    return response.data;
  },

  /**
   * Delete a row from a table
   * @param connectionId - Connection UUID
   * @param schemaName - PostgreSQL schema name
   * @param tableName - Table name
   * @param rowId - Primary key value
   * @param primaryKeyColumn - Primary key column name
   * @returns Mutation result
   */
  deleteRow: async (
    connectionId: string,
    schemaName: string,
    tableName: string,
    rowId: string | number,
    primaryKeyColumn: string
  ): Promise<ApiResponse<MutationResult>> => {
    const response = await api.delete<ApiResponse<MutationResult>>(
      `/connections/${connectionId}/tables/${schemaName}/${tableName}/data/${rowId}`,
      { data: { primaryKeyColumn } }
    );
    return response.data;
  },

  /**
   * Execute a raw SQL query
   * @param connectionId - Connection UUID
   * @param query - SQL query string
   * @param readOnly - Whether to enforce read-only mode
   * @returns Query results
   */
  executeQuery: async (
    connectionId: string,
    query: string,
    readOnly: boolean = true
  ): Promise<ApiResponse<QueryResult>> => {
    const response = await api.post<ApiResponse<QueryResult>>(
      `/connections/${connectionId}/query`,
      { query, readOnly }
    );
    return response.data;
  },
};

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface TableColumnsResponse {
  columns: ColumnDefinition[];
  primaryKey: string;
  schemaName: string;
  tableName: string;
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: {
    table: string;
    column: string;
  };
}

export interface TableDataOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: FilterCondition[];
}

export interface FilterCondition {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is_null' | 'is_not_null';
  value: any;
}

export interface TableDataResponse {
  rows: Record<string, any>[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  columns: string[];
  primaryKeyColumn?: string;
  cached?: boolean;
  cachedAt?: string;
}

export interface ColumnUpdate {
  column: string;
  value: any;
  columnType: string;
}

export interface MutationResult {
  success: boolean;
  affectedRows: number;
  message: string;
  jobId?: string;
}

export interface QueryResult {
  success: boolean;
  rows: any[];
  rowCount: number;
  executionTime: number;
  jobId?: string;
}

export default connectionService;
