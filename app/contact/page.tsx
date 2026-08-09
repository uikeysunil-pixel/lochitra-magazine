import { genPageMetadata } from 'app/seo'
import Link from '@/components/Link'
import ContactForm from '@/components/ContactForm'

export const metadata = genPageMetadata({
  title: 'Contact Locitra',
  description:
    'Get in touch with Locitra for questions, feedback, correction requests, software recommendations, media inquiries, and corporate partnerships.',
  canonicalPath: '/contact',
})

const INQUIRY_TYPES = [
  {
    title: 'Editorial Questions',
    description:
      'Inquiries regarding our technology coverage, research methodology, or published guides.',
  },
  {
    title: 'Article Feedback',
    description: 'Constructive suggestions, comments, or thoughts on our articles and tutorials.',
  },
  {
    title: 'Correction Requests',
    description:
      'Reporting factual inaccuracies, outdated software pricing, or broken website links.',
  },
  {
    title: 'Technical Issues',
    description: 'Reporting display glitches, navigation errors, or website performance issues.',
  },
  {
    title: 'Software Recommendations',
    description:
      'Suggesting AI tools, software platforms, or productivity apps for future review consideration.',
  },
  {
    title: 'Business Partnerships',
    description:
      'Corporate inquiries, media requests, editorial collaborations, and syndication proposals.',
  },
]

const TRUST_PAGES = [
  {
    title: 'About Locitra',
    href: '/about',
    description: 'Learn about our founding story, audience mission, and core publishing values.',
  },
  {
    title: 'Author Profile',
    href: '/author/sunil-kumar-uikey',
    description:
      'Review the background, research focus, and article archives of Sunil Kumar Uikey.',
  },
  {
    title: 'Editorial Policy',
    href: '/editorial-policy',
    description:
      'Our research standards, fact-checking methodology, sources policy, and AI guidelines.',
  },
  {
    title: 'Disclaimer & Disclosure',
    href: '/disclaimer',
    description: 'Commercial transparency, affiliate referral link policies, and ad disclosures.',
  },
  {
    title: 'Privacy Policy',
    href: '/privacy-policy',
    description: 'Learn how reader data, cookies, analytics, and privacy rights are protected.',
  },
  {
    title: 'Terms & Conditions',
    href: '/terms',
    description: 'Terms governing website access, content usage, and intellectual property.',
  },
]

import { buildContactPage, buildGraph } from '@/lib/schema'

