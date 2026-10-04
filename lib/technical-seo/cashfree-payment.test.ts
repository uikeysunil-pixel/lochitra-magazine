import assert from 'node:assert/strict'
import { createHmac } from 'crypto'
import { describe, it } from 'node:test'

if (!process.env.DATABASE_URL) process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock'
if (!process.env.CASHFREE_CLIENT_SECRET) process.env.CASHFREE_CLIENT_SECRET = 'mock-cashfree-secret'

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
const { handleCashfreeCreateOrder, CASHFREE_QUICK_PLAN_CONFIG } =
  require('../../app/api/technical-seo/cashfree/create-order/route')
const { handleCashfreeWebhook } = require('../../app/api/technical-seo/cashfree/webhook/route')
const { verifyCashfreeWebhookSignature } = require('../cashfree/client')
/* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */

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
    const response = await handleCashfreeCreateOrder(
      jsonRequest('http://localhost:3000/api/technical-seo/cashfree/create-order', {
        url: 'https://example.com',
        problem: 'indexing',
        plan: 'quick',
      }),
      {
        createScanRecord: async (input: any) => { createdScan = input; return input.scanId },
        createCashfreeOrder: async (input: any) => ({
          orderId: input.orderId,
          cfOrderId: 'cf-test-order',
          paymentSessionId: 'session-test',
        }),
        markPaymentOrderCreated: async (input: any) => { markedOrder = input; return { id: input.scanId } },
      }
    )
    assert.strictEqual(response.status, 200)
    const data = (await response.json()) as Record<string, unknown>
    assert.strictEqual(data.provider, 'cashfree')
    assert.strictEqual(data.paymentSessionId, 'session-test')
    assert.strictEqual(createdScan.plan, 'quick')
    assert.strictEqual(createdScan.paymentCurrency, 'INR')
    assert.strictEqual(markedOrder.paymentProvider, 'cashfree')
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
        order: { order_id: orderId, order_amount: 4999, order_currency: 'INR', order_tags: { scan_id: scanId } },
        payment: { cf_payment_id: '987654321', payment_status: 'SUCCESS', payment_amount: 4999, payment_currency: 'INR' },
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
        getCashfreeOrder: async () => ({ order_id: orderId, order_status: 'PAID', order_amount: 4999, order_currency: 'INR', order_tags: { scan_id: scanId } }),
        getCashfreePayments: async () => [{ cf_payment_id: '987654321', order_id: orderId, payment_status: 'SUCCESS', payment_amount: 4999, payment_currency: 'INR' }],
        getScanRecord: async () => ({ id: scanId, plan: 'quick', payment_provider: 'cashfree', payment_reference: orderId, payment_currency: 'INR', payment_status: 'pending', status: 'awaiting_payment', website_url: 'https://example.com', problem: 'indexing', background_event_sent_at: null }),
        markPaymentPaid: async (input: any) => { paidInput = input; return { id: scanId, website_url: 'https://example.com', problem: 'indexing', plan: 'quick', status: 'queued', payment_status: 'paid', background_event_sent_at: null } },
        sendInngestEvent: async () => { eventCount += 1 },
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
    const body = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK', data: { order: { order_id: 'locitra_test', order_amount: 499, order_currency: 'INR', order_tags: { scan_id: 'scan' } }, payment: { cf_payment_id: '1', payment_status: 'SUCCESS', payment_amount: 499, payment_currency: 'INR' } } })
    const response = await handleCashfreeWebhook(new Request('http://localhost:3000/api/technical-seo/cashfree/webhook', {
      method: 'POST',
      headers: { 'x-webhook-signature': sign(body, '1700000000000'), 'x-webhook-timestamp': '1700000000000' },
      body,
    }))
    assert.strictEqual(response.status, 400)
  })
})