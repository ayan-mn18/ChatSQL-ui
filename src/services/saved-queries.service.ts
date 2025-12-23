import { api } from '../lib/api';
import { ApiResponse } from '../types';

// ============================================
// SAVED QUERIES SERVICE
// Handles CRUD operations for saved SQL queries
// ============================================

export interface SavedQuery {
  id: string;
  userId: string;
  connectionId: string;
  name: string;
  description?: string;
  queryText: string;
  tags: string[];
  isShared: boolean;
  folder?: string;
  lastUsedAt?: string;
  useCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedQueryRequest {
  name: string;
  queryText: string;
  description?: string;
  tags?: string[];
  isShared?: boolean;
  folder?: string;
}

export interface UpdateSavedQueryRequest {
  name?: string;
  queryText?: string;
  description?: string;
  tags?: string[];
  isShared?: boolean;
  folder?: string;
}

export const savedQueriesService = {
  /**
   * Get all saved queries for a connection
   */
  getAll: async (connectionId: string, search?: string): Promise<ApiResponse<SavedQuery[]>> => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await api.get<ApiResponse<SavedQuery[]>>(
      `/connections/${connectionId}/saved-queries${params}`
    );
    return response.data;
  },

  /**
   * Get a single saved query
   */
  getById: async (connectionId: string, queryId: string): Promise<ApiResponse<SavedQuery>> => {
    const response = await api.get<ApiResponse<SavedQuery>>(
      `/connections/${connectionId}/saved-queries/${queryId}`
    );
    return response.data;
  },

  /**
   * Create a new saved query
   */
  create: async (
    connectionId: string,
    data: CreateSavedQueryRequest
  ): Promise<ApiResponse<SavedQuery>> => {
    const response = await api.post<ApiResponse<SavedQuery>>(
      `/connections/${connectionId}/saved-queries`,
      data
    );
    return response.data;
  },

  /**
   * Update a saved query
   */
  update: async (
    connectionId: string,
    queryId: string,
    data: UpdateSavedQueryRequest
  ): Promise<ApiResponse<SavedQuery>> => {
    const response = await api.put<ApiResponse<SavedQuery>>(
      `/connections/${connectionId}/saved-queries/${queryId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete a saved query
   */
  delete: async (connectionId: string, queryId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(
      `/connections/${connectionId}/saved-queries/${queryId}`
    );
    return response.data;
  },

  /**
   * Record usage of a saved query
   */
  recordUsage: async (connectionId: string, queryId: string): Promise<void> => {
    await api.post(`/connections/${connectionId}/saved-queries/${queryId}/use`);
  },
};
