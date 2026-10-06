'use client'

export interface CashfreeCheckoutResult {
  error?: {
    message?: string
  }
}

export type CashfreeSdk = {
  checkout: (options: {
    paymentSessionId: string
    redirectTarget: '_self'
  }) => Promise<CashfreeCheckoutResult | undefined> | CashfreeCheckoutResult | undefined
}

declare global {
  interface Window {
    Cashfree?: (options: { mode: 'sandbox' | 'production' }) => CashfreeSdk
  }
}

export async function loadCashfreeSdk(): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  if (window.Cashfree) {
    return
  }

  const existing = document.getElementById('cashfree-checkout-sdk') as HTMLScriptElement | null

  await new Promise<void>((resolve, reject) => {
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('Unable to load Cashfree Checkout.')),
        {
          once: true,
        }
      )
      return
    }

    const script = document.createElement('script')
    script.id = 'cashfree-checkout-sdk'
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Unable to load Cashfree Checkout.'))
    document.head.appendChild(script)
  })

  if (!window.Cashfree) {
    throw new Error('Cashfree Checkout SDK did not initialize.')
  }
}
