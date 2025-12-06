import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AuthContextType {
  // Auth state
  isAuthenticated: boolean;
  userEmail: string | null;
  username: string | null;
  authToken: string | null;

  // Auth methods
  signIn: (email: string) => Promise<void>;
  signUp: (email: string, username: string) => Promise<void>;
  verifyOTP: () => Promise<void>;
  resendOTP: () => Promise<void>;
  signOut: () => void;

  // UI state
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  resendCooldown: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('authToken');
  });
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem('userEmail');
  });
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('username');
  });
  const [authToken, setAuthToken] = useState(() => {
    return localStorage.getItem('authToken');
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Mock sign-in function
  const signIn = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUserEmail(email);
      localStorage.setItem('tempEmail', email);
    } catch (err) {
      setError('Failed to sign in. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mock sign-up function
  const signUp = useCallback(async (email: string, uname: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUserEmail(email);
      setUsername(uname);
      localStorage.setItem('tempEmail', email);
      localStorage.setItem('tempUsername', uname);
    } catch (err) {
      setError('Failed to create account. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mock OTP verification
  const verifyOTP = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const email = localStorage.getItem('tempEmail');
      const uname = localStorage.getItem('tempUsername');
      const token = `token_${Date.now()}`;

      localStorage.setItem('authToken', token);
      if (email) localStorage.setItem('userEmail', email);
      if (uname) localStorage.setItem('username', uname);

      localStorage.removeItem('tempEmail');
      localStorage.removeItem('tempUsername');

      setIsAuthenticated(true);
      setAuthToken(token);
      if (email) setUserEmail(email);
      if (uname) setUsername(uname);
    } catch (err) {
      setError('Invalid OTP. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mock resend OTP
  const resendOTP = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setResendCooldown(30);
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign out function
  const signOut = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('username');
    localStorage.removeItem('tempEmail');
    localStorage.removeItem('tempUsername');

    setIsAuthenticated(false);
    setUserEmail(null);
    setUsername(null);
    setAuthToken(null);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userEmail,
        username,
        authToken,
        signIn,
        signUp,
        verifyOTP,
        resendOTP,
        signOut,
        isLoading,
        error,
        setError,
        resendCooldown,
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
