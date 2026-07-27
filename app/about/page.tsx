import Link from '@/components/Link'
import { genPageMetadata } from 'app/seo'
import { getPrimaryAuthor } from '@/lib/authors'
import Image from 'next/image'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { components } from '@/components/MDXComponents'
import CategoryIcon from '@/components/CategoryIcon'

export const metadata = genPageMetadata({
  title: 'About',
  description:
    'Learn about Locitra — founded by Sunil Kumar Uikey to provide practical, trustworthy guidance on AI tools, technology trends, online income strategies, and digital career growth.',
  canonicalPath: '/about',
})

const TOPICS = [
  { slug: 'ai-tools', title: 'AI Tools', description: 'Reviews and guides for the best AI tools.' },
  {
    slug: 'technology',
    title: 'Technology',
    description: 'Trends shaping the digital world in 2026 and beyond.',
  },
  {
    slug: 'online-income',
    title: 'Online Income',
    description: 'Practical strategies to earn income online.',
  },
  {
    slug: 'career-growth',
    title: 'Career Growth',
    description: 'Skills and mindsets for advancing your career.',
  },
  {
    slug: 'software-reviews',
    title: 'Software Reviews',
    description: 'Tools and habits that help you do more with less.',
  },
  {
    slug: 'success-stories',
    title: 'Success Stories',
    description: 'Real stories from digital creators and entrepreneurs.',
  },
]

const CORE_VALUES = [
  {
    title: 'Accuracy',
    description: 'Grounding every claim in research, official sources, and careful verification.',
  },
  {
    title: 'Transparency',
    description: 'Clearly disclosing AI usage, affiliate links, and editorial processes.',
  },
  {
    title: 'Practicality',
    description: 'Focusing on actionable insights that readers can apply immediately.',
  },
  {
    title: 'Independence',
    description: 'Maintaining editorial freedom so recommendations remain objective.',
  },
  {
    title: 'Continuous Learning',
    description: 'Staying curious and constantly updating content as tech evolves.',
  },
  {
    title: 'Reader-First Publishing',
    description: 'Prioritizing reader clarity, usefulness, and trust above all else.',
  },
]

const AUDIENCES = [
  {
    title: 'Students & Lifelong Learners',
    description: 'Clear breakdowns of complex emerging technologies and AI concepts.',
  },
  {
    title: 'Working Professionals',
    description: 'Practical tool evaluations that save time and boost workplace productivity.',
  },
  {
    title: 'Freelancers & Digital Creators',
    description: 'Actionable workflows to build digital presence and scale operations.',
  },
  {
    title: 'Entrepreneurs & Small Businesses',
    description: 'Honest guidance on modern tech stacks and sustainable digital models.',
  },
]

