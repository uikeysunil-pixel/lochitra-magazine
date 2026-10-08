import { paypalClient } from './client'

export interface PayPalWebhookHeaders {
  transmissionId: string | null
  transmissionTime: string | null
  certUrl: string | null
  authAlgo: string | null
  transmissionSig: string | null
}

export interface VerifyPayPalWebhookParams {
  headers: PayPalWebhookHeaders
  rawBody: string
  webhookId?: string
}

export interface VerifyPayPalWebhookDependencies {
  fetch?: typeof fetch
  getAccessToken?: () => Promise<string>
  webhookId?: string
}

export function isValidPayPalCertUrl(url: string | null): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    const hostname = parsed.hostname.toLowerCase()
    return (
      hostname === 'api.paypal.com' ||
      hostname === 'api.sandbox.paypal.com' ||
      hostname.endsWith('.paypal.com')
    )
  } catch {
    return false
  }
}

export async function verifyPayPalWebhookSignature(
  params: VerifyPayPalWebhookParams,
  deps: VerifyPayPalWebhookDependencies = {}
): Promise<boolean> {
  const { transmissionId, transmissionTime, certUrl, authAlgo, transmissionSig } = params.headers

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return false
  }

  if (!isValidPayPalCertUrl(certUrl)) {
    return false
  }

  const webhookId = deps.webhookId ?? params.webhookId ?? process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) {
    return false
  }

  let webhookEvent: unknown
  try {
    webhookEvent = JSON.parse(params.rawBody)
  } catch {
    return false
  }

  const fetchFn = deps.fetch ?? fetch
  const getAccessTokenFn =
    deps.getAccessToken ??
    (async () => {
      const token = await paypalClient.clientCredentialsAuthManager.fetchToken()
      if (!token?.accessToken) {
        throw new Error('Missing PayPal OAuth access token')
      }
      return token.accessToken
    })

  const isLive = process.env.PAYPAL_ENVIRONMENT?.toLowerCase() === 'live'
  const baseUrl = isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

  try {
    const accessToken = await getAccessTokenFn()
    const response = await fetchFn(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: webhookEvent,
      }),
    })

    if (!response.ok) {
      return false
    }

    const data = (await response.json()) as { verification_status?: string }
    return data.verification_status === 'SUCCESS'
  } catch {
    return false
  }
}
