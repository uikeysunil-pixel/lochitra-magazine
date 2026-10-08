import { inngest } from '@/inngest/client'
import { getScanRecord, markBackgroundEventSent, markPaymentPaid } from './scan-repository'
import { capturePayPalOrder, getPayPalOrder } from '@/lib/paypal/orders'
import { type Order, OrderStatus, CaptureStatus } from '@paypal/paypal-server-sdk'
import type { DiagnosticProblem, PlanId } from './types'

export const PAYPAL_PLAN_PRICING: Record<
  string,
  {
    amount: string
    currency: 'USD'
  }
> = {
  quick: {
    amount: '39.00',
    currency: 'USD',
  },
  full: {
    amount: '79.00',
    currency: 'USD',
  },
  deep: {
    amount: '159.00',
    currency: 'USD',
  },
}

export const ALLOWED_AMOUNTS = new Set(Object.values(PAYPAL_PLAN_PRICING).map((p) => p.amount))

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

export type CapturePaymentResult =
  | {
      ok: true
      scanId: string
      orderId: string
      transactionId: string | null
      status: string
      paymentStatus: string
      alreadyPaid: boolean
      statusUrl: string
    }
  | {
      ok: false
      status: number
      error: string
    }

export async function captureAndProcessPayPalPayment(
  input: { orderId: string },
  deps: CaptureOrderDependencies = {}
): Promise<CapturePaymentResult> {
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

  const orderId = input.orderId.trim()
  if (!orderId) {
    return { ok: false, status: 400, error: 'orderId is required.' }
  }

  // STEP 1 — RETRIEVE PAYPAL ORDER BEFORE CAPTURE
  let existingOrder: Order
  try {
    existingOrder = (await getPayPalOrderFn(orderId)) as Order
  } catch {
    return { ok: false, status: 404, error: 'PayPal order could not be found.' }
  }

  if (!existingOrder || !existingOrder.id || existingOrder.id !== orderId) {
    return {
      ok: false,
      status: 404,
      error: 'PayPal order ID mismatch or order not found.',
    }
  }

  const purchaseUnit = existingOrder.purchaseUnits?.[0]
  if (!purchaseUnit || !purchaseUnit.customId?.trim()) {
    return {
      ok: false,
      status: 409,
      error: 'PayPal order missing purchase unit or scanId association.',
    }
  }

  if (
    purchaseUnit.amount?.currencyCode !== 'USD' ||
    !purchaseUnit.amount?.value ||
    !ALLOWED_AMOUNTS.has(purchaseUnit.amount.value)
  ) {
    return {
      ok: false,
      status: 400,
      error: 'Invalid PayPal payment amount or currency.',
    }
  }

  const scanId = purchaseUnit.customId.trim()

  // STEP 2 — VERIFY NEON BINDING BEFORE CAPTURE AND VERIFY PLAN PRICING
  const scan = await getScanRecordFn(scanId)
  if (!scan) {
    return { ok: false, status: 404, error: 'Locitra scan cannot be found.' }
  }

  if (
    scan.payment_provider !== 'paypal' ||
    scan.payment_reference !== orderId ||
    scan.payment_currency !== 'USD'
  ) {
    return {
      ok: false,
      status: 409,
      error: 'Payment provider, reference, or currency mismatch.',
    }
  }

  if (scan.payment_status === 'failed' || scan.payment_status === 'refunded') {
    return {
      ok: false,
      status: 409,
      error: `Cannot capture scan with payment status '${scan.payment_status}'.`,
    }
  }

  const expectedPricing = PAYPAL_PLAN_PRICING[scan.plan]
  if (!expectedPricing) {
    return {
      ok: false,
      status: 400,
      error: `Plan '${scan.plan}' is not eligible for paid PayPal capture.`,
    }
  }

  if (
    purchaseUnit.amount?.currencyCode !== expectedPricing.currency ||
    purchaseUnit.amount?.value !== expectedPricing.amount
  ) {
    return {
      ok: false,
      status: 400,
      error: 'PayPal payment amount does not match the scan plan.',
    }
  }

  // STEP 3 — IDEMPOTENT ALREADY-PAID CHECK
  if (scan.payment_status === 'paid') {
    if (!scan.background_event_sent_at) {
      try {
        await sendInngestEventFn({
          id: `technical-seo-paid-scan-${scan.id}`,
          name: 'technical-seo/scan.requested',
          data: {
            scanId: scan.id,
            url: scan.website_url,
            problem: scan.problem as DiagnosticProblem,
            plan: scan.plan as PlanId,
          },
        })

        await markBackgroundEventSentFn(scan.id)
      } catch (eventError) {
        console.error(
          'Failed to dispatch missing Inngest scan event for already-paid scan:',
          eventError
        )
      }
    }

    return {
      ok: true,
      scanId,
      orderId,
      transactionId: scan.payment_transaction_id ?? null,
      status: scan.status,
      paymentStatus: 'paid',
      alreadyPaid: true,
      statusUrl: `/technical-seo/scan/${scanId}/`,
    }
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
          return { ok: false, status: 409, error: message }
        }
      } catch {
        const message = captureErr instanceof Error ? captureErr.message : 'PayPal capture failed.'
        return { ok: false, status: 409, error: message }
      }
    }
  }

  // STEP 5 — VERIFY THE FINAL ORDER
  let finalOrder: Order
  try {
    finalOrder = (await getPayPalOrderFn(orderId)) as Order
  } catch {
    return {
      ok: false,
      status: 409,
      error: 'PayPal completed order could not be retrieved for verification.',
    }
  }

  if (!finalOrder || finalOrder.id !== orderId || finalOrder.status !== OrderStatus.Completed) {
    return {
      ok: false,
      status: 409,
      error: 'PayPal order is not in completed state.',
    }
  }

  const finalPurchaseUnit = finalOrder.purchaseUnits?.[0]
  if (
    !finalPurchaseUnit ||
    finalPurchaseUnit.customId?.trim() !== scanId ||
    finalPurchaseUnit.amount?.currencyCode !== expectedPricing.currency ||
    finalPurchaseUnit.amount?.value !== expectedPricing.amount
  ) {
    return {
      ok: false,
      status: 409,
      error: 'Final PayPal purchase unit verification failed.',
    }
  }

  const capture = finalPurchaseUnit.payments?.captures?.[0]
  if (
    !capture ||
    !capture.id ||
    capture.status !== CaptureStatus.Completed ||
    capture.amount?.currencyCode !== expectedPricing.currency ||
    capture.amount?.value !== expectedPricing.amount
  ) {
    return {
      ok: false,
      status: 409,
      error: 'PayPal payment capture state conflict or invalid amount.',
    }
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

  // Concurrency check: if another concurrent request (browser capture or webhook) updated the row to paid:
  if (!row) {
    const refreshedScan = await getScanRecordFn(scanId)
    if (refreshedScan?.payment_status === 'paid' && refreshedScan?.payment_reference === orderId) {
      if (!refreshedScan.background_event_sent_at) {
        try {
          await sendInngestEventFn({
            id: `technical-seo-paid-scan-${refreshedScan.id}`,
            name: 'technical-seo/scan.requested',
            data: {
              scanId: refreshedScan.id,
              url: refreshedScan.website_url,
              problem: refreshedScan.problem as DiagnosticProblem,
              plan: refreshedScan.plan as PlanId,
            },
          })
          await markBackgroundEventSentFn(refreshedScan.id)
        } catch (eventError) {
          console.error('Failed to dispatch Inngest scan event on race condition:', eventError)
        }
      }
      return {
        ok: true,
        scanId: refreshedScan.id,
        orderId,
        transactionId: refreshedScan.payment_transaction_id ?? capture.id,
        status: refreshedScan.status,
        paymentStatus: 'paid',
        alreadyPaid: true,
        statusUrl: `/technical-seo/scan/${refreshedScan.id}/`,
      }
    }

    return {
      ok: false,
      status: 409,
      error: 'Paid PayPal order did not match the expected Locitra scan.',
    }
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
  return {
    ok: true,
    scanId: row.id,
    orderId,
    transactionId: capture.id,
    status: row.status,
    paymentStatus: row.payment_status,
    alreadyPaid: false,
    statusUrl: `/technical-seo/scan/${row.id}/`,
  }
}
