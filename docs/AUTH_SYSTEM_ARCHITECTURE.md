# Authentication System - Visual Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Application                         │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     App.tsx (Router)                     │   │
│  │  Routes: / | /landing | /chat | /auth/signin | /auth... │   │
│  └────────────────────────────────────────────────────────┬─┘   │
│                                                            │      │
│  ┌────────────────────────────────────────────────────────▼─┐   │
│  │            AuthProvider (src/contexts/...)              │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │        AuthContext State Management             │   │   │
│  │  │  • isAuthenticated, userEmail, username         │   │   │
│  │  │  • authToken, isLoading, error                  │   │   │
│  │  │  • resendCooldown                               │   │   │
│  │  │                                                  │   │   │
│  │  │  Methods:                                        │   │   │
│  │  │  • signIn(email)       → OTP sent               │   │   │
│  │  │  • signUp(email, user) → OTP sent               │   │   │
│  │  │  • verifyOTP()         → Token generated        │   │   │
│  │  │  • resendOTP()         → OTP resent             │   │   │
│  │  │  • signOut()           → Clear session          │   │   │
│  │  └────────────────────┬──────────────────────────┘   │   │
│  └─────────────────────┼─────────────────────────────┘   │
│                        │                                   │
│        ┌───────────────┼───────────────┐                  │
│        │               │               │                  │
│  ┌─────▼────┐  ┌──────▼──────┐  ┌─────▼─────┐            │
│  │SignInPage │  │SignUpPage   │  │Dashboard  │            │
│  │(2 Steps)  │  │(2 Steps)    │  │Protected  │            │
│  │           │  │             │  │Route      │            │
│  │Email → OTP│  │Form → OTP   │  │Redirect   │            │
│  │           │  │             │  │if Not Auth│            │
│  └─────┬─────┘  └──────┬──────┘  └───────────┘            │
│        │               │                                   │
│  ┌─────▼────────┬──────▼──────┐                           │
│  │ SignInForm   │ SignUpForm   │                           │
│  │              │              │                           │
│  │ • Email      │ • Email      │                           │
│  │   validation │ • Username   │                           │
│  │ • Error      │ • Password   │                           │
│  │   display    │ • Strength   │                           │
│  │              │   indicator  │                           │
│  └───────┬──────┴─────────┬────┘                           │
│          │                │                                │
│          └─────┬──────────┘                                │
│                │                                           │
│          ┌─────▼──────────┐                                │
│          │OTPVerification │                                │
│          │                │                                │
│          │ • 6-digit OTP  │                                │
│          │ • Email display│                                │
│          │ • Resend btn   │                                │
│          │ • Cooldown (30s)                                │
│          └────────────────┘                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│          localStorage (Browser)          │
│  • authToken                             │
│  • userEmail                             │
│  • username                              │
│  • tempEmail (during auth)               │
│  • tempUsername (during signup)          │
└──────────────────────────────────────────┘
```

## User Flow Diagrams

### Sign-In Flow
```
                    START
                      │
                      ▼
        ┌─────────────────────────┐
        │    /auth/signin         │
        │    SignInPage.tsx       │
        │                         │
        │  [Email Input Form]     │
        └──────────┬──────────────┘
                   │
         ┌─────────▼──────────┐
         │ Email Validation   │
         └────┬────────┬──────┘
              │        │
         Valid│        │Invalid
              │        │ (Show Error)
              ▼        │
   ┌──────────────┐    │
   │ Call signIn()────┘
   │ (send OTP)   │
   └──────┬───────┘
          │
          ▼
   ┌─────────────────────────┐
   │    SignInPage.tsx       │
   │   (OTP Verification)    │
   │                         │
   │  [6-Digit OTP Input]    │
   │  [Resend Button]        │
   │  [Cooldown Timer]       │
   └──────────┬──────────────┘
              │
         ┌────┴─────────┐
         │              │
    Resend           Verify
         │              │
    ┌────▼───┐     ┌────▼──────┐
    │Reset   │     │Call        │
    │Cooldown│     │verifyOTP() │
    │(30s)   │     └────┬───────┘
    └────────┘          │
                        ▼
                ┌──────────────────┐
                │ verifyOTP() OK?  │
                └────┬────────┬────┘
                     │        │
                  Yes│        │No
                     │        │ (Show Error)
                     ▼        │
        ┌────────────────────┐│
        │ Token Generated    ││
        │ Data to localStorage
        │ authToken = token  │
        │ userEmail = email  │
        └────────┬───────────┘
                 │
                 ▼
          navigate('/dashboard')
                 │
                 ▼
                SUCCESS
