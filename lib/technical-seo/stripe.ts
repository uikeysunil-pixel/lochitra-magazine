import { createHmac, timingSafeEqual } from 'crypto'

const STRIPE_API_BASE = 'https://api.stripe.com/v1'

function getStripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY must be configured.')
  }
  return key
}

export async function createStripeCheckoutSession(input: {
  priceId: string
  scanId: string
  websiteUrl: string
  problem: string
  successUrl: string
  cancelUrl: string
}) {
  const body = new URLSearchParams()
  body.set('mode', 'payment')
  body.set('line_items[0][price]', input.priceId)
  body.set('line_items[0][quantity]', '1')
  body.set('success_url', input.successUrl)
  body.set('cancel_url', input.cancelUrl)
  body.set('client_reference_id', input.scanId)
  body.set('metadata[scan_id]', input.scanId)
  body.set('metadata[website_url]', input.websiteUrl)
  body.set('metadata[problem]', input.problem)
  body.set('metadata[plan]', 'quick')

  const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  })

  const data = (await response.json()) as {
    id?: string
    url?: string
    error?: { message?: string }
  }

  if (!response.ok || !data.id || !data.url) {
    throw new Error(data.error?.message || 'Unable to create Stripe Checkout Session.')
  }

  return {
    id: data.id,
    url: data.url,
  }
}

export function getQuickPriceId() {
  const priceId = process.env.STRIPE_QUICK_PRICE_ID
  if (!priceId) {
    throw new Error('STRIPE_QUICK_PRICE_ID must be configured.')
  }
  return priceId
}

export function verifyStripeWebhookSignature(
  payload: string,
  signatureHeader: string | null,
  endpointSecret: string
) {
  if (!signatureHeader) {
    throw new Error('Missing Stripe-Signature header.')
  }

  const parts = signatureHeader.split(',').reduce<Record<string, string[]>>((acc, part) => {
    const [key, value] = part.split('=', 2)
    if (key && value) {
      acc[key] = [...(acc[key] || []), value]
    }
    return acc
  }, {})

  const timestamp = parts.t?.[0]
  const signatures = parts.v1 || []

  if (!timestamp || signatures.length === 0) {
    throw new Error('Invalid Stripe-Signature header.')
  }

  const timestampNumber = Number(timestamp)
  if (!Number.isFinite(timestampNumber)) {
    throw new Error('Invalid Stripe webhook timestamp.')
  }

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestampNumber)
  if (ageSeconds > 300) {
    throw new Error('Stripe webhook timestamp is outside the allowed tolerance.')
  }

  const signedPayload = `${timestamp}.${payload}`
  const expectedHex = createHmac('sha256', endpointSecret)
    .update(signedPayload, 'utf8')
    .digest('hex')

  const expectedBuffer = Buffer.from(expectedHex, 'hex')
  const valid = signatures.some((signature) => {
    const signatureBuffer = Buffer.from(signature, 'hex')
    return (
      signatureBuffer.length === expectedBuffer.length &&
      timingSafeEqual(signatureBuffer, expectedBuffer)
    )
  })

  if (!valid) {
    throw new Error('Stripe webhook signature verification failed.')
  }
}
