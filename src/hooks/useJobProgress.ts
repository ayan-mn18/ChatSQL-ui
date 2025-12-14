import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

// ============================================
// JOB PROGRESS HOOK
// Real-time job progress updates via SSE
// ============================================

export interface JobProgress {
  jobId: string;
  type: 'schema-sync' | 'ai-operation';
  connectionId?: string;
  schemaName?: string;
  tableName?: string;
  progress: number;
  message: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  result?: any;
  timestamp?: string;
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
  };
  error?: string;
  executionTime?: number;
}

interface UseJobProgressOptions {
  autoConnect?: boolean;
  onProgress?: (job: JobProgress) => void;
  onComplete?: (job: JobProgress) => void;
  onError?: (job: JobProgress) => void;
  onAIResult?: (result: AIJobResult) => void;
}

export function useJobProgress(options: UseJobProgressOptions = {}) {
  const { autoConnect = true, onProgress, onComplete, onError, onAIResult } = options;
  const { user, isAuthenticated } = useAuth();
  
  const [jobs, setJobs] = useState<Map<string, JobProgress>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  // Store callbacks in refs to avoid dependency issues causing reconnection loops
  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const onAIResultRef = useRef(onAIResult);
  
  // Update refs when callbacks change
  useEffect(() => {
    onProgressRef.current = onProgress;
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
    onAIResultRef.current = onAIResult;
  }, [onProgress, onComplete, onError, onAIResult]);
  
  // Cleanup function
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);
  
  // Connect to SSE endpoint
  const connect = useCallback(() => {
    if (!isAuthenticated || !user) {
      return;
    }
    
    // Don't connect if already connected
    if (eventSourceRef.current && eventSourceRef.current.readyState === EventSource.OPEN) {
      console.log('[SSE] Already connected, skipping');
      return;
    }
    
    // Cleanup existing connection
    disconnect();
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    // Remove trailing /api if present to avoid double /api/api
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
    const url = `${baseUrl}/api/jobs/progress`;
    
    console.log('[SSE] Connecting to:', url);
    
    try {
      const eventSource = new EventSource(url, { withCredentials: true });
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        console.log('[SSE] Connected to job progress stream');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
      };
      
      eventSource.onerror = (error) => {
        console.error('[SSE] Connection error:', error);
        setIsConnected(false);
        
        // Auto-reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000;
          console.log(`[SSE] Reconnecting in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else {
          setConnectionError('Failed to connect to job progress stream');
        }
      };
      
      // Handle different event types
      eventSource.addEventListener('connected', (event) => {
        console.log('[SSE] Server confirmed connection:', JSON.parse(event.data));
      });
      
      eventSource.addEventListener('progress', (event) => {
        const data = JSON.parse(event.data) as JobProgress;
        data.status = 'processing';
        
        setJobs((prev) => {
          const next = new Map(prev);
          next.set(data.jobId, data);
          return next;
        });
        
        onProgressRef.current?.(data);
      });
      
      eventSource.addEventListener('complete', (event) => {
        const data = JSON.parse(event.data) as JobProgress;
        data.status = 'completed';
        data.progress = 100;
        
        setJobs((prev) => {
          const next = new Map(prev);
          const existing = next.get(data.jobId);
          next.set(data.jobId, { ...existing, ...data, status: 'completed' });
          return next;
        });
        
        onCompleteRef.current?.(data);
        
        // Auto-remove completed jobs after 5 seconds
        setTimeout(() => {
          setJobs((prev) => {
            const next = new Map(prev);
            next.delete(data.jobId);
            return next;
          });
        }, 5000);
      });
      
      eventSource.addEventListener('error', (event: Event) => {
        const messageEvent = event as MessageEvent;
        if (!messageEvent.data) return; // Ignore connection errors
        
        const data = JSON.parse(messageEvent.data) as JobProgress;
        data.status = 'failed';
        
        setJobs((prev) => {
          const next = new Map(prev);
          const existing = next.get(data.jobId);
          next.set(data.jobId, { ...existing, ...data, status: 'failed' });
          return next;
        });
        
        onErrorRef.current?.(data);
      });
      
      eventSource.addEventListener('ai-result', (event) => {
        const result = JSON.parse(event.data) as AIJobResult;
        onAIResultRef.current?.(result);
      });
      
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error);
      setConnectionError('Failed to connect to job progress stream');
    }
  }, [isAuthenticated, user, disconnect]);
  
  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && isAuthenticated) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [autoConnect, isAuthenticated, connect, disconnect]);
  
  // Get jobs for a specific connection
  const getJobsForConnection = useCallback((connectionId: string): JobProgress[] => {
    return Array.from(jobs.values()).filter(
      (job) => job.connectionId === connectionId
    );
  }, [jobs]);
  
  // Check if a connection has active jobs
  const hasActiveJobs = useCallback((connectionId: string): boolean => {
    return getJobsForConnection(connectionId).some(
      (job) => job.status === 'processing' || job.status === 'pending'
    );
  }, [getJobsForConnection]);
  
  // Get the latest job for a connection
  const getLatestJob = useCallback((connectionId: string): JobProgress | null => {
    const connectionJobs = getJobsForConnection(connectionId);
    if (connectionJobs.length === 0) return null;
    return connectionJobs[connectionJobs.length - 1];
  }, [getJobsForConnection]);
  
  // Clear all jobs
  const clearJobs = useCallback(() => {
    setJobs(new Map());
  }, []);
  
  // Clear jobs for a specific connection
  const clearJobsForConnection = useCallback((connectionId: string) => {
    setJobs((prev) => {
      const next = new Map(prev);
      for (const [jobId, job] of next) {
        if (job.connectionId === connectionId) {
          next.delete(jobId);
        }
      }
      return next;
    });
  }, []);
  
  return {
    jobs: Array.from(jobs.values()),
    jobsMap: jobs,
    isConnected,
    connectionError,
    connect,
    disconnect,
    getJobsForConnection,
    hasActiveJobs,
    getLatestJob,
    clearJobs,
    clearJobsForConnection,
  };
}

export default useJobProgress;
