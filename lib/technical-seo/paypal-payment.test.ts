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

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
const { handleCreateScan } = require('../../app/api/technical-seo/scan/route')
const {
  handleCreateOrder,
  PAYPAL_PAID_PLAN_CONFIG,
} = require('../../app/api/technical-seo/paypal/create-order/route')
const {
  handleCaptureOrder,
  PAYPAL_PLAN_PRICING,
} = require('../../app/api/technical-seo/paypal/capture-order/route')
const { hashReportAccessToken, replacePaymentOrder } = require('./scan-repository')
const { handlePayPalWebhook } = require('../../app/api/technical-seo/paypal/webhook/route')
const { verifyPayPalWebhookSignature, isValidPayPalCertUrl } = require('../paypal/webhook')
const PayPalCancelledPage = require('../../app/technical-seo/cancelled/page').default
/* eslint-enable @typescript-eslint/no-require-imports */

function createJsonRequest(url: string, body: unknown) {
  const payload =
    typeof body === 'object' && body !== null && !Array.isArray(body) && !('billingCountry' in body)
      ? { billingCountry: 'US', ...body }
      : body

  return new Request(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

describe('Phase Deep-01 — Deep Scan Creation', () => {
  it('A: Deep creates a private scan, maxUrls = 1000, unpaid, awaiting_gsc, no Inngest dispatch', async () => {
    let createdScan: any = null
    let inngestSent = false

    const request = createJsonRequest('http://localhost:3000/api/technical-seo/scan', {
      url: 'https://example.com/deep-test',
      problem: 'indexing',
      plan: 'deep',
    })

    const response = await handleCreateScan(request, {
      createScanRecord: async (input: any) => {
        createdScan = input
        return input.scanId
      },
      sendInngestEvent: async () => {
        inngestSent = true
        return {}
      },
    })

    assert.strictEqual(response.status, 201)
    const data = (await response.json()) as {
      scanId: string
      accessKey: string
      status: string
      statusUrl: string
      plan: string
      requiresGoogleSearchConsole: boolean
    }

    assert.ok(data.scanId)
    assert.ok(data.accessKey)
    assert.strictEqual(data.status, 'awaiting_gsc')
    assert.strictEqual(data.plan, 'deep')
    assert.strictEqual(data.requiresGoogleSearchConsole, true)
    assert.ok(data.statusUrl.includes(data.scanId))
    assert.ok(data.statusUrl.includes(encodeURIComponent(data.accessKey)))

    assert.ok(createdScan)
    assert.strictEqual(createdScan.plan, 'deep')
    assert.strictEqual(createdScan.maxUrls, 1000)
    assert.strictEqual(createdScan.maxUrls, CRAWL_LIMITS.deep)
    assert.strictEqual(createdScan.accessMode, 'private')
    assert.strictEqual(createdScan.paymentStatus, 'unpaid')
    assert.strictEqual(createdScan.initialStatus, 'awaiting_gsc')
    assert.strictEqual(inngestSent, false, 'Inngest must NOT be dispatched on Deep scan creation')
  })
})

describe('Phase 1 — PayPal Payment Authorization & Plan Support', () => {
  describe('Create Order Authorization', () => {
    it('A: quick create-order uses $39.00 and 50 pages', async () => {
      let createdScan: any = null
      let createdOrder: any = null
      let markedOrder: any = null

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
      assert.strictEqual(createdOrder.amount, '39.00')
      assert.strictEqual(createdOrder.amount, PAYPAL_PAID_PLAN_CONFIG.quick.amount)
      assert.ok(
        typeof (createdOrder as Record<string, unknown>)?.cancelUrl === 'string' &&
          ((createdOrder as Record<string, unknown>).cancelUrl as string).includes('?plan=quick'),
        'Quick order cancelUrl must contain ?plan=quick'
      )

      assert.ok(markedOrder)
      assert.strictEqual(markedOrder.paymentReference, 'mock-order-quick')
      assert.strictEqual(markedOrder.paymentCurrency, 'USD')
    })

    it('B: full create-order uses $79.00 and 250 pages', async () => {
      let createdScan: any = null
      let createdOrder: any = null
      let markedOrder: any = null

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
      assert.strictEqual(createdOrder.amount, '79.00')
      assert.strictEqual(createdOrder.amount, PAYPAL_PAID_PLAN_CONFIG.full.amount)
      assert.ok(
        typeof (createdOrder as Record<string, unknown>)?.cancelUrl === 'string' &&
          ((createdOrder as Record<string, unknown>).cancelUrl as string).includes('?plan=full'),
        'Full order cancelUrl must contain ?plan=full'
      )

      assert.ok(markedOrder)
      assert.strictEqual(markedOrder.paymentReference, 'mock-order-full')
      assert.strictEqual(markedOrder.paymentCurrency, 'USD')
    })

    it('C: valid Deep scan creates $159 USD order using existing scanId', async () => {
      const scanId = 'scan-deep-valid-1'
      const accessKey = 'test-deep-access-key-123'
      const tokenHash = hashReportAccessToken(accessKey)
      let payPalOrderInput: any = null
      let markedOrder: any = null

      const request = createJsonRequest(
        'http://localhost:3000/api/technical-seo/paypal/create-order',
        {
          scanId,
          key: accessKey,
          plan: 'deep',
        }
      )

      const response = await handleCreateOrder(request, {
        getScanRecord: async () =>
          ({
            id: scanId,
            plan: 'deep',
            status: 'awaiting_payment',
            report_token_hash: tokenHash,
            gsc_property: 'sc-domain:example.com',
            gsc_refresh_token_encrypted: 'mock:enc:token',
            payment_status: 'unpaid',
            payment_provider: null,
            payment_reference: null,
          }) as any,
        createPayPalOrder: async (input: any) => {
          payPalOrderInput = input
          return {
            orderId: 'mock-order-deep-199',
            approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=mock-order-deep-199',
          }
        },
        markPaymentOrderCreated: async (input: any) => {
          markedOrder = input
          return {} as any
        },
      })

      assert.strictEqual(response.status, 200)
      const data = (await response.json()) as any
      assert.strictEqual(data.scanId, scanId)
      assert.strictEqual(data.plan, 'deep')
      assert.strictEqual(data.orderId, 'mock-order-deep-199')
      assert.strictEqual(data.status, 'awaiting_payment')
      assert.strictEqual(
        data.checkoutUrl,
        'https://www.sandbox.paypal.com/checkoutnow?token=mock-order-deep-199'
      )

      assert.ok(payPalOrderInput)
      assert.strictEqual(payPalOrderInput.amount, '159.00')
      assert.strictEqual(payPalOrderInput.scanId, scanId)

      assert.ok(markedOrder)
      assert.strictEqual(markedOrder.scanId, scanId)
      assert.strictEqual(markedOrder.paymentProvider, 'paypal')
      assert.strictEqual(markedOrder.paymentReference, 'mock-order-deep-199')
      assert.strictEqual(markedOrder.paymentCurrency, 'USD')
    })

    it('C2: Deep create-order requires GSC connection and property', async () => {
      const scanId = 'scan-deep-no-gsc'
      const accessKey = 'test-deep-access-key-gsc'
      const tokenHash = hashReportAccessToken(accessKey)

      // Subcase 1: Missing gsc_property
      const req1 = createJsonRequest(
        'http://localhost:3000/api/technical-seo/paypal/create-order',
        { scanId, key: accessKey, plan: 'deep' }
      )
      const res1 = await handleCreateOrder(req1, {
        getScanRecord: async () =>
          ({
            id: scanId,
            plan: 'deep',
            status: 'awaiting_payment',
            report_token_hash: tokenHash,
            gsc_property: null,
            gsc_refresh_token_encrypted: 'mock:enc:token',
            payment_status: 'unpaid',
          }) as any,
      })
      assert.strictEqual(res1.status, 400)
      const data1 = (await res1.json()) as any
      assert.strictEqual(
        data1.error,
        'Google Search Console property must be selected before payment.'
      )

      // Subcase 2: Missing gsc_refresh_token_encrypted
      const req2 = createJsonRequest(
        'http://localhost:3000/api/technical-seo/paypal/create-order',
        { scanId, key: accessKey, plan: 'deep' }
      )
      const res2 = await handleCreateOrder(req2, {
        getScanRecord: async () =>
          ({
            id: scanId,
            plan: 'deep',
            status: 'awaiting_payment',
            report_token_hash: tokenHash,
            gsc_property: 'sc-domain:example.com',
            gsc_refresh_token_encrypted: null,
            payment_status: 'unpaid',
          }) as any,
      })
      assert.strictEqual(res2.status, 400)
      const data2 = (await res2.json()) as any
      assert.strictEqual(data2.error, 'Google Search Console must be connected before payment.')
    })

    it('C3: Deep create-order rejects invalid access key', async () => {
      const scanId = 'scan-deep-bad-key'
      const tokenHash = hashReportAccessToken('correct-key')

      const req = createJsonRequest('http://localhost:3000/api/technical-seo/paypal/create-order', {
        scanId,
        key: 'wrong-key',
        plan: 'deep',
      })
      const res = await handleCreateOrder(req, {
        getScanRecord: async () =>
          ({
            id: scanId,
            plan: 'deep',
            status: 'awaiting_payment',
            report_token_hash: tokenHash,
            gsc_property: 'sc-domain:example.com',
            gsc_refresh_token_encrypted: 'mock:enc:token',
            payment_status: 'unpaid',
          }) as any,
      })
      assert.strictEqual(res.status, 403)
      const data = (await res.json()) as any
      assert.strictEqual(data.error, 'Invalid access key.')
    })

    it('C4: Deep create-order rejects wrong plan and wrong status', async () => {
      const scanId = 'scan-deep-wrong'
      const accessKey = 'test-deep-key'
      const tokenHash = hashReportAccessToken(accessKey)

      // Wrong plan in DB
      const req1 = createJsonRequest(
        'http://localhost:3000/api/technical-seo/paypal/create-order',
        { scanId, key: accessKey, plan: 'deep' }
      )
      const res1 = await handleCreateOrder(req1, {
        getScanRecord: async () =>
          ({
            id: scanId,
            plan: 'quick',
            status: 'awaiting_payment',
            report_token_hash: tokenHash,
            gsc_property: 'sc-domain:example.com',
            gsc_refresh_token_encrypted: 'mock:enc:token',
            payment_status: 'unpaid',
          }) as any,
      })
      assert.strictEqual(res1.status, 400)
      const data1 = (await res1.json()) as any
      assert.strictEqual(data1.error, 'Scan plan mismatch.')

      // Wrong status in DB (e.g. awaiting_gsc)
      const req2 = createJsonRequest(
        'http://localhost:3000/api/technical-seo/paypal/create-order',
        { scanId, key: accessKey, plan: 'deep' }
      )
      const res2 = await handleCreateOrder(req2, {
        getScanRecord: async () =>
          ({
            id: scanId,
            plan: 'deep',
            status: 'awaiting_gsc',
            report_token_hash: tokenHash,
            gsc_property: 'sc-domain:example.com',
            gsc_refresh_token_encrypted: 'mock:enc:token',
            payment_status: 'unpaid',
          }) as any,
      })
      assert.strictEqual(res2.status, 400)
      const data2 = (await res2.json()) as any
      assert.match(data2.error, /Scan is not awaiting payment/)
    })

    it('C5: Deep create-order rejects already-paid scan', async () => {
      const scanId = 'scan-deep-paid'
      const accessKey = 'test-deep-key'
      const tokenHash = hashReportAccessToken(accessKey)

      const req = createJsonRequest('http://localhost:3000/api/technical-seo/paypal/create-order', {
        scanId,
        key: accessKey,
        plan: 'deep',
      })
      const res = await handleCreateOrder(req, {
        getScanRecord: async () =>
          ({
            id: scanId,
            plan: 'deep',
            status: 'awaiting_payment',
            report_token_hash: tokenHash,
            gsc_property: 'sc-domain:example.com',
            gsc_refresh_token_encrypted: 'mock:enc:token',
            payment_status: 'paid',
          }) as any,
      })
      assert.strictEqual(res.status, 409)
      const data = (await res.json()) as any
      assert.strictEqual(data.error, 'Scan is already paid.')
    })

    it('C6: Deep create-order rejects checkout response when markPaymentOrderCreated returns null', async () => {
      const scanId = 'scan-deep-unbound'
      const accessKey = 'test-deep-access-key-unbound'
      const tokenHash = hashReportAccessToken(accessKey)
      let payPalOrderCreated = false

      const request = createJsonRequest(
        'http://localhost:3000/api/technical-seo/paypal/create-order',
        {
          scanId,
          key: accessKey,
          plan: 'deep',
        }
      )

      const response = await handleCreateOrder(request, {
        getDeepScanAuthorizationRecord: async () =>
          ({
            id: scanId,
            plan: 'deep',
            status: 'awaiting_payment',
            report_token_hash: tokenHash,
            gsc_property: 'sc-domain:example.com',
            gsc_refresh_token_encrypted: 'mock:enc:token',
            payment_status: 'unpaid',
            payment_provider: null,
            payment_reference: null,
          }) as any,
        createPayPalOrder: async () => {
          payPalOrderCreated = true
          return {
            orderId: 'mock-order-deep-unbound',
            approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=mock-order-deep-unbound',
          }
        },
        markPaymentOrderCreated: async () => null,
      })

      assert.strictEqual(payPalOrderCreated, true)
      assert.strictEqual(response.status, 409)
      const data = (await response.json()) as any
      assert.strictEqual(data.checkoutUrl, undefined)
      assert.strictEqual(data.orderId, undefined)
      assert.ok(data.error.includes('Failed to bind payment order'))
    })

    it('C7: Deep create-order uses getDeepScanAuthorizationRecord accessor', async () => {
      const scanId = 'scan-deep-accessor-test'
      const accessKey = 'test-deep-access-key-accessor'
      const tokenHash = hashReportAccessToken(accessKey)
      let deepAccessorCalled = false

      const request = createJsonRequest(
        'http://localhost:3000/api/technical-seo/paypal/create-order',
        {
          scanId,
          key: accessKey,
          plan: 'deep',
        }
      )

      const response = await handleCreateOrder(request, {
        getDeepScanAuthorizationRecord: async (id: string) => {
          deepAccessorCalled = true
          assert.strictEqual(id, scanId)
          return {
            id: scanId,
            plan: 'deep',
            status: 'awaiting_payment',
            report_token_hash: tokenHash,
            gsc_property: 'sc-domain:example.com',
            gsc_refresh_token_encrypted: 'mock:enc:token',
            payment_status: 'unpaid',
            payment_provider: null,
            payment_reference: null,
          } as any
        },
        createPayPalOrder: async () => ({
          orderId: 'mock-order-deep-accessor',
          approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=mock-order-deep-accessor',
        }),
        markPaymentOrderCreated: async () => ({ id: scanId }) as any,
      })

      assert.strictEqual(deepAccessorCalled, true)
      assert.strictEqual(response.status, 200)
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
      const amount = overrides.amount ?? '79.00'
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

    it('E: Full capture with $79 succeeds when DB scan.plan = full', async () => {
      const orderId = 'order-full-99'
      const scanId = 'scan-full-uuid'
      let inngestDispatched = false
      let inngestEventPayload: any = null
      let markPaidCalled = false

      const mockOrder = createMockPayPalOrder({
        orderId,
        scanId,
        amount: '79.00',
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

    it('F: Full scan with $39 PayPal order is rejected', async () => {
      const orderId = 'order-cheat-49'
      const scanId = 'scan-full-target'
      let markPaidCalled = false
      let inngestDispatched = false

      // PayPal order has $39.00
      const mockOrder = createMockPayPalOrder({
        orderId,
        scanId,
        amount: '39.00',
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
            plan: 'full', // DB scan requires Full ($79)
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

    it('G: Quick scan with $79 PayPal order is rejected', async () => {
      const orderId = 'order-mismatch-99'
      const scanId = 'scan-quick-target'
      let markPaidCalled = false
      let inngestDispatched = false

      // PayPal order has $79.00
      const mockOrder = createMockPayPalOrder({
        orderId,
        scanId,
        amount: '79.00',
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
            plan: 'quick', // DB scan requires Quick ($39)
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
        amount: '79.00',
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
        amount: '39.00',
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

    it('K: Deep capture with $159 succeeds and queues scan + dispatches Inngest', async () => {
      const orderId = 'order-deep-199'
      const scanId = 'scan-deep-uuid'
      let inngestDispatched = false
      let inngestEventPayload: any = null
      let markPaidCalled = false

      const mockOrder = createMockPayPalOrder({
        orderId,
        scanId,
        amount: '159.00',
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
            plan: 'deep',
            payment_provider: 'paypal',
            payment_reference: orderId,
            payment_currency: 'USD',
            payment_status: 'pending',
            status: 'awaiting_payment',
          }) as any,
        markPaymentPaid: async (input: any) => {
          markPaidCalled = true
          assert.strictEqual(input.scanId, scanId)
          assert.strictEqual(input.paymentReference, orderId)
          return {
            id: scanId,
            website_url: 'https://example.com',
            problem: 'indexing',
            plan: 'deep',
            status: 'queued',
            payment_status: 'paid',
            background_event_sent_at: null,
          } as any
        },
        sendInngestEvent: async (event: any) => {
          inngestDispatched = true
          inngestEventPayload = event
          return { ids: ['event-deep-1'] }
        },
        markBackgroundEventSent: async () => undefined as any,
      })

      assert.strictEqual(response.status, 200)
      const data = (await response.json()) as any
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.scanId, scanId)
      assert.strictEqual(data.status, 'queued')
      assert.strictEqual(data.paymentStatus, 'paid')
      assert.strictEqual(markPaidCalled, true)
      assert.strictEqual(inngestDispatched, true)
      assert.ok(inngestEventPayload)
      assert.strictEqual(inngestEventPayload.data.plan, 'deep')
    })

    it('K2: Deep scan with $39 or $79 PayPal order is rejected', async () => {
      const orderId = 'order-deep-cheat-49'
      const scanId = 'scan-deep-target'
      let markPaidCalled = false
      let inngestDispatched = false

      const mockOrder = createMockPayPalOrder({
        orderId,
        scanId,
        amount: '39.00',
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
            plan: 'deep',
            payment_provider: 'paypal',
            payment_reference: orderId,
            payment_currency: 'USD',
            payment_status: 'pending',
            status: 'awaiting_payment',
          }) as any,
        markPaymentPaid: async () => {
          markPaidCalled = true
          return {} as any
        },
        sendInngestEvent: async () => {
          inngestDispatched = true
          return {}
        },
      })

      assert.strictEqual(response.status, 400)
      const data = (await response.json()) as any
      assert.strictEqual(data.error, 'PayPal payment amount does not match the scan plan.')
      assert.strictEqual(markPaidCalled, false)
      assert.strictEqual(inngestDispatched, false)
    })

    it('M1: already-paid scan with background_event_sent_at null dispatches missing Inngest event', async () => {
      const orderId = 'order-recovery-1'
      const scanId = 'scan-recovery-id'
      let inngestDispatched = false
      let markedSent = false

      const mockOrder = createMockPayPalOrder({
        orderId,
        scanId,
        amount: '159.00',
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
            plan: 'deep',
            payment_provider: 'paypal',
            payment_reference: orderId,
            payment_currency: 'USD',
            payment_status: 'paid',
            background_event_sent_at: null,
            payment_transaction_id: 'tx-recovery-1',
            status: 'queued',
          }) as any,
        sendInngestEvent: async () => {
          inngestDispatched = true
          return {}
        },
        markBackgroundEventSent: async (id: string) => {
          markedSent = true
          assert.strictEqual(id, scanId)
        },
      })

      assert.strictEqual(response.status, 200)
      const data = (await response.json()) as any
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.alreadyPaid, true)
      assert.strictEqual(inngestDispatched, true, 'Missing Inngest event must be dispatched')
      assert.strictEqual(markedSent, true, 'background_event_sent_at must be marked')
    })

    it('M2: already-paid scan with background_event_sent_at set does NOT dispatch duplicate event', async () => {
      const orderId = 'order-no-dup'
      const scanId = 'scan-no-dup-id'
      let inngestDispatched = false

      const mockOrder = createMockPayPalOrder({
        orderId,
        scanId,
        amount: '159.00',
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
            plan: 'deep',
            payment_provider: 'paypal',
            payment_reference: orderId,
            payment_currency: 'USD',
            payment_status: 'paid',
            background_event_sent_at: '2026-09-29T12:00:00.000Z',
            payment_transaction_id: 'tx-dup-1',
            status: 'queued',
          }) as any,
        sendInngestEvent: async () => {
          inngestDispatched = true
          return {}
        },
      })

      assert.strictEqual(response.status, 200)
      const data = (await response.json()) as any
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.alreadyPaid, true)
      assert.strictEqual(inngestDispatched, false, 'Inngest event must NOT be dispatched again')
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
        amount: '79.00',
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
            background_event_sent_at: '2026-09-29T12:00:00.000Z',
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

describe('Phase Deep-08 — PayPal Unpaid Retry & Cancellation Flow', () => {
  const scanId = 'scan-deep-08-test'
  const accessKey = 'deep-08-access-key-xyz'
  const tokenHash = hashReportAccessToken(accessKey)

  function createMockExistingDeepScan(overrides: {
    status?: string
    payment_status?: string
    payment_provider?: string | null
    payment_reference?: string | null
    plan?: string
  }) {
    return {
      id: scanId,
      plan: overrides.plan ?? 'deep',
      status: overrides.status ?? 'awaiting_payment',
      report_token_hash: tokenHash,
      gsc_property: 'sc-domain:example.com',
      gsc_refresh_token_encrypted: 'mock:enc:token',
      payment_status: overrides.payment_status ?? 'pending',
      payment_provider:
        overrides.payment_provider !== undefined ? overrides.payment_provider : 'paypal',
      payment_reference:
        overrides.payment_reference !== undefined ? overrides.payment_reference : 'order-A',
    } as any
  }

  function createMockPayPalOrderResponse(overrides: {
    id?: string
    status?: OrderStatus
    customId?: string
    amount?: string
    currency?: string
    approvalUrl?: string | null
  }): Order {
    const id = overrides.id ?? 'order-A'
    const status = overrides.status ?? OrderStatus.Created
    const customId = overrides.customId ?? scanId
    const amount = overrides.amount ?? '159.00'
    const currency = overrides.currency ?? 'USD'
    const approvalUrl =
      overrides.approvalUrl !== undefined
        ? overrides.approvalUrl
        : `https://www.sandbox.paypal.com/checkoutnow?token=${id}`

    const links: any[] = [
      { rel: 'self', href: `https://api.sandbox.paypal.com/v2/checkout/orders/${id}` },
    ]
    if (approvalUrl) {
      links.push({ rel: 'payer-action', href: approvalUrl })
    }

    return {
      id,
      status,
      purchaseUnits: [
        {
          customId,
          amount: {
            currencyCode: currency,
            value: amount,
          },
        },
      ],
      links,
    } as Order
  }

  it('1. Deep first order creation binds order and includes scanId + key in cancelUrl', async () => {
    let createdOrderInput: any = null
    let markedOrderInput: any = null

    const req = createJsonRequest('http://localhost:3000/api/technical-seo/paypal/create-order', {
      scanId,
      key: accessKey,
      plan: 'deep',
    })

    const res = await handleCreateOrder(req, {
      getDeepScanAuthorizationRecord: async () =>
        createMockExistingDeepScan({
          payment_status: 'unpaid',
          payment_provider: null,
          payment_reference: null,
        }),
      createPayPalOrder: async (input: any) => {
        createdOrderInput = input
        return {
          orderId: 'first-order-123',
          approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=first-order-123',
        }
      },
      markPaymentOrderCreated: async (input: any) => {
        markedOrderInput = input
        return { id: scanId } as any
      },
    })

    assert.strictEqual(res.status, 200)
    const data = (await res.json()) as any
    assert.strictEqual(data.orderId, 'first-order-123')
    assert.strictEqual(data.provider, 'paypal')
    assert.strictEqual(data.plan, 'deep')
    assert.strictEqual(data.status, 'awaiting_payment')

    assert.ok(createdOrderInput)
    assert.strictEqual(createdOrderInput.amount, '159.00')
    assert.strictEqual(createdOrderInput.scanId, scanId)
    assert.ok(createdOrderInput.cancelUrl.includes(`scanId=${scanId}`))
    assert.ok(createdOrderInput.cancelUrl.includes(`key=${encodeURIComponent(accessKey)}`))

    assert.ok(markedOrderInput)
    assert.strictEqual(markedOrderInput.scanId, scanId)
    assert.strictEqual(markedOrderInput.paymentReference, 'first-order-123')
    assert.strictEqual(markedOrderInput.paymentProvider, 'paypal')
    assert.strictEqual(markedOrderInput.paymentCurrency, 'USD')
  })

  it('2. Deep retry reuses CREATED order when matching and valid approval link', async () => {
    let createOrderCalled = false
    let replaceOrderCalled = false

    const req = createJsonRequest('http://localhost:3000/api/technical-seo/paypal/create-order', {
      scanId,
      key: accessKey,
      plan: 'deep',
    })

    const res = await handleCreateOrder(req, {
      getDeepScanAuthorizationRecord: async () =>
        createMockExistingDeepScan({ payment_reference: 'order-A' }),
      getPayPalOrder: async (id: string) => {
        assert.strictEqual(id, 'order-A')
        return createMockPayPalOrderResponse({ id: 'order-A', status: OrderStatus.Created })
      },
      createPayPalOrder: async () => {
        createOrderCalled = true
        return { orderId: 'order-B', approvalUrl: 'https://paypal.com/b' }
      },
      replacePaymentOrder: async () => {
        replaceOrderCalled = true
        return { id: scanId } as any
      },
    })

    assert.strictEqual(res.status, 200)
    const data = (await res.json()) as any
    assert.strictEqual(data.orderId, 'order-A')
    assert.strictEqual(data.checkoutUrl, 'https://www.sandbox.paypal.com/checkoutnow?token=order-A')
    assert.strictEqual(createOrderCalled, false, 'Must NOT create new PayPal order on valid reuse')
    assert.strictEqual(replaceOrderCalled, false, 'Must NOT modify DB binding on valid reuse')
  })

  it('3. Reuse requires matching customId (mismatch triggers replacement)', async () => {
    let replacedInput: any = null

    const req = createJsonRequest('http://localhost:3000/api/technical-seo/paypal/create-order', {
      scanId,
      key: accessKey,
      plan: 'deep',
    })

    const res = await handleCreateOrder(req, {
      getDeepScanAuthorizationRecord: async () =>
        createMockExistingDeepScan({ payment_reference: 'order-A' }),
      getPayPalOrder: async () =>
        createMockPayPalOrderResponse({ id: 'order-A', customId: 'wrong-scan-id' }),
      createPayPalOrder: async () => ({
        orderId: 'order-B',
        approvalUrl: 'https://paypal.com/b',
      }),
      replacePaymentOrder: async (input: any) => {
        replacedInput = input
        return { id: scanId } as any
      },
    })

    assert.strictEqual(res.status, 200)
    const data = (await res.json()) as any
    assert.strictEqual(data.orderId, 'order-B')
    assert.ok(replacedInput)
    assert.strictEqual(replacedInput.previousReference, 'order-A')
    assert.strictEqual(replacedInput.newReference, 'order-B')
  })

  it('4. Reuse requires exact 159.00 USD (amount mismatch triggers replacement)', async () => {
    let replacedInput: any = null

    const req = createJsonRequest('http://localhost:3000/api/technical-seo/paypal/create-order', {
      scanId,
      key: accessKey,
      plan: 'deep',
    })

    const res = await handleCreateOrder(req, {
      getDeepScanAuthorizationRecord: async () =>
        createMockExistingDeepScan({ payment_reference: 'order-A' }),
      getPayPalOrder: async () => createMockPayPalOrderResponse({ id: 'order-A', amount: '79.00' }),
      createPayPalOrder: async () => ({
        orderId: 'order-B-amount',
        approvalUrl: 'https://paypal.com/b',
      }),
      replacePaymentOrder: async (input: any) => {
        replacedInput = input
        return { id: scanId } as any
      },
    })

    assert.strictEqual(res.status, 200)
    const data = (await res.json()) as any
    assert.strictEqual(data.orderId, 'order-B-amount')
    assert.ok(replacedInput)
    assert.strictEqual(replacedInput.previousReference, 'order-A')
    assert.strictEqual(replacedInput.newReference, 'order-B-amount')
  })

  it('5. Reuse requires valid approval link (missing link triggers replacement)', async () => {
    let replacedInput: any = null

    const req = createJsonRequest('http://localhost:3000/api/technical-seo/paypal/create-order', {
      scanId,
      key: accessKey,
      plan: 'deep',
    })

    const res = await handleCreateOrder(req, {
      getDeepScanAuthorizationRecord: async () =>
        createMockExistingDeepScan({ payment_reference: 'order-A' }),
      getPayPalOrder: async () =>
        createMockPayPalOrderResponse({ id: 'order-A', approvalUrl: null }),
      createPayPalOrder: async () => ({
        orderId: 'order-B-link',
        approvalUrl: 'https://paypal.com/b-link',
      }),
      replacePaymentOrder: async (input: any) => {
        replacedInput = input
        return { id: scanId } as any
      },
    })

    assert.strictEqual(res.status, 200)
    const data = (await res.json()) as any
    assert.strictEqual(data.orderId, 'order-B-link')
    assert.strictEqual(data.checkoutUrl, 'https://paypal.com/b-link')
    assert.ok(replacedInput)
  })

  it('6. VOIDED order triggers replacement', async () => {
    let replacedInput: any = null

    const req = createJsonRequest('http://localhost:3000/api/technical-seo/paypal/create-order', {
      scanId,
      key: accessKey,
      plan: 'deep',
    })

    const res = await handleCreateOrder(req, {
      getDeepScanAuthorizationRecord: async () =>
        createMockExistingDeepScan({ payment_reference: 'order-A' }),
      getPayPalOrder: async () =>
        createMockPayPalOrderResponse({ id: 'order-A', status: OrderStatus.Voided }),
      createPayPalOrder: async () => ({
        orderId: 'order-B-voided',
        approvalUrl: 'https://paypal.com/b-voided',
      }),
      replacePaymentOrder: async (input: any) => {
        replacedInput = input
        return { id: scanId } as any
      },
    })

    assert.strictEqual(res.status, 200)
    const data = (await res.json()) as any
    assert.strictEqual(data.orderId, 'order-B-voided')
    assert.ok(replacedInput)
    assert.strictEqual(replacedInput.previousReference, 'order-A')
    assert.strictEqual(replacedInput.newReference, 'order-B-voided')
  })

  it('7. Retrieval failure triggers replacement', async () => {
    let replacedInput: any = null

    const req = createJsonRequest('http://localhost:3000/api/technical-seo/paypal/create-order', {
      scanId,
      key: accessKey,
      plan: 'deep',
    })

    const res = await handleCreateOrder(req, {
      getDeepScanAuthorizationRecord: async () =>
        createMockExistingDeepScan({ payment_reference: 'order-A' }),
      getPayPalOrder: async () => {
        throw new Error('PayPal order not found (404)')
      },
      createPayPalOrder: async () => ({
        orderId: 'order-B-err',
        approvalUrl: 'https://paypal.com/b-err',
      }),
      replacePaymentOrder: async (input: any) => {
        replacedInput = input
        return { id: scanId } as any
      },
    })

    assert.strictEqual(res.status, 200)
    const data = (await res.json()) as any
    assert.strictEqual(data.orderId, 'order-B-err')
    assert.ok(replacedInput)
  })

  it('8. Replacement atomically swaps only current unpaid binding', async () => {
    let replacedInput: any = null

    const req = createJsonRequest('http://localhost:3000/api/technical-seo/paypal/create-order', {
      scanId,
      key: accessKey,
      plan: 'deep',
    })

    await handleCreateOrder(req, {
      getDeepScanAuthorizationRecord: async () =>
        createMockExistingDeepScan({ payment_reference: 'order-A' }),
      getPayPalOrder: async () =>
        createMockPayPalOrderResponse({ id: 'order-A', status: OrderStatus.Voided }),
      createPayPalOrder: async () => ({
        orderId: 'order-B',
        approvalUrl: 'https://paypal.com/b',
      }),
      replacePaymentOrder: async (input: any) => {
        replacedInput = input
        return { id: scanId } as any
      },
    })

    assert.ok(replacedInput)
    assert.strictEqual(replacedInput.scanId, scanId)
    assert.strictEqual(replacedInput.previousReference, 'order-A')
    assert.strictEqual(replacedInput.newReference, 'order-B')
    assert.strictEqual(replacedInput.paymentCurrency, 'USD')
    assert.strictEqual(replacedInput.paymentProvider, 'paypal')
  })

  it('9. Concurrent state change causes replacement failure to return a safe conflict', async () => {
    const req = createJsonRequest('http://localhost:3000/api/technical-seo/paypal/create-order', {
      scanId,
      key: accessKey,
      plan: 'deep',
    })

    const res = await handleCreateOrder(req, {
      getDeepScanAuthorizationRecord: async () =>
        createMockExistingDeepScan({ payment_reference: 'order-A' }),
      getPayPalOrder: async () =>
        createMockPayPalOrderResponse({ id: 'order-A', status: OrderStatus.Voided }),
      createPayPalOrder: async () => ({
        orderId: 'order-B-race',
        approvalUrl: 'https://paypal.com/b-race',
      }),
      replacePaymentOrder: async () => null, // Simulated 0 rows updated
    })

    assert.strictEqual(res.status, 409)
    const data = (await res.json()) as any
    assert.match(data.error, /Failed to update payment order/)
    assert.strictEqual(data.orderId, undefined)
  })

  it('10. Different provider remains blocked', async () => {
    const req = createJsonRequest('http://localhost:3000/api/technical-seo/paypal/create-order', {
      scanId,
      key: accessKey,
      plan: 'deep',
    })

    const res = await handleCreateOrder(req, {
      getDeepScanAuthorizationRecord: async () =>
        createMockExistingDeepScan({
          payment_provider: 'cashfree',
          payment_reference: 'cs_test_123',
        }),
    })

    assert.strictEqual(res.status, 409)
    const data = (await res.json()) as any
    assert.match(data.error, /bound to another payment provider/)
  })

  it('11. Paid scan remains blocked', async () => {
    const req = createJsonRequest('http://localhost:3000/api/technical-seo/paypal/create-order', {
      scanId,
      key: accessKey,
      plan: 'deep',
    })

    const res = await handleCreateOrder(req, {
      getDeepScanAuthorizationRecord: async () =>
        createMockExistingDeepScan({
          payment_status: 'paid',
        }),
    })

    assert.strictEqual(res.status, 409)
    const data = (await res.json()) as any
    assert.strictEqual(data.error, 'Scan is already paid.')
  })

  it('12. Existing APPROVED order routes to reconciliation and does not create a second order', async () => {
    let createOrderCalled = false

    const req = createJsonRequest('http://localhost:3000/api/technical-seo/paypal/create-order', {
      scanId,
      key: accessKey,
      plan: 'deep',
    })

    const res = await handleCreateOrder(req, {
      getDeepScanAuthorizationRecord: async () =>
        createMockExistingDeepScan({ payment_reference: 'order-A' }),
      getPayPalOrder: async () =>
        createMockPayPalOrderResponse({ id: 'order-A', status: OrderStatus.Approved }),
      createPayPalOrder: async () => {
        createOrderCalled = true
        return { orderId: 'order-B', approvalUrl: 'https://paypal.com/b' }
      },
    })

    assert.strictEqual(res.status, 200)
    const data = (await res.json()) as any
    assert.strictEqual(data.alreadyApproved, true)
    assert.strictEqual(data.orderId, 'order-A')
    assert.ok(data.checkoutUrl.includes('token=order-A'))
    assert.ok(data.checkoutUrl.includes('provider=paypal'))
    assert.strictEqual(createOrderCalled, false)
  })

  it('13. COMPLETED order routes to reconciliation and does not create a second order', async () => {
    let createOrderCalled = false

    const req = createJsonRequest('http://localhost:3000/api/technical-seo/paypal/create-order', {
      scanId,
      key: accessKey,
      plan: 'deep',
    })

    const res = await handleCreateOrder(req, {
      getDeepScanAuthorizationRecord: async () =>
        createMockExistingDeepScan({ payment_reference: 'order-A' }),
      getPayPalOrder: async () =>
        createMockPayPalOrderResponse({ id: 'order-A', status: OrderStatus.Completed }),
      createPayPalOrder: async () => {
        createOrderCalled = true
        return { orderId: 'order-B', approvalUrl: 'https://paypal.com/b' }
      },
    })

    assert.strictEqual(res.status, 200)
    const data = (await res.json()) as any
    assert.strictEqual(data.alreadyApproved, true)
    assert.strictEqual(data.orderId, 'order-A')
    assert.strictEqual(createOrderCalled, false)
  })

  it('14. Quick and Full behavior remains unchanged', async () => {
    let quickCreated = false
    let fullCreated = false

    const reqQuick = createJsonRequest(
      'http://localhost:3000/api/technical-seo/paypal/create-order',
      {
        url: 'https://example.com',
        problem: 'indexing',
        plan: 'quick',
      }
    )
    const resQuick = await handleCreateOrder(reqQuick, {
      createScanRecord: async () => 'scan-q',
      createPayPalOrder: async (input: any) => {
        quickCreated = true
        assert.strictEqual(input.amount, '39.00')
        return { orderId: 'order-q', approvalUrl: 'https://paypal.com/q' }
      },
      markPaymentOrderCreated: async () => ({ id: 'scan-q' }) as any,
    })
    assert.strictEqual(resQuick.status, 200)
    assert.strictEqual(quickCreated, true)

    const reqFull = createJsonRequest(
      'http://localhost:3000/api/technical-seo/paypal/create-order',
      {
        url: 'https://example.com',
        problem: 'indexing',
        plan: 'full',
      }
    )
    const resFull = await handleCreateOrder(reqFull, {
      createScanRecord: async () => 'scan-f',
      createPayPalOrder: async (input: any) => {
        fullCreated = true
        assert.strictEqual(input.amount, '79.00')
        return { orderId: 'order-f', approvalUrl: 'https://paypal.com/f' }
      },
      markPaymentOrderCreated: async () => ({ id: 'scan-f' }) as any,
    })
    assert.strictEqual(resFull.status, 200)
    assert.strictEqual(fullCreated, true)
  })

  it('15. Cancellation page preserves scan context when scanId and key are provided', async () => {
    function findInReactTree(node: any, predicate: (el: any) => boolean): boolean {
      if (!node) return false
      if (predicate(node)) return true
      if (Array.isArray(node)) {
        return node.some((child) => findInReactTree(child, predicate))
      }
      if (typeof node === 'object' && node.props && node.props.children) {
        return findInReactTree(node.props.children, predicate)
      }
      return false
    }

    const pageWithContext = await PayPalCancelledPage({
      searchParams: Promise.resolve({
        plan: 'deep',
        scanId: 'scan-deep-123',
        key: 'key-test-456',
      }),
    })

    assert.ok(pageWithContext)
    const hasDeepLink = findInReactTree(
      pageWithContext,
      (el) => el?.props?.href === '/technical-seo/scan/scan-deep-123/?key=key-test-456'
    )
    assert.strictEqual(
      hasDeepLink,
      true,
      'Cancellation page must render link to specific Deep scan'
    )

    const pageWithoutContext = await PayPalCancelledPage({
      searchParams: Promise.resolve({ plan: 'deep' }),
    })
    assert.ok(pageWithoutContext)
    const hasGenericLink = findInReactTree(
      pageWithoutContext,
      (el) => el?.props?.href === '/technical-seo/'
    )
    assert.strictEqual(
      hasGenericLink,
      true,
      'Cancellation page must render generic link when context is missing'
    )
  })

  it('16. Security: capture with old replaced order ID is rejected', async () => {
    const req = createJsonRequest('http://localhost:3000/api/technical-seo/paypal/capture-order', {
      orderId: 'order-A', // Old order ID
    })

    const res = await handleCaptureOrder(req, {
      getPayPalOrder: async () =>
        ({
          id: 'order-A',
          status: OrderStatus.Completed,
          purchaseUnits: [
            {
              customId: scanId,
              amount: { currencyCode: 'USD', value: '159.00' },
              payments: {
                captures: [
                  {
                    id: 'cap-A',
                    status: CaptureStatus.Completed,
                    amount: { currencyCode: 'USD', value: '159.00' },
                  },
                ],
              },
            },
          ],
        }) as any,
      getScanRecord: async () =>
        ({
          id: scanId,
          plan: 'deep',
          payment_provider: 'paypal',
          payment_reference: 'order-B', // Current bound reference is order-B, not order-A
          payment_currency: 'USD',
          payment_status: 'pending',
        }) as any,
    })

    assert.strictEqual(res.status, 409)
    const data = (await res.json()) as any
    assert.match(data.error, /mismatch/)
  })

  describe('PayPal Webhook Recovery Flow & Defense-in-Depth', () => {
    function createMockWebhookRequest(body: unknown, headers: Record<string, string> = {}) {
      const defaultHeaders: Record<string, string> = {
        'content-type': 'application/json',
        'paypal-transmission-id': 'mock-tx-12345',
        'paypal-transmission-time': '2026-10-08T12:00:00Z',
        'paypal-cert-url': 'https://api.sandbox.paypal.com/v1/notifications/certs/CERT-123',
        'paypal-auth-algo': 'SHA256withRSA',
        'paypal-transmission-sig': 'mock-signature-abc',
        ...headers,
      }

      return new Request('http://localhost:3000/api/technical-seo/paypal/webhook', {
        method: 'POST',
        headers: defaultHeaders,
        body: typeof body === 'string' ? body : JSON.stringify(body),
      })
    }

    function createMockPayPalOrderResource(overrides: {
      orderId?: string
      scanId?: string
      amount?: string
      currency?: string
      status?: OrderStatus
      captureStatus?: CaptureStatus
    }): Order {
      const currency = overrides.currency ?? 'USD'
      const amount = overrides.amount ?? '79.00'
      const orderId = overrides.orderId ?? 'order-recovery-123'
      const scanId = overrides.scanId ?? 'scan-recovery-uuid'
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
                  id: `cap-${orderId}`,
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

    it('1. Invalid webhook signature is rejected with 401', async () => {
      const req = createMockWebhookRequest({ event_type: 'CHECKOUT.ORDER.APPROVED' })
      const res = await handlePayPalWebhook(req, {
        verifyWebhookSignature: async () => false,
      })

      assert.strictEqual(res.status, 401)
      const data = (await res.json()) as any
      assert.match(data.error, /Invalid PayPal webhook signature/)
    })

    it('2. Missing transmission headers causes verification rejection (401)', async () => {
      const req = new Request('http://localhost:3000/api/technical-seo/paypal/webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event_type: 'CHECKOUT.ORDER.APPROVED' }),
      })

      const res = await handlePayPalWebhook(req, {
        verifyDependencies: {
          fetch: async () => new Response('{}', { status: 200 }),
          getAccessToken: async () => 'mock-token',
          webhookId: 'WH-123',
        },
      })

      assert.strictEqual(res.status, 401)
    })

    it('3. Unsupported event types are ignored safely with 200 status', async () => {
      const req = createMockWebhookRequest({
        event_type: 'PAYMENT.CAPTURE.DENIED',
        resource: { id: 'order-123' },
      })

      let captureCalled = false
      const res = await handlePayPalWebhook(req, {
        verifyWebhookSignature: async () => true,
        capturePayPalOrder: async () => {
          captureCalled = true
          return {} as any
        },
      })

      assert.strictEqual(res.status, 200)
      const data = (await res.json()) as any
      assert.strictEqual(data.received, true)
      assert.strictEqual(data.ignored, true)
      assert.strictEqual(captureCalled, false)
    })

    it('4. Valid CHECKOUT.ORDER.APPROVED event resolves the correct PayPal order and captures', async () => {
      const orderId = 'order-approved-recovery'
      const scanId = 'scan-approved-recovery'
      let capturedOrderId = ''

      const mockOrder = createMockPayPalOrderResource({
        orderId,
        scanId,
        amount: '79.00',
        currency: 'USD',
      })

      const req = createMockWebhookRequest({
        event_type: 'CHECKOUT.ORDER.APPROVED',
        resource: { id: orderId },
      })

      const res = await handlePayPalWebhook(req, {
        verifyWebhookSignature: async () => true,
        getPayPalOrder: async (id) => {
          capturedOrderId = id
          return mockOrder
        },
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
          }) as any,
        markPaymentPaid: async () =>
          ({
            id: scanId,
            website_url: 'https://example.com',
            problem: 'technical',
            plan: 'full',
            status: 'queued',
            payment_status: 'paid',
            background_event_sent_at: null,
          }) as any,
        sendInngestEvent: async () => ({}),
        markBackgroundEventSent: async () => {},
      })

      assert.strictEqual(res.status, 200)
      assert.strictEqual(capturedOrderId, orderId)
      const data = (await res.json()) as any
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.scanId, scanId)
      assert.strictEqual(data.orderId, orderId)
    })

    it('5. Order with mismatched payment_reference is rejected with 409', async () => {
      const orderId = 'order-mismatch-1'
      const scanId = 'scan-mismatch-1'

      const mockOrder = createMockPayPalOrderResource({
        orderId,
        scanId,
        amount: '79.00',
      })

      const req = createMockWebhookRequest({
        event_type: 'CHECKOUT.ORDER.APPROVED',
        resource: { id: orderId },
      })

      const res = await handlePayPalWebhook(req, {
        verifyWebhookSignature: async () => true,
        getPayPalOrder: async () => mockOrder,
        getScanRecord: async () =>
          ({
            id: scanId,
            plan: 'full',
            payment_provider: 'paypal',
            payment_reference: 'different-order-ref',
            payment_currency: 'USD',
            payment_status: 'pending',
          }) as any,
      })

      assert.strictEqual(res.status, 409)
      const data = (await res.json()) as any
      assert.match(data.error, /mismatch/)
    })

    it('6. Failed or refunded scan state is rejected with 409', async () => {
      const orderId = 'order-state-fail'
      const scanId = 'scan-state-fail'

      const mockOrder = createMockPayPalOrderResource({
        orderId,
        scanId,
        amount: '79.00',
      })

      const reqFailed = createMockWebhookRequest({
        event_type: 'CHECKOUT.ORDER.APPROVED',
        resource: { id: orderId },
      })

      const resFailed = await handlePayPalWebhook(reqFailed, {
        verifyWebhookSignature: async () => true,
        getPayPalOrder: async () => mockOrder,
        getScanRecord: async () =>
          ({
            id: scanId,
            plan: 'full',
            payment_provider: 'paypal',
            payment_reference: orderId,
            payment_currency: 'USD',
            payment_status: 'failed',
          }) as any,
      })

      assert.strictEqual(resFailed.status, 409)
      const dataFailed = (await resFailed.json()) as any
      assert.match(dataFailed.error, /Cannot capture scan with payment status 'failed'/)

      const reqRefunded = createMockWebhookRequest({
        event_type: 'CHECKOUT.ORDER.APPROVED',
        resource: { id: orderId },
      })

      const resRefunded = await handlePayPalWebhook(reqRefunded, {
        verifyWebhookSignature: async () => true,
        getPayPalOrder: async () => mockOrder,
        getScanRecord: async () =>
          ({
            id: scanId,
            plan: 'full',
            payment_provider: 'paypal',
            payment_reference: orderId,
            payment_currency: 'USD',
            payment_status: 'refunded',
          }) as any,
      })

      assert.strictEqual(resRefunded.status, 409)
    })

    it('7. Order amount mismatch against scan plan is rejected with 400', async () => {
      const orderId = 'order-amount-mismatch'
      const scanId = 'scan-amount-mismatch'

      const mockOrder = createMockPayPalOrderResource({
        orderId,
        scanId,
        amount: '39.00',
        currency: 'USD',
      })

      const req = createMockWebhookRequest({
        event_type: 'CHECKOUT.ORDER.APPROVED',
        resource: { id: orderId },
      })

      const res = await handlePayPalWebhook(req, {
        verifyWebhookSignature: async () => true,
        getPayPalOrder: async () => mockOrder,
        getScanRecord: async () =>
          ({
            id: scanId,
            plan: 'full',
            payment_provider: 'paypal',
            payment_reference: orderId,
            payment_currency: 'USD',
            payment_status: 'pending',
          }) as any,
      })

      assert.strictEqual(res.status, 400)
      const data = (await res.json()) as any
      assert.match(data.error, /does not match the scan plan/)
    })

    it('8. Webhook calls markPaymentPaid with correct transaction ID and customer email', async () => {
      const orderId = 'order-mark-paid-rec'
      const scanId = 'scan-mark-paid-rec'
      let markPaidInput: any = null

      const mockOrder = createMockPayPalOrderResource({
        orderId,
        scanId,
        amount: '159.00',
      })

      const req = createMockWebhookRequest({
        event_type: 'CHECKOUT.ORDER.APPROVED',
        resource: { id: orderId },
      })

      const res = await handlePayPalWebhook(req, {
        verifyWebhookSignature: async () => true,
        getPayPalOrder: async () => mockOrder,
        getScanRecord: async () =>
          ({
            id: scanId,
            website_url: 'https://example.com',
            problem: 'indexing',
            plan: 'deep',
            payment_provider: 'paypal',
            payment_reference: orderId,
            payment_currency: 'USD',
            payment_status: 'pending',
          }) as any,
        markPaymentPaid: async (input) => {
          markPaidInput = input
          return {
            id: scanId,
            website_url: 'https://example.com',
            problem: 'indexing',
            plan: 'deep',
            status: 'queued',
            payment_status: 'paid',
            background_event_sent_at: null,
          } as any
        },
        sendInngestEvent: async () => ({}),
        markBackgroundEventSent: async () => {},
      })

      assert.strictEqual(res.status, 200)
      assert.ok(markPaidInput)
      assert.strictEqual(markPaidInput.scanId, scanId)
      assert.strictEqual(markPaidInput.paymentProvider, 'paypal')
      assert.strictEqual(markPaidInput.paymentReference, orderId)
      assert.strictEqual(markPaidInput.paymentTransactionId, `cap-${orderId}`)
      assert.strictEqual(markPaidInput.customerEmail, 'customer@example.com')
    })

    it('9. Dispatches Inngest event with exact deterministic ID technical-seo-paid-scan-${scanId}', async () => {
      const orderId = 'order-event-id-rec'
      const scanId = 'scan-event-id-rec'
      let dispatchedEvent: any = null

      const mockOrder = createMockPayPalOrderResource({
        orderId,
        scanId,
        amount: '39.00',
      })

      const req = createMockWebhookRequest({
        event_type: 'CHECKOUT.ORDER.APPROVED',
        resource: { id: orderId },
      })

      await handlePayPalWebhook(req, {
        verifyWebhookSignature: async () => true,
        getPayPalOrder: async () => mockOrder,
        getScanRecord: async () =>
          ({
            id: scanId,
            website_url: 'https://example.com',
            problem: 'slow',
            plan: 'quick',
            payment_provider: 'paypal',
            payment_reference: orderId,
            payment_currency: 'USD',
            payment_status: 'pending',
          }) as any,
        markPaymentPaid: async () =>
          ({
            id: scanId,
            website_url: 'https://example.com',
            problem: 'slow',
            plan: 'quick',
            status: 'queued',
            payment_status: 'paid',
            background_event_sent_at: null,
          }) as any,
        sendInngestEvent: async (event) => {
          dispatchedEvent = event
        },
        markBackgroundEventSent: async () => {},
      })

      assert.ok(dispatchedEvent)
      assert.strictEqual(dispatchedEvent.id, `technical-seo-paid-scan-${scanId}`)
      assert.strictEqual(dispatchedEvent.name, 'technical-seo/scan.requested')
      assert.strictEqual(dispatchedEvent.data.scanId, scanId)
      assert.strictEqual(dispatchedEvent.data.plan, 'quick')
    })

    it('10. markBackgroundEventSent is called strictly after sendInngestEvent succeeds', async () => {
      const orderId = 'order-order-seq'
      const scanId = 'scan-order-seq'
      const executionOrder: string[] = []

      const mockOrder = createMockPayPalOrderResource({
        orderId,
        scanId,
        amount: '79.00',
      })

      const req = createMockWebhookRequest({
        event_type: 'CHECKOUT.ORDER.APPROVED',
        resource: { id: orderId },
      })

      await handlePayPalWebhook(req, {
        verifyWebhookSignature: async () => true,
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
          }) as any,
        markPaymentPaid: async () => {
          executionOrder.push('markPaymentPaid')
          return {
            id: scanId,
            website_url: 'https://example.com',
            problem: 'technical',
            plan: 'full',
            status: 'queued',
            payment_status: 'paid',
            background_event_sent_at: null,
          } as any
        },
        sendInngestEvent: async () => {
          executionOrder.push('sendInngestEvent')
        },
        markBackgroundEventSent: async () => {
          executionOrder.push('markBackgroundEventSent')
        },
      })

      assert.deepStrictEqual(executionOrder, [
        'markPaymentPaid',
        'sendInngestEvent',
        'markBackgroundEventSent',
      ])
    })

    it('11. Inngest send failure does NOT call markBackgroundEventSent', async () => {
      const orderId = 'order-inngest-fail'
      const scanId = 'scan-inngest-fail'
      let markBackgroundCalled = false

      const mockOrder = createMockPayPalOrderResource({
        orderId,
        scanId,
        amount: '79.00',
      })

      const req = createMockWebhookRequest({
        event_type: 'CHECKOUT.ORDER.APPROVED',
        resource: { id: orderId },
      })

      const res = await handlePayPalWebhook(req, {
        verifyWebhookSignature: async () => true,
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
          }) as any,
        markPaymentPaid: async () =>
          ({
            id: scanId,
            website_url: 'https://example.com',
            problem: 'technical',
            plan: 'full',
            status: 'queued',
            payment_status: 'paid',
            background_event_sent_at: null,
          }) as any,
        sendInngestEvent: async () => {
          throw new Error('Inngest unavailable')
        },
        markBackgroundEventSent: async () => {
          markBackgroundCalled = true
        },
      })

      assert.strictEqual(res.status, 200)
      assert.strictEqual(markBackgroundCalled, false, 'markBackgroundEventSent must NOT be called')
    })

    it('12. Duplicate webhook delivery returns alreadyPaid=true without duplicate capture', async () => {
      const orderId = 'order-dup-rec'
      const scanId = 'scan-dup-rec'
      let captureCount = 0
      let markPaidCount = 0

      const mockOrder = createMockPayPalOrderResource({
        orderId,
        scanId,
        amount: '79.00',
      })

      const req = createMockWebhookRequest({
        event_type: 'CHECKOUT.ORDER.APPROVED',
        resource: { id: orderId },
      })

      const res = await handlePayPalWebhook(req, {
        verifyWebhookSignature: async () => true,
        getPayPalOrder: async () => mockOrder,
        capturePayPalOrder: async () => {
          captureCount++
          return {} as any
        },
        getScanRecord: async () =>
          ({
            id: scanId,
            website_url: 'https://example.com',
            problem: 'technical',
            plan: 'full',
            payment_provider: 'paypal',
            payment_reference: orderId,
            payment_currency: 'USD',
            payment_status: 'paid',
            background_event_sent_at: '2026-10-08T12:05:00Z',
          }) as any,
        markPaymentPaid: async () => {
          markPaidCount++
          return null as any
        },
      })

      assert.strictEqual(res.status, 200)
      const data = (await res.json()) as any
      assert.strictEqual(data.alreadyPaid, true)
      assert.strictEqual(captureCount, 0, 'capture must not be called')
      assert.strictEqual(markPaidCount, 0, 'markPaymentPaid must not be called')
    })

    it('13. Already-paid scan recovers missing background event if null', async () => {
      const orderId = 'order-already-paid-missing-evt'
      const scanId = 'scan-already-paid-missing-evt'
      let inngestSent = false
      let markBackgroundSent = false

      const mockOrder = createMockPayPalOrderResource({
        orderId,
        scanId,
        amount: '79.00',
      })

      const req = createMockWebhookRequest({
        event_type: 'CHECKOUT.ORDER.APPROVED',
        resource: { id: orderId },
      })

      const res = await handlePayPalWebhook(req, {
        verifyWebhookSignature: async () => true,
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
            payment_status: 'paid',
            background_event_sent_at: null,
          }) as any,
        sendInngestEvent: async () => {
          inngestSent = true
        },
        markBackgroundEventSent: async () => {
          markBackgroundSent = true
        },
      })

      assert.strictEqual(res.status, 200)
      const data = (await res.json()) as any
      assert.strictEqual(data.alreadyPaid, true)
      assert.strictEqual(inngestSent, true)
      assert.strictEqual(markBackgroundSent, true)
    })

    it('14. Concurrent race where markPaymentPaid returns null because competitor won resolves safely', async () => {
      const orderId = 'order-race-rec'
      const scanId = 'scan-race-rec'
      let inngestCount = 0

      const mockOrder = createMockPayPalOrderResource({
        orderId,
        scanId,
        amount: '79.00',
      })

      const req = createMockWebhookRequest({
        event_type: 'CHECKOUT.ORDER.APPROVED',
        resource: { id: orderId },
      })

      let scanFetchCount = 0
      const res = await handlePayPalWebhook(req, {
        verifyWebhookSignature: async () => true,
        getPayPalOrder: async () => mockOrder,
        getScanRecord: async () => {
          scanFetchCount++
          if (scanFetchCount === 1) {
            return {
              id: scanId,
              website_url: 'https://example.com',
              problem: 'technical',
              plan: 'full',
              payment_provider: 'paypal',
              payment_reference: orderId,
              payment_currency: 'USD',
              payment_status: 'pending',
            } as any
          }
          return {
            id: scanId,
            website_url: 'https://example.com',
            problem: 'technical',
            plan: 'full',
            payment_provider: 'paypal',
            payment_reference: orderId,
            payment_currency: 'USD',
            payment_status: 'paid',
            background_event_sent_at: '2026-10-08T12:00:01Z',
          } as any
        },
        markPaymentPaid: async () => null as any,
        sendInngestEvent: async () => {
          inngestCount++
        },
      })

      assert.strictEqual(res.status, 200)
      const data = (await res.json()) as any
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.alreadyPaid, true)
      assert.strictEqual(inngestCount, 0, 'No duplicate Inngest dispatch')
    })

    it('15. Scan with provider cashfree cannot be processed by PayPal webhook', async () => {
      const orderId = 'order-cashfree-cross'
      const scanId = 'scan-cashfree-cross'

      const mockOrder = createMockPayPalOrderResource({
        orderId,
        scanId,
        amount: '79.00',
      })

      const req = createMockWebhookRequest({
        event_type: 'CHECKOUT.ORDER.APPROVED',
        resource: { id: orderId },
      })

      const res = await handlePayPalWebhook(req, {
        verifyWebhookSignature: async () => true,
        getPayPalOrder: async () => mockOrder,
        getScanRecord: async () =>
          ({
            id: scanId,
            plan: 'full',
            payment_provider: 'cashfree',
            payment_reference: orderId,
            payment_currency: 'USD',
            payment_status: 'pending',
          }) as any,
      })

      assert.strictEqual(res.status, 409)
      const data = (await res.json()) as any
      assert.match(data.error, /mismatch/)
    })

    it('16. isValidPayPalCertUrl validates official PayPal domains and blocks spoofed URLs', () => {
      assert.strictEqual(isValidPayPalCertUrl('https://api.paypal.com/cert.pem'), true)
      assert.strictEqual(isValidPayPalCertUrl('https://api.sandbox.paypal.com/cert.pem'), true)
      assert.strictEqual(isValidPayPalCertUrl('https://notifications.paypal.com/cert.pem'), true)
      assert.strictEqual(isValidPayPalCertUrl('http://api.paypal.com/cert.pem'), false)
      assert.strictEqual(isValidPayPalCertUrl('https://evil-paypal.com/cert.pem'), false)
      assert.strictEqual(isValidPayPalCertUrl('https://paypal.com.attacker.com/cert.pem'), false)
      assert.strictEqual(isValidPayPalCertUrl('not-a-url'), false)
      assert.strictEqual(isValidPayPalCertUrl(null), false)
    })
  })
})
