const TIMEOUT_MS = 8000
const MAX_BYTES = 1000000
const MAX_SITEMAPS = 10

function decodeXml(value: string): string {
  return value.split('&amp;').join('&').split('&lt;').join('<').split('&gt;').join('>').trim()
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
        const next = new URL(location, current)
        if (next.origin !== url.origin) return null
        current = next
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


export interface RobotsPolicy {
  rules: Array<{ pattern: string; allow: boolean; specificity: number }>
}

export async function loadRobotsPolicy(rootUrl: string): Promise<RobotsPolicy | null> {
  const root = new URL(rootUrl)
  const text = await fetchText(new URL('/robots.txt', root))
  if (!text) return null

  const rules: RobotsPolicy['rules'] = []
  let inLocitraGroup = false
  let inWildcardGroup = false

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim()
    if (!line) {
      inLocitraGroup = false
      inWildcardGroup = false
      continue
    }

    const colon = line.indexOf(':')
    if (colon < 0) continue
    const field = line.slice(0, colon).trim().toLowerCase()
    const value = line.slice(colon + 1).trim()

    if (field === 'user-agent') {
      const agent = value.toLowerCase()
      inLocitraGroup = agent === 'locitrabot'
      inWildcardGroup = agent === '*'
      continue
    }

    if ((inLocitraGroup || inWildcardGroup) && (field === 'allow' || field === 'disallow') && value) {
      rules.push({
        pattern: value,
        allow: field === 'allow',
        specificity: value.replace(/\*/g, '').replace(/\$/, '').length,
      })
    }
  }

  return { rules }
}

function matchesRobotsPattern(pattern: string, path: string): boolean {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\export async function discoverSitemapPages').replace(/\*/g, '.*')
  const source = pattern.endsWith('(rootUrl: string, maxPages: number): Promise<string[]> {
  const root = new URL(rootUrl)
  const sitemapQueue = [
    new URL('/sitemap.xml', root).toString(),
    new URL('/sitemap_index.xml', root).toString(),
  ]
  const visited = new Set<string>()
  const pages = new Set<string>()

  while (sitemapQueue.length && visited.size < MAX_SITEMAPS && pages.size < maxPages) {
    const candidate = sitemapQueue.shift()!
    let sitemapUrl: URL
    try { sitemapUrl = new URL(candidate, root) } catch { continue }
    if (sitemapUrl.origin !== root.origin) continue
    const normalized = sitemapUrl.toString()
    if (visited.has(normalized)) continue
    visited.add(normalized)

    const xml = await fetchText(sitemapUrl)
    if (!xml) continue
    const locs = extractLocs(xml)
    const isIndex = xml.toLowerCase().includes('<sitemapindex')

    for (const loc of locs) {
      let target: URL
      try { target = new URL(loc, root) } catch { continue }
      if (target.origin !== root.origin) continue
      const targetUrl = target.toString()
      if (isIndex || target.pathname.toLowerCase().endsWith('.xml')) {
        if (!visited.has(targetUrl) && sitemapQueue.length < MAX_SITEMAPS * 2) sitemapQueue.push(targetUrl)
      } else {
        pages.add(targetUrl)
      }
      if (pages.size >= maxPages) break
    }
  }

  return [...pages]
}) ? '^' + escaped + '(rootUrl: string, maxPages: number): Promise<string[]> {
  const root = new URL(rootUrl)
  const sitemapQueue = [
    new URL('/sitemap.xml', root).toString(),
    new URL('/sitemap_index.xml', root).toString(),
  ]
  const visited = new Set<string>()
  const pages = new Set<string>()

  while (sitemapQueue.length && visited.size < MAX_SITEMAPS && pages.size < maxPages) {
    const candidate = sitemapQueue.shift()!
    let sitemapUrl: URL
    try { sitemapUrl = new URL(candidate, root) } catch { continue }
    if (sitemapUrl.origin !== root.origin) continue
    const normalized = sitemapUrl.toString()
    if (visited.has(normalized)) continue
    visited.add(normalized)

    const xml = await fetchText(sitemapUrl)
    if (!xml) continue
    const locs = extractLocs(xml)
    const isIndex = xml.toLowerCase().includes('<sitemapindex')

    for (const loc of locs) {
      let target: URL
      try { target = new URL(loc, root) } catch { continue }
      if (target.origin !== root.origin) continue
      const targetUrl = target.toString()
      if (isIndex || target.pathname.toLowerCase().endsWith('.xml')) {
        if (!visited.has(targetUrl) && sitemapQueue.length < MAX_SITEMAPS * 2) sitemapQueue.push(targetUrl)
      } else {
        pages.add(targetUrl)
      }
      if (pages.size >= maxPages) break
    }
  }

  return [...pages]
} : '^' + escaped
  return new RegExp(source).test(path)
}

export function isAllowedByRobots(policy: RobotsPolicy | null, urlValue: string): boolean {
  if (!policy) return true
  const url = new URL(urlValue)
  const target = url.pathname + url.search
  const matches = policy.rules.filter((rule) => matchesRobotsPattern(rule.pattern, target))
  if (!matches.length) return true
  matches.sort((a, b) => b.specificity - a.specificity || Number(b.allow) - Number(a.allow))
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

  while (sitemapQueue.length && visited.size < MAX_SITEMAPS && pages.size < maxPages) {
    const candidate = sitemapQueue.shift()!
    let sitemapUrl: URL
    try { sitemapUrl = new URL(candidate, root) } catch { continue }
    if (sitemapUrl.origin !== root.origin) continue
    const normalized = sitemapUrl.toString()
    if (visited.has(normalized)) continue
    visited.add(normalized)

    const xml = await fetchText(sitemapUrl)
    if (!xml) continue
    const locs = extractLocs(xml)
    const isIndex = xml.toLowerCase().includes('<sitemapindex')

    for (const loc of locs) {
      let target: URL
      try { target = new URL(loc, root) } catch { continue }
      if (target.origin !== root.origin) continue
      const targetUrl = target.toString()
      if (isIndex || target.pathname.toLowerCase().endsWith('.xml')) {
        if (!visited.has(targetUrl) && sitemapQueue.length < MAX_SITEMAPS * 2) sitemapQueue.push(targetUrl)
      } else {
        pages.add(targetUrl)
      }
      if (pages.size >= maxPages) break
    }
  }

  return [...pages]
}