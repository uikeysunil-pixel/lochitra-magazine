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
 * Gets the canonical URL for a specific path.
 */
export function getCanonicalUrl(path?: string): string {
  if (!path) return siteMetadata.siteUrl
  return resolveAbsoluteUrl(path)
}
