import { genPageMetadata } from 'app/seo'
import Link from '@/components/Link'

export const metadata = genPageMetadata({
  title: 'Service Delivery & Fulfillment Policy',
  description:
    'Locitra Service Delivery & Fulfillment Policy for paid Technical SEO troubleshooting services.',
  canonicalPath: '/service-delivery-policy',
})

export default function ServiceDeliveryPolicyPage() {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <div className="space-y-2 pt-6 pb-8 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Service Delivery &amp; Fulfillment Policy
        </h1>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Technical SEO Services &bull; Last reviewed: September 2026
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none pt-10 pb-12">
        <p className="lead">
          Locitra provides digital Technical SEO troubleshooting services. No physical goods are
          shipped. This policy explains how a paid Technical SEO service is activated, investigated,
          and delivered to the customer.
        </p>

        <section aria-labelledby="service-heading">
          <h2 id="service-heading">1. Service Covered</h2>
          <p>
            This policy applies to paid Technical SEO troubleshooting plans purchased through
            Locitra. The exact crawl limits, diagnostic scope, evidence collected, and report
            features depend on the plan selected at checkout.
          </p>
        </section>

        <hr />

        <section aria-labelledby="activation-heading">
          <h2 id="activation-heading">2. Service Activation</h2>
          <p>
            After a successful payment is confirmed by the applicable payment provider, Locitra
            creates or activates the associated technical investigation. The customer must provide a
            valid website URL and the information reasonably required to perform the selected
            investigation.
          </p>
          <p>
            A payment confirmation alone does not guarantee a particular SEO outcome. The service is
            an investigation and reporting service, not a promise of improved rankings, traffic,
            indexing, conversions, or revenue.
          </p>
        </section>

        <hr />

        <section aria-labelledby="delivery-heading">
          <h2 id="delivery-heading">3. Digital Service Delivery</h2>
          <p>
            The service is delivered electronically. Depending on the selected plan and workflow,
            delivery may include:
          </p>
          <ul>
            <li>Technical crawl and diagnostic analysis of the submitted website.</li>
            <li>Evidence and findings identified during the investigation.</li>
            <li>Prioritized technical SEO issues and recommended corrective actions.</li>
            <li>A written technical report or report access through Locitra.</li>
          </ul>
          <p>
            Customers should use the email address supplied during the purchase so Locitra can
            provide service notifications and report-related information.
          </p>
        </section>

        <hr />

        <section aria-labelledby="timing-heading">
          <h2 id="timing-heading">4. Processing and Delivery Timing</h2>
          <p>
            Technical investigations require processing time because Locitra may need to crawl
            pages, collect evidence, analyze technical signals, and prepare the report. Processing
            begins after payment and the required website information have been successfully
            received.
          </p>
          <p>
            Delivery timing can vary with website size, crawl accessibility, technical errors,
            robots.txt restrictions, third-party service availability, and the scope of the plan. If
            a technical issue prevents reasonable delivery, contact Locitra at{' '}
            <a href="mailto:contact@locitra.com?subject=Technical%20SEO%20Service%20Delivery">
              contact@locitra.com
            </a>
            .
          </p>
        </section>

        <hr />

        <section aria-labelledby="customer-heading">
          <h2 id="customer-heading">5. Customer Responsibilities</h2>
          <ul>
            <li>Submit a website URL that you are authorized to have analyzed.</li>
            <li>Provide accurate information needed to perform the selected service.</li>
            <li>
              Do not submit passwords, payment credentials, or unrelated sensitive information.
            </li>
            <li>
              Where an optional Google Search Console investigation is requested, provide only the
              authorization necessary for that diagnostic purpose.
            </li>
          </ul>
        </section>

        <hr />

        <section aria-labelledby="failed-heading">
          <h2 id="failed-heading">6. Failed or Incomplete Delivery</h2>
          <p>
            If a technical problem on the Locitra side prevents the purchased investigation from
            being reasonably delivered, contact support promptly. Depending on the circumstances,
            Locitra may retry the investigation, complete the missing deliverable, or provide a
            refund in accordance with the{' '}
            <Link
              href="/refund-policy"
              className="text-primary-600 dark:text-primary-400 underline"
            >
              Cancellation &amp; Refund Policy
            </Link>
            .
          </p>
        </section>

        <hr />

        <section aria-labelledby="support-heading">
          <h2 id="support-heading">7. Support</h2>
          <p>
            For payment, activation, delivery, cancellation, or report questions, contact Locitra at{' '}
            <a href="mailto:contact@locitra.com?subject=Technical%20SEO%20Service%20Support">
              contact@locitra.com
            </a>
            . You may also use the{' '}
            <Link href="/contact" className="text-primary-600 dark:text-primary-400 underline">
              Contact page
            </Link>
            .
          </p>
        </section>

        <hr />

        <section aria-labelledby="related-heading">
          <h2 id="related-heading">8. Related Policies</h2>
          <ul>
            <li>
              <Link href="/terms" className="hover:underline">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link href="/refund-policy" className="hover:underline">
                Cancellation &amp; Refund Policy
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:underline">
                Contact Locitra
              </Link>
            </li>
            <li>
              <Link href="/technical-seo" className="hover:underline">
                Technical SEO Troubleshooter
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
