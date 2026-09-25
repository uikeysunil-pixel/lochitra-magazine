import { randomUUID } from 'crypto'
import type {
  ArchitectureSummary,
  CrawlResult,
  DiagnosticProblem,
  DuplicateCandidateSummary,
  Finding,
  FindingSeverity,
  PlanId,
  ScanResult,
} from './types'
import { discoverSitemapPages, isAllowedByRobots, loadRobotsPolicy } from './site-discovery'
import { runQuickScan } from './scanner'

export type CrawlQueueItem = {
  url: string
  depth: number | null
  discoveredFrom: string | null
}

export const CRAWL_LIMITS: Record<PlanId, number> = {
  free: 5,
  quick: 50,
  full: 250,
  deep: 1000,
}

const MAX_CONCURRENCY = 3

const NON_HTML_EXTENSIONS = new Set([
  '.7z',
  '.avi',
  '.bmp',
  '.css',
  '.csv',
  '.doc',
  '.docx',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.js',
  '.json',
  '.mp3',
  '.mp4',
  '.mpeg',
  '.pdf',
  '.png',
  '.svg',
  '.tar',
  '.txt',
  '.webp',
  '.woff',
  '.woff2',
  '.xls',
  '.xlsx',
  '.zip',
])

function normalizeCrawlUrl(value: string): string | null {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

function normalizeForUrlComparison(urlStr: string): string {
  try {
    const u = new URL(urlStr)
    u.hash = ''
    return u.toString()
  } catch {
    return urlStr
  }
}

function isLikelyHtmlUrl(value: string): boolean {
  try {
    const url = new URL(value)
    const pathname = url.pathname.toLowerCase()
    for (const extension of NON_HTML_EXTENSIONS) {
      if (pathname.endsWith(extension)) return false
    }
    return true
  } catch {
    return false
  }
}

export function getPathSection(urlStr: string): string {
  try {
    const url = new URL(urlStr)
    const segments = url.pathname.split('/').filter(Boolean)
    if (segments.length === 0) {
      return '/'
    }
    return `/${segments[0]}/`
  } catch {
    return '/'
  }
}

export function buildArchitectureSummary(params: {
  pageResults: ScanResult[]
  pageDepthMap: Map<string, number | null> | Map<string, number>
  internalInboundGraph: Map<string, Set<string>>
  sitemapDiscoveredUrls: Set<string>
  rootUrl: string
  canonicalRootUrl: string | null
}): ArchitectureSummary {
  const {
    pageResults,
    pageDepthMap,
    internalInboundGraph,
    sitemapDiscoveredUrls,
    rootUrl,
    canonicalRootUrl,
  } = params

  const depthDistribution: Record<number, number> = {}
  let maxDepth = 0

  for (const page of pageResults) {
    const rawDepth = pageDepthMap.get(page.finalUrl) ?? pageDepthMap.get(page.url)
    if (rawDepth !== undefined && rawDepth !== null) {
      depthDistribution[rawDepth] = (depthDistribution[rawDepth] || 0) + 1
      if (rawDepth > maxDepth) {
        maxDepth = rawDepth
      }
    }
  }

  const topLinkedUrls = Array.from(internalInboundGraph.entries())
    .map(([url, sources]) => ({
      url,
      inboundCount: sources.size,
    }))
    .filter((item) => item.inboundCount > 0)
    .sort((a, b) => {
      if (b.inboundCount !== a.inboundCount) {
        return b.inboundCount - a.inboundCount
      }
      return a.url.localeCompare(b.url)
    })
    .slice(0, 20)

  const redirectMap = new Map<string, string>()
  for (const page of pageResults) {
    if (page.url && page.finalUrl && page.url !== page.finalUrl) {
      redirectMap.set(page.url, page.finalUrl)
    }
  }

  const resolveRedirect = (url: string): string => {
    let current = url
    const visited = new Set<string>()
    while (redirectMap.has(current) && !visited.has(current)) {
      visited.add(current)
      current = redirectMap.get(current)!
    }
    return current
  }

  const resolvedInboundGraph = new Map<string, Set<string>>()
  for (const [targetUrl, sources] of internalInboundGraph.entries()) {
    const resolvedTarget = resolveRedirect(targetUrl)
    if (!resolvedInboundGraph.has(resolvedTarget)) {
      resolvedInboundGraph.set(resolvedTarget, new Set())
    }
    const resolvedSet = resolvedInboundGraph.get(resolvedTarget)!
    for (const src of sources) {
      resolvedSet.add(src)
    }

    if (!resolvedInboundGraph.has(targetUrl)) {
      resolvedInboundGraph.set(targetUrl, new Set())
    }
    const directSet = resolvedInboundGraph.get(targetUrl)!
    for (const src of sources) {
      directSet.add(src)
    }
  }

  const isRootTarget = (url: string): boolean => {
    const resolved = resolveRedirect(url)
    const normUrl = normalizeForUrlComparison(url)
    const normResolved = normalizeForUrlComparison(resolved)
    const normRoot = normalizeForUrlComparison(rootUrl)
    const normCanonicalRoot = canonicalRootUrl ? normalizeForUrlComparison(canonicalRootUrl) : null

    return (
      url === rootUrl ||
      resolved === rootUrl ||
      (canonicalRootUrl !== null && (url === canonicalRootUrl || resolved === canonicalRootUrl)) ||
      normUrl === normRoot ||
      normResolved === normRoot ||
      (normCanonicalRoot !== null &&
        (normUrl === normCanonicalRoot || normResolved === normCanonicalRoot))
    )
  }

  const orphanCandidateSet = new Set<string>()
  for (const rawUrl of sitemapDiscoveredUrls) {
    if (isRootTarget(rawUrl)) continue

    const candidateUrl = resolveRedirect(rawUrl)
    if (isRootTarget(candidateUrl)) continue

    const inboundCount =
      (resolvedInboundGraph.get(candidateUrl)?.size ?? 0) +
      (candidateUrl !== rawUrl ? (resolvedInboundGraph.get(rawUrl)?.size ?? 0) : 0)

    if (inboundCount === 0) {
      orphanCandidateSet.add(candidateUrl)
    }
  }

  const orphanCandidates = Array.from(orphanCandidateSet).sort((a, b) => a.localeCompare(b))

  const sectionCounts = new Map<string, number>()
  for (const page of pageResults) {
    const pathSection = getPathSection(page.finalUrl)
    sectionCounts.set(pathSection, (sectionCounts.get(pathSection) || 0) + 1)
  }

  const sectionDistribution = Array.from(sectionCounts.entries())
    .map(([path, pageCount]) => ({ path, pageCount }))
    .sort((a, b) => {
      if (b.pageCount !== a.pageCount) {
        return b.pageCount - a.pageCount
      }
      return a.path.localeCompare(b.path)
    })

  let selfCanonicalCount = 0
  let crossPageCanonicalCount = 0
  let missingCanonicalCount = 0

  for (const page of pageResults) {
    if (!page.canonical || !page.canonical.trim()) {
      missingCanonicalCount += 1
      continue
    }

    try {
      const pageUrlObj = new URL(page.finalUrl)
      const resolved = new URL(page.canonical, page.finalUrl)
      if (!['http:', 'https:'].includes(resolved.protocol)) {
        continue
      }

      if (resolved.origin !== pageUrlObj.origin) {
        continue
      }

      resolved.hash = ''
      const normalizedCanonical = resolved.toString()
      const normalizedPageUrl = normalizeForUrlComparison(page.finalUrl)

      if (normalizedCanonical === normalizedPageUrl) {
        selfCanonicalCount += 1
      } else {
        crossPageCanonicalCount += 1
      }
    } catch {
      continue
    }
  }

  return {
    depthDistribution,
    maxDepth,
    topLinkedUrls,
    orphanCandidates,
    sectionDistribution,
    canonicalSummary: {
      selfCanonicalCount,
      crossPageCanonicalCount,
      missingCanonicalCount,
    },
  }
}

export function buildDuplicateCandidateSummary(params: {
  pageResults: ScanResult[]
  discoveredUrls: Set<string>
  finalOrigin: string | null
}): DuplicateCandidateSummary {
  const { pageResults, discoveredUrls, finalOrigin } = params

  const titleGroups = new Map<string, Set<string>>()
  for (const page of pageResults) {
    if (!page.pageTitle) continue
    const normalizedTitle = page.pageTitle.replace(/\s+/g, ' ').trim()
    if (!normalizedTitle) continue

    if (!titleGroups.has(normalizedTitle)) {
      titleGroups.set(normalizedTitle, new Set())
    }
    titleGroups.get(normalizedTitle)!.add(page.finalUrl)
  }

  const titleDuplicateGroups = Array.from(titleGroups.entries())
    .filter(([_, urls]) => urls.size >= 2)
    .map(([title, urls]) => ({
      title,
      urls: Array.from(urls).sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => {
      if (b.urls.length !== a.urls.length) {
        return b.urls.length - a.urls.length
      }
      return a.title.localeCompare(b.title)
    })

  const descGroups = new Map<string, Set<string>>()
  for (const page of pageResults) {
    if (!page.metaDescription) continue
    const normalizedDesc = page.metaDescription.replace(/\s+/g, ' ').trim()
    if (!normalizedDesc) continue

    if (!descGroups.has(normalizedDesc)) {
      descGroups.set(normalizedDesc, new Set())
    }
    descGroups.get(normalizedDesc)!.add(page.finalUrl)
  }

  const descriptionDuplicateGroups = Array.from(descGroups.entries())
    .filter(([_, urls]) => urls.size >= 2)
    .map(([description, urls]) => ({
      description,
      urls: Array.from(urls).sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => {
      if (b.urls.length !== a.urls.length) {
        return b.urls.length - a.urls.length
      }
      return a.description.localeCompare(b.description)
    })

  const allUrls = new Set<string>()
  for (const page of pageResults) {
    allUrls.add(page.finalUrl)
    allUrls.add(page.url)
  }
  for (const url of discoveredUrls) {
    allUrls.add(url)
  }

  const targetOrigin =
    finalOrigin || (pageResults.length > 0 ? new URL(pageResults[0].finalUrl).origin : null)

  const paramGroups = new Map<string, Set<string>>()
  for (const urlStr of allUrls) {
    try {
      const parsed = new URL(urlStr)
      if (targetOrigin && parsed.origin !== targetOrigin) continue
      parsed.hash = ''
      const baseUrl = `${parsed.origin}${parsed.pathname}`
      const fullUrl = parsed.toString()

      if (!paramGroups.has(baseUrl)) {
        paramGroups.set(baseUrl, new Set())
      }
      paramGroups.get(baseUrl)!.add(fullUrl)
    } catch {
      // ignore invalid URLs
    }
  }

  const parameterVariationGroups = Array.from(paramGroups.entries())
    .filter(([_, variations]) => variations.size >= 2)
    .map(([baseUrl, variations]) => ({
      baseUrl,
      variations: Array.from(variations).sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => {
      if (b.variations.length !== a.variations.length) {
        return b.variations.length - a.variations.length
      }
      return a.baseUrl.localeCompare(b.baseUrl)
    })
    .slice(0, 50)

  const canonicalGroups = new Map<string, Set<string>>()
  for (const page of pageResults) {
    if (!page.canonical || !page.canonical.trim()) continue

    try {
      const pageUrlObj = new URL(page.finalUrl)
      const resolved = new URL(page.canonical, page.finalUrl)
      if (!['http:', 'https:'].includes(resolved.protocol)) continue
      if (resolved.origin !== pageUrlObj.origin) continue

      resolved.hash = ''
      const canonicalTarget = resolved.toString()

      if (!canonicalGroups.has(canonicalTarget)) {
        canonicalGroups.set(canonicalTarget, new Set())
      }
      canonicalGroups.get(canonicalTarget)!.add(page.finalUrl)
    } catch {
      continue
    }
  }

  const canonicalConflictGroups = Array.from(canonicalGroups.entries())
    .filter(([_, declaringUrls]) => declaringUrls.size >= 2)
    .map(([canonicalUrl, declaredOnUrls]) => ({
      canonicalUrl,
      declaredOnUrls: Array.from(declaredOnUrls).sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => {
      if (b.declaredOnUrls.length !== a.declaredOnUrls.length) {
        return b.declaredOnUrls.length - a.declaredOnUrls.length
      }
      return a.canonicalUrl.localeCompare(b.canonicalUrl)
    })

  return {
    titleDuplicateGroups,
    descriptionDuplicateGroups,
    parameterVariationGroups,
    canonicalConflictGroups,
  }
}

function aggregateFindings(pageFindings: Finding[]): Finding[] {
  const groups = new Map<string, Finding>()

  for (const finding of pageFindings) {
    const key = finding.id
    const existing = groups.get(key)
    if (!existing) {
      groups.set(key, {
        ...finding,
        affectedUrls: finding.url ? [finding.url] : [],
      })
      continue
    }

    const existingUrls = new Set(existing.affectedUrls || [])
    if (finding.url) existingUrls.add(finding.url)

    existing.affectedUrls = [...existingUrls]
  }

  const severityRank: Record<FindingSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  }

  return [...groups.values()]
    .map((finding) => {
      const affectedUrls = [...new Set(finding.affectedUrls || [])]
      const multiPage = affectedUrls.length > 1

      let title = finding.title
      if (multiPage && /image\(s\) lack width and\/or height attributes/i.test(title)) {
        title = `Images lack width and/or height attributes on ${affectedUrls.length} pages`
      } else if (multiPage && /image\(s\) have no alt attribute/i.test(title)) {
        title = `Images have no alt attribute on ${affectedUrls.length} pages`
      }

      const baseEvidence = multiPage
        ? finding.evidence.filter(
            (item) => !/^Images checked:/i.test(item) && !/^Images without/i.test(item)
          )
        : finding.evidence

      const evidence = multiPage
        ? [
            ...baseEvidence,
            `Affected pages: ${affectedUrls.length}`,
            'The original page-level evidence is intentionally not summed here; use the affected-page count for the site-wide scope.',
          ]
        : [...baseEvidence, `Affected pages: ${affectedUrls.length}`]

      return {
        ...finding,
        title,
        url: undefined,
        affectedUrls,
        evidence,
      }
    })
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
}

function summarize(findings: Finding[]): ScanResult['summary'] {
  return findings.reduce(
    (acc, finding) => {
      acc[finding.severity] += 1
      return acc
    },
    { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as ScanResult['summary']
  )
}

export type RunCrawlDependencies = {
  runQuickScan?: (url: string) => Promise<ScanResult>
  discoverSitemapPages?: (url: string, limit: number) => Promise<string[]>
  loadRobotsPolicy?: (
    url: string
  ) => Promise<{ rules: Array<{ pattern: string; allow: boolean; specificity: number }> }>
}

export async function runCrawl(
  input: string,
  plan: PlanId,
  diagnosticProblem: DiagnosticProblem,
  scanId: string = randomUUID(),
  deps?: RunCrawlDependencies
): Promise<CrawlResult> {
  const startedAt = Date.now()
  const rootUrl = normalizeCrawlUrl(input)

  if (!rootUrl) {
    throw new Error('Enter a valid http:// or https:// website URL.')
  }

  const runQuickScanFn = deps?.runQuickScan ?? runQuickScan
  const discoverSitemapPagesFn = deps?.discoverSitemapPages ?? discoverSitemapPages
  const loadRobotsPolicyFn = deps?.loadRobotsPolicy ?? loadRobotsPolicy

  const maxUrls = CRAWL_LIMITS[plan]
  const queued: CrawlQueueItem[] = [
    {
      url: rootUrl,
      depth: 0,
      discoveredFrom: null,
    },
  ]
  const seen = new Set([rootUrl])
  const sitemapDiscoveredUrls = new Set<string>()
  const internalInboundGraph = new Map<string, Set<string>>()
  const pageDepthMap = new Map<string, number | null>()
  pageDepthMap.set(rootUrl, 0)

  const recordBfsDepth = (url: string, newDepth: number | null) => {
    if (newDepth === null || newDepth === undefined) return
    const current = pageDepthMap.get(url)
    if (current === undefined || current === null || newDepth < current) {
      pageDepthMap.set(url, newDepth)
    }
  }

  const pageResults: ScanResult[] = []
  let crawlErrors = 0
  let urlsBlockedByRobots = 0
  let finalOrigin: string | null = null
  const robotsPolicy = await loadRobotsPolicyFn(rootUrl)
  let canonicalRootUrl: string | null = null
  let rootFetchFailed = false

  try {
    const sitemapPages = await discoverSitemapPagesFn(rootUrl, maxUrls * 3)
    for (const sitemapPage of sitemapPages) {
      if (seen.size >= maxUrls * 4) break
      const normalized = normalizeCrawlUrl(sitemapPage)
      if (!normalized || !isLikelyHtmlUrl(normalized)) continue
      if (new URL(normalized).origin !== new URL(rootUrl).origin) continue
      if (normalized !== rootUrl) {
        sitemapDiscoveredUrls.add(normalized)
      }
      if (!isAllowedByRobots(robotsPolicy, normalized)) {
        urlsBlockedByRobots += 1
        continue
      }
      if (seen.has(normalized)) continue
      seen.add(normalized)
      queued.push({
        url: normalized,
        depth: null,
        discoveredFrom: null,
      })
    }
  } catch {
    crawlErrors += 1
  }

  while (queued.length > 0 && pageResults.length < maxUrls) {
    const batch = queued.splice(0, Math.min(MAX_CONCURRENCY, maxUrls - pageResults.length))
    const results = await Promise.all(
      batch.map(async (item) => {
        try {
          const result = await runQuickScanFn(item.url)
          return { item, result }
        } catch {
          crawlErrors += 1
          if (item.url === rootUrl) {
            rootFetchFailed = true
          }
          return { item, result: null as ScanResult | null }
        }
      })
    )

    if (rootFetchFailed) {
      throw new Error(
        'We could not reach the website from our scanner. Check the URL and try again.'
      )
    }

    for (const { item, result } of results) {
      if (!result) continue

      pageResults.push(result)

      const knownDepth =
        pageDepthMap.get(result.finalUrl) ?? pageDepthMap.get(item.url) ?? item.depth

      if (knownDepth !== null && knownDepth !== undefined) {
        recordBfsDepth(result.finalUrl, knownDepth)
        recordBfsDepth(item.url, knownDepth)
      }

      if (!finalOrigin) {
        finalOrigin = new URL(result.finalUrl).origin
        canonicalRootUrl = result.finalUrl
        recordBfsDepth(result.finalUrl, 0)
        recordBfsDepth(item.url, 0)
      }

      if (finalOrigin !== new URL(result.finalUrl).origin) continue

      const sourceUrl = result.finalUrl
      const parentDepth = pageDepthMap.get(sourceUrl) ?? pageDepthMap.get(item.url) ?? null

      for (const discovered of result.discoveredInternalUrls) {
        const normalized = normalizeCrawlUrl(discovered)
        if (!normalized || !isLikelyHtmlUrl(normalized)) continue

        try {
          if (new URL(normalized).origin !== finalOrigin) continue
        } catch {
          continue
        }

        if (!internalInboundGraph.has(normalized)) {
          internalInboundGraph.set(normalized, new Set())
        }
        internalInboundGraph.get(normalized)!.add(sourceUrl)

        if (!isAllowedByRobots(robotsPolicy, normalized)) {
          urlsBlockedByRobots += 1
          continue
        }

        const childDepth =
          parentDepth !== null && parentDepth !== undefined ? parentDepth + 1 : null

        if (childDepth !== null) {
          recordBfsDepth(normalized, childDepth)

          const queuedItem = queued.find((q) => q.url === normalized)
          if (queuedItem) {
            if (queuedItem.depth === null || childDepth < queuedItem.depth) {
              queuedItem.depth = childDepth
              queuedItem.discoveredFrom = sourceUrl
            }
          }

          for (const page of pageResults) {
            if (page.url === normalized || page.finalUrl === normalized) {
              recordBfsDepth(page.url, childDepth)
              recordBfsDepth(page.finalUrl, childDepth)
            }
          }
        }

        if (seen.has(normalized)) continue
        seen.add(normalized)

        queued.push({
          url: normalized,
          depth: childDepth,
          discoveredFrom: sourceUrl,
        })

        if (seen.size >= maxUrls * 4) break
      }

      if (seen.size >= maxUrls * 4) break
    }
  }

  if (rootFetchFailed || pageResults.length === 0) {
    throw new Error('We could not reach the website from our scanner. Check the URL and try again.')
  }

  const allFindings = pageResults.flatMap((page) =>
    page.findings.filter(
      (finding) =>
        diagnosticProblem === 'unknown' || finding.diagnosticProblems.includes(diagnosticProblem)
    )
  )

  const findings = aggregateFindings(allFindings)

  const aggregatedMetrics: ScanResult['metrics'] = {
    internalLinks: pageResults.reduce((sum, page) => sum + page.metrics.internalLinks, 0),
    externalLinks: pageResults.reduce((sum, page) => sum + page.metrics.externalLinks, 0),
    images: pageResults.reduce((sum, page) => sum + page.metrics.images, 0),
    imagesWithoutAlt: pageResults.reduce((sum, page) => sum + page.metrics.imagesWithoutAlt, 0),
    imagesWithEmptyAlt: pageResults.reduce((sum, page) => sum + page.metrics.imagesWithEmptyAlt, 0),
    imagesWithoutDimensions: pageResults.reduce(
      (sum, page) => sum + page.metrics.imagesWithoutDimensions,
      0
    ),
    h1Count: pageResults.reduce((sum, page) => sum + page.metrics.h1Count, 0),
    jsonLdBlocks: pageResults.reduce((sum, page) => sum + page.metrics.jsonLdBlocks, 0),
    jsonLdTypes: [...new Set(pageResults.flatMap((page) => page.metrics.jsonLdTypes))].sort(),
    hreflangCount: pageResults.reduce((sum, page) => sum + page.metrics.hreflangCount, 0),
    hasViewport: pageResults.length > 0 && pageResults.every((page) => page.metrics.hasViewport),
    mixedContentCount: pageResults.reduce((sum, page) => sum + page.metrics.mixedContentCount, 0),
  }

  const robotsFound = pageResults.some((page) => page.robotsTxt.found)
  const disallowsRoot = pageResults.some((page) => page.robotsTxt.disallowsRoot)
  const sitemapUrls = [
    ...new Set(
      pageResults.flatMap((page) => [
        ...page.robotsTxt.sitemapUrls,
        ...(page.sitemap.url ? [page.sitemap.url] : []),
      ])
    ),
  ]
  const firstSitemap = pageResults.find((page) => page.sitemap.found && page.sitemap.url)
  const firstRobots = pageResults.find((page) => page.robotsTxt.found)

  const crawlResult: CrawlResult = {
    scanId,
    url: rootUrl,
    finalUrl: canonicalRootUrl || rootUrl,
    fetchedAt: new Date().toISOString(),
    plan,
    maxUrls,
    pagesChecked: pageResults.length,
    urlsDiscovered: seen.size,
    urlsNotCrawled: Math.max(0, seen.size - pageResults.length),
    crawlErrors,
    urlsBlockedByRobots,
    durationMs: Date.now() - startedAt,
    summary: summarize(findings),
    metrics: aggregatedMetrics,
    robotsTxt: {
      status: firstRobots?.robotsTxt.status ?? null,
      found: robotsFound,
      disallowsRoot,
      sitemapUrls,
    },
    sitemap: {
      url: firstSitemap?.sitemap.url ?? sitemapUrls[0] ?? null,
      status: firstSitemap?.sitemap.status ?? null,
      found: Boolean(firstSitemap || sitemapUrls.length > 0),
    },
    pages: pageResults.map((page) => ({
      url: page.url,
      finalUrl: page.finalUrl,
      httpStatus: page.httpStatus,
      durationMs: page.durationMs,
      state: 'complete' as const,
    })),
    findings,
  }

  if (plan === 'full') {
    crawlResult.architecture = buildArchitectureSummary({
      pageResults,
      pageDepthMap,
      internalInboundGraph,
      sitemapDiscoveredUrls,
      rootUrl,
      canonicalRootUrl,
    })
    crawlResult.duplicates = buildDuplicateCandidateSummary({
      pageResults,
      discoveredUrls: seen,
      finalOrigin,
    })
  }

  return crawlResult
}
