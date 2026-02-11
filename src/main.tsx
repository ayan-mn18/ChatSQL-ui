import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider, type Query } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { JobProgressProvider } from './contexts/JobProgressContext';
import { GlobalJobProgress } from './components/JobProgressIndicator';
import { AuthRedirector } from './components/AuthRedirector';
import { CommandKBarProvider } from './components/CommandKBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App.tsx';
import './index.css';

/**
 * Global error handler for all queries.
 * Shows a toast unless the query has its own onError / meta.silent flag.
 */
function handleQueryError(error: unknown, query: Query) {
  // Allow individual queries to silence the global handler
  if ((query.meta as any)?.silent) return;

  const err = error as any;
  // 401 errors are handled by the axios interceptor (redirect to login)
  if (err?.response?.status === 401) return;

  const message =
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    'Something went wrong';

  toast.error(message, { id: `query-error-${query.queryHash}` });
}

// Create a client with optimized defaults for caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes default stale time
      gcTime: 30 * 60 * 1000, // 30 minutes garbage collection time
      retry: 2, // Retry failed requests twice
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      // Mutations get 0 retries by default — fail fast
      retry: 0,
    },
  },
});

// Register the global error handler
queryClient.getQueryCache().config.onError = handleQueryError;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <JobProgressProvider>
            <CommandKBarProvider>
              <AuthRedirector />
              <ErrorBoundary level="page">
                <App />
              </ErrorBoundary>
              <GlobalJobProgress />
              <Toaster />
            </CommandKBarProvider>
          </JobProgressProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);