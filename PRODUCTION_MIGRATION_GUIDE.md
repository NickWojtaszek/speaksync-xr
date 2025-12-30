# Production Migration Guide

## 🎯 Overview

This guide provides a complete roadmap for migrating the SpeakSync XR application from development (local-only) to production-ready with backend services, encryption, and compliance.

---

## 📊 Current State vs Production Ready

| Component | Development (Current) | Production (Target) |
|-----------|----------------------|---------------------|
| **Authentication** | localStorage, no passwords | Backend JWT, secure sessions |
| **Data Storage** | localStorage, plain text | Encrypted database |
| **AI Providers** | Client-side API calls | Backend proxy (OpenAI/Anthropic) or direct (Gemini) |
| **PII/PHI Protection** | None | AES-256 encryption at rest |
| **Compliance** | ❌ Not compliant | ✅ HIPAA/GDPR ready |
| **Security** | Development only | Production hardened |

---

## 🚀 Migration Path: 3 Phases

### Phase 1: Backend Setup (Week 1-2)
### Phase 2: Service Integration (Week 2-3)
### Phase 3: Data Migration & Launch (Week 3-4)

---

## 📋 Phase 1: Backend Setup

### 1.1 Choose Your Backend Stack

**Option A: Node.js + Express + PostgreSQL** (Recommended)
- ✅ JavaScript/TypeScript ecosystem
- ✅ Fast development
- ✅ Large community

**Option B: Python + FastAPI + PostgreSQL**
- ✅ Great for AI/ML integration
- ✅ Type hints
- ✅ Automatic API documentation

**Option C: .NET Core + SQL Server**
- ✅ Enterprise-grade
- ✅ Strong typing
- ✅ Azure integration

### 1.2 Set Up Infrastructure

```bash
# Example: Node.js + PostgreSQL
mkdir speaksync-backend
cd speaksync-backend
npm init -y
npm install express pg jsonwebtoken bcrypt cors dotenv
npm install --save-dev @types/node @types/express typescript
```

### 1.3 Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('radiologist', 'verifier', 'accounting', 'teaching')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Encrypted storage table
CREATE TABLE encrypted_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  encrypted_data BYTEA NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- Audit log table (for compliance)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  details JSONB
);

-- Sessions table (for token management)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  refresh_token_hash VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_encrypted_storage_user_key ON encrypted_storage(user_id, key);
CREATE INDEX idx_audit_log_user_timestamp ON audit_log(user_id, timestamp);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

### 1.4 Environment Configuration

```env
# .env
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/speaksync

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-change-this
REFRESH_TOKEN_EXPIRES_IN=7d

# Encryption (AWS KMS)
AWS_REGION=us-east-1
KMS_KEY_ID=arn:aws:kms:us-east-1:123456789:key/abc-123

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Optional: AI Proxy
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 1.5 Set Up Key Management

**AWS KMS Setup:**
```bash
# Install AWS CLI
aws configure

# Create encryption key
aws kms create-key \
  --description "SpeakSync XR data encryption key" \
  --key-usage ENCRYPT_DECRYPT \
  --origin AWS_KMS

# Create alias
aws kms create-alias \
  --alias-name alias/speaksync-data \
  --target-key-id <key-id-from-above>
```

---

## 📋 Phase 2: Service Integration

### 2.1 Implement Authentication Endpoints

See `AUTH_MIGRATION_GUIDE.md` for complete details.

**Required endpoints:**
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/refresh`
- `POST /api/auth/validate`
- `GET /api/users`

### 2.2 Implement Storage Endpoints

See `DATA_ENCRYPTION_GUIDE.md` for complete details.

**Required endpoints:**
- `POST /api/storage/set`
- `GET /api/storage/get`
- `DELETE /api/storage/delete`
- `POST /api/storage/clear`
- `GET /api/storage/keys`

### 2.3 Optional: AI Proxy Endpoints

For OpenAI and Anthropic (to avoid CORS):

```javascript
// server.js
app.post('/api/ai/enhance', authenticate, async (req, res) => {
  const { text, provider, config } = req.body;
  const apiKey = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;

  // Proxy request to AI provider
  const response = await fetch(providerEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(config)
  });

  const data = await response.json();
  res.json(data);
});
```

### 2.4 Deploy Backend

**Option A: Heroku**
```bash
heroku create speaksync-backend
heroku addons:create heroku-postgresql:standard-0
git push heroku main
```

**Option B: AWS (Recommended for HIPAA)**
```bash
# Use AWS Elastic Beanstalk or ECS
# Configure VPC, security groups
# Enable CloudTrail for audit logs
# Set up RDS for PostgreSQL
# Configure ALB with SSL/TLS
```

**Option C: Azure**
```bash
# Use Azure App Service
# Configure Azure Key Vault
# Set up Azure Database for PostgreSQL
# Enable Azure Monitor
```

---

## 📋 Phase 3: Frontend Migration

### 3.1 Update Environment Variables

```env
# .env.production
VITE_API_URL=https://api.speaksync.com/api
VITE_ENV=production
```

### 3.2 Switch to Backend Services

**Auth Service:**
```typescript
// services/auth/index.ts
// Comment out LocalAuthService
// export const authService = new LocalAuthService();

// Uncomment BackendAuthService
export const authService = new BackendAuthService();
```

