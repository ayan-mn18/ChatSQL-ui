import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest, VerifyEmailRequest } from '@/types';
import { authService } from '@/services/auth.service';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  // Auth state
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Auth methods
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  verifyEmail: (data: VerifyEmailRequest) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  forceLogout: () => void;
  checkAuth: () => Promise<void>;

  // Helper to clear errors
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const forceLogout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    setIsLoading(false);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Proactively re-check auth so expired cookies redirect quickly
  useEffect(() => {
    if (!isAuthenticated) return;

    const onFocus = () => {
      void checkAuth();
    };

    const onVisibilityChange = () => {
      if (!document.hidden) {
        void checkAuth();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    const intervalId = window.setInterval(() => {
      if (!document.hidden) {
        void checkAuth();
      }
    }, 60_000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, checkAuth]);

  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(data);
      if (response.data?.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        toast.success('Successfully logged in!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to login';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.register(data);
      // Don't set user/auth yet, they need to verify email
      toast.success('Registration successful! Please verify your email.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to register';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyEmail = useCallback(async (data: VerifyEmailRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.verifyEmail(data);
      if (response.data?.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        toast.success('Email verified successfully!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to verify email';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendOTP = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.resendOtp({ email });
      toast.success('Verification code resent!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to resend OTP';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (err: any) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        error,
        login,
        register,
        verifyEmail,
        resendOTP,
        logout,
        forceLogout,
        checkAuth,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
