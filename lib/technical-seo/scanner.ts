import { randomUUID } from 'crypto'
import dns from 'node:dns/promises'
import net from 'node:net'
import type {
  DiagnosticProblem,
  Finding,
  FindingConfidence,
  FindingSeverity,
  ScanResult,
} from './types'

const MAX_HTML_BYTES = 1_500_000
const REQUEST_TIMEOUT_MS = 10_000
const MAX_REDIRECTS = 4

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  '0.0.0.0',
  '127.0.0.1',
  '::1',
])

const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308])

function normalizeUrl(input: string): URL {
  const parsed = new URL(input)
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http:// and https:// URLs are supported.')
  }
  parsed.hash = ''
  return parsed
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false
  const [a, b] = parts
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  )
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase()
  return (
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
  )
}

async function assertSafeHostname(hostname: string): Promise<void> {
  const lower = hostname.toLowerCase()
  if (BLOCKED_HOSTNAMES.has(lower) || lower.endsWith('.localhost')) {
    throw new Error('Local and private network targets are not allowed.')
  }

  const ipVersion = net.isIP(lower)
  if (ipVersion === 4 && isPrivateIPv4(lower)) {
    throw new Error('Private network targets are not allowed.')
  }
  if (ipVersion === 6 && isPrivateIPv6(lower)) {
    throw new Error('Private network targets are not allowed.')
  }

  const records = await dns.lookup(lower, { all: true })
  for (const record of records) {
    if (
      (record.family === 4 && isPrivateIPv4(record.address)) ||
      (record.family === 6 && isPrivateIPv6(record.address))
    ) {
      throw new Error('The target resolves to a private network address.')
    }
  }
}

async function fetchText(url: URL, allowedHost: string): Promise<Response> {
  let current = url

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    await assertSafeHostname(current.hostname)
    if (current.hostname.toLowerCase() !== allowedHost.toLowerCase()) {
      throw new Error('Cross-host redirects are not supported in the MVP scanner.')
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(current.toString(), {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'user-agent': 'Locitra-Technical-SEO-Troubleshooter/0.1 (+https://www.locitra.com/technical-seo/)',
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5',
        },
        signal: controller.signal,
      })

      if (REDIRECT_STATUS_CODES.has(response.status)) {
        const location = response.headers.get('location')
        if (!location) throw new Error('Redirect response did not include a Location header.')
        current = new URL(location, current)
        continue
      }

      return response
    } finally {
      clearTimeout(timeout)
    }
  }

  throw new Error('Too many redirects.')
}

async function readLimitedText(response: Response): Promise<string> {
  const contentLength = Number(response.headers.get('content-length') || 0)
  if (contentLength > MAX_HTML_BYTES) {
    throw new Error('The page is larger than the MVP scan limit of 1.5 MB.')
  }

  const buffer = await response.arrayBuffer()
  if (buffer.byteLength > MAX_HTML_BYTES) {
    throw new Error('The page is larger than the MVP scan limit of 1.5 MB.')
  }

  return new TextDecoder().decode(buffer)
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

function getFirstMatch(html: string, regex: RegExp): string | null {
  const match = html.match(regex)
  return match?.[1]?.trim() ? decodeHtmlEntities(match[1].trim()) : null
}

function getMetaContent(html: string, name: string): string | null {
  const regex = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["'][^>]*>`,
    'i'
  )
  return getFirstMatch(html, regex)
}

function getMetaContentFlexible(html: string, name: string): string | null {
  const tags = html.match(/<meta\\b[^>]*>/gi) || []
  const normalized = name.toLowerCase()

  for (const tag of tags) {
    const nameMatch = tag.match(/(?:name|property)=["']([^"']+)["']/i)
    const contentMatch = tag.match(/content=["']([^"']*)["']/i)
    if (nameMatch?.[1]?.toLowerCase() === normalized && contentMatch) {
      return decodeHtmlEntities(contentMatch[1].trim())
    }
  }

  return null
}

function getCount(html: string, regex: RegExp): number {
  return html.match(regex)?.length || 0
}

function getTitle(html: string): string | null {
  return getFirstMatch(html, /<title\\b[^>]*>([\\s\\S]*?)<\\/title>/i)
}

function getCanonical(html: string): string | null {
  const links = html.match(/<link\\b[^>]*>/gi) || []
  for (const tag of links) {
    const rel = tag.match(/rel=["']([^"']+)["']/i)?.[1] || ''
    if (!/\\bcanonical\\b/i.test(rel)) continue
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1]
    if (href) return decodeHtmlEntities(href.trim())
  }
  return null
}

