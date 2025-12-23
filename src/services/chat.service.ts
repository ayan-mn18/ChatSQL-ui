import { api } from '../lib/api';
import { ApiResponse } from '../types';

// ============================================
// CHAT SERVICE
// Handles AI chat sessions and streaming responses
// ============================================

export interface ChatSession {
  id: string;
  userId: string;
  connectionId: string;
  title: string;
  isActive: boolean;
  messageCount: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  sqlGenerated?: string;
  reasoning?: {
    steps: string[];
    optimization_notes: string[];
  };
  tablesUsed?: string[];
  executionResult?: {
    success: boolean;
    rowCount?: number;
    executionTimeMs?: number;
    error?: string;
  };
  isError: boolean;
  createdAt: string;
}

export interface StreamChunk {
  type: 'session' | 'content' | 'done' | 'error' | 'connected' | 'timeout';
  sessionId?: string;
  content?: string;
  messageId?: string;
  sql?: string;
  reasoning?: {
    steps: string[];
    optimization_notes: string[];
  };
  tablesUsed?: string[];
  error?: string;
}

export const chatService = {
  /**
   * Get or create active chat session for a connection
   */
  getOrCreateSession: async (
    connectionId: string
  ): Promise<ApiResponse<{ session: ChatSession; messages: ChatMessage[] }>> => {
    const response = await api.get<ApiResponse<{ session: ChatSession; messages: ChatMessage[] }>>(
      `/chat/${connectionId}/session`
    );
    return response.data;
  },

  /**
   * Get all chat sessions for a connection
   */
  getSessions: async (connectionId: string): Promise<ApiResponse<ChatSession[]>> => {
    const response = await api.get<ApiResponse<ChatSession[]>>(
      `/chat/${connectionId}/sessions`
    );
    return response.data;
  },

  /**
   * Get messages for a specific session
   */
  getSessionMessages: async (
    connectionId: string,
    sessionId: string
  ): Promise<ApiResponse<ChatMessage[]>> => {
    const response = await api.get<ApiResponse<ChatMessage[]>>(
      `/chat/${connectionId}/session/${sessionId}/messages`
    );
    return response.data;
  },

  /**
   * Stream AI response for a chat message
   * Returns an EventSource-like interface for handling SSE
   */
  streamMessage: (
    connectionId: string,
    message: string,
    sessionId?: string,
    selectedSchemas: string[] = [],
    onChunk: (chunk: StreamChunk) => void = () => {},
    onError: (error: Error) => void = () => {},
    onComplete: () => void = () => {}
  ): AbortController => {
    const abortController = new AbortController();
    
    // Get auth token from cookie or localStorage
    const getAuthToken = (): string | null => {
      // Try to get from cookie
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'token') {
          return value;
        }
      }
      return null;
    };

    const fetchStream = async () => {
      try {
        const token = getAuthToken();
        const baseUrl = import.meta.env.VITE_API_URL || '';
        
        const response = await fetch(`${baseUrl}/api/chat/${connectionId}/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            message,
            sessionId,
            selectedSchemas,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            onComplete();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          
          // Process complete SSE messages
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6)) as StreamChunk;
                onChunk(data);
                
                if (data.type === 'error') {
                  onError(new Error(data.error || 'Unknown error'));
                }
              } catch (parseError) {
                console.error('Failed to parse SSE data:', parseError);
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
   * Clear current chat session and start new one
   */
  clearSession: async (
    connectionId: string
  ): Promise<ApiResponse<{ session: ChatSession; messages: ChatMessage[] }>> => {
    const response = await api.post<ApiResponse<{ session: ChatSession; messages: ChatMessage[] }>>(
      `/chat/${connectionId}/clear`
    );
    return response.data;
  },

  /**
   * Delete a chat session
   */
  deleteSession: async (connectionId: string, sessionId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(
      `/chat/${connectionId}/session/${sessionId}`
    );
    return response.data;
  },
};
