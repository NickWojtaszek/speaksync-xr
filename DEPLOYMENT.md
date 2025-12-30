# SpeakSync XR - Railway Deployment Guide

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Google Cloud Console**: OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com)
3. **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
4. **Git Repository**: Push your code to GitHub/GitLab

## Quick Start

### 1. Create Railway Project

```bash
# Install Railway CLI (optional but recommended)
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init
```

### 2. Add PostgreSQL Database

1. Go to your Railway project dashboard
2. Click "New" → "Database" → "Add PostgreSQL"
3. Railway will automatically provision a PostgreSQL database
4. Note: Database credentials are automatically added to environment variables

### 3. Configure Environment Variables

In Railway dashboard, go to your service → "Variables" and add:

#### Required Variables

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Application
NODE_ENV=production
VITE_APP_ENV=production

# Database (Railway provides these automatically)
DATABASE_URL=${POSTGRES_URL}  # Railway variable reference
```

#### Optional Variables

```env
# Feature Flags
VITE_DEV_BADGES=false
VITE_ENABLE_ANALYTICS=true

# API URL (if using separate backend)
VITE_API_URL=https://your-api-domain.railway.app

# Session Security
SESSION_SECRET=generate_a_secure_random_string_here
```

### 4. Initialize Database Schema

After PostgreSQL is provisioned:

```bash
# Connect to your Railway PostgreSQL database
railway connect postgres

# Run the schema file
\i db/schema.sql

# Or use psql directly
psql $DATABASE_URL -f db/schema.sql
```

### 5. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create/select a project
3. Enable "Google Identity" API
4. Create OAuth 2.0 credentials (Web Application)
5. Add authorized JavaScript origins:
   - `https://your-app-name.up.railway.app`
   - `http://localhost:3000` (for local development)
6. Copy the Client ID to Railway environment variables

### 6. Deploy

#### Option A: Deploy from Railway Dashboard

1. Connect your GitHub/GitLab repository
2. Railway will automatically detect the build configuration
3. Click "Deploy"

#### Option B: Deploy via Railway CLI

```bash
# Deploy from local directory
railway up

# Or link to GitHub and deploy
railway link
git push
```

## Build Configuration

Railway uses the following configuration (from `railway.json`):

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm run preview -- --host 0.0.0.0 --port $PORT"
  }
}
```

## Data Persistence - IMPORTANT! 🔴

### Current Development Setup
**SQLite in Browser (localStorage)**
- ✅ Data persists between page refreshes
- ✅ Survives browser restarts
- ❌ **LOST if you clear browser cache**
- ❌ **LOST if you use different browser/device**
- ❌ **NOT shared between users**
- ⚠️ Limited to ~10MB

**Your data is currently stored ONLY in your browser!**

### Production Setup (Railway)
**PostgreSQL Database**
- ✅ **Permanently stored** - never lost
- ✅ **Accessible from any browser/device**
- ✅ **Shared between all users**
- ✅ **Professional backups**
- ✅ **Unlimited storage (GBs)**

**Your data will be centrally stored on Railway servers!**

## Database Migration (SQLite to PostgreSQL)

### Step 1: Export Your Current Data

Open your browser console (F12) while the app is running:

```javascript
// Option 1: Export as JSON
await exportCasesJSON()  // Downloads teaching-cases-YYYY-MM-DD.json

// Option 2: Export as SQL (ready for PostgreSQL)
await exportCasesSQL()   // Downloads teaching-cases-YYYY-MM-DD.sql

// Check what you have
await getExportStats()   // Shows statistics
```

### Step 2: Import to PostgreSQL (After Railway Deployment)

#### If you exported as SQL:

```bash
# Connect to Railway database
railway connect postgres

# Import the SQL file
\i /path/to/teaching-cases-2024-12-30.sql