export default function AboutPage() {
  const founder = getPrimaryAuthor()

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {/* Page Header */}
      <div className="space-y-2 pt-6 pb-8 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          About Locitra
        </h1>
        <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
          A digital publication dedicated to practical technology, AI tools, and online business
          insights.
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none pt-10 pb-12">
        {/* 1. Founder Introduction */}
        <section aria-labelledby="founder-heading">
          {founder && (
            <div className="not-prose mb-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
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
          <p className="lead">
            Sunil Kumar Uikey founded Locitra after years of hands-on experience exploring blogging,
            AI tools, SEO, digital publishing, online income strategies, and technology. His goal is
            to simplify complex digital topics into practical, trustworthy guidance that helps
            readers make informed decisions and build valuable digital skills.
          </p>
          {founder ? (
            <MDXLayoutRenderer code={founder.body.code} components={components} />
          ) : (
            <p>Loading founder information...</p>
          )}
        </section>

        <hr />

        {/* 2. Why Locitra Exists */}
        <section aria-labelledby="why-heading">
          <h2 id="why-heading">Why Locitra Exists</h2>
          <p>
            Locitra was established to make reliable, actionable tech content accessible to everyone
            navigating today’s fast-changing digital landscape.
          </p>
          <p>
            With so much online content skewed toward hype, surface-level summaries, or aggressive
            sales pitches, Locitra focuses on clarity, substance, and practical value.
          </p>
          <ul>
            <li>
              <strong>Practical over theoretical</strong> — every article provides actionable
              takeaways.
            </li>
            <li>
              <strong>Honest over promotional</strong> — affiliate partnerships and AI assistance
              are always disclosed transparently.
            </li>
            <li>
              <strong>Accessible over jargon-heavy</strong> — written for clear human understanding
              without unnecessary complexity.
            </li>
          </ul>
        </section>

        <hr />

        {/* 3. Topics We Cover */}
        <section aria-labelledby="topics-heading">
          <h2 id="topics-heading">Topics We Cover</h2>
          <div className="not-prose mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((topic) => (
              <div
                key={topic.title}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-50 p-2 dark:bg-gray-800/60">
                  <CategoryIcon slug={topic.slug} size={48} />
                </div>
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

        {/* 4. Who We Write For */}
        <section aria-labelledby="audience-heading">
          <h2 id="audience-heading">Who We Write For</h2>
          <p>
            Our content is crafted to serve a diverse audience of motivated learners and digital
            builders:
          </p>
          <div className="not-prose mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {AUDIENCES.map((audience) => (
              <div
                key={audience.title}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
              >
                <h3 className="mb-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                  {audience.title}
                </h3>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {audience.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <hr />

        {/* 5. What Readers Can Expect */}
        <section aria-labelledby="expect-heading">
          <h2 id="expect-heading">What Readers Can Expect</h2>
          <p>When you read Locitra, you can count on:</p>
          <ul>
            <li>
              <strong>Practical Guidance:</strong> Insights and tutorials you can put into practice
              immediately.
            </li>
            <li>
              <strong>Honest Evaluations:</strong> Balanced software and tool overviews highlighting
              both strengths and limitations.
            </li>
            <li>
              <strong>Unbiased Educational Content:</strong> Clear explanations designed to inform,
              not persuade.
            </li>
            <li>
              <strong>Simple AI Breakdowns:</strong> Complex machine learning tools demystified for
              everyday productivity.
            </li>
            <li>
              <strong>Transparent Standards:</strong> Upfront disclosures regarding how content is
              researched, written, and monetized.
            </li>
            <li>
              <strong>Maintained Content:</strong> Periodic updates to keep information accurate as
              tools and industries evolve.
            </li>
          </ul>
        </section>

        <hr />

        {/* 6. Our Core Publishing Values */}
        <section aria-labelledby="values-heading">
          <h2 id="values-heading">Our Core Publishing Values</h2>
          <div className="not-prose mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CORE_VALUES.map((value) => (
              <div
                key={value.title}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
              >
                <h3 className="mb-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                  {value.title}
                </h3>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <hr />

        {/* 7. Why Trust Locitra & Editorial Standards */}
        <section aria-labelledby="trust-heading">
          <h2 id="trust-heading">Why Trust Locitra</h2>
          <p>
            Trust is earned through editorial integrity, verification, and transparency. At Locitra,
            we maintain strict publication standards:
          </p>
          <ul>
            <li>
              <strong>Rigorous Verification:</strong> Where appropriate, articles are informed by
              hands-on evaluation, official documentation, reputable industry sources, and editorial
              review.
            </li>
            <li>
              <strong>Human Editorial Oversight:</strong> AI tools may assist with drafting or
              structuring initial ideas, but every article is thoroughly reviewed, fact-checked, and
              edited by a human before publication.
            </li>
            <li>
              <strong>Editorial Independence:</strong> Editorial decisions are made independently
              and are never influenced by advertisers, affiliate partnerships, or commercial
              relationships.
            </li>
          </ul>
          <p>
            Whenever practical, official documentation, primary sources, and reputable industry
            publications are referenced so readers can independently verify key information and
            data.
          </p>
          <p>
            Learn more about our standards in our full{' '}
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

        {/* 8. How Locitra Is Funded */}
        <section aria-labelledby="funding-heading">
          <h2 id="funding-heading">How Locitra Is Funded</h2>
          <p>
            Locitra is committed to keeping high-quality, practical content freely accessible to all
            readers. To support our independent digital publishing operations, Locitra may be
            supported through affiliate partnerships, advertising, and other reader-supporting
            revenue opportunities.
          </p>
          <p>
            If you click on an affiliate link and make a purchase, we may receive a referral
            commission at no extra cost to you. However, editorial recommendations are never
            determined by affiliate commissions or commercial relationships.
          </p>
          <p>
            For complete information, view our{' '}
            <Link href="/disclaimer" className="text-primary-600 dark:text-primary-400 underline">
              Disclaimer &amp; Affiliate Disclosure
            </Link>
            .
          </p>
        </section>

        <hr />

        {/* 9. Content Maintenance & Reporting Errors */}
        <section aria-labelledby="maintenance-heading">
          <h2 id="maintenance-heading">Content Maintenance &amp; Reporting Errors</h2>
          <p>
            Technology evolves rapidly. We regularly review published content to update outdated
            details, verify software pricing, and maintain accuracy. When substantial revisions are
            made, articles are updated to reflect the latest available information.
          </p>
          <p>
            If you discover outdated information, factual inaccuracies, or broken links, we
            encourage you to contact us. We review correction requests carefully and update our
            content whenever necessary.
          </p>
        </section>

        <hr />

        {/* 10. Trust Ecosystem & Policies */}
        <section aria-labelledby="policies-heading">
          <h2 id="policies-heading">Editorial &amp; Legal Policies</h2>
          <p>
            We believe in full transparency across all operations. You can review our policies here:
          </p>
          <ul>
            <li>
              <Link href="/editorial-policy" className="hover:underline">
                Editorial Policy
              </Link>{' '}
              — How we research, draft, fact-check, and review content.
            </li>
            <li>
              <Link href="/disclaimer" className="hover:underline">
                Disclaimer &amp; Affiliate Disclosure
              </Link>{' '}
              — Full disclosure on affiliate links and commercial relationships.
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:underline">
                Privacy Policy
              </Link>{' '}
              — How we protect reader data and privacy.
            </li>
            <li>
              <Link href="/terms" className="hover:underline">
                Terms &amp; Conditions
              </Link>{' '}
              — Terms governing website usage.
            </li>
            <li>
              <Link
                href={`/author/${founder?.slug || 'sunil-kumar-uikey'}`}
                className="hover:underline"
              >
                Founder Profile
              </Link>{' '}
              — Detailed background and author profile of Sunil Kumar Uikey.
            </li>
          </ul>
        </section>

        <hr />

        {/* 11. Contact */}
        <section aria-labelledby="contact-heading">
          <h2 id="contact-heading">Get in Touch</h2>
          <p>
            Have questions, feedback, story suggestions, or correction requests? We welcome your
            input.
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
            You can also visit our{' '}
            <Link href="/contact" className="text-primary-600 dark:text-primary-400 underline">
              Contact page
            </Link>{' '}
            to send a direct message.
          </p>
        </section>

        <hr />

        {/* 12. Our Commitment */}
        <section aria-labelledby="commitment-heading">
          <h2 id="commitment-heading">Our Commitment</h2>
          <p>
            Locitra exists with a single goal: to help our readers make informed decisions and build
            valuable digital skills. Practicality, clarity, and trust remain our guiding publishing
            principles.
          </p>
          <p>
            We are committed to maintaining high editorial standards, earning reader trust with
            every article, and continually improving our publication over the long term. We welcome
            constructive feedback and thank you for being a valued reader of Locitra.
          </p>
        </section>
      </div>
    </div>
  )
}
