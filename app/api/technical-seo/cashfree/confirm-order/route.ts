import { NextResponse } from 'next/server'
import {
  confirmAndProcessCashfreePayment,
  isCashfreePaidPlan,
  type CashfreePaymentConfirmationDependencies,
} from '@/lib/technical-seo/cashfree-payment'
import { getScanRecord, verifyReportAccessToken } from '@/lib/technical-seo/scan-repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface CashfreeConfirmOrderDependencies extends CashfreePaymentConfirmationDependencies {
  verifyReportAccessToken?: typeof verifyReportAccessToken
}

export async function handleCashfreeConfirmOrder(
  request: Request,
  deps: CashfreeConfirmOrderDependencies = {}
) {
  const getScanRecordFn = deps.getScanRecord ?? getScanRecord
  const verifyReportAccessTokenFn = deps.verifyReportAccessToken ?? verifyReportAccessToken

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 })
  }

  const scanId = typeof body.scanId === 'string' ? body.scanId.trim() : ''
  const key = typeof body.key === 'string' ? body.key.trim() : ''
  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : ''

  if (!scanId || !UUID_REGEX.test(scanId)) {
    return NextResponse.json({ error: 'Valid scanId is required.' }, { status: 400 })
  }

  if (!key) {
    return NextResponse.json({ error: 'Access key is required.' }, { status: 400 })
  }

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required.' }, { status: 400 })
  }

  const scan = await getScanRecordFn(scanId)
  if (!scan) {
    return NextResponse.json({ error: 'Locitra scan cannot be found.' }, { status: 404 })
  }

  if (!verifyReportAccessTokenFn(key, scan.report_token_hash)) {
    return NextResponse.json({ error: 'Invalid access key for this scan.' }, { status: 403 })
  }

  if (
    !isCashfreePaidPlan(scan.plan) ||
    scan.payment_provider !== 'cashfree' ||
    scan.payment_reference !== orderId ||
    scan.payment_currency !== 'INR'
  ) {
    return NextResponse.json(
      { error: 'Cashfree payment does not match the expected Locitra scan.' },
      { status: 409 }
    )
  }

  const result = await confirmAndProcessCashfreePayment(
    {
      scanId,
      orderId,
    },
    deps
  )

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({
    success: true,
    paymentStatus: 'paid',
    scanId: result.scanId,
  })
}

export async function POST(request: Request) {
  return handleCashfreeConfirmOrder(request)
}
