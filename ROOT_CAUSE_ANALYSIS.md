# Root Cause Analysis: Authentication & Data Flow Issues

**Date:** 2026-01-01
**Error:** `TypeError: Cannot read properties of undefined (reading 'pl')`
**Environment:** Production deployment on Railway

---

## Executive Summary

The application has a **dual authentication system** (Supabase + Legacy Local Auth) that is not properly synchronized. When users log in via Supabase (Google OAuth), the legacy local auth context remains unpopulated, causing undefined user data to propagate through the application and crash components that expect user metadata.

---

## Architecture Overview

### Current Authentication Stack

```
App Root
├── SupabaseAuthProvider (Supabase session management)
│   ├── ThemeProvider
│   │   ├── LanguageProvider
│   │   │   ├── AuthProvider (Legacy local user profiles)
│   │   │   │   └── AuthWrapper (Route guard)
│   │   │   │       ├── IF Supabase user exists:
│   │   │   │       │   └── AuthenticatedApp
│   │   │   │       │       ├── AuthSyncBridge (NEW - syncs Supabase → Local)
│   │   │   │       │       └── App Providers + Content
│   │   │   │       └── IF Supabase user is null:
│   │   │   │           └── AuthForm (Login page)
```

### The Problem

1. **Supabase Auth** controls **page access** (login page vs app)
2. **Local Auth** provides **user profile data** (name, email, role)
3. Components use `useAuth()` (local) to get user data
4. When logging in via Supabase, `useSupabaseAuth().user` exists but `useAuth().currentUser` is NULL
5. Components crash when accessing `undefined.name`, `undefined.email`, etc.

---

## Error Trace

### Stack Trace Analysis

```
TypeError: Cannot read properties of undefined (reading 'pl')
    at $I (index-DKnrv94W.js:1266:3837)
    at mk (index-DKnrv94W.js:94:41722)
```

### What `.pl` Means

The error "Cannot read properties of undefined (reading 'pl')" occurs when:

```javascript
someValue.toLocaleString('pl-PL', { ... })
```

Where `someValue` is `undefined`. JavaScript tries to access the locale object internally, resulting in this cryptic error.

### Affected Components

**Primary culprits:**

1. **AccountingDashboard.tsx:175**
   ```typescript
   {totalAmount.toLocaleString('pl-PL', { ... })} PLN
   ```
   - `totalAmount` comes from `report.totalAmount` or calculated sum
   - If `report.entries` is undefined → calculation fails → `totalAmount` is undefined

2. **FinancialReportGenerator.tsx:367, 379, 404**
   ```typescript
   {generatedReport.totalAmount.toLocaleString('pl-PL', { ... })}
   ```
   - Guarded by `{generatedReport && (...)}`
   - Should be safe, but may be rendering before guard is evaluated

3. **Multiple report components:**
   - Invoice.tsx:97
   - Specification.tsx:80
   - Summary.tsx:27, 28

---

## Data Flow Issues

### Issue 1: Report Data Missing User Metadata

**Location:** ReportContext / StudyContext
**Problem:** When reports are generated, they store `userName` and `userEmail` from `currentUser`:

```typescript
// When creating report
const report = {
  userId: currentUser.id,
  userName: currentUser.name,    // ← UNDEFINED if currentUser is null
  userEmail: currentUser.email,  // ← UNDEFINED if currentUser is null
  ...
};
```

**Impact:**
- Reports in localStorage have `undefined` userName/userEmail
- AccountingDashboard tries to render these undefined values
- Crash on `.toLocaleString('pl-PL')`

### Issue 2: AuthSyncBridge Timing

**Location:** App.tsx:86-99
**Problem:** `AuthSyncBridge` runs AFTER app mounts, creating a race condition:

```typescript
const AuthSyncBridge = () => {
  const { user } = useSupabaseAuth();      // Supabase user
  const { currentUser, login } = useAuth(); // Local user

  useEffect(() => {
    if (user && !currentUser) {
      login(name, 'radiologist'); // Sync happens AFTER first render
    }
  }, [user, currentUser]);

  return <>{children}</>;
};
```

**Timeline:**
1. User logs in via Supabase → `user` exists
2. `AuthWrapper` sees Supabase `user` → renders `AuthenticatedApp`
3. `AuthenticatedApp` mounts → providers initialize
4. Components try to access `currentUser` → **NULL**
5. `AuthSyncBridge` useEffect runs → creates local user
6. Components re-render with user data

**Result:** Components crash during step 4 before sync completes.

### Issue 3: localStorage Persistence

**Problem:** Old data in localStorage with schema mismatches:

- `speaksync_auth_v2` may have stale user "Nick"
- Reports in `speaksync_reports` may have undefined user fields
- Supabase tokens in `sb-*` keys may be from different user

---

## Why Previous Fixes Didn't Work

### Fix Attempt 1: Dual Logout
✅ **Status:** Working
❌ **Didn't solve crash:** Logout works but doesn't fix login crash

### Fix Attempt 2: Null Safety in FinancialReportGenerator
✅ **Status:** Partially working
❌ **Didn't solve crash:** Only fixed CSV export, not JSX rendering

