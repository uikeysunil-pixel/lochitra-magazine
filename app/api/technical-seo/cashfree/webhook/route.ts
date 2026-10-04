import { NextResponse } from 'next/server'
import { inngest } from '@/inngest/client'
import {
  getCashfreeOrder,
  getCashfreePayments,
  verifyCashfreeWebhookSignature,
  type CashfreeOrder,
  type CashfreePayment,
} from '@/lib/cashfree/client'
import {
  getScanRecord,
  markBackgroundEventSent,
  markPaymentPaid,
} from '@/lib/technical-seo/scan-repository'
import type { DiagnosticProblem, PlanId } from '@/lib/technical-seo/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EXPECTED_AMOUNT = 4999
const EXPECTED_CURRENCY = 'INR'

interface CashfreeWebhookDependencies {
  getCashfreeOrder?: typeof getCashfreeOrder
  getCashfreePayments?: typeof getCashfreePayments
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

function isValidSuccessPayment(
  payment: CashfreePayment | undefined,
  orderId: string
): payment is CashfreePayment & { cf_payment_id: string | number } {
  return Boolean(
    payment &&
      String(payment.order_id) === orderId &&
      String(payment.payment_status) === 'SUCCESS' &&
      Number(payment.payment_amount) === EXPECTED_AMOUNT &&
      String(payment.payment_currency) === EXPECTED_CURRENCY &&
      payment.cf_payment_id !== undefined &&
      payment.cf_payment_id !== null
  )
}

export async function handleCashfreeWebhook(
  request: Request,
  deps: CashfreeWebhookDependencies = {}
) {
  const getCashfreeOrderFn = deps.getCashfreeOrder ?? getCashfreeOrder
  const getCashfreePaymentsFn = deps.getCashfreePayments ?? getCashfreePayments
  const getScanRecordFn = deps.getScanRecord ?? getScanRecord
  const markPaymentPaidFn = deps.markPaymentPaid ?? markPaymentPaid
  const markBackgroundEventSentFn = deps.markBackgroundEventSent ?? markBackgroundEventSent
  const sendInngestEventFn =
    deps.sendInngestEvent ??
    ((event) => inngest.send(event))

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
    return NextResponse.json({ error: 'Cashfree webhook is missing payment identifiers.' }, { status: 400 })
  }

  if (
    Number(webhookOrder?.order_amount) !== EXPECTED_AMOUNT ||
    String(webhookOrder?.order_currency) !== EXPECTED_CURRENCY ||
    String(webhookPayment?.payment_status) !== 'SUCCESS' ||
    Number(webhookPayment?.payment_amount) !== EXPECTED_AMOUNT ||
    String(webhookPayment?.payment_currency) !== EXPECTED_CURRENCY
  ) {
    return NextResponse.json({ error: 'Cashfree webhook payment validation failed.' }, { status: 400 })
  }

  let cashfreeOrder: CashfreeOrder
  let cashfreePayments: CashfreePayment[]
  try {
    cashfreeOrder = await getCashfreeOrderFn(orderId)
    cashfreePayments = await getCashfreePaymentsFn(orderId)
  } catch {
    return NextResponse.json(
      { error: 'Unable to verify Cashfree order payment status.' },
      { status: 502 }
    )
  }

  if (
    cashfreeOrder.order_id !== orderId ||
    cashfreeOrder.order_status !== 'PAID' ||
    Number(cashfreeOrder.order_amount) !== EXPECTED_AMOUNT ||
    cashfreeOrder.order_currency !== EXPECTED_CURRENCY ||
    cashfreeOrder.order_tags?.scan_id !== scanId
  ) {
    return NextResponse.json({ error: 'Cashfree order verification failed.' }, { status: 409 })
  }

  const verifiedPayment = cashfreePayments.find(
    (payment) => String(payment.cf_payment_id) === webhookPaymentId
  )

  if (!isValidSuccessPayment(verifiedPayment, orderId)) {
    return NextResponse.json(
      { error: 'Cashfree successful payment verification failed.' },
      { status: 409 }
    )
  }

  const scan = await getScanRecordFn(scanId)
  if (!scan) {
    return NextResponse.json({ error: 'Locitra scan cannot be found.' }, { status: 404 })
  }

  if (
    scan.plan !== 'quick' ||
    scan.payment_provider !== 'cashfree' ||
    scan.payment_reference !== orderId ||
    scan.payment_currency !== EXPECTED_CURRENCY
  ) {
    return NextResponse.json(
      { error: 'Cashfree payment does not match the expected Locitra scan.' },
      { status: 409 }
    )
  }

  if (scan.payment_status === 'failed' || scan.payment_status === 'refunded') {
    return NextResponse.json(
      { error: `Cannot complete scan with payment status '${scan.payment_status}'.` },
      { status: 409 }
    )
  }

  const customerEmail =
    typeof payload.data?.customer_details?.customer_email === 'string'
      ? payload.data.customer_details.customer_email
      : null

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
          'Failed to dispatch missing Inngest scan event for already-paid Cashfree payment:',
          eventError
        )
      }
    }

    return NextResponse.json({
      success: true,
      scanId,
      orderId,
      transactionId: webhookPaymentId,
      paymentStatus: 'paid',
      alreadyPaid: true,
    })
  }

  const row = await markPaymentPaidFn({
    scanId,
    paymentProvider: 'cashfree',
    paymentReference: orderId,
    paymentTransactionId: webhookPaymentId,
    customerEmail,
  })

  if (!row) {
    return NextResponse.json(
      { error: 'Paid Cashfree order did not match the expected Locitra scan.' },
      { status: 409 }
    )
  }

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
      console.error('Failed to dispatch Inngest scan event for Cashfree payment:', eventError)
    }
  }

  return NextResponse.json({
    success: true,
    scanId: row.id,
    orderId,
    transactionId: webhookPaymentId,
    paymentStatus: row.payment_status,
    alreadyPaid: false,
  })
}

export async function POST(request: Request) {
  return handleCashfreeWebhook(request)
}
