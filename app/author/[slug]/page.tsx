import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { allAuthors } from 'contentlayer/generated'
import { genPageMetadata } from 'app/seo'
import { getAuthorBySlug, getAuthorPosts, getAuthorStats } from '@/lib/authors'
import { buildPerson } from '@/lib/schema'
import Image from 'next/image'
import Link from '@/components/Link'
import SocialIcon from '@/components/social-icons'
import ArticleCard from '@/components/ArticleCard'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { components } from '@/components/MDXComponents'

export const generateStaticParams = async () => {
  return allAuthors.map((author) => ({
    slug: author.slug,
  }))
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const params = await props.params
  const author = getAuthorBySlug(params.slug)
  if (!author) {
    return {}
  }

  return genPageMetadata({
    title: `${author.name} — Editorial Profile & Published Articles`,
    description: `Read AI tools, technology trends, online income strategies, and software reviews written by ${author.name} on Locitra.`,
    canonicalPath: `/author/${params.slug}`,
  })
}

const FEATURED_CATEGORIES = [
  {
    name: 'AI Tools',
    slug: 'ai-tools',
    description:
      'In-depth reviews, workflow guides, and practical evaluations of modern AI platforms.',
  },
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Analysis of digital trends, cybersecurity software, and emerging technology.',
  },
  {
    name: 'Online Income',
    slug: 'online-income',
    description: 'Actionable, evidence-based strategies for digital monetization and freelancing.',
  },
  {
    name: 'Career Growth',
    slug: 'career-growth',
    description: 'Career strategy, workplace productivity, and skill building for the AI era.',
  },
]

