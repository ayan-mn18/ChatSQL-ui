import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { JobProgressProvider } from './contexts/JobProgressContext';
import { GlobalJobProgress } from './components/JobProgressIndicator';
import { AuthRedirector } from './components/AuthRedirector';
import { CommandKBarProvider } from './components/CommandKBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App.tsx';
import './index.css';

// Create a client with optimized defaults for caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stable data (schemas, tables, columns) - 30 minutes stale time
      staleTime: 5 * 60 * 1000, // 5 minutes default stale time
      gcTime: 30 * 60 * 1000, // 30 minutes garbage collection time (formerly cacheTime)
      retry: 2, // Retry failed requests twice
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Refetch when reconnecting
    },
  },
});

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