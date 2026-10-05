import { createHmac, timingSafeEqual } from 'crypto'

export const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION || '2025-01-01'

export type CashfreeEnvironment = 'sandbox' | 'production'

function getEnvironment(): CashfreeEnvironment {
  return process.env.CASHFREE_ENVIRONMENT?.toLowerCase() === 'production' ? 'production' : 'sandbox'
}

export function getCashfreeEnvironment(): CashfreeEnvironment {
  return getEnvironment()
}

function getRequiredEnv(name: 'CASHFREE_CLIENT_ID' | 'CASHFREE_CLIENT_SECRET') {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} must be configured.`)
  }
  return value
}

function getBaseUrl() {
  return getEnvironment() === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg'
}

export interface CashfreeOrder {
  cf_order_id?: string
  order_id?: string
  order_amount?: number
  order_currency?: string
  order_status?: string
  payment_session_id?: string
  order_tags?: Record<string, string>
  customer_details?: {
    customer_email?: string | null
    customer_phone?: string | null
  }
}

export interface CashfreePayment {
  cf_payment_id?: number | string
  order_id?: string
  payment_currency?: string
  order_amount?: number
  payment_amount?: number
  payment_status?: string
  payment_message?: string
}

async function cashfreeRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const clientId = getRequiredEnv('CASHFREE_CLIENT_ID')
  const clientSecret = getRequiredEnv('CASHFREE_CLIENT_SECRET')

  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-version': CASHFREE_API_VERSION,
      'x-client-id': clientId,
      'x-client-secret': clientSecret,
      ...(init.headers ?? {}),
    },
  })

  const raw = await response.text()
  let data: unknown = null

  try {
    data = raw ? JSON.parse(raw) : null
  } catch {
    data = null
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message?: unknown }).message === 'string'
        ? (data as { message: string }).message
        : 'Cashfree API request failed.'

    throw new Error(message)
  }

  return data as T
}

export interface CreateCashfreeOrderParams {
  orderId: string
  amount: string
  scanId: string
  returnUrl: string
  notifyUrl: string
  customerPhone: string
  customerEmail?: string
}

export interface CreateCashfreeOrderResult {
  orderId: string
  cfOrderId: string | null
  paymentSessionId: string
}

export async function createCashfreeOrder({
  orderId,
  amount,
  scanId,
  returnUrl,
  notifyUrl,
  customerPhone,
  customerEmail,
}: CreateCashfreeOrderParams): Promise<CreateCashfreeOrderResult> {
  const response = await cashfreeRequest<CashfreeOrder>('/orders', {
    method: 'POST',
    headers: {
      'x-idempotency-key': orderId,
    },
    body: JSON.stringify({
      order_id: orderId,
      order_amount: Number(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: `locitra_${scanId.replace(/-/g, '')}`,
        customer_phone: customerPhone,
        ...(customerEmail ? { customer_email: customerEmail } : {}),
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: notifyUrl,
      },
      order_tags: {
        scan_id: scanId,
        plan: 'quick',
        product: 'technical-seo',
      },
      order_note: 'Locitra Technical SEO Targeted Troubleshoot',
    }),
  })

  if (response.order_id !== orderId) {
    throw new Error('Cashfree order creation failed: order ID mismatch.')
  }

  if (!response.payment_session_id) {
    throw new Error('Cashfree order creation failed: missing payment session ID.')
  }

  if (response.order_currency !== 'INR' || Number(response.order_amount) !== Number(amount)) {
    throw new Error('Cashfree order creation failed: amount or currency mismatch.')
  }

  return {
    orderId: response.order_id,
    cfOrderId: response.cf_order_id ?? null,
    paymentSessionId: response.payment_session_id,
  }
}

export async function getCashfreeOrder(orderId: string): Promise<CashfreeOrder> {
  return cashfreeRequest<CashfreeOrder>(`/orders/${encodeURIComponent(orderId)}`, {
    method: 'GET',
  })
}

export async function getCashfreePayments(orderId: string): Promise<CashfreePayment[]> {
  return cashfreeRequest<CashfreePayment[]>(`/orders/${encodeURIComponent(orderId)}/payments`, {
    method: 'GET',
  })
}

export function verifyCashfreeWebhookSignature(
  signature: string | null,
  timestamp: string | null,
  rawBody: string
) {
  const secret = process.env.CASHFREE_CLIENT_SECRET
  if (!secret || !signature || !timestamp) return false

  const expected = createHmac('sha256', secret).update(`${timestamp}${rawBody}`).digest('base64')

  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (actualBuffer.length !== expectedBuffer.length) return false

  return timingSafeEqual(actualBuffer, expectedBuffer)
}
