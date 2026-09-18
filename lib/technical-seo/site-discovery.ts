const TIMEOUT_MS = 8000
const MAX_BYTES = 1000000
const MAX_SITEMAPS = 10

function decodeXml(value: string): string {
  return value.split('&amp;').join('&').split('&lt;').join('<').split('&gt;').join('>').trim()
}

function extractLocs(xml: string): string[] {
  const values: string[] = []
  const regex = /<loc\\b[^>]*>([\\s\\S]*?)<\\/loc>/gi
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