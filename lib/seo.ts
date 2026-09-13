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