function getHtmlLang(html: string): string | null {
  return getFirstMatch(html, /<html\\b[^>]*\\blang=["']([^"']+)["']/i)
}

function getJsonLd(html: string): { blocks: number; types: string[]; invalidBlocks: number } {
  const scripts = html.match(
    /<script\\b[^>]*type=["']application\\/ld\\+json["'][^>]*>([\\s\\S]*?)<\\/script>/gi
  ) || []

  const types = new Set<string>()
  let invalidBlocks = 0

  for (const script of scripts) {
    const content = script
      .replace(/^<script\\b[^>]*>/i, '')
      .replace(/<\\/script>$/i, '')
      .trim()

    try {
      const parsed = JSON.parse(content)
      const stack = Array.isArray(parsed) ? parsed : [parsed]
      for (const item of stack) {
        const candidates = Array.isArray(item) ? item : [item]
        for (const candidate of candidates) {
          const type = candidate?.['@type']
          if (typeof type === 'string') types.add(type)
          if (Array.isArray(type)) {
            for (const value of type) {
              if (typeof value === 'string') types.add(value)
            }
          }
        }
      }
    } catch {
      invalidBlocks += 1
    }
  }

  return { blocks: scripts.length, types: [...types].sort(), invalidBlocks }
}

function getLinks(html: string, origin: string): {
  internal: number
  external: number
  hrefs: string[]
  mixedContentCount: number
} {
  const anchors = html.match(/<a\\b[^>]*>/gi) || []
  const hrefs: string[] = []
  let internal = 0
  let external = 0

  for (const anchor of anchors) {
    const href = anchor.match(/href=["']([^"']+)["']/i)?.[1]?.trim()
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      continue
    }

    try {
      const absolute = new URL(href, origin)
      hrefs.push(absolute.toString())
      if (absolute.origin === origin) internal += 1
      else external += 1
    } catch {
      // Ignore malformed hrefs in the MVP scanner.
    }
  }

  const resources = html.match(/(?:src|href)=["']http:\\/\\/[^"']+["']/gi) || []
  const mixedContentCount = new URL(origin).protocol === 'https:' ? resources.length : 0

  return { internal, external, hrefs, mixedContentCount }
}

function getImages(html: string): {
  total: number
  withoutAlt: number
  withoutDimensions: number
} {
  const images = html.match(/<img\\b[^>]*>/gi) || []
  let withoutAlt = 0
  let withoutDimensions = 0

  for (const image of images) {
    const alt = image.match(/\\balt=["']([^"']*)["']/i)
    const width = image.match(/\\bwidth=["']([^"']+)["']/i)
    const height = image.match(/\\bheight=["']([^"']+)["']/i)
    if (!alt || !alt[1].trim()) withoutAlt += 1
    if (!width || !height) withoutDimensions += 1
  }

  return { total: images.length, withoutAlt, withoutDimensions }
}

function getHreflangCount(html: string): number {
  const links = html.match(/<link\\b[^>]*>/gi) || []
  return links.filter((tag) => {
    const rel = tag.match(/rel=["']([^"']+)["']/i)?.[1] || ''
    return /alternate/i.test(rel) && /hreflang=/i.test(tag)
  }).length
}

function getRobotsDirectives(html: string): string | null {
  const robots = getMetaContentFlexible(html, 'robots')
  if (robots) return robots
  return getMetaContentFlexible(html, 'googlebot')
}

