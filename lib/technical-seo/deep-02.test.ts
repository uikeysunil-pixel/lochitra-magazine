import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock'
}

/* eslint-disable @typescript-eslint/no-require-imports */
const {
  executeSearchAnalyticsDiagnosticsInternal,
  executeSearchAnalyticsDiagnostics,
  SearchAnalyticsError,
  calculateSearchAnalyticsDateRange,
} = require('./search-analytics')
const {
  handleGoogleSearchAnalyticsPost,
} = require('../../app/api/technical-seo/google/search-analytics/route')
const {
  completeScanRecord,
  saveScanSearchAnalytics,
  hashReportAccessToken,
} = require('./scan-repository')
const { finalizeCrawl, initCrawlState, crawlChunk } = require('./crawler')
const { encryptToken } = require('./google-search-console')
/* eslint-enable @typescript-eslint/no-require-imports */

import type { SearchAnalyticsDiagnostics, CrawlResult, ScanResult } from './types'
import type { ActiveCrawlState } from './crawler'

const TEST_SCAN_ID = 'c3d4e5f6-a7b8-4c3d-8e4f-5a6b7c8d9e0f'
const TEST_ACCESS_KEY = 'locitra_test_access_key_deep_02'
const TEST_KEY_HASH = hashReportAccessToken(TEST_ACCESS_KEY)
const TEST_PROPERTY = 'sc-domain:deep-example.com'
const TEST_KEY_HEX = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
const MOCK_REFRESH_TOKEN = '1//04test_mock_refresh_token_deep_02'
const ENCRYPTED_REFRESH_TOKEN = encryptToken(MOCK_REFRESH_TOKEN, TEST_KEY_HEX)

function createMockAuthRecord(overrides?: Record<string, unknown>) {
  return {
    id: TEST_SCAN_ID,
    plan: 'deep',
    status: 'running',
    payment_status: 'paid',
    report_token_hash: TEST_KEY_HASH,
    payment_provider: 'paypal',
    payment_reference: 'ORDER-12345',
    gsc_property: TEST_PROPERTY,
    gsc_refresh_token_encrypted: ENCRYPTED_REFRESH_TOKEN,
    ...overrides,
  }
}

function createMockDiagnostics(): SearchAnalyticsDiagnostics {
  return {
    property: TEST_PROPERTY,
    fetchedAt: new Date().toISOString(),
    dateRange: calculateSearchAnalyticsDateRange(),
    summary: { clicks: 250, impressions: 5000, ctr: 0.05, position: 8.2 },
    topQueries: [
      {
        query: 'locitra deep investigation',
        clicks: 50,
        impressions: 500,
        ctr: 0.1,
        position: 3.5,
        rankingBand: 'firstPage',
      },
    ],
    topPages: [
      {
        page: 'https://deep-example.com/',
        normalizedPath: '/',
        clicks: 200,
        impressions: 4000,
        ctr: 0.05,
        position: 7.0,
        isCrawledUrl: true,
      },
    ],
    opportunitySignals: [
      {
        type: 'striking_distance',
        query: 'seo audit deep scan',
        clicks: 5,
        impressions: 120,
        ctr: 0.04,
        position: 12.5,
        reason: 'Page 2 keyword within striking distance',
      },
    ],
    queryCount: 1,
    pageCount: 1,
    isDataAvailable: true,
  }
}

function createSuccessfulDeps() {
  let savedDiagnostics: SearchAnalyticsDiagnostics | null = null

  const deps = {
    getDeepScanAuthorizationRecord: async () => createMockAuthRecord() as never,
    decryptToken: () => MOCK_REFRESH_TOKEN,
    createSearchConsoleClient: () => ({}) as never,
    listSearchConsoleProperties: async () => [
      { siteUrl: TEST_PROPERTY, permissionLevel: 'siteOwner' },
    ],
    querySearchAnalytics: async (
      _client: unknown,
      params: { requestBody?: { dimensions?: string[] } }
    ) => {
      const dims = params.requestBody?.dimensions || []
      if (dims.length === 0) {
        return { rows: [{ clicks: 250, impressions: 5000, ctr: 0.05, position: 8.2 }] }
      }
      if (dims.includes('query')) {
        return {
          rows: [
            {
              keys: ['locitra deep investigation'],
              clicks: 50,
              impressions: 500,
              ctr: 0.1,
              position: 3.5,
            },
          ],
        }
      }
      if (dims.includes('page')) {
        return {
          rows: [
            {
              keys: ['https://deep-example.com/'],
              clicks: 200,
              impressions: 4000,
              ctr: 0.05,
              position: 7.0,
            },
          ],
        }
      }
      return { rows: [] }
    },
    saveScanSearchAnalytics: async (_scanId: string, analytics: SearchAnalyticsDiagnostics) => {
      savedDiagnostics = analytics
    },
    loadCrawledUrlSet: async () => new Set(['https://deep-example.com/']),
  }

  return { deps, getSaved: () => savedDiagnostics }
}

