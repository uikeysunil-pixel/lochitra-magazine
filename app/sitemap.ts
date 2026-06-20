import { MetadataRoute } from 'next'
import { allBlogs } from 'contentlayer/generated'
import siteMetadata from '@/data/siteMetadata'
import { CATEGORIES } from '@/data/categoryData'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = siteMetadata.siteUrl
  const today = new Date().toISOString().split('T')[0]

  // ── Blog post routes — high priority, weekly updates ─────────────────────
  const blogRoutes = allBlogs
    .filter((post) => !post.draft)
    .map((post) => ({
      url: `${siteUrl}/${post.path}`,
      lastModified: post.lastmod || post.date,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  // ── Category hub pages ────────────────────────────────────────────────────
  const categoryRoutes = CATEGORIES.map((cat) => ({
    url: `${siteUrl}/categories/${cat.slug}`,
    lastModified: today,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // ── Static pages ──────────────────────────────────────────────────────────
  const staticRoutes: Array<{
    route: string
    priority: number
    changeFreq: 'daily' | 'weekly' | 'monthly'
  }> = [
    { route: '', priority: 1.0, changeFreq: 'daily' },
    { route: 'blog', priority: 0.9, changeFreq: 'daily' },
    { route: 'newsletter', priority: 0.8, changeFreq: 'weekly' },
    { route: 'categories', priority: 0.7, changeFreq: 'weekly' },
    { route: 'about', priority: 0.7, changeFreq: 'monthly' },
    { route: 'contact', priority: 0.5, changeFreq: 'monthly' },
    { route: 'privacy-policy', priority: 0.3, changeFreq: 'monthly' },
    { route: 'disclaimer', priority: 0.3, changeFreq: 'monthly' },
    { route: 'terms', priority: 0.3, changeFreq: 'monthly' },
    { route: 'editorial-policy', priority: 0.4, changeFreq: 'monthly' },
  ]

  const routes = staticRoutes.map(({ route, priority, changeFreq }) => ({
    url: `${siteUrl}/${route}`,
    lastModified: today,
    changeFrequency: changeFreq as MetadataRoute.Sitemap[number]['changeFrequency'],
    priority,
  }))

  return [...routes, ...categoryRoutes, ...blogRoutes]
}
