import assert from 'node:assert/strict'
import { createHmac } from 'crypto'
import { describe, it } from 'node:test'

/* Test doubles intentionally use any to match the injected repository/API seams. */
/* eslint-disable @typescript-eslint/no-explicit-any */

if (!process.env.DATABASE_URL)
  process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock'
if (!process.env.CASHFREE_CLIENT_SECRET) process.env.CASHFREE_CLIENT_SECRET = 'mock-cashfree-secret'

/* eslint-disable @typescript-eslint/no-require-imports */
const {
  handleCashfreeCreateOrder,
  CASHFREE_QUICK_PLAN_CONFIG,
} = require('../../app/api/technical-seo/cashfree/create-order/route')
const { handleCashfreeWebhook } = require('../../app/api/technical-seo/cashfree/webhook/route')
const {
  handleCashfreeConfirmOrder,
} = require('../../app/api/technical-seo/cashfree/confirm-order/route')
const {
  confirmAndProcessCashfreePayment,
  EXPECTED_AMOUNT,
  EXPECTED_CURRENCY,
} = require('./cashfree-payment')
const { verifyCashfreeWebhookSignature } = require('../cashfree/client')
/* eslint-enable @typescript-eslint/no-require-imports */

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function sign(body: string, timestamp: string) {
  return createHmac('sha256', process.env.CASHFREE_CLIENT_SECRET!)
    .update(`${timestamp}${body}`)
    .digest('base64')
}

