# Auth System Integration Guide for Landing Page

## Quick Integration Steps

### Step 1: Add Auth Links to Landing Page

Update your landing page components to include navigation links:

```tsx
import { useNavigate } from 'react-router-dom';

export function YourLandingPage() {
  const navigate = useNavigate();
  
  return (
    <nav>
      {/* ... existing nav ... */}
      <button onClick={() => navigate('/auth/signin')}>
        Sign In
      </button>
      <button onClick={() => navigate('/auth/signup')}>
        Sign Up
      </button>
    </nav>
  );
}
```

### Step 2: Update Dashboard Routes (Optional but Recommended)

Protect your dashboard routes by checking authentication:

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

function ProtectedDashboard() {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }
  
  return <DashboardLayout />;
}
```

### Step 3: Add Sign Out to Dashboard Navbar

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

export function NavbarWithAuth() {
  const { userEmail, signOut } = useAuth();

  return (
    <nav className="flex justify-between items-center">
      <div>ChatSQL</div>
      <div className="flex items-center gap-4">
        {userEmail && <span className="text-gray-400">{userEmail}</span>}
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
```

## Available Routes

```
GET  /               Landing Page
GET  /auth/signin    Sign In Page
GET  /auth/signup    Sign Up Page
GET  /dashboard      Dashboard (Protected)
```

## Accessing Auth State

Use the `useAuth()` hook anywhere in your app:

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const {
    // User info
    isAuthenticated,
    userEmail,
    username,
    authToken,
    
    // Methods
    signIn,
    signUp,
    verifyOTP,
    resendOTP,
    signOut,
    
    // UI state
    isLoading,
    error,
    setError,
    resendCooldown
  } = useAuth();

  // Use in your component
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {userEmail}</p>
      ) : (
        <p>Please sign in</p>
      )}
    </div>
  );
}
```

## Component Examples

### Example 1: User Profile Header
```tsx
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut } from 'lucide-react';

export function ProfileHeader() {
  const { isAuthenticated, userEmail, username, signOut } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-[#1B2431] rounded-lg">
      <User className="w-10 h-10 p-2 bg-blue-600 rounded-full" />
      <div className="flex-1">
        <p className="font-semibold text-white">{username}</p>
        <p className="text-sm text-gray-400">{userEmail}</p>
      </div>
      <button
        onClick={signOut}
        className="p-2 hover:bg-red-600/20 rounded-lg text-red-400"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  );
}
```

### Example 2: Conditional Navigation
```tsx
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function NavigationBar() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="flex gap-4">
      {isAuthenticated ? (
        <>
          <button onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button onClick={() => navigate('/dashboard/settings')}>Settings</button>
        </>
      ) : (
        <>
          <button onClick={() => navigate('/auth/signin')}>Sign In</button>
          <button onClick={() => navigate('/auth/signup')}>Sign Up</button>
        </>
      )}
    </nav>
  );
}
```

### Example 3: Form with Auth Integration
```tsx
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Loader2 } from 'lucide-react';

