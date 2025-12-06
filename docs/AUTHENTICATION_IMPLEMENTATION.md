# Authentication System Implementation Guide

## Overview
Complete authentication system with email-based OTP verification has been added to ChatSQL. Users can sign in or create new accounts with email verification before accessing the dashboard.

## Architecture

### Components

#### 1. **SignInPage** (`/src/pages/auth/SignInPage.tsx`)
- Entry point for user sign-in
- Two-step flow: Email entry → OTP verification
- Manages step state and handles transitions
- Uses `useAuth()` hook for authentication logic
- Features:
  - Back to home navigation
  - Link to sign-up page
  - Auto-redirect to dashboard if already authenticated

#### 2. **SignUpPage** (`/src/pages/auth/SignUpPage.tsx`)
- Entry point for new account creation
- Two-step flow: Account details → OTP verification
- Collects email, username, and password
- Handles account creation and email verification
- Features:
  - Back to home navigation
  - Link to sign-in page
  - Auto-redirect to dashboard if already authenticated

#### 3. **SignInForm** (`/src/pages/auth/SignInForm.tsx`)
- Reusable email input component for sign-in
- Validates email format in real-time
- Props:
  - `onNext: (email: string) => void` - Called when form is submitted
  - `isLoading?: boolean` - Loading state indicator
  - `error?: string` - Error message display

#### 4. **SignUpForm** (`/src/pages/auth/SignUpForm.tsx`)
- Reusable form for account creation
- Validates email, username, and password
- Real-time password strength indicator with requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- Props:
  - `onNext: (data: SignUpData) => void` - Called with form data
  - `isLoading?: boolean` - Loading state indicator
  - `error?: string` - Error message display
- Returns object: `{ email, username, password }`

#### 5. **OTPVerification** (`/src/pages/auth/OTPVerification.tsx`)
- Reusable OTP input component
- 6-digit numeric input with auto-formatting
- Resend functionality with 30-second cooldown
- Props:
  - `email: string` - Email address for display
  - `onVerify: () => Promise<void>` - Called on OTP submission
  - `onResend: () => Promise<void>` - Called on resend button click
  - `isLoading?: boolean` - Verification loading state
  - `isResending?: boolean` - Resend loading state
  - `error?: string` - Error message display
  - `resendCooldown: number` - Seconds remaining before resend available

### Context & State Management

#### **AuthContext** (`/src/contexts/AuthContext.tsx`)
Centralized authentication state and methods using React Context API.

**State Variables:**
- `isAuthenticated: boolean` - Current authentication status
- `userEmail: string | null` - Authenticated user's email
- `username: string | null` - Authenticated user's username
- `authToken: string | null` - JWT or session token
- `isLoading: boolean` - Active operation loading state
- `error: string | null` - Current error message
- `resendCooldown: number` - OTP resend cooldown counter

**Methods:**
- `signIn(email: string)` - Initiate sign-in, send OTP to email
- `signUp(email: string, username: string)` - Create account, send OTP
- `verifyOTP()` - Verify OTP code, complete authentication
- `resendOTP()` - Resend OTP to email
- `signOut()` - Clear authentication and redirect

**LocalStorage Keys:**
- `authToken` - Persisted authentication token
- `userEmail` - Persisted user email
- `username` - Persisted username
- `tempEmail` - Temporary email during sign-in flow
- `tempUsername` - Temporary username during sign-up flow

### Routes

```
/auth/signin         - Sign in page (email + OTP verification)
/auth/signup         - Sign up page (registration + OTP verification)
/dashboard           - Protected dashboard (redirects to signin if not authenticated)
```

## UI Theme & Styling

All authentication pages maintain consistency with ChatSQL's design system:

**Color Palette:**
- Background: `#020817` (deep dark blue)
- Secondary Background: `#1B2431` (dark gray-blue)
- Primary Button: `#2563EB` (blue-600)
- Text Primary: White (`#FFFFFF`)
- Text Secondary: `#A3A3A3` (gray-400)
- Accent: `#60A5FA` (blue-400)
- Error: `#EF4444` (red-500)

**Components Used:**
- shadcn/ui Button, Input, Label
- Lucide icons (Mail, Lock, User, etc.)
- Custom form validation
- Backdrop blur effects
- Grid background pattern

## Integration Points

### 1. **Landing Page Navigation**
Add links to auth pages from your landing page:
```tsx
<Link to="/auth/signin" className="...">Sign In</Link>
<Link to="/auth/signup" className="...">Sign Up</Link>
```

