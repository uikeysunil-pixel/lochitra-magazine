import { NextResponse } from 'next/server'
import {
  captureAndProcessPayPalPayment,
  PAYPAL_PLAN_PRICING,
  type CaptureOrderDependencies,
} from '@/lib/technical-seo/paypal-payment'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export { PAYPAL_PLAN_PRICING, type CaptureOrderDependencies, captureAndProcessPayPalPayment }

export async function handleCaptureOrder(request: Request, deps: CaptureOrderDependencies = {}) {
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

    const result = await captureAndProcessPayPalPayment({ orderId }, deps)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({
      success: true,
      scanId: result.scanId,
      orderId: result.orderId,
      transactionId: result.transactionId,
      status: result.status,
      paymentStatus: result.paymentStatus,
      alreadyPaid: result.alreadyPaid,
      statusUrl: result.statusUrl,
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
