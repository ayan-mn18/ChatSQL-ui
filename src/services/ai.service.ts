import { api } from '../lib/api';
import { ApiResponse } from '../types';

// ============================================
// AI SERVICE
// Handles AI-powered SQL generation and query operations
// ============================================

// ============================================
// TYPES
// ============================================

export interface GenerateSqlRequest {
  prompt: string;
  selectedSchemas?: string[];
}

export interface GenerateSqlResponse {
  jobId: string;
  message: string;
}

export interface AIJobResult {
  jobId: string;
  type: string;
  success: boolean;
  result?: {
    sql?: string;
    explanation?: string;
    suggestions?: string[];
    confidence?: number;
    reasoning?: {
      steps: string[];
      optimization_notes: string[];
    };
    tables_used?: string[];
    columns_used?: string[];
    desc?: string;
  };
  error?: string;
  executionTime?: number;
}

export interface AIJobStatus {
  success: boolean;
  status: 'pending' | 'completed' | 'failed';
  result?: AIJobResult;
  message?: string;
}

export interface PendingJobsResponse {
  pendingCount: number;
  jobs: Array<{
    jobId: string;
    type: string;
    createdAt: number;
    state: 'waiting' | 'active';
  }>;
}

// ============================================
// AI SERVICE METHODS
// ============================================

export const aiService = {
  /**
   * Generate SQL from natural language prompt
   * @param connectionId - Connection UUID
   * @param prompt - Natural language description of the query
   * @param selectedSchemas - Optional array of schema names to limit context
   * @returns Job ID for polling
   */
  generateSql: async (
    connectionId: string,
    prompt: string,
    selectedSchemas: string[] = []
  ): Promise<ApiResponse<GenerateSqlResponse>> => {
    const response = await api.post<ApiResponse<GenerateSqlResponse>>(
      `/ai/${connectionId}/generate`,
      { prompt, selectedSchemas }
    );
    return response.data;
  },

  /**
   * Get AI job result (polling)
   * @param jobId - Job ID from generateSql or explainQuery
   * @returns Job status and result if completed
   */
  getJobResult: async (jobId: string): Promise<ApiResponse<AIJobStatus>> => {
    const response = await api.get<ApiResponse<AIJobStatus>>(`/ai/result/${jobId}`);
    return response.data;
  },

  /**
   * Poll for job result until completed or timeout
   * @param jobId - Job ID to poll
   * @param maxAttempts - Maximum polling attempts (default 60)
   * @param intervalMs - Polling interval in ms (default 500)
   * @returns Final job result
   */
  pollForResult: async (
    jobId: string,
    maxAttempts: number = 60,
    intervalMs: number = 500
  ): Promise<AIJobResult> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const poll = async () => {
        attempts++;

        try {
          const response = await aiService.getJobResult(jobId);

          if (response.success && response.data) {
            const { status, result } = response.data;

            if (status === 'completed' && result) {
              resolve(result);
              return;
            }

            if (status === 'failed') {
              reject(new Error(result?.error || 'AI job failed'));
              return;
            }
          }

          if (attempts >= maxAttempts) {
            reject(new Error('AI job timed out'));
            return;
          }

          // Continue polling
          setTimeout(poll, intervalMs);
        } catch (error) {
          if (attempts >= maxAttempts) {
            reject(error);
            return;
          }
          // Retry on network errors
          setTimeout(poll, intervalMs);
        }
      };

      poll();
    });
  },

  /**
   * Explain a SQL query in plain English
   * @param connectionId - Connection UUID
   * @param sql - SQL query to explain
   * @returns Job ID for polling
   */
  explainQuery: async (
    connectionId: string,
    sql: string
  ): Promise<ApiResponse<GenerateSqlResponse>> => {
    const response = await api.post<ApiResponse<GenerateSqlResponse>>(
      `/ai/${connectionId}/explain`,
      { sql }
    );
    return response.data;
  },

  /**
   * Get pending AI jobs for a connection
   * @param connectionId - Connection UUID
   * @returns List of pending jobs
   */
  getPendingJobs: async (connectionId: string): Promise<ApiResponse<PendingJobsResponse>> => {
    const response = await api.get<ApiResponse<PendingJobsResponse>>(
      `/ai/${connectionId}/status`
    );
    return response.data;
  },

  /**
   * Convenience method: Generate SQL and wait for result
   * @param connectionId - Connection UUID
   * @param prompt - Natural language prompt
   * @param selectedSchemas - Optional schema filter
   * @returns Generated SQL and metadata
   */
  generateSqlAndWait: async (
    connectionId: string,
    prompt: string,
    selectedSchemas: string[] = []
  ): Promise<AIJobResult> => {
    // Start generation job
    const response = await aiService.generateSql(connectionId, prompt, selectedSchemas);

    if (!response.success || !response.data?.jobId) {
      throw new Error(response.error || 'Failed to start SQL generation');
    }

    // Poll for result
    return aiService.pollForResult(response.data.jobId);
  },

  /**
   * Convenience method: Explain query and wait for result
   * @param connectionId - Connection UUID
   * @param sql - SQL to explain
   * @returns Explanation
   */
  explainQueryAndWait: async (
    connectionId: string,
    sql: string
  ): Promise<AIJobResult> => {
    const response = await aiService.explainQuery(connectionId, sql);

    if (!response.success || !response.data?.jobId) {
      throw new Error(response.error || 'Failed to start query explanation');
    }

    return aiService.pollForResult(response.data.jobId);
  },
};

export default aiService;
