import Link from '@/components/Link'
import { genPageMetadata } from 'app/seo'
import { getPrimaryAuthor } from '@/lib/authors'
import Image from 'next/image'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { components } from '@/components/MDXComponents'

export const metadata = genPageMetadata({
  title: 'About',
  description:
    'Learn about Locitra — founded by Sunil Kumar Uikey to help readers discover practical AI tools, technology trends, online income strategies, career growth tips, and inspiring success stories.',
  canonicalPath: '/about',
})

const TOPICS = [
  { icon: '🤖', title: 'AI Tools', description: 'Reviews and guides for the best AI tools.' },
  {
    icon: '💻',
    title: 'Technology',
    description: 'Trends shaping the digital world in 2026 and beyond.',
  },
  {
    icon: '💰',
    title: 'Online Income',
    description: 'Practical strategies to earn income online.',
  },
  {
    icon: '📈',
    title: 'Career Growth',
    description: 'Skills and mindsets for advancing your career.',
  },
  {
    icon: '⚡',
    title: 'Productivity',
    description: 'Tools and habits that help you do more with less.',
  },
  {
    icon: '⭐',
    title: 'Success Stories',
    description: 'Real stories from digital creators and entrepreneurs.',
  },
]

export default function AboutPage() {
  const founder = getPrimaryAuthor()

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="space-y-2 pt-6 pb-8 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          About Locitra
        </h1>
        <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
          A modern blog built to help you learn, grow, and stay ahead.
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none pt-10 pb-12">
        {/* ── 1. Founder Introduction ──────────────────────────────── */}
        <section aria-labelledby="founder-heading">
          {founder && (
            <div className="not-prose mb-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              {/* Avatar */}
              <div className="ring-primary-200 dark:ring-primary-800 relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl shadow-md ring-2 sm:h-24 sm:w-24">
                <Image
                  src={founder.avatar || '/static/images/sunil-kumar.jpg'}
                  alt={`${founder.name} — Founder & Editor, Locitra`}
                  fill
                  sizes="96px"
                  className="object-cover object-top"
                  loading="lazy"
                />
              </div>
              {/* Identity */}
              <div>
                <p className="text-primary-600 dark:text-primary-400 mb-0.5 text-xs font-bold tracking-[0.15em] uppercase">
                  {founder.occupation || 'Founder & Editor'}
                </p>
                <h2
                  id="founder-heading"
                  className="mb-1 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100"
                >
                  <Link href={`/author/${founder.slug}`} className="hover:underline">
                    {founder.name}
                  </Link>
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  <svg
                    className="h-3 w-3"
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
                  Verified Author
                </span>
              </div>
            </div>
          )}
          {founder ? (
            <MDXLayoutRenderer code={founder.body.code} components={components} />
          ) : (
            <p>Loading founder information...</p>
          )}
        </section>

        <hr />

        {/* ── 2. Why Locitra Exists ────────────────────────────────── */}
        <section aria-labelledby="why-heading">
          <h2 id="why-heading">Why Locitra Exists</h2>
          <p>
            Locitra was founded in 2026 with a clear purpose: to make trustworthy, practical content
            accessible to anyone curious about technology and digital opportunities.
          </p>
          <p>
            The internet is full of content that is either too technical, too vague, or too focused
            on selling. Locitra is different — we focus on clarity, depth, and genuine usefulness.
          </p>
          <ul>
            <li>
              <strong>Practical over theoretical</strong> — every article aims to be actionable.
            </li>
            <li>
              <strong>Honest over promotional</strong> — we disclose affiliate relationships and AI
              assistance transparently.
            </li>
            <li>
              <strong>Accessible over jargon-heavy</strong> — written for real readers, not
              insiders.
            </li>
          </ul>
        </section>

        <hr />

        {/* ── 3. Topics We Cover ───────────────────────────────────── */}
        <section aria-labelledby="topics-heading">
          <h2 id="topics-heading">Topics We Cover</h2>
          <div className="not-prose mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((topic) => (
              <div
                key={topic.title}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
              >
                <span className="mb-3 block text-3xl" aria-hidden="true">
                  {topic.icon}
                </span>
                <h3 className="mb-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                  {topic.title}
                </h3>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {topic.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <hr />

        {/* ── 4. Editorial Commitment ──────────────────────────────── */}
        <section aria-labelledby="editorial-heading">
          <h2 id="editorial-heading">Our Editorial Commitment</h2>
          <p>
            Every article published on Locitra goes through a deliberate editorial process before it
            reaches you:
          </p>
          <ul>
            <li>
              <strong>Researched content</strong> — topics are selected based on reader relevance
              and real-world usefulness.
            </li>
            <li>
              <strong>AI-assisted drafting</strong> — some articles use AI tools to assist with
              drafting and structuring content. This is always disclosed.
            </li>
            <li>
              <strong>Human review</strong> — all content, including AI-assisted articles, is
              reviewed and edited by a human editor before publication.
            </li>
            <li>
              <strong>Accuracy first</strong> — we fact-check claims and correct errors promptly
              when identified.
            </li>
          </ul>
          <p>
            For more details, see our{' '}
            <Link
              href="/editorial-policy"
              className="text-primary-600 dark:text-primary-400 underline"
            >
              Editorial Policy
            </Link>
            .
          </p>
        </section>

        <hr />

        {/* ── 5. Contact ───────────────────────────────────────────── */}
        <section aria-labelledby="contact-heading">
          <h2 id="contact-heading">Get in Touch</h2>
          <p>
            Have a question, suggestion, story idea, or collaboration proposal? I&apos;d love to
            hear from you.
          </p>
          <p>
            📧{' '}
            <a
              href="mailto:contact@locitra.com?subject=Inquiry%20from%20Locitra"
              aria-label="Email Locitra"
              className="hover:underline"
            >
              contact@locitra.com
            </a>
          </p>
          <p>
            You can also visit the{' '}
            <Link href="/contact" className="text-primary-600 dark:text-primary-400 underline">
              Contact page
            </Link>{' '}
            to send a message directly.
          </p>
        </section>
      </div>
    </div>
  )
}
