# Data Encryption & PII Protection Guide

## 🎯 Overview

The application now has a **storage abstraction layer** that prepares for encrypted data storage. This is critical for handling PII (Personally Identifiable Information) and PHI (Protected Health Information).

---

## ⚠️ Current Status: DEVELOPMENT ONLY

### What We Have Now
- ✅ Storage abstraction layer
- ✅ LocalStorageService (unencrypted)
- ✅ EncryptedStorageService templates (client & backend)
- ✅ Easy one-line switch between implementations

### What's NOT Production-Ready
- ❌ **NO encryption at rest** - Data stored in plain text
- ❌ **NOT HIPAA compliant** - Medical data unprotected
- ❌ **NOT GDPR compliant** - PII not encrypted
- ❌ **Vulnerable to theft** - Anyone with device access can read data

**For production with medical/PII data, you MUST implement encryption.**

---

## 📁 Architecture

### Storage Service Structure
```
services/storage/
├── StorageService.ts              # Interface definition
├── LocalStorageService.ts         # Development (no encryption)
├── EncryptedStorageService.ts     # Production templates
└── index.ts                       # Configuration switch
```

### How It Works
1. **StorageService Interface** - Contract all implementations follow
2. **LocalStorageService** - Current (plain text localStorage)
3. **ClientSideEncryptedStorage** - Web Crypto API encryption
4. **BackendEncryptedStorage** - Server-side encryption (recommended)

---

## 🔐 Encryption Options

### Option 1: Client-Side Encryption (Web Crypto API)

**Pros:**
- ✅ No backend changes needed
- ✅ Works offline
- ✅ Data encrypted at rest in browser

**Cons:**
- ⚠️ Key management is complex
- ⚠️ Keys stored in browser (less secure)
- ⚠️ Harder to audit/comply
- ⚠️ User must remember encryption password

**Use Case:**
- Small teams, non-critical data
- Development/testing encryption
- Offline-first applications

**Implementation:**
```typescript
// services/storage/index.ts
import { ClientSideEncryptedStorage } from './EncryptedStorageService';

export const storageService = new ClientSideEncryptedStorage();

// In App.tsx - initialize on login
useEffect(() => {
  if (userPassword) {
    storageService.initialize(userPassword).catch(error => {
      console.error('Failed to initialize encryption:', error);
    });
  }
}, [userPassword]);
```

---

### Option 2: Backend Encryption (RECOMMENDED)

**Pros:**
- ✅ Secure key management (vault/KMS)
- ✅ HIPAA/GDPR compliant
- ✅ Audit trails
- ✅ Key rotation possible
- ✅ Per-user encryption

**Cons:**
- ⚠️ Requires backend implementation
- ⚠️ Network dependency
- ⚠️ More complex setup

**Use Case:**
- Production with PII/PHI
- HIPAA/GDPR compliance required
- Enterprise deployments

**Implementation:**
```typescript
// services/storage/index.ts
import { BackendEncryptedStorage } from './EncryptedStorageService';

export const storageService = new BackendEncryptedStorage();

// In AuthContext.tsx - set token after login
useEffect(() => {
  if (authToken) {
    storageService.setAuthToken(authToken);
  }
}, [authToken]);
```

---

## 🚀 Backend Encryption Implementation

### Required Endpoints

#### 1. Store Encrypted Data
```http
POST /api/storage/set
Authorization: Bearer {token}
Content-Type: application/json

{
  "key": "patient_12345",
  "data": { ... }
}

Response:
{
  "success": true
}
```

#### 2. Retrieve Encrypted Data
```http
GET /api/storage/get?key=patient_12345
Authorization: Bearer {token}

Response:
{
  "data": { ... }
}
```

#### 3. Delete Data
```http
DELETE /api/storage/delete
Authorization: Bearer {token}
Content-Type: application/json

{
  "key": "patient_12345"
}

Response:
{
  "success": true
}
```

#### 4. Clear All User Data
```http
POST /api/storage/clear
Authorization: Bearer {token}

Response:
{
  "success": true
}
```

