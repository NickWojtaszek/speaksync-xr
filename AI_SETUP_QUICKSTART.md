# AI Configuration Quick Start

## 🚀 Get Started in 3 Steps

### Step 1: Get a Google Gemini API Key
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your key

### Step 2: Configure in App
1. Open the app
2. Go to **Settings** (gear icon)
3. Scroll to **AI Configuration** section
4. Click **"Manage AI Providers"**
5. Click **"Google Gemini"** button
6. Paste your API key
7. **Model** should be: `gemini-1.5-flash` (default)
8. Click **"Save Provider"**

### Step 3: Test It!
1. Go back to the main editor
2. Type some medical report text
3. Click the **✨ Enhance with AI** button
4. Watch your text get improved!

---

## ⚠️ Important: Browser Limitations

**Only Google Gemini works directly in browsers.**

- ✅ **Google Gemini** - Works perfectly
- ❌ **OpenAI GPT** - Blocked by browsers (CORS)
- ❌ **Anthropic Claude** - Blocked by browsers (CORS)

For OpenAI/Anthropic, you need a backend server. See `AI_PROVIDER_CORS_GUIDE.md` for details.

---

## 🆘 Troubleshooting

### "No enabled AI providers found"
- Make sure you clicked "Save Provider"
- Check the provider toggle is green (Enabled)
- Refresh the page

### "Access to fetch... blocked by CORS"
- You tried to use OpenAI or Anthropic
- Use Google Gemini instead (works in browsers)
- Or set up a backend proxy (see CORS guide)

### API Key Invalid
- Double-check you copied the complete key
- Make sure API is enabled in Google Cloud Console
- Try generating a new key

---

## 📚 More Information

- **Full CORS Guide**: See `AI_PROVIDER_CORS_GUIDE.md`
- **Implementation Details**: See `IMPLEMENTATION_PROGRESS.md`
- **Security Notes**: See `SECURITY_P0_ISSUES.md`

---

**Ready to go!** Google Gemini is fast, powerful, and works great in browsers.
