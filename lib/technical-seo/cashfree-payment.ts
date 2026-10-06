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
} from '@/lib/technical-seo/scan-repository'
import { CRAWL_LIMITS } from '@/lib/technical-seo/crawler'
import type { DiagnosticProblem, PlanId } from '@/lib/technical-seo/types'

export type CashfreePaidPlan = 'quick' | 'full' | 'deep'

export interface CashfreePlanDetails {
  amount: string
  numericAmount: number
  currency: 'INR'
  maxUrls: number
}

export const CASHFREE_PAID_PLAN_CONFIG: Record<CashfreePaidPlan, CashfreePlanDetails> = {
  quick: {
    amount: '4999.00',
    numericAmount: 4999,
    currency: 'INR',
    maxUrls: CRAWL_LIMITS.quick,
  },
  full: {
    amount: '9999.00',
    numericAmount: 9999,
    currency: 'INR',
    maxUrls: CRAWL_LIMITS.full,
  },
  deep: {
    amount: '19999.00',
    numericAmount: 19999,
    currency: 'INR',
    maxUrls: CRAWL_LIMITS.deep,
  },
}

export function isCashfreePaidPlan(plan: unknown): plan is CashfreePaidPlan {
  return typeof plan === 'string' && plan in CASHFREE_PAID_PLAN_CONFIG
}

export const EXPECTED_CURRENCY = 'INR'
export const EXPECTED_AMOUNT = CASHFREE_PAID_PLAN_CONFIG.quick.numericAmount
export const CASHFREE_QUICK_PLAN = 'quick'

export interface CashfreePaymentConfirmationDependencies {
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

export interface ProcessCashfreePaymentInput {
  scanId: string
  orderId: string
  expectedPaymentId?: string | null
  customerEmail?: string | null
}

export interface ProcessCashfreePaymentResult {
  ok: boolean
  status: number
  error?: string
  scanId?: string
  orderId?: string
  transactionId?: string
  paymentStatus?: string
  alreadyPaid?: boolean
}

export function isValidSuccessPayment(
  payment: CashfreePayment | undefined,
  orderId: string,
  expectedAmount: number = EXPECTED_AMOUNT
): payment is CashfreePayment & { cf_payment_id: string | number } {
  return Boolean(
    payment &&
    String(payment.order_id) === orderId &&
    String(payment.payment_status) === 'SUCCESS' &&
    Number(payment.payment_amount) === expectedAmount &&
    String(payment.payment_currency) === EXPECTED_CURRENCY &&
    payment.cf_payment_id !== undefined &&
    payment.cf_payment_id !== null
  )
}

export async function confirmAndProcessCashfreePayment(
  input: ProcessCashfreePaymentInput,
  deps: CashfreePaymentConfirmationDependencies = {}
): Promise<ProcessCashfreePaymentResult> {
  const getCashfreeOrderFn = deps.getCashfreeOrder ?? getCashfreeOrder
  const getCashfreePaymentsFn = deps.getCashfreePayments ?? getCashfreePayments
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

  const scanId = input.scanId.trim()
  const orderId = input.orderId.trim()

  const scan = await getScanRecordFn(scanId)
  if (!scan) {
    return { ok: false, status: 404, error: 'Locitra scan cannot be found.' }
  }

  if (
    !isCashfreePaidPlan(scan.plan) ||
    scan.payment_provider !== 'cashfree' ||
    scan.payment_reference !== orderId ||
    scan.payment_currency !== EXPECTED_CURRENCY
  ) {
    return {
      ok: false,
      status: 409,
      error: 'Cashfree payment does not match the expected Locitra scan.',
    }
  }

  const expectedAmount = CASHFREE_PAID_PLAN_CONFIG[scan.plan].numericAmount

  if (scan.payment_status === 'failed' || scan.payment_status === 'refunded') {
    return {
      ok: false,
      status: 409,
      error: `Cannot complete scan with payment status '${scan.payment_status}'.`,
    }
  }

  let cashfreeOrder: CashfreeOrder
  let cashfreePayments: CashfreePayment[]
  try {
    cashfreeOrder = await getCashfreeOrderFn(orderId)
    cashfreePayments = await getCashfreePaymentsFn(orderId)
  } catch {
    return {
      ok: false,
      status: 502,
      error: 'Unable to verify Cashfree order payment status.',
    }
  }

  if (
    cashfreeOrder.order_id !== orderId ||
    cashfreeOrder.order_status !== 'PAID' ||
    Number(cashfreeOrder.order_amount) !== expectedAmount ||
    cashfreeOrder.order_currency !== EXPECTED_CURRENCY ||
    cashfreeOrder.order_tags?.scan_id !== scanId
  ) {
    return {
      ok: false,
      status: 409,
      error: 'Cashfree order verification failed.',
    }
  }

  let verifiedPayment: (CashfreePayment & { cf_payment_id: string | number }) | undefined

  if (input.expectedPaymentId) {
    const candidate = cashfreePayments.find(
      (payment) => String(payment.cf_payment_id) === String(input.expectedPaymentId)
    )
    if (isValidSuccessPayment(candidate, orderId, expectedAmount)) {
      verifiedPayment = candidate
    }
  } else {
    const candidate = cashfreePayments.find((payment) =>
      isValidSuccessPayment(payment, orderId, expectedAmount)
    )
    if (candidate && isValidSuccessPayment(candidate, orderId, expectedAmount)) {
      verifiedPayment = candidate
    }
  }

  if (!verifiedPayment) {
    return {
      ok: false,
      status: 409,
      error: 'Cashfree successful payment verification failed.',
    }
  }

  const transactionId = String(verifiedPayment.cf_payment_id)
  const resolvedCustomerEmail =
    input.customerEmail || cashfreeOrder.customer_details?.customer_email || null

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

    return {
      ok: true,
      status: 200,
      scanId: scan.id,
      orderId,
      transactionId,
      paymentStatus: 'paid',
      alreadyPaid: true,
    }
  }

  const row = await markPaymentPaidFn({
    scanId,
    paymentProvider: 'cashfree',
    paymentReference: orderId,
    paymentTransactionId: transactionId,
    customerEmail: resolvedCustomerEmail,
  })

  if (!row) {
    const latestScan = await getScanRecordFn(scanId)
    if (latestScan && latestScan.payment_status === 'paid') {
      if (!latestScan.background_event_sent_at) {
        try {
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
        } catch (eventError) {
          console.error(
            'Failed to dispatch missing Inngest scan event for concurrent Cashfree payment:',
            eventError
          )
        }
      }

      return {
        ok: true,
        status: 200,
        scanId: latestScan.id,
        orderId,
        transactionId,
        paymentStatus: 'paid',
        alreadyPaid: true,
      }
    }

    return {
      ok: false,
      status: 409,
      error: 'Paid Cashfree order did not match the expected Locitra scan.',
    }
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

  return {
    ok: true,
    status: 200,
    scanId: row.id,
    orderId,
    transactionId,
    paymentStatus: row.payment_status,
    alreadyPaid: false,
  }
}
