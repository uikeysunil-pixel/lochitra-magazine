# IndexNow for Locitra

IndexNow lets Bing (and other participating search engines) know about new or
updated pages **instantly**, without waiting for the next scheduled crawl.

## How It Works

1. You publish or update an article on Locitra.
2. You call `POST /api/indexnow` with the URL of the new/updated post.
3. Bing receives the URL and re-crawls it within minutes to hours.

---

## Setup (One-Time, Already Done)

| Item | Status |
|------|--------|
| Key file at `https://locitra.com/ad4703f4d7314cefb4f019617a45d45e.txt` | ✅ Exists |
| API route at `/api/indexnow` | ✅ Created |
| IndexNow key: `ad4703f4d7314cefb4f019617a45d45e` | ✅ Configured |

---

## Required Vercel Environment Variables

Add these in **Vercel → Project → Settings → Environment Variables**:

| Variable | Value | Required |
|----------|-------|----------|
| `INDEXNOW_SECRET` | Any strong random string (e.g., `openssl rand -hex 32`) | ✅ Required |
| `NEXT_PUBLIC_SITE_URL` | `https://locitra.com` | Recommended |

> ⚠️ **Never commit `INDEXNOW_SECRET` to git.** Keep it only in Vercel's environment variable settings and your local `.env.local`.

To generate a strong secret:
```bash
# On Mac/Linux/WSL:
openssl rand -hex 32

# Or use any random string generator — it just needs to be hard to guess.
```

Then add to your local `.env.local` (already git-ignored):
```
INDEXNOW_SECRET=your_generated_secret_here
NEXT_PUBLIC_SITE_URL=https://locitra.com
```

---

## How to Trigger IndexNow Manually

### Submit the Homepage
```bash
curl -X POST https://locitra.com/api/indexnow \
  -H "Content-Type: application/json" \
  -H "x-indexnow-secret: YOUR_SECRET_HERE" \
  -d '{}'
```

### Submit a New Blog Post
```bash
curl -X POST https://locitra.com/api/indexnow \
  -H "Content-Type: application/json" \
  -H "x-indexnow-secret: YOUR_SECRET_HERE" \
  -d '{"urls": ["https://locitra.com/blog/your-new-post-slug"]}'
```

### Submit Multiple URLs at Once
```bash
curl -X POST https://locitra.com/api/indexnow \
  -H "Content-Type: application/json" \
  -H "x-indexnow-secret: YOUR_SECRET_HERE" \
  -d '{
    "urls": [
      "https://locitra.com/blog/post-slug-1",
      "https://locitra.com/blog/post-slug-2",
      "https://locitra.com/"
    ]
  }'
```

### Check the Endpoint Documentation (No Auth Needed)
```bash
curl https://locitra.com/api/indexnow
```

---

## After Publishing a New Article

1. Copy the slug from your new `.mdx` file (e.g., `my-ai-tools-guide`).
2. Run this command (replace the slug and secret):
   ```bash
   curl -X POST https://locitra.com/api/indexnow \
     -H "Content-Type: application/json" \
     -H "x-indexnow-secret: YOUR_SECRET_HERE" \
     -d '{"urls": ["https://locitra.com/blog/my-ai-tools-guide"]}'
   ```
3. Expect a `{"ok":true,"submitted":1,...}` response.
4. Bing typically re-crawls the URL within a few minutes to a few hours.

---

## Expected API Responses

| Response | Meaning |
|----------|---------|
| `{"ok": true, "submitted": 1, ...}` | ✅ Successfully submitted |
| `{"ok": false, "error": "Unauthorized"}` | ❌ Wrong or missing `x-indexnow-secret` |
| `{"ok": false, "status": 429}` | ⚠️ Rate limited by IndexNow — wait and retry |
| `{"ok": false, "status": 422}` | ⚠️ Invalid URL format (check URL is absolute with https://) |
| `{"ok": false, "error": "INDEXNOW_SECRET not set"}` | ❌ Add the env variable to Vercel |

---

## Architecture

```
app/
  api/
    indexnow/
      route.ts   ← POST/GET handler (auth + input validation)
lib/
  indexnow.ts    ← Reusable utility (key, endpoint, fetch logic)
public/
  ad4703f4d7314cefb4f019617a45d45e.txt  ← Key verification file (existing)
```

---

## IndexNow Key Details

- **Key**: `ad4703f4d7314cefb4f019617a45d45e`
- **Key URL**: `https://locitra.com/ad4703f4d7314cefb4f019617a45d45e.txt`
- **Endpoint**: `https://api.indexnow.org/indexnow`
- **Spec**: https://www.indexnow.org/documentation
