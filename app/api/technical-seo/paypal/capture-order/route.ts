import { NextResponse } from 'next/server'
import { inngest } from '@/inngest/client'
import {
  getScanRecord,
  markBackgroundEventSent,
  markPaymentPaid,
} from '@/lib/technical-seo/scan-repository'
import { capturePayPalOrder, getPayPalOrder } from '@/lib/paypal/orders'
import { type Order, OrderStatus, CaptureStatus } from '@paypal/paypal-server-sdk'
import type { DiagnosticProblem, PlanId } from '@/lib/technical-seo/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const PAYPAL_PLAN_PRICING: Record<
  string,
  {
    amount: string
    currency: 'USD'
  }
> = {
  quick: {
    amount: '49.00',
    currency: 'USD',
  },
  full: {
    amount: '99.00',
    currency: 'USD',
  },
}

const ALLOWED_AMOUNTS = new Set(Object.values(PAYPAL_PLAN_PRICING).map((p) => p.amount))

export interface CaptureOrderDependencies {
  getPayPalOrder?: typeof getPayPalOrder
  capturePayPalOrder?: typeof capturePayPalOrder
  getScanRecord?: typeof getScanRecord
  markPaymentPaid?: typeof markPaymentPaid
  markBackgroundEventSent?: typeof markBackgroundEventSent
  sendInngestEvent?: (payload: {
    id: string
    name: 'technical-seo/scan.requested'
    data: {
      scanId: string
      url: string
      problem: DiagnosticProblem
      plan: PlanId
    }
  }) => Promise<unknown>
}