**Storage Service:**
```typescript
// services/storage/index.ts
// Comment out LocalStorageService
// export const storageService = new LocalStorageService();

// Uncomment BackendEncryptedStorage
export const storageService = new BackendEncryptedStorage();
```

### 3.3 Data Migration

**Step 1: Export existing data**
```typescript
// Create migration script: scripts/export-data.ts
import { LocalStorageService } from '../services/storage/LocalStorageService';

async function exportData() {
  const storage = new LocalStorageService();
  const keys = await storage.getAllKeys();

  const data: Record<string, any> = {};
  for (const key of keys) {
    data[key] = await storage.getItem(key);
  }

  console.log(JSON.stringify(data, null, 2));
}

exportData();
```

**Step 2: Import to backend**
```typescript
// scripts/import-data.ts
import { BackendEncryptedStorage } from '../services/storage/EncryptedStorageService';

async function importData(exportedData: Record<string, any>, authToken: string) {
  const storage = new BackendEncryptedStorage();
  storage.setAuthToken(authToken);

  for (const [key, value] of Object.entries(exportedData)) {
    await storage.setItem(key, value);
    console.log(`Imported: ${key}`);
  }

  console.log('Migration complete!');
}

// Usage:
// const data = require('./exported-data.json');
// importData(data, 'user-auth-token');
```

### 3.4 Testing

**Pre-deployment checklist:**
- [ ] All API endpoints working
- [ ] Authentication flow works (login/logout)
- [ ] Data encryption verified
- [ ] Audit logs recording actions
- [ ] Performance acceptable (<200ms response times)
- [ ] Error handling works
- [ ] CORS configured correctly
- [ ] SSL/TLS certificates installed
- [ ] Rate limiting configured
- [ ] Monitoring/alerting set up

### 3.5 Deployment

**Build for production:**
```bash
npm run build
```

**Deploy frontend:**

**Option A: Netlify**
```bash
# Connect to GitHub repo
# Configure build settings:
# Build command: npm run build
# Publish directory: dist
# Environment variables: VITE_API_URL
```

**Option B: Vercel**
```bash
vercel --prod
```

**Option C: AWS S3 + CloudFront**
```bash
aws s3 sync dist/ s3://speaksync-frontend
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

---

## 🔒 Security Hardening

### 4.1 Enable Security Headers

```javascript
// server.js
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 4.2 Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 4.3 Input Validation

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/auth/login',
  body('username').isAlphanumeric().trim().escape(),
  body('password').isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... login logic
  }
);
```

---

## 📊 Monitoring & Observability

### 5.1 Application Monitoring

```javascript
// Use tools like:
// - DataDog
// - New Relic
// - Application Insights (Azure)
// - CloudWatch (AWS)

const logger = require('winston');

logger.log('info', 'User logged in', {
  userId: user.id,
  ip: req.ip,
  timestamp: new Date()
});
```

### 5.2 Health Checks

```javascript
app.get('/health', async (req, res) => {
  try {
    // Check database
    await db.query('SELECT 1');

    // Check KMS
    await kms.send(new DescribeKeyCommand({ KeyId: process.env.KMS_KEY_ID }));

    res.json({ status: 'healthy', timestamp: new Date() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});
```

---

## ✅ Compliance Checklist

### HIPAA Compliance
- [ ] Encryption at rest (AES-256)
- [ ] Encryption in transit (TLS 1.2+)
- [ ] Access controls (role-based)
- [ ] Audit logs (all data access)
- [ ] Business Associate Agreements signed
- [ ] Regular security assessments
- [ ] Incident response plan
- [ ] Data backup and recovery

### GDPR Compliance
- [ ] Data encryption
- [ ] User consent management
- [ ] Right to erasure (data deletion)
- [ ] Data portability (export)
- [ ] Privacy policy published
- [ ] Data breach notification (72 hours)
- [ ] Data Processing Agreements
- [ ] Privacy by design

---

## 🆘 Rollback Plan

If production deployment has critical issues:

1. **Frontend Rollback:**
```bash
# Revert to LocalAuthService and LocalStorageService
git revert HEAD
npm run build
# Redeploy
```

2. **Backend Rollback:**
```bash
# Revert to previous version
git revert HEAD
# Redeploy backend
```

3. **Data Recovery:**
```bash
# Restore from backup
pg_restore -d speaksync backup.dump
```

---

## 📞 Support & Resources

### Documentation
- `AUTH_MIGRATION_GUIDE.md` - Authentication details
- `DATA_ENCRYPTION_GUIDE.md` - Encryption details
- `AI_PROVIDER_CORS_GUIDE.md` - AI provider setup
- `SECURITY_P0_ISSUES.md` - Security considerations

### External Resources
- [HIPAA Compliance Guide](https://www.hhs.gov/hipaa/index.html)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [AWS KMS Documentation](https://docs.aws.amazon.com/kms/)
- [OAuth 2.0 Spec](https://oauth.net/2/)

---

## 🎯 Timeline

**Week 1:** Backend setup, database, authentication
**Week 2:** Storage encryption, API endpoints
**Week 3:** Frontend integration, testing
**Week 4:** Security audit, deployment, monitoring

**Total:** 4 weeks to production-ready system

---

**Ready to go to production?** Follow this guide step by step for a smooth migration!
