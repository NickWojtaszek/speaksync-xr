# Deployment Instructions - Auth System Migration

## Critical: Database Migration Required

Before the app will work in production, you **MUST** run the database migration to create the `user_profiles` table.

---

## Step 1: Run Supabase Migration

### Option A: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project: `pssngtmbbaeprnjusyhw`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the contents of `supabase/migrations/20260101_create_user_profiles.sql`
6. Paste into the SQL editor
7. Click **Run** (or press Ctrl+Enter)
8. Verify success message appears

### Option B: Via Supabase CLI

```bash
# If you have Supabase CLI installed
cd speaksync-xr
supabase db push
```

---

## Step 2: Verify Migration

### Check table was created:

1. In Supabase Dashboard → **Table Editor**
2. Look for `user_profiles` table
3. Verify columns: `id`, `email`, `name`, `role`, `created_at`, `updated_at`

### Test RLS policies:

```sql
-- Run in SQL Editor
SELECT * FROM user_profiles LIMIT 1;
```

Should return 0 rows initially (table is empty).

---

## Step 3: Test Production App

1. Wait for Railway deployment to complete (~2-3 minutes)
2. Visit: https://web-production-a45df.up.railway.app/
3. Clear localStorage: `localStorage.clear(); location.reload();`
4. Log in with Google OAuth
5. Verify:
   - ✅ No errors in console
   - ✅ User name appears in top-right menu
   - ✅ No "undefined .pl" errors
   - ✅ Logout works
   - ✅ Can re-login successfully

---

## Step 4: Verify Database Profile

After first login, check that profile was created:

```sql
-- Run in Supabase SQL Editor
SELECT * FROM user_profiles;
```

Should show:
- Your user ID (UUID)
- Your email
- Your name (from Google profile)
- Role: `radiologist` (default)

---

## What This Migration Does

### Creates `user_profiles` table
- Stores user metadata from Supabase Auth
- Linked to auth.users via foreign key
- RLS policies ensure users can only see their own data

### Auto-creates profiles
- Trigger on auth.users INSERT
- Extracts name from Google OAuth metadata
- Sets default role to `radiologist`

### Backward compatibility
- useUserProfile() hook loads from this table
- Falls back to auth.users metadata if table not yet populated
- Same interface as old useAuth() hook

---

## Troubleshooting

### Error: "relation 'user_profiles' does not exist"

**Cause:** Migration hasn't been run yet

**Fix:** Follow Step 1 above to run the migration

---

### Error: "permission denied for table user_profiles"

**Cause:** RLS policies not created properly

**Fix:** Re-run migration script (it's idempotent)

---

### User profile shows "User" instead of real name

**Cause:** Profile was created before Google OAuth metadata was available

**Fix:** Delete the profile and re-login:

```sql
DELETE FROM user_profiles WHERE email = 'your@email.com';
```

Then log out and log back in.

---

### Logout doesn't work

**Check:**
1. Console for errors
2. Supabase auth session is cleared: `localStorage` should not have `sb-*` keys after logout
3. User is redirected to login page

---

## Rollback Plan

If issues arise:

### Option 1: Rollback code only (keep database)

```bash
git revert 62ffab8
git push
```

### Option 2: Rollback everything (drop table)

```sql
-- DANGER: This deletes all user profiles
DROP TABLE IF EXISTS user_profiles CASCADE;
```

Then rollback code as above.

---

## Next Steps After Migration

1. **Test with multiple users** (different roles)
2. **Update default role logic** if needed (currently defaults to `radiologist`)
3. **Add admin UI** for managing user roles
4. **Remove localStorage cleanup** from old auth system (no longer needed)
5. **Monitor for errors** in Railway logs

---

**Migration prepared by:** Claude Code
**Date:** 2026-01-01
**Status:** Ready for production deployment
