import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useJobProgress, JobProgress, AIJobResult } from '../hooks/useJobProgress';
import { queryKeys } from '../hooks/useQueries';
import toast from 'react-hot-toast';

// ============================================
// JOB PROGRESS CONTEXT
// Provides real-time job updates throughout the app
// ============================================

interface JobProgressContextValue {
  jobs: JobProgress[];
  jobsMap: Map<string, JobProgress>;
  isConnected: boolean;
  connectionError: string | null;
  connect: () => void;
  disconnect: () => void;
  getJobsForConnection: (connectionId: string) => JobProgress[];
  hasActiveJobs: (connectionId: string) => boolean;
  getLatestJob: (connectionId: string) => JobProgress | null;
  clearJobs: () => void;
  clearJobsForConnection: (connectionId: string) => void;
}

const JobProgressContext = createContext<JobProgressContextValue | null>(null);

interface JobProgressProviderProps {
  children: ReactNode;
}

export function JobProgressProvider({ children }: JobProgressProviderProps) {
  const queryClient = useQueryClient();

  // Memoize callbacks to prevent unnecessary reconnections
  const handleProgress = useCallback((job: JobProgress) => {
    // Optional: Show toast for significant progress updates
    if (job.progress === 50) {
      // toast.loading(job.message, { id: job.jobId });
    }
  }, []);

  const handleComplete = useCallback((job: JobProgress) => {
    toast.success(job.message || 'Job completed successfully', {
      id: job.jobId,
      duration: 3000,
    });

    // ── SSE-driven cache invalidation ──
    // When a schema-sync job finishes, the backend has already warmed Redis.
    // Bust TanStack Query caches so the UI re-fetches fresh data immediately
    // instead of waiting for staleTime to expire.
    if (job.type === 'schema-sync' && job.connectionId) {
      const cid = job.connectionId;
      queryClient.invalidateQueries({ queryKey: queryKeys.schemas(cid) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tableTree(cid) });
      queryClient.invalidateQueries({ queryKey: ['tables', cid] });
      queryClient.invalidateQueries({ queryKey: ['columns', cid] });
      queryClient.invalidateQueries({ queryKey: queryKeys.erdRelations(cid) });
      queryClient.invalidateQueries({ queryKey: queryKeys.connections });
      queryClient.invalidateQueries({ queryKey: queryKeys.connection(cid) });
    }
  }, [queryClient]);

  const handleError = useCallback((job: JobProgress) => {
    toast.error(job.error || 'Job failed', {
      id: job.jobId,
      duration: 5000,
    });
  }, []);

  const handleAIResult = useCallback((result: AIJobResult) => {
    if (result.success) {
      // AI results are typically handled by the component that initiated the request
      console.log('[AI] Result received:', result.jobId);
    } else {
      toast.error(result.error || 'AI operation failed', {
        duration: 5000,
      });
    }
  }, []);

  const jobProgress = useJobProgress({
    autoConnect: true,
    onProgress: handleProgress,
    onComplete: handleComplete,
    onError: handleError,
    onAIResult: handleAIResult,
  });

  return (
    <JobProgressContext.Provider value={jobProgress}>
      {children}
    </JobProgressContext.Provider>
  );
}

export function useJobProgressContext() {
  const context = useContext(JobProgressContext);
  if (!context) {
    throw new Error('useJobProgressContext must be used within a JobProgressProvider');
  }
  return context;
}

export default JobProgressContext;
