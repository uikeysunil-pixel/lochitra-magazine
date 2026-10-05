import { NextResponse } from 'next/server'
import { inngest } from '@/inngest/client'
import {
  getCashfreeOrder,
  getCashfreePayments,
  type CashfreeOrder,
  type CashfreePayment,
} from '@/lib/cashfree/client'
import {
  getScanRecord,
  markBackgroundEventSent,
  markPaymentPaid,
  verifyReportAccessToken,
} from '@/lib/technical-seo/scan-repository'
import type { DiagnosticProblem, PlanId } from '@/lib/technical-seo/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EXPECTED_AMOUNT = 4999
const EXPECTED_CURRENCY = 'INR'

export interface CashfreeConfirmOrderDependencies {
  getScanRecord?: typeof getScanRecord
  getCashfreeOrder?: typeof getCashfreeOrder
  getCashfreePayments?: typeof getCashfreePayments
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

function isValidCashfreeOrder(
  order: CashfreeOrder,
  orderId: string,
  scanId: string
) {
  return (
    order.order_id === orderId &&
    order.order_status === 'PAID' &&
    Number(order.order_amount) === EXPECTED_AMOUNT &&
    order.order_currency === EXPECTED_CURRENCY &&
    order.order_tags?.scan_id === scanId
  )
}

export async function handleCashfreeConfirmOrder(
  request: Request,
  deps: CashfreeConfirmOrderDependencies = {}
) {
  const getScanRecordFn = deps.getScanRecord ?? getScanRecord
  const getCashfreeOrderFn = deps.getCashfreeOrder ?? getCashfreeOrder
  const getCashfreePaymentsFn = deps.getCashfreePayments ?? getCashfreePayments
  const markPaymentPaidFn = deps.markPaymentPaid ?? markPaymentPaid
  const markBackgroundEventSentFn =
    deps.markBackgroundEventSent ?? markBackgroundEventSent
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

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 })
  }

  const scanId = typeof body.scanId === 'string' ? body.scanId.trim() : ''
  const key = typeof body.key === 'string' ? body.key.trim() : ''
  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : ''

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      scanId
    )
  ) {
    return NextResponse.json({ error: 'Invalid scan ID.' }, { status: 400 })
  }

  if (!key || !orderId) {
    return NextResponse.json({ error: 'Payment confirmation parameters are required.' }, { status: 400 })
  }

  const scan = await getScanRecordFn(scanId)
  if (!scan) {
    return NextResponse.json({ error: 'Locitra scan cannot be found.' }, { status: 404 })
  }

  if (!verifyReportAccessToken(key, scan.report_token_hash)) {
    return NextResponse.json({ error: 'Invalid scan access key.' }, { status: 403 })
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

  if (scan.payment_status === 'paid') {
    if (!scan.background_event_sent_at) {
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
    }

    return NextResponse.json({
      success: true,
      scanId,
      orderId,
      paymentStatus: 'paid',
      alreadyPaid: true,
    })
  }

  let cashfreeOrder: CashfreeOrder
  let cashfreePayments: CashfreePayment[]
  try {
    ;[cashfreeOrder, cashfreePayments] = await Promise.all([
      getCashfreeOrderFn(orderId),
      getCashfreePaymentsFn(orderId),
    ])
  } catch {
    return NextResponse.json(
      { error: 'Unable to verify Cashfree order payment status.' },
      { status: 502 }
    )
  }

  if (!isValidCashfreeOrder(cashfreeOrder, orderId, scanId)) {
    return NextResponse.json({ error: 'Cashfree order verification failed.' }, { status: 409 })
  }

  const verifiedPayment = cashfreePayments.find((payment) =>
    isValidSuccessPayment(payment, orderId)
  )

  if (!verifiedPayment) {
    return NextResponse.json(
      { error: 'Cashfree payment has not reached a successful state yet.' },
      { status: 409 }
    )
  }

  const row = await markPaymentPaidFn({
    scanId,
    paymentProvider: 'cashfree',
    paymentReference: orderId,
    paymentTransactionId: String(verifiedPayment.cf_payment_id),
  })

  if (!row) {
    const latestScan = await getScanRecordFn(scanId)

    if (
      latestScan?.payment_status === 'paid' &&
      latestScan.payment_provider === 'cashfree' &&
      latestScan.payment_reference === orderId
    ) {
      if (!latestScan.background_event_sent_at) {
        await sendInngestEventFn({
          id: `technical-seo-paid-scan-${latestScan.id}`,
          name: 'technical-seo/scan.requested',
          data: {
            scanId: latestScan.id,
            url: latestScan.website_url,
            problem: latestScan.problem as DiagnosticProblem,
            plan: latestScan.plan as PlanId,
          },
        })
        await markBackgroundEventSentFn(latestScan.id)
      }

      return NextResponse.json({
        success: true,
        scanId,
        orderId,
        paymentStatus: 'paid',
        alreadyPaid: true,
      })
    }

    return NextResponse.json(
      { error: 'Paid Cashfree order did not match the expected Locitra scan.' },
      { status: 409 }
    )
  }

  if (!row.background_event_sent_at) {
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
  }

  return NextResponse.json({
    success: true,
    scanId: row.id,
    orderId,
    transactionId: String(verifiedPayment.cf_payment_id),
    paymentStatus: row.payment_status,
    alreadyPaid: false,
  })
}

export async function POST(request: Request) {
  return handleCashfreeConfirmOrder(request)
}
