import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'
import ArticleCard from '@/components/ArticleCard'
import { CATEGORIES, CATEGORY_MAP, CATEGORY_BADGE_CLASSES } from '@/data/categoryData'
import { EDITORS_PICKS_SLUGS } from '@/data/editorsPicks'
import Image from 'next/image'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'

const MAX_LATEST = 6

// ── Trust panel stats (injected from page.tsx at build time) ─────────────────
function getTrustStats(postCount: number, categoryCount: number) {
  return [
    {
      id: 'articles',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      label: `${postCount}+ Articles`,
      sub: 'Published',
    },
    {
      id: 'categories',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
      label: `${categoryCount} Categories`,
      sub: 'Covered',
    },
    {
      id: 'updated',
      icon: (
        <svg
          className="h-5 w-5"
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
      ),
      label: 'Weekly',
      sub: 'Updated',
    },
    {
      id: 'resources',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
          />
        </svg>
      ),
      label: 'Free',
      sub: 'Resources',
    },
    {
      id: 'guides',
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      label: 'Expert',
      sub: 'Guides',
    },
  ]
}

// ── Topic bar items ──────────────────────────────────────────────────────────
const TOPICS = [
  { slug: 'ai-tools', label: 'AI Tools', icon: '🤖' },
  { slug: 'technology', label: 'Technology', icon: '💻' },
  { slug: 'software-reviews', label: 'Software Reviews', icon: '🛠️' },
  { slug: 'online-income', label: 'Online Income', icon: '💰' },
  { slug: 'career-growth', label: 'Career Growth', icon: '📈' },
  { slug: 'success-stories', label: 'Success Stories', icon: '⭐' },
]