#### 5. List Keys
```http
GET /api/storage/keys
Authorization: Bearer {token}

Response:
{
  "keys": ["patient_12345", "study_67890", ...]
}
```

---

## 💾 Backend Implementation Example

### Node.js + PostgreSQL + AWS KMS

```javascript
const express = require('express');
const { KMSClient, EncryptCommand, DecryptCommand } = require('@aws-sdk/client-kms');
const { Pool } = require('pg');

const app = express();
const kms = new KMSClient({ region: 'us-east-1' });
const db = new Pool({ connectionString: process.env.DATABASE_URL });

// Middleware to authenticate user
const authenticate = async (req, res, next) => {
  // ... JWT validation
  req.userId = decodedToken.userId;
  next();
};

// Store encrypted data
app.post('/api/storage/set', authenticate, async (req, res) => {
  const { key, data } = req.body;
  const { userId } = req;

  try {
    // Serialize data
    const plaintext = JSON.stringify(data);

    // Encrypt using AWS KMS
    const encryptResponse = await kms.send(new EncryptCommand({
      KeyId: process.env.KMS_KEY_ID,
      Plaintext: Buffer.from(plaintext),
      EncryptionContext: {
        userId: userId,
        key: key
      }
    }));

    const ciphertext = encryptResponse.CiphertextBlob;

    // Store in database
    await db.query(
      `INSERT INTO encrypted_storage (user_id, key, encrypted_data, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, key)
       DO UPDATE SET encrypted_data = $3, updated_at = NOW()`,
      [userId, key, ciphertext]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_log (user_id, action, key, timestamp)
       VALUES ($1, 'STORE', $2, NOW())`,
      [userId, key]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Encryption failed:', error);
    res.status(500).json({ error: 'Encryption failed' });
  }
});

// Retrieve encrypted data
app.get('/api/storage/get', authenticate, async (req, res) => {
  const { key } = req.query;
  const { userId } = req;

  try {
    // Retrieve from database
    const result = await db.query(
      `SELECT encrypted_data FROM encrypted_storage
       WHERE user_id = $1 AND key = $2`,
      [userId, key]
    );

    if (result.rows.length === 0) {
      return res.json({ data: null });
    }

    const ciphertext = result.rows[0].encrypted_data;

    // Decrypt using AWS KMS
    const decryptResponse = await kms.send(new DecryptCommand({
      CiphertextBlob: ciphertext,
      EncryptionContext: {
        userId: userId,
        key: key
      }
    }));

    const plaintext = Buffer.from(decryptResponse.Plaintext).toString('utf8');
    const data = JSON.parse(plaintext);

    // Audit log
    await db.query(
      `INSERT INTO audit_log (user_id, action, key, timestamp)
       VALUES ($1, 'RETRIEVE', $2, NOW())`,
      [userId, key]
    );

    res.json({ data });
  } catch (error) {
    console.error('Decryption failed:', error);
    res.status(500).json({ error: 'Decryption failed' });
  }
});
```

---

## 🔑 Key Management Best Practices

### AWS KMS (Recommended)
```javascript
// Use AWS Key Management Service
// - Automatic key rotation
// - Per-user encryption contexts
// - Audit trails via CloudTrail
// - FIPS 140-2 Level 3 compliance

const kmsConfig = {
  keyId: process.env.KMS_KEY_ID,
  region: 'us-east-1',
  encryptionContext: {
    userId: user.id,
    application: 'speaksync-xr'
  }
};
```

### Azure Key Vault
```javascript
// Use Azure Key Vault
// - Managed keys
// - Access policies
// - Integration with Azure AD

const { DefaultAzureCredential } = require('@azure/identity');
const { CryptographyClient } = require('@azure/keyvault-keys');
```

### HashiCorp Vault
```javascript
// Use HashiCorp Vault
// - Dynamic secrets
// - Encryption as a service
// - Multi-cloud support

