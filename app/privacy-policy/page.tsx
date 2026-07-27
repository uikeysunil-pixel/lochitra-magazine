import { genPageMetadata } from 'app/seo'
import Link from '@/components/Link'

export const metadata = genPageMetadata({
  title: 'Privacy Policy',
  description:
    'Locitra Privacy Policy — how we collect, process, manage, and safeguard reader information with complete transparency.',
  canonicalPath: '/privacy-policy',
})

const DATA_CATEGORIES = [
  {
    title: 'Information You Provide Voluntarily',
    description:
      'Name, email address, subject, and message content submitted through our contact form or direct email.',
  },
  {
    title: 'Information Collected Automatically',
    description:
      'Aggregated technical usage data such as IP address, browser type, device model, operating system, and pages viewed.',
  },
  {
    title: 'Cookies & Local Storage',
    description:
      'Small text files stored on your browser to support site navigation, analytics measurements, and ad preferences.',
  },
]

const COOKIE_CATEGORIES = [
  {
    title: 'Essential Cookies',
    description:
      'Necessary for core website security, page routing, theme preferences, and functional performance.',
  },
  {
    title: 'Analytics Cookies',
    description:
      'Measure aggregated reader traffic, popular articles, session duration, and navigation patterns.',
  },
  {
    title: 'Advertising Cookies',
    description:
      'Utilized by ad networks (such as Google AdSense) to display relevant ads and prevent repetitive ad delivery.',
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
    title: 'Terms & Conditions',
    href: '/terms',
    description: 'Terms governing website access, content usage, and intellectual property.',
  },
  {
    title: 'Contact Page',
    href: '/contact',
    description:
      'Direct communication channels for reader inquiries, feedback, and error reporting.',
  },
]

