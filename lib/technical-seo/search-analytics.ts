import {
  ALLOWED_SEARCH_CONSOLE_PERMISSIONS,
  createSearchConsoleClient,
  decryptToken,
  getGoogleSearchConsoleConnection,
  listSearchConsoleProperties,
} from './google-search-console'
import { getScanRecord, saveScanSearchAnalytics, verifyReportAccessToken } from './scan-repository'
import { sql } from './db'
import type {
  OpportunitySignalType,
  RankingBand,
  SearchAnalyticsDateRange,
  SearchAnalyticsDiagnostics,
  SearchAnalyticsOpportunitySignal,
  SearchAnalyticsPageRow,
  SearchAnalyticsQueryRow,
  SearchAnalyticsSummary,
} from './types'
import type { searchconsole_v1 } from '@googleapis/searchconsole'

export const SEARCH_ANALYTICS_CONSTANTS = {
  DATE_WINDOW_DAYS: 28,
  FINAL_DATA_LAG_DAYS: 3,
  API_TIMEOUT_MS: 15000,
  MAX_QUERY_ROWS: 100,
  MAX_PAGE_ROWS: 100,
  MAX_OPPORTUNITY_SIGNALS: 20,
  LOW_CTR_MIN_IMPRESSIONS: 50,
  LOW_CTR_MAX_POSITION: 10,
  LOW_CTR_THRESHOLD: 0.02, // 2.0%
  STRIKING_MIN_IMPRESSIONS: 25,
  STRIKING_MIN_POSITION: 10,
  STRIKING_MAX_POSITION: 20,
  MAX_PERSISTED_SEARCH_ANALYTICS_BYTES: 25 * 1024, // 25 KB
} as const

// ── Pure Helpers ─────────────────────────────────────────────────────────────

/**
 * Calculates a deterministic trailing 28-day date range in Pacific Time (America/Los_Angeles).
 *
 * Rules:
 * - 28 complete calendar days (startDate through endDate inclusive is exactly 28 days).
 * - endDate is Pacific calendar date minus 3 days (our conservative freshness buffer for finalized data).
 * - startDate is endDate minus 27 calendar days.
 * - dataState is strictly 'final'.
 */
