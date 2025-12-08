import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { JobProgressProvider } from './contexts/JobProgressContext';
import { GlobalJobProgress } from './components/JobProgressIndicator';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <JobProgressProvider>
          <App />
          <GlobalJobProgress />
          <Toaster />
        </JobProgressProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);