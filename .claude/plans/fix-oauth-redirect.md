# Fix Google OAuth Redirect to localhost

## Problem

✅ Google OAuth **IS WORKING** - Authentication successful!
❌ But it redirects to `http://localhost:3000/#` instead of production URL

## Evidence

After successful Google sign-in, the URL contains:
```
http://localhost:3000/#access_token=eyJhbG...
```

This proves:
- ✅ Google OAuth credentials are correct
- ✅ Supabase is processing the OAuth callback
- ✅ User is authenticated (token generated)
- ❌ Redirect URL is wrong (should be Railway production URL)

## Root Cause

The Supabase **Site URL** is set to `http://localhost:3000` instead of the production URL.

## Solution

### Step 1: Update Supabase Site URL

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: **pssngtmbbaeprnjusyhw**
3. Navigate to: **Authentication** → **URL Configuration**
4. Find **"Site URL"** field
5. Change from: `http://localhost:3000`
6. Change to: `https://web-production-a45df.up.railway.app`
7. Click **Save**

### Step 2: Update Redirect URLs (Allowed URLs)

In the same **URL Configuration** section:

1. Find **"Redirect URLs"** section
2. Add both URLs (one per line):
   ```
   https://web-production-a45df.up.railway.app/**
   http://localhost:3000/**
   ```
3. The `**` wildcard allows any path after the base URL
4. Click **Save**

### Step 3: Test Again

1. Open **production URL**: https://web-production-a45df.up.railway.app
2. Click **"Continue with Google"**
3. Sign in with Google
4. Should now redirect to: `https://web-production-a45df.up.railway.app/#access_token=...`
5. You should be signed in automatically

## Expected Result

After fixing, the OAuth flow should be:

1. User clicks "Continue with Google" on **production URL**
2. Redirects to Google OAuth page
3. User signs in with Google
4. Google redirects to Supabase callback: `https://pssngtmbbaeprnjusyhw.supabase.co/auth/v1/callback`
5. Supabase processes OAuth and redirects to **Site URL**: `https://web-production-a45df.up.railway.app/#access_token=...`
6. App reads token from URL hash and signs user in
7. User sees main app (not login screen)

## Verification Checklist

After making the change:

- [ ] Site URL in Supabase = `https://web-production-a45df.up.railway.app`
- [ ] Redirect URLs include production URL with `/**`
- [ ] Test on production URL (not localhost)
- [ ] Google sign-in redirects to production URL
- [ ] User is signed in after redirect
- [ ] No console errors

## Additional Notes

### Why localhost was there?

The default Site URL in Supabase is often `http://localhost:3000` for development. When you deploy to production, you must update it to your production URL.

### Can I keep localhost for testing?

Yes! Add both URLs to the **Redirect URLs** list:
- Production: `https://web-production-a45df.up.railway.app/**`
- Local dev: `http://localhost:3000/**`

This allows testing on both environments.

### What about Google Cloud Console?

The Google Cloud Console **Authorized redirect URIs** should still point to Supabase:
```
https://pssngtmbbaeprnjusyhw.supabase.co/auth/v1/callback
```

Do NOT change this. Supabase handles the final redirect to your app.

## Current Status

🎉 **OAuth is working!** Just needs the redirect URL fixed in Supabase.

User successfully authenticated:
- Name: Mikolaj Wojtaszek
- Email: nwojtaszek@gmail.com
- Provider: Google
- Token: Valid JWT received