describe('Cashfree surgical integration', () => {
  it('locks the India plan to ₹4,999 and the quick crawl limit', () => {
    assert.strictEqual(CASHFREE_QUICK_PLAN_CONFIG.amount, '4999.00')
    assert.strictEqual(CASHFREE_QUICK_PLAN_CONFIG.currency, 'INR')
    assert.strictEqual(EXPECTED_AMOUNT, 4999)
    assert.strictEqual(EXPECTED_CURRENCY, 'INR')
  })

  it('rejects non-quick plans at the Cashfree boundary', async () => {
    const response = await handleCashfreeCreateOrder(
      jsonRequest('http://localhost:3000/api/technical-seo/cashfree/create-order', {
        url: 'https://example.com',
        problem: 'indexing',
        plan: 'full',
      })
    )
    assert.strictEqual(response.status, 400)
  })

  it('creates and binds the Cashfree order without calling the real API', async () => {
    let createdScan: any = null
    let markedOrder: any = null
    let capturedCashfreeParams: any = null
    const response = await handleCashfreeCreateOrder(
      jsonRequest('http://localhost:3000/api/technical-seo/cashfree/create-order', {
        url: 'https://example.com',
        problem: 'indexing',
        plan: 'quick',
        customerPhone: '9876543210',
      }),
      {
        createScanRecord: async (input: any) => {
          createdScan = input
          return input.scanId
        },
        createCashfreeOrder: async (input: any) => {
          capturedCashfreeParams = input
          return {
            orderId: input.orderId,
            cfOrderId: 'cf-test-order',
            paymentSessionId: 'session-test',
          }
        },
        markPaymentOrderCreated: async (input: any) => {
          markedOrder = input
          return { id: input.scanId }
        },
      }
    )
    assert.strictEqual(response.status, 200)
    const data = (await response.json()) as Record<string, unknown>
    assert.strictEqual(data.provider, 'cashfree')
    assert.strictEqual(data.paymentSessionId, 'session-test')
    assert.strictEqual(createdScan.plan, 'quick')
    assert.strictEqual(createdScan.paymentCurrency, 'INR')
    assert.strictEqual(markedOrder.paymentProvider, 'cashfree')
    assert.match(capturedCashfreeParams.returnUrl, /provider=cashfree/)
    assert.match(capturedCashfreeParams.returnUrl, /order_id=\{order_id\}/)
    assert.match(capturedCashfreeParams.returnUrl, /key=/)
  })

  it('rejects Cashfree checkout when the Indian mobile number is missing or invalid', async () => {
    const response = await handleCashfreeCreateOrder(
      jsonRequest('http://localhost:3000/api/technical-seo/cashfree/create-order', {
        url: 'https://example.com',
        problem: 'indexing',
        plan: 'quick',
        customerPhone: '12345',
      }),
      {
        createScanRecord: async () => 'unused',
      }
    )
    assert.strictEqual(response.status, 400)
  })

  it('accepts an Indian phone number and optional email for Cashfree order creation', async () => {
    let customerDetails: any = null
    const response = await handleCashfreeCreateOrder(
      jsonRequest('http://localhost:3000/api/technical-seo/cashfree/create-order', {
        url: 'https://example.com',
        problem: 'indexing',
        plan: 'quick',
        customerPhone: '+91 98765 43210',
        customerEmail: 'customer@example.com',
      }),
      {
        createScanRecord: async (input: any) => input.scanId,
        createCashfreeOrder: async (input: any) => {
          customerDetails = input
          return {
            orderId: input.orderId,
            cfOrderId: 'cf-test-order',
            paymentSessionId: 'session-test',
          }
        },
        markPaymentOrderCreated: async (input: any) => ({ id: input.scanId }),
      }
    )
    assert.strictEqual(response.status, 200)
    assert.strictEqual(customerDetails.customerPhone, '9876543210')
    assert.strictEqual(customerDetails.customerEmail, 'customer@example.com')
  })

  it('rejects invalid webhook signatures', async () => {
    const body = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK', data: {} })
    const response = await handleCashfreeWebhook(
      new Request('http://localhost:3000/api/technical-seo/cashfree/webhook', {
        method: 'POST',
        headers: {
          'x-webhook-signature': 'invalid',
          'x-webhook-timestamp': '1700000000000',
        },
        body,
      })
    )
    assert.strictEqual(response.status, 401)
  })

  it('verifies Cashfree webhook signatures using timestamp plus raw body', () => {
    const body = '{"type":"PAYMENT_SUCCESS_WEBHOOK","data":{}}'
    const timestamp = '1700000000000'
    assert.strictEqual(verifyCashfreeWebhookSignature(sign(body, timestamp), timestamp, body), true)
  })

  it('marks a verified successful payment paid and dispatches the existing scan event', async () => {
    const scanId = '00000000-0000-4000-8000-000000000001'
    const orderId = 'locitra_00000000000040008000000000000001'
    const body = JSON.stringify({
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: {
          order_id: orderId,
          order_amount: 4999,
          order_currency: 'INR',
          order_tags: { scan_id: scanId },
        },
        payment: {
          cf_payment_id: '987654321',
          payment_status: 'SUCCESS',
          payment_amount: 4999,
          payment_currency: 'INR',
        },
        customer_details: { customer_email: 'customer@example.com' },
      },
    })
    let paidInput: any = null
    let eventCount = 0
    const response = await handleCashfreeWebhook(
      new Request('http://localhost:3000/api/technical-seo/cashfree/webhook', {
        method: 'POST',
        headers: {
          'x-webhook-signature': sign(body, '1700000000000'),
          'x-webhook-timestamp': '1700000000000',
        },
        body,
      }),
      {
        getCashfreeOrder: async () => ({
          order_id: orderId,
          order_status: 'PAID',
          order_amount: 4999,
          order_currency: 'INR',
          order_tags: { scan_id: scanId },
        }),
        getCashfreePayments: async () => [
          {
            cf_payment_id: '987654321',
            order_id: orderId,
            payment_status: 'SUCCESS',
            payment_amount: 4999,
            payment_currency: 'INR',
          },
        ],
        getScanRecord: async () => ({
          id: scanId,
          plan: 'quick',
          payment_provider: 'cashfree',
          payment_reference: orderId,
          payment_currency: 'INR',
          payment_status: 'pending',
          status: 'awaiting_payment',
          website_url: 'https://example.com',
          problem: 'indexing',
          background_event_sent_at: null,
        }),
        markPaymentPaid: async (input: any) => {
          paidInput = input
          return {
            id: scanId,
            website_url: 'https://example.com',
            problem: 'indexing',
            plan: 'quick',
            status: 'queued',
            payment_status: 'paid',
            background_event_sent_at: null,
          }
        },
        sendInngestEvent: async () => {
          eventCount += 1
        },
        markBackgroundEventSent: async () => undefined,
      }
    )
    assert.strictEqual(response.status, 200)
    assert.strictEqual(paidInput.paymentProvider, 'cashfree')
    assert.strictEqual(paidInput.paymentReference, orderId)
    assert.strictEqual(paidInput.paymentTransactionId, '987654321')
    assert.strictEqual(eventCount, 1)
  })

  it('rejects a validly signed webhook when the amount is wrong', async () => {
    const body = JSON.stringify({
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: {
          order_id: 'locitra_test',
          order_amount: 499,
          order_currency: 'INR',
          order_tags: { scan_id: 'scan' },
        },
        payment: {
          cf_payment_id: '1',
          payment_status: 'SUCCESS',
          payment_amount: 499,
          payment_currency: 'INR',
        },
      },
    })
    const response = await handleCashfreeWebhook(
      new Request('http://localhost:3000/api/technical-seo/cashfree/webhook', {
        method: 'POST',
        headers: {
          'x-webhook-signature': sign(body, '1700000000000'),
          'x-webhook-timestamp': '1700000000000',
        },
        body,
      })
    )
    assert.strictEqual(response.status, 400)
  })

  describe('Cashfree return confirmation endpoint', () => {
    const scanId = '11111111-1111-4111-8111-111111111111'
    const orderId = 'locitra_11111111111141118111111111111111'
    const accessKey = 'test-access-key-12345'

    function defaultMocks(
      overrides: {
        scanOverrides?: Record<string, any>
        orderOverrides?: Record<string, any>
        paymentsOverrides?: any[]
        verifyKeyResult?: boolean
      } = {}
    ) {
      let paidInput: any = null
      let eventDispatched: any = null
      let backgroundEventMarked = false

      const deps = {
        verifyReportAccessToken: () => overrides.verifyKeyResult ?? true,
        getScanRecord: async () => ({
          id: scanId,
          plan: 'quick',
          payment_provider: 'cashfree',
          payment_reference: orderId,
          payment_currency: 'INR',
          payment_status: 'pending',
          status: 'awaiting_payment',
          website_url: 'https://example.com',
          problem: 'indexing',
          report_token_hash: 'mock_hash',
          background_event_sent_at: null,
          ...overrides.scanOverrides,
        }),
        getCashfreeOrder: async () => ({
          order_id: orderId,
          order_status: 'PAID',
          order_amount: 4999,
          order_currency: 'INR',
          order_tags: { scan_id: scanId },
          customer_details: { customer_email: 'return-customer@example.com' },
          ...overrides.orderOverrides,
        }),
        getCashfreePayments: async () =>
          overrides.paymentsOverrides ?? [
            {
              cf_payment_id: 'cf_pay_999',
              order_id: orderId,
              payment_status: 'SUCCESS',
              payment_amount: 4999,
              payment_currency: 'INR',
            },
          ],
        markPaymentPaid: async (input: any) => {
          paidInput = input
          return {
            id: scanId,
            website_url: 'https://example.com',
            problem: 'indexing',
            plan: 'quick',
            status: 'queued',
            payment_status: 'paid',
            background_event_sent_at: null,
          }
        },
        sendInngestEvent: async (event: any) => {
          eventDispatched = event
        },
        markBackgroundEventSent: async () => {
          backgroundEventMarked = true
        },
      }

      return {
        deps,
        getPaidInput: () => paidInput,
        getEventDispatched: () => eventDispatched,
        isBackgroundEventMarked: () => backgroundEventMarked,
      }
    }

    it('1. valid SUCCESS payment -> paid', async () => {
      const { deps, getPaidInput } = defaultMocks()
      const response = await handleCashfreeConfirmOrder(
        jsonRequest('http://localhost:3000/api/technical-seo/cashfree/confirm-order', {
          scanId,
          key: accessKey,
          orderId,
        }),
        deps
      )
      assert.strictEqual(response.status, 200)
      const data = (await response.json()) as any
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.paymentStatus, 'paid')
      assert.strictEqual(data.scanId, scanId)
      assert.strictEqual(getPaidInput().paymentTransactionId, 'cf_pay_999')
      assert.strictEqual(getPaidInput().customerEmail, 'return-customer@example.com')
    })

    it('2. wrong amount -> rejected', async () => {
      const { deps } = defaultMocks({
        orderOverrides: { order_amount: 499 },
      })
      const response = await handleCashfreeConfirmOrder(
        jsonRequest('http://localhost:3000/api/technical-seo/cashfree/confirm-order', {
          scanId,
          key: accessKey,
          orderId,
        }),
        deps
      )
      assert.strictEqual(response.status, 409)
      const data = (await response.json()) as any
      assert.match(data.error, /verification failed/i)
    })

    it('3. wrong currency -> rejected', async () => {
      const { deps } = defaultMocks({
        orderOverrides: { order_currency: 'USD' },
      })
      const response = await handleCashfreeConfirmOrder(
        jsonRequest('http://localhost:3000/api/technical-seo/cashfree/confirm-order', {
          scanId,
          key: accessKey,
          orderId,
        }),
        deps
      )
      assert.strictEqual(response.status, 409)
      const data = (await response.json()) as any
      assert.match(data.error, /verification failed/i)
    })

    it('4. wrong order ID -> rejected', async () => {
      const { deps } = defaultMocks({
        orderOverrides: { order_id: 'mismatched_order_id' },
      })
      const response = await handleCashfreeConfirmOrder(
        jsonRequest('http://localhost:3000/api/technical-seo/cashfree/confirm-order', {
          scanId,
          key: accessKey,
          orderId,
        }),
        deps
      )
      assert.strictEqual(response.status, 409)
      const data = (await response.json()) as any
      assert.match(data.error, /verification failed/i)
    })

    it('5. wrong scan/order relationship -> rejected', async () => {
      const { deps } = defaultMocks({
        scanOverrides: { payment_reference: 'different_order' },
      })
      const response = await handleCashfreeConfirmOrder(
        jsonRequest('http://localhost:3000/api/technical-seo/cashfree/confirm-order', {
          scanId,
          key: accessKey,
          orderId,
        }),
        deps
      )
      assert.strictEqual(response.status, 409)
      const data = (await response.json()) as any
      assert.match(data.error, /match/i)
    })

    it('6. non-success payment -> rejected', async () => {
      const { deps } = defaultMocks({
        paymentsOverrides: [
          {
            cf_payment_id: 'cf_pay_failed',
            order_id: orderId,
            payment_status: 'FAILED',
            payment_amount: 4999,
            payment_currency: 'INR',
          },
        ],
      })
      const response = await handleCashfreeConfirmOrder(
        jsonRequest('http://localhost:3000/api/technical-seo/cashfree/confirm-order', {
          scanId,
          key: accessKey,
          orderId,
        }),
        deps
      )
      assert.strictEqual(response.status, 409)
      const data = (await response.json()) as any
      assert.match(data.error, /verification failed/i)
    })

    it('7. already-paid scan -> idempotent', async () => {
      let markPaymentPaidCalled = false
      const { deps } = defaultMocks({
        scanOverrides: {
          payment_status: 'paid',
          background_event_sent_at: '2026-10-01T00:00:00Z',
        },
      })
      deps.markPaymentPaid = async () => {
        markPaymentPaidCalled = true
        return null
      }

      const response = await handleCashfreeConfirmOrder(
        jsonRequest('http://localhost:3000/api/technical-seo/cashfree/confirm-order', {
          scanId,
          key: accessKey,
          orderId,
        }),
        deps
      )
      assert.strictEqual(response.status, 200)
      const data = (await response.json()) as any
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.paymentStatus, 'paid')
      assert.strictEqual(markPaymentPaidCalled, false)
    })

    it('8. valid payment dispatches scan.requested', async () => {
      const { deps, getEventDispatched, isBackgroundEventMarked } = defaultMocks()
      const response = await handleCashfreeConfirmOrder(
        jsonRequest('http://localhost:3000/api/technical-seo/cashfree/confirm-order', {
          scanId,
          key: accessKey,
          orderId,
        }),
        deps
      )
      assert.strictEqual(response.status, 200)
      const dispatched = getEventDispatched()
      assert.ok(dispatched)
      assert.strictEqual(dispatched.name, 'technical-seo/scan.requested')
      assert.strictEqual(dispatched.data.scanId, scanId)
      assert.strictEqual(dispatched.data.plan, 'quick')
      assert.strictEqual(isBackgroundEventMarked(), true)
    })

    it('9. invalid access key -> rejected', async () => {
      const { deps } = defaultMocks({
        verifyKeyResult: false,
      })
      const response = await handleCashfreeConfirmOrder(
        jsonRequest('http://localhost:3000/api/technical-seo/cashfree/confirm-order', {
          scanId,
          key: 'wrong-key',
          orderId,
        }),
        deps
      )
      assert.strictEqual(response.status, 403)
      const data = (await response.json()) as any
      assert.match(data.error, /invalid access key/i)
    })
  })
})