### 2. **Dashboard Protection**
Add route guards to protect dashboard routes:
```tsx
function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Dashboard /> : <Navigate to="/auth/signin" />;
}
```

### 3. **User Menu**
Add sign-out button in dashboard navbar:
```tsx
const { signOut, userEmail } = useAuth();

<button onClick={signOut}>Sign Out</button>
<span>{userEmail}</span>
```

## Backend API Integration

Current implementation uses mock/simulated API calls. Replace these functions in `AuthContext.tsx` with real API endpoints:

### Endpoints to Create

#### `POST /api/auth/signin`
```json
Request: { "email": "user@example.com" }
Response: { "success": true, "message": "OTP sent to email" }
```

#### `POST /api/auth/signup`
```json
Request: { 
  "email": "user@example.com",
  "username": "johndoe",
  "password": "HashedPassword123"
}
Response: { "success": true, "message": "Account created, OTP sent" }
```

#### `POST /api/auth/verify-otp`
```json
Request: { "email": "user@example.com", "otp": "123456" }
Response: { 
  "success": true,
  "token": "jwt_token_here",
  "user": { "email": "...", "username": "..." }
}
```

#### `POST /api/auth/resend-otp`
```json
Request: { "email": "user@example.com" }
Response: { "success": true, "message": "OTP resent" }
```

## Usage Examples

### Using useAuth Hook
```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { isAuthenticated, userEmail, signOut } = useAuth();

  if (!isAuthenticated) {
    return <p>Not logged in</p>;
  }

  return (
    <div>
      <p>Welcome, {userEmail}</p>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

### Sign-In Flow
```
1. User navigates to /auth/signin
2. Enters email address
3. SignInPage calls signIn(email) via AuthContext
4. OTP is sent to email (mock or real API)
5. User switches to OTP verification step
6. User enters 6-digit code
7. OTPVerification calls verifyOTP() via AuthContext
8. Token and user data stored in localStorage
9. User redirected to /dashboard
```

### Sign-Up Flow
```
1. User navigates to /auth/signup
2. Enters email, username, password
3. SignUpPage calls signUp(email, username) via AuthContext
4. Account created and OTP sent (mock or real API)
5. User switches to OTP verification step
6. User enters 6-digit code
7. OTPVerification calls verifyOTP() via AuthContext
8. Token and user data stored in localStorage
9. User redirected to /dashboard
```

## Testing Checklist

- [ ] Navigate to `/auth/signin` - page loads correctly
- [ ] Test email validation - invalid emails show error
- [ ] Test OTP flow - transitions work smoothly
- [ ] Test "Sign Up" link navigation
- [ ] Navigate to `/auth/signup` - page loads correctly
- [ ] Test password strength requirements
- [ ] Test form validation - all fields required
- [ ] Test OTP resend - cooldown timer works (30 sec)
- [ ] Test navigation - back button returns to home
- [ ] Test localStorage - data persists across page reloads
- [ ] Test redirect - authenticated users can't access auth pages
- [ ] Test redirect - unauthenticated users redirected to signin

## Future Enhancements

1. **Social Sign-In**
   - Google OAuth integration
   - GitHub OAuth integration

2. **Password Management**
   - Forgot password flow
   - Password reset via email
   - Password change functionality

3. **Two-Factor Authentication**
   - TOTP (Time-based OTP) support
   - Backup codes generation

4. **Security Improvements**
   - Rate limiting on OTP attempts
   - Account lockout after failed attempts
   - Email verification for account recovery

5. **User Profile**
   - Profile edit page
   - Avatar upload
   - Profile settings

## File Structure

```
src/
├── contexts/
│   └── AuthContext.tsx          # Authentication context & hooks
├── pages/
│   └── auth/
│       ├── SignInPage.tsx       # Sign-in page
│       ├── SignUpPage.tsx       # Sign-up page
│       ├── SignInForm.tsx       # Email input form
│       ├── SignUpForm.tsx       # Registration form
│       └── OTPVerification.tsx  # OTP input component
└── main.tsx                      # AuthProvider wrapper added
```

## Notes

- All components use TypeScript for type safety
- Mock API delays (1000-1500ms) simulate real network requests
- Error handling is centralized in AuthContext
- Component composition enables reusability across flows
- localStorage provides session persistence
- No external auth libraries (Auth0, Firebase) to keep it lightweight

## Support

For questions or issues with the authentication system:
1. Check the mock implementations in `AuthContext.tsx`
2. Verify API endpoint contracts match backend
3. Review component prop interfaces
4. Check console for error messages
5. Validate localStorage data in browser DevTools
