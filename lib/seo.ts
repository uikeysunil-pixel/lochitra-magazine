import siteMetadata from '@/data/siteMetadata'

/**
 * Resolves an absolute URL given a relative or absolute path.
 */
export function resolveAbsoluteUrl(path: string): string {
  if (path.startsWith('http')) return path
  const basePath = siteMetadata.siteUrl.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${basePath}${normalizedPath}`
}

/**
 * Resolves the primary image for a post (for OG and JSON-LD).
 * Fallback chain: featuredImage -> first image in images array -> social banner
 */
export function resolvePostImage(featuredImage?: string, images?: string | string[]): string {
  let imagePath = siteMetadata.socialBanner

  if (featuredImage) {
    imagePath = featuredImage
  } else if (images) {
    imagePath = typeof images === 'string' ? images : images[0]
  }

  return resolveAbsoluteUrl(imagePath)
}

/**
 * Gets the canonical URL for a specific page path.
 * Enforces trailing slash on internal webpage routes to align with next.config.js trailingSlash: true.
 */
export function getCanonicalUrl(path?: string): string {
  const basePath = siteMetadata.siteUrl.replace(/\/$/, '')
  if (!path || path === '/' || path === '') {
    return `${basePath}/`
  }
  if (path.startsWith('http')) {
    try {
      const urlObj = new URL(path)
      const lastSeg = urlObj.pathname.split('/').pop() || ''
      if (!urlObj.pathname.endsWith('/') && !lastSeg.includes('.')) {
        urlObj.pathname = `${urlObj.pathname}/`
      }
      return urlObj.toString()
    } catch {
      return path.endsWith('/') ? path : `${path}/`
    }
  }
  let normalizedPath = path.startsWith('/') ? path : `/${path}`
  const lastSegment = normalizedPath.split('/').pop() || ''
  if (!normalizedPath.endsWith('/') && !lastSegment.includes('.')) {
    normalizedPath = `${normalizedPath}/`
  }
  return `${basePath}${normalizedPath}`
}

/**
 * Narrow interface representing the minimum date fields required for modification resolution.
 */
export interface ArticleDateFields {
  date: string
  lastmod?: string | null
  lastUpdated?: string | null
  slug?: string
}

/**
 * Validates whether a value is a valid, parseable date string.
 */
function isValidDate(dateStr: unknown): dateStr is string {
  if (typeof dateStr !== 'string' || !dateStr.trim()) return false
  const time = Date.parse(dateStr)
  return !isNaN(time)
}

/**
 * Resolves the effective modification date for an article using strict precedence:
 * 1. post.lastmod, when present and valid.
 * 2. post.lastUpdated, when present and valid.
 * 3. post.date, as the publication-date fallback.
 *
 * Normalizes valid dates to an ISO 8601 string to maintain consistent UTC serialization
 * across sitemap, Open Graph, schema.org, and UI components.
 *
 * Throws a descriptive Error if post.date is also missing or invalid, preventing
 * corrupted date metadata from being published.
 */
export function resolvePostDateModified(post: ArticleDateFields): string {
  if (post.lastmod) {
    if (isValidDate(post.lastmod)) {
      return new Date(post.lastmod).toISOString()
    }
    console.warn(`[Date Resolution] Invalid lastmod date: "${post.lastmod}". Falling back.`)
  }

  if (post.lastUpdated) {
    if (isValidDate(post.lastUpdated)) {
      return new Date(post.lastUpdated).toISOString()
    }
    console.warn(`[Date Resolution] Invalid lastUpdated date: "${post.lastUpdated}". Falling back.`)
  }

  if (isValidDate(post.date)) {
    return new Date(post.date).toISOString()
  }

  const identifier = post.slug ? `Article "${post.slug}"` : 'Article'
  throw new Error(
    `[Date Resolution] ${identifier} has an invalid or unparseable publication date: "${post.date}". Cannot resolve modified date.`
  )
}
