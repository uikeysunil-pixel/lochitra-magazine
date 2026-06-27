import 'css/prism.css'
import 'katex/dist/katex.css'

import PageTitle from '@/components/PageTitle'
import { components } from '@/components/MDXComponents'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { sortPosts, coreContent, allCoreContent } from 'pliny/utils/contentlayer'
import { allBlogs, allAuthors } from 'contentlayer/generated'
import type { Authors, Blog } from 'contentlayer/generated'
import PostSimple from '@/layouts/PostSimple'
import PostLayout from '@/layouts/PostLayout'
import PostBanner from '@/layouts/PostBanner'
import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'
import { notFound } from 'next/navigation'
import { resolvePostImage } from '@/lib/seo'
import { buildBlogPosting, buildReview, buildSoftwareApplication, buildGraph } from '@/lib/schema'
import { calculateRelatedArticles } from '@/lib/related'

const defaultLayout = 'PostLayout'
const layouts = {
  PostSimple,
  PostLayout,
  PostBanner,
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata | undefined> {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))
  const post = allBlogs.find((p) => p.slug === slug)
  const authorList = post?.authors || ['default']
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author)
    return coreContent(authorResults as Authors)
  })
  if (!post) {
    return
  }

  const publishedAt = new Date(post.date).toISOString()
  const modifiedAt = new Date(post.lastmod || post.date).toISOString()
  const authors = authorDetails.map((author) => author.name)

  // Build OG image list using shared SEO helper
  const postImageUrl = resolvePostImage(post.featuredImage, post.images)
  const ogImages = [
    {
      url: postImageUrl,
      width: 1200,
      height: 630,
      alt: post.title,
    },
  ]

  return {
    title: post.title,
    description: post.summary,
    alternates: {
      canonical: `${siteMetadata.siteUrl}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.summary,
      siteName: 'Locitra',
      locale: 'en_US',
      type: 'article',
      publishedTime: publishedAt,
      modifiedTime: modifiedAt,
      url: `${siteMetadata.siteUrl}/blog/${post.slug}`,
      images: ogImages,
      authors: authors.length > 0 ? authors : [siteMetadata.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: ogImages.map((img) => img.url),
    },
  }
}

export const generateStaticParams = async () => {
  return allBlogs.map((p) => ({ slug: p.slug.split('/').map((name) => decodeURI(name)) }))
}

export default async function Page(props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))
  // Filter out drafts in production
  const sortedCoreContents = allCoreContent(sortPosts(allBlogs))
  const postIndex = sortedCoreContents.findIndex((p) => p.slug === slug)
  if (postIndex === -1) {
    return notFound()
  }

  const prev = sortedCoreContents[postIndex + 1]
  const next = sortedCoreContents[postIndex - 1]
  const post = allBlogs.find((p) => p.slug === slug) as Blog
  const authorList = post?.authors || ['default']
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author)
    return authorResults as Authors
  })
  const mainContent = coreContent(post)
  const blogPostingSchema = buildBlogPosting(post, authorDetails)
  const reviewSchema = buildReview(post, authorDetails)
  const softwareSchema = post.review ? buildSoftwareApplication(post.review, post.slug) : undefined
  const jsonLd =
    reviewSchema && softwareSchema
      ? buildGraph([blogPostingSchema, reviewSchema, softwareSchema])
      : blogPostingSchema

  // Related posts using the Recommendation Engine 2.0
  const relatedPosts = calculateRelatedArticles(post, sortedCoreContents)

  const Layout = layouts[post.layout || defaultLayout]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Layout
        content={mainContent}
        authorDetails={authorDetails}
        next={next}
        prev={prev}
        relatedPosts={relatedPosts}
      >
        <MDXLayoutRenderer code={post.body.code} components={components} toc={post.toc} />
      </Layout>
    </>
  )
}
