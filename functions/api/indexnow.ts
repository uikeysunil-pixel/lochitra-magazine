interface Env {
  INDEXNOW_SECRET?: string
  SITE_URL?: string
  NEXT_PUBLIC_SITE_URL?: string
}

const INDEXNOW_KEY = 'ad4703f4d7314cefb4f019617a45d45e'
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

function getSiteUrl(env: Env): string {
  return (env.NEXT_PUBLIC_SITE_URL || env.SITE_URL || 'https://www.locitra.com').replace(/\/$/, '')
}

type PagesContext<TEnv = unknown> = {
  request: Request
  env: TEnv
  params?: Record<string, string | string[]>
  waitUntil?: (promise: Promise<unknown>) => void
}

export async function onRequestGet(context: PagesContext<Env>) {
  const siteUrl = getSiteUrl(context.env)
  return Response.json({
    endpoint: `${siteUrl}/api/indexnow`,
    method: 'POST',
    auth: 'x-indexnow-secret header required',
    body: {
      urls: ['(optional) array of absolute URLs to submit; defaults to homepage'],
    },
    example: {
      curl: `curl -X POST ${siteUrl}/api/indexnow -H "Content-Type: application/json" -H "x-indexnow-secret: <your-secret>" -d '{"urls": ["${siteUrl}/blog/your-new-post"]}'`,
    },
    indexNowKey: INDEXNOW_KEY,
    keyFileUrl: `${siteUrl}/${INDEXNOW_KEY}.txt`,
  })
}

export async function onRequestPost(context: PagesContext<Env>) {
  const { request, env } = context

  // ── 1. Authenticate ──────────────────────────────────────────────────────
  const secret = env.INDEXNOW_SECRET

  if (!secret) {
    return Response.json(
      {
        ok: false,
        error: 'INDEXNOW_SECRET environment variable is not set in Cloudflare.',
      },
      { status: 503 }
    )
  }

  const providedSecret = request.headers.get('x-indexnow-secret')

  if (!providedSecret || providedSecret !== secret) {
    return Response.json(
      { ok: false, error: 'Unauthorized. Provide a valid x-indexnow-secret header.' },
      { status: 401 }
    )
  }

  // ── 2. Parse request body ────────────────────────────────────────────────
  let urls: string[] = []

  try {
    const text = await request.text()
    if (text.trim()) {
      const body = JSON.parse(text) as { urls?: unknown[] }
      if (Array.isArray(body?.urls)) {
        urls = body.urls.filter(
          (u: unknown): u is string => typeof u === 'string' && u.startsWith('http')
        )
      }
    }
  } catch {
    // Body is optional
  }

  // ── 3. Default to homepage if no URLs provided ───────────────────────────
  const siteUrl = getSiteUrl(env)
  if (urls.length === 0) {
    urls = [`${siteUrl}/`]
  }

  // ── 4. Validate URL count ────────────────────────────────────────────────
  if (urls.length > 10_000) {
    return Response.json(
      { ok: false, error: 'Too many URLs. IndexNow accepts up to 10,000 per request.' },
      { status: 400 }
    )
  }

  // ── 5. Submit to IndexNow ────────────────────────────────────────────────
  const host = new URL(siteUrl).host
  const payload = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `${siteUrl}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  }

  try {
    const indexNowRes = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    })

    const ok = indexNowRes.status === 200 || indexNowRes.status === 202
    const result = {
      ok,
      status: indexNowRes.status,
      submitted: ok ? urls.length : 0,
      urls,
      ...(!ok && { error: `IndexNow API returned HTTP ${indexNowRes.status}` }),
    }

    const statusCode = ok ? 200 : indexNowRes.status === 429 ? 429 : 502
    return Response.json(result, { status: statusCode })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json(
      {
        ok: false,
        submitted: 0,
        urls,
        error: `Fetch failed: ${message}`,
      },
      { status: 502 }
    )
  }
}
