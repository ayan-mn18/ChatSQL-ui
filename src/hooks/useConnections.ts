import { useState, useCallback } from 'react';
import { connectionService } from '../services/connection.service';
import {
  TestConnectionRequest,
  TestConnectionResponse,
  CreateConnectionRequest,
  UpdateConnectionRequest,
  ConnectionPublic,
} from '../types';

// ============================================
// CONNECTION HOOK STATE
// ============================================
interface UseConnectionsState {
  connections: ConnectionPublic[];
  isLoading: boolean;
  error: string | null;
  testResult: TestConnectionResponse | null;
  isTesting: boolean;
}

// ============================================
// CONNECTION HOOK
// ============================================
export function useConnections() {
  const [state, setState] = useState<UseConnectionsState>({
    connections: [],
    isLoading: false,
    error: null,
    testResult: null,
    isTesting: false,
  });

  // ============================================
  // TEST CONNECTION
  // ============================================
  const testConnection = useCallback(async (data: TestConnectionRequest): Promise<TestConnectionResponse> => {
    setState(prev => ({ ...prev, isTesting: true, error: null, testResult: null }));
    
    try {
      const result = await connectionService.testConnection(data);
      setState(prev => ({ ...prev, isTesting: false, testResult: result }));
      return result;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to test connection';
      const errorCode = error.response?.data?.code || 'CONNECTION_TEST_ERROR';
      
      const result: TestConnectionResponse = {
        success: false,
        message: errorMessage,
        error: errorMessage,
        code: errorCode,
      };
      
      setState(prev => ({ ...prev, isTesting: false, testResult: result, error: errorMessage }));
      return result;
    }
  }, []);

  // ============================================
  // FETCH ALL CONNECTIONS
  // ============================================
  const fetchConnections = useCallback(async (): Promise<ConnectionPublic[]> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await connectionService.getAllConnections();
      const connections = response.data || [];
      setState(prev => ({ ...prev, isLoading: false, connections }));
      return connections;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch connections';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, []);

  // ============================================
  // CREATE CONNECTION
  // ============================================
  const createConnection = useCallback(async (data: CreateConnectionRequest): Promise<ConnectionPublic> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await connectionService.createConnection(data);
      // API returns { connection, jobId } in data
      const connectionData = (response.data as any)?.connection || response.data;
      
      if (!connectionData) {
        throw new Error('No connection data returned');
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        connections: [...prev.connections, connectionData],
      }));
      
      return connectionData;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create connection';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, []);

  // ============================================
  // GET CONNECTION BY ID
  // ============================================
  const getConnectionById = useCallback(async (id: string): Promise<ConnectionPublic> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await connectionService.getConnectionById(id);
      if (!response.data) {
        throw new Error('Connection not found');
      }
      
      setState(prev => ({ ...prev, isLoading: false }));
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch connection';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, []);

  // ============================================
  // UPDATE CONNECTION
  // ============================================
  const updateConnection = useCallback(async (id: string, data: UpdateConnectionRequest): Promise<ConnectionPublic> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await connectionService.updateConnection(id, data);
      // API returns { connection, jobId? } in data
      const connectionData = (response.data as any)?.connection || response.data;
      
      if (!connectionData) {
        throw new Error('No connection data returned');
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        connections: prev.connections.map(c => c.id === id ? connectionData : c),
      }));
      
      return connectionData;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update connection';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, []);

  // ============================================
  // DELETE CONNECTION
  // ============================================
  const deleteConnection = useCallback(async (id: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await connectionService.deleteConnection(id);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        connections: prev.connections.filter(c => c.id !== id),
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete connection';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, []);

  // ============================================
  // SYNC SCHEMA
  // ============================================
  const syncSchema = useCallback(async (id: string): Promise<{ jobId: string; message: string }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await connectionService.syncSchema(id);
      if (!response.data) {
        throw new Error('No job data returned');
      }
      
      setState(prev => ({ ...prev, isLoading: false }));
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to sync schema';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, []);

  // ============================================
  // CLEAR ERROR
  // ============================================
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ============================================
  // CLEAR TEST RESULT
  // ============================================
  const clearTestResult = useCallback(() => {
    setState(prev => ({ ...prev, testResult: null }));
  }, []);

  return {
    // State
    connections: state.connections,
    isLoading: state.isLoading,
    error: state.error,
    testResult: state.testResult,
    isTesting: state.isTesting,
    
    // Actions
    testConnection,
    fetchConnections,
    createConnection,
    getConnectionById,
    updateConnection,
    deleteConnection,
    syncSchema,
    clearError,
    clearTestResult,
  };
}

export default useConnections;
