import { NextRequest, NextResponse } from 'next/server'

// ── In-memory rate limiter (no external dependency required) ──────────────────
// For production at scale, swap for @upstash/ratelimit + @upstash/redis.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT_MAX = 3 // stricter than contact form
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour per IP
const MAX_BODY_BYTES = 2_000 // 2 KB — email only needed

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

export async function POST(req: NextRequest) {
  try {
    // ── 1. Body size guard ──────────────────────────────────────────────────
    const contentLength = req.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false, message: 'Request too large.' }, { status: 413 })
    }

    // ── 2. CSRF / Origin check ──────────────────────────────────────────────
    const origin = req.headers.get('origin') ?? ''
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://locitra.com').replace(/\/$/, '')
    const isProd = process.env.NODE_ENV === 'production'
    if (isProd && origin) {
      // Normalize both to strip www so that www.locitra.com === locitra.com
      const normalizeOrigin = (o: string) => o.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
      const allowedHost = normalizeOrigin(siteUrl)
      const requestHost = normalizeOrigin(origin)
      if (requestHost !== allowedHost) {
        console.warn(
          `[Newsletter API] CSRF origin blocked — origin: "${origin}", expected host: "${allowedHost}"`
        )
        return NextResponse.json(
          { success: false, message: 'Request origin not allowed.' },
          { status: 403 }
        )
      }
    }

    // ── 3. IP rate limiting ─────────────────────────────────────────────────
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      '127.0.0.1'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many subscription attempts. Please try again later.',
        },
        { status: 429 }
      )
    }

    // ── 4. Parse body ───────────────────────────────────────────────────────
    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid request.' }, { status: 400 })
    }

    const { email, honeypot } = body as { email?: string; honeypot?: string }

    // ── 5. Honeypot (anti-bot field — hidden in UI, filled only by bots) ────
    if (honeypot) {
      // Return fake success — bots don't know they were caught
      return NextResponse.json({ success: true })
    }

    // ── 6. Email validation ─────────────────────────────────────────────────
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Email is required.' }, { status: 400 })
    }

    const trimmedEmail = email.trim().toLowerCase()

    if (trimmedEmail.length > 254) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format.' },
        { status: 400 }
      )
    }

    // ── 7. Block obviously disposable domains (basic list) ──────────────────
    const disposableDomains = [
      'mailinator.com',
      'guerrillamail.com',
      'tempmail.com',
      'throwam.com',
      'yopmail.com',
    ]
    const emailDomain = trimmedEmail.split('@')[1] ?? ''
    if (disposableDomains.includes(emailDomain)) {
      return NextResponse.json(
        { success: false, message: 'Please use a valid email address.' },
        { status: 400 }
      )
    }

    // ── 8. Env var guards ───────────────────────────────────────────────────
    const apiKey = process.env.BREVO_API_KEY
    const listId = process.env.BREVO_LIST_ID

    if (!apiKey || !listId) {
      console.error('[Newsletter API] Missing Brevo environment variables')
      return NextResponse.json(
        { success: false, message: 'Server configuration error.' },
        { status: 500 }
      )
    }

    // ── 9. Add contact to Brevo list ────────────────────────────────────────
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: trimmedEmail,
        listIds: [parseInt(listId, 10)],
        // updateEnabled: false — do NOT update existing contacts (prevents re-opt-in abuse)
      }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))

      // Brevo returns 'duplicate_parameter' when contact already exists in the list
      if (data.code === 'duplicate_parameter') {
        console.log(`[Newsletter API] Already subscribed: ${trimmedEmail}`)
        return NextResponse.json({ success: true, message: 'already_subscribed' })
      }

      console.error('[Newsletter API] Brevo error:', JSON.stringify(data))
      return NextResponse.json(
        {
          success: false,
          message:
            data.message || `Subscription failed (Brevo ${response.status}). Please try again.`,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Newsletter API] Unhandled error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 })
  }
}
