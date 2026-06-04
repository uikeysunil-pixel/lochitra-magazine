import Link from '@/components/Link'
import { genPageMetadata } from 'app/seo'
import { CATEGORIES, CATEGORY_BADGE_CLASSES, CATEGORY_GRADIENT_CLASSES } from '@/data/categoryData'
import { allBlogs } from 'contentlayer/generated'

export const metadata = genPageMetadata({
  title: 'Categories',
  description:
    'Browse all Lochitra content categories — AI Tools, Technology, Online Income, Career Growth, and Success Stories.',
})

/** Count articles per category slug */
function getCategoryCounts(): Record<string, number> {
  const counts: Record<string, number> = {}
  allBlogs.forEach((post) => {
    if (!post.draft && post.category) {
      counts[post.category] = (counts[post.category] ?? 0) + 1
    }
  })
  return counts
}

export default function CategoriesPage() {
  const counts = getCategoryCounts()
  const totalArticles = allBlogs.filter((p) => !p.draft).length

  return (
    <div>
      {/* ── Page Header ─────────────────────────────────────────── */}
      <header className="border-b border-gray-100 py-12 dark:border-gray-800">
        <nav className="mb-3 text-xs text-gray-400 dark:text-gray-500">
          <Link
            href="/"
            className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            Home
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-gray-600 dark:text-gray-300">Categories</span>
        </nav>

        <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl dark:text-gray-100">
          Explore Categories
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-gray-500 dark:text-gray-400">
          {totalArticles} articles across {CATEGORIES.length} topics — find what matters most to
          you.
        </p>
      </header>

      {/* ── Category Grid ────────────────────────────────────────── */}
      <section className="py-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const count = counts[cat.slug] ?? 0
            const badgeClass = CATEGORY_BADGE_CLASSES[cat.color]
            const gradientClass = CATEGORY_GRADIENT_CLASSES[cat.color]

            return (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="group hover:border-primary-200 dark:hover:border-primary-800 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-900"
                aria-label={`Browse ${cat.name} — ${count} articles`}
              >
                {/* Gradient banner */}
                <div
                  className={`flex h-24 items-center justify-center bg-gradient-to-br ${gradientClass}`}
                  aria-hidden="true"
                >
                  <span className="text-5xl">{cat.icon}</span>
                </div>

                {/* Card body */}
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="group-hover:text-primary-600 dark:group-hover:text-primary-400 text-xl font-bold text-gray-900 transition-colors dark:text-gray-100">
                      {cat.name}
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}
                    >
                      {count} {count === 1 ? 'article' : 'articles'}
                    </span>
                  </div>

                  <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    {cat.description}
                  </p>

                  <span className="text-primary-600 transition-gap dark:text-primary-400 inline-flex items-center gap-1 text-sm font-semibold group-hover:gap-2">
                    Browse articles
                    <span
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
