import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { allAuthors } from 'contentlayer/generated'
import { genPageMetadata } from 'app/seo'
import { getAuthorBySlug, getAuthorPosts, getAuthorStats } from '@/lib/authors'
import { buildPerson } from '@/lib/schema'
import Image from 'next/image'
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
    title: `${author.name} | AI, Technology & Software Reviews | Locitra`,
    description: `Read AI, Technology, Software Reviews, Career Growth, and Online Income articles written by ${author.name} on Locitra.`,
    canonicalPath: `/author/${params.slug}`,
  })
}

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
                <p className="text-primary-600 dark:text-primary-400 mt-2 text-lg text-[11px] font-medium tracking-widest uppercase">
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

          {/* Author Stats Grid */}
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 border-t border-gray-100 pt-6 md:grid-cols-4 dark:border-gray-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalArticles}
              </p>
              <p className="mt-1 text-xs font-medium tracking-widest text-gray-500 uppercase">
                Articles
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {author.yearsExperience || '5+'}
              </p>
              <p className="mt-1 text-xs font-medium tracking-widest text-gray-500 uppercase">
                Years Exp.
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.categoriesCovered}
              </p>
              <p className="mt-1 text-xs font-medium tracking-widest text-gray-500 uppercase">
                Categories
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.estimatedTotalReadingTime}
              </p>
              <p className="mt-1 text-xs font-medium tracking-widest text-gray-500 uppercase">
                Content
              </p>
            </div>
          </div>
        </header>

        {/* ── Biography & Expertise ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-10 py-10 md:grid-cols-3">
          <div className="prose dark:prose-invert max-w-none md:col-span-2">
            <h2 className="mb-4 border-b border-gray-100 pb-2 text-xl font-bold dark:border-gray-800">
              About {author.name}
            </h2>
            <MDXLayoutRenderer code={author.body.code} components={components} />
            {author.featuredQuote && (
              <blockquote className="border-primary-500 mt-8 border-l-4 pl-4 text-gray-700 italic dark:text-gray-300">
                "{author.featuredQuote}"
              </blockquote>
            )}
          </div>
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
          </div>
        </div>

        {/* ── Article Archive ───────────────────────────────────────────── */}
        <div className="py-12">
          <h2 className="mb-8 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Articles by {author.name}
          </h2>
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
      </div>
    </>
  )
}
