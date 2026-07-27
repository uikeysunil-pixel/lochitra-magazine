import { genPageMetadata } from 'app/seo'
import Link from '@/components/Link'

export const metadata = genPageMetadata({
  title: 'Terms & Conditions',
  description:
    'Locitra Terms & Conditions — website usage terms, intellectual property rules, acceptable use policy, external link disclosures, and publication governance.',
  canonicalPath: '/terms',
})

const PROHIBITED_ACTIVITIES = [
  {
    title: 'Unlawful Activity',
    description:
      'Violating local, national, or international laws, or transmitting illegal content.',
  },
  {
    title: 'Unauthorized Content Scraping',
    description:
      'Using automated bots, scrapers, or AI bots to extract or republish content without permission.',
  },
  {
    title: 'System Interference',
    description:
      'Attempting to compromise security, bypass access controls, or overload site infrastructure.',
  },
  {
    title: 'Abusive Communication',
    description:
      'Transmitting unsolicited promotional material (spam) or harassing messages via contact forms.',
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
    title: 'Contact Page',
    href: '/contact',
    description:
      'Direct communication channels for reader inquiries, feedback, and error reporting.',
  },
]

export default function TermsPage() {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {/* Page Header */}
      <div className="space-y-2 pt-6 pb-8 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Terms &amp; Conditions
        </h1>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Publication Governance &amp; Terms of Service &bull; Last reviewed: July 2026
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none pt-10 pb-12">
        {/* Introduction */}
        <p className="lead">
          Welcome to Locitra. These Terms &amp; Conditions (&quot;Terms&quot;) define the legal and
          operational framework governing how readers, visitors, and partners access, browse, and
          interact with Locitra (locitra.com) and its published content. These Terms establish rules
          for acceptable website usage, intellectual property rights, user communications, and the
          relationship between Locitra and its audience. By accessing or using our website, you
          acknowledge that you have read, understood, and agreed to be bound by these Terms.
        </p>

        {/* 1. Acceptance of Terms & Linked Policies */}
        <section aria-labelledby="acceptance-heading">
          <h2 id="acceptance-heading">1. Acceptance of Terms &amp; Linked Policies</h2>
          <p>
            By visiting, reading, or navigating Locitra, you confirm that you agree to comply with
            these Terms and all applicable laws and regulations. If you do not agree with any part
            of these Terms, please discontinue your use of our website.
          </p>
          <p>These Terms operate in harmony with our suite of publication governance documents:</p>
          <ul>
            <li>
              <Link
                href="/privacy-policy"
                className="text-primary-600 dark:text-primary-400 underline"
              >
                Privacy Policy
              </Link>{' '}
              — Governs how we collect, handle, and protect reader data and cookie preferences.
            </li>
            <li>
              <Link href="/disclaimer" className="text-primary-600 dark:text-primary-400 underline">
                Disclaimer &amp; Affiliate Disclosure
              </Link>{' '}
              — Governs affiliate referral links, advertising, AI drafting rules, and advice
              limitations.
            </li>
            <li>
              <Link
                href="/editorial-policy"
                className="text-primary-600 dark:text-primary-400 underline"
              >
                Editorial Policy
              </Link>{' '}
              — Defines our research methodology, fact-checking criteria, and sources policy.
            </li>
          </ul>
        </section>

        <hr />

        {/* 2. Acceptable Use Policy */}
        <section aria-labelledby="use-heading">
          <h2 id="use-heading">2. Acceptable Use Policy</h2>
          <p>
            Locitra grants visitors a limited, revocable, non-exclusive, non-transferable licence to
            access and view our website for personal, educational, and non-commercial purposes.
          </p>
          <p>When accessing Locitra, you agree not to engage in prohibited activities:</p>
          <div className="not-prose my-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PROHIBITED_ACTIVITIES.map((activity) => (
              <div
                key={activity.title}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
              >
                <h3 className="mb-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                  {activity.title}
                </h3>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {activity.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <hr />

        {/* 3. Intellectual Property Rights & Fair Use */}
        <section aria-labelledby="ip-heading">
          <h2 id="ip-heading">3. Intellectual Property Rights &amp; Fair Use</h2>
          <p>
            All original content published on Locitra — including articles, tutorials, research
            reports, graphics, logos, typography arrangements, and custom website code — is the
            intellectual property of Locitra and its founder, Sunil Kumar Uikey, protected by
            copyright and intellectual property laws.
          </p>
          <p>
            <strong>Fair Use &amp; Attribution Rules:</strong> You are welcome to quote, excerpt, or
            reference short passages from our articles for educational, analytical, or discussion
            purposes provided that you:
          </p>
          <ul>
            <li>
              Explicitly attribute the content to <strong>Locitra</strong>.
            </li>
            <li>
              Include a direct, functional hyperlink back to the original article URL on
              locitra.com.
            </li>
            <li>
              Do not alter or distort the original meaning, context, or conclusions of the article.
            </li>
            <li>
              Do not reproduce full-text articles or substantial portions without prior written
              authorization.
            </li>
          </ul>
          <p>
            For syndication, republication, or permissions beyond standard fair use, please submit
            an inquiry to{' '}
            <a
              href="mailto:contact@locitra.com?subject=Permissions%20Inquiry"
              aria-label="Email Locitra Permissions Inquiry"
              className="hover:underline"
            >
              contact@locitra.com
            </a>
            .
          </p>
        </section>

        <hr />

        {/* 4. Editorial Content & Publication Governance */}
        <section aria-labelledby="editorial-heading">
          <h2 id="editorial-heading">4. Editorial Content &amp; Publication Governance</h2>
          <p>
            Articles published on Locitra are created for general informational, educational, and
            analytical purposes. While our team follows rigorous research and verification
            procedures:
          </p>
          <ul>
            <li>
              <strong>No Professional Advice:</strong> Content does not constitute legal, financial,
              investment, tax, medical, or certified career counseling. Consult qualified
              professionals for specific advice.
            </li>
            <li>
              <strong>Research Methodology:</strong> Content research, fact-checking, and AI
              drafting limits are defined in our{' '}
              <Link
                href="/editorial-policy"
                className="text-primary-600 dark:text-primary-400 underline"
              >
                Editorial Policy
              </Link>
              .
            </li>
            <li>
              <strong>Commercial Independence:</strong> Affiliate links and ad placements do not
              influence editorial scores or recommendations, as detailed in our{' '}
              <Link href="/disclaimer" className="text-primary-600 dark:text-primary-400 underline">
                Disclaimer &amp; Affiliate Disclosure
              </Link>
              .
            </li>
          </ul>
        </section>

        <hr />

        {/* 5. Reader Communication & Submissions */}
        <section aria-labelledby="communication-heading">
          <h2 id="communication-heading">5. Reader Communication &amp; Submissions</h2>
          <p>
            When contacting Locitra via our contact form, direct email, or correction reporting
            channels:
          </p>
          <ul>
            <li>
              <strong>Truthful Submissions:</strong> You agree to provide accurate contact
              information and communicate in good faith.
            </li>
            <li>
              <strong>Prohibited Content:</strong> Messages containing abusive, defamatory, obscene,
              or unlawful language will be filtered and discarded.
            </li>
            <li>
              <strong>Voluntary Feedback:</strong> Suggestions, feedback, or software
              recommendations submitted to Locitra are provided voluntarily without expectation of
              monetary compensation or guaranteed editorial coverage.
            </li>
          </ul>
        </section>

        <hr />

        {/* 6. External Links & Third-Party Resources */}
        <section aria-labelledby="links-heading">
          <h2 id="links-heading">6. External Links &amp; Third-Party Resources</h2>
          <p>
            Locitra contains links to third-party websites, software portals, and reference sources
            for reader convenience and attribution.
          </p>
          <p>
            <strong>No Endorsement or Responsibility:</strong> Locitra does not control, operate, or
            guarantee the content, safety, or availability of third-party websites. Inclusion of an
            external link does not imply endorsement. Readers accessing external websites do so at
            their own risk and are bound by the terms and policies of those respective sites.
          </p>
        </section>

        <hr />

        {/* 7. Limitation of Liability & Warranty Disclaimer */}
        <section aria-labelledby="liability-heading">
          <h2 id="liability-heading">7. Limitation of Liability &amp; Warranty Disclaimer</h2>
          <p>
            Locitra is provided on an &quot;as is&quot; and &quot;as available&quot; basis without
            warranties of any kind, express or implied, including fitness for a particular purpose
            or non-infringement.
          </p>
          <p>
            To the fullest extent permitted by law, Locitra, its founder, editors, and contributors
            shall not be liable for any direct, indirect, incidental, consequential, or punitive
            damages arising from your access to, use of, or reliance upon information published on
            this website.
          </p>
        </section>

        <hr />

        {/* 8. Website Modifications & Technical Evolution */}
        <section aria-labelledby="modifications-heading">
          <h2 id="modifications-heading">8. Website Modifications &amp; Technical Evolution</h2>
          <p>
            Technology, web standards, and digital publishing practices evolve continuously. Locitra
            reserves the right to modify, update, suspend, or discontinue any feature, content, or
            section of the website at any time without prior notice.
          </p>
        </section>

        <hr />

        {/* 9. Policy Maintenance & Updates */}
        <section aria-labelledby="maintenance-heading">
          <h2 id="maintenance-heading">9. Policy Maintenance &amp; Updates</h2>
          <p>
            These Terms are reviewed periodically to reflect operational changes, legal
            developments, regulatory guidelines, and publication standards.
          </p>
          <p>
            When updates occur, the revised Terms will be posted to this page with an updated
            &quot;Last reviewed&quot; date. Continued use of Locitra after posting constitutes
            acceptance of the revised Terms.
          </p>
          <p>
            <em>Last reviewed: July 2026</em>
          </p>
        </section>

        <hr />

        {/* 10. Learn More About Locitra (Trust Ecosystem) */}
        <section aria-labelledby="ecosystem-heading">
          <h2 id="ecosystem-heading">10. Learn More About Locitra</h2>
          <p>
            We invite readers to review our complete suite of transparency and publication
            governance pages:
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

        {/* 11. Our Commitment to Fair Use & Transparency */}
        <section aria-labelledby="commitment-heading">
          <h2 id="commitment-heading">11. Our Commitment to Fair Use &amp; Transparency</h2>
          <p>
            Locitra is committed to operating a safe, transparent, and respectful digital
            publication. We are dedicated to:
          </p>
          <ul>
            <li>Protecting reader rights and respecting intellectual property.</li>
            <li>Enforcing fair, clear, and practical terms of service.</li>
            <li>Maintaining open communication and responsive error handling.</li>
            <li>
              Continuously improving our platform for digital creators and technology enthusiasts.
            </li>
          </ul>
          <p>
            Thank you for being a valued reader of Locitra. For questions regarding these Terms,
            contact us at{' '}
            <a
              href="mailto:contact@locitra.com?subject=Terms%20Inquiry"
              aria-label="Email Locitra Terms Inquiry"
              className="hover:underline"
            >
              contact@locitra.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