```

### Sign-Up Flow
```
                    START
                      │
                      ▼
        ┌─────────────────────────┐
        │    /auth/signup         │
        │    SignUpPage.tsx       │
        │                         │
        │  [Registration Form]    │
        │  • Email input          │
        │  • Username input       │
        │  • Password input       │
        │  • Strength indicator   │
        │  • [Create Account Btn] │
        └──────────┬──────────────┘
                   │
         ┌─────────▼──────────────────┐
         │ Validation (all fields)    │
         │ + Password strength check  │
         └────┬────────────────┬──────┘
              │                │
         Valid│                │Invalid
              │                │ (Show errors)
              ▼                │
   ┌──────────────────┐        │
   │ Call signUp()────┘
   │ (create account) │
   │ (send OTP)       │
   └──────┬───────────┘
          │
          ▼
   ┌─────────────────────────┐
   │    SignUpPage.tsx       │
   │   (OTP Verification)    │
   │                         │
   │  [6-Digit OTP Input]    │
   │  [Resend Button]        │
   │  [Cooldown Timer]       │
   └──────────┬──────────────┘
              │
         ┌────┴──────────┐
         │               │
    Resend           Verify
         │               │
    ┌────▼───┐     ┌────▼──────┐
    │Reset   │     │Call        │
    │Cooldown│     │verifyOTP() │
    │(30s)   │     └────┬───────┘
    └────────┘          │
                        ▼
                ┌──────────────────┐
                │ verifyOTP() OK?  │
                └────┬────────┬────┘
                     │        │
                  Yes│        │No
                     │        │ (Show Error)
                     ▼        │
        ┌────────────────────┐│
        │ Token Generated    ││
        │ Data to localStorage
        │ authToken = token  │
        │ userEmail = email  │
        │ username = user    │
        └────────┬───────────┘
                 │
                 ▼
          navigate('/dashboard')
                 │
                 ▼
                SUCCESS
```

## Component Hierarchy

```
main.tsx
└── AuthProvider
    └── BrowserRouter
        └── App.tsx
            ├── Route: / (Landing)
            ├── Route: /auth/signin
            │   └── SignInPage
            │       ├── SignInForm
            │       └── OTPVerification
            │
            ├── Route: /auth/signup
            │   └── SignUpPage
            │       ├── SignUpForm
            │       └── OTPVerification
            │
            └── Route: /dashboard
                └── DashboardLayout
                    ├── Navbar (with Sign Out)
                    ├── Sidebar
                    └── Content
```

## Data Flow Diagram

```
┌────────────────────────────────────────────────────────┐
│ User Action (SignInForm)                               │
│ • Input: email                                         │
│ • Action: onNext(email)                                │
└────────────┬─────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│ SignInPage Component                                   │
│ • Receives: email from SignInForm                      │
│ • Calls: useAuth().signIn(email)                       │
└────────────┬─────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│ AuthContext (signIn method)                            │
│ • Sets: isLoading = true                              │
│ • Calls: API /api/auth/signin or mock delay           │
│ • Stores: tempEmail in localStorage                    │
│ • Sets: isLoading = false                             │
│ • Sets: error = null (or error message)               │
└────────────┬─────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│ SignInPage receives new state via useAuth()            │
│ • Detects: isLoading changed from true to false       │
│ • Updates: UI (enables button, removes spinner)        │
│ • Transitions: to OTP step                             │
└────────────┬─────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│ User enters OTP → OTPVerification component            │
│ • Input: 6-digit code                                  │
│ • Action: onVerify() called                            │
└────────────┬─────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│ SignInPage receives OTP verification request           │
│ • Calls: useAuth().verifyOTP()                        │
└────────────┬─────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│ AuthContext (verifyOTP method)                         │
│ • Sets: isLoading = true                              │
│ • Calls: API /api/auth/verify-otp or mock validation  │
│ • Generates: token                                     │
│ • Stores: authToken, userEmail in localStorage         │
│ • Updates: isAuthenticated = true                      │
│ • Sets: isLoading = false                             │
└────────────┬─────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│ SignInPage detects: isAuthenticated = true             │
│ • Navigates: to /dashboard                             │
│ • React Router: matches /dashboard route               │
│ • Loads: DashboardLayout                               │
└──────────────────────────────────────────────────────┘
```

## State Management Overview

```
AuthContext State
├── User State
│   ├── isAuthenticated (boolean)
│   ├── userEmail (string | null)
│   ├── username (string | null)
│   └── authToken (string | null)
│
├── UI State
│   ├── isLoading (boolean)
│   ├── error (string | null)
│   └── resendCooldown (number)
│
├── Methods (useCallback)
│   ├── signIn(email) → Promise<void>
│   ├── signUp(email, username) → Promise<void>
│   ├── verifyOTP() → Promise<void>
│   ├── resendOTP() → Promise<void>
│   └── signOut() → void
│
└── Setters
    ├── setError(error) → void
    └── setResendCooldown (internal)

