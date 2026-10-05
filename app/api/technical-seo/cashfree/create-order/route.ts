import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import {
  createReportAccessToken,
  createScanRecord,
  hashReportAccessToken,
  markCheckoutCancelled,
  markPaymentOrderCreated,
} from '@/lib/technical-seo/scan-repository'
import { createCashfreeOrder, getCashfreeEnvironment } from '@/lib/cashfree/client'
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

export const CASHFREE_QUICK_PLAN_CONFIG = {
  amount: '4999.00',
  maxUrls: CRAWL_LIMITS.quick,
  currency: 'INR' as const,
}

export interface CashfreeCreateOrderDependencies {
  createScanRecord?: typeof createScanRecord
  createCashfreeOrder?: typeof createCashfreeOrder
  markPaymentOrderCreated?: typeof markPaymentOrderCreated
  markCheckoutCancelled?: typeof markCheckoutCancelled
}

export async function handleCashfreeCreateOrder(
  request: Request,
  deps: CashfreeCreateOrderDependencies = {}
) {
  const createScanRecordFn = deps.createScanRecord ?? createScanRecord
  const createCashfreeOrderFn = deps.createCashfreeOrder ?? createCashfreeOrder
  const markPaymentOrderCreatedFn = deps.markPaymentOrderCreated ?? markPaymentOrderCreated
  const markCheckoutCancelledFn = deps.markCheckoutCancelled ?? markCheckoutCancelled

  let scanId: string | null = null

  try {
    let body: Record<string, unknown>

    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 })
    }

    const url = typeof body.url === 'string' ? body.url.trim() : ''
    const problem = typeof body.problem === 'string' ? body.problem : 'unknown'
    const plan = typeof body.plan === 'string' ? body.plan : ''
    const customerPhone = typeof body.customerPhone === 'string' ? body.customerPhone.trim() : ''
    const customerEmail = typeof body.customerEmail === 'string' ? body.customerEmail.trim() : ''

    if (!url) {
      return NextResponse.json({ error: 'Website URL is required.' }, { status: 400 })
    }

    if (!PROBLEMS.has(problem as DiagnosticProblem)) {
      return NextResponse.json({ error: 'Invalid diagnostic problem.' }, { status: 400 })
    }

    if (plan !== 'quick') {
      return NextResponse.json(
        { error: 'Cashfree is currently enabled only for the Targeted Troubleshoot ₹4,999 plan.' },
        { status: 400 }
      )
    }

    const normalizedPhone = customerPhone.replace(/[\s().-]/g, '')
    const indianPhone = normalizedPhone.startsWith('+91')
      ? normalizedPhone.slice(3)
      : normalizedPhone
    if (!/^[6-9]\d{9}$/.test(indianPhone)) {
      return NextResponse.json(
        { error: 'A valid 10-digit Indian mobile number is required for Cashfree checkout.' },
        { status: 400 }
      )
    }

    if (customerEmail && !/^\S+@\S+\.\S+$/.test(customerEmail)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    const accessKey = createReportAccessToken()
    const reportTokenHash = hashReportAccessToken(accessKey)
    scanId = randomUUID()

    const origin = new URL(request.url).origin
    const statusUrl = `/technical-seo/scan/${scanId}/?key=${encodeURIComponent(accessKey)}`
    const returnUrl = `${origin}${statusUrl}&provider=cashfree&order_id={order_id}`
    const notifyUrl = `${origin}/api/technical-seo/cashfree/webhook`

    await createScanRecordFn({
      scanId,
      websiteUrl: url,
      problem: problem as DiagnosticProblem,
      plan: 'quick',
      maxUrls: CASHFREE_QUICK_PLAN_CONFIG.maxUrls,
      accessMode: 'private',
      reportTokenHash,
      paymentStatus: 'pending',
      initialStatus: 'awaiting_payment',
      paymentCurrency: CASHFREE_QUICK_PLAN_CONFIG.currency,
    })

    const orderId = `locitra_${scanId.replace(/-/g, '')}`

    const cashfreeOrder = await createCashfreeOrderFn({
      orderId,
      amount: CASHFREE_QUICK_PLAN_CONFIG.amount,
      scanId,
      returnUrl,
      notifyUrl,
      customerPhone: indianPhone,
      customerEmail: customerEmail || undefined,
    })

    const boundScan = await markPaymentOrderCreatedFn({
      scanId,
      paymentProvider: 'cashfree',
      paymentReference: cashfreeOrder.orderId,
      paymentCurrency: CASHFREE_QUICK_PLAN_CONFIG.currency,
    })

    if (!boundScan) {
      return NextResponse.json(
        { error: 'Failed to bind Cashfree payment order to the scan.' },
        { status: 409 }
      )
    }

    return NextResponse.json({
      scanId,
      status: 'awaiting_payment',
      statusUrl,
      accessKey,
      paymentSessionId: cashfreeOrder.paymentSessionId,
      orderId: cashfreeOrder.orderId,
      cfOrderId: cashfreeOrder.cfOrderId,
      provider: 'cashfree',
      checkoutMode: getCashfreeEnvironment(),
      plan: 'quick',
    })
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : 'Unable to start Cashfree Checkout.'
    const message =
      rawMessage.includes('CASHFREE_CLIENT_SECRET') || rawMessage.includes('CASHFREE_CLIENT_ID')
        ? 'Cashfree configuration error.'
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
  return handleCashfreeCreateOrder(request)
}
