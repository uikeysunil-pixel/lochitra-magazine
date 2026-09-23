import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import {
  createReportAccessToken,
  createScanRecord,
  hashReportAccessToken,
  markCheckoutCancelled,
  markPaymentOrderCreated,
} from '@/lib/technical-seo/scan-repository'
import { createPayPalOrder } from '@/lib/paypal/orders'
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
    let body: {
      url?: unknown
      problem?: unknown
      plan?: unknown
    }

    try {
      body = (await request.json()) as {
        url?: unknown
        problem?: unknown
        plan?: unknown
      }
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 })
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
    const returnUrl = `${origin}${statusUrl}&provider=paypal`
    const cancelUrl = `${origin}/technical-seo/?checkout=canceled&provider=paypal`

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
      paymentCurrency: 'USD',
    })

    const { orderId, approvalUrl } = await createPayPalOrder({
      amount: '49.00',
      scanId,
      returnUrl,
      cancelUrl,
    })

    await markPaymentOrderCreated({
      scanId,
      paymentProvider: 'paypal',
      paymentReference: orderId,
      paymentCurrency: 'USD',
    })

    return NextResponse.json({
      scanId,
      status: 'awaiting_payment',
      statusUrl,
      accessKey,
      checkoutUrl: approvalUrl,
      provider: 'paypal',
      orderId,
      plan: 'quick',
    })
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : 'Unable to start PayPal Checkout.'
    const message = rawMessage.includes('PAYPAL_CLIENT_SECRET')
      ? 'PayPal configuration error.'
      : rawMessage

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
