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
const { hashReportAccessToken } = require('./scan-repository')
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
    it('A: quick create-order uses $49.00 and 50 pages', async () => {
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
      assert.strictEqual(createdOrder.amount, '49.00')
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

    it('B: full create-order uses $99.00 and 250 pages', async () => {
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
      assert.strictEqual(createdOrder.amount, '99.00')
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

    it('C: valid Deep scan creates $199 USD order using existing scanId', async () => {
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
      assert.strictEqual(payPalOrderInput.amount, '199.00')
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
      let inngestEventPayload: any = null
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

    it('K: Deep capture with $199 succeeds and queues scan + dispatches Inngest', async () => {
      const orderId = 'order-deep-199'
      const scanId = 'scan-deep-uuid'
      let inngestDispatched = false
      let inngestEventPayload: any = null
      let markPaidCalled = false

      const mockOrder = createMockPayPalOrder({
        orderId,
        scanId,
        amount: '199.00',
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

    it('K2: Deep scan with $49 or $99 PayPal order is rejected', async () => {
      const orderId = 'order-deep-cheat-49'
      const scanId = 'scan-deep-target'
      let markPaidCalled = false
      let inngestDispatched = false

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
        amount: '199.00',
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
        amount: '199.00',
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
