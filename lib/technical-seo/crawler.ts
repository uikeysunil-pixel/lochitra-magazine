import { randomUUID } from 'crypto'
import type {
  CrawlResult,
  DiagnosticProblem,
  Finding,
  FindingSeverity,
  PlanId,
  ScanResult,
} from './types'
import { discoverSitemapPages, isAllowedByRobots, loadRobotsPolicy } from './site-discovery'
import { runQuickScan } from './scanner'

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

export async function runCrawl(
  input: string,
  plan: PlanId,
  diagnosticProblem: DiagnosticProblem,
  scanId: string = randomUUID()
): Promise<CrawlResult> {
  const startedAt = Date.now()
  const rootUrl = normalizeCrawlUrl(input)

  if (!rootUrl) {
    throw new Error('Enter a valid http:// or https:// website URL.')
  }

  const maxUrls = CRAWL_LIMITS[plan]
  const queued: string[] = [rootUrl]
  const seen = new Set([rootUrl])
  const pageResults: ScanResult[] = []
  let crawlErrors = 0
  let urlsBlockedByRobots = 0
  let finalOrigin: string | null = null
  const robotsPolicy = await loadRobotsPolicy(rootUrl)
  let canonicalRootUrl: string | null = null

  try {
    const sitemapPages = await discoverSitemapPages(rootUrl, maxUrls * 3)
    for (const sitemapPage of sitemapPages) {
      if (seen.size >= maxUrls * 4) break
      const normalized = normalizeCrawlUrl(sitemapPage)
      if (!normalized || !isLikelyHtmlUrl(normalized)) continue
      if (new URL(normalized).origin !== new URL(rootUrl).origin) continue
      if (!isAllowedByRobots(robotsPolicy, normalized)) {
        urlsBlockedByRobots += 1
        continue
      }
      if (seen.has(normalized)) continue
      seen.add(normalized)
      queued.push(normalized)
    }
  } catch {
    crawlErrors += 1
  }

  while (queued.length > 0 && pageResults.length < maxUrls) {
    const batch = queued.splice(0, Math.min(MAX_CONCURRENCY, maxUrls - pageResults.length))
    const results = await Promise.all(
      batch.map(async (url) => {
        try {
          const result = await runQuickScan(url)
          return { url, result }
        } catch {
          crawlErrors += 1
          return { url, result: null as ScanResult | null }
        }
      })
    )

    for (const item of results) {
      if (!item.result) continue

      const result = item.result
      pageResults.push(result)

      if (!finalOrigin) {
        finalOrigin = new URL(result.finalUrl).origin
        canonicalRootUrl = result.finalUrl
      }

      if (finalOrigin !== new URL(result.finalUrl).origin) continue

      for (const discovered of result.discoveredInternalUrls) {
        const normalized = normalizeCrawlUrl(discovered)
        if (!normalized || !isLikelyHtmlUrl(normalized)) continue

        try {
          if (new URL(normalized).origin !== finalOrigin) continue
        } catch {
          continue
        }

        if (!isAllowedByRobots(robotsPolicy, normalized)) {
          urlsBlockedByRobots += 1
          continue
        }

        if (seen.has(normalized)) continue
        seen.add(normalized)
        queued.push(normalized)

        if (seen.size >= maxUrls * 4) break
      }

      if (seen.size >= maxUrls * 4) break
    }
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

  return {
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
}
