import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import {
  createReportAccessToken,
  createScanRecord,
  hashReportAccessToken,
  markCheckoutSessionCreated,
  markCheckoutCancelled,
} from '@/lib/technical-seo/scan-repository'
import { createStripeCheckoutSession, getQuickPriceId } from '@/lib/technical-seo/stripe'
import { CRAWL_LIMITS } from '@/lib/technical-seo/crawler'
import type { DiagnosticProblem } from '@/lib/technical-seo/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PROBLEMS = new Set<DiagnosticProblem>([
  'indexing',
  'traffic-drop',
  'wrong-page',
  'slow',
  'technical',
  'schema',
  'migration',
  'broken-links',
  'duplicates',
  'unknown',
])

export async function POST(request: Request) {
  let scanId: string | null = null

  try {
    const body = (await request.json()) as {
      url?: unknown
      problem?: unknown
      plan?: unknown
    }

    const url = typeof body.url === 'string' ? body.url.trim() : ''
    const problem = typeof body.problem === 'string' ? body.problem : 'unknown'
    const plan = typeof body.plan === 'string' ? body.plan : 'quick'

    if (!url) {
      return NextResponse.json({ error: 'Website URL is required.' }, { status: 400 })
    }

    if (!PROBLEMS.has(problem as DiagnosticProblem)) {
      return NextResponse.json({ error: 'Invalid diagnostic problem.' }, { status: 400 })
    }

    if (plan !== 'quick') {
      return NextResponse.json(
        { error: 'Only the Targeted Troubleshoot $49 plan is enabled in this test build.' },
        { status: 400 }
      )
    }

    const accessKey = createReportAccessToken()
    const scanTokenHash = hashReportAccessToken(accessKey)
    scanId = randomUUID()
    const origin = new URL(request.url).origin
    const statusUrl = `/technical-seo/scan/${scanId}/?key=${encodeURIComponent(accessKey)}`

    await createScanRecord({
      scanId,
      websiteUrl: url,
      problem: problem as DiagnosticProblem,
      plan: 'quick',
      maxUrls: CRAWL_LIMITS.quick,
      accessMode: 'private',
      reportTokenHash: scanTokenHash,
      paymentStatus: 'pending',
      initialStatus: 'awaiting_payment',
    })

    const checkout = await createStripeCheckoutSession({
      priceId: getQuickPriceId(),
      scanId,
      websiteUrl: url,
      problem,
      successUrl: `${origin}${statusUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/technical-seo/?checkout=canceled`,
    })

    await markCheckoutSessionCreated(scanId, checkout.id)

    return NextResponse.json({
      scanId,
      status: 'awaiting_payment',
      statusUrl,
      accessKey,
      checkoutUrl: checkout.url,
      plan: 'quick',
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to start Stripe Checkout.'

    if (scanId) {
      try {
        await markCheckoutCancelled(scanId, message)
      } catch {
        // Preserve the original checkout error.
      }
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
