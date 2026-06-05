import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({
  title: 'Terms & Conditions',
  description:
    'Terms and Conditions for using Locitra — your rights, responsibilities, and the rules that govern access to our website and content.',
  canonicalPath: '/terms',
})

export default function TermsPage() {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <div className="space-y-2 pt-6 pb-8 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Terms &amp; Conditions
        </h1>
        <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
          Last updated: June 5, 2026
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none pt-10 pb-8">
        <p>
          Please read these Terms and Conditions (&quot;Terms&quot;) carefully before using Locitra
          (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) at{' '}
          <a href="https://locitra.com">locitra.com</a>. By accessing or using the website, you
          agree to be bound by these Terms. If you do not agree, please do not use our website.
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By visiting or using Locitra, you confirm that you are at least 13 years of age and agree
          to comply with these Terms and Conditions and all applicable laws and regulations. These
          Terms apply to all visitors, readers, and users of the website.
        </p>

        <h2>2. Website Usage</h2>
        <p>
          Locitra grants you a limited, non-exclusive, non-transferable licence to access and use
          the website for personal, non-commercial purposes. You agree not to:
        </p>
        <ul>
          <li>
            Use the website in any way that violates applicable local, national, or international
            law or regulation.
          </li>
          <li>
            Reproduce, duplicate, copy, sell, or exploit any portion of the website without our
            express written permission.
          </li>
          <li>
            Transmit any unsolicited or unauthorised advertising or promotional material (spam).
          </li>
          <li>
            Attempt to gain unauthorised access to any part of the website or its related systems.
          </li>
          <li>
            Use automated tools (scrapers, bots, crawlers) to extract content without prior written
            consent.
          </li>
        </ul>

        <h2>3. Intellectual Property</h2>
        <p>
          All content on Locitra — including articles, graphics, logos, icons, and code — is the
          property of Locitra or its content creators, and is protected by applicable copyright and
          intellectual property laws.
        </p>
        <p>
          You may quote or reference our content for personal or educational use provided that you:
        </p>
        <ul>
          <li>Attribute the content to Locitra with a link back to the original article.</li>
          <li>Do not reproduce substantial portions of articles without written permission.</li>
          <li>Do not use our content in a way that misrepresents its original meaning.</li>
        </ul>
        <p>
          For permissions beyond fair use, please contact{' '}
          <a href="mailto:contact@locitra.com">contact@locitra.com</a>.
        </p>

        <h2>4. User Responsibilities</h2>
        <p>As a user of Locitra, you are responsible for:</p>
        <ul>
          <li>
            Ensuring that any information you provide to us (e.g., via email) is accurate and
            truthful.
          </li>
          <li>
            Using the website in a manner that does not infringe on the rights of others or
            interfere with the website&apos;s operation.
          </li>
          <li>
            Independently verifying any information before acting on it, especially in areas such as
            finance, career, technology, or income.
          </li>
        </ul>

        <h2>5. External Links</h2>
        <p>
          Locitra may contain links to third-party websites for your convenience and information.
          These links do not constitute an endorsement of those sites or their content. We have no
          control over, and assume no responsibility for, the content, privacy policies, or
          practices of any third-party websites.
        </p>
        <p>
          We encourage you to review the terms and privacy policies of any external sites you visit.
        </p>

        <h2>6. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, Locitra and its founder, editors, and contributors
          shall not be liable for any direct, indirect, incidental, consequential, or punitive
          damages arising from:
        </p>
        <ul>
          <li>Your use of, or inability to use, the website.</li>
          <li>Errors, omissions, or inaccuracies in the content.</li>
          <li>Any decisions made based on content published on this website.</li>
          <li>Unauthorised access to or alteration of your transmissions or data.</li>
        </ul>
        <p>
          The website is provided on an &quot;as is&quot; and &quot;as available&quot; basis without
          any warranties of any kind, either express or implied.
        </p>

        <h2>7. Changes to Terms</h2>
        <p>
          We reserve the right to update these Terms at any time. Changes will be effective
          immediately upon posting to this page with an updated &quot;Last updated&quot; date. Your
          continued use of the website after any changes constitutes your acceptance of the revised
          Terms.
        </p>
        <p>We encourage you to review these Terms periodically to stay informed of any updates.</p>

        <h2>8. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with applicable laws. Any
          disputes arising in connection with these Terms shall be subject to the exclusive
          jurisdiction of the courts applicable to the place of business of Locitra.
        </p>

        <h2>9. Contact Information</h2>
        <p>
          If you have questions, concerns, or requests relating to these Terms and Conditions,
          please contact us at:
        </p>
        <p>
          <strong>Locitra</strong>
          <br />
          Email: <a href="mailto:contact@locitra.com">contact@locitra.com</a>
          <br />
          Website: <a href="https://locitra.com">locitra.com</a>
        </p>
      </div>
    </div>
  )
}
