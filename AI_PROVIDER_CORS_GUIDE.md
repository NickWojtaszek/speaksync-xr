# AI Provider CORS Guide

## ⚠️ Browser Security Limitation

**Most AI APIs cannot be called directly from browsers** due to CORS (Cross-Origin Resource Sharing) security policies.

---

## 🟢 What Works (Client-Side)

### ✅ Google Gemini
- **Status**: Works directly in browser
- **Reason**: Google's SDK has special browser support
- **Setup**: Just add your API key in Settings → AI Configuration
- **Get API Key**: https://makersuite.google.com/app/apikey

### ✅ Local/Custom Endpoints
- **Status**: Works if CORS is configured
- **Reason**: You control the server
- **Setup**:
  1. Run your local AI server
  2. Enable CORS headers on your server
  3. Add endpoint URL in AI Configuration
- **Example**: Self-hosted LLaMA, Mistral, etc.

---

## 🔴 What Doesn't Work (Client-Side)

### ❌ OpenAI GPT
- **Status**: Blocked by browser
- **Error**: `No 'Access-Control-Allow-Origin' header`
- **Reason**: OpenAI's API doesn't allow browser requests
- **Solution**: Requires backend proxy (see below)

### ❌ Anthropic Claude
- **Status**: Blocked by browser
- **Error**: `No 'Access-Control-Allow-Origin' header`
- **Reason**: Anthropic's API doesn't allow browser requests
- **Solution**: Requires backend proxy (see below)

---

## 🛠️ Solutions for OpenAI/Anthropic

### Option 1: Backend Proxy (Recommended for Production)

Create a simple Node.js/Python backend that:
1. Receives requests from your frontend
2. Calls the AI API with your key (server-side)
3. Returns the response to frontend

**Example Node.js Proxy:**
```javascript
// server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/ai/enhance', async (req, res) => {
  const { text, provider, apiKey } = req.body;

  // Call OpenAI, Anthropic, etc. from server
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(req.body)
  });

  const data = await response.json();
  res.json(data);
});

app.listen(3001, () => console.log('Proxy running on port 3001'));
```

Then configure your app to use `http://localhost:3001/api` as a local provider.

### Option 2: Browser Extension (Development Only)

**Not recommended** - Security risk, but useful for testing:

1. Install a CORS extension (Chrome: "CORS Unblock", Firefox: "CORS Everywhere")
2. Enable the extension
3. Try your API call again

**WARNING**: This bypasses browser security. Never use in production.

### Option 3: Use Gemini (Easiest)

Google Gemini works great and is specifically designed to work from browsers. For most use cases, it's the simplest solution.

---

## 🏗️ Architecture Recommendations

### Development (Current Setup)
```
Browser → Google Gemini API ✅
Browser → OpenAI API ❌ (CORS blocked)
Browser → Anthropic API ❌ (CORS blocked)
```

### Production (Recommended)
```
Browser → Your Backend Proxy → OpenAI API ✅
Browser → Your Backend Proxy → Anthropic API ✅
Browser → Your Backend Proxy → Gemini API ✅
```

**Benefits of Backend Proxy:**
- ✅ API keys never exposed to browser
- ✅ Rate limiting and caching on your server
- ✅ Works with all providers
- ✅ Can add authentication, logging, monitoring
- ✅ GDPR/HIPAA compliance easier

---

## 📋 Quick Reference

| Provider | Browser Support | Backend Required | Notes |
|----------|----------------|------------------|-------|
| **Google Gemini** | ✅ Yes | Optional | Best for client-side apps |
| **OpenAI GPT** | ❌ No | Required | CORS blocked |
| **Anthropic Claude** | ❌ No | Required | CORS blocked |
| **Local/Custom** | ✅ Yes* | No | *If CORS enabled on server |

---

## 🔧 For Developers: Why CORS Exists

CORS is a browser security feature that prevents malicious websites from:
- Stealing API keys from your JavaScript code
- Making unauthorized requests to APIs
- Accessing sensitive data from other domains

**The problem with client-side AI calls:**
1. Your API key is visible in browser DevTools
2. Anyone can extract it and use it
3. Could lead to unauthorized charges on your account

**The solution:**
- Keep API keys on your backend server
- Browser → Backend (your domain) ✅ No CORS issue
- Backend → AI API (with secret key) ✅ Secure

---

## ✅ Current Recommendation

**For this development version:**
- Use **Google Gemini** - it works great in browsers
- Get a free API key: https://makersuite.google.com/app/apikey
- Configure in Settings → AI Configuration
- Enable and set as default

**For production:**
- Implement a backend proxy
- Store API keys server-side
- Use any provider you want

---

## 🆘 Troubleshooting

### Error: "No enabled AI providers found"
- Go to Settings → Manage AI Providers
- Make sure the toggle is green (Enabled)
- Check that it's set as Default

### Error: "Access to fetch... has been blocked by CORS"
- You're trying to use OpenAI or Anthropic
- These don't work in browsers
- Use Gemini instead, or set up a backend proxy

### Provider test fails
- Check your API key is correct
- For Gemini: Make sure API is enabled in Google Cloud
- For Local: Make sure server is running and CORS is enabled

---

**Need help?** This is a known browser limitation, not a bug in the application.
