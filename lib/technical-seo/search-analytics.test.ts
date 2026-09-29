import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock'
}

/* eslint-disable @typescript-eslint/no-require-imports */
const {
  calculateSearchAnalyticsDateRange,
  classifyRankingBand,
  normalizeGooglePageUrl,
  deriveOpportunitySignals,
  parseSearchAnalyticsSummary,
  parseSearchAnalyticsQueryRows,
  parseSearchAnalyticsPageRows,
  boundSearchAnalyticsPayload,
  executeSearchAnalyticsDiagnostics,
  defaultQuerySearchAnalytics,
  SearchAnalyticsError,
  SEARCH_ANALYTICS_CONSTANTS,
} = require('./search-analytics')
const {
  handleGoogleSearchAnalyticsPost,
} = require('../../app/api/technical-seo/google/search-analytics/route')
const { hashReportAccessToken } = require('./scan-repository')
const { encryptToken } = require('./google-search-console')
/* eslint-enable @typescript-eslint/no-require-imports */

const TEST_SCAN_ID = 'b2c3d4e5-f6a7-4b2c-9d3e-4f5a6b7c8d9e'
const TEST_ACCESS_KEY = 'locitra_test_access_key_search_analytics'
const TEST_KEY_HASH = hashReportAccessToken(TEST_ACCESS_KEY)
const TEST_PROPERTY = 'sc-domain:example.com'
const TEST_KEY_HEX = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
const MOCK_REFRESH_TOKEN = '1//04test_mock_refresh_token_valid_12345'
const ENCRYPTED_REFRESH_TOKEN = encryptToken(MOCK_REFRESH_TOKEN, TEST_KEY_HEX)

function createMockScan(overrides?: Record<string, unknown>) {
  return {
    id: TEST_SCAN_ID,
    website_url: 'https://example.com/',
    final_url: null,
    plan: 'deep',
    report_token_hash: TEST_KEY_HASH,
    access_mode: 'private',
    status: 'queued',
    ...overrides,
  }
}

