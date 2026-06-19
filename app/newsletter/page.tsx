import React from 'react'
import { Metadata } from 'next'
import Link from '@/components/Link'
import NewsletterHubForm from '@/components/NewsletterHubForm'
import NewsletterPageView from '@/components/NewsletterPageView'

export const metadata: Metadata = {
  title: 'Locitra Newsletter | AI Tools, Software Reviews & Online Income Insights',
  description:
    'Join the Locitra newsletter and get weekly AI tools, software reviews, online income strategies, technology trends, and exclusive resources delivered to your inbox.',
  alternates: {
    canonical: './',
  },
}

export default function NewsletterPage() {
  return (
    <>
      <NewsletterPageView />

      {/* SECTION 1: HERO */}
      <section className="relative overflow-hidden bg-white px-4 pt-20 pb-24 sm:px-6 lg:px-8 dark:bg-gray-950">
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          ></div>
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl leading-tight font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl dark:text-white">
            Stay Ahead with AI, Software &amp; Online Income Insights
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl dark:text-gray-300">
            Join thousands of readers discovering the best AI tools, software reviews, technology
            trends, and online income opportunities.
          </p>

          <div className="relative mx-auto flex max-w-md flex-col items-center justify-center">
            <NewsletterHubForm location="hero" />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-green-500"
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
              </svg>{' '}
              No spam
            </span>
            <span className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-green-500"
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
              </svg>{' '}
              Unsubscribe anytime
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 2: WHAT YOU'LL RECEIVE */}
      <section className="bg-gray-50 px-4 py-24 sm:px-6 lg:px-8 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              What You'll Receive
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Everything you need to thrive in the digital economy, delivered weekly.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                🤖
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">AI Tools</h3>
              <p className="leading-relaxed text-gray-600 dark:text-gray-400">
                Discover practical AI tools that improve productivity and workflows.
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-2xl text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                💻
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                Software Reviews
              </h3>
              <p className="leading-relaxed text-gray-600 dark:text-gray-400">
                Honest reviews, comparisons, and buying guides.
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-2xl text-green-600 dark:bg-green-900/30 dark:text-green-400">
                💰
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                Online Income
              </h3>
              <p className="leading-relaxed text-gray-600 dark:text-gray-400">
                Learn proven strategies for freelancing, blogging, affiliate marketing, and digital
                businesses.
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-2xl text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                📈
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                Technology Trends
              </h3>
              <p className="leading-relaxed text-gray-600 dark:text-gray-400">
                Stay informed about the latest developments shaping the digital world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: SAMPLE NEWSLETTER */}
      <section className="bg-white px-4 py-24 sm:px-6 lg:px-8 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl lg:flex lg:items-center lg:gap-16">
          <div className="mb-12 lg:mb-0 lg:w-1/2">
            <h2 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              A Peek Inside Your Inbox
            </h2>
            <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-400">
              We respect your time and inbox space. Every email is packed with high-signal,
              zero-fluff content designed to give you an edge in the digital economy.
            </p>
          </div>

          <div className="lg:w-1/2">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400"></div>
                  <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>
                </div>
              </div>
              <div className="p-8">
                <div className="mb-6 border-b border-gray-100 pb-4 dark:border-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    From:{' '}
                    <span className="font-semibold text-gray-900 dark:text-gray-200">Locitra</span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Subject:{' '}
                    <span className="font-semibold text-gray-900 dark:text-gray-200">
                      5 AI Tools Worth Trying This Week
                    </span>
                  </p>
                </div>

                <div className="prose prose-sm dark:prose-invert">
                  <p>Hey there 👋</p>
                  <p>
                    Welcome to this week's edition of the Locitra Newsletter. Here is what we are
                    covering today:
                  </p>
                  <ul className="space-y-2">
                    <li>
                      <strong>New AI productivity tool</strong> that saves us 3 hours a week.
                    </li>
                    <li>
                      <strong>Software review highlights:</strong> The best project management tool
                      for solopreneurs.
                    </li>
                    <li>
                      <strong>Online income opportunity:</strong> How to start an affiliate
                      marketing blog in 2026.
                    </li>
                    <li>
                      <strong>Featured article:</strong> 5 Career Growth Strategies in the Digital
                      Age.
                    </li>
                  </ul>
                  <p className="mt-6">Let's dive in!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: WHY SUBSCRIBE */}
      <section className="bg-gray-50 px-4 py-24 sm:px-6 lg:px-8 dark:bg-gray-900/50">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-12 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            Why Subscribe?
          </h2>

          <div className="space-y-4">
            {[
              "Weekly curated insights you won't find anywhere else",
              '100% free, no spam, and unsubscribe anytime',
              'Exclusive recommendations and early access to guides',
              'Actionable resources to grow your online income',
              'Stay updated with fast-moving AI & technology trends',
            ].map((benefit, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 rounded-2xl bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md dark:border dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <svg
                    className="h-5 w-5 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: FEATURED CONTENT */}
      <section className="bg-white px-4 py-24 sm:px-6 lg:px-8 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              Explore Our Hubs
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Discover deep-dive articles and actionable guides.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/categories/ai-tools"
              className="group flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-gray-50 p-10 text-center transition-all hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-blue-900 dark:hover:bg-blue-900/20"
            >
              <span className="mb-4 transform text-4xl transition-transform group-hover:scale-110">
                🤖
              </span>
              <span className="text-lg font-bold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                AI Tools Hub
              </span>
            </Link>
            <Link
              href="/categories/software-reviews"
              className="group flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-gray-50 p-10 text-center transition-all hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-blue-900 dark:hover:bg-blue-900/20"
            >
              <span className="mb-4 transform text-4xl transition-transform group-hover:scale-110">
                💻
              </span>
              <span className="text-lg font-bold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                Software Reviews
              </span>
            </Link>
            <Link
              href="/categories/online-income"
              className="group flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-gray-50 p-10 text-center transition-all hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-blue-900 dark:hover:bg-blue-900/20"
            >
              <span className="mb-4 transform text-4xl transition-transform group-hover:scale-110">
                💰
              </span>
              <span className="text-lg font-bold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                Online Income
              </span>
            </Link>
            <Link
              href="/categories/career-growth"
              className="group flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-gray-50 p-10 text-center transition-all hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-blue-900 dark:hover:bg-blue-900/20"
            >
              <span className="mb-4 transform text-4xl transition-transform group-hover:scale-110">
                📈
              </span>
              <span className="text-lg font-bold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                Career Growth
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 6: FINAL CTA */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 px-4 py-24 sm:px-6 lg:px-8 dark:from-blue-900 dark:to-gray-900">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ready to Join the Locitra Community?
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-lg text-blue-100 sm:text-xl">
            Get the insights you need to stay ahead. Subscribe free today.
          </p>

          <div className="relative mx-auto flex max-w-md flex-col items-center justify-center">
            <NewsletterHubForm location="footer" />
          </div>
        </div>
      </section>
    </>
  )
}