export function CustomSignIn() {
  const { signIn, isLoading, error, setError } = useAuth();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await signIn(email);
      // Will transition to OTP step in parent component
    } catch {
      // Error already set in context
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-[#1B2431] border border-gray-700 rounded text-white"
      />

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-500/10 rounded">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium flex items-center justify-center gap-2"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading ? 'Sending OTP...' : 'Continue'}
      </button>
    </form>
  );
}
```

## Backend Integration

### Step 1: Update API Calls in AuthContext

Replace the mock implementations with real API calls:

```tsx
const signIn = useCallback(async (email: string) => {
  setIsLoading(true);
  setError(null);

  try {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to sign in');
    }

    setUserEmail(email);
    localStorage.setItem('tempEmail', email);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to sign in');
    throw err;
  } finally {
    setIsLoading(false);
  }
}, []);
```

### Step 2: Add Error Handling

```tsx
const signIn = useCallback(async (email: string) => {
  setIsLoading(true);
  setError(null);

  try {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (response.status === 429) {
      throw new Error('Too many attempts. Please try again later.');
    }

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to sign in');
    }

    setUserEmail(email);
    localStorage.setItem('tempEmail', email);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred';
    setError(errorMessage);
    throw err;
  } finally {
    setIsLoading(false);
  }
}, []);
```

## Testing Checklist

### UI Rendering
- [ ] `/auth/signin` page renders correctly
- [ ] `/auth/signup` page renders correctly
- [ ] Both pages have dark theme matching landing page
- [ ] Grid background pattern visible
- [ ] All form inputs visible and styled correctly

### Sign-In Flow
- [ ] Enter valid email → form submits
- [ ] Enter invalid email → error message appears
- [ ] After email submission → switches to OTP screen
- [ ] Can go back with "Use a different email" button
- [ ] Can navigate to Sign Up from footer link

### Sign-Up Flow
- [ ] Enter email, username, password
- [ ] Password strength requirements show with checkmarks
- [ ] Button disabled until all requirements met
- [ ] Form validation shows real-time errors
- [ ] After submission → switches to OTP screen

### OTP Verification
- [ ] 6-digit input field accepts only numbers
- [ ] Resend button shows cooldown timer (30s)
- [ ] Resend button disabled during cooldown
- [ ] Resend button enabled after cooldown
- [ ] OTP submission triggers verification

### Navigation & Redirects
- [ ] Authenticated users can't access `/auth/signin`
- [ ] Authenticated users can't access `/auth/signup`
- [ ] Successful auth redirects to `/dashboard`
- [ ] Sign Out clears auth and redirects to home
- [ ] Back buttons navigate correctly

### Persistence
- [ ] Reload page → user still authenticated
- [ ] Close tab and reopen → user still authenticated
- [ ] Sign Out → localStorage cleared
- [ ] Sign Out → can't access protected routes

## Common Issues & Solutions

### Issue: "useAuth must be used within an AuthProvider"
**Solution**: Make sure `<AuthProvider>` wraps your app in `main.tsx`

### Issue: Auth state not persisting across page reloads
**Solution**: Verify `localStorage.setItem()` calls are working in AuthContext

### Issue: Redirect to sign-in not working
**Solution**: Add route guard to protected routes checking `isAuthenticated`

### Issue: OTP resend always enabled
**Solution**: Verify `resendCooldown` state is being updated in AuthContext

## File Locations Quick Reference

| File | Location | Purpose |
|------|----------|---------|
| AuthContext | `/src/contexts/AuthContext.tsx` | Auth state & methods |
| SignInPage | `/src/pages/auth/SignInPage.tsx` | Sign-in page |
| SignUpPage | `/src/pages/auth/SignUpPage.tsx` | Sign-up page |
| SignInForm | `/src/pages/auth/SignInForm.tsx` | Email input |
| SignUpForm | `/src/pages/auth/SignUpForm.tsx` | Registration form |
| OTPVerification | `/src/pages/auth/OTPVerification.tsx` | OTP input |
| App Routes | `/src/App.tsx` | Route definitions |
| Provider Setup | `/src/main.tsx` | AuthProvider wrapper |

## Performance Notes

- AuthContext uses useCallback to prevent unnecessary re-renders
- Mock API delays (1000-1500ms) simulate network latency
- localStorage persistence is synchronous (fast)
- Components are lazy-loaded by React Router

## Security Notes (Pre-Implementation)

Before deploying to production:

1. **HTTPS Only**: All auth endpoints must use HTTPS
2. **CORS**: Configure proper CORS headers
3. **Rate Limiting**: Limit OTP attempts to 5 per hour
4. **Token Security**: Store JWT in secure cookies, not localStorage
5. **Password Hashing**: Never store plain passwords
6. **OTP Expiration**: Set OTP expiry to 10-15 minutes
7. **Email Verification**: Verify email ownership before authentication
8. **Logs & Monitoring**: Log all auth attempts for security

## Support Resources

- See `/docs/AUTHENTICATION_IMPLEMENTATION.md` for detailed API docs
- See `/docs/AUTH_IMPLEMENTATION_SUMMARY.md` for implementation overview
- Check TypeScript types in `AuthContext.tsx` for usage patterns
- Review example components above for integration patterns