const vault = require('node-vault')({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN
});
```

---

## 📊 Compliance Requirements

### HIPAA (Health Insurance Portability and Accountability Act)

**Requirements:**
- ✅ Encryption at rest (AES-256)
- ✅ Encryption in transit (TLS 1.2+)
- ✅ Access controls and audit logs
- ✅ Regular security assessments
- ✅ Business Associate Agreements (BAA)

**Implementation:**
```typescript
// Use BackendEncryptedStorage
// Configure AWS KMS or equivalent
// Enable CloudTrail for audit logs
// Implement role-based access control
// Regular penetration testing
```

### GDPR (General Data Protection Regulation)

**Requirements:**
- ✅ Data encryption (Article 32)
- ✅ Right to erasure (Article 17)
- ✅ Data portability (Article 20)
- ✅ Consent management (Article 7)
- ✅ Breach notification (Article 33)

**Implementation:**
```typescript
// Encrypt all PII fields
// Implement data deletion endpoints
// Export user data in JSON format
// Track consent in database
// Automated breach detection
```

---

## 🔄 Data Migration Strategy

### Migrating from LocalStorage to Encrypted Storage

#### Step 1: Export Existing Data
```typescript
// Create migration script
async function exportLocalStorageData() {
  const localService = new LocalStorageService('speaksync_');
  const keys = await localService.getAllKeys();

  const exportedData = {};
  for (const key of keys) {
    exportedData[key] = await localService.getItem(key);
  }

  // Save to file for backup
  const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(exportedData, null, 2)
  )}`;

  const link = document.createElement('a');
  link.setAttribute('href', dataUrl);
  link.setAttribute('download', `speaksync-export-${Date.now()}.json`);
  link.click();

  return exportedData;
}
```

#### Step 2: Import to Encrypted Storage
```typescript
async function importToEncryptedStorage(data: Record<string, any>) {
  const encryptedService = new BackendEncryptedStorage();
  encryptedService.setAuthToken(authToken);

  for (const [key, value] of Object.entries(data)) {
    await encryptedService.setItem(key, value);
  }

  console.log('Migration complete!');
}
```

#### Step 3: Verify Migration
```typescript
async function verifyMigration() {
  const keys = await storageService.getAllKeys();
  console.log(`Migrated ${keys.length} keys`);

  // Spot check some data
  for (const key of keys.slice(0, 5)) {
    const data = await storageService.getItem(key);
    console.log(`Key ${key}:`, data !== null ? '✓' : '✗');
  }
}
```

---

## 🧪 Testing Encrypted Storage

### Unit Tests
```typescript
describe('EncryptedStorageService', () => {
  let storage: BackendEncryptedStorage;

  beforeEach(() => {
    storage = new BackendEncryptedStorage();
    storage.setAuthToken('test-token');
  });

  it('should encrypt and decrypt data', async () => {
    const testData = { name: 'John Doe', ssn: '123-45-6789' };

    await storage.setItem('test-patient', testData);
    const retrieved = await storage.getItem('test-patient');

    expect(retrieved).toEqual(testData);
  });

  it('should return null for non-existent keys', async () => {
    const result = await storage.getItem('non-existent');
    expect(result).toBeNull();
  });

  it('should list all keys', async () => {
    await storage.setItem('key1', { data: 1 });
    await storage.setItem('key2', { data: 2 });

    const keys = await storage.getAllKeys();
    expect(keys).toContain('key1');
    expect(keys).toContain('key2');
  });
});
```

---

## 📝 Checklist: Production Encryption

- [ ] Choose encryption method (client-side or backend)
- [ ] Implement backend endpoints (if using backend encryption)
- [ ] Set up key management (AWS KMS, Azure Key Vault, etc.)
- [ ] Configure encryption algorithms (AES-256-GCM)
- [ ] Implement audit logging
- [ ] Set up automated backups (encrypted)
- [ ] Configure key rotation policies
- [ ] Test encryption/decryption performance
- [ ] Penetration testing
- [ ] Compliance review (HIPAA/GDPR)
- [ ] Document encryption procedures
- [ ] Train team on key management
- [ ] Set up monitoring and alerting
- [ ] Create disaster recovery plan
- [ ] Switch storageService to encrypted implementation
- [ ] Migrate existing data
- [ ] Verify all data encrypted
- [ ] Delete unencrypted data

---

**Ready for production?** The abstraction layer makes encryption migration straightforward!
