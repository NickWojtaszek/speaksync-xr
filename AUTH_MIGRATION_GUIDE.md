# Authentication Migration Guide

## 🎯 Overview

The application now has an **authentication abstraction layer** that makes it easy to switch from local development auth to a secure backend authentication system.

---

## 📁 Architecture

### Current Structure

```
services/auth/
├── AuthService.ts          # Interface definition
├── LocalAuthService.ts     # Development implementation (current)
├── BackendAuthService.ts   # Production template (ready to implement)
└── index.ts                # Service configuration (switch here!)
```

### How It Works

1. **AuthService Interface** - Defines the contract all auth implementations must follow
2. **LocalAuthService** - Current implementation using localStorage (no passwords)
3. **BackendAuthService** - Template for production backend authentication
4. **authService instance** - Singleton used throughout the app

---

## 🔄 Switching Between Implementations

### Current (Development):
**File**: `services/auth/index.ts`
```typescript
export const authService = new LocalAuthService();
```

### For Production:
**File**: `services/auth/index.ts`
```typescript
// export const authService = new LocalAuthService();  // Comment this out
export const authService = new BackendAuthService();   // Uncomment this
```

**That's it!** One line change switches the entire auth system.

---

## 🚀 Backend Migration Checklist

### Step 1: Backend API Setup

Implement these endpoints on your backend:

#### Required Endpoints:

**1. POST `/api/auth/login`**
```json
Request:
{
  "username": "string",
  "password": "string"
}

Response:
{
  "user": {
    "id": "string",
    "name": "string",
    "role": "radiologist" | "verifier" | "accounting" | "teaching"
  },
  "token": "JWT_TOKEN_HERE",
  "refreshToken": "REFRESH_TOKEN_HERE" // Optional
}
```

**2. POST `/api/auth/logout`**
```json
Headers:
{
  "Authorization": "Bearer JWT_TOKEN"
}

Response:
{
  "success": true
}
```

**3. GET `/api/auth/me`**
```json
Headers:
{
  "Authorization": "Bearer JWT_TOKEN"
}

Response:
{
  "user": {
    "id": "string",
    "name": "string",
    "role": "string"
  }
}
```

**4. GET `/api/users`**
```json
Headers:
{
  "Authorization": "Bearer JWT_TOKEN"
}

Response:
{
  "users": [
    { "id": "string", "name": "string", "role": "string" },
    ...
  ]
}
```

**5. POST `/api/auth/refresh`** (Optional but recommended)
```json
Request:
{
  "refreshToken": "REFRESH_TOKEN"
}

Response:
{
  "token": "NEW_JWT_TOKEN",
  "refreshToken": "NEW_REFRESH_TOKEN",
  "user": { ... }
}
```

**6. POST `/api/auth/validate`**
```json
Headers:
{
  "Authorization": "Bearer JWT_TOKEN"
}

Response:
{
  "valid": true | false
}
```

### Step 2: Environment Configuration

Create `.env` file:
```bash
VITE_API_URL=https://your-backend-api.com/api
```

### Step 3: CORS Configuration

Your backend must allow requests from your frontend:

**Example (Node.js/Express)**:
```javascript
const cors = require('cors');

app.use(cors({
  origin: 'https://your-frontend-domain.com',
  credentials: true
}));
```

### Step 4: Token Security

**Recommended**: Use httpOnly cookies instead of localStorage for tokens:

```typescript
// In BackendAuthService.ts, modify saveTokens():
private saveTokens(token: string, refreshToken?: string): void {
  // Option 1: httpOnly cookies (most secure)
  // Backend sets cookies in response headers
  // No client-side storage needed

  // Option 2: Encrypted localStorage (less secure than cookies)
  // Implement encryption before storing
}
```

### Step 5: Switch Implementation

1. Update `services/auth/index.ts` (see above)
2. Test thoroughly
3. Deploy

---

## 🔐 Security Considerations

### Current (LocalAuthService)
- ❌ No real authentication
- ❌ No passwords
- ❌ Anyone can log in as anyone
- ✅ **Perfect for development**
- ❌ **Never use in production**

### Production (BackendAuthService)
- ✅ Real password authentication
- ✅ JWT-based sessions
- ✅ Token refresh
- ✅ Session validation
- ✅ Secure token storage
- ✅ **Production-ready**

---

## 📊 Data Storage Comparison

| Feature | Local (Dev) | Backend (Prod) |
|---------|------------|----------------|
| User data | localStorage | Database |
| Passwords | None | Hashed (bcrypt) |
| Sessions | Browser only | Server-managed |
| Tokens | None | JWT |
| Security | Low | High |
| Multi-device | No | Yes |

---

## 🧪 Testing Backend Auth

### Test Locally

1. Run your backend server locally
2. Set `VITE_API_URL=http://localhost:3001/api`
3. Switch to BackendAuthService
4. Test all flows:
   - ✅ Login
   - ✅ Logout
   - ✅ Session persistence
   - ✅ Token refresh
   - ✅ Invalid credentials
   - ✅ Expired tokens

### Test in Production

1. Deploy backend first
2. Update `VITE_API_URL` to production backend
3. Test with real accounts
4. Monitor error logs

---

## 🐛 Troubleshooting

### "Network request failed"
- Check `VITE_API_URL` is correct
- Verify backend is running
- Check CORS configuration
- Check network tab in DevTools

### "Session expired"
- Implement token refresh
- Check token expiration times
- Verify refresh token logic

### "Unauthorized"
- Check token is being sent in headers
- Verify token format (Bearer {token})
- Check backend token validation

---

## 🔄 Rollback Plan

If backend auth has issues, you can instantly roll back:

**File**: `services/auth/index.ts`
```typescript
export const authService = new LocalAuthService();  // Uncomment
// export const authService = new BackendAuthService();  // Comment out
```

Redeploy and you're back to local auth.

---

## 📝 Code Examples

### Backend Example (Node.js + Express + JWT)

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

// Mock database
const users = [
  { id: 'nick', name: 'Nick', role: 'radiologist', passwordHash: '...' }
];

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.id === username.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    user: { id: user.id, name: user.name, role: user.role },
    token
  });
});

// Protected endpoint middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  res.json({ user: { id: user.id, name: user.name, role: user.role } });
});
```

---

## ✅ Migration Complete Checklist

- [ ] Backend API endpoints implemented
- [ ] CORS configured
- [ ] JWT tokens working
- [ ] Token refresh implemented
- [ ] Session validation working
- [ ] Error handling added
- [ ] Environment variables set
- [ ] Switch to BackendAuthService
- [ ] Test all auth flows
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Document rollback procedure

---

**Ready to migrate?** The abstraction layer makes it painless. All component code stays the same!
