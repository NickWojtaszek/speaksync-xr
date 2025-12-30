# Railway Quick Start - 5 Minutes to Production

## Step 1: Create Railway Project (1 min)

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Choose "Deploy from GitHub repo"
4. Select your repository

## Step 2: Add PostgreSQL (30 seconds)

1. Click "New" → "Database" → "PostgreSQL"
2. Done! Railway automatically connects it

## Step 3: Set Environment Variables (2 min)

Click your service → "Variables" → Add these:

```
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
GEMINI_API_KEY=<your-gemini-api-key>
NODE_ENV=production
VITE_APP_ENV=production
```

## Step 4: Initialize Database (1 min)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Connect to database and run schema
railway connect postgres
\i db/schema.sql
\q
```

## Step 5: Deploy (30 seconds)

Railway auto-deploys from GitHub! Just push:

```bash
git push origin main
```

## Step 6: Update Google OAuth (30 seconds)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. OAuth 2.0 Credentials → Edit
3. Add authorized origin: `https://your-app.up.railway.app`
4. Save

## Done! 🎉

Your app is live at: `https://your-app.up.railway.app`

---

## Need Help?

Full guide: [DEPLOYMENT.md](./DEPLOYMENT.md)

## Common Issues

**Build failed?**
- Check Railway logs: `railway logs`
- Verify environment variables are set

**Can't login?**
- Update Google OAuth origins
- Check VITE_GOOGLE_CLIENT_ID

**Database errors?**
- Run schema: `railway run psql $DATABASE_URL -f db/schema.sql`
- Check DATABASE_URL exists in variables
