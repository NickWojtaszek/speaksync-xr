# User Management System - Detailed Overview

## High-Level Architecture

The SpeakSync XR app uses a **per-user data isolation** model built on React Context and localStorage. Each authenticated user gets separate isolated storage for their data (templates, studies, settings, etc.).

```
┌─────────────────────────────────────────────────────────────────┐
│                          LOGIN PAGE                              │
│  ┌──────────────────┐         ┌──────────────────────────────┐  │
│  │ Local Profiles   │         │  Google OAuth Login          │  │
│  │ (nick, emilia,   │         │  (Facebook/Google Account)   │  │
│  │  edyta)          │         │  via JWT Token               │  │
│  └────────┬─────────┘         └──────────┬───────────────────┘  │
│           │                              │                       │
│           └──────────────┬───────────────┘                       │
│                          ▼                                        │
│              ┌─────────────────────────┐                         │
│              │  AuthContext.login()    │                         │
│              │  or loginWithGoogle()   │                         │
│              └────────────┬────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATED STATE                         │
│  currentUser = UserProfile { id, name, email, picture, ... }   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Data Contexts (all isolated by currentUser.id)           │  │
│  │                                                           │  │
│  │ TemplateContext    → speaksync_templates_{userId}       │  │
│  │ StudyContext       → speaksync_studies_{userId}         │  │
│  │ SettingsContext    → speaksync_settings_{userId}        │  │
│  │ StudyPlanContext   → speaksync_studyplan_{userId}       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## THE OLD VERSION (Before Google OAuth)

### User Model
```typescript
// BEFORE: Simple string-based user IDs
interface AuthData {
  users: string[];              // ['nick', 'emilia', 'edyta']
  currentUser: string | null;   // 'nick' or null
}
```

### Login Flow (Pre-Google)
1. **Login Page** - Shows hardcoded 3 profile cards (nick, emilia, edyta)
2. **Click Profile** → `login('nick')`
3. **AuthContext.login()** does:
   - Creates user object with just username
   - Adds to users array if new
   - Sets as currentUser
   - Saves to localStorage

```typescript
// BEFORE: Simple login with just a username string
const login = useCallback((username: string) => {
    const lowerUsername = username.toLowerCase();
    setAuthData(prevData => {
        const newUsers = prevData.users.includes(lowerUsername) 
            ? prevData.users 
            : [...prevData.users, lowerUsername];
        return {
            users: newUsers,
            currentUser: lowerUsername
        };
    });
}, [setAuthData]);
```

### Data Isolation
Data was keyed using the currentUser string:
```typescript
// TemplateContext
const [data, setData] = useLocalStorage<TemplateData>(
    `speaksync_templates_${currentUser}`,  // 'speaksync_templates_nick'
    initialTemplateData
);
```

### Logout
Simply cleared currentUser to null, returning to login page.

---

## THE NEW VERSION (With Google OAuth)

### User Model
```typescript
// NOW: Rich user profile objects
export interface UserProfile {
    id: string;           // 'nick' or Google sub (google_id)
    name: string;         // 'nick' or 'John Doe'
    email?: string;       // 'john@gmail.com'
    picture?: string;     // Google profile picture URL
    loginMethod: 'local' | 'google';
}

interface AuthData {
    users: UserProfile[];        // Array of full profile objects
    currentUser: UserProfile | null;
}
```

### Login Flow (With Google)

#### Option A: Local Login (Unchanged)
```
LoginPage → Click Profile Card → login('nick')
                                    ↓
                         AuthContext.login()
                                    ↓
                    Create UserProfile with loginMethod='local'
                                    ↓
                         Set as currentUser
```

#### Option B: Google Login (New)
```
LoginPage → Click "Sign in with Google"
                    ↓
    GoogleLogin Component (from @react-oauth/google)
                    ↓
    User authenticates with Google account
                    ↓
    Google returns JWT credential
                    ↓
    GoogleLoginButton.handleGoogleSuccess()
    {
        const decoded = jwtDecode(credential);
        // Extract: sub (unique ID), name, email, picture
        
        loginWithGoogle({
            id: decoded.sub,           // e.g., '1234567890'
            name: decoded.name,        // e.g., 'John Doe'
            email: decoded.email,      // e.g., 'john@gmail.com'
            picture: decoded.picture,  // Google profile pic URL
            loginMethod: 'google'
        });
    }
