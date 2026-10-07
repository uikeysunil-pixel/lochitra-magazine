import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import {
  createReportAccessToken,
  createScanRecord,
  getDeepScanAuthorizationRecord,
  hashReportAccessToken,
  markCheckoutCancelled,
  markPaymentOrderCreated,
  replacePaymentOrder,
  verifyReportAccessToken,
} from '@/lib/technical-seo/scan-repository'
import {
  createCashfreeOrder,
  getCashfreeEnvironment,
  getCashfreeOrder,
  type CashfreeOrder,
} from '@/lib/cashfree/client'
import {
  CASHFREE_PAID_PLAN_CONFIG,
  isCashfreePaidPlan,
  type CashfreePaidPlan,
} from '@/lib/technical-seo/cashfree-payment'
import type { DiagnosticProblem } from '@/lib/technical-seo/types'
import { INDIA_BILLING_COUNTRY, normalizeBillingCountry } from '@/lib/technical-seo/billing-country'

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

export const CASHFREE_QUICK_PLAN_CONFIG = CASHFREE_PAID_PLAN_CONFIG.quick

export interface CashfreeCreateOrderDependencies {
  createScanRecord?: typeof createScanRecord
  createCashfreeOrder?: typeof createCashfreeOrder
  getCashfreeOrder?: typeof getCashfreeOrder
  markPaymentOrderCreated?: typeof markPaymentOrderCreated
  replacePaymentOrder?: typeof replacePaymentOrder
  markCheckoutCancelled?: typeof markCheckoutCancelled
  getDeepScanAuthorizationRecord?: typeof getDeepScanAuthorizationRecord
  verifyReportAccessToken?: typeof verifyReportAccessToken
}