function makeFinding(
  id: string,
  title: string,
  category: string,
  severity: FindingSeverity,
  confidence: FindingConfidence,
  summary: string,
  evidence: string[],
  recommendation: string,
  diagnosticProblems: DiagnosticProblem[]
): Finding {
  return {
    id,
    title,
    category,
    severity,
    confidence,
    summary,
    evidence,
    recommendation,
    diagnosticProblems,
  }
}

function buildFindings(input: {
  finalUrl: URL
  status: number
  contentType: string
  html: string
  title: string | null
  description: string | null
  canonical: string | null
  robotsMeta: string | null
  robotsStatus: number | null
  robotsFound: boolean
  robotsDisallowsRoot: boolean
  sitemapUrl: string | null
  sitemapStatus: number | null
  sitemapFound: boolean
  metrics: ReturnType<typeof collectMetrics>
  jsonLdInvalidBlocks: number
  htmlLang: string | null
}): Finding[] {
  const findings: Finding[] = []
  const {
    finalUrl,
    status,
    contentType,
    html,
    title,
    description,
    canonical,
    robotsMeta,
    robotsStatus,
    robotsFound,
    robotsDisallowsRoot,
    sitemapUrl,
    sitemapStatus,
    sitemapFound,
    metrics,
    jsonLdInvalidBlocks,
    htmlLang,
  } = input

  if (status >= 400) {
    findings.push(
      makeFinding(
        'ACCESS-001',
        `The analyzed URL returns HTTP ${status}`,
        'Accessibility',
        status >= 500 ? 'critical' : 'high',
        'high',
        'The requested page did not return a successful HTTP response.',
        [`HTTP status: ${status}`, `Final URL: ${finalUrl.toString()}`],
        'Investigate the server response and confirm that the URL is intended to be live and accessible.',
        ['technical', 'indexing', 'broken-links', 'migration', 'unknown']
      )
    )
  }

  if (finalUrl.protocol !== 'https:') {
    findings.push(
      makeFinding(
        'ACCESS-002',
        'The final URL is not HTTPS',
        'Accessibility',
        'high',
        'high',
        'The analyzed page resolves to an HTTP URL.',
        [`Final URL: ${finalUrl.toString()}`],
        'Use the HTTPS version as the preferred site URL and configure HTTP requests to resolve consistently.',
        ['technical', 'migration', 'unknown']
      )
    )
  }

  if (!title) {
    findings.push(
      makeFinding(
        'ONP-001',
        'Important page is missing a title element',
        'On-page',
        'high',
        'high',
        'No HTML <title> element was detected in the initial response.',
        ['No <title> element found in initial HTML.'],
        'Add a unique, descriptive title that accurately identifies the page.',
        ['technical', 'indexing', 'traffic-drop', 'migration', 'unknown']
      )
    )
  } else {
    const titleLength = title.length
    if (titleLength > 70) {
      findings.push(
        makeFinding(
          'ONP-002',
          'Page title may be unnecessarily long',
          'On-page',
          'low',
          'medium',
          'The title is unusually verbose. Search engines can rewrite title links, so this is an optimization review rather than a hard error.',
          [`Title length: ${titleLength} characters`, `Title: ${title}`],
          'Review the title for clarity, unnecessary boilerplate, and repetition.',
          ['technical', 'traffic-drop', 'unknown']
        )
      )
    }
  }

  if (!description) {
    findings.push(
      makeFinding(
        'ONP-003',
        'Meta description is missing',
        'On-page',
        'info',
        'high',
        'No meta description was detected.',
        ['No <meta name="description"> element found in initial HTML.'],
        'Consider adding a useful page-specific description. Treat this as an optimization opportunity, not an indexing failure.',
        ['technical', 'traffic-drop', 'unknown']
      )
    )
  }

  if (robotsMeta && /\\bnoindex\\b/i.test(robotsMeta)) {
    findings.push(
      makeFinding(
        'INDEX-001',
        'Page contains a noindex directive',
        'Indexability',
        'critical',
        'high',
        'The page explicitly instructs search engines not to index it.',
        [`Robots directive: ${robotsMeta}`],
        'If this page should appear in search, remove the unintended noindex directive and verify the URL in Search Console.',
        ['indexing', 'technical', 'migration', 'unknown']
      )
    )
  }

  if (canonical) {
    try {
      const canonicalUrl = new URL(canonical, finalUrl)
      if (canonicalUrl.hostname !== finalUrl.hostname) {
        findings.push(
          makeFinding(
            'CANON-001',
            'Canonical points to a different hostname',
            'Canonicalization',
            'high',
            'high',
            'The declared canonical uses a different hostname from the analyzed page.',
            [`Page: ${finalUrl.toString()}`, `Canonical: ${canonicalUrl.toString()}`],
            'Confirm that the cross-host canonical is intentional. Otherwise, point the canonical to the preferred URL on this site.',
            ['wrong-page', 'indexing', 'duplicates', 'migration']
          )
        )
      }
    } catch {
      findings.push(
        makeFinding(
          'CANON-002',
          'Canonical URL is malformed',
          'Canonicalization',
          'high',
          'high',
          'A canonical link was found but could not be parsed as a valid URL.',
          [`Canonical value: ${canonical}`],
          'Replace the canonical value with a valid absolute or resolvable URL that represents the preferred version of the page.',
          ['wrong-page', 'indexing', 'duplicates', 'technical']
        )
      )
    }
  } else {
    findings.push(
      makeFinding(
        'CANON-003',
        'No canonical link was detected',
        'Canonicalization',
        'info',
        'medium',
        'No rel="canonical" was detected in the initial HTML.',
        ['No canonical link element found.'],
        'Review whether a canonical declaration would improve URL consistency for this page. Missing canonical is not automatically an error.',
        ['wrong-page', 'indexing', 'duplicates', 'technical']
      )
    )
  }

  if (!robotsFound) {
    findings.push(
      makeFinding(
        'CRAWL-001',
        'robots.txt was not found at the standard location',
        'Crawlability',
        'medium',
        'high',
        'No robots.txt file was available at /robots.txt.',
        [`Checked: ${new URL('/robots.txt', finalUrl).toString()}`],
        'A robots.txt file is optional, but create or review one if you need crawler access rules or sitemap discovery.',
        ['technical', 'indexing', 'migration', 'unknown']
      )
    )
  } else if (robotsDisallowsRoot) {
    findings.push(
      makeFinding(
        'CRAWL-002',
        'robots.txt appears to block the entire site',
        'Crawlability',
        'critical',
        'high',
        'A broad Disallow directive was detected for the root path.',
        ['Detected a root-level Disallow: /.'],
        'Remove the accidental site-wide crawl block if the site is intended to be discoverable in search.',
        ['indexing', 'technical', 'migration', 'traffic-drop', 'unknown']
      )
    )
  }

  if (!sitemapFound) {
    findings.push(
      makeFinding(
        'CRAWL-003',
        'No XML sitemap was detected',
        'Crawlability',
        'medium',
        'medium',
        'No sitemap was found from robots.txt or the standard sitemap.xml location.',
        [sitemapUrl ? `Checked: ${sitemapUrl}` : 'No sitemap URL discovered.'],
        'If the site has important indexable URLs, publish a valid XML sitemap and submit it in Search Console.',
        ['indexing', 'technical', 'migration', 'unknown']
      )
    )
  } else if (sitemapStatus && sitemapStatus >= 400) {
    findings.push(
      makeFinding(
        'CRAWL-004',
        'The detected XML sitemap is not returning a successful response',
        'Crawlability',
        'high',
        'high',
        'The sitemap URL was found but did not return a successful HTTP status.',
        [`Sitemap: ${sitemapUrl}`, `HTTP status: ${sitemapStatus}`],
        'Fix the sitemap response and ensure it is accessible to crawlers.',
        ['indexing', 'technical', 'migration']
      )
    )
  }

  if (metrics.internalLinks === 0) {
    findings.push(
      makeFinding(
        'LINK-001',
        'No internal links were detected on the analyzed page',
        'Internal linking',
        'high',
        'high',
        'The initial HTML contained no crawlable internal <a href> links.',
        ['Internal link count: 0'],
        'Add relevant internal links to important pages where appropriate. The homepage may require special interpretation if navigation is client-rendered.',
        ['indexing', 'technical', 'duplicates', 'unknown']
      )
    )
  }

  if (metrics.imagesWithoutAlt > 0) {
    findings.push(
      makeFinding(
        'IMG-001',
        `${metrics.imagesWithoutAlt} image(s) have missing or empty alt text`,
        'Images',
        'low',
        'high',
        'Some image elements do not include useful alt text.',
        [`Images checked: ${metrics.images}`, `Images without alt text: ${metrics.imagesWithoutAlt}`],
        'Review decorative images separately from informative images and add concise alternative text to informative images.',
        ['technical', 'unknown']
      )
    )
  }

  if (metrics.imagesWithoutDimensions > 0) {
    findings.push(
      makeFinding(
        'IMG-002',
        `${metrics.imagesWithoutDimensions} image(s) lack width and/or height attributes`,
        'Images',
        'low',
        'high',
        'Image dimensions were not present in the initial HTML for some images.',
        [
          `Images checked: ${metrics.images}`,
          `Images without width/height: ${metrics.imagesWithoutDimensions}`,
        ],
        'Review responsive image implementation and explicit dimensions to reduce layout shifts where appropriate.',
        ['slow', 'technical', 'unknown']
      )
    )
  }

  if (metrics.mixedContentCount > 0) {
    findings.push(
      makeFinding(
        'ACCESS-003',
        `${metrics.mixedContentCount} HTTP resource reference(s) were detected`,
        'Accessibility',
        'medium',
        'medium',
        'The HTTPS page contains resource references using HTTP URLs.',
        [`HTTP resource references: ${metrics.mixedContentCount}`],
        'Update important resource references to HTTPS and verify that the page remains fully functional.',
        ['slow', 'technical', 'migration']
      )
    )
  }

  if (jsonLdInvalidBlocks > 0) {
    findings.push(
      makeFinding(
        'SD-001',
        `${jsonLdInvalidBlocks} JSON-LD block(s) could not be parsed`,
        'Structured data',
        'high',
        'high',
        'One or more application/ld+json blocks are not valid JSON.',
        [`Invalid JSON-LD blocks: ${jsonLdInvalidBlocks}`],
        'Repair the JSON syntax and then validate the structured data against the intended Google-supported feature.',
        ['schema', 'technical', 'unknown']
      )
    )
  }

  if (metrics.jsonLdBlocks === 0) {
    findings.push(
      makeFinding(
        'SD-002',
        'No JSON-LD structured data was detected',
        'Structured data',
        'info',
        'high',
        'No application/ld+json blocks were found in the initial HTML.',
        ['JSON-LD blocks: 0'],
        'Review whether structured data is appropriate for this page type. Absence of JSON-LD is not automatically an SEO error.',
        ['schema', 'technical', 'unknown']
      )
    )
  }

  if (!htmlLang) {
    findings.push(
      makeFinding(
        'ONP-004',
        'The HTML document does not declare a language',
        'HTML quality',
        'low',
        'high',
        'No lang attribute was found on the html element.',
        ['No <html lang="..."> attribute detected.'],
        'Declare the primary document language to improve HTML semantics and accessibility.',
        ['technical', 'unknown']
      )
    )
  }

  if (!metrics.hasViewport) {
    findings.push(
      makeFinding(
        'MOBILE-001',
        'No mobile viewport meta tag was detected',
        'Mobile',
        'medium',
        'high',
        'The initial HTML did not contain a standard viewport declaration.',
        ['No <meta name="viewport"> detected.'],
        'Review the page template and mobile rendering behavior.',
        ['slow', 'technical', 'unknown']
      )
    )
  }

  if (metrics.h1Count === 0) {
    findings.push(
      makeFinding(
        'ONP-005',
        'No H1 heading was detected',
        'On-page',
        'medium',
        'high',
        'No H1 element was found in the initial HTML.',
        ['H1 count: 0'],
        'Confirm that the page has a clear primary heading and that it is present in crawlable HTML.',
        ['technical', 'indexing', 'unknown']
      )
    )
  }

  if (metrics.h1Count > 1) {
    findings.push(
      makeFinding(
        'ONP-006',
        `${metrics.h1Count} H1 headings were detected`,
        'On-page',
        'info',
        'high',
        'Multiple H1 elements were found. This is a review signal, not automatically an SEO error.',
        [`H1 count: ${metrics.h1Count}`],
        'Review whether the heading hierarchy clearly communicates the main page topic.',
        ['technical', 'unknown']
      )
    )
  }

  if (html.toLowerCase().includes('<meta name="robots" content="nofollow"')) {
    findings.push(
      makeFinding(
        'LINK-002',
        'A page-level nofollow directive was detected',
        'Internal linking',
        'medium',
        'high',
        'The page asks search engines not to follow links on the page.',
        ['Detected a robots nofollow directive.'],
        'Confirm that nofollow is intentional for this page.',
        ['technical', 'indexing', 'unknown']
      )
    )
  }

  return findings
}

