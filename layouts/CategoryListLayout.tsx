'use client'

import { usePathname } from 'next/navigation'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Link from '@/components/Link'
import ArticleCard from '@/components/ArticleCard'
import {
  type Category,
  CATEGORY_BADGE_CLASSES,
  CATEGORY_GRADIENT_CLASSES,
} from '@/data/categoryData'

interface PaginationProps {
  totalPages: number
  currentPage: number
}

interface CategoryListLayoutProps {
  posts: CoreContent<Blog>[]
  category: Category
  initialDisplayPosts?: CoreContent<Blog>[]
  pagination?: PaginationProps
}

function Pagination({ totalPages, currentPage }: PaginationProps) {
  const pathname = usePathname()
  const basePath = pathname
    .replace(/^\//, '')
    .replace(/\/page\/\d+\/?$/, '')
    .replace(/\/$/, '')
  const prevPage = currentPage - 1 > 0
  const nextPage = currentPage + 1 <= totalPages

  return (
    <nav
      className="mt-10 flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-800"
      aria-label="Pagination"
    >
      {prevPage ? (
        <Link
          href={currentPage - 1 === 1 ? `/${basePath}/` : `/${basePath}/page/${currentPage - 1}`}
          rel="prev"
          className="hover:border-primary-300 hover:text-primary-600 dark:hover:border-primary-700 dark:hover:text-primary-400 inline-flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors dark:border-gray-700 dark:text-gray-300"
        >
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-gray-500 dark:text-gray-400">
        Page {currentPage} of {totalPages}
      </span>
      {nextPage ? (
        <Link
          href={`/${basePath}/page/${currentPage + 1}`}
          rel="next"
          className="hover:border-primary-300 hover:text-primary-600 dark:hover:border-primary-700 dark:hover:text-primary-400 inline-flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors dark:border-gray-700 dark:text-gray-300"
        >
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}

export default function CategoryListLayout({
  posts,
  category,
  initialDisplayPosts = [],
  pagination,
}: CategoryListLayoutProps) {
  const displayPosts = initialDisplayPosts.length > 0 ? initialDisplayPosts : posts
  const badgeClass = CATEGORY_BADGE_CLASSES[category.color]
  const gradientClass = CATEGORY_GRADIENT_CLASSES[category.color]

  return (
    <div>
      {/* ── Category Hero Header ─────────────────────────────────── */}
      <header className="border-b border-gray-100 py-12 dark:border-gray-800">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          {/* Icon circle */}
          <div
            className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl shadow-md ${gradientClass}`}
            aria-hidden="true"
          >
            {category.icon}
          </div>

          <div className="flex-1">
            {/* Breadcrumb */}
            <nav className="mb-2 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <Link
                href="/"
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <Link
                href="/categories"
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Categories
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-gray-600 dark:text-gray-300">{category.name}</span>
            </nav>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl dark:text-gray-100">
                {category.name}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${badgeClass}`}
              >
                {posts.length} {posts.length === 1 ? 'article' : 'articles'}
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-base leading-relaxed text-gray-500 dark:text-gray-400">
              {category.seoDescription}
            </p>
          </div>
        </div>
      </header>

      {/* ── Article Grid ─────────────────────────────────────────── */}
      {displayPosts.length > 0 ? (
        <section className="py-10">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayPosts.map((post) => (
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
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
          )}
        </section>
      ) : (
        <div className="py-20 text-center">
          <p className="text-lg text-gray-500 dark:text-gray-400">
            No articles in this category yet. Check back soon.
          </p>
          <Link
            href="/blog"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 mt-4 inline-block text-sm font-medium"
          >
            Browse all articles →
          </Link>
        </div>
      )}
    </div>
  )
}
