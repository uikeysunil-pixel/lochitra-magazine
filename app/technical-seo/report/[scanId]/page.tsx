import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getScanRecord } from '@/lib/technical-seo/scan-repository'
import type { CrawlResult, DiagnosticProblem } from '@/lib/technical-seo/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Technical SEO Report | Locitra',
  description: 'Technical SEO troubleshooting report from Locitra.',
  robots: {
    index: false,
    follow: false,
  },
}

const PROBLEM_LABELS: Record<DiagnosticProblem, string> = {
  indexing: "My pages aren't getting indexed",
  'traffic-drop': 'My organic traffic dropped',
  'wrong-page': 'Google is showing the wrong page',
  slow: 'My website is slow',
  technical: 'I have technical SEO errors',
  schema: 'My schema / structured data has problems',
  migration: 'I recently redesigned or migrated my website',
  'broken-links': 'I have broken pages or links',
  duplicates: 'I have duplicate or low-value pages',
  unknown: "I don't know — find the important problems",
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function severityClass(severity: string) {
  if (severity === 'critical') return 'border-red-300 bg-red-50 text-red-900'
  if (severity === 'high') return 'border-orange-300 bg-orange-50 text-orange-900'
  if (severity === 'medium') return 'border-yellow-300 bg-yellow-50 text-yellow-900'
  if (severity === 'low') return 'border-blue-300 bg-blue-50 text-blue-900'
  return 'border-gray-200 bg-gray-50 text-gray-800'
}

export default async function TechnicalSEOReportPage({
  params,
}: {
  params: Promise<{ scanId: string }>
}) {
  const { scanId } = await params

  if (!isUuid(scanId)) notFound()

  const scan = await getScanRecord(scanId)
  if (!scan || scan.status !== 'complete' || !scan.report_json) notFound()

  const result = scan.report_json as CrawlResult
  const problem = scan.problem as DiagnosticProblem
  const findings = result.findings

  return (
    <div className="pt-8 pb-16 sm:pt-12">
      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div>
              <p className="text-primary-600 text-xs font-bold tracking-[0.18em] uppercase dark:text-primary-400">
                Locitra Technical SEO
              </p>
              <h1 className="mt-2 break-all text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                {scan.website_url}
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Report ID: <span className="font-mono">{scan.id}</span>
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Diagnostic focus: {PROBLEM_LABELS[problem] ?? problem}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-800">
              <div className="font-semibold text-gray-900 dark:text-gray-100">Scan complete</div>
              <div className="mt-1 text-gray-500 dark:text-gray-400">
                {scan.pages_checked} pages checked · {scan.progress_percent}% complete
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-5">
            {(['critical', 'high', 'medium', 'low', 'info'] as const).map((severity) => (
              <div key={severity} className="rounded-2xl border border-gray-200 p-4 text-center dark:border-gray-800">
                <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                  {result.summary[severity]}
                </div>
                <div className="mt-1 text-[11px] font-bold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  {severity}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
            <section>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
                Findings
              </h2>

              {findings.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-gray-200 p-5 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
                  No findings were recorded for this scan.
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {findings.map((finding) => (
                    <article
                      key={finding.id}
                      className={`rounded-2xl border p-5 ${severityClass(finding.severity)}`}
                    >
                      <div className="text-[11px] font-bold tracking-wide uppercase">
                        {finding.severity} · {finding.category} · {finding.confidence} confidence
                      </div>
                      <h3 className="mt-2 text-base font-extrabold">{finding.title}</h3>
                      <p className="mt-2 text-sm leading-6">{finding.summary}</p>

                      <div className="mt-4">
                        <div className="text-xs font-bold tracking-wide uppercase opacity-80">Evidence</div>
                        <ul className="mt-1 space-y-1 text-sm">
                          {finding.evidence.map((item) => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs font-bold tracking-wide uppercase opacity-80">
                          Recommended action
                        </div>
                        <p className="mt-1 text-sm leading-6">{finding.recommendation}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="h-fit rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
              <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">
                Scan coverage
              </h2>
              <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between gap-4"><span>Pages checked</span><strong>{scan.pages_checked}</strong></div>
                <div className="flex justify-between gap-4"><span>URLs discovered</span><strong>{scan.pages_discovered}</strong></div>
                <div className="flex justify-between gap-4"><span>Pages not crawled</span><strong>{scan.pages_not_crawled}</strong></div>
                <div className="flex justify-between gap-4"><span>Robots blocked</span><strong>{scan.urls_blocked_by_robots}</strong></div>
                <div className="flex justify-between gap-4"><span>Crawl errors</span><strong>{scan.crawl_errors}</strong></div>
                <div className="flex justify-between gap-4"><span>Internal links</span><strong>{result.metrics.internalLinks}</strong></div>
                <div className="flex justify-between gap-4"><span>Images</span><strong>{result.metrics.images}</strong></div>
                <div className="flex justify-between gap-4"><span>JSON-LD blocks</span><strong>{result.metrics.jsonLdBlocks}</strong></div>
                <div className="flex justify-between gap-4"><span>robots.txt</span><strong>{result.robotsTxt.found ? 'Found' : 'Not found'}</strong></div>
                <div className="flex justify-between gap-4"><span>Sitemap</span><strong>{result.sitemap.found ? 'Found' : 'Not found'}</strong></div>
              </div>

              <div className="mt-6 grid gap-2">
                <a
                  href="/technical-seo/history/"
                  className="inline-flex w-full items-center justify-center rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100"
                >
                  View scan history
                </a>
                <a
                  href="/technical-seo/"
                  className="inline-flex w-full items-center justify-center rounded-full bg-gray-900 px-5 py-3 text-sm font-bold text-white dark:bg-white dark:text-gray-900"
                >
                  Run another scan
                </a>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
