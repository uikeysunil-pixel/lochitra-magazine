import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Checkout Cancelled | Locitra',
  description: 'Checkout was cancelled. No payment was captured.',
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

interface CheckoutCancelledPageProps {
  searchParams?: Promise<{
    plan?: string
    scanId?: string
    key?: string
    provider?: string
    currency?: string
  }>
}

export default async function CheckoutCancelledPage(props: PayPalCancelledPageProps) {
  const resolvedParams = props.searchParams ? await props.searchParams : undefined
  const planParam = resolvedParams?.plan
  const scanId = resolvedParams?.scanId?.trim()
  const key = resolvedParams?.key?.trim()
  const planKey: PlanType = planParam === 'deep' ? 'deep' : planParam === 'full' ? 'full' : 'quick'
  const plan = PLAN_DETAILS[planKey]
  const isStripe = resolvedParams?.provider === 'stripe' || resolvedParams?.currency === 'inr'
  const displayPrice = isStripe && planKey === 'quick' ? '₹4,999' : plan.price
  const providerName = isStripe ? 'Stripe' : 'PayPal'
  const hasScanContext = planKey === 'deep' && Boolean(scanId && key)

  return (
    <div className="pt-8 pb-16 sm:pt-12">
      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <section className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <p className="text-primary-600 dark:text-primary-400 text-xs font-bold tracking-[0.18em] uppercase">
            Locitra Technical SEO
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            {providerName} checkout was cancelled
          </h1>
          <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400">
            No payment was captured.{' '}
            {hasScanContext
              ? `You can return to your scan to try ${providerName} checkout again whenever you are ready.`
              : `You can return to Technical SEO and try the ${displayPrice} ${plan.name} again.`}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {hasScanContext ? (
              <>
                <Link
                  href={`/technical-seo/scan/${scanId}/?key=${encodeURIComponent(key!)}`}
                  className="inline-flex rounded-full bg-gray-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                >
                  Return to your Deep Investigation Scan
                </Link>
                <Link
                  href="/technical-seo/"
                  className="inline-flex rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-900"
                >
                  Run another scan
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/technical-seo/"
                  className="inline-flex rounded-full bg-gray-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                >
                  Try the {displayPrice} {plan.name}
                </Link>
                <Link
                  href="/"
                  className="inline-flex rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-900"
                >
                  Return to Locitra
                </Link>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