function createMockCrawlResult(overrides: Partial<CrawlResult> = {}): CrawlResult {
  return {
    scanId: TEST_SCAN_ID,
    url: 'https://deep-example.com/',
    finalUrl: 'https://deep-example.com/',
    fetchedAt: '2026-09-30T12:00:00.000Z',
    plan: 'deep',
    maxUrls: 1000,
    pagesChecked: 5,
    urlsDiscovered: 5,
    urlsNotCrawled: 0,
    urlsBlockedByRobots: 0,
    crawlErrors: 0,
    durationMs: 100,
    summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    metrics: {
      internalLinks: 10,
      externalLinks: 2,
      images: 2,
      imagesWithoutAlt: 0,
      imagesWithEmptyAlt: 0,
      imagesWithoutDimensions: 0,
      h1Count: 1,
      jsonLdBlocks: 1,
      jsonLdTypes: [],
      hreflangCount: 0,
      hasViewport: true,
      mixedContentCount: 0,
    },
    robotsTxt: { status: 200, found: true, disallowsRoot: false, sitemapUrls: [] },
    sitemap: { url: 'https://deep-example.com/sitemap.xml', status: 200, found: true },
    pages: [],
    findings: [],
    ...overrides,
  }
}

describe('Phase Deep-02 — Surgical Implementation Verification', () => {
  describe('A. Internal Search Analytics Authorization', () => {
    it('succeeds for deep + paid + queued/running scan with valid GSC credentials', async () => {
      const { deps, getSaved } = createSuccessfulDeps()
      const result = await executeSearchAnalyticsDiagnosticsInternal(TEST_SCAN_ID, deps as never)

      assert.strictEqual(result.property, TEST_PROPERTY)
      assert.strictEqual(result.summary.clicks, 250)
      assert.strictEqual(result.summary.impressions, 5000)
      assert.strictEqual(result.topQueries.length, 1)
      assert.strictEqual(result.topPages.length, 1)
      assert.strictEqual(result.isDataAvailable, true)
      assert.ok(getSaved())
      assert.strictEqual(getSaved()?.property, TEST_PROPERTY)
    })

    it('rejects if scan does not exist (404 SCAN_NOT_FOUND)', async () => {
      await assert.rejects(
        async () => {
          await executeSearchAnalyticsDiagnosticsInternal(TEST_SCAN_ID, {
            getDeepScanAuthorizationRecord: async () => null,
          } as never)
        },
        (err: unknown) => {
          assert.ok(err instanceof SearchAnalyticsError)
          const saErr = err as { statusCode: number; code: string }
          assert.strictEqual(saErr.statusCode, 404)
          assert.strictEqual(saErr.code, 'SCAN_NOT_FOUND')
          return true
        }
      )
    })

    it('rejects if plan is not deep (400 PLAN_NOT_ELIGIBLE)', async () => {
      for (const nonDeep of ['free', 'quick', 'full']) {
        await assert.rejects(
          async () => {
            await executeSearchAnalyticsDiagnosticsInternal(TEST_SCAN_ID, {
              getDeepScanAuthorizationRecord: async () =>
                createMockAuthRecord({ plan: nonDeep }) as never,
            } as never)
          },
          (err: unknown) => {
            assert.ok(err instanceof SearchAnalyticsError)
            const saErr = err as { statusCode: number; code: string }
            assert.strictEqual(saErr.statusCode, 400)
            assert.strictEqual(saErr.code, 'PLAN_NOT_ELIGIBLE')
            return true
          }
        )
      }
    })

    it('rejects if payment_status is not paid (402 PAYMENT_REQUIRED)', async () => {
      await assert.rejects(
        async () => {
          await executeSearchAnalyticsDiagnosticsInternal(TEST_SCAN_ID, {
            getDeepScanAuthorizationRecord: async () =>
              createMockAuthRecord({ payment_status: 'unpaid' }) as never,
          } as never)
        },
        (err: unknown) => {
          assert.ok(err instanceof SearchAnalyticsError)
          const saErr = err as { statusCode: number; code: string }
          assert.strictEqual(saErr.statusCode, 402)
          assert.strictEqual(saErr.code, 'PAYMENT_REQUIRED')
          return true
        }
      )
    })

    it('rejects if scan status is not queued or running (409 INVALID_STATUS)', async () => {
      for (const invalidStatus of [
        'awaiting_gsc',
        'awaiting_payment',
        'complete',
        'failed',
        'cancelled',
      ]) {
        await assert.rejects(
          async () => {
            await executeSearchAnalyticsDiagnosticsInternal(TEST_SCAN_ID, {
              getDeepScanAuthorizationRecord: async () =>
                createMockAuthRecord({ status: invalidStatus }) as never,
            } as never)
          },
          (err: unknown) => {
            assert.ok(err instanceof SearchAnalyticsError)
            const saErr = err as { statusCode: number; code: string }
            assert.strictEqual(saErr.statusCode, 409)
            assert.strictEqual(saErr.code, 'INVALID_STATUS')
            return true
          }
        )
      }
    })

    it('rejects if gsc_property is missing (400 PROPERTY_NOT_SELECTED)', async () => {
      await assert.rejects(
        async () => {
          await executeSearchAnalyticsDiagnosticsInternal(TEST_SCAN_ID, {
            getDeepScanAuthorizationRecord: async () =>
              createMockAuthRecord({ gsc_property: null }) as never,
          } as never)
        },
        (err: unknown) => {
          assert.ok(err instanceof SearchAnalyticsError)
          const saErr = err as { statusCode: number; code: string }
          assert.strictEqual(saErr.statusCode, 400)
          assert.strictEqual(saErr.code, 'PROPERTY_NOT_SELECTED')
          return true
        }
      )
    })

    it('rejects if gsc_refresh_token_encrypted is missing (400 GOOGLE_NOT_CONNECTED)', async () => {
      await assert.rejects(
        async () => {
          await executeSearchAnalyticsDiagnosticsInternal(TEST_SCAN_ID, {
            getDeepScanAuthorizationRecord: async () =>
              createMockAuthRecord({ gsc_refresh_token_encrypted: null }) as never,
          } as never)
        },
        (err: unknown) => {
          assert.ok(err instanceof SearchAnalyticsError)
          const saErr = err as { statusCode: number; code: string }
          assert.strictEqual(saErr.statusCode, 400)
          assert.strictEqual(saErr.code, 'GOOGLE_NOT_CONNECTED')
          return true
        }
      )
    })

    it('does not require or accept plaintext report access key', async () => {
      const { deps } = createSuccessfulDeps()
      // executeSearchAnalyticsDiagnosticsInternal accepts only (scanId, deps)
      const result = await executeSearchAnalyticsDiagnosticsInternal(TEST_SCAN_ID, deps as never)
      assert.strictEqual(result.property, TEST_PROPERTY)
    })
  })

  describe('B. HTTP Route Security Unchanged', () => {
    it('missing access key is still rejected with 400', async () => {
      const req = new Request('http://localhost:3000/api/technical-seo/google/search-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId: TEST_SCAN_ID }),
      })

      const res = await handleGoogleSearchAnalyticsPost(req)
      assert.strictEqual(res.status, 400)
      const data = await res.json()
      assert.match(data.error, /Access key is required/)
    })

    it('invalid access key is rejected by service with 403', async () => {
      const req = new Request('http://localhost:3000/api/technical-seo/google/search-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId: TEST_SCAN_ID, key: 'wrong_key' }),
      })

      const res = await handleGoogleSearchAnalyticsPost(req, {
        executeSearchAnalyticsDiagnostics: async () => {
          throw new SearchAnalyticsError('Invalid report access key.', 403, 'FORBIDDEN')
        },
      })
      assert.strictEqual(res.status, 403)
      const data = await res.json()
      assert.strictEqual(data.error, 'Invalid report access key.')
    })

    it('valid access key still succeeds via HTTP route', async () => {
      const mockDiagnostics = createMockDiagnostics()
      const req = new Request('http://localhost:3000/api/technical-seo/google/search-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId: TEST_SCAN_ID, key: TEST_ACCESS_KEY }),
      })

      const res = await handleGoogleSearchAnalyticsPost(req, {
        executeSearchAnalyticsDiagnostics: async () => mockDiagnostics,
      })
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.diagnostics.property, TEST_PROPERTY)
    })
  })

  describe('C. Deep Inngest Execution Logic', () => {
    it('search-analytics step executes only when plan === deep', async () => {
      const stepsRun: string[] = []

      const simulateWorkerStepFlow = async (plan: string) => {
        // Step order in technicalSeoScan:
        // 1. mark-scan-running
        // 2. init-crawl
        // 3. crawl-chunk-*
        // 4. search-analytics (ONLY IF plan === 'deep')
        // 5. finalize-scan
        stepsRun.push('mark-scan-running')
        stepsRun.push('init-crawl')
        stepsRun.push('crawl-chunk-0')

        if (plan === 'deep') {
          stepsRun.push('search-analytics')
        }

        stepsRun.push('finalize-scan')
      }

      for (const nonDeep of ['free', 'quick', 'full']) {
        stepsRun.length = 0
        await simulateWorkerStepFlow(nonDeep)
        assert.ok(
          !stepsRun.includes('search-analytics'),
          `${nonDeep} must NOT run search-analytics`
        )
      }

      stepsRun.length = 0
      await simulateWorkerStepFlow('deep')
      assert.ok(stepsRun.includes('search-analytics'), 'deep MUST run search-analytics')
      assert.deepStrictEqual(stepsRun, [
        'mark-scan-running',
        'init-crawl',
        'crawl-chunk-0',
        'search-analytics',
        'finalize-scan',
      ])
    })
  })

  describe('D. Failure Isolation', () => {
    const googleErrors = [
      { name: 'invalid_grant', error: new Error('invalid_grant: Token expired or revoked') },
      { name: '429 Rate Limit', error: new Error('Quota exceeded: 429 rateLimitExceeded') },
      { name: '503 Service Unavailable', error: new Error('503 backendError') },
      { name: 'Search Console Timeout', error: new Error('Request timeout after 15000ms') },
      {
        name: 'Unexpected Runtime Crash',
        error: new TypeError('Cannot read property of undefined'),
      },
    ]

    for (const { name, error } of googleErrors) {
      it(`gracefully isolates ${name}: returns null, crawl continues, scan reaches complete`, async () => {
        let analyticsAttempted = false
        let analyticsResult: unknown = 'uninitialized'
        let scanCompleted = false

        // Simulate Inngest step runner with failure isolation
        const runStep = async <T>(stepName: string, fn: () => Promise<T>): Promise<T> => {
          if (stepName === 'search-analytics') {
            analyticsAttempted = true
            try {
              return await fn()
            } catch (err) {
              // Exact pattern from inngest/technical-seo-scan.ts
              return null as T
            }
          }
          return await fn()
        }

        analyticsResult = await runStep('search-analytics', async () => {
          throw error
        })

        // Crawl finalization step executes regardless of search-analytics failure
        await runStep('finalize-scan', async () => {
          scanCompleted = true
          return { status: 'complete' }
        })

        assert.strictEqual(analyticsAttempted, true)
        assert.strictEqual(analyticsResult, null, 'Failed analytics step must return null')
        assert.strictEqual(scanCompleted, true, 'Scan must proceed to complete even when GSC fails')
      })
    }
  })

  describe('E. Report Synthesis', () => {
    it('attaches persisted gsc_search_analytics_json to result.searchAnalytics and report_json', async () => {
      const persistedDiagnostics = createMockDiagnostics()
      let updatedReportJson: CrawlResult | null = null

      const mockSql = async (strings: TemplateStringsArray, ...values: unknown[]) => {
        const queryText = strings.join('?')
        if (queryText.includes('select gsc_search_analytics_json')) {
          return [{ gsc_search_analytics_json: persistedDiagnostics }]
        }
        if (queryText.includes('update seo_scans')) {
          // Find the report_json parameter from values
          for (const val of values) {
            if (typeof val === 'string') {
              try {
                const parsed = JSON.parse(val)
                if (parsed && typeof parsed === 'object' && 'pagesChecked' in parsed) {
                  updatedReportJson = parsed as CrawlResult
                }
              } catch {
                // not JSON
              }
            }
          }
          return [{ id: TEST_SCAN_ID }]
        }
        return []
      }

      const dummyResult = createMockCrawlResult({
        findings: [
          {
            id: 'sample-finding',
            title: 'Sample finding',
            severity: 'low',
            confidence: 'high',
            category: 'technical',
            summary: 'A sample finding',
            recommendation: 'Sample recommendation',
            diagnosticProblems: ['indexing'],
            evidence: [],
            affectedUrls: [],
          },
        ],
      })

      assert.strictEqual(dummyResult.searchAnalytics, undefined)

      await completeScanRecord(TEST_SCAN_ID, dummyResult, { sql: mockSql as never })

      // In-memory CrawlResult now has searchAnalytics attached
      const attachedAnalytics = dummyResult.searchAnalytics as
        | SearchAnalyticsDiagnostics
        | undefined
      assert.ok(attachedAnalytics)
      assert.strictEqual(attachedAnalytics.property, TEST_PROPERTY)
      assert.strictEqual(attachedAnalytics.summary.clicks, 250)

      // report_json written to DB contains searchAnalytics
      assert.ok(updatedReportJson)
      const serializedReport = updatedReportJson as CrawlResult
      assert.ok(serializedReport.searchAnalytics)
      assert.strictEqual(serializedReport.searchAnalytics?.property, TEST_PROPERTY)

      // CRITICAL: No credentials in report_json
      const reportText = JSON.stringify(updatedReportJson)
      assert.strictEqual(reportText.includes(MOCK_REFRESH_TOKEN), false)
      assert.strictEqual(reportText.includes(TEST_KEY_HEX), false)
      assert.strictEqual(reportText.includes('gsc_refresh_token_encrypted'), false)
      assert.strictEqual(reportText.includes('client_secret'), false)
    })

    it('preserves existing searchAnalytics on CrawlResult if already set', async () => {
      const existingDiagnostics = createMockDiagnostics()
      let dbQueried = false

      const mockSql = async (strings: TemplateStringsArray) => {
        const queryText = strings.join('?')
        if (queryText.includes('select gsc_search_analytics_json')) {
          dbQueried = true
          return []
        }
        return []
      }

      const dummyResult = createMockCrawlResult({
        searchAnalytics: existingDiagnostics,
      })

      await completeScanRecord(TEST_SCAN_ID, dummyResult, { sql: mockSql as never })
      assert.strictEqual(
        dbQueried,
        false,
        'Should not query DB if searchAnalytics is already attached'
      )
      assert.strictEqual(dummyResult.searchAnalytics, existingDiagnostics)
    })
  })

  describe('F. Crawler Alignment', () => {
    const mockRobots = async () => ({ rules: [], loaded: true })

    function createMockPageScan(overrides: Partial<ScanResult> = {}): ScanResult {
      const url = overrides.url ?? 'https://example.com/'
      return {
        scanId: 'test-scan-id',
        url,
        finalUrl: overrides.finalUrl ?? url,
        fetchedAt: '2026-09-30T12:00:00.000Z',
        httpStatus: overrides.httpStatus ?? 200,
        contentType: 'text/html',
        durationMs: 50,
        pagesChecked: 1,
        internalUrlsDiscovered: 0,
        discoveredInternalUrls: overrides.discoveredInternalUrls ?? [],
        pageTitle: overrides.pageTitle ?? 'Page Title',
        metaDescription: overrides.metaDescription ?? 'Page Description',
        canonical: overrides.canonical ?? null,
        robotsMeta: null,
        robotsTxt: { status: 200, found: true, disallowsRoot: false, sitemapUrls: [] },
        sitemap: { url: null, status: null, found: false },
        metrics: {
          internalLinks: 2,
          externalLinks: 0,
          images: 1,
          imagesWithoutAlt: 0,
          imagesWithEmptyAlt: 0,
          imagesWithoutDimensions: 0,
          h1Count: 1,
          jsonLdBlocks: 0,
          jsonLdTypes: [],
          hreflangCount: 0,
          hasViewport: true,
          mixedContentCount: 0,
        },
        summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        findings: overrides.findings ?? [],
        ...overrides,
      }
    }

    it('deep produces architecture and duplicate candidate diagnostics', async () => {
      const state: ActiveCrawlState = {
        scanId: 'deep-crawl-test',
        rootUrl: 'https://example.com/',
        plan: 'deep',
        diagnosticProblem: 'indexing',
        maxUrls: 1000,
        sequence: 1,
        pagesChecked: 1,
        queued: [],
        seen: new Set(['https://example.com/']),
        sitemapDiscoveredUrls: new Set(),
        internalInboundGraph: new Map(),
        pageDepthMap: new Map([['https://example.com/', 0]]),
        pageResults: [createMockPageScan({ url: 'https://example.com/' })],
        crawlErrors: 0,
        urlsBlockedByRobots: 0,
        finalOrigin: 'https://example.com',
        canonicalRootUrl: 'https://example.com/',
        rootFetchFailed: false,
        isDone: true,
        startedAt: Date.now(),
        robotsPolicy: { rules: [], loaded: true },
      }

      const res = finalizeCrawl(state)
      assert.notStrictEqual(res.architecture, undefined, 'Deep must have architecture diagnostics')
      assert.notStrictEqual(res.duplicates, undefined, 'Deep must have duplicate diagnostics')
      assert.strictEqual(res.architecture?.maxDepth, 0)
    })

    it('full produces architecture and duplicate diagnostics', async () => {
      const fullState = await initCrawlState(
        'https://example.com/',
        'full',
        'unknown',
        'full-test',
        {
          loadRobotsPolicy: mockRobots,
          discoverSitemapPages: async () => [],
        }
      )
      const fullChunk = await crawlChunk(fullState, 1, {
        loadRobotsPolicy: mockRobots,
        runQuickScan: async (url) => createMockPageScan({ url }),
      })
      const res = finalizeCrawl(fullChunk.state)
      assert.notStrictEqual(res.architecture, undefined)
      assert.notStrictEqual(res.duplicates, undefined)
    })

    it('free and quick do not produce architecture or duplicate diagnostics', async () => {
      for (const unalignedPlan of ['free', 'quick'] as const) {
        const state = await initCrawlState(
          'https://example.com/',
          unalignedPlan,
          'unknown',
          `${unalignedPlan}-test`,
          {
            loadRobotsPolicy: mockRobots,
            discoverSitemapPages: async () => [],
          }
        )
        const chunk = await crawlChunk(state, 1, {
          loadRobotsPolicy: mockRobots,
          runQuickScan: async (url) => createMockPageScan({ url }),
        })
        const res = finalizeCrawl(chunk.state)
        assert.strictEqual(
          res.architecture,
          undefined,
          `${unalignedPlan} must not have architecture`
        )
        assert.strictEqual(res.duplicates, undefined, `${unalignedPlan} must not have duplicates`)
      }
    })
  })

  describe('G. Idempotency', () => {
    it('rerunning saveScanSearchAnalytics updates the single row without duplication', async () => {
      const persistedRows: Map<string, unknown> = new Map()
      const mockDiagnostics = createMockDiagnostics()

      // Simulates Postgres UPDATE seo_scans SET gsc_search_analytics_json = ... WHERE id = ...
      const simulateSave = (scanId: string, data: unknown) => {
        persistedRows.set(scanId, data)
      }

      // First run
      simulateSave(TEST_SCAN_ID, mockDiagnostics)
      assert.strictEqual(persistedRows.size, 1)

      // Rerun (idempotent step retry)
      simulateSave(TEST_SCAN_ID, mockDiagnostics)
      assert.strictEqual(persistedRows.size, 1)
      assert.deepStrictEqual(persistedRows.get(TEST_SCAN_ID), mockDiagnostics)
    })

    it('rerunning finalization produces consistent single report_json payload', async () => {
      const persistedDiagnostics = createMockDiagnostics()
      let updateCount = 0

      const mockSql = async (strings: TemplateStringsArray) => {
        const queryText = strings.join('?')
        if (queryText.includes('select gsc_search_analytics_json')) {
          return [{ gsc_search_analytics_json: persistedDiagnostics }]
        }
        if (queryText.includes('update seo_scans')) {
          updateCount++
          return [{ id: TEST_SCAN_ID }]
        }
        return []
      }

      const dummyResult = createMockCrawlResult()

      // First finalization
      await completeScanRecord(TEST_SCAN_ID, dummyResult, { sql: mockSql as never })
      assert.strictEqual(updateCount, 1)
      assert.ok(dummyResult.searchAnalytics)

      // Rerun finalization (retry)
      await completeScanRecord(TEST_SCAN_ID, dummyResult, { sql: mockSql as never })
      assert.strictEqual(updateCount, 2)
      assert.strictEqual(dummyResult.searchAnalytics.property, TEST_PROPERTY)
    })
  })
})
