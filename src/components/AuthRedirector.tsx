import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

export function AuthRedirector() {
  const navigate = useNavigate();
  const location = useLocation();
  const { forceLogout } = useAuth();

  useEffect(() => {
    const handler = () => {
      // Clear local auth state first so ProtectedRoute reacts immediately.
      forceLogout();

      // If we're already on an auth route, don't bounce again.
      if (location.pathname.startsWith('/auth/')) return;

      navigate('/auth/signin', { replace: true, state: { from: location } });
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handler as EventListener);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handler as EventListener);
  }, [forceLogout, location, navigate]);

  return null;
}
