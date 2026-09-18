const TIMEOUT_MS = 8000
const MAX_BYTES = 1000000
const MAX_SITEMAPS = 10

export interface RobotsPolicy {
  rules: Array<{ pattern: string; allow: boolean; specificity: number }>
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim()
}

function extractLocs(xml: string): string[] {
  const values: string[] = []
  const regex = /<loc\b[^>]*>([\s\S]*?)<\/loc>/gi
  for (const match of xml.matchAll(regex)) values.push(decodeXml(match[1]))
  return values.filter(Boolean)
}

async function fetchText(url: URL): Promise<string | null> {
  let current = new URL(url)

  for (let redirects = 0; redirects <= 3; redirects += 1) {
    if (current.origin !== url.origin) return null

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const response = await fetch(current, {
        redirect: 'manual',
        headers: {
          'user-agent': 'LocitraBot/0.1 (+https://www.locitra.com/technical-seo/)',
          accept: 'application/xml,text/xml,text/plain,*/*;q=0.5',
        },
        signal: controller.signal,
      })

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location')
        if (!location) return null
        current = new URL(location, current)
        continue
      }

      if (!response.ok) return null

      const length = Number(response.headers.get('content-length') || 0)
      if (length > MAX_BYTES) return null

      const body = await response.arrayBuffer()
      if (body.byteLength > MAX_BYTES) return null

      return new TextDecoder().decode(body)
    } catch {
      return null
    } finally {
      clearTimeout(timeout)
    }
  }

  return null
}

export async function loadRobotsPolicy(rootUrl: string): Promise<RobotsPolicy | null> {
  const root = new URL(rootUrl)
  const robots = await fetchText(new URL('/robots.txt', root))
  if (!robots) return null

  const rules: RobotsPolicy['rules'] = []
  let activeGroup: 'locitra' | 'wildcard' | null = null

  for (const rawLine of robots.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim()
    if (!line) {
      activeGroup = null
      continue
    }

    const separator = line.indexOf(':')
    if (separator < 0) continue

    const field = line.slice(0, separator).trim().toLowerCase()
    const value = line.slice(separator + 1).trim()

    if (field === 'user-agent') {
      const agent = value.toLowerCase()
      activeGroup = agent === 'locitrabot' ? 'locitra' : agent === '*' ? 'wildcard' : null
      continue
    }

    if (activeGroup && (field === 'allow' || field === 'disallow') && value) {
      rules.push({
        pattern: value,
        allow: field === 'allow',
        specificity: value.replace(/\*/g, '').replace(/\$$/, '').length,
      })
    }
  }

  return { rules }
}

function escapeRegex(value: string): string {
  let output = ''
  for (const char of value) {
    output += '.+?^$()[]{}|\\'.includes(char) ? '\\' + char : char
  }
  return output
}

function matchesRobotsPattern(pattern: string, path: string): boolean {
  const hasEndAnchor = pattern.endsWith('$')
  const rawPattern = hasEndAnchor ? pattern.slice(0, -1) : pattern
  const source = '^' + escapeRegex(rawPattern).replace(/\*/g, '.*') + (hasEndAnchor ? '$' : '')
  return new RegExp(source).test(path)
}

export function isAllowedByRobots(policy: RobotsPolicy | null, urlValue: string): boolean {
  if (!policy) return true

  const url = new URL(urlValue)
  const target = url.pathname + url.search
  const matches = policy.rules.filter((rule) => matchesRobotsPattern(rule.pattern, target))

  if (!matches.length) return true

  matches.sort((a, b) => {
    if (a.specificity !== b.specificity) return b.specificity - a.specificity
    if (a.allow !== b.allow) return a.allow ? -1 : 1
    return 0
  })

  return matches[0].allow
}

export async function discoverSitemapPages(rootUrl: string, maxPages: number): Promise<string[]> {
  const root = new URL(rootUrl)
  const sitemapQueue = [
    new URL('/sitemap.xml', root).toString(),
    new URL('/sitemap_index.xml', root).toString(),
  ]
  const visited = new Set<string>()
  const pages = new Set<string>()

  const robotsText = await fetchText(new URL('/robots.txt', root))
  if (robotsText) {
    for (const match of robotsText.matchAll(/(?:^|\n)\s*sitemap\s*:\s*([^\s#]+)/gi)) {
      sitemapQueue.push(decodeXml(match[1]))
    }
  }

  while (sitemapQueue.length && visited.size < MAX_SITEMAPS && pages.size < maxPages) {
    const candidate = sitemapQueue.shift()!
    let sitemapUrl: URL
    try {
      sitemapUrl = new URL(candidate, root)
    } catch {
      continue
    }

    if (sitemapUrl.origin !== root.origin) continue

    const normalized = sitemapUrl.toString()
    if (visited.has(normalized)) continue
    visited.add(normalized)

    const xml = await fetchText(sitemapUrl)
    if (!xml) continue

    const locs = extractLocs(xml)
    const isIndex = /<sitemapindex\b/i.test(xml)

    for (const loc of locs) {
      let target: URL
      try {
        target = new URL(loc, root)
      } catch {
        continue
      }

      if (target.origin !== root.origin || !['http:', 'https:'].includes(target.protocol)) continue

      const targetUrl = target.toString()
      if (isIndex || target.pathname.toLowerCase().endsWith('.xml')) {
        if (!visited.has(targetUrl) && visited.size + sitemapQueue.length < MAX_SITEMAPS * 3) {
          sitemapQueue.push(targetUrl)
        }
        continue
      }

      pages.add(targetUrl)
      if (pages.size >= maxPages) break
    }
  }

  return [...pages]
}