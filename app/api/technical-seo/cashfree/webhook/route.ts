import { NextResponse } from 'next/server'
import {
  confirmAndProcessCashfreePayment,
  CASHFREE_PAID_PLAN_CONFIG,
  EXPECTED_CURRENCY,
  isCashfreePaidPlan,
  type CashfreePaymentConfirmationDependencies,
} from '@/lib/technical-seo/cashfree-payment'
import { verifyCashfreeWebhookSignature } from '@/lib/cashfree/client'
import { getScanRecord } from '@/lib/technical-seo/scan-repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export interface CashfreeWebhookDependencies extends CashfreePaymentConfirmationDependencies {
  getScanRecord?: typeof getScanRecord
}

type CashfreeWebhookPayload = {
  type?: unknown
  data?: {
    order?: {
      order_id?: unknown
      order_amount?: unknown
      order_currency?: unknown
      order_tags?: Record<string, unknown> | null
    }
    payment?: {
      cf_payment_id?: unknown
      payment_status?: unknown
      payment_amount?: unknown
      payment_currency?: unknown
    }
    customer_details?: {
      customer_email?: unknown
    }
  }
}

export async function handleCashfreeWebhook(
  request: Request,
  deps: CashfreeWebhookDependencies = {}
) {
  const getScanRecordFn = deps.getScanRecord ?? getScanRecord
  const rawBody = await request.text()
  const signature = request.headers.get('x-webhook-signature')
  const timestamp = request.headers.get('x-webhook-timestamp')

  if (!verifyCashfreeWebhookSignature(signature, timestamp, rawBody)) {
    return NextResponse.json({ error: 'Invalid Cashfree webhook signature.' }, { status: 401 })
  }

  let payload: CashfreeWebhookPayload
  try {
    payload = JSON.parse(rawBody) as CashfreeWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid webhook JSON payload.' }, { status: 400 })
  }

  if (payload.type !== 'PAYMENT_SUCCESS_WEBHOOK') {
    return NextResponse.json({ received: true, ignored: true })
  }

  const webhookOrder = payload.data?.order
  const webhookPayment = payload.data?.payment
  const orderId = typeof webhookOrder?.order_id === 'string' ? webhookOrder.order_id.trim() : ''
  const scanId =
    typeof webhookOrder?.order_tags?.scan_id === 'string'
      ? webhookOrder.order_tags.scan_id.trim()
      : ''
  const webhookPaymentId =
    webhookPayment?.cf_payment_id !== undefined && webhookPayment?.cf_payment_id !== null
      ? String(webhookPayment.cf_payment_id)
      : ''

  if (!orderId || !scanId || !webhookPaymentId) {
    return NextResponse.json(
      { error: 'Cashfree webhook is missing payment identifiers.' },
      { status: 400 }
    )
  }

  const scan = await getScanRecordFn(scanId)
  if (!scan) {
    return NextResponse.json(
      { error: 'Locitra scan cannot be found for Cashfree webhook.' },
      { status: 404 }
    )
  }

  if (!isCashfreePaidPlan(scan.plan)) {
    return NextResponse.json(
      { error: 'Cashfree webhook plan is invalid or unsupported.' },
      { status: 400 }
    )
  }

  const expectedAmount = CASHFREE_PAID_PLAN_CONFIG[scan.plan].numericAmount

  if (
    Number(webhookOrder?.order_amount) !== expectedAmount ||
    String(webhookOrder?.order_currency) !== EXPECTED_CURRENCY ||
    String(webhookPayment?.payment_status) !== 'SUCCESS' ||
    Number(webhookPayment?.payment_amount) !== expectedAmount ||
    String(webhookPayment?.payment_currency) !== EXPECTED_CURRENCY
  ) {
    return NextResponse.json(
      { error: 'Cashfree webhook payment validation failed.' },
      { status: 400 }
    )
  }

  const customerEmail =
    typeof payload.data?.customer_details?.customer_email === 'string'
      ? payload.data.customer_details.customer_email
      : null

  const result = await confirmAndProcessCashfreePayment(
    {
      scanId,
      orderId,
      expectedPaymentId: webhookPaymentId,
      customerEmail,
    },
    deps
  )

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({
    success: true,
    scanId: result.scanId,
    orderId: result.orderId,
    transactionId: result.transactionId,
    paymentStatus: result.paymentStatus,
    alreadyPaid: result.alreadyPaid,
  })
}

export async function POST(request: Request) {
  return handleCashfreeWebhook(request)
}
