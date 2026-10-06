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
  CASHFREE_PAID_PLAN_CONFIG,
  isCashfreePaidPlan,
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
  it('locks the India plans to fixed canonical INR pricing and crawl limits', () => {
    assert.strictEqual(CASHFREE_QUICK_PLAN_CONFIG.amount, '4999.00')
    assert.strictEqual(CASHFREE_QUICK_PLAN_CONFIG.currency, 'INR')
    assert.strictEqual(CASHFREE_QUICK_PLAN_CONFIG.maxUrls, 50)

    assert.strictEqual(CASHFREE_PAID_PLAN_CONFIG.quick.amount, '4999.00')
    assert.strictEqual(CASHFREE_PAID_PLAN_CONFIG.quick.numericAmount, 4999)
    assert.strictEqual(CASHFREE_PAID_PLAN_CONFIG.quick.maxUrls, 50)
    assert.strictEqual(CASHFREE_PAID_PLAN_CONFIG.quick.currency, 'INR')

    assert.strictEqual(CASHFREE_PAID_PLAN_CONFIG.full.amount, '9999.00')
    assert.strictEqual(CASHFREE_PAID_PLAN_CONFIG.full.numericAmount, 9999)
    assert.strictEqual(CASHFREE_PAID_PLAN_CONFIG.full.maxUrls, 250)
    assert.strictEqual(CASHFREE_PAID_PLAN_CONFIG.full.currency, 'INR')

    assert.strictEqual(CASHFREE_PAID_PLAN_CONFIG.deep.amount, '19999.00')
    assert.strictEqual(CASHFREE_PAID_PLAN_CONFIG.deep.numericAmount, 19999)
    assert.strictEqual(CASHFREE_PAID_PLAN_CONFIG.deep.maxUrls, 1000)
    assert.strictEqual(CASHFREE_PAID_PLAN_CONFIG.deep.currency, 'INR')

    assert.strictEqual(EXPECTED_AMOUNT, 4999)
    assert.strictEqual(EXPECTED_CURRENCY, 'INR')

    assert.strictEqual(isCashfreePaidPlan('quick'), true)
    assert.strictEqual(isCashfreePaidPlan('full'), true)
    assert.strictEqual(isCashfreePaidPlan('deep'), true)
    assert.strictEqual(isCashfreePaidPlan('free'), false)
    assert.strictEqual(isCashfreePaidPlan('enterprise'), false)
  })

  it('rejects unsupported plans at the Cashfree boundary', async () => {
    const response = await handleCashfreeCreateOrder(
      jsonRequest('http://localhost:3000/api/technical-seo/cashfree/create-order', {
        url: 'https://example.com',
        problem: 'indexing',
        plan: 'free',
        billingCountry: 'IN',
        customerPhone: '9876543210',
      })
    )
    assert.strictEqual(response.status, 400)
  })

  it('rejects non-India billing countries at the Cashfree boundary', async () => {
    const response = await handleCashfreeCreateOrder(
      jsonRequest('http://localhost:3000/api/technical-seo/cashfree/create-order', {
        url: 'https://example.com',
        problem: 'indexing',
        plan: 'quick',
        billingCountry: 'US',
        customerPhone: '9876543210',
      })
    )
    assert.strictEqual(response.status, 400)
  })

  it('creates and binds the Cashfree order for Quick plan (₹4,999, maxUrls 50)', async () => {
    let createdScan: any = null
    let markedOrder: any = null
    let capturedCashfreeParams: any = null
    const response = await handleCashfreeCreateOrder(
      jsonRequest('http://localhost:3000/api/technical-seo/cashfree/create-order', {
        url: 'https://example.com',
        problem: 'indexing',
        plan: 'quick',
        customerPhone: '9876543210',
        billingCountry: 'IN',
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
    assert.strictEqual(data.plan, 'quick')
    assert.strictEqual(data.paymentSessionId, 'session-test')
    assert.strictEqual(createdScan.plan, 'quick')
    assert.strictEqual(createdScan.maxUrls, 50)
    assert.strictEqual(createdScan.paymentCurrency, 'INR')
    assert.strictEqual(capturedCashfreeParams.amount, '4999.00')
    assert.strictEqual(markedOrder.paymentProvider, 'cashfree')
    assert.match(capturedCashfreeParams.returnUrl, /provider=cashfree/)
    assert.match(capturedCashfreeParams.returnUrl, /order_id=\{order_id\}/)
    assert.match(capturedCashfreeParams.returnUrl, /key=/)
  })

  it('creates and binds the Cashfree order for Full plan (₹9,999, maxUrls 250)', async () => {
    let createdScan: any = null
    let markedOrder: any = null
    let capturedCashfreeParams: any = null
    const response = await handleCashfreeCreateOrder(
      jsonRequest('http://localhost:3000/api/technical-seo/cashfree/create-order', {
        url: 'https://example.com',
        problem: 'technical',
        plan: 'full',
        customerPhone: '9876543210',
        billingCountry: 'IN',
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
            cfOrderId: 'cf-test-order-full',
            paymentSessionId: 'session-test-full',
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
    assert.strictEqual(data.plan, 'full')
    assert.strictEqual(data.paymentSessionId, 'session-test-full')
    assert.strictEqual(createdScan.plan, 'full')
    assert.strictEqual(createdScan.maxUrls, 250)
    assert.strictEqual(createdScan.paymentCurrency, 'INR')
    assert.strictEqual(capturedCashfreeParams.amount, '9999.00')
    assert.strictEqual(markedOrder.paymentProvider, 'cashfree')
  })

  it('creates and binds Cashfree order for pre-existing Deep plan without creating duplicate scan', async () => {
    const existingScanId = '33333333-3333-4333-8333-333333333333'
    const accessKey = 'deep-access-key'
    let capturedCashfreeParams: any = null
    let markedOrder: any = null

    const response = await handleCashfreeCreateOrder(
      jsonRequest('http://localhost:3000/api/technical-seo/cashfree/create-order', {
        scanId: existingScanId,
        key: accessKey,
        plan: 'deep',
        customerPhone: '9876543210',
        billingCountry: 'IN',
      }),
      {
        getDeepScanAuthorizationRecord: async () => ({
          id: existingScanId,
          plan: 'deep',
          status: 'awaiting_payment',
          gsc_property: 'https://example.com/',
          gsc_refresh_token_encrypted: 'encrypted-token',
          payment_status: 'pending',
          payment_provider: null,
          payment_reference: null,
          report_token_hash: 'mock-hash',
        }),
        verifyReportAccessToken: () => true,
        createCashfreeOrder: async (input: any) => {
          capturedCashfreeParams = input
          return {
            orderId: input.orderId,
            cfOrderId: 'cf-deep-order',
            paymentSessionId: 'session-deep',
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
    assert.strictEqual(data.scanId, existingScanId)
    assert.strictEqual(data.plan, 'deep')
    assert.strictEqual(data.paymentSessionId, 'session-deep')
    assert.strictEqual(capturedCashfreeParams.amount, '19999.00')
    assert.strictEqual(capturedCashfreeParams.scanId, existingScanId)
    assert.strictEqual(markedOrder.paymentProvider, 'cashfree')
    assert.strictEqual(markedOrder.paymentCurrency, 'INR')
  })

  it('rejects Cashfree checkout when the Indian mobile number is missing or invalid', async () => {
    const response = await handleCashfreeCreateOrder(
      jsonRequest('http://localhost:3000/api/technical-seo/cashfree/create-order', {
        url: 'https://example.com',
        problem: 'indexing',
        plan: 'quick',
        customerPhone: '12345',
        billingCountry: 'IN',
      }),
      {
        createScanRecord: async () => 'unused',
      }
    )
    assert.strictEqual(response.status, 400)
  })

  it('accepts an Indian phone number with +91 prefix and optional email', async () => {
    let customerDetails: any = null
    const response = await handleCashfreeCreateOrder(
      jsonRequest('http://localhost:3000/api/technical-seo/cashfree/create-order', {
        url: 'https://example.com',
        problem: 'indexing',
        plan: 'quick',
        customerPhone: '+91 98765 43210',
        customerEmail: 'customer@example.com',
        billingCountry: 'IN',
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

  it('webhook: marks a verified successful payment paid and dispatches scan.requested', async () => {
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

  it('webhook: rejects when the amount does not match the scan plan', async () => {
    const scanId = '00000000-0000-4000-8000-000000000002'
    const orderId = 'locitra_00000000000040008000000000000002'
    const body = JSON.stringify({
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: {
          order_id: orderId,
          order_amount: 499,
          order_currency: 'INR',
          order_tags: { scan_id: scanId },
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
      }),
      {
        getScanRecord: async () => ({
          id: scanId,
          plan: 'quick',
          payment_provider: 'cashfree',
          payment_reference: orderId,
          payment_currency: 'INR',
        }),
      }
    )
    assert.strictEqual(response.status, 400)
  })

  describe('Cashfree return confirmation & multi-plan verification', () => {
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
            plan: overrides.scanOverrides?.plan ?? 'quick',
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

    /* ================= Quick plan coverage ================= */
    it('Quick: ₹4,999 + INR + quick -> accepted', async () => {
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

    it('Quick: ₹9,999 + INR + quick -> rejected', async () => {
      const { deps } = defaultMocks({
        orderOverrides: { order_amount: 9999 },
        paymentsOverrides: [
          {
            cf_payment_id: 'cf_pay_999',
            order_id: orderId,
            payment_status: 'SUCCESS',
            payment_amount: 9999,
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
    })

    it('Quick: ₹19,999 + INR + quick -> rejected', async () => {
      const { deps } = defaultMocks({
        orderOverrides: { order_amount: 19999 },
        paymentsOverrides: [
          {
            cf_payment_id: 'cf_pay_999',
            order_id: orderId,
            payment_status: 'SUCCESS',
            payment_amount: 19999,
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
    })

    /* ================= Full plan coverage ================= */
    it('Full: ₹9,999 + INR + full -> accepted', async () => {
      const { deps, getPaidInput } = defaultMocks({
        scanOverrides: { plan: 'full' },
        orderOverrides: { order_amount: 9999 },
        paymentsOverrides: [
          {
            cf_payment_id: 'cf_pay_full_1',
            order_id: orderId,
            payment_status: 'SUCCESS',
            payment_amount: 9999,
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
      assert.strictEqual(response.status, 200)
      const data = (await response.json()) as any
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.paymentStatus, 'paid')
      assert.strictEqual(getPaidInput().paymentTransactionId, 'cf_pay_full_1')
    })

    it('Full: ₹4,999 + INR + full -> rejected', async () => {
      const { deps } = defaultMocks({
        scanOverrides: { plan: 'full' },
        orderOverrides: { order_amount: 4999 },
        paymentsOverrides: [
          {
            cf_payment_id: 'cf_pay_full_wrong',
            order_id: orderId,
            payment_status: 'SUCCESS',
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
    })

    it('Full: ₹19,999 + INR + full -> rejected', async () => {
      const { deps } = defaultMocks({
        scanOverrides: { plan: 'full' },
        orderOverrides: { order_amount: 19999 },
        paymentsOverrides: [
          {
            cf_payment_id: 'cf_pay_full_wrong2',
            order_id: orderId,
            payment_status: 'SUCCESS',
            payment_amount: 19999,
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
    })

    /* ================= Deep plan coverage ================= */
    it('Deep: ₹19,999 + INR + deep -> accepted', async () => {
      const { deps, getPaidInput } = defaultMocks({
        scanOverrides: { plan: 'deep' },
        orderOverrides: { order_amount: 19999 },
        paymentsOverrides: [
          {
            cf_payment_id: 'cf_pay_deep_1',
            order_id: orderId,
            payment_status: 'SUCCESS',
            payment_amount: 19999,
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
      assert.strictEqual(response.status, 200)
      const data = (await response.json()) as any
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.paymentStatus, 'paid')
      assert.strictEqual(getPaidInput().paymentTransactionId, 'cf_pay_deep_1')
    })

    it('Deep: ₹4,999 + INR + deep -> rejected', async () => {
      const { deps } = defaultMocks({
        scanOverrides: { plan: 'deep' },
        orderOverrides: { order_amount: 4999 },
        paymentsOverrides: [
          {
            cf_payment_id: 'cf_pay_deep_wrong1',
            order_id: orderId,
            payment_status: 'SUCCESS',
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
    })

    it('Deep: ₹9,999 + INR + deep -> rejected', async () => {
      const { deps } = defaultMocks({
        scanOverrides: { plan: 'deep' },
        orderOverrides: { order_amount: 9999 },
        paymentsOverrides: [
          {
            cf_payment_id: 'cf_pay_deep_wrong2',
            order_id: orderId,
            payment_status: 'SUCCESS',
            payment_amount: 9999,
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
    })

    /* ================= Currency checks ================= */
    it('Currency: USD payment for Cashfree plan -> rejected', async () => {
      const { deps } = defaultMocks({
        orderOverrides: { order_currency: 'USD' },
        paymentsOverrides: [
          {
            cf_payment_id: 'cf_pay_usd',
            order_id: orderId,
            payment_status: 'SUCCESS',
            payment_amount: 4999,
            payment_currency: 'USD',
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

    /* ================= Status checks ================= */
    it('Status: Unpaid Cashfree order -> rejected', async () => {
      const { deps } = defaultMocks({
        orderOverrides: { order_status: 'ACTIVE' },
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

    it('Status: Payment not SUCCESS -> rejected', async () => {
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

    /* ================= Cross-scan checks ================= */
    it('Cross-scan: order_tags.scan_id does not match scan ID -> rejected', async () => {
      const { deps } = defaultMocks({
        orderOverrides: { order_tags: { scan_id: 'different-scan-id' } },
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

    /* ================= Provider checks ================= */
    it('Provider: scan assigned to PayPal -> Cashfree confirmation rejected', async () => {
      const { deps } = defaultMocks({
        scanOverrides: { payment_provider: 'paypal' },
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
      assert.match(data.error, /match the expected/i)
    })

    /* ================= Idempotency checks ================= */
    it('Idempotency: Already-paid scan confirmed again -> safe/idempotent, no duplicate Inngest event', async () => {
      let markPaymentPaidCalled = false
      let inngestEventCalled = false
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
      deps.sendInngestEvent = async () => {
        inngestEventCalled = true
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
      assert.strictEqual(inngestEventCalled, false)
    })

    it('Dispatches scan.requested with correct plan data for paid scan', async () => {
      const { deps, getEventDispatched, isBackgroundEventMarked } = defaultMocks({
        scanOverrides: { plan: 'full' },
        orderOverrides: { order_amount: 9999 },
        paymentsOverrides: [
          {
            cf_payment_id: 'cf_pay_full_disp',
            order_id: orderId,
            payment_status: 'SUCCESS',
            payment_amount: 9999,
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
      assert.strictEqual(response.status, 200)
      const dispatched = getEventDispatched()
      assert.ok(dispatched)
      assert.strictEqual(dispatched.name, 'technical-seo/scan.requested')
      assert.strictEqual(dispatched.data.scanId, scanId)
      assert.strictEqual(dispatched.data.plan, 'full')
      assert.strictEqual(isBackgroundEventMarked(), true)
    })

    it('Invalid access key -> rejected with 403', async () => {
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