LocalStorage Persistence
├── authToken (primary key)
├── userEmail (secondary identifier)
├── username (user display name)
├── tempEmail (OTP flow holder)
└── tempUsername (signup flow holder)
```

## API Integration Points

```
┌─────────────────────────────────────────────┐
│  AuthContext Mock Methods → Real API        │
├─────────────────────────────────────────────┤
│                                             │
│ signIn(email)                              │
│   ├─ Mock: await delay(1000)               │
│   └─ Real: POST /api/auth/signin           │
│             { email }                      │
│             → Send OTP to email            │
│                                            │
│ signUp(email, username)                    │
│   ├─ Mock: await delay(1000)               │
│   └─ Real: POST /api/auth/signup           │
│             { email, username, password }  │
│             → Create account, send OTP     │
│                                            │
│ verifyOTP()                                │
│   ├─ Mock: await delay(1000)               │
│   └─ Real: POST /api/auth/verify-otp       │
│             { email, otp }                 │
│             → Return { token, user }      │
│                                            │
│ resendOTP()                                │
│   ├─ Mock: await delay(1000)               │
│   └─ Real: POST /api/auth/resend-otp       │
│             { email }                      │
│             → Resend OTP code              │
│                                            │
└─────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌────────────────────────────────┐
│ User Action / API Call         │
└────────────┬───────────────────┘
             │
             ▼
    ┌────────────────┐
    │  Try-Catch     │
    │  Block         │
    └────┬───────┬───┘
         │       │
      Success   Error
         │       │
         │       ▼
         │   ┌─────────────────┐
         │   │ setError()      │
         │   │ Clear UI state  │
         │   │ Throw error     │
         │   └────────┬────────┘
         │            │
         ▼            ▼
    ┌──────────────────────────┐
    │ Component receives error │
    │ via useAuth() hook       │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ Conditional Rendering:   │
    │ {error && (              │
    │   <ErrorMessage />       │
    │ )}                       │
    └──────────────────────────┘
```

## Routing & Authentication Flow

```
┌──────────────────────────────────────────────────────┐
│  Router (App.tsx)                                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  GET /                 → Landing/Home               │
│  GET /auth/signin      → SignInPage                 │
│  GET /auth/signup      → SignUpPage                 │
│  GET /dashboard        → ProtectedRoute            │
│                           ├─ Check: isAuth?       │
│                           ├─ Yes: Show Dashboard  │
│                           └─ No: Redirect /auth   │
│                                                      │
│  Protected Routes Guard Example:                    │
│  if (!isAuthenticated) {                            │
│    return <Navigate to="/auth/signin" />           │
│  }                                                   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Component Props Flow

```
SignInPage
└─ Pass: onNext callback
   └─ SignInForm
      └─ Called with: email

SignInPage
└─ Pass: isLoading, error from useAuth
   └─ OTPVerification
      └─ Use for: UI state display

SignUpPage  
└─ Pass: onNext callback
   └─ SignUpForm
      └─ Called with: { email, username, password }

SignUpPage
└─ Pass: isLoading, error, resendCooldown
   └─ OTPVerification
      └─ Use for: UI state display
```

This architecture ensures:
- **Separation of Concerns**: Each component has a single responsibility
- **Reusability**: Form components used across different flows
- **Centralized State**: AuthContext manages all auth logic
- **Easy Testing**: Mock API, clear data flow
- **Scalability**: Easy to add new auth methods (social, 2FA, etc.)
- **Type Safety**: Full TypeScript support throughout