function collectMetrics(html: string, finalUrl: URL) {
  const links = getLinks(html, finalUrl.origin)
  const images = getImages(html)
  const jsonLd = getJsonLd(html)
  const hreflangCount = getHreflangCount(html)
  const hasViewport =
    /<meta\\b[^>]*(?:name=["']viewport["'][^>]*content=|content=["'][^"']*width=device-width[^"']*)/i.test(
      html
    )

  return {
    internalLinks: links.internal,
    externalLinks: links.external,
    images: images.total,
    imagesWithoutAlt: images.withoutAlt,
    imagesWithoutDimensions: images.withoutDimensions,
    h1Count: getCount(html, /<h1\\b[^>]*>/gi),
    jsonLdBlocks: jsonLd.blocks,
    jsonLdTypes: jsonLd.types,
    hreflangCount,
    hasViewport,
    mixedContentCount: links.mixedContentCount,
  }
}

function getRobotsTxtDirectives(text: string): { disallowsRoot: boolean; sitemapUrls: string[] } {
  const lines = text.split(/\\r?\\n/)
  const sitemapUrls = lines
    .filter((line) => /^\\s*sitemap:/i.test(line))
    .map((line) => line.replace(/^\\s*sitemap:\\s*/i, '').trim())
    .filter(Boolean)

  let userAgentMatches = false
  let disallowsRoot = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    if (/^user-agent:\\s*\\*/i.test(trimmed)) {
      userAgentMatches = true
      continue
    }

    if (userAgentMatches && /^disallow:\\s*\\/$/i.test(trimmed)) {
      disallowsRoot = true
    }

    if (userAgentMatches && /^user-agent:/i.test(trimmed)) {
      userAgentMatches = /^user-agent:\\s*\\*/i.test(trimmed)
    }
  }

  return { disallowsRoot, sitemapUrls }
}