export default function PrivacyPolicyPage() {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {/* Page Header */}
      <div className="space-y-2 pt-6 pb-8 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Privacy Policy
        </h1>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Reader Privacy Governance &amp; Data Protection &bull; Last reviewed: July 2026
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none pt-10 pb-12">
        {/* Introduction */}
        <p className="lead">
          At Locitra (locitra.com), we respect reader privacy and are committed to responsible data
          stewardship. This Privacy Policy explains how we collect, process, manage, and safeguard
          information when you visit our publication. Our goal is to provide total transparency
          regarding our privacy practices so readers understand how their data is handled while
          accessing our technology guides, software reviews, and industry insights.
        </p>

        {/* 1. Information We Collect */}
        <section aria-labelledby="collection-heading">
          <h2 id="collection-heading">1. Information We Collect</h2>
          <p>
            Locitra collects information to deliver a secure, responsive, and high-quality
            publishing experience. We categorize collected information into three primary areas:
          </p>
          <div className="not-prose my-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {DATA_CATEGORIES.map((category) => (
              <div
                key={category.title}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
              >
                <h3 className="mb-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                  {category.title}
                </h3>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {category.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <hr />

        {/* 2. How We Use Information */}
        <section aria-labelledby="usage-heading">
          <h2 id="usage-heading">2. How We Use Information</h2>
          <p>We process information exclusively for legitimate publication purposes, including:</p>
          <ul>
            <li>
              <strong>Website Functionality:</strong> Maintaining fast page rendering, HTTPS
              security, theme preferences, and site navigation.
            </li>
            <li>
              <strong>Content Optimization:</strong> Analyzing reader engagement trends and popular
              topics to improve future articles and tutorials.
            </li>
            <li>
              <strong>Responding to Inquiries:</strong> Processing communications submitted via our
              contact forms, direct email, or correction requests.
            </li>
            <li>
              <strong>Security &amp; Fraud Prevention:</strong> Protecting website infrastructure
              against malicious traffic, bot spam, and unauthorized access.
            </li>
            <li>
              <strong>Legal Compliance:</strong> Fulfilling applicable regulatory obligations and
              enforcing our website terms.
            </li>
          </ul>
        </section>

        <hr />

        {/* 3. Contact Form & Email Communications */}
        <section aria-labelledby="contact-heading">
          <h2 id="contact-heading">3. Contact Form &amp; Email Communications</h2>
          <p>When you communicate with Locitra using our contact form or direct email:</p>
          <ul>
            <li>
              <strong>Limited Purpose:</strong> Submitted information (name, email address, subject,
              message body) is used solely to respond to your specific inquiry.
            </li>
            <li>
              <strong>Confidentiality:</strong> Your contact details are never sold, rented, or
              shared with third-party marketers without consent.
            </li>
            <li>
              <strong>Sensitive Data Notice:</strong> Please do not submit confidential financial
              data, passwords, or sensitive personal identifiers through web contact forms.
            </li>
          </ul>
          <p>
            For more details on reader communication, review our{' '}
            <Link href="/contact" className="text-primary-600 dark:text-primary-400 underline">
              Contact Page
            </Link>
            .
          </p>
        </section>

        <hr />

        {/* 4. Third-Party Services & Analytics */}
        <section aria-labelledby="services-heading">
          <h2 id="services-heading">4. Third-Party Services &amp; Analytics</h2>
          <p>
            Locitra partners with established third-party service providers for analytics and
            advertising infrastructure. These services operate under their own independent privacy
            policies:
          </p>
          <ul>
            <li>
              <strong>Google Analytics:</strong> We use Google Analytics to collect aggregated,
              anonymized technical metrics (such as pages visited, country-level location, browser
              type, and session duration) to understand reader navigation patterns.
            </li>
            <li>
              <strong>Google AdSense &amp; Advertising Networks:</strong> Locitra displays
              non-intrusive advertisements. Third-party ad vendors, including Google, use cookies to
              serve ads based on prior visits to our website or other sites on the internet.
            </li>
          </ul>
          <p>
            We do not sell personal data to third-party data brokers. For full financial
            transparency, view our{' '}
            <Link href="/disclaimer" className="text-primary-600 dark:text-primary-400 underline">
              Disclaimer &amp; Affiliate Disclosure
            </Link>
            .
          </p>
        </section>

        <hr />

        {/* 5. Cookie Policy & Categories */}
        <section aria-labelledby="cookies-heading">
          <h2 id="cookies-heading">5. Cookie Policy &amp; Categories</h2>
          <p>
            Cookies are small text files placed on your browser to store preferences and technical
            information. Locitra categorizes cookies into three main types:
          </p>
          <div className="not-prose my-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {COOKIE_CATEGORIES.map((cookie) => (
              <div
                key={cookie.title}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
              >
                <h3 className="mb-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                  {cookie.title}
                </h3>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {cookie.description}
                </p>
              </div>
            ))}
          </div>
          <p>
            <strong>Browser Controls:</strong> Most web browsers allow you to modify cookie settings
            to block, alert, or delete cookies. However, disabling essential cookies may impact
            website display or functionality.
          </p>
        </section>

        <hr />

        {/* 6. Your Privacy Choices & Data Rights */}
        <section aria-labelledby="choices-heading">
          <h2 id="choices-heading">6. Your Privacy Choices &amp; Data Rights</h2>
          <p>We empower readers to control their privacy preferences through multiple channels:</p>
          <ul>
            <li>
              <strong>Analytics Opt-Out:</strong> You can opt out of Google Analytics data
              collection across all websites by installing the official{' '}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Google Analytics Opt-out Browser Add-on
              </a>
              .
            </li>
            <li>
              <strong>Ad Personalization Control:</strong> Customize or opt out of personalized
              advertising by visiting{' '}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Google Ad Settings
              </a>{' '}
              or{' '}
              <a
                href="https://optout.aboutads.info/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                AboutAds.info
              </a>
              .
            </li>
            <li>
              <strong>GDPR &amp; Regional Rights:</strong> Readers in the European Economic Area
              (EEA), United Kingdom, or applicable jurisdictions possess data rights including
              access, rectification, erasure, and processing objections. Contact us at{' '}
              <a
                href="mailto:contact@locitra.com?subject=Privacy%20Data%20Request"
                aria-label="Email Locitra Privacy Data Request"
                className="hover:underline"
              >
                contact@locitra.com
              </a>{' '}
              to submit a data request.
            </li>
          </ul>
        </section>

        <hr />

        {/* 7. Data Security & Technical Safeguards */}
        <section aria-labelledby="security-heading">
          <h2 id="security-heading">7. Data Security &amp; Technical Safeguards</h2>
          <p>
            Locitra implements reasonable administrative, technical, and physical safeguards to
            protect reader data against unauthorized access, disclosure, or alteration:
          </p>
          <ul>
            <li>HTTPS / TLS encryption across all website pages and forms.</li>
            <li>Secure hosting infrastructure and access control protocols.</li>
            <li>Routine security updates and code vulnerability monitoring.</li>
          </ul>
          <p>
            <em>Security Disclaimer:</em> While we implement robust safeguards, no method of
            transmission over the internet or electronic storage is 100% secure. Absolute security
            cannot be guaranteed.
          </p>
        </section>

        <hr />

        {/* 8. Policy Maintenance & Updates */}
        <section aria-labelledby="maintenance-heading">
          <h2 id="maintenance-heading">8. Policy Maintenance &amp; Updates</h2>
          <p>
            This Privacy Policy is periodically reviewed to reflect operational refinements,
            technology changes, legal developments, and publishing standards.
          </p>
          <p>
            When updates occur, the revised policy will be posted on this page with an updated
            &quot;Last reviewed&quot; date.
          </p>
          <p>
            <em>Last reviewed: July 2026</em>
          </p>
        </section>

        <hr />

        {/* 9. Learn More About Locitra (Trust Ecosystem) */}
        <section aria-labelledby="ecosystem-heading">
          <h2 id="ecosystem-heading">9. Learn More About Locitra</h2>
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

        {/* 10. Our Commitment to Privacy */}
        <section aria-labelledby="commitment-heading">
          <h2 id="commitment-heading">10. Our Commitment to Privacy</h2>
          <p>
            Locitra is dedicated to respecting reader privacy, handling data responsibly,
            maintaining transparent communication, and continually earning community trust.
          </p>
          <p>
            For any privacy inquiries or feedback, please contact us at{' '}
            <a
              href="mailto:contact@locitra.com?subject=Privacy%20Inquiry"
              aria-label="Email Locitra Privacy Inquiry"
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
