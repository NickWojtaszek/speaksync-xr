# P0 Security Issues Requiring Backend/Architecture Decisions

This document outlines critical security issues that **cannot be resolved client-side** and require architectural decisions or backend implementation.

---

## ✅ Completed P0 Security Fixes

The following P0 issues have been successfully resolved:

1. **✅ XSS Vulnerability** - Implemented DOMPurify sanitization in `utils/domUtils.ts`
2. **✅ Input Validation** - Added react-hook-form + Zod validation to PersonalInfoForm
3. **✅ Error Boundaries** - Implemented at app and route levels
4. **✅ Type Safety** - Added User/UserRole types to replace `any`
5. **✅ Code Duplication** - Extracted transformation utilities
6. **✅ Destructive Actions** - Replaced browser dialogs with proper modals

---

## 🚨 CRITICAL: Remaining P0 Issues Requiring Backend

### 1. API Key Exposed in Client Bundle (P0 - CRITICAL)

**Status**: ❌ UNRESOLVED
**Location**: `services/geminiService.ts:8`, `vite.config.ts:14-15`
**Severity**: CRITICAL - Cost & Security Risk

#### Current Implementation
```typescript
// services/geminiService.ts
const API_KEY = process.env.API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
```

The API key is embedded in the client bundle via environment variables and **can be extracted** from the production JavaScript bundle.

#### Security Risk
- **Anyone can extract the API key** from the bundled JavaScript
- **API quota theft** - Malicious actors can use your key for their own requests
- **Cost exposure** - You will be billed for all API calls made with your key
- **Rate limiting bypass** - No control over request volume

#### Solution Options

**Option A: Backend Proxy (RECOMMENDED)**
Create a backend API that proxies AI requests:

```typescript
// Backend (Node.js/Express example)
app.post('/api/enhance-report', async (req, res) => {
  const { text, config } = req.body;

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });

  // Authentication check
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Server-side API call
  const result = await geminiAPI.enhance(text, config, process.env.GEMINI_API_KEY);
  res.json(result);
});

// Frontend (update services/geminiService.ts)
export const enhanceReport = async (text: string, config: AIPromptConfig) => {
  const response = await fetch('/api/enhance-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, config }),
    credentials: 'include' // for session cookies
  });
  return response.json();
};
```

**Effort**: 1-2 days (backend setup + frontend integration)
**Benefits**:
- ✅ API key completely hidden
- ✅ Rate limiting control
- ✅ User authentication required
- ✅ Usage tracking and analytics
- ✅ Cost control

**Option B: Serverless Function (Vercel/Netlify/AWS Lambda)**
```typescript
// api/enhance-report.ts (Vercel Serverless Function)
export default async function handler(req, res) {
  // API key stored in environment variables on server
  const result = await geminiAPI.enhance(req.body.text, process.env.GEMINI_API_KEY);
  res.json(result);
}
```

**Effort**: 4-8 hours
**Benefits**: Similar to Option A, but easier deployment

**Option C: Document as "Demo Only" + Remove API Key**
- Remove API key from codebase
- Document that AI features require user to provide their own API key
- Add settings UI for users to input their own Gemini API key
- Store key in localStorage (encrypted)

**Effort**: 2-3 hours
**Drawbacks**: Users need their own Google AI API account

---

### 2. Unencrypted PII in localStorage (P0 - CRITICAL)

**Status**: ❌ UNRESOLVED
**Location**: All `useLocalStorage` hooks storing PersonalInfo
**Severity**: CRITICAL - HIPAA/GDPR Violation Risk

#### Current Implementation
Sensitive medical data stored in **plaintext** in localStorage:
- PESEL (Polish National ID - equivalent to SSN)
- Bank account numbers (IBAN)
- Patient study numbers
- Email addresses
- Phone numbers
- Medical diagnoses and findings

```typescript
// Current storage (INSECURE)
localStorage.setItem('speaksync_studies_user123', JSON.stringify({
  personalInfo: {
    pesel: '12345678901',
    bankAccount: 'PL12345678901234567890123456',
    email: 'doctor@example.com'
  },
  studies: [...] // Patient data
}));
```

#### Security Risk
- **Anyone with physical access** to the device can read localStorage
- **Malicious browser extensions** can access all localStorage data
- **XSS attacks** (if any exist) can exfiltrate all data
- **GDPR/HIPAA compliance failure** - PII must be protected
- **Browser sync** might upload data to cloud services

#### Solution Options

**Option A: Web Crypto API Encryption (Client-Side)**
```typescript
// utils/encryption.ts
import { createKey, encrypt, decrypt } from './webCrypto';

class SecureStorage {
  private static key: CryptoKey;

  static async init(userPassword: string) {
    // Derive encryption key from user password
    this.key = await createKey(userPassword);
  }

  static async setItem(key: string, value: any) {
    const encrypted = await encrypt(JSON.stringify(value), this.key);
    localStorage.setItem(key, encrypted);
  }

  static async getItem(key: string) {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    const decrypted = await decrypt(encrypted, this.key);
    return JSON.parse(decrypted);
  }
}

// Usage
await SecureStorage.init(userPassword);
await SecureStorage.setItem('userData', personalInfo);
```