# Verify import
SELECT COUNT(*) FROM teaching_cases;
```

#### If you exported as JSON:

You'll need to convert JSON to SQL or use a Node.js import script. The SQL export method is recommended.

### Alternative: Fresh Start

If you don't have critical data yet, you can start fresh on Railway and the old browser data will remain in localStorage for reference.

## Monitoring and Logs

```bash
# View deployment logs
railway logs

# View recent logs
railway logs --recent

# Follow logs in real-time
railway logs --follow
```

## Custom Domain (Optional)

1. Go to Railway project → "Settings" → "Domains"
2. Click "Add Custom Domain"
3. Enter your domain (e.g., `app.yourdomain.com`)
4. Add the provided DNS records to your domain provider:
   - Type: CNAME
   - Name: app (or your subdomain)
   - Value: `your-app.up.railway.app`

5. Update Google OAuth authorized origins to include your custom domain

## Environment-Specific Features

### Development (localhost)
- Uses SQLite (sql.js) - all data stored in browser localStorage
- No backend required
- Fast iteration

### Production (Railway)
- Uses PostgreSQL database
- Centralized data storage
- Multi-user support
- Automatic backups (Railway Pro plan)

## Troubleshooting

### Build Failures

```bash
# Check build logs
railway logs --deployment

# Common issues:
# 1. Missing environment variables
# 2. Node version mismatch
# 3. Build command errors
```

### Database Connection Issues

```bash
# Test database connection
railway connect postgres

# Check environment variables
railway variables

# Verify DATABASE_URL is set
echo $DATABASE_URL
```

### OAuth Redirect Issues

1. Verify authorized JavaScript origins in Google Cloud Console
2. Check VITE_GOOGLE_CLIENT_ID in Railway variables
3. Ensure no trailing slashes in URLs

### Port Issues

Railway automatically assigns a PORT environment variable. The app is configured to use it:

```javascript
// vite.config.ts already configured
server: {
  port: process.env.PORT || 3000,
  host: '0.0.0.0'
}
```

## Cost Optimization

### Railway Free Tier
- $5 free credits per month
- Shared resources
- Automatic sleep after inactivity

### Railway Pro ($20/month)
- $5 included credits
- Higher resource limits
- No automatic sleep
- Database backups

### Optimize Usage
1. Use Railway's "Sleep" feature for staging environments
2. Set appropriate resource limits
3. Monitor usage in dashboard

## Security Checklist

- [ ] All environment variables set in Railway (not in code)
- [ ] `.env` files added to `.gitignore`
- [ ] Google OAuth restricted to production domain
- [ ] PostgreSQL accessible only from Railway services
- [ ] HTTPS enforced (automatic on Railway)
- [ ] Gemini API key rotated if exposed

## Backup Strategy

### Database Backups

```bash
# Manual backup
railway run pg_dump $DATABASE_URL > backup.sql

# Restore from backup
railway run psql $DATABASE_URL < backup.sql
```

### Automated Backups
- Railway Pro: Automatic daily backups
- Free Tier: Manual backups recommended

## Rollback

```bash
# View deployments
railway status

# Rollback to previous deployment
railway rollback
```

## Support and Resources

- **Railway Documentation**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **This Project Issues**: https://github.com/your-repo/issues

## Next Steps After Deployment

1. **Set up monitoring**: Use Railway's built-in metrics
2. **Configure alerts**: Set up email/Slack notifications
3. **Enable backups**: Upgrade to Pro for automatic backups
4. **Custom domain**: Add your own domain
5. **CI/CD**: Connect GitHub for automatic deployments
6. **Scaling**: Monitor usage and adjust resources

## Migration Checklist

- [ ] Railway account created
- [ ] PostgreSQL database provisioned
- [ ] Environment variables configured
- [ ] Google OAuth updated with production URL
- [ ] Database schema initialized
- [ ] Application deployed successfully
- [ ] Testing completed
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up
- [ ] Backup strategy implemented

---

**Ready to deploy?** Follow the steps above, and you'll have SpeakSync XR running in production within 15 minutes!
