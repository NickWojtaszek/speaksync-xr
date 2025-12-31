# Google OAuth Testing Guide

## Test Environment Status

✅ **Dev Server Running**: http://localhost:3003
✅ **Production URL**: https://web-production-a45df.up.railway.app
✅ **Code Implementation**: Complete (Google sign-in button added)
✅ **Supabase Configuration**: Complete (User confirmed steps 2 & 3)

## Testing Checklist

### Pre-Test Verification

1. **Check Supabase Configuration**
   - [ ] Go to Supabase Dashboard → Authentication → Providers
   - [ ] Verify Google provider is **ON** (green toggle)
   - [ ] Verify Client ID is entered
   - [ ] Verify Client Secret is entered

2. **Check Google Cloud Console**
   - [ ] OAuth consent screen is configured
   - [ ] Authorized redirect URIs include:
     - `https://pssngtmbbaeprnjusyhw.supabase.co/auth/v1/callback`
     - `http://localhost:54321/auth/v1/callback` (for local testing)
   - [ ] Authorized JavaScript origins include:
     - `https://web-production-a45df.up.railway.app`
     - `http://localhost:3003` (for local testing)

### Test 1: Local Development Testing

**URL**: http://localhost:3003

1. **Load the App**
   - [ ] Open http://localhost:3003 in browser
   - [ ] Sign out if already signed in
   - [ ] Verify you see the login screen

2. **Test Google Sign-In Button**
   - [ ] Click "Continue with Google" button
   - [ ] Verify it redirects to Google sign-in page
   - [ ] Sign in with your Google account
   - [ ] Verify it redirects back to http://localhost:3003
   - [ ] Verify you're now signed in (see main app, not login screen)

3. **Check Console for Errors**
   - [ ] Open browser DevTools (F12)
   - [ ] Go to Console tab
   - [ ] Verify NO errors related to:
     - OAuth
     - Supabase
     - redirect_uri_mismatch
     - Invalid client

4. **Verify User Data in Supabase**
   - [ ] Go to Supabase Dashboard → Authentication → Users
   - [ ] Find your user entry
   - [ ] Verify:
     - Email matches your Google account
     - Provider shows "google"
     - User metadata includes Google profile info
     - Created timestamp is recent

5. **Test Data Sync**
   - [ ] Add a template or code while signed in
   - [ ] Go to Supabase → Table Editor → `templates` or `studies`
   - [ ] Verify data appears in the table
   - [ ] Verify `user_id` matches your auth user ID

### Test 2: Production Testing

**URL**: https://web-production-a45df.up.railway.app

1. **Load Production App**
   - [ ] Open https://web-production-a45df.up.railway.app
   - [ ] Sign out if already signed in
   - [ ] Verify you see the login screen

2. **Test Google Sign-In**
   - [ ] Click "Continue with Google"
   - [ ] Sign in with Google account
   - [ ] Verify redirect back to production URL
   - [ ] Verify you're signed in

3. **Test Cross-Device Sync**
   - [ ] On Computer A: Sign in with Google
   - [ ] On Computer A: Add a template or code
   - [ ] On Computer B: Sign in with same Google account
   - [ ] On Computer B: Verify the template/code appears
   - [ ] On Computer B: Modify the data
   - [ ] On Computer A: Refresh page
   - [ ] On Computer A: Verify changes from Computer B appear

### Test 3: Error Cases

1. **Test Invalid Redirect URI** (should NOT happen if configured correctly)
   - If you see "Error 400: redirect_uri_mismatch"
   - Go to Google Cloud Console → Credentials
   - Verify redirect URI: `https://pssngtmbbaeprnjusyhw.supabase.co/auth/v1/callback`
   - Re-save credentials

2. **Test Invalid Client** (should NOT happen if configured correctly)
   - If you see "Error 401: Invalid client"
   - Go to Supabase → Authentication → Providers → Google
   - Re-enter Client ID and Client Secret
   - Save

3. **Test Blocked Access** (may happen if app in Testing mode)
   - If you see "Access blocked: This app's request is invalid"
   - Go to Google Cloud Console → OAuth consent screen
   - Verify all required fields are filled
   - OR add your email as a test user

