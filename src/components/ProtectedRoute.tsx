import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Wait for the initial /auth/me check so we don't flash-redirect.
  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    // Redirect to the sign-in page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience.
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  // If user must change password, redirect them to the force change password page
  // but only if they aren't already on that page
  if (user?.must_change_password && location.pathname !== '/auth/force-change-password') {
    return <Navigate to="/auth/force-change-password" replace />;
  }

  return <Outlet />;
}
