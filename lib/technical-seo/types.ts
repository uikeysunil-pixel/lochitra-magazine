export type DiagnosticProblem =
  | 'indexing'
  | 'traffic-drop'
  | 'wrong-page'
  | 'slow'
  | 'technical'
  | 'schema'
  | 'migration'
  | 'broken-links'
  | 'duplicates'
  | 'unknown'

export type PlanId = 'free' | 'quick' | 'full' | 'deep'

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type FindingConfidence = 'high' | 'medium' | 'needs-review'

export interface Finding {
  id: string
  title: string
  category: string
  severity: FindingSeverity
  confidence: FindingConfidence
  summary: string
  evidence: string[]
  recommendation: string
  diagnosticProblems: DiagnosticProblem[]
  url?: string
  affectedUrls?: string[]
}

export interface ScanResult {
  scanId: string
  url: string
  finalUrl: string
  fetchedAt: string
  httpStatus: number
  contentType: string
  durationMs: number
  pagesChecked: number
  internalUrlsDiscovered: number
  discoveredInternalUrls: string[]
  pageTitle: string | null
  metaDescription: string | null
  canonical: string | null
  robotsMeta: string | null
  robotsTxt: {
    status: number | null
    found: boolean
    disallowsRoot: boolean
    sitemapUrls: string[]
  }
  sitemap: {
    url: string | null
    status: number | null
    found: boolean
  }
  metrics: {
    internalLinks: number
    externalLinks: number
    images: number
    imagesWithoutAlt: number
    imagesWithEmptyAlt: number
    imagesWithoutDimensions: number
    h1Count: number
    jsonLdBlocks: number
    jsonLdTypes: string[]
    hreflangCount: number
    hasViewport: boolean
    mixedContentCount: number
  }
  summary: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
  requestedProblem?: DiagnosticProblem
  requestedPlan?: PlanId
  diagnosticFocus?: {
    id: DiagnosticProblem
    label: string
    matchedFindings: number
  }
  reportUrl?: string
  findings: Finding[]
}

export interface CrawlPage {
  url: string
  finalUrl: string
  httpStatus: number
  durationMs: number
  findingsCount?: number
  state: 'complete' | 'failed'
  depth?: number | null
  resultJson?: ScanResult | null
}

export interface CrawlQueueItem {
  url: string
  depth: number | null
  discoveredFrom: string | null
}

export interface CrawlCheckpoint {
  scanId: string
  rootUrl: string
  plan: PlanId
  diagnosticProblem: DiagnosticProblem
  maxUrls: number
  sequence: number
  queued: CrawlQueueItem[]
  seen: string[]
  sitemapDiscoveredUrls: string[]
  internalInboundGraph?: Array<[string, string[]]>
  pageDepthMap: Array<[string, number | null]>
  pageResults?: ScanResult[]
  pagesChecked: number
  crawlErrors: number
  urlsBlockedByRobots: number
  finalOrigin: string | null
  canonicalRootUrl: string | null
  rootFetchFailed: boolean
  isDone: boolean
  startedAt: number
  siteRobotsTxt?: ScanResult['robotsTxt']
  siteSitemap?: ScanResult['sitemap']
  robotsPolicy?: {
    rules: Array<{ pattern: string; allow: boolean; specificity: number }>
    loaded?: boolean
  } | null
}

export interface ArchitectureSummary {
  depthDistribution: Record<number, number>
  maxDepth: number
  topLinkedUrls: Array<{
    url: string
    inboundCount: number
  }>
  orphanCandidates: string[]
  sectionDistribution: Array<{
    path: string
    pageCount: number
  }>
  canonicalSummary: {
    selfCanonicalCount: number
    crossPageCanonicalCount: number
    missingCanonicalCount: number
  }
}

export interface DuplicateCandidateSummary {
  titleDuplicateGroups: Array<{
    title: string
    urls: string[]
  }>
  descriptionDuplicateGroups: Array<{
    description: string
    urls: string[]
  }>
  parameterVariationGroups: Array<{
    baseUrl: string
    variations: string[]
  }>
  canonicalConflictGroups: Array<{
    canonicalUrl: string
    declaredOnUrls: string[]
  }>
}

export interface CrawlResult {
  scanId: string
  url: string
  finalUrl: string
  fetchedAt: string
  plan: PlanId
  maxUrls: number
  pagesChecked: number
  urlsDiscovered: number
  urlsNotCrawled: number
  crawlErrors: number
  urlsBlockedByRobots: number
  durationMs: number
  summary: ScanResult['summary']
  metrics: ScanResult['metrics']
  robotsTxt: ScanResult['robotsTxt']
  sitemap: ScanResult['sitemap']
  pages: CrawlPage[]
  findings: Finding[]
  architecture?: ArchitectureSummary
  duplicates?: DuplicateCandidateSummary
  searchAnalytics?: SearchAnalyticsDiagnostics
}

export type RankingBand = 'top3' | 'firstPage' | 'strikingDistance' | 'beyondPage2'

export type OpportunitySignalType = 'low_ctr_striking' | 'striking_distance'

export interface SearchAnalyticsDateRange {
  startDate: string
  endDate: string
  days: number
  dataState: 'final'
  timezone: string
}

export interface SearchAnalyticsSummary {
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SearchAnalyticsQueryRow {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  rankingBand: RankingBand
}

export interface SearchAnalyticsPageRow {
  page: string
  normalizedPath: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  isCrawledUrl?: boolean
}

export interface SearchAnalyticsOpportunitySignal {
  type: OpportunitySignalType
  query: string
  page?: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  reason: string
}

export interface SearchAnalyticsDiagnostics {
  property: string
  fetchedAt: string
  dateRange: SearchAnalyticsDateRange
  summary: SearchAnalyticsSummary
  topQueries: SearchAnalyticsQueryRow[]
  topPages: SearchAnalyticsPageRow[]
  opportunitySignals: SearchAnalyticsOpportunitySignal[]
  queryCount: number
  pageCount: number
  isDataAvailable: boolean
}

export interface CrawlReportResult extends CrawlResult {
  requestedProblem?: DiagnosticProblem
  requestedPlan?: PlanId
  diagnosticFocus?: {
    id: DiagnosticProblem
    label: string
    matchedFindings: number
  }
  reportUrl?: string
  httpStatus?: number
}

export type CrawlReport = CrawlReportResult
