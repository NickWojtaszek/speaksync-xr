# Data Storage - Development vs Production

## TL;DR

**Right now (Development):**
Your data is in your browser. If you clear cache = data gone.

**After Railway (Production):**
Your data is on Railway's servers. Permanent. Accessible anywhere.

---

## Current Setup (Development)

### Where is my data?
In your **browser's localStorage** (IndexedDB technically, via sql.js)

### What happens to my data?

| Action | Data Status |
|--------|-------------|
| Close tab | ✅ **Kept** |
| Close browser | ✅ **Kept** |
| Restart computer | ✅ **Kept** |
| Clear browser cache | ❌ **LOST** |
| Use different browser | ❌ **Not accessible** |
| Use different computer | ❌ **Not accessible** |
| Other users log in | ❌ **Can't see it** |

### Storage limits
~10MB typically (varies by browser)

---

## Production Setup (Railway)

### Where is my data?
In **PostgreSQL database** on Railway's cloud servers

### What happens to my data?

| Action | Data Status |
|--------|-------------|
| Close tab | ✅ **Kept** (on server) |
| Close browser | ✅ **Kept** (on server) |
| Restart computer | ✅ **Kept** (on server) |
| Clear browser cache | ✅ **Kept** (on server) |
| Use different browser | ✅ **Accessible** |
| Use different computer | ✅ **Accessible** |
| Other users log in | ✅ **Shared** |
| Railway server restarts | ✅ **Kept** (in database) |

### Storage limits
GBs to TBs (effectively unlimited for your use case)

---

## Migration Guide

### Before Deployment

1. **Export your current data** (if you have any teaching cases):
   ```javascript
   // Open browser console (F12)
   await exportCasesSQL()
   ```
   This downloads a `.sql` file

2. **Save the file** somewhere safe

### After Deployment

3. **Import to PostgreSQL**:
   ```bash
   railway connect postgres
   \i /path/to/exported-file.sql
   ```

4. **Done!** Your data is now permanent

### Don't Have Much Data Yet?

Just start fresh on Railway. The current browser data will still be there locally if you need to reference it.

---

## Key Differences

| Feature | Development (Browser) | Production (Railway) |
|---------|----------------------|---------------------|
| **Persistence** | Until cache cleared | Permanent |
| **Accessibility** | One device only | Any device |
| **Multi-user** | No | Yes |
| **Backups** | Manual only | Automatic (Pro plan) |
| **Storage** | ~10MB | GBs+ |
| **Speed** | Very fast (local) | Fast (network) |
| **Security** | Browser-only | Database security |

---

## Recommendations

### For Development/Testing
✅ Current setup is perfect
✅ Fast, no backend needed
✅ Good for rapid iteration

### For Production/Real Use
✅ Deploy to Railway
✅ Use PostgreSQL
✅ Enable backups
✅ Share between users

---

## Questions?

**Q: Will I lose my current data when I deploy?**
A: No! Your browser data stays in your browser. You can export it and import to PostgreSQL.

**Q: Can I use both at the same time?**
A: Yes! Development uses browser, production uses PostgreSQL. They're separate.

**Q: What if Railway goes down?**
A: Database persists. When Railway comes back, your data is still there. Plus Railway has 99.9% uptime.

**Q: How much does database storage cost?**
A: Railway includes database in free tier ($5 credits/month). For typical use, this is plenty.

**Q: Can I switch back to browser storage later?**
A: Yes, but you'd need to export from PostgreSQL and import to browser (not recommended).

---

**Ready to deploy?** See [RAILWAY_QUICKSTART.md](RAILWAY_QUICKSTART.md)
