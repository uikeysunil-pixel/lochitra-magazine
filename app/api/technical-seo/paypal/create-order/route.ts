import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import {
  createReportAccessToken,
  createScanRecord,
  getDeepScanAuthorizationRecord,
  getScanRecord,
  hashReportAccessToken,
  markCheckoutCancelled,
  markPaymentOrderCreated,
  replacePaymentOrder,
  verifyReportAccessToken,
} from '@/lib/technical-seo/scan-repository'
import { createPayPalOrder, getPayPalOrder } from '@/lib/paypal/orders'
import { OrderStatus, type Order } from '@paypal/paypal-server-sdk'
import { CRAWL_LIMITS } from '@/lib/technical-seo/crawler'
import type { DiagnosticProblem } from '@/lib/technical-seo/types'
import {
  isInternationalBillingCountry,
  normalizeBillingCountry,
} from '@/lib/technical-seo/billing-country'

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

export type SupportedPaidPlan = 'quick' | 'full' | 'deep'

export const PAYPAL_PAID_PLAN_CONFIG: Record<
  SupportedPaidPlan,
  {
    amount: string
    maxUrls: number
    currency: 'USD'
  }
> = {
  quick: {
    amount: '39.00',
    maxUrls: CRAWL_LIMITS.quick,
    currency: 'USD',
  },
  full: {
    amount: '79.00',
    maxUrls: CRAWL_LIMITS.full,
    currency: 'USD',
  },
  deep: {
    amount: '159.00',
    maxUrls: CRAWL_LIMITS.deep,
    currency: 'USD',
  },
}

export interface CreateOrderDependencies {
  createScanRecord?: typeof createScanRecord
  createPayPalOrder?: typeof createPayPalOrder
  getPayPalOrder?: typeof getPayPalOrder
  markPaymentOrderCreated?: typeof markPaymentOrderCreated
  replacePaymentOrder?: typeof replacePaymentOrder
  markCheckoutCancelled?: typeof markCheckoutCancelled
  getScanRecord?: typeof getScanRecord
  getDeepScanAuthorizationRecord?: typeof getDeepScanAuthorizationRecord
  verifyReportAccessToken?: typeof verifyReportAccessToken
}

