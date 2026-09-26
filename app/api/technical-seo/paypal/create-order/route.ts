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

export type SupportedPaidPlan = 'quick' | 'full'

export const PAYPAL_PAID_PLAN_CONFIG: Record<
  SupportedPaidPlan,
  {
    amount: string
    maxUrls: number
    currency: 'USD'
  }
> = {
  quick: {
    amount: '49.00',
    maxUrls: CRAWL_LIMITS.quick,
    currency: 'USD',
  },
  full: {
    amount: '99.00',
    maxUrls: CRAWL_LIMITS.full,
    currency: 'USD',
  },
}

export interface CreateOrderDependencies {
  createScanRecord?: typeof createScanRecord
  createPayPalOrder?: typeof createPayPalOrder
  markPaymentOrderCreated?: typeof markPaymentOrderCreated
  markCheckoutCancelled?: typeof markCheckoutCancelled
}

export async function handleCreateOrder(request: Request, deps: CreateOrderDependencies = {}) {
  const createScanRecordFn = deps.createScanRecord ?? createScanRecord
  const createPayPalOrderFn = deps.createPayPalOrder ?? createPayPalOrder
  const markPaymentOrderCreatedFn = deps.markPaymentOrderCreated ?? markPaymentOrderCreated
  const markCheckoutCancelledFn = deps.markCheckoutCancelled ?? markCheckoutCancelled

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
    const plan = typeof body.plan === 'string' ? body.plan : ''

    if (!url) {
      return NextResponse.json({ error: 'Website URL is required.' }, { status: 400 })
    }

    if (!PROBLEMS.has(problem as DiagnosticProblem)) {
      return NextResponse.json({ error: 'Invalid diagnostic problem.' }, { status: 400 })
    }

    if (plan !== 'quick' && plan !== 'full') {
      return NextResponse.json(
        {
          error:
            'Only the Targeted Troubleshoot ($49) and Full Troubleshoot ($99) plans are available for paid checkout.',
        },
        { status: 400 }
      )
    }

    const planConfig = PAYPAL_PAID_PLAN_CONFIG[plan as SupportedPaidPlan]

    const accessKey = createReportAccessToken()
    const scanTokenHash = hashReportAccessToken(accessKey)
    scanId = randomUUID()
    const origin = new URL(request.url).origin
    const statusUrl = `/technical-seo/scan/${scanId}/?key=${encodeURIComponent(accessKey)}`
    const returnUrl = `${origin}${statusUrl}&provider=paypal`
    const cancelUrl = `${origin}/technical-seo/cancelled/`

    await createScanRecordFn({
      scanId,
      websiteUrl: url,
      problem: problem as DiagnosticProblem,
      plan: plan as SupportedPaidPlan,
      maxUrls: planConfig.maxUrls,
      accessMode: 'private',
      reportTokenHash: scanTokenHash,
      paymentStatus: 'pending',
      initialStatus: 'awaiting_payment',
      paymentCurrency: planConfig.currency,
    })

    const { orderId, approvalUrl } = await createPayPalOrderFn({
      amount: planConfig.amount,
      scanId,
      returnUrl,
      cancelUrl,
    })

    await markPaymentOrderCreatedFn({
      scanId,
      paymentProvider: 'paypal',
      paymentReference: orderId,
      paymentCurrency: planConfig.currency,
    })

    return NextResponse.json({
      scanId,
      status: 'awaiting_payment',
      statusUrl,
      accessKey,
      checkoutUrl: approvalUrl,
      provider: 'paypal',
      orderId,
      plan,
    })
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : 'Unable to start PayPal Checkout.'
    const message = rawMessage.includes('PAYPAL_CLIENT_SECRET')
      ? 'PayPal configuration error.'
      : rawMessage

    if (scanId) {
      try {
        await markCheckoutCancelledFn(scanId, message)
      } catch {
        // Preserve the original checkout error.
      }
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return handleCreateOrder(request)
}
