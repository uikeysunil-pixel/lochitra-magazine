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
  findings: Finding[]
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
  durationMs: number
  summary: ScanResult['summary']
  findings: Finding[]
}