export function calculateSearchAnalyticsDateRange(referenceDate?: Date): SearchAnalyticsDateRange {
  const ref = referenceDate ?? new Date()

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(ref)
  const year = parseInt(parts.find((p) => p.type === 'year')?.value || '1970', 10)
  const month = parseInt(parts.find((p) => p.type === 'month')?.value || '1', 10)
  const day = parseInt(parts.find((p) => p.type === 'day')?.value || '1', 10)

  // Use UTC midnight for the Pacific calendar date to perform accurate date arithmetic
  const pacificMidnightUtc = new Date(Date.UTC(year, month - 1, day))

  // endDate = Pacific calendar date minus 3 days (freshness buffer)
  const endUtc = new Date(
    pacificMidnightUtc.getTime() - SEARCH_ANALYTICS_CONSTANTS.FINAL_DATA_LAG_DAYS * 86400000
  )

  // startDate = endDate minus 27 days (total 28 days inclusive)
  const startUtc = new Date(
    endUtc.getTime() - (SEARCH_ANALYTICS_CONSTANTS.DATE_WINDOW_DAYS - 1) * 86400000
  )

  const formatDate = (d: Date) => {
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dt = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${dt}`
  }

  return {
    startDate: formatDate(startUtc),
    endDate: formatDate(endUtc),
    days: SEARCH_ANALYTICS_CONSTANTS.DATE_WINDOW_DAYS,
    dataState: 'final',
    timezone: 'America/Los_Angeles',
  }
}

/**
 * Classifies an average position into a descriptive ranking band.
 * Thresholds:
 * - position <= 3 -> 'top3'
 * - position > 3 and <= 10 -> 'firstPage'
 * - position > 10 and <= 20 -> 'strikingDistance'
 * - position > 20 -> 'beyondPage2'
 */
export function classifyRankingBand(position: number): RankingBand {
  if (!Number.isFinite(position) || position <= 0) {
    return 'beyondPage2'
  }
  if (position <= 3) {
    return 'top3'
  }
  if (position <= 10) {
    return 'firstPage'
  }
  if (position <= 20) {
    return 'strikingDistance'
  }
  return 'beyondPage2'
}

/**
 * Normalizes a Google Search Console page URI.
 * - Parses valid absolute URL
 * - Strips fragments
 * - Lowercases protocol and hostname
 * - Normalizes default ports (80 for http, 443 for https)
 * - Preserves pathname and query string
 */
export function normalizeGooglePageUrl(rawUrl: string): string {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return ''
  }

  try {
    const parsed = new URL(rawUrl.trim())
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return rawUrl.trim()
    }

    parsed.hash = ''
    parsed.hostname = parsed.hostname.toLowerCase()
    parsed.protocol = parsed.protocol.toLowerCase()

    if (
      (parsed.protocol === 'https:' && parsed.port === '443') ||
      (parsed.protocol === 'http:' && parsed.port === '80')
    ) {
      parsed.port = ''
    }

    return parsed.toString()
  } catch {
    return rawUrl.trim()
  }
}

/**
 * Derives factual opportunity signals from query rows:
 * - low_ctr_striking: impressions >= 50, position <= 10, ctr < 0.02
 * - striking_distance: impressions >= 25, position > 10, position <= 20
 *
 * Ordered deterministically by impressions descending, then clicks descending, then query ascending.
 * Bounded to 20 signals maximum.
 */
export function deriveOpportunitySignals(
  queries: SearchAnalyticsQueryRow[]
): SearchAnalyticsOpportunitySignal[] {
  const signals: SearchAnalyticsOpportunitySignal[] = []

  for (const q of queries) {
    if (
      q.impressions >= SEARCH_ANALYTICS_CONSTANTS.LOW_CTR_MIN_IMPRESSIONS &&
      q.position <= SEARCH_ANALYTICS_CONSTANTS.LOW_CTR_MAX_POSITION &&
      q.ctr < SEARCH_ANALYTICS_CONSTANTS.LOW_CTR_THRESHOLD
    ) {
      signals.push({
        type: 'low_ctr_striking',
        query: q.query,
        clicks: q.clicks,
        impressions: q.impressions,
        ctr: q.ctr,
        position: q.position,
        reason: 'High first-page visibility with below-expected click-through rate',
      })
    } else if (
      q.impressions >= SEARCH_ANALYTICS_CONSTANTS.STRIKING_MIN_IMPRESSIONS &&
      q.position > SEARCH_ANALYTICS_CONSTANTS.STRIKING_MIN_POSITION &&
      q.position <= SEARCH_ANALYTICS_CONSTANTS.STRIKING_MAX_POSITION
    ) {
      signals.push({
        type: 'striking_distance',
        query: q.query,
        clicks: q.clicks,
        impressions: q.impressions,
        ctr: q.ctr,
        position: q.position,
        reason: 'Striking-distance ranking within striking range of page 1',
      })
    }
  }

  // Deterministic sorting
  signals.sort((a, b) => {
    if (b.impressions !== a.impressions) return b.impressions - a.impressions
    if (b.clicks !== a.clicks) return b.clicks - a.clicks
    return a.query.localeCompare(b.query)
  })

  return signals.slice(0, SEARCH_ANALYTICS_CONSTANTS.MAX_OPPORTUNITY_SIGNALS)
}

/**
 * Parses and safely normalizes the single-row property summary query.
 */
export function parseSearchAnalyticsSummary(
  rows?: searchconsole_v1.Schema$ApiDataRow[] | null
): SearchAnalyticsSummary {
  if (!rows || rows.length === 0 || !rows[0]) {
    return {
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
    }
  }

  const row = rows[0]
  const clicks = Math.round(Math.max(0, row.clicks ?? 0))
  const impressions = Math.round(Math.max(0, row.impressions ?? 0))
  const ctr = Number.isFinite(row.ctr) ? Math.max(0, row.ctr!) : 0
  const position = Number.isFinite(row.position) ? Math.max(0, row.position!) : 0

  return {
    clicks,
    impressions,
    ctr: Math.round(ctr * 10000) / 10000,
    position: Math.round(position * 10) / 10,
  }
}

/**
 * Parses and normalizes query rows.
 */
export function parseSearchAnalyticsQueryRows(
  rows?: searchconsole_v1.Schema$ApiDataRow[] | null
): SearchAnalyticsQueryRow[] {
  if (!rows || !Array.isArray(rows)) {
    return []
  }

  const queryRows: SearchAnalyticsQueryRow[] = []

  for (const row of rows) {
    if (!row) continue
    const query = typeof row.keys?.[0] === 'string' ? row.keys[0].trim() : ''
    if (!query) continue

    const clicks = Math.round(Math.max(0, row.clicks ?? 0))
    const impressions = Math.round(Math.max(0, row.impressions ?? 0))
    const ctr = Number.isFinite(row.ctr) ? Math.max(0, row.ctr!) : 0
    const position = Number.isFinite(row.position) ? Math.max(0, row.position!) : 0

    queryRows.push({
      query,
      clicks,
      impressions,
      ctr: Math.round(ctr * 10000) / 10000,
      position: Math.round(position * 10) / 10,
      rankingBand: classifyRankingBand(position),
    })
  }

  // Sort by clicks descending, then impressions descending, then query ascending
  queryRows.sort((a, b) => {
    if (b.clicks !== a.clicks) return b.clicks - a.clicks
    if (b.impressions !== a.impressions) return b.impressions - a.impressions
    return a.query.localeCompare(b.query)
  })

  return queryRows.slice(0, SEARCH_ANALYTICS_CONSTANTS.MAX_QUERY_ROWS)
}

/**
 * Parses and normalizes page rows, correlating with crawled URLs if known.
 */
export function parseSearchAnalyticsPageRows(
  rows?: searchconsole_v1.Schema$ApiDataRow[] | null,
  crawledUrlSet?: Set<string>
): SearchAnalyticsPageRow[] {
  if (!rows || !Array.isArray(rows)) {
    return []
  }

  const pageRows: SearchAnalyticsPageRow[] = []

  for (const row of rows) {
    if (!row) continue
    const page = typeof row.keys?.[0] === 'string' ? row.keys[0].trim() : ''
    if (!page) continue

    const normalized = normalizeGooglePageUrl(page)
    let normalizedPath = normalized
    try {
      const u = new URL(normalized)
      normalizedPath = u.pathname + (u.search || '')
    } catch {
      // Keep full normalized string if path extraction fails
    }

    const clicks = Math.round(Math.max(0, row.clicks ?? 0))
    const impressions = Math.round(Math.max(0, row.impressions ?? 0))
    const ctr = Number.isFinite(row.ctr) ? Math.max(0, row.ctr!) : 0
    const position = Number.isFinite(row.position) ? Math.max(0, row.position!) : 0

    const isCrawledUrl = crawledUrlSet
      ? crawledUrlSet.has(normalized) || crawledUrlSet.has(page)
      : undefined

    pageRows.push({
      page,
      normalizedPath,
      clicks,
      impressions,
      ctr: Math.round(ctr * 10000) / 10000,
      position: Math.round(position * 10) / 10,
      ...(isCrawledUrl !== undefined ? { isCrawledUrl } : {}),
    })
  }

  // Sort by clicks descending, then impressions descending, then page ascending
  pageRows.sort((a, b) => {
    if (b.clicks !== a.clicks) return b.clicks - a.clicks
    if (b.impressions !== a.impressions) return b.impressions - a.impressions
    return a.page.localeCompare(b.page)
  })

  return pageRows.slice(0, SEARCH_ANALYTICS_CONSTANTS.MAX_PAGE_ROWS)
}

/**
 * Enforces the application-level safety bound of 25 KB for persisted diagnostics.
 * If serialized payload exceeds 25 KB, deterministically reduces retained rows.
 */
export function boundSearchAnalyticsPayload(
  diagnostics: SearchAnalyticsDiagnostics
): SearchAnalyticsDiagnostics {
  const maxBytes = SEARCH_ANALYTICS_CONSTANTS.MAX_PERSISTED_SEARCH_ANALYTICS_BYTES

  let current = { ...diagnostics }
  let jsonStr = JSON.stringify(current)
  if (Buffer.byteLength(jsonStr, 'utf8') <= maxBytes) {
    return current
  }

  // Reduction Stage 1: Cap opportunity signals to 10, top queries to 75, top pages to 75
  current = {
    ...current,
    opportunitySignals: current.opportunitySignals.slice(0, 10),
    topQueries: current.topQueries.slice(0, 75),
    topPages: current.topPages.slice(0, 75),
    queryCount: Math.min(current.queryCount, 75),
    pageCount: Math.min(current.pageCount, 75),
  }
  jsonStr = JSON.stringify(current)
  if (Buffer.byteLength(jsonStr, 'utf8') <= maxBytes) {
    return current
  }

  // Reduction Stage 2: Cap opportunity signals to 5, top queries to 50, top pages to 50
  current = {
    ...current,
    opportunitySignals: current.opportunitySignals.slice(0, 5),
    topQueries: current.topQueries.slice(0, 50),
    topPages: current.topPages.slice(0, 50),
    queryCount: Math.min(current.queryCount, 50),
    pageCount: Math.min(current.pageCount, 50),
  }
  jsonStr = JSON.stringify(current)
  if (Buffer.byteLength(jsonStr, 'utf8') <= maxBytes) {
    return current
  }

  // Reduction Stage 3: Cap opportunity signals to 0, top queries to 25, top pages to 25
  current = {
    ...current,
    opportunitySignals: [],
    topQueries: current.topQueries.slice(0, 25),
    topPages: current.topPages.slice(0, 25),
    queryCount: Math.min(current.queryCount, 25),
    pageCount: Math.min(current.pageCount, 25),
  }
  jsonStr = JSON.stringify(current)
  if (Buffer.byteLength(jsonStr, 'utf8') <= maxBytes) {
    return current
  }

  throw new Error('Search analytics diagnostic payload exceeds safety limit (25 KB).')
}

// ── Service Execution ────────────────────────────────────────────────────────

export interface SearchAnalyticsDependencies {
  getScanRecord?: typeof getScanRecord
  verifyReportAccessToken?: typeof verifyReportAccessToken
  getGoogleSearchConsoleConnection?: typeof getGoogleSearchConsoleConnection
  decryptToken?: typeof decryptToken
  listSearchConsoleProperties?: typeof listSearchConsoleProperties
  createSearchConsoleClient?: typeof createSearchConsoleClient
  saveScanSearchAnalytics?: typeof saveScanSearchAnalytics
  querySearchAnalytics?: (
    client: searchconsole_v1.Searchconsole,
    params: searchconsole_v1.Params$Resource$Searchanalytics$Query
  ) => Promise<searchconsole_v1.Schema$SearchAnalyticsQueryResponse>
  loadCrawledUrlSet?: (scanId: string) => Promise<Set<string>>
  referenceDate?: Date
}

export class SearchAnalyticsError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message)
    this.name = 'SearchAnalyticsError'
  }
}

/**
 * Core query caller: calls client.searchanalytics.query using @googleapis/searchconsole
 * with an explicit 15-second request timeout.
 */
export async function defaultQuerySearchAnalytics(
  client: searchconsole_v1.Searchconsole,
  params: searchconsole_v1.Params$Resource$Searchanalytics$Query,
  options?: { timeout?: number }
): Promise<searchconsole_v1.Schema$SearchAnalyticsQueryResponse> {
  const queryOptions = {
    timeout: options?.timeout ?? SEARCH_ANALYTICS_CONSTANTS.API_TIMEOUT_MS,
  }
  const response = await client.searchanalytics.query(params, queryOptions)
  return response.data
}

/**
 * Loads crawled URLs for this scan to correlate top landing pages.
 */
async function defaultLoadCrawledUrlSet(scanId: string): Promise<Set<string>> {
  try {
    const rows = await sql`
      select normalized_url
      from seo_scan_urls
      where scan_id = ${scanId}::uuid
      limit 500
    `
    const set = new Set<string>()
    for (const r of rows) {
      if (typeof r.normalized_url === 'string') {
        set.add(r.normalized_url)
        set.add(normalizeGooglePageUrl(r.normalized_url))
      }
    }
    return set
  } catch {
    return new Set<string>()
  }
}

/**
 * Executes bounded Search Console Search Analytics diagnostics for a validated Deep scan.
 *
 * Preconditions enforced:
 * 1. scan exists
 * 2. scan.plan === 'deep'
 * 3. report access key is valid
 * 4. gsc_refresh_token_encrypted exists
 * 5. gsc_property exists
 * 6. gsc_property is revalidated against current authenticated Google account via sites.list()
 *
 * Runs 3 bounded queries:
 * A: property summary (dimensions: [], rowLimit: 1)
 * B: top queries (dimensions: ['query'], rowLimit: 100)
 * C: top pages (dimensions: ['page'], rowLimit: 100)
 */
export async function executeSearchAnalyticsDiagnostics(
  input: {
    scanId: string
    key: string
  },
  deps: SearchAnalyticsDependencies = {}
): Promise<SearchAnalyticsDiagnostics> {
  const getScanRecordFn = deps.getScanRecord ?? getScanRecord
  const verifyReportAccessTokenFn = deps.verifyReportAccessToken ?? verifyReportAccessToken
  const getGoogleConnectionFn =
    deps.getGoogleSearchConsoleConnection ?? getGoogleSearchConsoleConnection
  const decryptTokenFn = deps.decryptToken ?? decryptToken
  const listPropertiesFn = deps.listSearchConsoleProperties ?? listSearchConsoleProperties
  const createClientFn = deps.createSearchConsoleClient ?? createSearchConsoleClient
  const saveAnalyticsFn = deps.saveScanSearchAnalytics ?? saveScanSearchAnalytics
  const queryAnalyticsFn = deps.querySearchAnalytics ?? defaultQuerySearchAnalytics
  const loadCrawledUrlsFn = deps.loadCrawledUrlSet ?? defaultLoadCrawledUrlSet

  const { scanId, key } = input

  if (!scanId) {
    throw new SearchAnalyticsError('Scan ID is required.', 400, 'INVALID_SCAN_ID')
  }

  if (!key) {
    throw new SearchAnalyticsError('Access key is required.', 400, 'KEY_REQUIRED')
  }

  // 1. Load scan
  const scan = await getScanRecordFn(scanId)
  if (!scan) {
    throw new SearchAnalyticsError('Scan not found.', 404, 'SCAN_NOT_FOUND')
  }

  // 2. Authorize report key
  const hasValidKey = verifyReportAccessTokenFn(key, scan.report_token_hash)
  if (!hasValidKey) {
    throw new SearchAnalyticsError('Invalid access key.', 403, 'FORBIDDEN')
  }

  // 3. Validate plan === 'deep'
  if (scan.plan !== 'deep') {
    throw new SearchAnalyticsError(
      'Search Analytics diagnostics are only available for Deep Investigation scans.',
      400,
      'PLAN_NOT_ELIGIBLE'
    )
  }

  // 4. Load Google Search Console connection
  const connection = await getGoogleConnectionFn(scanId)
  if (!connection?.encryptedRefreshToken) {
    throw new SearchAnalyticsError(
      'Google account is not connected for this scan.',
      400,
      'GOOGLE_NOT_CONNECTED'
    )
  }

  if (!connection.property) {
    throw new SearchAnalyticsError(
      'Search Console property has not been selected for this scan.',
      400,
      'PROPERTY_NOT_SELECTED'
    )
  }

  const persistedProperty = connection.property

  // 5. Decrypt refresh token
  let plainRefreshToken: string
  try {
    plainRefreshToken = decryptTokenFn(connection.encryptedRefreshToken)
  } catch {
    throw new SearchAnalyticsError(
      'Failed to access stored Google credentials. Please reconnect Google Search Console.',
      401,
      'DECRYPTION_FAILED'
    )
  }

  // 6. Create authenticated Google client
  let client: searchconsole_v1.Searchconsole
  try {
    client = createClientFn(plainRefreshToken)
  } catch (clientErr) {
    const msg = clientErr instanceof Error ? clientErr.message : 'Client instantiation failed'
    throw new SearchAnalyticsError(
      `Failed to initialize Search Console client: ${msg}`,
      500,
      'CLIENT_INIT_FAILED'
    )
  }

  // 7. Revalidate property presence and permissions via live sites.list()
  let liveProperties
  try {
    liveProperties = await listPropertiesFn(plainRefreshToken)
  } catch (apiErr) {
    const message = apiErr instanceof Error ? apiErr.message : 'Google API error'
    if (
      message.includes('invalid_grant') ||
      message.includes('Token has been expired or revoked')
    ) {
      throw new SearchAnalyticsError(
        'Google account access has expired or was revoked. Please reconnect Google Search Console.',
        401,
        'REVOKED_ACCESS'
      )
    }
    throw new SearchAnalyticsError(
      `Google Search Console API error: ${message}`,
      502,
      'UPSTREAM_API_ERROR'
    )
  }

  // Exact property match (never loosely match here)
  const matched = liveProperties.find((entry) => entry.siteUrl === persistedProperty)
  if (!matched) {
    throw new SearchAnalyticsError(
      'The selected Search Console property is no longer accessible with the connected Google account.',
      403,
      'PROPERTY_NOT_AUTHORIZED'
    )
  }

  if (
    !matched.permissionLevel ||
    !ALLOWED_SEARCH_CONSOLE_PERMISSIONS.has(matched.permissionLevel) ||
    matched.permissionLevel === 'siteUnverifiedUser'
  ) {
    throw new SearchAnalyticsError(
      'The connected Google account does not have sufficient permission for this property.',
      403,
      'INSUFFICIENT_PERMISSION'
    )
  }

  // 8. Calculate date range (trailing 28 complete days in America/Los_Angeles with 3-day buffer)
  const dateRange = calculateSearchAnalyticsDateRange(deps.referenceDate)

  // 9. Execute exactly 3 bounded Search Analytics queries
  let summaryResponse: searchconsole_v1.Schema$SearchAnalyticsQueryResponse
  let queriesResponse: searchconsole_v1.Schema$SearchAnalyticsQueryResponse
  let pagesResponse: searchconsole_v1.Schema$SearchAnalyticsQueryResponse

  try {
    // Query A: Property Summary (dimensions: [], rowLimit: 1)
    summaryResponse = await queryAnalyticsFn(client, {
      siteUrl: persistedProperty,
      requestBody: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        dimensions: [],
        dataState: 'final',
        rowLimit: 1,
      },
    })

    // Query B: Top Queries (dimensions: ['query'], rowLimit: 100)
    queriesResponse = await queryAnalyticsFn(client, {
      siteUrl: persistedProperty,
      requestBody: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        dimensions: ['query'],
        dataState: 'final',
        rowLimit: SEARCH_ANALYTICS_CONSTANTS.MAX_QUERY_ROWS,
      },
    })

    // Query C: Top Pages (dimensions: ['page'], rowLimit: 100)
    pagesResponse = await queryAnalyticsFn(client, {
      siteUrl: persistedProperty,
      requestBody: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        dimensions: ['page'],
        dataState: 'final',
        rowLimit: SEARCH_ANALYTICS_CONSTANTS.MAX_PAGE_ROWS,
      },
    })
  } catch (queryErr) {
    const msg = queryErr instanceof Error ? queryErr.message : 'Google API query failed'
    if (msg.includes('403') || msg.includes('Forbidden') || msg.includes('permission')) {
      throw new SearchAnalyticsError(
        'Google Search Console denied permission to query search analytics for this property.',
        403,
        'QUERY_FORBIDDEN'
      )
    }
    if (msg.includes('429') || msg.includes('rateLimitExceeded') || msg.includes('Quota')) {
      throw new SearchAnalyticsError(
        'Google Search Console API rate limit exceeded. Please try again shortly.',
        429,
        'RATE_LIMITED'
      )
    }
    if (msg.includes('invalid_grant')) {
      throw new SearchAnalyticsError(
        'Google account access has expired or was revoked. Please reconnect Google Search Console.',
        401,
        'REVOKED_ACCESS'
      )
    }
    throw new SearchAnalyticsError(
      `Google Search Console API error: ${msg}`,
      502,
      'UPSTREAM_QUERY_ERROR'
    )
  }

  // 10. Load crawled URLs set for landing page correlation
  const crawledUrls = await loadCrawledUrlsFn(scanId)

  // 11. Parse data safely
  const summary = parseSearchAnalyticsSummary(summaryResponse.rows)
  const topQueries = parseSearchAnalyticsQueryRows(queriesResponse.rows)
  const topPages = parseSearchAnalyticsPageRows(pagesResponse.rows, crawledUrls)
  const opportunitySignals = deriveOpportunitySignals(topQueries)

  const isDataAvailable = Boolean(
    summary.impressions > 0 || summary.clicks > 0 || topQueries.length > 0 || topPages.length > 0
  )

  const rawDiagnostics: SearchAnalyticsDiagnostics = {
    property: persistedProperty,
    fetchedAt: new Date().toISOString(),
    dateRange,
    summary,
    topQueries,
    topPages,
    opportunitySignals,
    queryCount: topQueries.length,
    pageCount: topPages.length,
    isDataAvailable,
  }

  // 12. Enforce 25 KB payload safety bound
  const boundedDiagnostics = boundSearchAnalyticsPayload(rawDiagnostics)

  // 13. Persist to seo_scans.gsc_search_analytics_json
  await saveAnalyticsFn(scanId, boundedDiagnostics)

  return boundedDiagnostics
}
