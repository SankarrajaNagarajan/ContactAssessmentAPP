# JWT Token Authorization Implementation Guide

## Overview
This document describes the complete JWT (JSON Web Token) authorization system implemented in the Contact Assessment Application.

## Architecture

### Services

#### 1. **JwtUtilService** (`src/app/core/services/jwt-util.service.ts`)
A utility service that handles JWT token operations without external dependencies.

**Key Methods:**
- `decodeToken(token: string): any` - Decodes JWT payload
- `isTokenExpired(token: string): boolean` - Checks if token is expired
- `getTokenExpirationTime(token: string): number` - Returns remaining time in milliseconds
- `getTokenClaims(token: string): any` - Extracts token claims
- `isValidTokenStructure(token: string): boolean` - Validates JWT format

#### 2. **AuthService** (`src/app/core/services/auth.service.ts`)
Manages authentication state and JWT token operations.

**Key Features:**
- Token validation on service initialization
- Automatic token expiration checking
- Token refresh capability
- User claims management via Observable
- Comprehensive error handling

**Key Methods:**
- `login(username: string, password: string): Observable<any>` - User authentication
- `logout(): void` - Clear authentication
- `getToken(): string | null` - Get valid token
- `isAuthenticated(): boolean` - Check authentication status
- `isTokenExpired(): boolean` - Check token expiration
- `refreshToken(): Observable<any>` - Refresh expired token
- `getClaims(): any` - Get user claims from token
- `getTokenExpirationTime(): number` - Get remaining token time

**Observable Streams:**
- `isAuthenticated$` - Authentication status stream
- `currentUser$` - Current user claims stream

### Guards

#### **AuthGuard** (`src/app/core/auth/guards/auth-guard.ts`)
Protects routes and enforces JWT validation.

**Features:**
- Validates token structure
- Checks token expiration
- Prevents access with expired tokens
- Redirects to login with return URL
- Warns when token expiring soon (< 5 minutes)

### Interceptors

#### **AuthInterceptor** (`src/app/core/auth/interceptors/auth-interceptor.ts`)
Automatically adds JWT token to HTTP requests and handles authentication errors.

**Features:**
- Adds `Authorization: Bearer <token>` header to requests
- Handles 401 Unauthorized responses
- Implements token refresh logic with request queuing
- Handles 403 Forbidden with logout
- Prevents multiple simultaneous refresh attempts

## Token Storage

- **Location:** `localStorage`
- **Keys:**
  - `authToken` - The JWT token
  - `tokenExpiry` - Token expiration timestamp

## Token Validation Flow

```
Request → AuthInterceptor
    ↓
Add Authorization Header
    ↓
Next Handler
    ↓
Response/Error
    ↓
Check Status Code
    ↓
401 Unauthorized? → Attempt Refresh Token
403 Forbidden? → Logout & Redirect to Login
Success? → Return Response
```

## Login Flow

```
User Input
    ↓
Validate Form
    ↓
AuthService.login()
    ↓
Backend Auth Endpoint
    ↓
Receive JWT Token
    ↓
Store Token (localStorage)
    ↓
Update isAuthenticated$ → true
    ↓
Update currentUser$ → User Claims
    ↓
Navigate to returnUrl
```

## Token Refresh Flow

```
401 Unauthorized Response
    ↓
AuthInterceptor.handle401Error()
    ↓
Is already refreshing?
    ├─ No: Attempt refresh
    │   ↓
    │   AuthService.refreshToken()
    │   ↓
    │   Backend /refresh endpoint
    │   ↓
    │   Receive new token
    │   ↓
    │   Store new token
    │   ↓
    │   Retry original request
    │
    └─ Yes: Wait for refresh to complete
        ↓
        Retry original request with new token
```

## Usage Examples

### Check if User is Authenticated
```typescript
if (this.authService.isAuthenticated()) {
  // User is authenticated with valid token
}
```

### Get Current User Claims
```typescript
const claims = this.authService.getClaims();
console.log(claims.sub);        // User ID
console.log(claims.email);      // User email
console.log(claims.username);   // Username
```

