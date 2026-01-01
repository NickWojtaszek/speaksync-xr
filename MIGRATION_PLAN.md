# Migration Plan: Remove Legacy Auth System

**Goal:** Replace dual auth system (Supabase + Legacy) with Supabase-only authentication

---

## Files to Update (13 files)

### Components (6 files)
1. `components/AccountingDashboard.tsx` - Uses `currentUser`
2. `components/FinancialReportGenerator.tsx` - Uses `currentUser`
3. `components/SettingsPage.tsx` - Uses `currentUser`, `logout`
4. `components/UserMenu.tsx` - Uses `currentUser`, `logout`
5. `components/VerifierDashboard.tsx` - Uses `currentUser`

### Contexts (4 files)
6. `context/SettingsContext.tsx` - Uses `currentUser`
7. `context/StudyContext.tsx` - Uses `currentUser`
8. `context/TeachingCaseContext.tsx` - Uses `currentUser`
9. `context/TemplateContext.tsx` - Uses `currentUser`

### Pages (3 files)
10. `pages/MainPage.tsx` - Uses `currentUser`
11. `pages/ReportSubmissionPage.tsx` - Uses `currentUser`
12. `pages/SettingsPage.tsx` - Uses `currentUser`, `logout`

### Root App
13. `App.tsx` - Uses `currentUser`, `login` (in AuthSyncBridge)

---

## Migration Strategy

### Phase 1: Create User Profile System
- Create Supabase `user_profiles` table
- Add RLS policies
- Create trigger to auto-create profile on signup

### Phase 2: Create Compatibility Hook
- Create `useUserProfile()` hook that returns same interface as old `useAuth()`
- Maps Supabase user data to legacy format
- Provides backward compatibility during migration

### Phase 3: Replace All Imports
- Replace `import { useAuth } from '../context/AuthContext'`
- With `import { useUserProfile } from '../hooks/useUserProfile'`
- Replace `useAuth()` calls with `useUserProfile()`

### Phase 4: Cleanup
- Remove `context/AuthContext.tsx`
- Remove `AuthProvider` from `App.tsx`
- Remove `AuthSyncBridge` component

---

## User Profile Schema

```typescript
interface UserProfile {
  id: string;              // Supabase auth.users.id
  email: string;
  name: string;
  role: 'radiologist' | 'verifier' | 'accounting' | 'admin';
  created_at: string;
  updated_at: string;
}
```

Maps to legacy `User`:
```typescript
interface User {
  id: string;
  name: string;
  role: UserRole;
}
```

---

## Implementation Steps

1. ✅ Audit codebase (13 files found)
2. ⏳ Create Supabase migration for user_profiles table
3. ⏳ Create useUserProfile() hook
4. ⏳ Update all 13 files to use useUserProfile()
5. ⏳ Remove AuthContext, AuthProvider, AuthSyncBridge
6. ⏳ Test thoroughly
7. ⏳ Deploy

---

## Testing Checklist

- [ ] Fresh login with Google OAuth
- [ ] Fresh login with email/password
- [ ] User role appears correctly
- [ ] User name displays in UserMenu
- [ ] Logout works
- [ ] Re-login after logout
- [ ] Reports save with correct user data
- [ ] Role-based access control works (verifier, accounting)
- [ ] localStorage doesn't accumulate stale data
- [ ] No console errors

---

**Estimated Time:** 45-60 minutes
**Risk Level:** Medium (comprehensive testing required)
**Rollback Plan:** Git revert if issues found