export default async function AuthorPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const author = getAuthorBySlug(params.slug)

  if (!author) {
    notFound()
  }

  const posts = getAuthorPosts(params.slug)
  const stats = getAuthorStats(params.slug)
  const schema = buildPerson(author)

  // Cast arrays from Contentlayer safely
  const expertise = Array.isArray(author.expertise) ? author.expertise : []
  const specialties = Array.isArray(author.specialties) ? author.specialties : []
  const certifications = Array.isArray(author.certifications) ? author.certifications : []

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {/* ── Author Header ──────────────────────────────────────────────── */}
        <header className="space-y-8 pt-6 pb-10 md:space-y-12">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="ring-primary-100 dark:ring-primary-900 relative h-32 w-32 overflow-hidden rounded-full shadow-xl ring-4 md:h-40 md:w-40">
              {author.avatar ? (
                <Image
                  src={author.avatar}
                  alt={author.name}
                  fill
                  sizes="160px"
                  className="object-cover object-top"
                  priority
                />
              ) : (
                <div className="from-primary-600 flex h-full w-full items-center justify-center bg-gradient-to-br to-cyan-500 text-6xl font-bold text-white">
                  {author.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="max-w-2xl">
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl md:text-5xl dark:text-gray-100">
                {author.name}
              </h1>
              {author.occupation && (
                <p className="text-primary-600 dark:text-primary-400 mt-2 text-[11px] font-medium tracking-widest uppercase">
                  {author.occupation} {author.company && `at ${author.company}`}
                </p>
              )}

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {certifications.map((cert) => (
                  <span
                    key={cert}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {cert}
                  </span>
                ))}
              </div>

              {(author.email ||
                author.twitter ||
                author.linkedin ||
                author.github ||
                author.bluesky) && (
                <div className="mt-6 flex items-center justify-center gap-4">
                  {author.email && (
                    <SocialIcon kind="mail" href={`mailto:${author.email}`} size={5} />
                  )}
                  {author.linkedin && (
                    <SocialIcon kind="linkedin" href={author.linkedin} size={5} />
                  )}
                  {author.twitter && <SocialIcon kind="x" href={author.twitter} size={5} />}
                  {author.github && <SocialIcon kind="github" href={author.github} size={5} />}
                  {author.bluesky && <SocialIcon kind="bluesky" href={author.bluesky} size={5} />}
                </div>
              )}
            </div>
          </div>

          {/* Author Stats Grid — Phase 7 & Refinement 1 (Descriptive Editorial Status) */}
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 border-t border-gray-100 pt-6 md:grid-cols-4 dark:border-gray-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalArticles}
              </p>
              <p className="mt-1 text-xs font-medium tracking-widest text-gray-500 uppercase">
                Articles Published
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.categoriesCovered}
              </p>
              <p className="mt-1 text-xs font-medium tracking-widest text-gray-500 uppercase">
                Categories Covered
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.estimatedTotalReadingTime}
              </p>
              <p className="mt-1 text-xs font-medium tracking-widest text-gray-500 uppercase">
                Reading Time
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {author.yearsExperience ? author.yearsExperience : 'Active'}
              </p>
              <p className="mt-1 text-xs font-medium tracking-widest text-gray-500 uppercase">
                {author.yearsExperience ? 'Years Exp.' : 'Editorial Contributor'}
              </p>
            </div>
          </div>
        </header>

        {/* ── Phase 1 & 2: Biography & Editorial Role ───────────────────── */}
        <div className="grid grid-cols-1 gap-10 py-10 md:grid-cols-3">
          <div className="prose dark:prose-invert max-w-none md:col-span-2">
            <h2 className="mb-4 border-b border-gray-100 pb-2 text-xl font-bold dark:border-gray-800">
              About {author.name}
            </h2>
            <MDXLayoutRenderer code={author.body.code} components={components} />

            {/* Phase 2: Editorial Role at Locitra */}
            <div className="mt-8 border-t border-gray-100 pt-6 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Editorial Role at Locitra
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                As a primary editorial voice at Locitra, {author.name} is responsible for
                researching topics, evaluating software platforms, reviewing AI tools, and
                fact-checking guide content. Their work ensures every publication meets
                Locitra&apos;s editorial standards for clarity, accuracy, and practical utility.
              </p>
            </div>

            {/* Phase 3: Areas of Coverage */}
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Areas of Coverage
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {author.name} regularly covers developments across artificial intelligence,
                productivity software, cybersecurity tools, online business strategies, digital
                publishing, SEO, and career development. Their goal is to deliver evidence-based,
                actionable guidance that helps professionals make informed technology decisions.
              </p>
            </div>

            {/* Phase 4 & 5: Editorial Standards & Research Philosophy */}
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Editorial Standards &amp; Research Philosophy
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                Articles authored by {author.name} undergo a rigorous research and review process.
                Content is informed by hands-on software evaluation, official technical
                documentation, and reputable industry sources. Every piece is written with a focus
                on practical value, objective analysis, and reader trust over promotional hype.
              </p>
            </div>

            {/* Phase 6: Transparency & AI Usage */}
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Transparency &amp; AI Usage Policy
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                In alignment with Locitra&apos;s site-wide policies, AI tools may be utilized during
                early drafting or research organization. However, every article is thoroughly
                reviewed, fact-checked, and edited by a human before publication. Affiliate links
                and commercial relationships never influence editorial recommendations or tool
                ratings.
              </p>
            </div>

            {author.featuredQuote && (
              <blockquote className="border-primary-500 mt-8 border-l-4 pl-4 text-gray-700 italic dark:text-gray-300">
                &quot;{author.featuredQuote}&quot;
              </blockquote>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {expertise.length > 0 && (
              <div>
                <h3 className="mb-4 text-sm font-bold tracking-widest text-gray-900 uppercase dark:text-gray-100">
                  Core Expertise
                </h3>
                <ul className="space-y-2">
                  {expertise.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <svg
                        className="h-4 w-4 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {specialties.length > 0 && (
              <div>
                <h3 className="mb-4 text-sm font-bold tracking-widest text-gray-900 uppercase dark:text-gray-100">
                  Specialties
                </h3>
                <div className="flex flex-wrap gap-2">
                  {specialties.map((item) => (
                    <span
                      key={item}
                      className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Phase 9 & Refinement 4: Contact the Author */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-2 text-sm font-bold text-gray-900 dark:text-gray-100">
                Contact the Author
              </h3>
              <p className="mb-4 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                Have questions, topic suggestions, or factual correction requests for {author.name}?
                Constructive feedback and corrections help continuously improve the quality of
                future publications.
              </p>
              <div className="flex flex-col gap-2 text-xs">
                {author.email && (
                  <a
                    href={`mailto:${author.email}?subject=Editorial%20Inquiry%20for%20${encodeURIComponent(author.name)}`}
                    className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                  >
                    📧 Send Email ({author.email})
                  </a>
                )}
                <Link
                  href="/contact"
                  className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                >
                  📝 Locitra Contact Form &rarr;
                </Link>
              </div>
            </div>

            {/* Phase 10: Profile Maintenance */}
            <div className="border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <p>
                <strong>Profile Status:</strong> Active Editorial Contributor
              </p>
              <p className="mt-1">
                <strong>Profile Last Reviewed:</strong> July 2026
              </p>
            </div>
          </div>
        </div>

        {/* ── Phase 8 & Refinement 3: Featured Topics ────────────────────── */}
        <div className="py-10">
          <h2 className="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Featured Editorial Coverage
          </h2>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            Explore major publication categories that represent {author.name}&apos;s ongoing
            editorial contributions, software evaluations, and subject coverage across Locitra:
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURED_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="group hover:border-primary-500 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <h3 className="group-hover:text-primary-600 dark:group-hover:text-primary-400 mb-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                  {cat.name} &rarr;
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Phase 11: Article Archive ─────────────────────────────────── */}
        <div className="py-12">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
              Articles by {author.name}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-400">
              This archive contains all published articles authored by {author.name} on Locitra,
              reflecting their ongoing research, software evaluations, and technical coverage.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 [&_article]:flex [&_article]:h-full [&_article]:flex-col">
            {posts.map((post) => (
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
          {posts.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400">No articles published yet.</p>
          )}
        </div>

        {/* ── Phase 12 & Refinements 2 & 5: Professional Closing ────────────── */}
        <div className="border-t border-gray-100 py-10 dark:border-gray-800">
          <section aria-labelledby="author-commitment-heading" className="max-w-3xl">
            <h2
              id="author-commitment-heading"
              className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100"
            >
              Commitment to Readers
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Every article published by {author.name} is written with a steadfast commitment to
              editorial integrity, practical guidance, and factual verification. We strive to
              provide transparent, evidence-based content that helps readers make informed decisions
              in a rapidly evolving digital landscape, while continuously earning reader trust over
              the long term.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              To learn more about Locitra&apos;s mission, editorial values, and publication
              standards, visit our{' '}
              <Link
                href="/about"
                className="text-primary-600 dark:text-primary-400 font-medium underline"
              >
                About Page &rarr;
              </Link>
            </p>
          </section>
        </div>
      </div>
    </>
  )
}
