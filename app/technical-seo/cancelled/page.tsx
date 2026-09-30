import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'PayPal Checkout Cancelled | Locitra',
  description: 'PayPal checkout was cancelled. No payment was captured.',
  robots: {
    index: false,
    follow: false,
  },
}

type PlanType = 'quick' | 'full' | 'deep'

interface PlanDetails {
  name: string
  price: string
}

const PLAN_DETAILS: Record<PlanType, PlanDetails> = {
  quick: {
    name: 'Targeted Troubleshoot',
    price: '$49',
  },
  full: {
    name: 'Full Troubleshoot',
    price: '$99',
  },
  deep: {
    name: 'Deep Investigation',
    price: '$199',
  },
}

interface PayPalCancelledPageProps {
  searchParams?: Promise<{ plan?: string }>
}

export default async function PayPalCancelledPage(props: PayPalCancelledPageProps) {
  const resolvedParams = props.searchParams ? await props.searchParams : undefined
  const planParam = resolvedParams?.plan
  const planKey: PlanType = planParam === 'deep' ? 'deep' : planParam === 'full' ? 'full' : 'quick'
  const plan = PLAN_DETAILS[planKey]

  return (
    <div className="pt-8 pb-16 sm:pt-12">
      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <section className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <p className="text-primary-600 dark:text-primary-400 text-xs font-bold tracking-[0.18em] uppercase">
            Locitra Technical SEO
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            PayPal checkout was cancelled
          </h1>
          <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400">
            No payment was captured. You can return to Technical SEO and try the {plan.price}{' '}
            {plan.name} again.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/technical-seo/"
              className="inline-flex rounded-full bg-gray-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Try the {plan.price} {plan.name}
            </Link>
            <Link
              href="/"
              className="inline-flex rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-900"
            >
              Return to Locitra
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
