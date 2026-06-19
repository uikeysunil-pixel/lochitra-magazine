import { ReactNode } from 'react'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog, Authors } from 'contentlayer/generated'
import Comments from '@/components/Comments'
import Link from '@/components/Link'
import SectionContainer from '@/components/SectionContainer'
import NextImage from 'next/image'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import ScrollTopAndComment from '@/components/ScrollTopAndComment'
import { CATEGORY_MAP, CATEGORY_BADGE_CLASSES } from '@/data/categoryData'
import AuthorCard from '@/components/AuthorCard'
import TableOfContents, { DesktopToc } from '@/components/TableOfContents'
import ShareBar from '@/components/ShareBar'
import ArticleCard from '@/components/ArticleCard'
import ArticleNewsletterBox from '@/components/ArticleNewsletterBox'

const postDateTemplate: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

interface RelatedPost {
  slug: string
  path: string
  title: string
  summary?: string
  date: string
  readingTime?: { text: string }
  featuredImage?: string
  category?: string
}

interface LayoutProps {
  content: CoreContent<Blog>
  authorDetails: CoreContent<Authors>[]
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
  relatedPosts?: RelatedPost[]
  children: ReactNode
}

export default function PostLayout({
  content,
  authorDetails,
  next,
  prev,
  relatedPosts = [],
  children,
}: LayoutProps) {
  const { path, slug, date, lastmod, title, tags, featuredImage, category, readingTime, toc } =
    content

  const cat = category ? CATEGORY_MAP[category] : undefined
  const catBadgeClass = cat
    ? CATEGORY_BADGE_CLASSES[cat.color]
    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'

  const primaryAuthor = authorDetails[0]
  const articleUrl = `${siteMetadata.siteUrl}/blog/${slug}`

  // Only render TOC when there are 2+ H2 headings
  const hasToc = Array.isArray(toc) && toc.filter((t) => t.depth === 2).length >= 2

  return (
    <SectionContainer>
      <ScrollTopAndComment />
      <article>
        {/* ── Premium Article Header ──────────────────────────────────── */}
        <header className="pt-8 pb-10">
          {/* Category badge */}
          {cat && (
            <div className="mb-5">
              <Link
                href={`/categories/${cat.slug}`}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-80 ${catBadgeClass}`}
              >
                <span aria-hidden="true">{cat.icon}</span>
                {cat.name}
              </Link>
            </div>
          )}

          {/* Article title */}
          <h1 className="mb-6 text-3xl leading-tight font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl dark:text-gray-100">
            {title}
          </h1>

          {/* Meta row: author + date + reading time + updated date + editorial badge */}
          <div className="mb-6 flex flex-wrap items-start gap-x-0 gap-y-4 sm:gap-x-6">
            {/* Author block */}
            {primaryAuthor && (
              <div className="flex items-center gap-3">
                {primaryAuthor.avatar && (
                  <div className="ring-primary-200 dark:ring-primary-800 relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full ring-2">
                    <NextImage
                      src={primaryAuthor.avatar}
                      alt={primaryAuthor.name}
                      fill
                      sizes="44px"
                      className="object-cover object-top"
                    />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {primaryAuthor.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {primaryAuthor.occupation || 'Founder & Editor, Locitra'}
                  </p>
                </div>
              </div>
            )}

            {/* Divider — vertical on sm+ */}
            <div
              className="hidden h-10 w-px bg-gray-200 sm:block dark:bg-gray-700"
              aria-hidden="true"
            />

            {/* Date + reading time + updated + editorial */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
              {/* Published date */}
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-3.5 w-3.5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <time dateTime={date}>
                  {new Date(date).toLocaleDateString(siteMetadata.locale, postDateTemplate)}
                </time>
              </span>

              {/* Reading time */}
              {readingTime?.text && (
                <>
                  <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">
                    ·
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="h-3.5 w-3.5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {readingTime.text}
                  </span>
                </>
              )}

              {/* Updated date — shown only when different from publish date */}
              {lastmod && lastmod !== date && (
                <>
                  <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">
                    ·
                  </span>
                  <span className="flex items-center gap-1.5 text-xs">
                    <svg
                      className="h-3.5 w-3.5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Updated{' '}
                    {new Date(lastmod).toLocaleDateString(siteMetadata.locale, postDateTemplate)}
                  </span>
                </>
              )}

              {/* Editorial review badge */}
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300"
                title="This article has been reviewed by our editorial team"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Reviewed by Locitra Editorial Team
              </span>
            </div>
          </div>

          {/* Short excerpt — appears between meta and image */}
          {content.summary && (
            <p className="mb-6 text-base leading-relaxed text-gray-500 sm:text-lg dark:text-gray-400">
              {content.summary}
            </p>
          )}

          {/* Featured image — reduced dominance, appears after title/meta/excerpt */}
          {featuredImage && (
            <div className="relative mb-2 aspect-[16/7] w-full overflow-hidden rounded-2xl shadow-lg">
              <NextImage
                src={featuredImage}
                alt={title}
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover object-center"
              />
            </div>
          )}
        </header>

        {/* ── Article Body ──────────────────────────────────────────────── */}
        {/*
         * Layout: [Article Content ~72%] [TOC Sidebar ~28%]
         * Uses flex so the article column grows naturally.
         * TOC aside is fixed at 240px, hidden on mobile.
         */}
        <div className={hasToc ? 'lg:flex lg:items-start lg:gap-12' : ''}>
          {/* ── Main content column ─────────────────────────────────────── */}
          <div className="min-w-0 flex-1">
            {/* Mobile TOC accordion — auto-hidden on lg+ by its own lg:hidden */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {hasToc && <TableOfContents toc={toc as any} />}

            {/* Article body */}
            <div className="article-prose prose dark:prose-invert max-w-none">{children}</div>

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="mt-12 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500">
                  Topics:
                </span>
                {tags.map((tag) => (
                  <Tag key={tag} text={tag} />
                ))}
              </div>
            )}

            {/* Share bar */}
            <ShareBar url={articleUrl} title={title} />

            {/* ── Premium Newsletter CTA ────────────────────────────────── */}
            <ArticleNewsletterBox />

            {/* Author Card */}
            {primaryAuthor && (
              <AuthorCard
                name={primaryAuthor.name}
                avatar={primaryAuthor.avatar}
                occupation={primaryAuthor.occupation || 'Founder & Editor, Locitra'}
                email={primaryAuthor.email}
                twitter={primaryAuthor.twitter}
                linkedin={primaryAuthor.linkedin}
              />
            )}

            {/* Comments */}
            {siteMetadata.comments && (
              <div className="pt-6 pb-6 text-center text-gray-700 dark:text-gray-300" id="comment">
                <Comments slug={slug} />
              </div>
            )}
          </div>

          {/* ── Desktop TOC sidebar — 25% width, hidden on mobile ──────── */}
          {hasToc && (
            <aside className="hidden w-[25%] max-w-[280px] min-w-[200px] shrink-0 lg:block">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <DesktopToc toc={toc as any} />
            </aside>
          )}
        </div>

        {/* ── Related Articles — Magazine-style cards ───────────────────── */}
        {relatedPosts.length > 0 && (
          <section className="mt-20 border-t border-gray-100 pt-14 dark:border-gray-800">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="mb-1 text-[11px] font-bold tracking-[0.14em] text-gray-400 uppercase dark:text-gray-500">
                  Keep Reading
                </p>
                <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                  Related Articles
                </h2>
              </div>
              <Link
                href="/blog"
                className="text-primary-600 dark:text-primary-400 hidden text-sm font-semibold transition-colors hover:underline sm:block"
              >
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 [&_article]:flex [&_article]:h-full [&_article]:flex-col">
              {relatedPosts.slice(0, 3).map((post) => (
                <ArticleCard
                  key={post.slug}
                  slug={post.slug}
                  path={post.path}
                  title={post.title}
                  summary={post.summary}
                  date={post.date}
                  readingTime={post.readingTime}
                  featuredImage={post.featuredImage}
                  category={post.category}
                  size="large"
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Prev / Next navigation ────────────────────────────────────── */}
        {(next || prev) && (
          <nav
            aria-label="Article navigation"
            className="mt-14 grid grid-cols-1 gap-4 border-t border-gray-100 pt-8 sm:grid-cols-2 dark:border-gray-800"
          >
            {prev && prev.path && (
              <Link
                href={`/${prev.path}`}
                className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-800"
              >
                <span className="text-primary-600 dark:text-primary-400 mb-1.5 text-xs font-bold tracking-wide uppercase">
                  ← Previous
                </span>
                <span className="text-sm leading-snug font-medium text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-gray-100">
                  {prev.title}
                </span>
              </Link>
            )}
            {next && next.path && (
              <Link
                href={`/${next.path}`}
                className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 text-right transition-all hover:border-blue-200 hover:shadow-md sm:col-start-2 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-800"
              >
                <span className="text-primary-600 dark:text-primary-400 mb-1.5 text-xs font-bold tracking-wide uppercase">
                  Next →
                </span>
                <span className="text-sm leading-snug font-medium text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-gray-100">
                  {next.title}
                </span>
              </Link>
            )}
          </nav>
        )}

        {/* ── Back to blog ──────────────────────────────────────────────── */}
        <div className="mt-8 pb-10">
          <Link
            href="/blog"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
            aria-label="Back to all articles"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to all articles
          </Link>
        </div>
      </article>
    </SectionContainer>
  )
}