async function checkAuxiliaryFiles(finalUrl: URL) {
  const robotsUrl = new URL('/robots.txt', finalUrl)
  let robotsStatus: number | null = null
  let robotsFound = false
  let robotsDisallowsRoot = false
  let sitemapUrls: string[] = []

  try {
    const response = await fetchText(robotsUrl, finalUrl.hostname)
    robotsStatus = response.status
    if (response.status >= 200 && response.status < 300) {
      robotsFound = true
      const text = await readLimitedText(response)
      const parsed = getRobotsTxtDirectives(text)
      robotsDisallowsRoot = parsed.disallowsRoot
      sitemapUrls = parsed.sitemapUrls
    }
  } catch {
    // robots.txt is optional; retain null/false signals.
  }

  const candidates = [
    ...sitemapUrls,
    new URL('/sitemap.xml', finalUrl).toString(),
    new URL('/sitemap_index.xml', finalUrl).toString(),
  ]

  const uniqueCandidates = [...new Set(candidates)]
  let sitemapUrl: string | null = null
  let sitemapStatus: number | null = null
  let sitemapFound = false

  for (const candidate of uniqueCandidates) {
    try {
      const candidateUrl = normalizeUrl(candidate)
      const response = await fetchText(candidateUrl, finalUrl.hostname)
      sitemapStatus = response.status
      sitemapUrl = candidateUrl.toString()
      if (response.status >= 200 && response.status < 300) {
        sitemapFound = true
        break
      }
    } catch {
      // Continue trying the next candidate.
    }
  }

  return {
    robotsStatus,
    robotsFound,
    robotsDisallowsRoot,
    sitemapUrl,
    sitemapStatus,
    sitemapFound,
  }
}

