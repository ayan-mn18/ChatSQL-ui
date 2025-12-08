import { useJobProgressContext } from '../contexts/JobProgressContext';
import { JobProgress } from '../hooks/useJobProgress';

// ============================================
// JOB PROGRESS INDICATOR COMPONENT
// Shows progress for schema sync and AI operations
// ============================================

interface JobProgressIndicatorProps {
  connectionId: string;
  className?: string;
}

export function JobProgressIndicator({ connectionId, className = '' }: JobProgressIndicatorProps) {
  const { getJobsForConnection } = useJobProgressContext();

  const activeJobs = getJobsForConnection(connectionId).filter(
    job => job.status === 'processing' || job.status === 'pending'
  );

  if (activeJobs.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {activeJobs.map((job) => (
        <JobProgressItem key={job.jobId} job={job} />
      ))}
    </div>
  );
}

interface JobProgressItemProps {
  job: JobProgress;
}

function JobProgressItem({ job }: JobProgressItemProps) {
  const getStatusColor = () => {
    switch (job.status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'processing':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return '✓';
      case 'failed':
        return '✕';
      case 'processing':
        return (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      default:
        return '○';
    }
  };

  return (
    <div className="bg-background/80 backdrop-blur-sm border rounded-lg p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center w-6 h-6 rounded-full ${getStatusColor()} text-white text-xs`}>
          {getStatusIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {job.type === 'schema-sync' ? 'Schema Sync' : 'AI Operation'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {job.message}
          </p>
        </div>
        {job.status === 'processing' && (
          <span className="text-xs text-muted-foreground">
            {job.progress}%
          </span>
        )}
      </div>

      {job.status === 'processing' && (
        <div className="mt-2">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      )}

      {job.status === 'failed' && job.error && (
        <p className="mt-2 text-xs text-red-500">
          {job.error}
        </p>
      )}
    </div>
  );
}

// Global job progress toast component
interface GlobalJobProgressProps {
  maxVisible?: number;
}

export function GlobalJobProgress({ maxVisible = 3 }: GlobalJobProgressProps) {
  const { jobs, isConnected } = useJobProgressContext();

  const activeJobs = jobs
    .filter(job => job.status === 'processing' || job.status === 'pending')
    .slice(0, maxVisible);

  if (activeJobs.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 w-80">
      {!isConnected && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            ⚠️ Disconnected from job updates. Reconnecting...
          </p>
        </div>
      )}

      {activeJobs.map((job) => (
        <JobProgressItem key={job.jobId} job={job} />
      ))}

      {jobs.filter(j => j.status === 'processing').length > maxVisible && (
        <p className="text-xs text-muted-foreground text-center">
          +{jobs.filter(j => j.status === 'processing').length - maxVisible} more jobs in progress
        </p>
      )}
    </div>
  );
}

// Simple progress bar for inline use
interface SimpleProgressBarProps {
  connectionId: string;
  className?: string;
}

export function SimpleProgressBar({ connectionId, className = '' }: SimpleProgressBarProps) {
  const { getLatestJob, hasActiveJobs } = useJobProgressContext();

  if (!hasActiveJobs(connectionId)) {
    return null;
  }

  const job = getLatestJob(connectionId);
  if (!job || job.status !== 'processing') {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{job.message}</span>
        <span className="text-xs text-muted-foreground">{job.progress}%</span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${job.progress}%` }}
        />
      </div>
    </div>
  );
}

export default JobProgressIndicator;