export default function Home({
  posts,
  postCount,
  categoryCount,
}: {
  posts: CoreContent<Blog>[]
  postCount: number
  categoryCount: number
}) {
  const heroPost = posts[0]
  const featuredPosts = posts.slice(1, 4)
  // Trending: top 3 by date (future: filter by `trending: true` frontmatter)
  const trendingPosts = posts.slice(0, 3)
  const latestPosts = posts.slice(4, 4 + MAX_LATEST)

  // Editor's Picks — resolve slugs to full post objects (maintain curation order)
  const editorsPicks = EDITORS_PICKS_SLUGS.map((slug) => posts.find((p) => p.slug === slug)).filter(
    (p): p is CoreContent<Blog> => !!p
  )

  const heroCat = heroPost?.category ? CATEGORY_MAP[heroPost.category] : undefined
  const heroBadgeClass = heroCat
    ? CATEGORY_BADGE_CLASSES[heroCat.color]
    : 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'

  return (
    <div>
      {/* ── Page-level H1 (screen-reader only) ───────────────────────────── */}
      {/* Required for SEO: guarantees exactly one H1 regardless of post state. */}
      {/* Invisible to sighted users — zero visual impact. */}
      <h1 className="sr-only">Locitra — AI Tools, Technology &amp; Online Income Blog</h1>

      {/* ── Hero Section ──────────────────────────────────────────── */}
      {heroPost && (
        <section className="border-b border-gray-100 pt-10 pb-10 dark:border-gray-800">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-5 lg:gap-10">
            {/* ── Left: Article content ────────────────────────────── */}
            <article className="flex flex-col justify-center lg:col-span-3">
              {/* Category badge + tags */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {heroCat && (
                  <Link
                    href={`/categories/${heroCat.slug}`}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-opacity hover:opacity-80 ${heroBadgeClass}`}
                  >
                    <span aria-hidden="true">{heroCat.icon}</span>
                    {heroCat.name}
                  </Link>
                )}
                {heroPost.tags?.slice(0, 2).map((tag) => (
                  <Tag key={tag} text={tag} />
                ))}
              </div>

              <h2 className="mb-4 text-3xl leading-tight font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl dark:text-gray-100">
                <Link
                  href={`/blog/${heroPost.slug}`}
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {heroPost.title}
                </Link>
              </h2>

              <p className="mb-5 text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                {heroPost.summary}
              </p>

              <div className="mb-7 flex items-center gap-3 text-sm text-gray-400 dark:text-gray-500">
                <time dateTime={heroPost.date}>
                  {formatDate(heroPost.date, siteMetadata.locale)}
                </time>
                <span aria-hidden="true">·</span>
                <span>{heroPost.readingTime?.text ?? '5 min read'}</span>
              </div>

              <div>
                <Link
                  href={`/blog/${heroPost.slug}`}
                  className="bg-primary-600 hover:bg-primary-700 focus-visible:ring-primary-500 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all focus-visible:ring-2 focus-visible:ring-offset-2"
                  aria-label={`Read article: ${heroPost.title}`}
                >
                  Read Article
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
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              </div>
            </article>

            {/* ── Right: Featured image ─────────────────────────────── */}
            <aside className="lg:col-span-2">
              <Link
                href={`/blog/${heroPost.slug}`}
                className="group block"
                tabIndex={-1}
                aria-hidden="true"
              >
                {/* Fixed: aspect-[16/10] gives more vertical space, object-position center
                    shows the important parts of the image. Shadow and ring for polish. */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl shadow-xl ring-1 ring-gray-900/5 sm:aspect-[4/3] lg:aspect-[16/11] dark:ring-white/10">
                  {heroPost.featuredImage ? (
                    <Image
                      src={heroPost.featuredImage}
                      alt={heroPost.title}
                      fill
                      priority
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 45vw"
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : heroCat ? (
                    <Image
                      src={`/static/images/categories/${heroCat.slug}.svg`}
                      alt={`${heroCat.name} category`}
                      fill
                      priority
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 45vw"
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="from-primary-600 flex h-full w-full items-center justify-center bg-gradient-to-br to-cyan-500">
                      <span className="text-6xl opacity-80" aria-hidden="true">
                        📰
                      </span>
                    </div>
                  )}
                  {/* Magazine overlay badge */}
                  <div className="absolute bottom-4 left-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                      <svg
                        className="text-primary-400 h-3 w-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Featured Story
                    </span>
                  </div>
                </div>
              </Link>
            </aside>
          </div>
        </section>
      )}

      {/* ── Premium Trust Panel ───────────────────────────────────── */}
      <section
        aria-label="Locitra credibility statistics"
        className="border-b border-gray-100 py-6 dark:border-gray-800"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {getTrustStats(postCount, categoryCount).map((stat) => (
            <div
              key={stat.id}
              className="from-primary-50 dark:from-primary-950/40 flex flex-col items-center rounded-xl border border-blue-100/80 bg-gradient-to-br to-cyan-50 px-3 py-4 text-center transition-shadow hover:shadow-md dark:border-blue-900/30 dark:to-cyan-950/30"
            >
              <span className="text-primary-600 dark:text-primary-400 mb-2">{stat.icon}</span>
              <span className="text-primary-700 dark:text-primary-300 text-sm leading-tight font-bold">
                {stat.label}
              </span>
              <span className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{stat.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Author Identity ───────────────────────────────────────── */}
      <section
        aria-label="About the author"
        className="border-b border-gray-100 py-7 dark:border-gray-800"
      >
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="ring-primary-200 dark:ring-primary-800 relative h-16 w-16 overflow-hidden rounded-full shadow-md ring-2 sm:h-14 sm:w-14">
              <Image
                src="/static/images/sunil-kumar.jpg"
                alt="Sunil Kumar — Founder & Editor, Locitra"
                fill
                sizes="64px"
                className="object-cover object-top"
                loading="lazy"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                Sunil Kumar
              </span>
              {/* Verification badge */}
              <span
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                aria-label="Verified author"
              >
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified
              </span>
            </div>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Founder &amp; Editor, Locitra
            </p>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Writing about AI tools, technology trends, online income opportunities, career growth,
              and digital success stories.
            </p>
          </div>
        </div>
      </section>

      {/* ── Topic Bar ─────────────────────────────────────────────── */}
      <section
        aria-label="Topics covered on Locitra"
        className="border-b border-gray-100 py-4 dark:border-gray-800"
      >
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
            Covers:
          </span>
          {TOPICS.map((topic) => (
            <Link
              key={topic.slug}
              href={`/categories/${topic.slug}`}
              className="group inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-blue-800 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
            >
              <span aria-hidden="true">{topic.icon}</span>
              {topic.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Stories ──────────────────────────────────────── */}
      {featuredPosts.length > 0 && (
        <section className="border-b border-gray-100 py-12 dark:border-gray-800">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Featured Stories
            </h2>
            <Link
              href="/blog"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPosts.map((post) => (
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
        </section>
      )}

      {/* ── Categories Section ────────────────────────────────────── */}
      <section className="border-b border-gray-100 py-12 dark:border-gray-800">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Explore Categories
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Deep dives into the topics that matter most
            </p>
          </div>
          <Link
            href="/categories"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium transition-colors"
          >
            All categories →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="group hover:border-primary-300 dark:hover:border-primary-700 flex flex-col items-start rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
            >
              <span className="mb-3 text-3xl" aria-hidden="true">
                {cat.icon}
              </span>
              <span className="group-hover:text-primary-600 dark:group-hover:text-primary-400 mb-1 text-sm leading-tight font-bold text-gray-900 transition-colors dark:text-gray-100">
                {cat.name}
              </span>
              <span className="text-xs leading-snug text-gray-500 dark:text-gray-400">
                {cat.description}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Trending Now ──────────────────────────────────────────── */}
      {trendingPosts.length > 0 && (
        <section className="border-b border-gray-100 py-12 dark:border-gray-800">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">
                🔥
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Trending Now
              </h2>
            </div>
            <Link
              href="/blog"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium transition-colors"
            >
              All articles →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trendingPosts.map((post) => (
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

      {/* ── Editor's Picks ────────────────────────────────────────── */}
      {editorsPicks.length > 0 && (
        <section className="border-b border-gray-100 py-12 dark:border-gray-800">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <svg
                  className="text-primary-600 dark:text-primary-400 h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                  Editor's Picks
                </h2>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Hand-curated reads our team recommends
              </p>
            </div>
            <Link
              href="/blog"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium transition-colors"
            >
              All articles →
            </Link>
          </div>

          {/* Three-article editorial layout:
              Desktop: 1 large (col-span-3) + 2 stacked smaller (col-span-2)
              Tablet:  2-col grid (large top, 2 smaller side-by-side)
              Mobile:  stacked single-column */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
            {/* Large featured pick */}
            {editorsPicks[0] && (
              <div className="md:col-span-2 lg:col-span-3">
                <EditorPickFeatured post={editorsPicks[0]} />
              </div>
            )}

            {/* Stacked secondary picks */}
            {editorsPicks.slice(1, 3).length > 0 && (
              <div className="flex flex-col gap-6 md:col-span-2 lg:col-span-2">
                {editorsPicks.slice(1, 3).map((post) => (
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
                    size="default"
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Latest Articles ───────────────────────────────────────── */}
      {latestPosts.length > 0 && (
        <section className="border-b border-gray-100 py-12 dark:border-gray-800">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Latest Articles
            </h2>
            <Link
              href="/blog"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium transition-colors"
            >
              All articles →
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {latestPosts.map((post) => {
              const lCat = post.category ? CATEGORY_MAP[post.category] : undefined
              const lBadgeClass = lCat
                ? CATEGORY_BADGE_CLASSES[lCat.color]
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
              return (
                <article key={post.slug} className="group py-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-6">
                    <div className="flex-shrink-0 text-sm text-gray-400 sm:w-32 dark:text-gray-500">
                      <time dateTime={post.date}>{formatDate(post.date, siteMetadata.locale)}</time>
                    </div>
                    <div className="flex-1">
                      {/* Category badge */}
                      {lCat && (
                        <div className="mb-1">
                          <Link
                            href={`/categories/${lCat.slug}`}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-opacity hover:opacity-80 ${lBadgeClass}`}
                          >
                            <span aria-hidden="true">{lCat.icon}</span>
                            {lCat.name}
                          </Link>
                        </div>
                      )}
                      <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-gray-100">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                          {post.title}
                        </Link>
                      </h3>
                      <p className="line-clamp-1 text-sm text-gray-500 dark:text-gray-400">
                        {post.summary}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
                      {post.readingTime?.text ?? '5 min read'}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {/* ── CTA Strip ─────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="to-primary-900 dark:to-primary-950 rounded-2xl bg-gradient-to-br from-gray-900 px-8 py-10 text-center text-white shadow-lg dark:from-gray-950">
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Stay Ahead with Locitra
          </h2>
          <p className="mb-7 text-base leading-relaxed text-gray-300 sm:text-lg">
            Covering AI Tools, Technology, Online Income, Career Growth, and Success Stories —
            updated regularly.
          </p>
          <Link
            href="/blog"
            className="text-primary-700 inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3 text-sm font-bold shadow transition-all hover:bg-gray-100 hover:shadow-md"
            aria-label="Explore all Locitra articles"
          >
            Explore All Articles
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
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  )
}

// ── Editor's Pick Featured Card ──────────────────────────────────────────────
// A bespoke large card used exclusively for the first Editor's Pick.
// Shows a taller image and larger typography for strong visual hierarchy.
function EditorPickFeatured({ post }) {
  const cat = post.category ? CATEGORY_MAP[post.category] : undefined
  const badgeClass = cat
    ? CATEGORY_BADGE_CLASSES[cat.color]
    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'

  return (
    <article className="group hover:border-primary-200 dark:hover:border-primary-800 flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-xl dark:border-gray-700 dark:bg-gray-900">
      {/* Image */}
      <Link href={`/${post.path}`} className="block flex-shrink-0" tabIndex={-1} aria-hidden="true">
        <div className="relative h-64 w-full overflow-hidden sm:h-72 lg:h-80">
          {post.featuredImage ? (
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 60vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
          ) : cat ? (
            <Image
              src={`/static/images/categories/${cat.slug}.svg`}
              alt={`${cat.name} category illustration`}
              fill
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 60vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="from-primary-600 flex h-full w-full items-center justify-center bg-gradient-to-br to-cyan-500">
              <span className="text-5xl opacity-80" aria-hidden="true">
                ⭐
              </span>
            </div>
          )}
          {/* Editor's Pick badge overlay */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-bold text-white shadow backdrop-blur-sm">
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Editor's Pick
            </span>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
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
        <h3 className="mb-3 flex-1 text-xl leading-snug font-bold text-gray-900 sm:text-2xl dark:text-gray-100">
          <Link
            href={`/${post.path}`}
            className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            {post.title}
          </Link>
        </h3>

        {/* Summary */}
        {post.summary && (
          <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {post.summary}
          </p>
        )}

        {/* Meta row */}
        <div className="mt-auto flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <time dateTime={post.date}>{formatDate(post.date, siteMetadata.locale)}</time>
          <span>{post.readingTime?.text ?? '5 min read'}</span>
        </div>
      </div>
    </article>
  )
}
