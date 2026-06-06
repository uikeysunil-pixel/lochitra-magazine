/**
 * POST /api/indexnow
 * ──────────────────────────────────────────────────────────────────────────────
 * Submit URLs to IndexNow so Bing (and other IndexNow-participating engines)
 * index new or updated content immediately.
 *
 * SECURITY
 * ────────
 * The endpoint requires the `x-indexnow-secret` header to match the
 * INDEXNOW_SECRET environment variable. This prevents unauthorized parties
 * from triggering submissions (e.g., rate-limit abuse).
 *
 * USAGE
 * ─────
 * 1. Submit the homepage:
 *    curl -X POST https://locitra.com/api/indexnow \
 *      -H "Content-Type: application/json" \
 *      -H "x-indexnow-secret: <your-secret>" \
 *      -d '{}'
 *
 * 2. Submit a new blog post:
 *    curl -X POST https://locitra.com/api/indexnow \
 *      -H "Content-Type: application/json" \
 *      -H "x-indexnow-secret: <your-secret>" \
 *      -d '{"urls": ["https://locitra.com/blog/my-new-post"]}'
 *
 * 3. Submit multiple URLs at once:
 *    curl -X POST https://locitra.com/api/indexnow \
 *      -H "Content-Type: application/json" \
 *      -H "x-indexnow-secret: <your-secret>" \
 *      -d '{"urls": ["https://locitra.com/blog/post-1", "https://locitra.com/blog/post-2"]}'
 *
 * ENVIRONMENT VARIABLES REQUIRED ON VERCEL
 * ─────────────────────────────────────────
 * INDEXNOW_SECRET       — Secret header value to authenticate requests.
 *                         Set this in Vercel → Settings → Environment Variables.
 *                         Any strong random string works (e.g., openssl rand -hex 32).
 * NEXT_PUBLIC_SITE_URL  — (Optional) Override the canonical site URL.
 *                         Defaults to https://locitra.com if not set.
 *
 * VERCEL COMPATIBILITY
 * ────────────────────
 * Uses only the Fetch API (no Node.js-only modules), compatible with both
 * Node.js and Edge runtimes on Vercel.
 */

import { NextRequest, NextResponse } from 'next/server'
import { submitToIndexNow, getSiteUrl } from '@/lib/indexnow'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── 1. Authenticate ──────────────────────────────────────────────────────
  const secret = process.env.INDEXNOW_SECRET

  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'INDEXNOW_SECRET environment variable is not set. ' +
          'Add it in Vercel → Settings → Environment Variables.',
      },
      { status: 503 }
    )
  }

  const providedSecret = request.headers.get('x-indexnow-secret')

  if (!providedSecret || providedSecret !== secret) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized. Provide a valid x-indexnow-secret header.' },
      { status: 401 }
    )
  }

  // ── 2. Parse request body ────────────────────────────────────────────────
  let urls: string[] = []

  try {
    const text = await request.text()
    if (text.trim()) {
      const body = JSON.parse(text)
      if (Array.isArray(body?.urls)) {
        urls = body.urls.filter((u: unknown) => typeof u === 'string' && u.startsWith('http'))
      }
    }
  } catch {
    // Body is optional — if parsing fails, fall through to default (homepage)
  }

  // ── 3. Default to homepage if no URLs provided ───────────────────────────
  if (urls.length === 0) {
    const siteUrl = getSiteUrl()
    urls = [`${siteUrl}/`]
  }

  // ── 4. Validate URL count (IndexNow limit: 10,000 per request) ───────────
  if (urls.length > 10_000) {
    return NextResponse.json(
      { ok: false, error: 'Too many URLs. IndexNow accepts up to 10,000 per request.' },
      { status: 400 }
    )
  }

  // ── 5. Submit to IndexNow ────────────────────────────────────────────────
  const result = await submitToIndexNow(urls)

  const statusCode = result.ok ? 200 : result.status === 429 ? 429 : 502

  return NextResponse.json(result, { status: statusCode })
}

/**
 * GET /api/indexnow → returns usage instructions (no auth required, read-only)
 */
export async function GET(): Promise<NextResponse> {
  const siteUrl = getSiteUrl()
  return NextResponse.json({
    endpoint: `${siteUrl}/api/indexnow`,
    method: 'POST',
    auth: 'x-indexnow-secret header required',
    body: {
      urls: ['(optional) array of absolute URLs to submit; defaults to homepage'],
    },
    example: {
      curl: `curl -X POST ${siteUrl}/api/indexnow -H "Content-Type: application/json" -H "x-indexnow-secret: <your-secret>" -d '{"urls": ["${siteUrl}/blog/your-new-post"]}'`,
    },
    indexNowKey: 'ad4703f4d7314cefb4f019617a45d45e',
    keyFileUrl: `${siteUrl}/ad4703f4d7314cefb4f019617a45d45e.txt`,
  })
}
