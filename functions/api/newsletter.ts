interface Env {
  BREVO_API_KEY?: string
  BREVO_LIST_ID?: string
  SITE_URL?: string
  NEXT_PUBLIC_SITE_URL?: string
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_BODY_BYTES = 2_000 // 2 KB

const DISPOSABLE_DOMAINS = [
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  'throwam.com',
  'yopmail.com',
]

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  if (entry.count >= RATE_LIMIT_MAX) return true
  entry.count++
  return false
}

type PagesContext<TEnv = unknown> = {
  request: Request
  env: TEnv
  params?: Record<string, string | string[]>
  waitUntil?: (promise: Promise<unknown>) => void
}

export async function onRequestPost(context: PagesContext<Env>) {
  const { request, env } = context

  try {
    // ── 1. Body size guard ──────────────────────────────────────────────────
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return Response.json({ success: false, message: 'Request too large.' }, { status: 413 })
    }

    // ── 2. IP rate limiting ─────────────────────────────────────────────────
    const ip =
      request.headers.get('cf-connecting-ip') ??
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      '127.0.0.1'

    if (isRateLimited(ip)) {
      return Response.json(
        {
          success: false,
          message: 'Too many subscription attempts. Please try again later.',
        },
        { status: 429 }
      )
    }

    // ── 3. Parse body ───────────────────────────────────────────────────────
    let body: Record<string, unknown>
    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      return Response.json({ success: false, message: 'Invalid request.' }, { status: 400 })
    }

    const { email, honeypot } = body as { email?: string; honeypot?: string }

    // ── 4. Honeypot ─────────────────────────────────────────────────────────
    if (honeypot) {
      return Response.json({ success: true })
    }

    // ── 5. Email validation ─────────────────────────────────────────────────
    if (!email || typeof email !== 'string') {
      return Response.json({ success: false, message: 'Email is required.' }, { status: 400 })
    }

    const trimmedEmail = email.trim().toLowerCase()

    if (trimmedEmail.length > 254) {
      return Response.json({ success: false, message: 'Invalid email address.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return Response.json({ success: false, message: 'Invalid email format.' }, { status: 400 })
    }

    // ── 6. Disposable domains check ─────────────────────────────────────────
    const emailDomain = trimmedEmail.split('@')[1] ?? ''
    if (DISPOSABLE_DOMAINS.includes(emailDomain)) {
      return Response.json(
        { success: false, message: 'Please use a valid email address.' },
        { status: 400 }
      )
    }

    // ── 7. Env guards ───────────────────────────────────────────────────────
    const apiKey = env.BREVO_API_KEY
    const listId = env.BREVO_LIST_ID

    if (!apiKey || !listId) {
      console.error('[Newsletter Cloudflare Function] Missing Brevo environment variables')
      return Response.json(
        { success: false, message: 'Server configuration error.' },
        { status: 500 }
      )
    }

    // ── 8. Add contact to Brevo list ────────────────────────────────────────
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: trimmedEmail,
        listIds: [parseInt(listId, 10)],
      }),
    })

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { code?: string }

      if (data.code === 'duplicate_parameter') {
        console.log(`[Newsletter Cloudflare Function] Already subscribed: ${trimmedEmail}`)
        return Response.json({ success: true, message: 'already_subscribed' })
      }

      console.error(
        `[Newsletter Cloudflare Function] Brevo ${response.status}:`,
        JSON.stringify(data)
      )
      return Response.json(
        {
          success: false,
          message:
            'We are unable to process newsletter subscriptions at the moment. Please try again later.',
        },
        { status: 502 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('[Newsletter Cloudflare Function] Unhandled error:', error)
    return Response.json({ success: false, message: 'Internal server error.' }, { status: 500 })
  }
}
