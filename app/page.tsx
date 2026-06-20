import { sortPosts, allCoreContent } from 'pliny/utils/contentlayer'
import { allBlogs } from 'contentlayer/generated'
import Main from './Main'
import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'
import { CATEGORIES } from '@/data/categoryData'

// ── Homepage-specific metadata ────────────────────────────────────────────────
// Explicit generateMetadata pins the exact title & description for the homepage.
// This eliminates the path where the homepage could inherit layout.tsx's fallback.
// NEXT_PUBLIC_SITE_URL takes precedence over siteMetadata.siteUrl (Vercel-friendly).
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || siteMetadata.siteUrl.replace(/\/$/, '')

const HOMEPAGE_TITLE = 'Locitra - AI Tools, Technology & Online Income Blog'
const HOMEPAGE_DESCRIPTION =
  'Explore Locitra for expert guides on AI tools, technology trends, online income strategies, career growth tips, and real success stories from digital creators.'

export const metadata: Metadata = {
  title: HOMEPAGE_TITLE,
  description: HOMEPAGE_DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
    types: { 'application/rss+xml': `${SITE_URL}/feed.xml` },
  },
  openGraph: {
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESCRIPTION,
    url: SITE_URL,
    siteName: 'Locitra',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESCRIPTION,
  },
}

export default async function Page() {
  const sortedPosts = sortPosts(allBlogs)
  const publishedPosts = sortedPosts.filter((p) => !p.draft)
  const posts = allCoreContent(publishedPosts)
  const postCount = publishedPosts.length
  const categoryCount = Object.keys(CATEGORIES).length
  return <Main posts={posts} postCount={postCount} categoryCount={categoryCount} />
}
