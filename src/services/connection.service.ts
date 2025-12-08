import { api } from '../lib/api';
import {
  TestConnectionRequest,
  TestConnectionResponse,
  CreateConnectionRequest,
  UpdateConnectionRequest,
  ConnectionPublic,
  DatabaseSchemaPublic,
  TableSchema,
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
};

export default connectionService;
