import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { OrderStatus, CaptureStatus, type Order } from '@paypal/paypal-server-sdk'
import { CRAWL_LIMITS } from './crawler'

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock'
}
if (!process.env.PAYPAL_CLIENT_ID) {
  process.env.PAYPAL_CLIENT_ID = 'mock-paypal-client-id'
}
if (!process.env.PAYPAL_CLIENT_SECRET) {
  process.env.PAYPAL_CLIENT_SECRET = 'mock-paypal-client-secret'
}

/* eslint-disable @typescript-eslint/no-require-imports */
const {
  handleCreateOrder,
  PAYPAL_PAID_PLAN_CONFIG,
} = require('../../app/api/technical-seo/paypal/create-order/route')
const {
  handleCaptureOrder,
  PAYPAL_PLAN_PRICING,
} = require('../../app/api/technical-seo/paypal/capture-order/route')
/* eslint-enable @typescript-eslint/no-require-imports */

function createJsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

describe('Phase 1 — PayPal Payment Authorization & Plan Support', () => {
  describe('Create Order Authorization', () => {
    it('A: quick create-order uses $49.00 and 50 pages', async () => {
      let createdScan: Record<string, unknown> | null = null
      let createdOrder: Record<string, unknown> | null = null
      let markedOrder: Record<string, unknown> | null = null

      const request = createJsonRequest(
        'http://localhost:3000/api/technical-seo/paypal/create-order',
        {
          url: 'https://example.com/',
          problem: 'indexing',
          plan: 'quick',
        }
      )

      const response = await handleCreateOrder(request, {
        createScanRecord: async (input) => {
          createdScan = input as unknown as Record<string, unknown>
          return input.scanId
        },
        createPayPalOrder: async (input) => {
          createdOrder = input as unknown as Record<string, unknown>
          return {
            orderId: 'mock-order-quick',
            approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=mock-order-quick',
          }
        },
        markPaymentOrderCreated: async (input) => {
          markedOrder = input as unknown as Record<string, unknown>
          return {} as never
        },
      })

      assert.strictEqual(response.status, 200)
      const data = (await response.json()) as {
        scanId: string
        status: string
        plan: string
        orderId: string
        provider: string
      }

      assert.strictEqual(data.plan, 'quick')
      assert.strictEqual(data.orderId, 'mock-order-quick')
      assert.strictEqual(data.provider, 'paypal')
      assert.strictEqual(data.status, 'awaiting_payment')

      assert.ok(createdScan)
      assert.strictEqual(createdScan.plan, 'quick')
      assert.strictEqual(createdScan.maxUrls, 50)
      assert.strictEqual(createdScan.maxUrls, CRAWL_LIMITS.quick)
      assert.strictEqual(createdScan.paymentCurrency, 'USD')
      assert.strictEqual(createdScan.paymentStatus, 'pending')
      assert.strictEqual(createdScan.initialStatus, 'awaiting_payment')

      assert.ok(createdOrder)
      assert.strictEqual(createdOrder.amount, '49.00')
      assert.strictEqual(createdOrder.amount, PAYPAL_PAID_PLAN_CONFIG.quick.amount)

      assert.ok(markedOrder)
      assert.strictEqual(markedOrder.paymentReference, 'mock-order-quick')
      assert.strictEqual(markedOrder.paymentCurrency, 'USD')
    })

    it('B: full create-order uses $99.00 and 250 pages', async () => {
      let createdScan: Record<string, unknown> | null = null
      let createdOrder: Record<string, unknown> | null = null
      let markedOrder: Record<string, unknown> | null = null

      const request = createJsonRequest(
        'http://localhost:3000/api/technical-seo/paypal/create-order',
        {
          url: 'https://example.com/',
          problem: 'technical',
          plan: 'full',
        }
      )

      const response = await handleCreateOrder(request, {
        createScanRecord: async (input) => {
          createdScan = input as unknown as Record<string, unknown>
          return input.scanId
        },
        createPayPalOrder: async (input) => {
          createdOrder = input as unknown as Record<string, unknown>
          return {
            orderId: 'mock-order-full',
            approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=mock-order-full',
          }
        },
        markPaymentOrderCreated: async (input) => {
          markedOrder = input as unknown as Record<string, unknown>
          return {} as never
        },
      })

      assert.strictEqual(response.status, 200)
      const data = (await response.json()) as {
        scanId: string
        status: string
        plan: string
        orderId: string
        provider: string
      }

      assert.strictEqual(data.plan, 'full')
      assert.strictEqual(data.orderId, 'mock-order-full')
      assert.strictEqual(data.provider, 'paypal')
      assert.strictEqual(data.status, 'awaiting_payment')

      assert.ok(createdScan)
      assert.strictEqual(createdScan.plan, 'full')
      assert.strictEqual(createdScan.maxUrls, 250)
      assert.strictEqual(createdScan.maxUrls, CRAWL_LIMITS.full)
      assert.strictEqual(createdScan.paymentCurrency, 'USD')
      assert.strictEqual(createdScan.paymentStatus, 'pending')
      assert.strictEqual(createdScan.initialStatus, 'awaiting_payment')

      assert.ok(createdOrder)
      assert.strictEqual(createdOrder.amount, '99.00')
      assert.strictEqual(createdOrder.amount, PAYPAL_PAID_PLAN_CONFIG.full.amount)

      assert.ok(markedOrder)
      assert.strictEqual(markedOrder.paymentReference, 'mock-order-full')
      assert.strictEqual(markedOrder.paymentCurrency, 'USD')
    })

    it('C: deep create-order is rejected', async () => {
      let scanRecordCalled = false
      let payPalOrderCalled = false

      const request = createJsonRequest(
        'http://localhost:3000/api/technical-seo/paypal/create-order',
        {
          url: 'https://example.com/',
          problem: 'indexing',
          plan: 'deep',
        }
      )

      const response = await handleCreateOrder(request, {
        createScanRecord: async () => {
          scanRecordCalled = true
          return 'mock-id'
        },
        createPayPalOrder: async () => {
          payPalOrderCalled = true
          return { orderId: 'none', approvalUrl: 'none' }
        },
      })

      assert.strictEqual(response.status, 400)
      const data = (await response.json()) as { error: string }
      assert.match(
        data.error,
        /Only the Targeted Troubleshoot \(\$49\) and Full Troubleshoot \(\$99\)/
      )
      assert.strictEqual(scanRecordCalled, false)
      assert.strictEqual(payPalOrderCalled, false)
    })

    it('D: unknown or unpaid plans are rejected', async () => {
      const invalidPlans = ['free', 'unknown', 'enterprise', '', undefined, null, 123]

      for (const invalidPlan of invalidPlans) {
        let scanRecordCalled = false

        const request = createJsonRequest(
          'http://localhost:3000/api/technical-seo/paypal/create-order',
          {
            url: 'https://example.com/',
            problem: 'indexing',
            plan: invalidPlan,
          }
        )

        const response = await handleCreateOrder(request, {
          createScanRecord: async () => {
            scanRecordCalled = true
            return 'mock-id'
          },
        })

        assert.strictEqual(response.status, 400, `Plan ${invalidPlan} must be rejected with 400`)
        assert.strictEqual(scanRecordCalled, false)
      }
    })
  })

  describe('Capture Order Authorization & Plan Verification', () => {
    function createMockPayPalOrder(overrides: {
      orderId?: string
      scanId?: string
      amount?: string
      currency?: string
      status?: OrderStatus
      captureStatus?: CaptureStatus
    }): Order {
      const currency = overrides.currency ?? 'USD'
      const amount = overrides.amount ?? '99.00'
      const orderId = overrides.orderId ?? 'mock-order-id'
      const scanId = overrides.scanId ?? 'scan-id-1'
      const status = overrides.status ?? OrderStatus.Completed
      const captureStatus = overrides.captureStatus ?? CaptureStatus.Completed

      return {
        id: orderId,
        status,
        purchaseUnits: [
          {
            customId: scanId,
            amount: {
              currencyCode: currency,
              value: amount,
            },
            payments: {
              captures: [
                {
                  id: `capture-${orderId}`,
                  status: captureStatus,
                  amount: {
                    currencyCode: currency,
                    value: amount,
                  },
                },
              ],
            },
          },
        ],
        payer: {
          emailAddress: 'customer@example.com',
        },
      } as unknown as Order
    }

    it('E: Full capture with $99 succeeds when DB scan.plan = full', async () => {
      const orderId = 'order-full-99'
      const scanId = 'scan-full-uuid'
      let inngestDispatched = false
      let inngestEventPayload: Record<string, unknown> | null = null
      let markPaidCalled = false

      const mockOrder = createMockPayPalOrder({
        orderId,
        scanId,
        amount: '99.00',
        currency: 'USD',
      })

      const request = createJsonRequest(
        'http://localhost:3000/api/technical-seo/paypal/capture-order',
        { orderId }
      )

      const response = await handleCaptureOrder(request, {
        getPayPalOrder: async () => mockOrder,
        getScanRecord: async () =>
          ({
            id: scanId,
            website_url: 'https://example.com',
            problem: 'technical',
            plan: 'full',
            payment_provider: 'paypal',
            payment_reference: orderId,
            payment_currency: 'USD',
            payment_status: 'pending',
            status: 'awaiting_payment',
          }) as never,
        markPaymentPaid: async (input) => {
          markPaidCalled = true
          assert.strictEqual(input.scanId, scanId)
          assert.strictEqual(input.paymentReference, orderId)
          return {
            id: scanId,
            website_url: 'https://example.com',
            problem: 'technical',
            plan: 'full',
            status: 'queued',
            payment_status: 'paid',
            background_event_sent_at: null,
          } as never
        },
        sendInngestEvent: async (event) => {
          inngestDispatched = true
          inngestEventPayload = event as unknown as Record<string, unknown>
          return { ids: ['event-1'] }
        },
        markBackgroundEventSent: async () => undefined as never,
      })

      assert.strictEqual(response.status, 200)
      const data = (await response.json()) as {
        success: boolean
        scanId: string
        paymentStatus: string
        alreadyPaid: boolean
      }

      assert.strictEqual(data.success, true)
      assert.strictEqual(data.scanId, scanId)
      assert.strictEqual(data.paymentStatus, 'paid')
      assert.strictEqual(data.alreadyPaid, false)
      assert.strictEqual(markPaidCalled, true)
      assert.strictEqual(inngestDispatched, true)
      assert.ok(inngestEventPayload)
      assert.strictEqual((inngestEventPayload.data as Record<string, unknown>).plan, 'full')
    })

    it('F: Full scan with $49 PayPal order is rejected', async () => {
      const orderId = 'order-cheat-49'
      const scanId = 'scan-full-target'
      let markPaidCalled = false
      let inngestDispatched = false

      // PayPal order has $49.00
      const mockOrder = createMockPayPalOrder({
        orderId,
        scanId,
        amount: '49.00',
        currency: 'USD',
      })

      const request = createJsonRequest(
        'http://localhost:3000/api/technical-seo/paypal/capture-order',
        { orderId }
      )

      const response = await handleCaptureOrder(request, {
        getPayPalOrder: async () => mockOrder,
        getScanRecord: async () =>
          ({
            id: scanId,
            website_url: 'https://example.com',
            problem: 'indexing',
            plan: 'full', // DB scan requires Full ($99)
            payment_provider: 'paypal',
            payment_reference: orderId,
            payment_currency: 'USD',
            payment_status: 'pending',
            status: 'awaiting_payment',
          }) as never,
        markPaymentPaid: async () => {
          markPaidCalled = true
          return {} as never
        },
        sendInngestEvent: async () => {
          inngestDispatched = true
          return {}
        },
      })

      assert.strictEqual(response.status, 400)
      const data = (await response.json()) as { error: string }
      assert.strictEqual(data.error, 'PayPal payment amount does not match the scan plan.')
      assert.strictEqual(markPaidCalled, false, 'markPaymentPaid must NOT be called')
      assert.strictEqual(inngestDispatched, false, 'Inngest must NOT be dispatched')
    })

    it('G: Quick scan with $99 PayPal order is rejected', async () => {
      const orderId = 'order-mismatch-99'
      const scanId = 'scan-quick-target'
      let markPaidCalled = false
      let inngestDispatched = false

      // PayPal order has $99.00
      const mockOrder = createMockPayPalOrder({
        orderId,
        scanId,
        amount: '99.00',
        currency: 'USD',
      })

      const request = createJsonRequest(
        'http://localhost:3000/api/technical-seo/paypal/capture-order',
        { orderId }
      )

      const response = await handleCaptureOrder(request, {
        getPayPalOrder: async () => mockOrder,
        getScanRecord: async () =>
          ({
            id: scanId,
            website_url: 'https://example.com',
            problem: 'indexing',
            plan: 'quick', // DB scan requires Quick ($49)
            payment_provider: 'paypal',
            payment_reference: orderId,
            payment_currency: 'USD',
            payment_status: 'pending',
            status: 'awaiting_payment',
          }) as never,
        markPaymentPaid: async () => {
          markPaidCalled = true
          return {} as never
        },
        sendInngestEvent: async () => {
          inngestDispatched = true
          return {}
        },
      })

      assert.strictEqual(response.status, 400)
      const data = (await response.json()) as { error: string }
      assert.strictEqual(data.error, 'PayPal payment amount does not match the scan plan.')
      assert.strictEqual(markPaidCalled, false, 'markPaymentPaid must NOT be called')
      assert.strictEqual(inngestDispatched, false, 'Inngest must NOT be dispatched')
    })

    it('H: Currency other than USD is rejected', async () => {
      const orderId = 'order-eur'
      const scanId = 'scan-eur-1'
      let markPaidCalled = false

      const mockOrder = createMockPayPalOrder({
        orderId,
        scanId,
        amount: '99.00',
        currency: 'EUR', // Invalid currency
      })

      const request = createJsonRequest(
        'http://localhost:3000/api/technical-seo/paypal/capture-order',
        { orderId }
      )

      const response = await handleCaptureOrder(request, {
        getPayPalOrder: async () => mockOrder,
        getScanRecord: async () =>
          ({
            id: scanId,
            plan: 'full',
            payment_provider: 'paypal',
            payment_reference: orderId,
            payment_currency: 'USD',
          }) as never,
        markPaymentPaid: async () => {
          markPaidCalled = true
          return {} as never
        },
      })

      assert.strictEqual(response.status, 400)
      const data = (await response.json()) as { error: string }
      assert.strictEqual(data.error, 'Invalid PayPal payment amount or currency.')
      assert.strictEqual(markPaidCalled, false)
    })

    it('I: PayPal customId/scanId mismatch is rejected', async () => {
      const orderId = 'order-mismatch'
      const orderCustomId = 'scan-order-custom-id'
      let markPaidCalled = false

      // Case 1: Scan does not exist in DB
      const mockOrder = createMockPayPalOrder({
        orderId,
        scanId: orderCustomId,
        amount: '49.00',
        currency: 'USD',
      })

      const request = createJsonRequest(
        'http://localhost:3000/api/technical-seo/paypal/capture-order',
        { orderId }
      )

      const response1 = await handleCaptureOrder(request, {
        getPayPalOrder: async () => mockOrder,
        getScanRecord: async () => null,
      })

      assert.strictEqual(response1.status, 404)
      const data1 = (await response1.json()) as { error: string }
      assert.strictEqual(data1.error, 'Locitra scan cannot be found.')

      // Case 2: Scan exists but payment_reference or provider mismatches
      const request2 = createJsonRequest(
        'http://localhost:3000/api/technical-seo/paypal/capture-order',
        { orderId }
      )

      const response2 = await handleCaptureOrder(request2, {
        getPayPalOrder: async () => mockOrder,
        getScanRecord: async () =>
          ({
            id: orderCustomId,
            plan: 'quick',
            payment_provider: 'paypal',
            payment_reference: 'different-order-id', // mismatch
            payment_currency: 'USD',
            payment_status: 'pending',
          }) as never,
        markPaymentPaid: async () => {
          markPaidCalled = true
          return {} as never
        },
      })

      assert.strictEqual(response2.status, 409)
      const data2 = (await response2.json()) as { error: string }
      assert.strictEqual(data2.error, 'Payment provider, reference, or currency mismatch.')
      assert.strictEqual(markPaidCalled, false)
    })

    it('J: unpaid scan never reaches Inngest dispatch', async () => {
      const orderId = 'order-failed'
      const scanId = 'scan-failed-1'
      let inngestDispatched = false

      // PayPal order missing or throws
      const request = createJsonRequest(
        'http://localhost:3000/api/technical-seo/paypal/capture-order',
        { orderId }
      )

      const response = await handleCaptureOrder(request, {
        getPayPalOrder: async () => {
          throw new Error('PayPal API unreachable')
        },
        sendInngestEvent: async () => {
          inngestDispatched = true
          return {}
        },
      })

      assert.strictEqual(response.status, 404)
      assert.strictEqual(inngestDispatched, false)
    })

    it('K: Deep cannot reach Inngest through payment capture', async () => {
      const orderId = 'order-deep-hack'
      const scanId = 'scan-deep-id'
      let inngestDispatched = false
      let markPaidCalled = false

      // Even if order amount is $99.00 or $199.00
      const mockOrder = createMockPayPalOrder({
        orderId,
        scanId,
        amount: '99.00',
        currency: 'USD',
      })

      const request = createJsonRequest(
        'http://localhost:3000/api/technical-seo/paypal/capture-order',
        { orderId }
      )

      const response = await handleCaptureOrder(request, {
        getPayPalOrder: async () => mockOrder,
        getScanRecord: async () =>
          ({
            id: scanId,
            plan: 'deep', // Deep plan
            payment_provider: 'paypal',
            payment_reference: orderId,
            payment_currency: 'USD',
            payment_status: 'pending',
          }) as never,
        markPaymentPaid: async () => {
          markPaidCalled = true
          return {} as never
        },
        sendInngestEvent: async () => {
          inngestDispatched = true
          return {}
        },
      })

      assert.strictEqual(response.status, 400)
      const data = (await response.json()) as { error: string }
      assert.strictEqual(data.error, "Plan 'deep' is not eligible for paid PayPal capture.")
      assert.strictEqual(markPaidCalled, false)
      assert.strictEqual(inngestDispatched, false)
    })

    it('L: already-paid idempotent path remains intact', async () => {
      const orderId = 'order-already-paid'
      const scanId = 'scan-paid-id'
      let captureCalled = false
      let markPaidCalled = false
      let inngestDispatched = false

      const mockOrder = createMockPayPalOrder({
        orderId,
        scanId,
        amount: '99.00',
        currency: 'USD',
      })

      const request = createJsonRequest(
        'http://localhost:3000/api/technical-seo/paypal/capture-order',
        { orderId }
      )

      const response = await handleCaptureOrder(request, {
        getPayPalOrder: async () => mockOrder,
        getScanRecord: async () =>
          ({
            id: scanId,
            plan: 'full',
            payment_provider: 'paypal',
            payment_reference: orderId,
            payment_currency: 'USD',
            payment_status: 'paid', // Already paid
            payment_transaction_id: 'existing-tx-123',
            status: 'running',
          }) as never,
        capturePayPalOrder: async () => {
          captureCalled = true
          return {}
        },
        markPaymentPaid: async () => {
          markPaidCalled = true
          return {} as never
        },
        sendInngestEvent: async () => {
          inngestDispatched = true
          return {}
        },
      })

      assert.strictEqual(response.status, 200)
      const data = (await response.json()) as {
        success: boolean
        scanId: string
        orderId: string
        transactionId: string
        paymentStatus: string
        alreadyPaid: boolean
      }

      assert.strictEqual(data.success, true)
      assert.strictEqual(data.alreadyPaid, true)
      assert.strictEqual(data.transactionId, 'existing-tx-123')
      assert.strictEqual(data.paymentStatus, 'paid')
      assert.strictEqual(captureCalled, false, 'Capture must not be re-executed')
      assert.strictEqual(markPaidCalled, false, 'DB update must not be re-executed')
      assert.strictEqual(inngestDispatched, false, 'Inngest event must not be re-dispatched')
    })
  })
})
