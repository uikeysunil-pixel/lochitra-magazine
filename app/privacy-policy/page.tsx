import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({
  title: 'Privacy Policy',
  description: 'Lochitra Privacy Policy — how we collect, use, and protect your information.',
})

export default function PrivacyPolicyPage() {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <div className="space-y-2 pt-6 pb-8 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Privacy Policy
        </h1>
        <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
          Last updated: June 1, 2026
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none pt-10 pb-8">
        <p>
          Welcome to Lochitra (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). We are committed
          to protecting your personal information and your right to privacy. This Privacy Policy
          explains how we collect, use, and safeguard your information when you visit{' '}
          <a href="https://lochitra.com">lochitra.com</a>.
        </p>

        <h2>1. Information We Collect</h2>
        <p>We may collect the following types of information:</p>
        <ul>
          <li>
            <strong>Usage Data:</strong> Pages visited, time spent, browser type, device type, and
            referring URLs collected automatically via analytics tools.
          </li>
          <li>
            <strong>Cookies:</strong> Small data files placed on your device for functionality and
            analytics purposes.
          </li>
          <li>
            <strong>Contact Information:</strong> Your name and email address if you contact us
            voluntarily via email.
          </li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Operate and improve the Lochitra website and content</li>
          <li>Analyze traffic and understand our audience</li>
          <li>Respond to inquiries and feedback</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h2>3. Third-Party Services</h2>
        <p>
          We may use third-party services including but not limited to analytics platforms and
          advertising networks. These services have their own privacy policies and may collect data
          independently. We do not sell your personal information to any third party.
        </p>

        <h2>4. Cookies</h2>
        <p>
          You can instruct your browser to refuse all cookies or to indicate when a cookie is being
          sent. However, if you do not accept cookies, some portions of our site may not function
          properly.
        </p>

        <h2>5. Links to Other Sites</h2>
        <p>
          Lochitra may contain links to external websites. We are not responsible for the privacy
          practices or content of those sites and encourage you to review their privacy policies.
        </p>

        <h2>6. Children&apos;s Privacy</h2>
        <p>
          Our website is not directed to children under 13. We do not knowingly collect personal
          information from children under 13.
        </p>

        <h2>7. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by
          posting the new policy on this page with an updated date.
        </p>

        <h2>8. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, please contact us at{' '}
          <a href="mailto:contact@lochitra.com">contact@lochitra.com</a>.
        </p>
      </div>
    </div>
  )
}