export async function handleCashfreeCreateOrder(
  request: Request,
  deps: CashfreeCreateOrderDependencies = {}
) {
  const createScanRecordFn = deps.createScanRecord ?? createScanRecord
  const createCashfreeOrderFn = deps.createCashfreeOrder ?? createCashfreeOrder
  const getCashfreeOrderFn = deps.getCashfreeOrder ?? getCashfreeOrder
  const markPaymentOrderCreatedFn = deps.markPaymentOrderCreated ?? markPaymentOrderCreated
  const replacePaymentOrderFn = deps.replacePaymentOrder ?? replacePaymentOrder
  const markCheckoutCancelledFn = deps.markCheckoutCancelled ?? markCheckoutCancelled
  const getDeepScanAuthRecordFn =
    deps.getDeepScanAuthorizationRecord ?? getDeepScanAuthorizationRecord
  const verifyReportAccessTokenFn = deps.verifyReportAccessToken ?? verifyReportAccessToken

  let scanId: string | null = null
  let planForCancellation: string | null = null

  try {
    let body: Record<string, unknown>

    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 })
    }

    const plan = typeof body.plan === 'string' ? body.plan : ''
    planForCancellation = plan
    const customerPhone = typeof body.customerPhone === 'string' ? body.customerPhone.trim() : ''
    const customerEmail = typeof body.customerEmail === 'string' ? body.customerEmail.trim() : ''
    const billingCountry = normalizeBillingCountry(body.billingCountry)

    if (billingCountry !== INDIA_BILLING_COUNTRY) {
      return NextResponse.json(
        { error: 'Cashfree checkout is available only for billing addresses in India.' },
        { status: 400 }
      )
    }

    if (!isCashfreePaidPlan(plan)) {
      return NextResponse.json(
        { error: 'Invalid or unsupported plan for Cashfree checkout.' },
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

    const planConfig = CASHFREE_PAID_PLAN_CONFIG[plan as CashfreePaidPlan]
    const origin = new URL(request.url).origin

    if (plan === 'deep') {
      const scanIdInput = typeof body.scanId === 'string' ? body.scanId.trim() : ''
      const keyInput = typeof body.key === 'string' ? body.key.trim() : ''

      if (!scanIdInput) {
        return NextResponse.json(
          { error: 'scanId is required for Deep plan checkout.' },
          { status: 400 }
        )
      }

      const scan = await getDeepScanAuthRecordFn(scanIdInput)
      if (!scan) {
        return NextResponse.json({ error: 'Scan not found.' }, { status: 404 })
      }

      if (!keyInput || !verifyReportAccessTokenFn(keyInput, scan.report_token_hash)) {
        return NextResponse.json({ error: 'Invalid access key.' }, { status: 403 })
      }

      if (scan.plan !== 'deep') {
        return NextResponse.json({ error: 'Scan plan mismatch.' }, { status: 400 })
      }

      if (scan.status !== 'awaiting_payment') {
        return NextResponse.json(
          { error: `Scan is not awaiting payment (current status: '${scan.status}').` },
          { status: 400 }
        )
      }

      if (!scan.gsc_property || !scan.gsc_property.trim()) {
        return NextResponse.json(
          { error: 'Google Search Console property must be selected before payment.' },
          { status: 400 }
        )
      }

      if (!scan.gsc_refresh_token_encrypted || !scan.gsc_refresh_token_encrypted.trim()) {
        return NextResponse.json(
          { error: 'Google Search Console must be connected before payment.' },
          { status: 400 }
        )
      }

      if (scan.payment_status === 'paid') {
        return NextResponse.json({ error: 'Scan is already paid.' }, { status: 409 })
      }

      if (scan.payment_provider && scan.payment_provider !== 'cashfree') {
        return NextResponse.json(
          { error: 'Payment provider conflict: scan is bound to another payment provider.' },
          { status: 409 }
        )
      }

      const existingScanId = scan.id as string
      scanId = existingScanId
      const statusUrl = `/technical-seo/scan/${existingScanId}/?key=${encodeURIComponent(keyInput)}`
      const returnUrl = `${origin}${statusUrl}&provider=cashfree&order_id={order_id}`
      const notifyUrl = `${origin}/api/technical-seo/cashfree/webhook/`

      if (scan.payment_reference) {
        const orderA = scan.payment_reference
        let existingOrder: CashfreeOrder | null = null

        try {
          existingOrder = await getCashfreeOrderFn(orderA)
        } catch {
          existingOrder = null
        }

        if (
          existingOrder &&
          existingOrder.order_id === orderA &&
          existingOrder.order_status === 'PAID' &&
          Number(existingOrder.order_amount) === planConfig.numericAmount &&
          existingOrder.order_currency === 'INR'
        ) {
          return NextResponse.json({
            scanId: existingScanId,
            status: 'awaiting_payment',
            statusUrl,
            accessKey: keyInput,
            paymentSessionId: existingOrder.payment_session_id,
            orderId: orderA,
            cfOrderId: existingOrder.cf_order_id ?? null,
            provider: 'cashfree',
            checkoutMode: getCashfreeEnvironment(),
            plan: 'deep',
            alreadyApproved: true,
          })
        }

        if (
          existingOrder &&
          existingOrder.order_id === orderA &&
          existingOrder.order_status === 'ACTIVE' &&
          existingOrder.payment_session_id &&
          Number(existingOrder.order_amount) === planConfig.numericAmount &&
          existingOrder.order_currency === 'INR'
        ) {
          return NextResponse.json({
            scanId: existingScanId,
            status: 'awaiting_payment',
            statusUrl,
            accessKey: keyInput,
            paymentSessionId: existingOrder.payment_session_id,
            orderId: orderA,
            cfOrderId: existingOrder.cf_order_id ?? null,
            provider: 'cashfree',
            checkoutMode: getCashfreeEnvironment(),
            plan: 'deep',
          })
        }

        const newOrderId = `locitra_${existingScanId.replace(/-/g, '')}_${Date.now().toString(36)}`
        const newCashfreeOrder = await createCashfreeOrderFn({
          orderId: newOrderId,
          amount: planConfig.amount,
          scanId: existingScanId,
          returnUrl,
          notifyUrl,
          customerPhone: indianPhone,
          customerEmail: customerEmail || undefined,
          plan: 'deep',
        })

        const updatedScan = await replacePaymentOrderFn({
          scanId: existingScanId,
          previousReference: orderA,
          newReference: newCashfreeOrder.orderId,
          paymentCurrency: planConfig.currency,
          paymentProvider: 'cashfree',
        })

        if (!updatedScan) {
          return NextResponse.json(
            {
              error: 'Failed to update payment order. The scan payment state changed concurrently.',
            },
            { status: 409 }
          )
        }

        return NextResponse.json({
          scanId: existingScanId,
          status: 'awaiting_payment',
          statusUrl,
          accessKey: keyInput,
          paymentSessionId: newCashfreeOrder.paymentSessionId,
          orderId: newCashfreeOrder.orderId,
          cfOrderId: newCashfreeOrder.cfOrderId,
          provider: 'cashfree',
          checkoutMode: getCashfreeEnvironment(),
          plan: 'deep',
        })
      }

      const orderId = `locitra_${existingScanId.replace(/-/g, '')}`
      const cashfreeOrder = await createCashfreeOrderFn({
        orderId,
        amount: planConfig.amount,
        scanId: existingScanId,
        returnUrl,
        notifyUrl,
        customerPhone: indianPhone,
        customerEmail: customerEmail || undefined,
        plan: 'deep',
      })

      const boundScan = await markPaymentOrderCreatedFn({
        scanId: existingScanId,
        paymentProvider: 'cashfree',
        paymentReference: cashfreeOrder.orderId,
        paymentCurrency: planConfig.currency,
      })

      if (!boundScan) {
        return NextResponse.json(
          { error: 'Failed to bind Cashfree payment order to the scan.' },
          { status: 409 }
        )
      }

      return NextResponse.json({
        scanId: existingScanId,
        status: 'awaiting_payment',
        statusUrl,
        accessKey: keyInput,
        paymentSessionId: cashfreeOrder.paymentSessionId,
        orderId: cashfreeOrder.orderId,
        cfOrderId: cashfreeOrder.cfOrderId,
        provider: 'cashfree',
        checkoutMode: getCashfreeEnvironment(),
        plan: 'deep',
      })
    }

    const url = typeof body.url === 'string' ? body.url.trim() : ''
    const problem = typeof body.problem === 'string' ? body.problem : 'unknown'

    if (!url) {
      return NextResponse.json({ error: 'Website URL is required.' }, { status: 400 })
    }

    if (!PROBLEMS.has(problem as DiagnosticProblem)) {
      return NextResponse.json({ error: 'Invalid diagnostic problem.' }, { status: 400 })
    }

    const accessKey = createReportAccessToken()
    const reportTokenHash = hashReportAccessToken(accessKey)
    scanId = randomUUID()

    const statusUrl = `/technical-seo/scan/${scanId}/?key=${encodeURIComponent(accessKey)}`
    const returnUrl = `${origin}${statusUrl}&provider=cashfree&order_id={order_id}`
    const notifyUrl = `${origin}/api/technical-seo/cashfree/webhook/`

    await createScanRecordFn({
      scanId,
      websiteUrl: url,
      problem: problem as DiagnosticProblem,
      plan: plan as CashfreePaidPlan,
      maxUrls: planConfig.maxUrls,
      accessMode: 'private',
      reportTokenHash,
      paymentStatus: 'pending',
      initialStatus: 'awaiting_payment',
      paymentCurrency: planConfig.currency,
    })

    const orderId = `locitra_${scanId.replace(/-/g, '')}`

    const cashfreeOrder = await createCashfreeOrderFn({
      orderId,
      amount: planConfig.amount,
      scanId,
      returnUrl,
      notifyUrl,
      customerPhone: indianPhone,
      customerEmail: customerEmail || undefined,
      plan,
    })

    const boundScan = await markPaymentOrderCreatedFn({
      scanId,
      paymentProvider: 'cashfree',
      paymentReference: cashfreeOrder.orderId,
      paymentCurrency: planConfig.currency,
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
      plan,
    })
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : 'Unable to start Cashfree Checkout.'
    const message =
      rawMessage.includes('CASHFREE_CLIENT_SECRET') || rawMessage.includes('CASHFREE_CLIENT_ID')
        ? 'Cashfree configuration error.'
        : rawMessage

    if (scanId && planForCancellation !== 'deep') {
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
