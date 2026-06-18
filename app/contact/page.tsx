import { genPageMetadata } from 'app/seo'
import ContactForm from '@/components/ContactForm'

export const metadata = genPageMetadata({
  title: 'Contact Locitra',
  description:
    'Contact Locitra for questions, feedback, software recommendations, partnerships, and business inquiries.',
})

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl divide-y divide-gray-200 pt-10 dark:divide-gray-700">
      {/* SECTION A: Hero */}
      <div className="space-y-4 pb-12 text-center md:space-y-6 md:pb-16">
        <h1 className="text-4xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-5xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Contact Locitra
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-7 text-gray-500 dark:text-gray-400">
          Have a question, partnership inquiry, software recommendation, or feedback?
          <br />
          We&apos;d love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12 pt-12 lg:grid-cols-3">
        {/* SECTION B: Contact Form */}
        <div className="lg:col-span-2">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Send a Message
          </h2>
          <ContactForm />
        </div>

        {/* SECTION C & D: Direct Contact & Response Expectations */}
        <div className="space-y-10">
          <div>
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
              Direct Contact
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Prefer to email us directly? You can reach us at:
            </p>
            <div className="mt-3">
              <a
                href="mailto:contact@locitra.com"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center gap-2 font-semibold transition-colors"
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
              What to Expect
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
                  Typically responds within <strong>24–48 hours</strong>
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
                <span>Partnership inquiries welcome</span>
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
                <span>Software review suggestions accepted</span>
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
                <span>Reader feedback appreciated</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