export async function handleCaptureOrder(request: Request, deps: CaptureOrderDependencies = {}) {
  const getPayPalOrderFn = deps.getPayPalOrder ?? getPayPalOrder
  const capturePayPalOrderFn = deps.capturePayPalOrder ?? capturePayPalOrder
  const getScanRecordFn = deps.getScanRecord ?? getScanRecord
  const markPaymentPaidFn = deps.markPaymentPaid ?? markPaymentPaid
  const markBackgroundEventSentFn = deps.markBackgroundEventSent ?? markBackgroundEventSent
  const sendInngestEventFn =
    deps.sendInngestEvent ??
    ((event: {
      id: string
      name: 'technical-seo/scan.requested'
      data: {
        scanId: string
        url: string
        problem: DiagnosticProblem
        plan: PlanId
      }
    }) => inngest.send(event))

  try {
    let body: {
      orderId?: unknown
    }

    try {
      body = (await request.json()) as { orderId?: unknown }
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 })
    }

    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : ''

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required.' }, { status: 400 })
    }

    // STEP 1 — RETRIEVE PAYPAL ORDER BEFORE CAPTURE
    let existingOrder: Order
    try {
      existingOrder = (await getPayPalOrderFn(orderId)) as Order
    } catch {
      return NextResponse.json({ error: 'PayPal order could not be found.' }, { status: 404 })
    }

    if (!existingOrder || !existingOrder.id || existingOrder.id !== orderId) {
      return NextResponse.json(
        { error: 'PayPal order ID mismatch or order not found.' },
        { status: 404 }
      )
    }

    const purchaseUnit = existingOrder.purchaseUnits?.[0]
    if (!purchaseUnit || !purchaseUnit.customId?.trim()) {
      return NextResponse.json(
        { error: 'PayPal order missing purchase unit or scanId association.' },
        { status: 409 }
      )
    }

    if (
      purchaseUnit.amount?.currencyCode !== 'USD' ||
      !purchaseUnit.amount?.value ||
      !ALLOWED_AMOUNTS.has(purchaseUnit.amount.value)
    ) {
      return NextResponse.json(
        { error: 'Invalid PayPal payment amount or currency.' },
        { status: 400 }
      )
    }

    const scanId = purchaseUnit.customId.trim()

    // STEP 2 — VERIFY NEON BINDING BEFORE CAPTURE AND VERIFY PLAN PRICING
    const scan = await getScanRecordFn(scanId)
    if (!scan) {
      return NextResponse.json({ error: 'Locitra scan cannot be found.' }, { status: 404 })
    }

    if (
      scan.payment_provider !== 'paypal' ||
      scan.payment_reference !== orderId ||
      scan.payment_currency !== 'USD'
    ) {
      return NextResponse.json(
        { error: 'Payment provider, reference, or currency mismatch.' },
        { status: 409 }
      )
    }

    if (scan.payment_status === 'failed' || scan.payment_status === 'refunded') {
      return NextResponse.json(
        { error: `Cannot capture scan with payment status '${scan.payment_status}'.` },
        { status: 409 }
      )
    }

    const expectedPricing = PAYPAL_PLAN_PRICING[scan.plan]
    if (!expectedPricing) {
      return NextResponse.json(
        { error: `Plan '${scan.plan}' is not eligible for paid PayPal capture.` },
        { status: 400 }
      )
    }

    if (
      purchaseUnit.amount?.currencyCode !== expectedPricing.currency ||
      purchaseUnit.amount?.value !== expectedPricing.amount
    ) {
      return NextResponse.json(
        { error: 'PayPal payment amount does not match the scan plan.' },
        { status: 400 }
      )
    }

    // STEP 3 — IDEMPOTENT ALREADY-PAID CHECK
    if (scan.payment_status === 'paid') {
      return NextResponse.json({
        success: true,
        scanId,
        orderId,
        transactionId: scan.payment_transaction_id ?? null,
        status: scan.status,
        paymentStatus: 'paid',
        alreadyPaid: true,
        statusUrl: `/technical-seo/scan/${scanId}/`,
      })
    }

    // STEP 4 — HANDLE ALREADY-COMPLETED PAYPAL ORDERS / EXECUTE CAPTURE
    if (existingOrder.status !== OrderStatus.Completed) {
      try {
        await capturePayPalOrderFn(orderId)
      } catch (captureErr) {
        try {
          const refreshedOrder = (await getPayPalOrderFn(orderId)) as Order
          if (!refreshedOrder || refreshedOrder.status !== OrderStatus.Completed) {
            const message =
              captureErr instanceof Error ? captureErr.message : 'PayPal capture failed.'
            return NextResponse.json({ error: message }, { status: 409 })
          }
        } catch {
          const message =
            captureErr instanceof Error ? captureErr.message : 'PayPal capture failed.'
          return NextResponse.json({ error: message }, { status: 409 })
        }
      }
    }

    // PayPal's capture response may omit original purchase-unit fields such as customId.
    // Re-fetch the completed order so final verification uses the authoritative order data.
    let finalOrder: Order
    try {
      finalOrder = (await getPayPalOrderFn(orderId)) as Order
    } catch {
      return NextResponse.json(
        { error: 'PayPal completed order could not be retrieved for verification.' },
        { status: 409 }
      )
    }

    // STEP 5 — VERIFY THE FINAL ORDER
    if (!finalOrder || finalOrder.id !== orderId || finalOrder.status !== OrderStatus.Completed) {
      return NextResponse.json(
        { error: 'PayPal order is not in completed state.' },
        { status: 409 }
      )
    }

    const finalPurchaseUnit = finalOrder.purchaseUnits?.[0]
    if (
      !finalPurchaseUnit ||
      finalPurchaseUnit.customId?.trim() !== scanId ||
      finalPurchaseUnit.amount?.currencyCode !== expectedPricing.currency ||
      finalPurchaseUnit.amount?.value !== expectedPricing.amount
    ) {
      return NextResponse.json(
        { error: 'Final PayPal purchase unit verification failed.' },
        { status: 409 }
      )
    }

    const capture = finalPurchaseUnit.payments?.captures?.[0]
    if (
      !capture ||
      !capture.id ||
      capture.status !== CaptureStatus.Completed ||
      capture.amount?.currencyCode !== expectedPricing.currency ||
      capture.amount?.value !== expectedPricing.amount
    ) {
      return NextResponse.json(
        { error: 'PayPal payment capture state conflict or invalid amount.' },
        { status: 409 }
      )
    }

    // STEP 6 — EXTRACT EMAIL
    const customerEmail =
      finalOrder.paymentSource?.paypal?.emailAddress ?? finalOrder.payer?.emailAddress ?? null

    // STEP 7 — MARK PAYMENT PAID
    const row = await markPaymentPaidFn({
      scanId,
      paymentProvider: 'paypal',
      paymentReference: orderId,
      paymentTransactionId: capture.id,
      customerEmail,
    })

    if (!row) {
      return NextResponse.json(
        { error: 'Paid PayPal order did not match the expected Locitra scan.' },
        { status: 409 }
      )
    }

    // STEP 8 — INGEST EVENT
    if (!row.background_event_sent_at) {
      try {
        await sendInngestEventFn({
          id: `technical-seo-paid-scan-${row.id}`,
          name: 'technical-seo/scan.requested',
          data: {
            scanId: row.id,
            url: row.website_url,
            problem: row.problem as DiagnosticProblem,
            plan: row.plan as PlanId,
          },
        })

        await markBackgroundEventSentFn(row.id)
      } catch (eventError) {
        console.error('Failed to dispatch Inngest scan event for paid PayPal order:', eventError)
      }
    }

    // STEP 9 — SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      scanId: row.id,
      orderId,
      transactionId: capture.id,
      status: row.status,
      paymentStatus: row.payment_status,
      alreadyPaid: false,
      statusUrl: `/technical-seo/scan/${row.id}/`,
    })
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : 'Unable to capture PayPal payment.'
    const message =
      rawMessage.includes('PAYPAL_CLIENT_SECRET') || rawMessage.includes('PAYPAL_CLIENT_ID')
        ? 'PayPal configuration error.'
        : rawMessage

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return handleCaptureOrder(request)
}
