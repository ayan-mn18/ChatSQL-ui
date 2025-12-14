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
    maxAttempts: number = 120,
    intervalMs: number = 500
  ): Promise<AIJobResult> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const poll = async () => {
        attempts++;

        try {
          const response = await aiService.getJobResult(jobId);

          // Handle response - backend returns status/result at top level or nested in data
          const responseData = (response.data || response) as any;
          const status = responseData.status;
          const result = responseData.result;

          console.log(`[AI] Poll attempt ${attempts}/${maxAttempts} - Status: ${status}`);

          if (response.success || responseData.success) {
            if (status === 'completed' && result) {
              console.log('[AI] Job completed:', result);
              resolve(result);
              return;
            }

            if (status === 'failed') {
              console.error('[AI] Job failed:', result?.error);
              reject(new Error(result?.error || 'AI job failed'));
              return;
            }

            // Status is 'pending' - continue polling
            if (status === 'pending') {
              if (attempts >= maxAttempts) {
                reject(new Error('AI job timed out - please try again'));
                return;
              }
              setTimeout(poll, intervalMs);
              return;
            }
          }

          if (attempts >= maxAttempts) {
            reject(new Error('AI job timed out'));
            return;
          }

          // Continue polling for unknown status
          setTimeout(poll, intervalMs);
        } catch (error: any) {
          console.error(`[AI] Poll error (attempt ${attempts}):`, error.message);
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
   * Wait for job result using SSE (Server-Sent Events)
   * Falls back to polling if SSE fails
   * @param jobId - Job ID to wait for
   * @returns Final job result
   */
  waitForResultSSE: (jobId: string): Promise<AIJobResult> => {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('auth_token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      
      console.log('[AI] Starting SSE connection for job:', jobId);
      
      // Create EventSource with auth token in URL (SSE doesn't support custom headers)
      const eventSource = new EventSource(
        `${baseUrl}/ai/stream/${jobId}?token=${encodeURIComponent(token || '')}`,
        { withCredentials: true }
      );
      
      let resolved = false;
      
      // Timeout after 60 seconds
      const timeout = setTimeout(() => {
        if (!resolved) {
          console.log('[AI] SSE timeout, falling back to polling');
          eventSource.close();
          // Fall back to polling
          aiService.pollForResult(jobId).then(resolve).catch(reject);
        }
      }, 60000);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[AI] SSE message:', data.type);
          
          if (data.type === 'completed' && data.result) {
            resolved = true;
            clearTimeout(timeout);
            eventSource.close();
            resolve(data.result);
          } else if (data.type === 'timeout') {
            resolved = true;
            clearTimeout(timeout);
            eventSource.close();
            reject(new Error('AI job timed out'));
          } else if (data.type === 'error') {
            resolved = true;
            clearTimeout(timeout);
            eventSource.close();
            reject(new Error(data.message || 'AI job failed'));
          }
        } catch (e) {
          console.error('[AI] SSE parse error:', e);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('[AI] SSE error, falling back to polling:', error);
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          eventSource.close();
          // Fall back to polling on SSE error
          aiService.pollForResult(jobId).then(resolve).catch(reject);
        }
      };
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

    // Handle response - backend returns jobId at top level or nested in data
    const responseData = (response.data || response) as any;
    const jobId = responseData.jobId;

    if (!response.success || !jobId) {
      throw new Error(response.error || 'Failed to start SQL generation');
    }

    console.log('[AI] Started job:', jobId, '- waiting via SSE...');

    // Use SSE for real-time updates (falls back to polling if SSE fails)
    return aiService.waitForResultSSE(jobId);
  },

  /**
   * Start SQL generation and return job ID immediately
   * Use this when you want to close the modal and show loading in the editor
   * @param connectionId - Connection UUID  
   * @param prompt - Natural language prompt
   * @param selectedSchemas - Optional schema filter
   * @returns Job ID for tracking
   */
  startSqlGeneration: async (
    connectionId: string,
    prompt: string,
    selectedSchemas: string[] = []
  ): Promise<string> => {
    const response = await aiService.generateSql(connectionId, prompt, selectedSchemas);

    // Handle response - backend returns jobId at top level or nested in data
    const responseData = (response.data || response) as any;
    const jobId = responseData.jobId;

    if (!response.success || !jobId) {
      throw new Error(response.error || 'Failed to start SQL generation');
    }

    return jobId;
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

    // Handle response - backend returns jobId at top level or nested in data
    const responseData = (response.data || response) as any;
    const jobId = responseData.jobId;

    if (!response.success || !jobId) {
      throw new Error(response.error || 'Failed to start query explanation');
    }

    return aiService.waitForResultSSE(jobId);
  },
};

export default aiService;
