import {
  CheckoutPaymentIntent,
  OrdersController,
  PaypalExperienceUserAction,
  PaypalWalletContextShippingPreference,
} from '@paypal/paypal-server-sdk'
import { paypalClient } from './client'

const ordersController = new OrdersController(paypalClient)

export interface CreatePayPalOrderParams {
  amount: string
  scanId: string
  returnUrl: string
  cancelUrl: string
}

export interface CreatePayPalOrderResult {
  orderId: string
  approvalUrl: string
}

export async function createPayPalOrder({
  amount,
  scanId,
  returnUrl,
  cancelUrl,
}: CreatePayPalOrderParams): Promise<CreatePayPalOrderResult> {
  const { result } = await ordersController.createOrder({
    body: {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          customId: scanId,
          description: 'Locitra Technical SEO Troubleshoot',
          amount: {
            currencyCode: 'USD',
            value: amount,
          },
        },
      ],
      paymentSource: {
        paypal: {
          experienceContext: {
            brandName: 'Locitra',
            userAction: PaypalExperienceUserAction.PayNow,
            returnUrl,
            cancelUrl,
            shippingPreference: PaypalWalletContextShippingPreference.NoShipping,
          },
        },
      },
    },
  })

  if (!result.id) {
    throw new Error('PayPal order creation failed: missing order ID')
  }

  const approvalLink =
    result.links?.find((link) => link.rel === 'payer-action') ??
    result.links?.find((link) => link.rel === 'approve')

  if (!approvalLink?.href) {
    throw new Error('PayPal order creation failed: missing approval URL')
  }

  return {
    orderId: result.id,
    approvalUrl: approvalLink.href,
  }
}

export async function capturePayPalOrder(orderId: string): Promise<unknown> {
  const { result } = await ordersController.captureOrder({
    id: orderId,
  })

  return result
}
