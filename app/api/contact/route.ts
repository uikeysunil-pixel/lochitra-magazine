import { NextRequest, NextResponse } from 'next/server'

// ── In-memory rate limiter (IP → { count, resetAt }) ─────────────────────────
// Uses a simple sliding window without an external Redis dependency.
// For production at scale, replace with @upstash/ratelimit + @upstash/redis.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT_MAX = 5 // max submissions
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // per 1 hour
const MAX_BODY_BYTES = 12_000 // 12 KB hard cap

/** Field character limits (FTC / anti-abuse) */
const FIELD_LIMITS: Record<string, number> = {
  name: 100,
  email: 254,
  subject: 200,
  reason: 100,
  message: 5_000,
}

/** Minimal HTML-entity escaper — prevents injection into admin email body */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://locitra.com'
    const isProd = process.env.NODE_ENV === 'production'
    if (isProd && origin && !origin.startsWith(siteUrl)) {
      return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 })
    }

    // ── 3. IP rate limiting ─────────────────────────────────────────────────
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      '127.0.0.1'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, message: 'Too many submissions. Please try again later.' },
        { status: 429 }
      )
    }

    // ── 4. Parse body ───────────────────────────────────────────────────────
    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid request body.' },
        { status: 400 }
      )
    }

    const { name, email, subject, reason, message, botField } = body as Record<string, string>

    // ── 5. Honeypot ─────────────────────────────────────────────────────────
    if (botField) {
      // Silently succeed — deceives bots without revealing detection
      return NextResponse.json({ success: true })
    }

    // ── 6. Required field validation ────────────────────────────────────────
    if (!name || !email || !subject || !reason || !message) {
      return NextResponse.json(
        { success: false, message: 'All fields are required.' },
        { status: 400 }
      )
    }

    // ── 7. Type checks ──────────────────────────────────────────────────────
    const fields = { name, email, subject, reason, message }
    for (const [key, val] of Object.entries(fields)) {
      if (typeof val !== 'string') {
        return NextResponse.json(
          { success: false, message: `Invalid value for ${key}.` },
          { status: 400 }
        )
      }
    }

    // ── 8. Field length limits ──────────────────────────────────────────────
    for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
      const val = (body[field] as string | undefined) ?? ''
      if (val.length > limit) {
        return NextResponse.json(
          { success: false, message: `${field} exceeds maximum length of ${limit} characters.` },
          { status: 400 }
        )
      }
    }

    // ── 9. Email format validation ──────────────────────────────────────────
    const trimmedEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format.' },
        { status: 400 }
      )
    }

    // ── 10. Sanitize all string inputs (HTML injection prevention) ──────────
    const safeName = escapeHtml(name.trim())
    const safeSubject = escapeHtml(subject.trim())
    const safeReason = escapeHtml(reason.trim())
    const safeMessage = escapeHtml(message.trim())

    // ── 11. Env var guards ──────────────────────────────────────────────────
    const apiKey = process.env.BREVO_API_KEY
    const adminEmail = process.env.ADMIN_EMAIL ?? 'uikeysunil@gmail.com'
    const ccEmail = process.env.CONTACT_CC_EMAIL ?? 'contact@locitra.com'

    if (!apiKey) {
      console.error('[Contact API] Missing BREVO_API_KEY')
      return NextResponse.json(
        { success: false, message: 'Server configuration error.' },
        { status: 500 }
      )
    }

    // ── 12. Send email to admin ─────────────────────────────────────────────
    const adminEmailPayload = {
      sender: { name: 'Locitra Contact Form', email: 'newsletter@locitra.com' },
      to: [{ email: adminEmail, name: 'Locitra Admin' }],
      cc: [{ email: ccEmail, name: 'Locitra Contact' }],
      replyTo: { email: trimmedEmail, name: safeName },
      subject: `[Locitra Contact] ${safeSubject}`,
      htmlContent: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${trimmedEmail}</p>
        <p><strong>Reason:</strong> ${safeReason}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap; font-family: monospace; background: #f9f9f9; padding: 12px; border-radius: 4px;">${safeMessage}</p>
        <hr />
        <p><small>Submitted: ${new Date().toISOString()} | IP: ${ip}</small></p>
      `,
    }

    const adminResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(adminEmailPayload),
    })

    if (!adminResponse.ok) {
      const errorData = await adminResponse.json().catch(() => ({}))
      console.error('[Contact API] Brevo admin email error:', errorData)
      return NextResponse.json(
        { success: false, message: 'Failed to send message. Please try again later.' },
        { status: 500 }
      )
    }

    // ── 13. Auto-reply to visitor ───────────────────────────────────────────
    const visitorEmailPayload = {
      sender: { name: 'Sunil from Locitra', email: 'newsletter@locitra.com' },
      to: [{ email: trimmedEmail, name: safeName }],
      subject: "We've received your message — Locitra",
      htmlContent: `
        <p>Hi ${safeName},</p>
        <p>Thank you for reaching out to Locitra. We have received your message and will respond as soon as possible.</p>
        <br />
        <p>— Sunil Kumar<br />
        Founder &amp; Editor, Locitra<br />
        <a href="https://locitra.com">https://locitra.com</a></p>
      `,
    }

    // Auto-reply failure is non-fatal — log but don't block success response
    fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(visitorEmailPayload),
    })
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}))
          console.warn('[Contact API] Auto-reply failed (non-fatal):', d)
        }
      })
      .catch((err) => console.warn('[Contact API] Auto-reply network error (non-fatal):', err))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Contact API] Unhandled error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 })
  }
}