### Subscribe to Authentication Changes
```typescript
this.authService.isAuthenticated$.subscribe(isAuth => {
  if (isAuth) {
    console.log('User logged in');
  }
});
```

### Get Token Remaining Time
```typescript
const remainingMs = this.authService.getTokenExpirationTime();
const remainingSeconds = remainingMs / 1000;
console.log(`Token expires in ${remainingSeconds} seconds`);
```

### Manual Token Refresh
```typescript
this.authService.refreshToken().subscribe({
  next: (response) => {
    console.log('Token refreshed');
  },
  error: (error) => {
    console.log('Token refresh failed, redirecting to login');
  }
});
```

## Token Claims

Standard JWT claims extracted from the token:
- `sub` - Subject (User ID)
- `email` - User email
- `username` - Username
- `iat` - Issued at timestamp
- `exp` - Expiration timestamp
- `iss` - Issuer
- `aud` - Audience
- Custom claims as provided by backend

## Security Considerations

1. **Token Storage**: Tokens are stored in `localStorage`. For enhanced security, consider using httpOnly cookies instead.

2. **Token Refresh**: The interceptor automatically attempts to refresh expired tokens. Ensure the backend provides a refresh endpoint.

3. **HTTPS**: Always use HTTPS in production to protect tokens in transit.

4. **CORS**: Configure CORS properly on the backend to prevent unauthorized access.

5. **Token Expiration**: Consider token expiration times:
   - Short-lived tokens (15-60 minutes) for security
   - Refresh tokens for obtaining new access tokens

6. **Route Protection**: All protected routes should use the `AuthGuard`.

## Error Handling

### 401 Unauthorized
- Attempts automatic token refresh
- If refresh fails, logs out user and redirects to login

### 403 Forbidden
- Indicates insufficient permissions
- Logs out user and redirects to login

### Invalid Token Structure
- Token is removed from storage
- User is redirected to login

### Expired Token
- Removed from storage
- User is redirected to login
- Automatic refresh attempted if triggered by interceptor

## Configuration

### Backend Endpoints
Update the API URL in `AuthService`:
```typescript
private apiUrl = '/api/Auth';
```

Ensure backend provides:
- `POST /api/Auth/login` - Returns `{ token: 'JWT_TOKEN' }`
- `POST /api/Auth/refresh` - Returns `{ token: 'NEW_JWT_TOKEN' }`

### Token Expiration Warning
Tokens are considered expired when:
- Time remaining < 1 minute (60000 ms)
- AuthGuard warns when < 5 minutes (300000 ms)

Modify in `JwtUtilService.isTokenExpired()`:
```typescript
return currentTime >= expirationTime - 60000; // 1 minute buffer
```

## Testing

### Mock Token for Testing
```typescript
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.' +
  'signature';

localStorage.setItem('authToken', mockToken);
```

### Test Token Expiration
```typescript
// Create token with near-future expiration
const expiredToken = generateTokenWithExpiration(Date.now() + 30000); // 30 seconds
localStorage.setItem('authToken', expiredToken);

// Test guard behavior
this.router.navigate(['/contacts']);
// Should redirect to login if expired
```

## Debugging

Enable debug logs by checking browser console:
- Token validation messages
- Token expiration warnings
- Refresh attempt logs
- Redirect events

## Upgrading to Production

### Recommendations
1. Replace `localStorage` with httpOnly cookies
2. Implement proper token refresh timing
3. Add token revocation on logout
4. Implement CSRF protection
5. Add rate limiting on login/refresh endpoints
6. Implement audit logging for authentication events

## Troubleshooting

### Token Not Persisting
- Check if localStorage is enabled in browser
- Verify backend is returning token in response
- Check browser DevTools → Application → localStorage

### Constant Redirects to Login
- Token might be expired - check expiration time
- Token structure might be invalid - verify JWT format
- AuthGuard might be blocking access - check console logs

### 401 Errors on API Calls
- Verify token is being sent in Authorization header
- Check if token is expired
- Verify backend is validating token correctly

### Token Refresh Not Working
- Ensure backend provides refresh endpoint
- Check endpoint returns new token in response
- Verify refresh token is being sent correctly