### Fix Attempt 3: AuthSyncBridge Component Hierarchy
❌ **Status:** Broken
**Problem:** Initially placed outside `AuthProvider`, couldn't access `useAuth()`
**Fix Applied:** Moved inside `AuthenticatedApp` (inside `AuthProvider`)
**Remaining Issue:** Timing - components render BEFORE sync completes

---

## Comprehensive Fix Strategy

### Option A: Synchronous Auth Sync (Recommended)

**Approach:** Block app rendering until local user is synced

```typescript
const AuthenticatedApp = () => {
  const { user } = useSupabaseAuth();
  const { currentUser, login } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (user && !currentUser) {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      login(name, 'radiologist');
    }
    setIsReady(!!currentUser); // Only ready when local user exists
  }, [user, currentUser]);

  if (!isReady) {
    return <LoadingScreen />;
  }

  return <AppProviders><AppContent /></AppProviders>;
};
```

**Pros:**
- Guarantees `currentUser` exists before any component renders
- No race conditions
- Clean and simple

**Cons:**
- Extra loading state (minor UX delay)

---

### Option B: Remove Legacy Auth Completely

**Approach:** Migrate all components to use `useSupabaseAuth()` directly

**Changes Required:**
- Update all `useAuth()` calls to `useSupabaseAuth()`
- Map Supabase `user.user_metadata` to expected fields:
  - `user.name` → `user.user_metadata.full_name`
  - `user.email` → `user.email`
  - `user.role` → stored in Supabase user metadata or database
- Remove `AuthProvider` and `AuthContext`
- Store user roles in Supabase database

**Pros:**
- Single source of truth
- No sync complexity
- Proper production architecture

**Cons:**
- Large refactor (50+ file changes)
- Need database migration for roles
- Higher risk of breaking changes

---

### Option C: Defensive Rendering Everywhere

**Approach:** Add null checks to every component

```typescript
// Before
{user.name}
{amount.toLocaleString('pl-PL', { ... })}

// After
{user?.name || 'Unknown'}
{(amount || 0).toLocaleString('pl-PL', { ... })}
```

**Pros:**
- Low risk
- Can be done incrementally

**Cons:**
- Doesn't fix root cause
- Masks underlying architecture issues
- Tech debt accumulates

---

## Recommended Immediate Actions

### Phase 1: Stop the Bleeding (Today)
1. **Add loading state to AuthenticatedApp** (Option A)
2. **Add null coalescing to all `.toLocaleString()` calls:**
   ```typescript
   (value || 0).toLocaleString('pl-PL', { ... })
   ```
3. **Test login flow with localStorage cleared**

### Phase 2: Data Integrity (This Week)
1. **Add Supabase user ID to reports:**
   ```typescript
   supabaseUserId: user.id // Store Supabase ID as source of truth
   ```
2. **Migrate user role to Supabase user_metadata or database**
3. **Update report generation to use Supabase user data**

### Phase 3: Architecture Cleanup (Next Sprint)
1. **Deprecate legacy `AuthContext`** (Option B)
2. **Migrate all components to `useSupabaseAuth()`**
3. **Remove dual auth system entirely**

---

## Testing Checklist

Before deploying fixes:

- [ ] Clear localStorage and test fresh login
- [ ] Test with existing localStorage data
- [ ] Test logout and re-login
- [ ] Test with Google OAuth
- [ ] Test with email/password
- [ ] Verify AccountingDashboard renders without errors
- [ ] Verify FinancialReportGenerator works
- [ ] Verify no reports have undefined user data
- [ ] Test role-based access (verifier, accounting, radiologist)

---

## Long-term Recommendations

1. **Consolidate to single auth system** (Supabase only)
2. **Store all user metadata in Supabase database:**
   ```sql
   CREATE TABLE user_profiles (
     id UUID PRIMARY KEY REFERENCES auth.users(id),
     full_name TEXT,
     role TEXT CHECK (role IN ('radiologist', 'verifier', 'accounting', 'admin')),
     email TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
3. **Use Supabase RLS policies** for role-based access
4. **Remove all localStorage user data** (use Supabase as source of truth)
5. **Implement proper error boundaries** with user-friendly messages

---

## Impact Assessment

**User Impact:** High
- Users cannot log in without crash
- Data may be corrupted with undefined fields

**Business Impact:** Critical
- Production app is unusable
- No new users can onboard

**Technical Debt:** Medium
- Dual auth system was necessary for migration
- Now blocking progress, must be resolved

---

## Next Steps

**Immediate (Next 30 minutes):**
- Implement Option A (synchronous auth sync with loading state)
- Add defensive null checks to all `.toLocaleString()` calls

**Short-term (Today):**
- Test thoroughly with cleared localStorage
- Deploy and verify production fix

**Medium-term (This week):**
- Plan migration away from dual auth system
- Design Supabase-first architecture

---

**Prepared by:** Claude Code
**For:** SpeakSync XR Team
**Priority:** P0 - Critical Production Bug