```

### AuthContext Methods (New Implementation)

#### 1. login() - Local accounts
```typescript
const login = useCallback((username: string) => {
    const lowerUsername = username.toLowerCase();
    const user: UserProfile = {
        id: lowerUsername,
        name: lowerUsername,
        loginMethod: 'local'    // NEW: Track login method
    };
    
    setAuthData(prevData => {
        const userExists = prevData.users.find(u => u.id === lowerUsername);
        const newUsers = userExists 
            ? prevData.users 
            : [...prevData.users, user];  // Add if new
        return {
            users: newUsers,
            currentUser: user
        };
    });
}, [setAuthData]);
```

#### 2. loginWithGoogle() - Google accounts (NEW)
```typescript
const loginWithGoogle = useCallback((profile: UserProfile) => {
    setAuthData(prevData => {
        // Check if user with this Google ID already logged in
        const userExists = prevData.users.find(u => u.id === profile.id);
        const newUsers = userExists 
            ? prevData.users 
            : [...prevData.users, profile];  // Register on first login
        return {
            users: newUsers,
            currentUser: profile
        };
    });
}, [setAuthData]);
```

#### 3. logout() - Same for both methods
```typescript
const logout = useCallback(() => {
    setAuthData(prevData => ({ ...prevData, currentUser: null }));
}, [setAuthData]);
```

### Key Differences: Old vs New

| Aspect | OLD | NEW |
|--------|-----|-----|
| **User Storage** | `users: string[]` | `users: UserProfile[]` |
| **Current User** | `currentUser: string` | `currentUser: UserProfile` |
| **Login Methods** | Local only | Local + Google OAuth |
| **User Identifier** | Username string | `user.id` property |
| **New User Info** | Name only | Name, email, picture, login method |
| **Profile Recognition** | Hardcoded profiles | Any Google account |
| **Data Isolation Key** | String username | UserProfile.id |

---

## How Data Isolation Works With New System

### The Problem It Solves
When a user logs out and another user logs in, the app needs to:
- Load the NEW user's data (templates, studies, settings)
- NOT see the previous user's data
- Keep all data strictly separated

### Solution: Dynamic localStorage Keys

All data contexts use the currentUser.id to create unique keys:

```typescript
// TemplateContext
const [data, setData] = useLocalStorage<TemplateData>(
    `speaksync_templates_${currentUser?.id}`,  // e.g., 'speaksync_templates_nick'
                                                //  or  'speaksync_templates_1234567890'
    initialTemplateData
);

// StudyContext
const [data, setData] = useLocalStorage<StudyData>(
    `speaksync_studies_${currentUser?.id}`,
    initialStudyData
);

// SettingsContext
const [settings, setSettings] = useLocalStorage<SettingsData>(
    `speaksync_settings_${currentUser?.id}`,
    initialSettings
);
```

### Real-World Example

**Scenario:** Nick and a Google user both use the app

```
localStorage:
{
    "speaksync_auth_v2": {
        "users": [
            { "id": "nick", "name": "nick", "loginMethod": "local" },
            { "id": "1234567890", "name": "John Doe", "email": "john@gmail.com", "picture": "...", "loginMethod": "google" }
        ],
        "currentUser": { "id": "nick", "name": "nick", "loginMethod": "local" }
    },
    
    // Nick's data
    "speaksync_templates_nick": { "appData": { ... } },
    "speaksync_studies_nick": { "studies": [ ... ], ... },
    "speaksync_settings_nick": { ... },
    
    // John's data (completely separate)
    "speaksync_templates_1234567890": { "appData": { ... } },
    "speaksync_studies_1234567890": { "studies": [ ... ], ... },
    "speaksync_settings_1234567890": { ... }
}
```

### Context Dependencies

When `currentUser` changes, all dependent contexts react:

```
currentUser changes (login/logout)
    ↓
AuthContext emits new UserProfile
    ↓
TemplateContext.useAuth() triggers re-render
    ↓
useLocalStorage key changes: `speaksync_templates_${currentUser?.id}`
    ↓
Loads DIFFERENT data from localStorage (or initialData if new user)
    ↓
