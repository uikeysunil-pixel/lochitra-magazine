import Image from 'next/image'
import Link from '@/components/Link'
import { formatDate } from 'pliny/utils/formatDate'
import siteMetadata from '@/data/siteMetadata'
import {
  CATEGORY_MAP,
  CATEGORY_BADGE_CLASSES,
  CATEGORY_GRADIENT_CLASSES,
} from '@/data/categoryData'

interface ArticleCardProps {
  slug: string
  path: string
  title: string
  summary?: string
  date: string
  readingTime?: { text: string }
  featuredImage?: string
  category?: string
  tags?: string[]
  /** Visual size variant */
  size?: 'default' | 'large'
}

/**
 * Reusable article card with:
 *  - Featured image (with category-gradient placeholder fallback)
 *  - Category badge
 *  - Title (linked)
 *  - Summary (2-line clamp)
 *  - Read time + Publish date
 *
 * Used by: homepage (Featured Stories, Trending), CategoryListLayout
 */
export default function ArticleCard({
  slug,
  path,
  title,
  summary,
  date,
  readingTime,
  featuredImage,
  category,
  size = 'default',
}: ArticleCardProps) {
  const cat = category ? CATEGORY_MAP[category] : undefined
  const badgeClass = cat
    ? CATEGORY_BADGE_CLASSES[cat.color]
    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
  const gradientClass = cat
    ? CATEGORY_GRADIENT_CLASSES[cat.color]
    : 'from-primary-600 to-primary-800'

  // Consistent image heights — large variant gets more height for visual punch
  const imageHeight = size === 'large' ? 'h-52 sm:h-56' : 'h-44 sm:h-48'

  return (
    <article className="group hover:border-primary-200 dark:hover:border-primary-800 flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
      {/* Image / Placeholder */}
      <Link href={`/${path}`} className="block flex-shrink-0" tabIndex={-1} aria-hidden="true">
        <div className={`relative w-full overflow-hidden ${imageHeight}`}>
          {featuredImage ? (
            <Image
              src={featuredImage}
              alt={title}
              fill
              loading="lazy"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />
          ) : cat ? (
            /* Branded category SVG illustration — /public/static/images/categories/{slug}.svg */
            <Image
              src={`/static/images/categories/${cat.slug}.svg`}
              alt={`${cat.name} category illustration`}
              fill
              loading="lazy"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
          ) : (
            /* Fallback gradient for uncategorised articles */
            <div
              className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientClass}`}
              aria-hidden="true"
            >
              <span className="text-4xl opacity-80" role="img" aria-label="Article">
                📄
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Category badge */}
        {cat && (
          <div className="mb-3">
            <Link
              href={`/categories/${cat.slug}`}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-opacity hover:opacity-80 ${badgeClass}`}
            >
              <span aria-hidden="true">{cat.icon}</span>
              {cat.name}
            </Link>
          </div>
        )}

        {/* Title */}
        <h3
          className={`mb-2 leading-snug font-bold text-gray-900 dark:text-gray-100 ${
            size === 'large' ? 'text-lg sm:text-xl' : 'text-base'
          }`}
        >
          <Link
            href={`/${path}`}
            className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            {title}
          </Link>
        </h3>

        {/* Summary */}
        {summary && (
          <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {summary}
          </p>
        )}

        {/* Meta row — always at the bottom */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
          <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
          <span className="inline-flex items-center gap-1">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {readingTime?.text ?? '5 min read'}
          </span>
        </div>
      </div>
    </article>
  )
}