function createMockConnection(overrides?: Record<string, unknown>) {
  return {
    property: TEST_PROPERTY,
    encryptedRefreshToken: ENCRYPTED_REFRESH_TOKEN,
    tokenExpiresAt: null,
    connectedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('Phase 10D — Search Analytics Diagnostics', () => {
  describe('Date Range Calculation', () => {
    it('calculates exact 28-day range in America/Los_Angeles with 3-day freshness buffer', () => {
      // Fixed reference date: 2026-09-29T12:00:00Z (which is 05:00 PDT on 2026-09-29)
      const refDate = new Date('2026-09-29T12:00:00Z')
      const range = calculateSearchAnalyticsDateRange(refDate)

      assert.strictEqual(range.days, 28)
      assert.strictEqual(range.dataState, 'final')
      assert.strictEqual(range.timezone, 'America/Los_Angeles')
      // 2026-09-29 minus 3 days = 2026-09-26
      assert.strictEqual(range.endDate, '2026-09-26')
      // 2026-09-26 minus 27 days = 2026-08-30
      assert.strictEqual(range.startDate, '2026-08-30')

      // Verify startDate to endDate inclusive is exactly 28 calendar days
      const start = new Date(range.startDate + 'T00:00:00Z')
      const end = new Date(range.endDate + 'T00:00:00Z')
      const dayDiff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
      assert.strictEqual(dayDiff, 28)
    })

    it('correctly handles month boundary crossing', () => {
      // Reference date: 2026-03-02T18:00:00Z (March 2, 2026)
      const refDate = new Date('2026-03-02T18:00:00Z')
      const range = calculateSearchAnalyticsDateRange(refDate)

      assert.strictEqual(range.endDate, '2026-02-27') // 3 days before March 2 in non-leap 2026
      assert.strictEqual(range.startDate, '2026-01-31') // 27 days before Feb 27
      assert.strictEqual(range.days, 28)
    })

    it('correctly handles year boundary crossing', () => {
      // Reference date: 2026-01-02T10:00:00Z
      const refDate = new Date('2026-01-02T10:00:00Z')
      const range = calculateSearchAnalyticsDateRange(refDate)

      assert.strictEqual(range.endDate, '2025-12-30')
      assert.strictEqual(range.startDate, '2025-12-03')
      assert.strictEqual(range.days, 28)
    })

    it('correctly calculates 28-day range across Pacific DST transition (March 2026)', () => {
      // Deterministic reference Date in Pacific Time: 2026-03-11T12:00:00Z
      // (Pacific local date: 2026-03-11, crossing the 2026-03-08 DST transition)
      const refDate = new Date('2026-03-11T12:00:00Z')
      const range = calculateSearchAnalyticsDateRange(refDate)

      assert.strictEqual(range.days, 28)
      assert.strictEqual(range.dataState, 'final')
      assert.strictEqual(range.timezone, 'America/Los_Angeles')
      assert.strictEqual(range.endDate, '2026-03-08')
      assert.strictEqual(range.startDate, '2026-02-09')

      // Verify exact 28 calendar days inclusive
      const start = new Date(range.startDate + 'T00:00:00Z')
      const end = new Date(range.endDate + 'T00:00:00Z')
      const dayDiff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
      assert.strictEqual(dayDiff, 28)
    })
  })

  describe('Ranking Band Classification', () => {
    it('classifies position <= 3 as top3', () => {
      assert.strictEqual(classifyRankingBand(1.0), 'top3')
      assert.strictEqual(classifyRankingBand(2.5), 'top3')
      assert.strictEqual(classifyRankingBand(3.0), 'top3')
    })

    it('classifies position > 3 and <= 10 as firstPage', () => {
      assert.strictEqual(classifyRankingBand(3.1), 'firstPage')
      assert.strictEqual(classifyRankingBand(7.0), 'firstPage')
      assert.strictEqual(classifyRankingBand(10.0), 'firstPage')
    })

    it('classifies position > 10 and <= 20 as strikingDistance', () => {
      assert.strictEqual(classifyRankingBand(10.1), 'strikingDistance')
      assert.strictEqual(classifyRankingBand(15.4), 'strikingDistance')
      assert.strictEqual(classifyRankingBand(20.0), 'strikingDistance')
    })

    it('classifies position > 20 as beyondPage2', () => {
      assert.strictEqual(classifyRankingBand(20.1), 'beyondPage2')
      assert.strictEqual(classifyRankingBand(55.0), 'beyondPage2')
      assert.strictEqual(classifyRankingBand(99.0), 'beyondPage2')
    })

    it('handles non-finite or negative values safely', () => {
      assert.strictEqual(classifyRankingBand(NaN), 'beyondPage2')
      assert.strictEqual(classifyRankingBand(-5), 'beyondPage2')
      assert.strictEqual(classifyRankingBand(0), 'beyondPage2')
    })
  })

  describe('Google Page URL Normalization', () => {
    it('removes fragments, lowercases scheme and host, normalizes default ports', () => {
      assert.strictEqual(
        normalizeGooglePageUrl('HTTPS://Example.COM:443/Blog/Post#section-1'),
        'https://example.com/Blog/Post'
      )
      assert.strictEqual(
        normalizeGooglePageUrl('http://EXAMPLE.com:80/path/?a=1&b=2'),
        'http://example.com/path/?a=1&b=2'
      )
    })

    it('preserves non-default ports and path casing', () => {
      assert.strictEqual(
        normalizeGooglePageUrl('https://example.com:8443/CaseSensitivePath/'),
        'https://example.com:8443/CaseSensitivePath/'
      )
    })

    it('handles invalid or empty URLs without throwing', () => {
      assert.strictEqual(normalizeGooglePageUrl(''), '')
      assert.strictEqual(normalizeGooglePageUrl('not-a-valid-url'), 'not-a-valid-url')
    })
  })

  describe('Opportunity Signals Derivation', () => {
    it('identifies low_ctr_striking queries correctly', () => {
      const mockQueries = [
        {
          query: 'high impressions low ctr page 1',
          clicks: 2,
          impressions: 200,
          ctr: 0.01, // < 2%
          position: 4.5, // <= 10
          rankingBand: 'firstPage' as const,
        },
      ]

      const signals = deriveOpportunitySignals(mockQueries)
      assert.strictEqual(signals.length, 1)
      assert.strictEqual(signals[0].type, 'low_ctr_striking')
      assert.strictEqual(signals[0].query, 'high impressions low ctr page 1')
      assert.strictEqual(signals[0].impressions, 200)
    })

    it('identifies striking_distance queries correctly', () => {
      const mockQueries = [
        {
          query: 'page 2 striking keyword',
          clicks: 5,
          impressions: 80,
          ctr: 0.0625,
          position: 12.4, // > 10 and <= 20
          rankingBand: 'strikingDistance' as const,
        },
      ]

      const signals = deriveOpportunitySignals(mockQueries)
      assert.strictEqual(signals.length, 1)
      assert.strictEqual(signals[0].type, 'striking_distance')
      assert.strictEqual(signals[0].query, 'page 2 striking keyword')
      assert.strictEqual(signals[0].position, 12.4)
    })

    it('ignores queries below impression thresholds or outside position zones', () => {
      const mockQueries = [
        {
          query: 'too few impressions page 1',
          clicks: 0,
          impressions: 40, // < 50
          ctr: 0.0,
          position: 5.0,
          rankingBand: 'firstPage' as const,
        },
        {
          query: 'good ctr page 1',
          clicks: 10,
          impressions: 100,
          ctr: 0.1, // >= 2%
          position: 3.0,
          rankingBand: 'top3' as const,
        },
        {
          query: 'page 3 query',
          clicks: 0,
          impressions: 50,
          ctr: 0.0,
          position: 25.0, // > 20
          rankingBand: 'beyondPage2' as const,
        },
      ]

      const signals = deriveOpportunitySignals(mockQueries)
      assert.strictEqual(signals.length, 0)
    })

    it('sorts signals deterministically and enforces maximum 20 bound', () => {
      // Generate 30 valid striking signals
      const manyQueries = Array.from({ length: 30 }, (_, i) => ({
        query: `striking query ${String(i).padStart(2, '0')}`,
        clicks: i,
        impressions: 50 + i * 5,
        ctr: 0.03,
        position: 14.0,
        rankingBand: 'strikingDistance' as const,
      }))

      const signals = deriveOpportunitySignals(manyQueries)
      assert.strictEqual(signals.length, SEARCH_ANALYTICS_CONSTANTS.MAX_OPPORTUNITY_SIGNALS)
      assert.strictEqual(signals.length, 20)

      // Confirm descending impressions ordering
      for (let i = 0; i < signals.length - 1; i++) {
        assert.ok(signals[i].impressions >= signals[i + 1].impressions)
      }
    })
  })

  describe('Data Parsing and Safe Normalization', () => {
    it('parses valid property summary row', () => {
      const rows = [{ clicks: 150, impressions: 3200, ctr: 0.04687, position: 8.24 }]
      const summary = parseSearchAnalyticsSummary(rows)

      assert.strictEqual(summary.clicks, 150)
      assert.strictEqual(summary.impressions, 3200)
      assert.strictEqual(summary.ctr, 0.0469)
      assert.strictEqual(summary.position, 8.2)
    })

    it('handles empty or undefined summary row safely', () => {
      const summaryEmpty = parseSearchAnalyticsSummary([])
      assert.deepStrictEqual(summaryEmpty, { clicks: 0, impressions: 0, ctr: 0, position: 0 })

      const summaryNull = parseSearchAnalyticsSummary(null)
      assert.deepStrictEqual(summaryNull, { clicks: 0, impressions: 0, ctr: 0, position: 0 })
    })

    it('parses valid query rows and caps at 100', () => {
      const rows = Array.from({ length: 120 }, (_, i) => ({
        keys: [`query-${i}`],
        clicks: 120 - i,
        impressions: (120 - i) * 10,
        ctr: 0.1,
        position: 5.0,
      }))

      const parsed = parseSearchAnalyticsQueryRows(rows)
      assert.strictEqual(parsed.length, 100)
      assert.strictEqual(parsed[0].query, 'query-0')
      assert.strictEqual(parsed[0].clicks, 120)
      assert.strictEqual(parsed[0].rankingBand, 'firstPage')
    })

    it('parses page rows and correlates with crawled URLs', () => {
      const crawledSet = new Set(['https://example.com/blog/crawled'])
      const rows = [
        {
          keys: ['https://example.com/blog/crawled'],
          clicks: 25,
          impressions: 400,
          ctr: 0.0625,
          position: 6.1,
        },
        {
          keys: ['https://example.com/uncrawled'],
          clicks: 10,
          impressions: 150,
          ctr: 0.0667,
          position: 9.3,
        },
      ]

      const parsed = parseSearchAnalyticsPageRows(rows, crawledSet)
      assert.strictEqual(parsed.length, 2)
      assert.strictEqual(parsed[0].isCrawledUrl, true)
      assert.strictEqual(parsed[1].isCrawledUrl, false)
      assert.strictEqual(parsed[0].normalizedPath, '/blog/crawled')
    })

    it('skips malformed rows missing keys without throwing', () => {
      const malformedRows = [
        { keys: undefined, clicks: 10, impressions: 100 },
        { keys: [''], clicks: 5, impressions: 50 },
        { keys: ['valid-query'], clicks: 20, impressions: 200, ctr: 0.1, position: 4.0 },
      ]

      const parsed = parseSearchAnalyticsQueryRows(malformedRows as never)
      assert.strictEqual(parsed.length, 1)
      assert.strictEqual(parsed[0].query, 'valid-query')
    })
  })

  describe('Payload Bounding & Safety Limit (25 KB)', () => {
    it('retains normal diagnostic payload intact when under 25 KB', () => {
      const diagnostics = {
        property: 'sc-domain:example.com',
        fetchedAt: new Date().toISOString(),
        dateRange: calculateSearchAnalyticsDateRange(),
        summary: { clicks: 100, impressions: 2000, ctr: 0.05, position: 7.5 },
        topQueries: [
          {
            query: 'test',
            clicks: 10,
            impressions: 200,
            ctr: 0.05,
            position: 5.0,
            rankingBand: 'firstPage' as const,
          },
        ],
        topPages: [
          {
            page: 'https://example.com/',
            normalizedPath: '/',
            clicks: 10,
            impressions: 200,
            ctr: 0.05,
            position: 5.0,
          },
        ],
        opportunitySignals: [],
        queryCount: 1,
        pageCount: 1,
        isDataAvailable: true,
      }

      const bounded = boundSearchAnalyticsPayload(diagnostics)
      assert.strictEqual(bounded.queryCount, 1)
      assert.strictEqual(bounded.pageCount, 1)
    })

    it('deterministically reduces rows if payload exceeds 25 KB', () => {
      // Construct oversized payload with long queries
      const hugeQueries = Array.from({ length: 100 }, (_, i) => ({
        query: `very-long-diagnostic-search-query-string-that-simulates-heavy-payload-${i}-${'a'.repeat(200)}`,
        clicks: 10,
        impressions: 100,
        ctr: 0.1,
        position: 5.0,
        rankingBand: 'firstPage' as const,
      }))
      const hugePages = Array.from({ length: 100 }, (_, i) => ({
        page: `https://example.com/very/deep/and/long/url/path/to/test/payload/bounds/${i}/${'b'.repeat(150)}`,
        normalizedPath: `/path-${i}`,
        clicks: 10,
        impressions: 100,
        ctr: 0.1,
        position: 5.0,
      }))

      const oversized = {
        property: 'sc-domain:example.com',
        fetchedAt: new Date().toISOString(),
        dateRange: calculateSearchAnalyticsDateRange(),
        summary: { clicks: 100, impressions: 2000, ctr: 0.05, position: 7.5 },
        topQueries: hugeQueries,
        topPages: hugePages,
        opportunitySignals: Array.from({ length: 20 }, (_, i) => ({
          type: 'striking_distance' as const,
          query: `striking-${i}-${'c'.repeat(100)}`,
          clicks: 5,
          impressions: 50,
          ctr: 0.1,
          position: 12.0,
          reason: 'test',
        })),
        queryCount: 100,
        pageCount: 100,
        isDataAvailable: true,
      }

      const rawBytes = Buffer.byteLength(JSON.stringify(oversized), 'utf8')
      assert.ok(rawBytes > 25 * 1024, `Initial payload should exceed 25 KB (got ${rawBytes})`)

      const bounded = boundSearchAnalyticsPayload(oversized)
      const boundedBytes = Buffer.byteLength(JSON.stringify(bounded), 'utf8')
      assert.ok(boundedBytes <= 25 * 1024, `Bounded payload must be <= 25 KB (got ${boundedBytes})`)
      assert.ok(bounded.topQueries.length < 100, 'Rows should have been deterministically reduced')
    })
  })

  describe('Query Client Timeout Wiring', () => {
    it('defaultQuerySearchAnalytics explicitly passes 15000ms timeout to client.searchanalytics.query', async () => {
      let capturedParams: unknown = null
      let capturedOptions: unknown = null

      const mockClient = {
        searchanalytics: {
          query: async (params: unknown, options: unknown) => {
            capturedParams = params
            capturedOptions = options
            return { data: { rows: [] } }
          },
        },
      }

      const mockParams = {
        siteUrl: TEST_PROPERTY,
        requestBody: {
          startDate: '2026-08-30',
          endDate: '2026-09-26',
          dimensions: [],
          dataState: 'final',
          rowLimit: 1,
        },
      }

      const result = await defaultQuerySearchAnalytics(mockClient as never, mockParams)
      assert.ok(result)
      assert.deepStrictEqual(capturedParams, mockParams)
      assert.ok(capturedOptions && typeof capturedOptions === 'object')
      assert.strictEqual((capturedOptions as { timeout?: number }).timeout, 15000)
      assert.strictEqual(
        (capturedOptions as { timeout?: number }).timeout,
        SEARCH_ANALYTICS_CONSTANTS.API_TIMEOUT_MS
      )
    })
  })

  describe('executeSearchAnalyticsDiagnostics Service', () => {
    function setupSuccessfulDeps() {
      let savedAnalytics: unknown = null
      const queriesRun: Array<{ siteUrl?: string; dimensions?: string[]; rowLimit?: number }> = []

      const deps = {
        getScanRecord: async () => createMockScan() as never,
        verifyReportAccessToken: () => true,
        getGoogleSearchConsoleConnection: async () => createMockConnection() as never,
        decryptToken: () => MOCK_REFRESH_TOKEN,
        createSearchConsoleClient: () => ({}) as never,
        listSearchConsoleProperties: async () => [
          { siteUrl: TEST_PROPERTY, permissionLevel: 'siteOwner' },
        ],
        querySearchAnalytics: async (
          _client: unknown,
          params: { siteUrl?: string; requestBody?: { dimensions?: string[]; rowLimit?: number } }
        ) => {
          queriesRun.push({
            siteUrl: params.siteUrl,
            dimensions: params.requestBody?.dimensions,
            rowLimit: params.requestBody?.rowLimit,
          })

          const dims = params.requestBody?.dimensions || []
          if (dims.length === 0) {
            // Summary query
            return {
              rows: [{ clicks: 120, impressions: 2400, ctr: 0.05, position: 8.5 }],
            }
          }
          if (dims.includes('query')) {
            // Query query
            return {
              rows: [
                {
                  keys: ['top ranking keyword'],
                  clicks: 50,
                  impressions: 500,
                  ctr: 0.1,
                  position: 2.3,
                },
                {
                  keys: ['low ctr opportunity'],
                  clicks: 2,
                  impressions: 300,
                  ctr: 0.0067,
                  position: 4.2,
                },
                {
                  keys: ['striking keyword'],
                  clicks: 1,
                  impressions: 45,
                  ctr: 0.022,
                  position: 14.1,
                },
              ],
            }
          }
          if (dims.includes('page')) {
            // Page query
            return {
              rows: [
                {
                  keys: ['https://example.com/'],
                  clicks: 80,
                  impressions: 1600,
                  ctr: 0.05,
                  position: 7.2,
                },
                {
                  keys: ['https://example.com/blog/post-1'],
                  clicks: 40,
                  impressions: 800,
                  ctr: 0.05,
                  position: 9.8,
                },
              ],
            }
          }
          return { rows: [] }
        },
        saveScanSearchAnalytics: async (_scanId: string, analytics: unknown) => {
          savedAnalytics = analytics
        },
        loadCrawledUrlSet: async () => new Set(['https://example.com/']),
      }

      return { deps, getSaved: () => savedAnalytics, getQueriesRun: () => queriesRun }
    }

    it('executes successfully and produces typed, bounded diagnostics', async () => {
      const { deps, getSaved, getQueriesRun } = setupSuccessfulDeps()

      const result = await executeSearchAnalyticsDiagnostics(
        { scanId: TEST_SCAN_ID, key: TEST_ACCESS_KEY },
        deps as never
      )

      assert.strictEqual(result.property, TEST_PROPERTY)
      assert.strictEqual(result.isDataAvailable, true)
      assert.strictEqual(result.summary.clicks, 120)
      assert.strictEqual(result.summary.impressions, 2400)
      assert.strictEqual(result.topQueries.length, 3)
      assert.strictEqual(result.topPages.length, 2)
      assert.strictEqual(result.topPages[0].isCrawledUrl, true)
      assert.strictEqual(result.topPages[1].isCrawledUrl, false)
      assert.strictEqual(result.opportunitySignals.length, 2)

      // Verify exact 3 bounded queries run
      const queries = getQueriesRun()
      assert.strictEqual(queries.length, 3)
      assert.strictEqual(queries[0].siteUrl, TEST_PROPERTY)
      assert.deepStrictEqual(queries[0].dimensions, [])
      assert.strictEqual(queries[0].rowLimit, 1)

      assert.strictEqual(queries[1].siteUrl, TEST_PROPERTY)
      assert.deepStrictEqual(queries[1].dimensions, ['query'])
      assert.strictEqual(queries[1].rowLimit, 100)

      assert.strictEqual(queries[2].siteUrl, TEST_PROPERTY)
      assert.deepStrictEqual(queries[2].dimensions, ['page'])
      assert.strictEqual(queries[2].rowLimit, 100)

      // Verify persistence
      assert.ok(getSaved())
      assert.strictEqual((getSaved() as { property: string }).property, TEST_PROPERTY)
    })

    it('handles empty Search Console dataset gracefully (isDataAvailable: false)', async () => {
      const deps = {
        getScanRecord: async () => createMockScan() as never,
        verifyReportAccessToken: () => true,
        getGoogleSearchConsoleConnection: async () => createMockConnection() as never,
        decryptToken: () => MOCK_REFRESH_TOKEN,
        createSearchConsoleClient: () => ({}) as never,
        listSearchConsoleProperties: async () => [
          { siteUrl: TEST_PROPERTY, permissionLevel: 'siteOwner' },
        ],
        querySearchAnalytics: async () => ({ rows: [] }),
        saveScanSearchAnalytics: async () => {},
      }

      const result = await executeSearchAnalyticsDiagnostics(
        { scanId: TEST_SCAN_ID, key: TEST_ACCESS_KEY },
        deps as never
      )

      assert.strictEqual(result.isDataAvailable, false)
      assert.strictEqual(result.summary.clicks, 0)
      assert.strictEqual(result.summary.impressions, 0)
      assert.strictEqual(result.topQueries.length, 0)
      assert.strictEqual(result.topPages.length, 0)
      assert.strictEqual(result.opportunitySignals.length, 0)
    })

    it('rejects if scan does not exist (404)', async () => {
      await assert.rejects(
        async () => {
          await executeSearchAnalyticsDiagnostics({ scanId: TEST_SCAN_ID, key: TEST_ACCESS_KEY }, {
            getScanRecord: async () => null,
          } as never)
        },
        (err: unknown) => {
          assert.ok(err instanceof SearchAnalyticsError)
          assert.strictEqual(err.statusCode, 404)
          assert.strictEqual(err.code, 'SCAN_NOT_FOUND')
          return true
        }
      )
    })

    it('rejects if access key is invalid (403)', async () => {
      await assert.rejects(
        async () => {
          await executeSearchAnalyticsDiagnostics({ scanId: TEST_SCAN_ID, key: 'wrong-key' }, {
            getScanRecord: async () => createMockScan() as never,
            verifyReportAccessToken: () => false,
          } as never)
        },
        (err: unknown) => {
          assert.ok(err instanceof SearchAnalyticsError)
          assert.strictEqual(err.statusCode, 403)
          assert.strictEqual(err.code, 'FORBIDDEN')
          return true
        }
      )
    })

    it('rejects if scan is non-Deep (400)', async () => {
      for (const nonDeepPlan of ['free', 'quick', 'full']) {
        await assert.rejects(
          async () => {
            await executeSearchAnalyticsDiagnostics(
              { scanId: TEST_SCAN_ID, key: TEST_ACCESS_KEY },
              {
                getScanRecord: async () => createMockScan({ plan: nonDeepPlan }) as never,
                verifyReportAccessToken: () => true,
              } as never
            )
          },
          (err: unknown) => {
            assert.ok(err instanceof SearchAnalyticsError)
            assert.strictEqual(err.statusCode, 400)
            assert.strictEqual(err.code, 'PLAN_NOT_ELIGIBLE')
            return true
          }
        )
      }
    })

    it('rejects if Google account is not connected (400)', async () => {
      await assert.rejects(
        async () => {
          await executeSearchAnalyticsDiagnostics({ scanId: TEST_SCAN_ID, key: TEST_ACCESS_KEY }, {
            getScanRecord: async () => createMockScan() as never,
            verifyReportAccessToken: () => true,
            getGoogleSearchConsoleConnection: async () => null,
          } as never)
        },
        (err: unknown) => {
          assert.ok(err instanceof SearchAnalyticsError)
          assert.strictEqual(err.statusCode, 400)
          assert.strictEqual(err.code, 'GOOGLE_NOT_CONNECTED')
          return true
        }
      )
    })

    it('rejects if property has not been selected (400)', async () => {
      await assert.rejects(
        async () => {
          await executeSearchAnalyticsDiagnostics({ scanId: TEST_SCAN_ID, key: TEST_ACCESS_KEY }, {
            getScanRecord: async () => createMockScan() as never,
            verifyReportAccessToken: () => true,
            getGoogleSearchConsoleConnection: async () =>
              createMockConnection({ property: null }) as never,
          } as never)
        },
        (err: unknown) => {
          assert.ok(err instanceof SearchAnalyticsError)
          assert.strictEqual(err.statusCode, 400)
          assert.strictEqual(err.code, 'PROPERTY_NOT_SELECTED')
          return true
        }
      )
    })

    it('rejects if persisted property is no longer in live sites.list() (403)', async () => {
      await assert.rejects(
        async () => {
          await executeSearchAnalyticsDiagnostics({ scanId: TEST_SCAN_ID, key: TEST_ACCESS_KEY }, {
            getScanRecord: async () => createMockScan() as never,
            verifyReportAccessToken: () => true,
            getGoogleSearchConsoleConnection: async () => createMockConnection() as never,
            decryptToken: () => MOCK_REFRESH_TOKEN,
            createSearchConsoleClient: () => ({}) as never,
            listSearchConsoleProperties: async () => [
              { siteUrl: 'sc-domain:other-domain.com', permissionLevel: 'siteOwner' },
            ],
          } as never)
        },
        (err: unknown) => {
          assert.ok(err instanceof SearchAnalyticsError)
          assert.strictEqual(err.statusCode, 403)
          assert.strictEqual(err.code, 'PROPERTY_NOT_AUTHORIZED')
          return true
        }
      )
    })

    it('rejects if live property permission is siteUnverifiedUser (403)', async () => {
      await assert.rejects(
        async () => {
          await executeSearchAnalyticsDiagnostics({ scanId: TEST_SCAN_ID, key: TEST_ACCESS_KEY }, {
            getScanRecord: async () => createMockScan() as never,
            verifyReportAccessToken: () => true,
            getGoogleSearchConsoleConnection: async () => createMockConnection() as never,
            decryptToken: () => MOCK_REFRESH_TOKEN,
            createSearchConsoleClient: () => ({}) as never,
            listSearchConsoleProperties: async () => [
              { siteUrl: TEST_PROPERTY, permissionLevel: 'siteUnverifiedUser' },
            ],
          } as never)
        },
        (err: unknown) => {
          assert.ok(err instanceof SearchAnalyticsError)
          assert.strictEqual(err.statusCode, 403)
          assert.strictEqual(err.code, 'INSUFFICIENT_PERMISSION')
          return true
        }
      )
    })

    it('maps Google invalid_grant to clean 401 error', async () => {
      await assert.rejects(
        async () => {
          await executeSearchAnalyticsDiagnostics({ scanId: TEST_SCAN_ID, key: TEST_ACCESS_KEY }, {
            getScanRecord: async () => createMockScan() as never,
            verifyReportAccessToken: () => true,
            getGoogleSearchConsoleConnection: async () => createMockConnection() as never,
            decryptToken: () => MOCK_REFRESH_TOKEN,
            createSearchConsoleClient: () => ({}) as never,
            listSearchConsoleProperties: async () => {
              throw new Error('invalid_grant: Token has been expired or revoked.')
            },
          } as never)
        },
        (err: unknown) => {
          assert.ok(err instanceof SearchAnalyticsError)
          assert.strictEqual(err.statusCode, 401)
          assert.strictEqual(err.code, 'REVOKED_ACCESS')
          return true
        }
      )
    })

    it('maps Google rate limit (429) to clean 429 error', async () => {
      await assert.rejects(
        async () => {
          await executeSearchAnalyticsDiagnostics({ scanId: TEST_SCAN_ID, key: TEST_ACCESS_KEY }, {
            getScanRecord: async () => createMockScan() as never,
            verifyReportAccessToken: () => true,
            getGoogleSearchConsoleConnection: async () => createMockConnection() as never,
            decryptToken: () => MOCK_REFRESH_TOKEN,
            createSearchConsoleClient: () => ({}) as never,
            listSearchConsoleProperties: async () => [
              { siteUrl: TEST_PROPERTY, permissionLevel: 'siteOwner' },
            ],
            querySearchAnalytics: async () => {
              throw new Error('Quota exceeded: 429 rateLimitExceeded')
            },
          } as never)
        },
        (err: unknown) => {
          assert.ok(err instanceof SearchAnalyticsError)
          assert.strictEqual(err.statusCode, 429)
          assert.strictEqual(err.code, 'RATE_LIMITED')
          return true
        }
      )
    })

    it('maps Google 403 query forbidden to clean 403 error', async () => {
      await assert.rejects(
        async () => {
          await executeSearchAnalyticsDiagnostics({ scanId: TEST_SCAN_ID, key: TEST_ACCESS_KEY }, {
            getScanRecord: async () => createMockScan() as never,
            verifyReportAccessToken: () => true,
            getGoogleSearchConsoleConnection: async () => createMockConnection() as never,
            decryptToken: () => MOCK_REFRESH_TOKEN,
            createSearchConsoleClient: () => ({}) as never,
            listSearchConsoleProperties: async () => [
              { siteUrl: TEST_PROPERTY, permissionLevel: 'siteOwner' },
            ],
            querySearchAnalytics: async () => {
              throw new Error(
                'Google Search Console 403 Forbidden: User does not have sufficient permission'
              )
            },
          } as never)
        },
        (err: unknown) => {
          assert.ok(err instanceof SearchAnalyticsError)
          assert.strictEqual(err.statusCode, 403)
          assert.strictEqual(err.code, 'QUERY_FORBIDDEN')
          return true
        }
      )
    })
  })

  describe('API Route POST /api/technical-seo/google/search-analytics', () => {
    it('rejects malformed request body (400)', async () => {
      const req = new Request('http://localhost:3000/api/technical-seo/google/search-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json',
      })

      const res = await handleGoogleSearchAnalyticsPost(req)
      assert.strictEqual(res.status, 400)
      const data = await res.json()
      assert.match(data.error, /Invalid JSON/)
    })

    it('rejects missing or invalid scan ID (400)', async () => {
      const req = new Request('http://localhost:3000/api/technical-seo/google/search-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId: 'not-a-uuid', key: TEST_ACCESS_KEY }),
      })

      const res = await handleGoogleSearchAnalyticsPost(req)
      assert.strictEqual(res.status, 400)
      const data = await res.json()
      assert.match(data.error, /Invalid or missing scan ID/)
    })

    it('rejects missing access key (400)', async () => {
      const req = new Request('http://localhost:3000/api/technical-seo/google/search-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId: TEST_SCAN_ID, key: '' }),
      })

      const res = await handleGoogleSearchAnalyticsPost(req)
      assert.strictEqual(res.status, 400)
      const data = await res.json()
      assert.match(data.error, /Access key is required/)
    })

    it('successful POST execution returns 200 with sanitized diagnostics and no secrets', async () => {
      const mockDiagnostics = {
        property: TEST_PROPERTY,
        fetchedAt: new Date().toISOString(),
        dateRange: calculateSearchAnalyticsDateRange(),
        summary: { clicks: 100, impressions: 2000, ctr: 0.05, position: 7.5 },
        topQueries: [],
        topPages: [],
        opportunitySignals: [],
        queryCount: 0,
        pageCount: 0,
        isDataAvailable: false,
      }

      const req = new Request('http://localhost:3000/api/technical-seo/google/search-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId: TEST_SCAN_ID, key: TEST_ACCESS_KEY }),
      })

      const res = await handleGoogleSearchAnalyticsPost(req, {
        executeSearchAnalyticsDiagnostics: async () => mockDiagnostics as never,
      })

      assert.strictEqual(res.status, 200)
      const json = await res.json()
      assert.strictEqual(json.success, true)
      assert.strictEqual(json.diagnostics.property, TEST_PROPERTY)

      // CRITICAL SECURITY CHECKS: No secrets in response
      const resText = JSON.stringify(json)
      assert.strictEqual(resText.includes(MOCK_REFRESH_TOKEN), false)
      assert.strictEqual(resText.includes('client_secret'), false)
      assert.strictEqual(resText.includes('tokenEncryptionKey'), false)
      assert.strictEqual(resText.includes('stateSecret'), false)
    })
  })
})
