import { createContext, useContext, ReactNode } from 'react';
import { useJobProgress, JobProgress } from '../hooks/useJobProgress';
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
  const jobProgress = useJobProgress({
    autoConnect: true,
    onProgress: (job) => {
      // Optional: Show toast for significant progress updates
      if (job.progress === 50) {
        // toast.loading(job.message, { id: job.jobId });
      }
    },
    onComplete: (job) => {
      toast.success(job.message || 'Job completed successfully', {
        id: job.jobId,
        duration: 3000,
      });
    },
    onError: (job) => {
      toast.error(job.error || 'Job failed', {
        id: job.jobId,
        duration: 5000,
      });
    },
    onAIResult: (result) => {
      if (result.success) {
        // AI results are typically handled by the component that initiated the request
        console.log('[AI] Result received:', result.jobId);
      } else {
        toast.error(result.error || 'AI operation failed', {
          duration: 5000,
        });
      }
    },
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
