import { NextResponse } from 'next/server'
import { inngest } from '@/inngest/client'
import {
  markBackgroundEventSent,
  markCheckoutFailed,
  markCheckoutPaid,
} from '@/lib/technical-seo/scan-repository'
import { verifyStripeWebhookSignature } from '@/lib/technical-seo/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET must be configured.')
  return secret
}

function getInngestScanData(scan: {
  id: string
  website_url: string
  problem: string
  plan: string
}) {
  return {
    scanId: scan.id,
    url: scan.website_url,
    problem: scan.problem,
    plan: scan.plan,
  }
}

export async function POST(request: Request) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  try {
    verifyStripeWebhookSignature(payload, signature, getWebhookSecret())
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid Stripe webhook signature.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  let event: {
    id?: string
    type?: string
    data?: {
      object?: {
        id?: string
        payment_status?: string
        payment_intent?: string | null
        customer_details?: { email?: string | null }
        metadata?: Record<string, string>
      }
    }
  }

  try {
    event = JSON.parse(payload)
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 })
  }

  const session = event.data?.object
  const scanId = session?.metadata?.scan_id
  const sessionId = session?.id

  if (!scanId || !sessionId) {
    return NextResponse.json({ received: true })
  }

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    if (event.type === 'checkout.session.completed' && session.payment_status !== 'paid') {
      return NextResponse.json({ received: true, pending: true })
    }

    const row = await markCheckoutPaid({
      scanId,
      checkoutSessionId: sessionId,
      paymentIntentId: session.payment_intent,
      customerEmail: session.customer_details?.email,
    })

    if (!row) {
      return NextResponse.json(
        { error: 'Paid Checkout Session did not match a pending Locitra scan.' },
        { status: 409 }
      )
    }

    if (!row.background_event_sent_at) {
      await inngest.send({
        id: `technical-seo-paid-scan-${row.id}`,
        name: 'technical-seo/scan.requested',
        data: getInngestScanData({
          id: row.id,
          website_url: row.website_url,
          problem: row.problem,
          plan: row.plan,
        }),
      })

      await markBackgroundEventSent(row.id)
    }

    return NextResponse.json({ received: true })
  }

  if (event.type === 'checkout.session.async_payment_failed') {
    await markCheckoutFailed(
      scanId,
      sessionId,
      'Stripe reported that the payment could not be completed.'
    )
    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ received: true })
}