export async function runQuickScan(input: string): Promise<ScanResult> {
  const startedAt = Date.now()
  const url = normalizeUrl(input)
  await assertSafeHostname(url.hostname)

  const response = await fetchText(url, url.hostname)
  const finalUrl = normalizeUrl(response.url || url.toString())
  const contentType = response.headers.get('content-type') || 'unknown'

  if (!/text\\/html|application\\/xhtml\\+xml/i.test(contentType)) {
    throw new Error(`The URL did not return HTML. Detected content type: ${contentType}`)
  }

  const html = await readLimitedText(response)
  const metrics = collectMetrics(html, finalUrl)
  const robotsMeta = getRobotsDirectives(html)
  const title = getTitle(html)
  const description =
    getMetaContentFlexible(html, 'description') || getMetaContent(html, 'description')
  const canonical = getCanonical(html)
  const htmlLang = getHtmlLang(html)
  const jsonLd = getJsonLd(html)
  const auxiliary = await checkAuxiliaryFiles(finalUrl)

  const findings = buildFindings({
    finalUrl,
    status: response.status,
    contentType,
    html,
    title,
    description,
    canonical,
    robotsMeta,
    robotsStatus: auxiliary.robotsStatus,
    robotsFound: auxiliary.robotsFound,
    robotsDisallowsRoot: auxiliary.robotsDisallowsRoot,
    sitemapUrl: auxiliary.sitemapUrl,
    sitemapStatus: auxiliary.sitemapStatus,
    sitemapFound: auxiliary.sitemapFound,
    metrics,
    jsonLdInvalidBlocks: jsonLd.invalidBlocks,
    htmlLang,
  })

  const severityOrder: Record<FindingSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  }

  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  const summary = findings.reduce(
    (acc, finding) => {
      acc[finding.severity] += 1
      return acc
    },
    { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as ScanResult['summary']
  )

  return {
    scanId: randomUUID(),
    url: url.toString(),
    finalUrl: finalUrl.toString(),
    fetchedAt: new Date().toISOString(),
    httpStatus: response.status,
    contentType,
    durationMs: Date.now() - startedAt,
    pageTitle: title,
    metaDescription: description,
    canonical,
    robotsMeta,
    robotsTxt: {
      status: auxiliary.robotsStatus,
      found: auxiliary.robotsFound,
      disallowsRoot: auxiliary.robotsDisallowsRoot,
      sitemapUrls: auxiliary.sitemapUrl ? [auxiliary.sitemapUrl] : [],
    },
    sitemap: {
      url: auxiliary.sitemapUrl,
      status: auxiliary.sitemapStatus,
      found: auxiliary.sitemapFound,
    },
    metrics: {
      ...metrics,
    },
    summary,
    findings,
  }
}