export default function ContactPage() {
  const contactSchema = buildContactPage()
  const jsonLd = buildGraph([contactSchema])

  return (
    <div className="mx-auto max-w-4xl divide-y divide-gray-200 pt-10 dark:divide-gray-700">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* SECTION A: Hero Introduction */}
      <div className="space-y-4 pb-12 text-center md:space-y-6 md:pb-16">
        <h1 className="text-4xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-5xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Contact Locitra
        </h1>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Reader Communication Hub &amp; Media Inquiries &bull; Last reviewed: July 2026
        </p>
        <p className="mx-auto max-w-2xl text-lg leading-7 text-gray-500 dark:text-gray-400">
          Locitra welcomes open communication with our readers, digital builders, software vendors,
          and media partners. Whether you have an editorial question, article feedback, a correction
          request, a software recommendation, or a corporate partnership proposal, we are glad to
          connect with you.
        </p>
      </div>

      {/* SECTION B: Main Form & Direct Contact Block */}
      <div className="grid grid-cols-1 gap-12 pt-12 pb-12 lg:grid-cols-3">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Send a Message
          </h2>
          <ContactForm />
        </div>

        {/* Direct Contact & Response Expectations */}
        <div className="space-y-10">
          <div>
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
              Direct Contact
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Prefer to email us directly from your email client? You can reach our team at:
            </p>
            <div className="mt-3">
              <a
                href="mailto:contact@locitra.com"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center gap-2 font-semibold transition-colors"
                aria-label="Email Locitra at contact@locitra.com"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                contact@locitra.com
              </a>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
              Response Expectations
            </h2>
            <ul className="space-y-4 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-green-500"
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
                <span>
                  Most inquiries receive a response within <strong>24–48 hours</strong> when
                  possible.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-green-500"
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
                <span>
                  Complex partnership or technical requests may require additional review time.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-green-500"
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
                <span>Every legitimate message is reviewed directly by our editorial team.</span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-green-500"
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
                <span>Respectful, constructive communication is highly appreciated.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* SECTION C: Detailed Communication Governance */}
      <div className="prose dark:prose-invert max-w-none pt-12 pb-12">
        {/* 1. How We Can Help */}
        <section aria-labelledby="help-heading">
          <h2 id="help-heading">1. How We Can Help</h2>
          <p>
            Locitra welcomes inquiries across several key operational and editorial categories. To
            help us process your message effectively, please select the most relevant reason when
            using our contact form:
          </p>
          <div className="not-prose my-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INQUIRY_TYPES.map((inquiry) => (
              <div
                key={inquiry.title}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
              >
                <h3 className="mb-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                  {inquiry.title}
                </h3>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {inquiry.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <hr />

        {/* 2. Editorial Feedback & Corrections */}
        <section aria-labelledby="corrections-heading">
          <h2 id="corrections-heading">2. Editorial Feedback &amp; Correction Requests</h2>
          <p>
            Accuracy and editorial integrity are fundamental to Locitra. We encourage our readers to
            report:
          </p>
          <ul>
            <li>
              <strong>Factual Inaccuracies:</strong> Incorrect technical descriptions, code syntax
              errors, or outdated statistics.
            </li>
            <li>
              <strong>Outdated Pricing:</strong> Software subscription changes, altered free tier
              quotas, or pricing plan revisions.
            </li>
            <li>
              <strong>Broken Links &amp; Navigation:</strong> Defective external reference links or
              site navigation issues.
            </li>
            <li>
              <strong>Content Suggestions:</strong> Ideas for new AI tool evaluations, productivity
              workflows, or topic coverage.
            </li>
          </ul>
          <p>
            Constructive reader feedback directly contributes to maintaining our publication
            standards. For more details on how correction requests are reviewed and processed,
            consult our full{' '}
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

        {/* 3. Partnerships & Business Inquiries */}
        <section aria-labelledby="business-heading">
          <h2 id="business-heading">3. Partnerships &amp; Business Inquiries</h2>
          <p>
            Locitra welcomes professional inquiries regarding corporate partnerships, editorial
            collaborations, media interviews, and business development opportunities.
          </p>
          <p>
            <strong>Strict Commercial Independence:</strong> Commercial discussions and advertising
            opportunities never influence our editorial coverage, software review scores, top
            recommendation rankings, or comparative verdicts. Software vendors cannot pay for
            positive reviews or altered editorial outcomes.
          </p>
        </section>

        <hr />

        {/* 4. Software & Tool Recommendations */}
        <section aria-labelledby="recommendations-heading">
          <h2 id="recommendations-heading">4. Software &amp; Tool Recommendations</h2>
          <p>
            Are you a developer, startup founder, or avid user of an innovative software tool? We
            invite readers and creators to suggest AI tools, productivity platforms, developer
            utilities, and web applications for potential editorial evaluation.
          </p>
          <p>
            Please note that submitting a software recommendation does not guarantee coverage,
            positive reviews, or inclusion in our buyer guides. Every candidate product undergoes
            objective evaluation against our criteria for usefulness, reliability, pricing value,
            and reader relevance.
          </p>
        </section>

        <hr />

        {/* 5. Privacy & Communication Standards */}
        <section aria-labelledby="privacy-heading">
          <h2 id="privacy-heading">5. Privacy &amp; Communication Standards</h2>
          <p>We value your privacy and handle all submitted messages with professional care:</p>
          <ul>
            <li>
              <strong>Limited Use of Data:</strong> Information submitted through our contact form
              (including your name, email address, and message content) is used strictly to respond
              to your inquiry.
            </li>
            <li>
              <strong>No Spam Guarantee:</strong> Your email address will never be sold, rented, or
              added to marketing email lists without your explicit consent.
            </li>
            <li>
              <strong>Data Protection:</strong> Personal data is processed in full compliance with
              our privacy standards. For details, view our complete{' '}
              <Link
                href="/privacy-policy"
                className="text-primary-600 dark:text-primary-400 underline"
              >
                Privacy Policy
              </Link>
              .
            </li>
          </ul>
        </section>

        <hr />

        {/* 6. Learn More About Locitra (Trust Ecosystem) */}
        <section aria-labelledby="ecosystem-heading">
          <h2 id="ecosystem-heading">6. Learn More About Locitra</h2>
          <p>
            We invite readers to review our complete suite of publication policies and transparency
            documents:
          </p>
          <div className="not-prose my-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_PAGES.map((page) => (
              <div
                key={page.title}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
              >
                <h3 className="mb-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                  <Link href={page.href} className="hover:underline">
                    {page.title}
                  </Link>
                </h3>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {page.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <hr />

        {/* 7. Contact Page Maintenance */}
        <section aria-labelledby="maintenance-heading">
          <h2 id="maintenance-heading">7. Contact Information Maintenance</h2>
          <p>
            Our communication channels, response procedures, and support options are reviewed
            periodically to ensure reader messages are routed efficiently and handled
            professionally.
          </p>
          <p>
            This page is updated whenever contact procedures, email routing, or editorial office
            policies change.
          </p>
          <p>
            <em>Last reviewed: July 2026</em>
          </p>
        </section>

        <hr />

        {/* 8. Our Commitment to Communication */}
        <section aria-labelledby="commitment-heading">
          <h2 id="commitment-heading">8. Our Commitment to Communication</h2>
          <p>
            Locitra believes that open communication with our community is key to building a
            trustworthy, reader-first publication. We are committed to:
          </p>
          <ul>
            <li>
              Listening carefully to reader feedback, correction reports, and topic suggestions.
            </li>
            <li>
              Responding to legitimate inquiries in a prompt, professional, and respectful manner.
            </li>
            <li>
              Maintaining complete transparency across all commercial and editorial interactions.
            </li>
            <li>Continuously refining our digital publication based on real reader experiences.</li>
          </ul>
          <p>
            Thank you for engaging with Locitra and helping us maintain a high standard of digital
            publishing.
          </p>
        </section>
      </div>
    </div>
  )
}
