interface Env {
  BREVO_API_KEY?: string
  ADMIN_EMAIL?: string
  CONTACT_CC_EMAIL?: string
  SITE_URL?: string
  NEXT_PUBLIC_SITE_URL?: string
}

// In-memory rate limiter per worker instance
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_BODY_BYTES = 12_000 // 12 KB

const FIELD_LIMITS: Record<string, number> = {
  name: 100,
  email: 254,
  subject: 200,
  reason: 100,
  message: 5_000,
}

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

type PagesContext<TEnv = unknown> = {
  request: Request
  env: TEnv
  params?: Record<string, string | string[]>
  waitUntil?: (promise: Promise<unknown>) => void
}

export async function onRequestPost(context: PagesContext<Env>) {
  const { request, env, waitUntil } = context

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
        { success: false, message: 'Too many submissions. Please try again later.' },
        { status: 429 }
      )
    }

    // ── 3. Parse body ───────────────────────────────────────────────────────
    let body: Record<string, unknown>
    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      return Response.json({ success: false, message: 'Invalid request body.' }, { status: 400 })
    }

    const { name, email, subject, reason, message, botField } = body as Record<string, string>

    // ── 4. Honeypot ─────────────────────────────────────────────────────────
    if (botField) {
      return Response.json({ success: true })
    }

    // ── 5. Required fields ──────────────────────────────────────────────────
    if (!name || !email || !subject || !reason || !message) {
      return Response.json({ success: false, message: 'All fields are required.' }, { status: 400 })
    }

    // ── 6. Type checks ──────────────────────────────────────────────────────
    const fields = { name, email, subject, reason, message }
    for (const [key, val] of Object.entries(fields)) {
      if (typeof val !== 'string') {
        return Response.json(
          { success: false, message: `Invalid value for ${key}.` },
          { status: 400 }
        )
      }
    }

    // ── 7. Field length limits ──────────────────────────────────────────────
    for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
      const val = (body[field] as string | undefined) ?? ''
      if (val.length > limit) {
        return Response.json(
          { success: false, message: `${field} exceeds maximum length of ${limit} characters.` },
          { status: 400 }
        )
      }
    }

    // ── 8. Email validation ─────────────────────────────────────────────────
    const trimmedEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return Response.json({ success: false, message: 'Invalid email format.' }, { status: 400 })
    }

    // ── 9. Sanitize strings ─────────────────────────────────────────────────
    const safeName = escapeHtml(name.trim())
    const safeSubject = escapeHtml(subject.trim())
    const safeReason = escapeHtml(reason.trim())
    const safeMessage = escapeHtml(message.trim())

    // ── 10. Env guards ──────────────────────────────────────────────────────
    const apiKey = env.BREVO_API_KEY
    const adminEmail = env.ADMIN_EMAIL ?? 'uikeysunil@gmail.com'
    const ccEmail = env.CONTACT_CC_EMAIL ?? 'contact@locitra.com'

    if (!apiKey) {
      console.error('[Contact Cloudflare Function] Missing BREVO_API_KEY')
      return Response.json(
        { success: false, message: 'Server configuration error.' },
        { status: 500 }
      )
    }

    // ── 11. Send admin email via Brevo ──────────────────────────────────────
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
      console.error('[Contact Cloudflare Function] Brevo admin email error:', errorData)
      return Response.json(
        { success: false, message: 'Failed to send message. Please try again later.' },
        { status: 500 }
      )
    }

    // ── 12. Auto-reply to visitor (non-blocking) ────────────────────────────
    const visitorEmailPayload = {
      sender: { name: 'Sunil Kumar Uikey from Locitra', email: 'newsletter@locitra.com' },
      to: [{ email: trimmedEmail, name: safeName }],
      subject: "We've received your message — Locitra",
      htmlContent: `
        <p>Hi ${safeName},</p>
        <p>Thank you for reaching out to Locitra. We have received your message and will respond as soon as possible.</p>
        <br />
        <p>— Sunil Kumar Uikey<br />
        Founder &amp; Editor, Locitra<br />
        <a href="https://www.locitra.com">https://www.locitra.com</a></p>
      `,
    }

    const autoReplyPromise = fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(visitorEmailPayload),
    }).catch((err) => {
      console.warn('[Contact Cloudflare Function] Auto-reply failed (non-fatal):', err)
    })

    if (waitUntil) {
      waitUntil(autoReplyPromise)
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('[Contact Cloudflare Function] Unhandled error:', error)
    return Response.json({ success: false, message: 'Internal server error.' }, { status: 500 })
  }
}