export async function handleCreateOrder(request: Request, deps: CreateOrderDependencies = {}) {
  const createScanRecordFn = deps.createScanRecord ?? createScanRecord
  const createPayPalOrderFn = deps.createPayPalOrder ?? createPayPalOrder
  const getPayPalOrderFn = deps.getPayPalOrder ?? getPayPalOrder
  const markPaymentOrderCreatedFn = deps.markPaymentOrderCreated ?? markPaymentOrderCreated
  const replacePaymentOrderFn = deps.replacePaymentOrder ?? replacePaymentOrder
  const markCheckoutCancelledFn = deps.markCheckoutCancelled ?? markCheckoutCancelled
  const getScanRecordFn = deps.getScanRecord ?? getScanRecord
  const getDeepScanAuthRecordFn =
    deps.getDeepScanAuthorizationRecord ??
    (deps.getScanRecord
      ? (deps.getScanRecord as unknown as typeof getDeepScanAuthorizationRecord)
      : getDeepScanAuthorizationRecord)
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

    if (plan === 'deep') {
      const billingCountry = normalizeBillingCountry(body.billingCountry)
      if (!isInternationalBillingCountry(billingCountry)) {
        return NextResponse.json(
          {
            error:
              'PayPal checkout is available for international billing countries. For India, use the Targeted Troubleshoot plan in INR.',
          },
          { status: 400 }
        )
      }

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

      if (scan.payment_provider && scan.payment_provider !== 'paypal') {
        return NextResponse.json(
          { error: 'Payment provider conflict: scan is bound to another payment provider.' },
          { status: 409 }
        )
      }

      const existingScanId = scan.id as string
      scanId = existingScanId
      const origin = new URL(request.url).origin
      const statusUrl = `/technical-seo/scan/${existingScanId}/?key=${encodeURIComponent(keyInput)}`
      const returnUrl = `${origin}${statusUrl}&provider=paypal`
      const cancelUrl = `${origin}/technical-seo/cancelled/?plan=deep&scanId=${encodeURIComponent(existingScanId)}&key=${encodeURIComponent(keyInput)}`

      if (scan.payment_reference) {
        const orderA = scan.payment_reference
        let existingOrder: Order | null = null

        try {
          existingOrder = (await getPayPalOrderFn(orderA)) as Order
        } catch {
          existingOrder = null
        }

        // Case D: Existing order is APPROVED or COMPLETED in PayPal (route into return/reconciliation path)
        if (
          existingOrder &&
          existingOrder.id === orderA &&
          (existingOrder.status === OrderStatus.Approved ||
            existingOrder.status === OrderStatus.Completed)
        ) {
          const captureReturnUrl = `${returnUrl}&token=${encodeURIComponent(orderA)}`
          return NextResponse.json({
            scanId: existingScanId,
            status: 'awaiting_payment',
            statusUrl,
            accessKey: keyInput,
            checkoutUrl: captureReturnUrl,
            provider: 'paypal',
            orderId: orderA,
            plan: 'deep',
            alreadyApproved: true,
          })
        }

        // Case B: Existing order is CREATED, valid, and safely reusable
        const purchaseUnit = existingOrder?.purchaseUnits?.[0]
        const approvalLink =
          existingOrder?.links?.find((link) => link.rel === 'payer-action') ??
          existingOrder?.links?.find((link) => link.rel === 'approve')

        const isReusable =
          existingOrder &&
          existingOrder.id === orderA &&
          existingOrder.status === OrderStatus.Created &&
          purchaseUnit &&
          purchaseUnit.customId?.trim() === existingScanId &&
          purchaseUnit.amount?.currencyCode === PAYPAL_PAID_PLAN_CONFIG.deep.currency &&
          purchaseUnit.amount?.value === PAYPAL_PAID_PLAN_CONFIG.deep.amount &&
          typeof approvalLink?.href === 'string' &&
          approvalLink.href.trim().length > 0

        if (isReusable) {
          return NextResponse.json({
            scanId: existingScanId,
            status: 'awaiting_payment',
            statusUrl,
            accessKey: keyInput,
            checkoutUrl: approvalLink!.href,
            provider: 'paypal',
            orderId: orderA,
            plan: 'deep',
          })
        }

        // Case C: Existing order is VOIDED, incompatible, unretrievable, or missing approval link.
        // Create replacement order and atomically swap reference.
        const { orderId: newOrderId, approvalUrl: newApprovalUrl } = await createPayPalOrderFn({
          amount: PAYPAL_PAID_PLAN_CONFIG.deep.amount,
          scanId: existingScanId,
          returnUrl,
          cancelUrl,
        })

        const updatedScan = await replacePaymentOrderFn({
          scanId: existingScanId,
          previousReference: orderA,
          newReference: newOrderId,
          paymentCurrency: PAYPAL_PAID_PLAN_CONFIG.deep.currency,
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
          checkoutUrl: newApprovalUrl,
          provider: 'paypal',
          orderId: newOrderId,
          plan: 'deep',
        })
      }

      // Case A: First checkout attempt
      const { orderId, approvalUrl } = await createPayPalOrderFn({
        amount: PAYPAL_PAID_PLAN_CONFIG.deep.amount,
        scanId: existingScanId,
        returnUrl,
        cancelUrl,
      })

      const updatedScan = await markPaymentOrderCreatedFn({
        scanId: existingScanId,
        paymentProvider: 'paypal',
        paymentReference: orderId,
        paymentCurrency: PAYPAL_PAID_PLAN_CONFIG.deep.currency,
      })

      if (!updatedScan) {
        return NextResponse.json(
          {
            error:
              'Failed to bind payment order to scan. The scan may already have an active payment order or is no longer awaiting payment.',
          },
          { status: 409 }
        )
      }

      return NextResponse.json({
        scanId: existingScanId,
        status: 'awaiting_payment',
        statusUrl,
        accessKey: keyInput,
        checkoutUrl: approvalUrl,
        provider: 'paypal',
        orderId,
        plan: 'deep',
      })
    }

    const url = typeof body.url === 'string' ? body.url.trim() : ''
    const problem = typeof body.problem === 'string' ? body.problem : 'unknown'
    const billingCountry = normalizeBillingCountry(body.billingCountry)

    if (!url) {
      return NextResponse.json({ error: 'Website URL is required.' }, { status: 400 })
    }

    if (!isInternationalBillingCountry(billingCountry)) {
      return NextResponse.json(
        {
          error:
            'PayPal checkout is available for international billing countries. For India, use the Targeted Troubleshoot plan in INR.',
        },
        { status: 400 }
      )
    }

    if (!PROBLEMS.has(problem as DiagnosticProblem)) {
      return NextResponse.json({ error: 'Invalid diagnostic problem.' }, { status: 400 })
    }

    if (plan !== 'quick' && plan !== 'full') {
      return NextResponse.json(
        {
          error:
            'Only the Targeted Troubleshoot ($39) and Full Troubleshoot ($79) plans are available for paid checkout.',
        },
        { status: 400 }
      )
    }

    const planConfig = PAYPAL_PAID_PLAN_CONFIG[plan as SupportedPaidPlan]

    const accessKey = createReportAccessToken()
    const scanTokenHash = hashReportAccessToken(accessKey)
    const newScanId = randomUUID()
    scanId = newScanId
    const origin = new URL(request.url).origin
    const statusUrl = `/technical-seo/scan/${newScanId}/?key=${encodeURIComponent(accessKey)}`
    const returnUrl = `${origin}${statusUrl}&provider=paypal`
    const cancelUrl = `${origin}/technical-seo/cancelled/?plan=${encodeURIComponent(plan)}`

    await createScanRecordFn({
      scanId: newScanId,
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
      scanId: newScanId,
      returnUrl,
      cancelUrl,
    })

    await markPaymentOrderCreatedFn({
      scanId: newScanId,
      paymentProvider: 'paypal',
      paymentReference: orderId,
      paymentCurrency: planConfig.currency,
    })

    return NextResponse.json({
      scanId: newScanId,
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
  return handleCreateOrder(request)
}
