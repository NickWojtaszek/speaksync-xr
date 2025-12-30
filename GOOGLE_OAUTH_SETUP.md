# Google OAuth Setup Guide

## Overview
SpeakSync XR now supports Google login. Users can sign in with their Google accounts in addition to the pre-configured local profiles.

## Setup Steps

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name (e.g., "SpeakSync XR") and click "Create"
5. Wait for the project to be created

### 2. Enable Google Identity Services API
1. In the Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Identity Services" or "Google+ API"
3. Click on it and press "Enable"

### 3. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. You may be asked to create a consent screen first:
   - Choose "External" for user type
   - Fill in the required app information (name, email, etc.)
   - Add yourself as a test user
4. For Application type, select "Web application"
5. Name it "SpeakSync XR Web"
6. Under "Authorized JavaScript origins", add:
   - `http://localhost:5173` (development)
   - `http://localhost:3000` (alternative dev port)
   - Your production domain when deploying
7. Click "Create"

### 4. Copy Your Client ID
1. You'll see a modal with your Client ID and Client Secret
2. Copy the **Client ID** (you don't need the Secret for web client-side authentication)
3. Click "OK"

### 5. Add to Environment Variables
1. Open `.env.local` in the project root
2. Find the line: `VITE_GOOGLE_CLIENT_ID=`
3. Paste your Client ID: `VITE_GOOGLE_CLIENT_ID=your_client_id_here`
4. Save the file

### 6. Restart Development Server
```bash
npm run dev
```

The app should now reload with Google login enabled on the login page.

## Features

### Login Methods
Users can now:
- Click their profile to login with a local account
- Click the Google login button to authenticate with their Google account

### User Data Storage
When a user logs in with Google:
- Their profile is automatically saved to localStorage
- Email and profile picture are stored
- The login method is tracked (local vs. google)
- Subsequent Google logins recognize returning users

### Theme Support
- The Google login button automatically adapts to dark/light themes
- Filter is applied in dark mode for better visibility

## File Changes

### Modified Files
- **App.tsx** - Added GoogleOAuthProvider wrapper
- **pages/LoginPage.tsx** - Added GoogleLoginButton component
- **context/AuthContext.tsx** - Added `loginWithGoogle()` method and UserProfile interface
- **types.ts** - Updated AuthData interface to support user objects

### New Files
- **.env.local** - Contains VITE_GOOGLE_CLIENT_ID environment variable
- **.env.example** - Template for environment setup

## Dependencies Added
- `@react-oauth/google` - Google OAuth React library
- `jwt-decode` - For decoding Google JWT tokens

## Troubleshooting

### Google button not showing
- Check that VITE_GOOGLE_CLIENT_ID is set in `.env.local`
- Verify the Client ID is correct
- Restart the development server with `npm run dev`

### Login not working
- Ensure your localhost domain is in "Authorized JavaScript origins" in Google Cloud Console
- Check browser console for errors
- Clear browser cache and localStorage

### Button styling issues
- The button should adapt to your app's theme automatically
- If it looks incorrect, check that the GoogleOAuthProvider is properly wrapped in App.tsx

## Production Deployment

When deploying to production:
1. Add your production domain to "Authorized JavaScript origins"
2. Update VITE_GOOGLE_CLIENT_ID environment variable in your hosting platform
3. Rebuild and deploy

Example for Vercel, Netlify, or similar:
- Set environment variable: `VITE_GOOGLE_CLIENT_ID=your_production_client_id`
