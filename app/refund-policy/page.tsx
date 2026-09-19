import { genPageMetadata } from 'app/seo'
import Link from '@/components/Link'

export const metadata = genPageMetadata({
  title: 'Cancellation & Refund Policy',
  description:
    'Locitra Cancellation & Refund Policy for Technical SEO troubleshooting services, including eligibility, cancellations, report delivery, and refund processing.',
  canonicalPath: '/refund-policy',
})

const POLICY_LINKS = [
  {
    title: 'Technical SEO Service',
    href: '/technical-seo',
    description: 'Review the Technical SEO troubleshooting service and available plans.',
  },
  {
    title: 'Terms & Conditions',
    href: '/terms',
    description: 'Read the general terms that govern use of Locitra and its services.',
  },
  {
    title: 'Privacy Policy',
    href: '/privacy-policy',
    description: 'Learn how Locitra handles personal information and privacy requests.',
  },
  {
    title: 'Contact Locitra',
    href: '/contact',
    description: 'Contact us for support, cancellation requests, or refund questions.',
  },
]

export default function RefundPolicyPage() {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <div className="space-y-2 pt-6 pb-8 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Cancellation &amp; Refund Policy
        </h1>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Technical SEO Troubleshooting Services &bull; Last reviewed: September 2026
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none pt-10 pb-12">
        <p className="lead">
          This Cancellation &amp; Refund Policy explains when a customer may cancel a Locitra
          Technical SEO troubleshooting service and when a refund may be available. It applies to
          one-time paid technical SEO investigations purchased through the Locitra website.
        </p>

        <section aria-labelledby="service-heading">
          <h2 id="service-heading">1. Service Covered by This Policy</h2>
          <p>
            This policy currently applies to the paid{' '}
            <strong>Targeted Technical SEO Troubleshoot</strong> service, which provides a focused
            technical investigation of a customer-provided website together with evidence,
            affected-page information, and prioritized recommendations.
          </p>
          <p>
            Service scope is determined by the plan and diagnostic path selected at checkout. The
            service is not a guarantee of search-engine rankings, traffic increases, indexing
            outcomes, or specific business results.
          </p>
        </section>

        <hr />

        <section aria-labelledby="cancellation-heading">
          <h2 id="cancellation-heading">2. Cancellation Before Investigation Starts</h2>
          <p>
            A customer may request cancellation after payment but before Locitra has started the
            technical investigation.
          </p>
          <p>
            Where the investigation has not started, Locitra will normally issue a full refund to
            the original payment method used for the transaction.
          </p>
          <p>
            Cancellation requests should be sent to{' '}
            <a
              href="mailto:contact@locitra.com?subject=Technical%20SEO%20Cancellation%20Request"
              className="hover:underline"
            >
              contact@locitra.com
            </a>{' '}
            with the email address used for the purchase and, where available, the order or report
            reference.
          </p>
        </section>

        <hr />

        <section aria-labelledby="started-heading">
          <h2 id="started-heading">3. Refunds After Investigation Begins</h2>
          <p>
            Once Locitra has started the paid investigation, resources may have been committed to
            crawling, analysing, storing evidence, and preparing the report. For that reason,
            payments are generally <strong>non-refundable after investigation has begun</strong>.
          </p>
          <p>
            This does not prevent a refund where required by applicable law, where a duplicate
            payment was collected, or where Locitra determines that a refund is appropriate because
            the paid service could not reasonably be delivered.
          </p>
        </section>

        <hr />

        <section aria-labelledby="technical-heading">
          <h2 id="technical-heading">4. Technical Problems and Failed Delivery</h2>
          <p>
            If a technical problem on the Locitra side prevents the paid investigation from being
            delivered, please contact us so we can investigate the transaction and the affected
            report.
          </p>
          <p>
            Depending on the circumstances, Locitra may retry the service, provide the missing
            deliverable, or issue a full or partial refund. Any refund decision will take into
            account whether the service was successfully delivered and how much of the investigation
            had already been completed.
          </p>
        </section>

        <hr />

        <section aria-labelledby="duplicate-heading">
          <h2 id="duplicate-heading">5. Duplicate or Accidental Payments</h2>
          <p>
            If you believe you were charged more than once for the same Technical SEO investigation,
            contact us promptly at{' '}
            <a
              href="mailto:contact@locitra.com?subject=Duplicate%20Payment%20Request"
              className="hover:underline"
            >
              contact@locitra.com
            </a>
            . After verifying the transaction, duplicate charges may be refunded to the original
            payment method.
          </p>
        </section>

        <hr />

        <section aria-labelledby="scope-heading">
          <h2 id="scope-heading">6. Changes to Scope or Customer Information</h2>
          <p>
            Customers are responsible for providing an accurate website URL and selecting the
            appropriate diagnostic path at checkout. A change in the selected website or diagnostic
            concern after investigation has started may require a new investigation or an additional
            purchase.
          </p>
          <p>
            Changing your mind about the selected website after work has started does not by itself
            create a refund entitlement.
          </p>
        </section>

        <hr />

        <section aria-labelledby="process-heading">
          <h2 id="process-heading">7. How to Request a Cancellation or Refund</h2>
          <p>To request a cancellation or refund, email:</p>
          <p>
            <strong>
              <a
                href="mailto:contact@locitra.com?subject=Technical%20SEO%20Refund%20Request"
                className="hover:underline"
              >
                contact@locitra.com
              </a>
            </strong>
          </p>
          <p>
            Please include the purchase email address, the website submitted for investigation, and
            the relevant report, order, or transaction reference when available. We may request
            additional information needed to locate and verify the payment.
          </p>
        </section>

        <hr />

        <section aria-labelledby="processing-heading">
          <h2 id="processing-heading">8. Refund Processing</h2>
          <p>
            Approved refunds are sent back to the original payment method used for the transaction.
            The time for the refund to appear in a customer&apos;s account depends on the payment
            provider and the customer&apos;s financial institution.
          </p>
          <p>
            Locitra cannot control the final posting time after a refund has been submitted to the
            payment provider.
          </p>
        </section>

        <hr />

        <section aria-labelledby="consumer-heading">
          <h2 id="consumer-heading">9. Consumer Rights</h2>
          <p>
            Nothing in this policy is intended to remove or limit rights that cannot lawfully be
            excluded or restricted under applicable consumer-protection or other mandatory laws.
          </p>
        </section>

        <hr />

        <section aria-labelledby="updates-heading">
          <h2 id="updates-heading">10. Policy Updates</h2>
          <p>
            Locitra may update this policy when the service, payment process, or applicable
            requirements change. The current version will remain available at this URL, together
            with an updated review date.
          </p>
          <p>
            <em>Last reviewed: September 2026</em>
          </p>
        </section>

        <hr />

        <section aria-labelledby="related-heading">
          <h2 id="related-heading">11. Related Locitra Pages</h2>
          <div className="not-prose my-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {POLICY_LINKS.map((page) => (
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

        <section aria-labelledby="contact-note-heading">
          <h2 id="contact-note-heading">12. Contact</h2>
          <p>
            For cancellation, refund, or service-delivery questions, contact Locitra at{' '}
            <a
              href="mailto:contact@locitra.com?subject=Technical%20SEO%20Support"
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
