# OAuth Setup Guide (Google & Microsoft)

This guide explains how to enable Google and Microsoft authentication via Supabase for SpeakSync XR.

## Current Status

✅ **Email/Password Auth** - Working (test at `/authdemo` route)
✅ **Supabase Integration** - Complete
⏳ **Google OAuth** - Ready to configure
⏳ **Microsoft OAuth** - Ready to configure

---

## Prerequisites

- Supabase project created and configured
- `SupabaseAuthProvider` integrated in App.tsx
- Environment variables set in Railway

---

## Google OAuth Setup

### Step 1: Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. **Authorized JavaScript origins**:
   - `https://pssngtmbbaeprnjusyhw.supabase.co`
   - `http://localhost:5173` (for local dev)
   - `https://web-production-a45df.up.railway.app` (your Railway URL)
7. **Authorized redirect URIs**:
   ```
   https://pssngtmbbaeprnjusyhw.supabase.co/auth/v1/callback
   http://localhost:5173/auth/callback (for local dev)
   ```
8. Click **Create**
9. Copy the **Client ID** and **Client Secret**

### Step 2: Supabase Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** in the list
5. Toggle it **ON**
6. Paste **Client ID** and **Client Secret** from Step 1
7. Click **Save**

### Step 3: Test

1. Add Google sign-in button to `AuthDemo.tsx`:
   ```tsx
   <button onClick={signInWithGoogle}>
     Sign in with Google
   </button>
   ```
2. The `signInWithGoogle()` function is already in `SupabaseAuthContext.tsx`
3. Test authentication

---

## Microsoft OAuth Setup

### Step 1: Azure Portal

1. Go to [Azure Portal](https://portal.azure.com/)
2. Go to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Name: `SpeakSync XR`
5. Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
6. **Redirect URI**:
   - Platform: **Web**
   - URL: `https://pssngtmbbaeprnjusyhw.supabase.co/auth/v1/callback`
7. Click **Register**
8. Copy the **Application (client) ID**
9. Go to **Certificates & secrets** → **Client secrets**
10. Click **New client secret**
11. Description: `Supabase Auth`
12. Expires: Choose duration (e.g., 24 months)
13. Click **Add**
14. Copy the **Value** (this is your Client Secret - save it now!)

### Step 2: Supabase Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Azure (Microsoft)** in the list
5. Toggle it **ON**
6. Paste **Client ID** (Azure Application ID)
7. Paste **Client Secret** (from Azure)
8. Click **Save**

### Step 3: Test

1. Add Microsoft sign-in button to `AuthDemo.tsx`:
   ```tsx
   <button onClick={signInWithMicrosoft}>
     Sign in with Microsoft
   </button>
   ```
2. The `signInWithMicrosoft()` function is already in `SupabaseAuthContext.tsx`
3. Test authentication

---

## Usage in Production

### Option 1: Replace Email/Password Auth

Update `AuthDemo.tsx` or create a new login page with OAuth buttons only:

```tsx
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

export const OAuthLogin: React.FC = () => {
  const { signInWithGoogle, signInWithMicrosoft } = useSupabaseAuth();

  return (
    <div>
      <h1>Sign In</h1>
      <button onClick={signInWithGoogle}>
        Continue with Google
      </button>
      <button onClick={signInWithMicrosoft}>
        Continue with Microsoft
      </button>
    </div>
  );
};
```

### Option 2: Add OAuth to Existing Login

Keep email/password and add OAuth as alternatives:

```tsx
<div>
  <h2>Sign in with</h2>
  <button onClick={signInWithGoogle}>Google</button>
  <button onClick={signInWithMicrosoft}>Microsoft</button>

  <p>Or use email/password</p>
  <input type="email" ... />
  <input type="password" ... />
</div>
```

---

## Migrating from LocalStorage to Supabase

### Current Architecture

- App uses `useLocalStorage` hook in all contexts
- Data stored in browser only
- No cross-device sync

### Migration Path

1. **Update contexts to use `useStorage` hook** (already created in `hooks/useStorage.ts`)
2. **Example migration** for SettingsContext:

   ```tsx
   // Before:
   import { useLocalStorage } from '../hooks/useLocalStorage';
   const [settings, setSettings] = useLocalStorage('settings', defaultSettings);

   // After:
   import { useStorage } from '../hooks/useStorage';
   const [settings, setSettings, loading] = useStorage('settings', defaultSettings);
   ```

3. **Gradually migrate contexts** one at a time:
   - SettingsContext
   - StudyContext
   - TemplateContext
   - ReportContext

4. **Test each migration** before moving to the next

---

## Security Notes

### Row Level Security (RLS)

Supabase has RLS enabled on all tables. This means:
- Users can only access their own data
- No user can see another user's data
- Even with the anon key, data is protected

### API Keys

- **Publishable (anon) key**: Safe to expose in frontend
- **Service role key**: NEVER expose to frontend (backend only)

### Environment Variables

In Railway, add:
```
VITE_SUPABASE_URL=https://pssngtmbbaeprnjusyhw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc... (your anon key)
```

---

## Testing Checklist

### Email/Password Auth
- [ ] Sign up with email
- [ ] Check email for confirmation link
- [ ] Confirm email
- [ ] Sign in with password
- [ ] Sign out
- [ ] Sign in again

### Google OAuth
- [ ] Click "Sign in with Google"
- [ ] Select Google account
- [ ] Redirected back to app
- [ ] User profile created
- [ ] Sign out
- [ ] Sign in again (should be faster)

### Microsoft OAuth
- [ ] Click "Sign in with Microsoft"
- [ ] Select Microsoft account
- [ ] Redirected back to app
- [ ] User profile created
- [ ] Sign out
- [ ] Sign in again

### Cross-Device Sync
- [ ] Sign in on Device A
- [ ] Create/modify data
- [ ] Sign in on Device B with same account
- [ ] Verify data appears on Device B
- [ ] Modify data on Device B
- [ ] Refresh Device A
- [ ] Verify changes from Device B appear on Device A

---

## Troubleshooting

### "Redirect URI mismatch"
- Verify redirect URI in Google/Azure matches Supabase callback URL exactly
- Include `https://` protocol
- No trailing slash

### "Invalid client"
- Double-check Client ID and Secret in Supabase
- Regenerate secret in Google/Azure if needed

### "User not found after OAuth"
- Check Supabase Authentication → Users to verify user was created
- Check browser console for errors

### Data not syncing
- Verify user is authenticated (check `user` in `useSupabaseAuth`)
- Check browser console for Supabase errors
- Verify RLS policies in Supabase

---

## Next Steps

1. Configure Google OAuth following steps above
2. Configure Microsoft OAuth following steps above
3. Test authentication flows
4. Gradually migrate contexts from `useLocalStorage` to `useStorage`
5. Add proper login/logout UI to main app
6. Remove demo page or secure it for development only

---

## Support

- **Supabase Docs**: https://supabase.com/docs/guides/auth
- **Google OAuth Docs**: https://developers.google.com/identity/protocols/oauth2
- **Microsoft OAuth Docs**: https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow
