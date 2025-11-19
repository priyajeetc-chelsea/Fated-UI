# Authentication Flow Diagrams

## 1. Initial Login Flow

```
┌─────────────────┐
│  User Opens App │
└────────┬────────┘
         │
         v
┌─────────────────────┐
│ AuthContext.init()  │
│ Check AsyncStorage  │
└────────┬────────────┘
         │
         v
    No Tokens?
         │
         v
┌─────────────────┐
│  Show Login UI  │
└────────┬────────┘
         │
         v
┌──────────────────┐
│ Enter Phone #    │
│ Request OTP      │
└────────┬─────────┘
         │
         v
┌──────────────────┐
│  Receive OTP     │
│  Verify Code     │
└────────┬─────────┘
         │
         v
┌─────────────────────────────┐
│ Backend Returns:            │
│ • Custom Token              │
│ • User Data                 │
└────────┬────────────────────┘
         │
         v
┌─────────────────────────────┐
│ Exchange Custom Token       │
│ with Firebase               │
└────────┬────────────────────┘
         │
         v
┌─────────────────────────────┐
│ Firebase Returns:           │
│ • ID Token (1hr expiry)     │
│ • Refresh Token (30d+)      │
│ • Expiry Time               │
└────────┬────────────────────┘
         │
         v
┌─────────────────────────────┐
│ Store in AsyncStorage:      │
│ • bearerToken               │
│ • refreshToken              │
│ • tokenExpiry               │
│ • userData                  │
└────────┬────────────────────┘
         │
         v
┌─────────────────┐
│  User Logged In │
│  Navigate to    │
│  Protected Area │
└─────────────────┘
```

## 2. App Restart Flow (Persistent Auth)

```
┌─────────────────┐
│  User Opens App │
│  (Previously    │
│   Logged In)    │
└────────┬────────┘
         │
         v
┌─────────────────────────────┐
│ AuthContext.init()          │
│ Load from AsyncStorage:     │
│ • bearerToken               │
│ • refreshToken              │
│ • tokenExpiry               │
│ • userData                  │
└────────┬────────────────────┘
         │
         v
    Has Tokens?
         │
    ┌────┴────┐
    v         v
   Yes       No
    │         │
    │         v
    │    ┌─────────────┐
    │    │ Show Login  │
    │    └─────────────┘
    │
    v
┌──────────────────┐
│ Check Expiry     │
│ isTokenExpired() │
└────────┬─────────┘
         │
    ┌────┴────┐
    v         v
Expired?    Not Expired?
    │         │
    │         v
    │    ┌─────────────────┐
    │    │ Keep Existing   │
    │    │ Token & Login   │
    │    │ User            │
    │    └─────────────────┘
    │
    v
┌──────────────────┐
│ Refresh Token    │
│ Using Firebase   │
│ Refresh API      │
└────────┬─────────┘
         │
    ┌────┴────┐
    v         v
Success?   Failed?
    │         │
    │         v
    │    ┌─────────────┐
    │    │ Clear Auth  │
    │    │ Show Login  │
    │    └─────────────┘
    │
    v
┌──────────────────┐
│ Store New Tokens │
│ Login User       │
└──────────────────┘
```

## 3. API Request Flow (Auto-Refresh)

```
┌─────────────────────────┐
│ Component Makes API Call│
│ apiService.fetch...()   │
└────────┬────────────────┘
         │
         v
┌──────────────────────────────┐
│ createAuthenticatedRequest() │
└────────┬─────────────────────┘
         │
         v
┌──────────────────────┐
│ Check Token Expiry   │
│ isTokenExpired()?    │
└────────┬─────────────┘
         │
    ┌────┴─────┐
    v          v
Expires     Not Expiring
< 5min?     (> 5min)
    │          │
    │          └─────┐
    v                v
┌─────────────┐     │
│ Refresh     │     │
│ Token First │     │
└────┬────────┘     │
     │              │
     v              │
┌──────────────┐    │
│ Store New    │    │
│ Tokens       │    │
└────┬─────────┘    │
     │              │
     └──────┬───────┘
            v
┌─────────────────────┐
│ Add Authorization   │
│ Header with Token   │
└────────┬────────────┘
         │
         v
┌─────────────────────┐
│ Make HTTP Request   │
└────────┬────────────┘
         │
    ┌────┴────┐
    v         v
  Success?   401 Error?
    │         │
    │         v
    │    ┌──────────────┐
    │    │ Refresh Token│
    │    │ Once         │
    │    └────┬─────────┘
    │         │
    │         v
    │    ┌──────────────┐
    │    │ Retry Request│
    │    │ with New     │
    │    │ Token        │
    │    └────┬─────────┘
    │         │
    │    ┌────┴────┐
    │    v         v
    │  Success?  Still 401?
    │    │         │
    │    │         v
    │    │    ┌─────────────┐
    │    │    │ Clear Auth  │
    │    │    │ Redirect to │
    │    │    │ Login       │
    │    │    └─────────────┘
    │    │
    v    v
┌────────────────┐
│ Return Data to │
│ Component      │
└────────────────┘
```