**Effort**: 3-5 days
**Requirements**:
- User must enter a password/PIN on login
- Password is NEVER stored (only used to derive encryption key)
- Data becomes unreadable without password
- Implement password recovery mechanism

**Drawbacks**:
- Requires user authentication workflow
- Forgot password = data loss (unless backup recovery)
- More complex UX

**Option B: Backend Database with Encryption at Rest (RECOMMENDED)**
Move sensitive data to a backend database with proper encryption:

```typescript
// Backend stores encrypted PII
// Frontend only stores non-sensitive references
localStorage.setItem('userId', '123'); // ID only, no PII

// API calls for sensitive operations
const personalInfo = await api.getPersonalInfo(userId);
```

**Effort**: 1-2 weeks (full backend implementation)
**Benefits**:
- ✅ Professional-grade encryption
- ✅ Audit trails
- ✅ GDPR/HIPAA compliance
- ✅ Backup and recovery
- ✅ Multi-device sync

**Option C: Document as "Local-Only Development Tool"**
Accept the risk and document:
```markdown
⚠️ **SECURITY NOTICE**: This application is designed for LOCAL DEVELOPMENT ONLY.
- Do NOT use on shared computers
- Do NOT enter real patient data
- Do NOT use for production medical records
- All data is stored in browser localStorage without encryption
```

**Effort**: 1 hour (documentation only)
**Acceptable for**: Development, demos, personal testing
**Not acceptable for**: Production, real patient data, HIPAA environments

---

### 3. Client-Side Only Authentication (P0)

**Status**: ❌ UNRESOLVED
**Location**: `context/AuthContext.tsx`, `pages/MainPage.tsx:42-44`
**Severity**: HIGH - Authorization Bypass

#### Current Implementation
```typescript
// AuthContext.tsx - stored in localStorage
const users = [
  { id: '1', name: 'Dr. Smith', role: 'radiologist' },
  { id: '2', name: 'John Verifier', role: 'verifier' },
  { id: '3', name: 'Accounting', role: 'accounting' }
];

// Anyone can open DevTools and run:
localStorage.setItem('speaksync_current_user', JSON.stringify({
  id: '3',
  role: 'accounting' // Escalate to any role!
}));
```

#### Security Risk
- **Role escalation**: Any user can grant themselves admin/accounting privileges
- **Data access**: Verifiers can view accounting data, radiologists can approve their own reports
- **No audit trail**: No record of who accessed what
- **Session hijacking**: No session timeout or invalidation

#### Solution Options

**Option A: Proper Backend Authentication (RECOMMENDED)**
```typescript
// Backend with JWT tokens
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.users.findByEmail(email);

  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, user });
});

// Middleware to verify role
const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

app.get('/api/accounting/reports', requireRole('accounting'), async (req, res) => {
  // Only accessible by accounting role
});
```

**Effort**: 3-5 days
**Benefits**:
- ✅ Secure authentication
- ✅ Role-based access control
- ✅ Session management
- ✅ Audit trails

**Option B: Document as "Trust-Based Local Tool"**
Accept the limitation and document:
```markdown
⚠️ **AUTHENTICATION NOTICE**: This is a LOCAL-ONLY application with trust-based user switching.
- Designed for single-user or small trusted team environments
- No password protection
- Users can switch roles freely
- NOT suitable for multi-tenant or untrusted environments
- All users share the same local database
```

**Effort**: 30 minutes (documentation)
**Acceptable for**:
- Single practitioner use
- Small trusted teams on shared workstation
- Educational/demo purposes

**Not acceptable for**:
- Multi-hospital deployments
- Compliance-regulated environments
- Any scenario with user distrust

---

## 📋 Decision Matrix

| Issue | Risk Level | Backend Required? | Client-Only Option | Recommended Action |
|-------|-----------|-------------------|-------------------|-------------------|
| API Key Exposure | CRITICAL | Yes | Limited (user-provided keys) | **Backend proxy** |
| Unencrypted PII | CRITICAL | No* | Web Crypto API | **Backend DB** or **Document limitations** |
| Client-Side Auth | HIGH | Yes | None | **Backend auth** or **Document limitations** |

*Can be mitigated client-side but backend is better

---

## 🎯 Recommended Implementation Plan

### Short-term (If staying client-only)
1. **Document limitations clearly** in README and login screen
2. **Add warning banners** when entering sensitive data
3. **Implement Web Crypto API** for PII encryption (3-5 days)
4. **Add API key input** in settings for users to provide their own

### Long-term (Production-ready)
1. **Week 1**: Set up backend (Node.js/Express or serverless)
2. **Week 2**: Implement authentication + database
3. **Week 3**: Move API calls to backend proxy
4. **Week 4**: Migrate data storage to backend
5. **Week 5**: Testing and security audit

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Crypto API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [GDPR Compliance Checklist](https://gdpr.eu/checklist/)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)

---

**Last Updated**: 2025-12-29
**Status**: Awaiting architectural decision on client-only vs. backend implementation
