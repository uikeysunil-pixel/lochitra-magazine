import { NextResponse } from 'next/server'
import {
  captureAndProcessPayPalPayment,
  type CaptureOrderDependencies,
} from '@/lib/technical-seo/paypal-payment'
import {
  verifyPayPalWebhookSignature,
  type VerifyPayPalWebhookDependencies,
} from '@/lib/paypal/webhook'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export interface PayPalWebhookDependencies extends CaptureOrderDependencies {
  verifyWebhookSignature?: typeof verifyPayPalWebhookSignature
  verifyDependencies?: VerifyPayPalWebhookDependencies
}

type PayPalWebhookPayload = {
  id?: unknown
  event_type?: unknown
  resource_type?: unknown
  resource?: {
    id?: unknown
    status?: unknown
    custom_id?: unknown
    purchase_units?: Array<{
      custom_id?: unknown
      amount?: {
        currency_code?: unknown
        value?: unknown
      }
    }>
  }
}

export async function handlePayPalWebhook(request: Request, deps: PayPalWebhookDependencies = {}) {
  const verifySignatureFn = deps.verifyWebhookSignature ?? verifyPayPalWebhookSignature
  const rawBody = await request.text()

  const transmissionId = request.headers.get('paypal-transmission-id')
  const transmissionTime = request.headers.get('paypal-transmission-time')
  const certUrl = request.headers.get('paypal-cert-url')
  const authAlgo = request.headers.get('paypal-auth-algo')
  const transmissionSig = request.headers.get('paypal-transmission-sig')

  const isValid = await verifySignatureFn(
    {
      headers: {
        transmissionId,
        transmissionTime,
        certUrl,
        authAlgo,
        transmissionSig,
      },
      rawBody,
    },
    deps.verifyDependencies
  )

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid PayPal webhook signature.' }, { status: 401 })
  }

  let payload: PayPalWebhookPayload
  try {
    payload = JSON.parse(rawBody) as PayPalWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid webhook JSON payload.' }, { status: 400 })
  }

  if (payload.event_type !== 'CHECKOUT.ORDER.APPROVED') {
    return NextResponse.json({
      received: true,
      ignored: true,
      eventType: typeof payload.event_type === 'string' ? payload.event_type : 'unknown',
    })
  }

  const orderId = typeof payload.resource?.id === 'string' ? payload.resource.id.trim() : ''

  if (!orderId) {
    return NextResponse.json(
      { error: 'PayPal webhook resource missing order ID.' },
      { status: 400 }
    )
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
    paymentStatus: result.paymentStatus,
    alreadyPaid: result.alreadyPaid,
  })
}

export async function POST(request: Request) {
  return handlePayPalWebhook(request)
}
