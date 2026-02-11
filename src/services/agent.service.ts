// ============================================
// AGENT SERVICE (Frontend)
// SSE connection + REST calls for agent mode
// ============================================

import { api } from '../lib/api';

// ============================================
// TYPES
// ============================================

export type AgentEventType =
  | 'session'
  | 'agent_session'
  | 'agent_thinking'
  | 'agent_plan'
  | 'agent_proposal'
  | 'agent_executing'
  | 'agent_result'
  | 'agent_complete'
  | 'agent_error'
  | 'agent_stopped'
  | 'content';

export interface AgentPlanStep {
  id: number;
  description: string;
}

export interface AgentEvent {
  type: AgentEventType;

  // session
  sessionId?: string;
  agentSessionId?: string;

  // agent_thinking / content
  message?: string;
  content?: string;

  // agent_plan
  plan?: AgentPlanStep[];

  // agent_proposal
  stepIndex?: number;
  stepDescription?: string;
  sql?: string;
  explanation?: string;
  isRetry?: boolean;
  retryCount?: number;

  // agent_result
  success?: boolean;
  rowCount?: number;
  affectedRows?: number;
  executionTime?: number;
  preview?: any[];
  error?: string;
  errorDetails?: {
    message: string;
    detail?: string;
    hint?: string;
  };

  // agent_complete
  summary?: string;
  stepsCompleted?: number;
  totalSteps?: number;

  // agent_error
  recoverable?: boolean;
}

export interface AgentExecutionResult {
  success: boolean;
  rows?: any[];
  rowCount?: number;
  affectedRows?: number;
  executionTime?: number;
  error?: string;
  errorDetails?: {
    message: string;
    detail?: string;
    hint?: string;
    position?: number;
  };
}

// ============================================
// SERVICE
// ============================================

function getAuthToken(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'token') return value;
  }
  return null;
}

export const agentService = {
  /**
   * Start an agent session via SSE.
   * Returns an AbortController to cancel the connection.
   */
  startAgent: (
    connectionId: string,
    message: string,
    sessionId?: string,
    selectedSchemas: string[] = [],
    onEvent: (event: AgentEvent) => void = () => {},
    onError: (error: Error) => void = () => {},
    onComplete: () => void = () => {}
  ): AbortController => {
    const abortController = new AbortController();

    const fetchStream = async () => {
      try {
        const token = getAuthToken();
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

        const response = await fetch(`${baseUrl}/chat/${connectionId}/agent/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ message, sessionId, selectedSchemas }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            onComplete();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6)) as AgentEvent;
                onEvent(data);
              } catch (parseError) {
                console.error('Failed to parse agent SSE data:', parseError);
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          onError(error);
        }
      }
    };

    fetchStream();
    return abortController;
  },

  /**
   * Approve the agent's proposed query
   */
  approve: async (
    connectionId: string,
    agentSessionId: string,
    modifiedSql?: string
  ): Promise<{ success: boolean }> => {
    const response = await api.post(
      `/chat/${connectionId}/agent/${agentSessionId}/approve`,
      { modifiedSql }
    );
    return response.data;
  },

  /**
   * Reject the agent's proposed query
   */
  reject: async (
    connectionId: string,
    agentSessionId: string,
    reason?: string
  ): Promise<{ success: boolean }> => {
    const response = await api.post(
      `/chat/${connectionId}/agent/${agentSessionId}/reject`,
      { reason }
    );
    return response.data;
  },

  /**
   * Send execution results back to the agent
   */
  sendResult: async (
    connectionId: string,
    agentSessionId: string,
    result: AgentExecutionResult
  ): Promise<{ success: boolean }> => {
    const response = await api.post(
      `/chat/${connectionId}/agent/${agentSessionId}/result`,
      { result }
    );
    return response.data;
  },

  /**
   * Stop the agent session
   */
  stop: async (
    connectionId: string,
    agentSessionId: string
  ): Promise<{ success: boolean }> => {
    const response = await api.post(
      `/chat/${connectionId}/agent/${agentSessionId}/stop`
    );
    return response.data;
  },
};