### Test 4: Sign Out and Re-Sign In

1. **Sign Out**
   - [ ] Click user menu (top right)
   - [ ] Click "Sign Out"
   - [ ] Verify redirected to login screen

2. **Re-Sign In with Google**
   - [ ] Click "Continue with Google"
   - [ ] Verify it automatically signs in (no password prompt if already authenticated with Google)
   - [ ] Verify your data is still there

### Test 5: Email/Password Still Works

1. **Test Email/Password Sign-In**
   - [ ] Sign out
   - [ ] Enter email and password in the form
   - [ ] Click "Sign In"
   - [ ] Verify you can still sign in with email/password
   - [ ] Verify data syncs correctly

2. **Test Sign-Up with Email**
   - [ ] Sign out
   - [ ] Click "Don't have an account? Sign Up"
   - [ ] Enter new email and password
   - [ ] Click "Sign Up"
   - [ ] Verify "Check your email for confirmation link" message
   - [ ] Check email and click confirmation link
   - [ ] Verify you can sign in

## Expected Results

### ✅ Success Criteria

- Google sign-in button appears on login screen
- Clicking "Continue with Google" redirects to Google OAuth
- After Google sign-in, redirects back to app
- User is signed in and sees main app
- User data syncs to Supabase
- Cross-device sync works
- No console errors
- Email/password sign-in still works

### ❌ Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "redirect_uri_mismatch" | Redirect URI in Google Console doesn't match Supabase | Add `https://pssngtmbbaeprnjusyhw.supabase.co/auth/v1/callback` to Google Console |
| "Invalid client" | Client ID or Secret is wrong | Re-check and re-enter in Supabase |
| "Access blocked" | OAuth consent screen incomplete | Fill all required fields in Google Console |
| "This app is in testing mode" | Only test users can sign in | Add your email as test user OR publish app |
| Button doesn't do anything | JavaScript error | Check browser console for errors |
| Redirects but doesn't sign in | Supabase provider not enabled | Enable Google provider in Supabase Dashboard |

## Console Commands for Debugging

### Check if Supabase is configured
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
```

### Check current auth state
```javascript
const { data } = await supabase.auth.getSession();
console.log('Current session:', data.session);
console.log('Current user:', data.session?.user);
```

### Test Google OAuth manually
```javascript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.origin
  }
});
console.log('OAuth error:', error);
```

## Test Results (Fill in after testing)

### Local Testing (http://localhost:3003)

- [ ] ✅ PASS / ❌ FAIL - Google sign-in button appears
- [ ] ✅ PASS / ❌ FAIL - Redirects to Google OAuth
- [ ] ✅ PASS / ❌ FAIL - Signs in successfully
- [ ] ✅ PASS / ❌ FAIL - No console errors
- [ ] ✅ PASS / ❌ FAIL - Data syncs to Supabase

**Notes:**
```
[User fills in test observations here]
```

### Production Testing (Railway)

- [ ] ✅ PASS / ❌ FAIL - Google sign-in button appears
- [ ] ✅ PASS / ❌ FAIL - Redirects to Google OAuth
- [ ] ✅ PASS / ❌ FAIL - Signs in successfully
- [ ] ✅ PASS / ❌ FAIL - Cross-device sync works
- [ ] ✅ PASS / ❌ FAIL - No console errors

**Notes:**
```
[User fills in test observations here]
```

### Issues Found

```
[List any issues, errors, or unexpected behavior here]
```

### Screenshots

```
[Attach screenshots of:
- Login screen with Google button
- Supabase Users table showing Google user
- Console (showing no errors)
- Any errors encountered]
```

## Next Steps After Testing

If tests pass:
- ✅ Google OAuth is working
- ✅ Ready to publish OAuth consent screen (remove test user restriction)
- ✅ Consider adding Microsoft OAuth next

If tests fail:
- Review error messages
- Check Common Issues table above
- Verify Google Cloud Console configuration
- Verify Supabase configuration
- Check browser console for detailed errors