## 4. Token Refresh Process

```
┌─────────────────────┐
│ refreshIdToken()    │
│ Called              │
└────────┬────────────┘
         │
         v
┌─────────────────────────┐
│ Check if Already        │
│ Refreshing?             │
│ (refreshPromise exists) │
└────────┬────────────────┘
         │
    ┌────┴────┐
    v         v
   Yes       No
    │         │
    │         v
    │    ┌──────────────────┐
    │    │ Get Refresh Token│
    │    │ from Storage     │
    │    └────┬─────────────┘
    │         │
    │         v
    │    ┌─────────────────────┐
    │    │ POST to Firebase:   │
    │    │ securetoken.google  │
    │    │ apis.com/v1/token   │
    │    └────┬────────────────┘
    │         │
    │         v
    │    ┌─────────────────────┐
    │    │ Receive:            │
    │    │ • New ID Token      │
    │    │ • New Refresh Token │
    │    │ • Expiry Time       │
    │    └────┬────────────────┘
    │         │
    │         v
    │    ┌──────────────────┐
    │    │ Store New Tokens │
    │    │ in AsyncStorage  │
    │    └────┬─────────────┘
    │         │
    v         v
┌───────────────────┐
│ Wait for Promise  │
│ Return New Token  │
└───────────────────┘
```

## 5. Error Handling Flow

```
┌─────────────────────┐
│ API Call Throws     │
│ Error               │
└────────┬────────────┘
         │
         v
┌─────────────────────┐
│ Component Catch     │
│ Block               │
└────────┬────────────┘
         │
         v
┌─────────────────────┐
│ handleError(error)  │
│ from useApiError    │
│ Handler hook        │
└────────┬────────────┘
         │
         v
┌──────────────────────┐
│ Check Error Message  │
└────────┬─────────────┘
         │
    ┌────┴────────────┐
    v                 v
Auth Related?    Other Error?
    │                 │
    │                 v
    │            ┌──────────┐
    │            │ Log Only │
    │            └──────────┘
    │
    v
┌─────────────────────┐
│ handleAuthError()   │
│ in AuthContext      │
└────────┬────────────┘
         │
         v
┌─────────────────────┐
│ clearAuthData()     │
│ Clear AsyncStorage  │
└────────┬────────────┘
         │
         v
┌─────────────────────┐
│ Set isAuthenticated │
│ = false             │
└────────┬────────────┘
         │
         v
┌─────────────────────┐
│ AuthGuard Detects   │
│ User Not Authed     │
└────────┬────────────┘
         │
         v
┌─────────────────────┐
│ Redirect to Login   │
│ Screen              │
└─────────────────────┘
```

## Key Timings

- **ID Token Expiry**: 1 hour (3600 seconds)
- **Refresh Buffer**: 5 minutes before expiry
- **Actual Refresh Trigger**: When token has < 5 minutes left
- **Refresh Token Expiry**: 30+ days (set by Firebase)
- **Auto-refresh Check**: On every API request

## Storage Keys Reference

```
AsyncStorage
├── bearerToken       → "Bearer eyJhbGc..."
├── refreshToken      → "AMf-vBwrj8..."
├── tokenExpiry       → "1700454321000" (timestamp)
└── userData          → '{"id":"123","phone":"+1234567890",...}'
```