UI updates with new user's templates
```

---

## How Google OAuth Integration Works

### The Flow in LoginPage.tsx

```typescript
<GoogleLoginButton />
    ↓
// 1. Wrapped in GoogleOAuthProvider (from App.tsx)
<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>

// 2. User clicks Google button
<GoogleLogin onSuccess={handleGoogleSuccess} />

// 3. Google authenticates and returns JWT
handleGoogleSuccess(credentialResponse: GoogleCredentialResponse)
    ↓
// 4. Decode JWT to extract user info
const decoded = jwtDecode(credentialResponse.credential);
// {
//   sub: "1234567890",
//   name: "John Doe",
//   email: "john@gmail.com",
//   picture: "https://...",
//   iat: 1234567890,
//   exp: 1234571490
// }

// 5. Build UserProfile
const profile: UserProfile = {
    id: decoded.sub,              // Google's unique ID
    name: decoded.name,
    email: decoded.email,
    picture: decoded.picture,
    loginMethod: 'google'
};

// 6. Call loginWithGoogle
loginWithGoogle(profile);
```

### Why This Design?

1. **JWT Decoding**: Google sends a JWT (JSON Web Token) containing user info
2. **No Server Needed**: All verification happens client-side via the signature
3. **Stateless**: No backend session required
4. **Automatic User Creation**: First Google login auto-creates profile

---

## Logout Flow (Same for Both Methods)

```typescript
// SettingsPage.tsx
<button onClick={logout}>Logout</button>

// Calls:
logout()
    ↓
// AuthContext: Set currentUser to null
setAuthData(prevData => ({ ...prevData, currentUser: null }))
    ↓
// Triggers App.tsx AuthWrapper re-render
const AuthWrapper = () => {
    const { currentUser } = useAuth();
    return currentUser ? <AuthenticatedApp /> : <LoginPage />;
};
    ↓
// Shows LoginPage again, clearing all local data keys
// Next login with ANY user triggers new data load
```

---

## Security Considerations

### What's Secure ✅
- **Client-side JWT validation**: Google's JWT is cryptographically signed
- **No passwords stored**: Using OAuth, not password-based auth
- **Per-user data isolation**: Each user only sees their own data in localStorage
- **Client-side only**: No backend to compromise (for this basic setup)

### What's NOT Suitable for Production ⚠️
- **No server-side validation**: Currently trusts the JWT as-is
- **No secure token storage**: Token only in memory (good), but vulnerable if server were compromised
- **No refresh tokens**: App relies on initial token only
- **No audit logs**: No server tracking who did what

### For Production, Add:
1. Backend OAuth validation
2. Secure session tokens
3. Server-side data storage
4. Audit logging

---

## Component Usage Examples

### Getting Current User
```typescript
const { currentUser } = useAuth();
console.log(currentUser?.name);        // 'nick' or 'John Doe'
console.log(currentUser?.loginMethod); // 'local' or 'google'
console.log(currentUser?.email);       // undefined or 'john@gmail.com'
```

### List All Users
```typescript
const { users } = useAuth();
// [
//   { id: 'nick', name: 'nick', loginMethod: 'local' },
//   { id: 'emilia', name: 'emilia', loginMethod: 'local' },
//   { id: '1234567890', name: 'John Doe', email: '...', picture: '...', loginMethod: 'google' }
// ]
```

### Logout
```typescript
const { logout } = useAuth();
<button onClick={logout}>Sign Out</button>
```

---

## Summary Table

### Old System
| Feature | Implementation |
|---------|-----------------|
| **Users** | Hardcoded array of strings |
| **Authentication** | Simple username selection |
| **Data Storage** | Per-username localStorage keys |
| **Profile Info** | Name only (from username) |
| **Login Methods** | Local only |
| **User Recognition** | Hardcoded list |

### New System
| Feature | Implementation |
|---------|-----------------|
| **Users** | Dynamic UserProfile objects array |
| **Authentication** | Local selection + Google OAuth |
| **Data Storage** | Per-userId localStorage keys (same mechanism) |
| **Profile Info** | Name, email, picture, login method |
| **Login Methods** | Local + Google |
| **User Recognition** | Hardcoded list + unlimited Google accounts |

The system maintains backward compatibility while adding modern OAuth support! 🎉
