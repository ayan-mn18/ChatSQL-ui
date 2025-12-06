# 🚀 Authentication System - Quick Reference Card

## Routes
```
/auth/signin          Sign In Page (Email + OTP)
/auth/signup          Sign Up Page (Registration + OTP)
/dashboard            Protected Route (redirect to /auth/signin if not auth)
```

## Using useAuth() Hook

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const {
    // State
    isAuthenticated,
    userEmail,
    username,
    authToken,
    isLoading,
    error,
    resendCooldown,
    
    // Methods
    signIn,
    signUp,
    verifyOTP,
    resendOTP,
    signOut,
    setError
  } = useAuth();
}
```

## Sign-In Example

```tsx
async function handleSignIn(email: string) {
  try {
    await signIn(email);
    // OTP sent, transition to verification step
  } catch (err) {
    // Error in context.error
  }
}
```

## Sign-Up Example

```tsx
async function handleSignUp(email: string, username: string) {
  try {
    await signUp(email, username);
    // Account created, OTP sent, transition to verification
  } catch (err) {
    // Error in context.error
  }
}
```

## OTP Verification Example

```tsx
async function handleVerifyOTP() {
  try {
    await verifyOTP();
    // Success! User authenticated and redirected to dashboard
  } catch (err) {
    // Error in context.error
  }
}
```

## Component Props

### SignInForm
```tsx
interface SignInFormProps {
  onNext: (email: string) => void;
  isLoading?: boolean;
  error?: string;
}
```

### SignUpForm
```tsx
interface SignUpFormProps {
  onNext: (data: {
    email: string;
    username: string;
    password: string;
  }) => void;
  isLoading?: boolean;
  error?: string;
}
```

### OTPVerification
```tsx
interface OTPVerificationProps {
  email: string;
  onVerify: () => Promise<void>;
  onResend: () => Promise<void>;
  isLoading?: boolean;
  isResending?: boolean;
  error?: string;
  resendCooldown: number;
}
```

## localStorage Keys

| Key | Value | Purpose |
|-----|-------|---------|
| `authToken` | JWT token | Authentication |
| `userEmail` | user@example.com | User identifier |
| `username` | johndoe | User display name |
| `tempEmail` | user@example.com | Auth flow (temp) |
| `tempUsername` | johndoe | Signup flow (temp) |

## UI Colors

```css
Background:      #020817 (dark navy)
Secondary:       #1B2431 (dark gray-blue)
Primary Button:  #2563EB (blue-600)
Text:            #FFFFFF (white)
Secondary Text:  #A3A3A3 (gray-400)
Error:           #EF4444 (red-500)
Border:          #374151 (gray-800)
```

## File Structure

```
src/
├── contexts/
│   └── AuthContext.tsx           ← Auth state & methods
├── pages/
│   ├── auth/
│   │   ├── SignInPage.tsx        ← Sign-in page
│   │   ├── SignUpPage.tsx        ← Sign-up page
│   │   ├── SignInForm.tsx        ← Email form
│   │   ├── SignUpForm.tsx        ← Registration form
│   │   └── OTPVerification.tsx   ← OTP input
│   └── index.ts                  ← Exports
├── App.tsx                       ← Routes (updated)
└── main.tsx                      ← Provider (updated)

