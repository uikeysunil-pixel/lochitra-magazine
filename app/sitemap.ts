import { MetadataRoute } from 'next'
import { allBlogs } from 'contentlayer/generated'
import siteMetadata from '@/data/siteMetadata'
import { CATEGORIES } from '@/data/categoryData'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = siteMetadata.siteUrl

  const blogRoutes = allBlogs
    .filter((post) => !post.draft)
    .map((post) => ({
      url: `${siteUrl}/${post.path}`,
      lastModified: post.lastmod || post.date,
    }))

  const categoryRoutes = CATEGORIES.map((cat) => ({
    url: `${siteUrl}/categories/${cat.slug}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  const routes = [
    '',
    'blog',
    'categories',
    'tags',
    'about',
    'contact',
    'privacy-policy',
    'disclaimer',
    'terms',
    'editorial-policy',
  ].map((route) => ({
    url: `${siteUrl}/${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes, ...categoryRoutes, ...blogRoutes]
}