docs/
├── AUTHENTICATION_COMPLETE.md           ← Overview
├── AUTH_IMPLEMENTATION_SUMMARY.md       ← Features
├── AUTHENTICATION_IMPLEMENTATION.md     ← API Docs
├── AUTH_INTEGRATION_GUIDE.md           ← How to use
├── AUTH_SYSTEM_ARCHITECTURE.md         ← Diagrams
└── AUTH_TESTING_CHECKLIST.md          ← Testing
```

## Integration Checklist

- [ ] Auth files present (6 components)
- [ ] Routes added to App.tsx
- [ ] AuthProvider wrapper in main.tsx
- [ ] Build succeeds (npm run build)
- [ ] No TypeScript errors
- [ ] Can navigate to /auth/signin
- [ ] Can navigate to /auth/signup
- [ ] Sign-in flow works
- [ ] Sign-up flow works
- [ ] localStorage persists auth
- [ ] useAuth() hook works
- [ ] Documentation read

## Common Tasks

### Add Sign-In Button to Landing Page
```tsx
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();
  
  return (
    <button onClick={() => navigate('/auth/signin')}>
      Sign In
    </button>
  );
}
```

### Protect Dashboard Route
```tsx
function ProtectedDashboard() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Dashboard /> : <Navigate to="/auth/signin" />;
}
```

### Show User Info
```tsx
function NavBar() {
  const { userEmail, signOut } = useAuth();
  
  return (
    <div>
      <span>{userEmail}</span>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Check If Authenticated
```tsx
function MyComponent() {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <p>Please sign in</p>;
  }
  
  return <p>Signed in!</p>;
}
```

## API Endpoints (To Be Implemented)

### Sign-In
```
POST /api/auth/signin
{ email: "user@example.com" }
→ OTP sent to email
```

### Sign-Up
```
POST /api/auth/signup
{ email, username, password }
→ Account created, OTP sent
```

### Verify OTP
```
POST /api/auth/verify-otp
{ email, otp }
→ { token: "...", user: {...} }
```

### Resend OTP
```
POST /api/auth/resend-otp
{ email }
→ OTP resent
```

## Environment Variables (Future)

```
VITE_API_URL=http://localhost:3000
VITE_MAIL_SERVICE=sendgrid
VITE_OTP_EXPIRY=600
VITE_OTP_RESEND_LIMIT=5
```

## Troubleshooting

### "useAuth must be used within an AuthProvider"
✓ Solution: Ensure `<AuthProvider>` wraps app in main.tsx

### Auth state not persisting
✓ Solution: Check localStorage in DevTools (F12 → Application)

### Forms not validating
✓ Solution: Check console for validation logic errors

### OTP always fails
✓ Solution: Mock always succeeds; check real API response format

### TypeScript errors
✓ Solution: Rebuild with `npm run build` to see full errors

## Performance Tips

- AuthContext uses useCallback to prevent re-renders
- Forms only validate on change (not on every keystroke)
- OTP input auto-formats without re-renders
- localStorage is synchronous (fast)
- Mock API simulates network delay (good for UX testing)

## Security Reminders

- ⚠️ Don't store passwords in localStorage
- ⚠️ Don't log sensitive auth data
- ⚠️ Use HTTPS in production
- ⚠️ Add rate limiting on OTP attempts
- ⚠️ Implement CSRF protection on backend
- ⚠️ Set secure cookie flags
- ⚠️ Validate all inputs on backend

## Testing Commands

```bash
# Build & verify no errors
npm run build

# Start dev server
npm run dev

# Navigate to
http://localhost:5173/auth/signin
http://localhost:5173/auth/signup

# Test sign-in
# - Enter any email
# - Click "Continue"
# - Enter any 6 digits for OTP
# - Click "Verify"
# - Should redirect to /dashboard

# Check localStorage
# DevTools → Application → Local Storage → URL
```

## Key Files to Know

| File | Lines | Purpose |
|------|-------|---------|
| AuthContext.tsx | 149 | State + Methods |
| SignInPage.tsx | 114 | Sign-in flow |
| SignUpPage.tsx | 124 | Sign-up flow |
| SignInForm.tsx | 143 | Email input |
| SignUpForm.tsx | 186 | Registration |
| OTPVerification.tsx | 132 | OTP input |

## Status

✅ **Complete and ready for use**
- 6 components
- 0 errors
- 1400+ lines of documentation
- Ready for backend integration

## Next Action

1. Read `AUTHENTICATION_COMPLETE.md`
2. Review `AUTH_IMPLEMENTATION_SUMMARY.md`
3. Test at `/auth/signin` and `/auth/signup`
4. Integrate with landing page
5. Connect to real backend API

---

**Questions?** See `/docs/AUTHENTICATION_IMPLEMENTATION.md` for detailed API documentation.
