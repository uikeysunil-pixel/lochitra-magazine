import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getScanRecord, verifyReportAccessToken } from '@/lib/technical-seo/scan-repository'
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
  searchParams,
}: {
  params: Promise<{ scanId: string }>
  searchParams: Promise<{ key?: string }>
}) {
  const { scanId } = await params
  const { key } = await searchParams

  if (!isUuid(scanId)) notFound()

  const scan = await getScanRecord(scanId)
  if (!scan) notFound()

  if (scan.access_mode === 'private' && !verifyReportAccessToken(key, scan.report_token_hash)) {
    notFound()
  }

  if (scan.status !== 'complete' || !scan.report_json) {
    const statusUrl =
      scan.access_mode === 'private' && key
        ? `/technical-seo/scan/${scanId}/?key=${encodeURIComponent(key)}`
        : `/technical-seo/scan/${scanId}/`

    let statusTitle = 'Scan in progress'
    let statusDescription = 'This scan is still being processed.'

    if (scan.status === 'awaiting_payment') {
      statusTitle = 'Payment confirmation pending'
      statusDescription = 'Payment has not yet been confirmed for this scan.'
    } else if (scan.status === 'queued') {
      statusTitle = 'Scan is queued'
      statusDescription = 'This scan is currently queued and waiting to be processed.'
    } else if (scan.status === 'running' || scan.status === 'analyzing') {
      statusTitle = 'Scan in progress'
      statusDescription =
        'This scan is still being processed. The diagnostic report will be available once crawling and analysis are complete.'
    } else if (scan.status === 'failed' || scan.status === 'cancelled') {
      statusTitle = scan.status === 'cancelled' ? 'Scan cancelled' : 'Scan could not be completed'
      statusDescription = scan.error_message || 'This scan did not complete.'
    }

    return (
      <div className="pt-8 pb-16 sm:pt-12">
        <main className="mx-auto max-w-2xl px-4 sm:px-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <p className="text-primary-600 dark:text-primary-400 text-xs font-bold tracking-[0.18em] uppercase">
              Locitra Technical SEO
            </p>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
              {statusTitle}
            </h1>
            <p className="mt-2 text-sm break-all text-gray-500 dark:text-gray-400">
              {scan.website_url}
            </p>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{statusDescription}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a
                href={statusUrl}
                className="inline-flex rounded-full bg-gray-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                View scan status
              </a>
              <a
                href="/technical-seo/"
                className="inline-flex rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-900"
              >
                Run another scan
              </a>
            </div>
          </section>
        </main>
      </div>
    )
  }

  const result = scan.report_json as CrawlResult
  const problem = scan.problem as DiagnosticProblem
  const findings = result.findings
  const canDownloadPdf = scan.plan !== 'free' && scan.payment_status === 'paid'
  const pdfUrl = key
    ? `/api/technical-seo/report/${scanId}/pdf/?key=${encodeURIComponent(key)}`
    : `/api/technical-seo/report/${scanId}/pdf/`

  return (
    <div className="pt-8 pb-16 sm:pt-12">
      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div>
              <p className="text-primary-600 dark:text-primary-400 text-xs font-bold tracking-[0.18em] uppercase">
                Locitra Technical SEO
              </p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight break-all text-gray-900 sm:text-3xl dark:text-gray-100">
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
              <div
                key={severity}
                className="rounded-2xl border border-gray-200 p-4 text-center dark:border-gray-800"
              >
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
            <section className="space-y-8">
              {result.architecture && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                  <div className="flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                    <div>
                      <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
                        Site Architecture & Structure
                      </h2>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Crawl depth distribution, canonical configuration, and internal linking
                        hierarchy.
                      </p>
                    </div>
                    <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                      Full Plan Diagnostic
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 text-center dark:border-gray-800 dark:bg-gray-900/50">
                      <div className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
                        {result.architecture.maxDepth ?? 0}{' '}
                        {result.architecture.maxDepth === 1 ? 'click' : 'clicks'}
                      </div>
                      <div className="mt-1 text-[10px] font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                        Max Crawl Depth
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 text-center dark:border-gray-800 dark:bg-gray-900/50">
                      <div className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
                        {result.architecture.canonicalSummary?.selfCanonicalCount ?? 0}
                      </div>
                      <div className="mt-1 text-[10px] font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                        Self-Canonical
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 text-center dark:border-gray-800 dark:bg-gray-900/50">
                      <div className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
                        {result.architecture.canonicalSummary?.crossPageCanonicalCount ?? 0}
                      </div>
                      <div className="mt-1 text-[10px] font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                        Cross-Page Canonical
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 text-center dark:border-gray-800 dark:bg-gray-900/50">
                      <div className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
                        {result.architecture.canonicalSummary?.missingCanonicalCount ?? 0}
                      </div>
                      <div className="mt-1 text-[10px] font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                        Missing Canonical
                      </div>
                    </div>
                  </div>

                  {Object.keys(result.architecture.depthDistribution || {}).length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-xs font-bold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                        Crawl Depth Distribution
                      </h3>
                      <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {Object.entries(result.architecture.depthDistribution)
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(([depth, count]) => (
                            <div
                              key={depth}
                              className="flex items-center justify-between rounded-lg border border-gray-200/80 bg-gray-50/50 px-3 py-2 text-xs dark:border-gray-800 dark:bg-gray-900/40"
                            >
                              <span className="font-medium text-gray-600 dark:text-gray-400">
                                {depth === '0' ? 'Depth 0 (Root)' : `Depth ${depth}`}
                              </span>
                              <span className="font-bold text-gray-900 dark:text-gray-100">
                                {count} {count === 1 ? 'page' : 'pages'}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {result.architecture.sectionDistribution &&
                    result.architecture.sectionDistribution.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-xs font-bold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Directory & Section Breakdown
                        </h3>
                        <div className="mt-2.5 max-h-56 overflow-y-auto rounded-xl border border-gray-200/80 dark:border-gray-800">
                          <div className="divide-y divide-gray-100 text-xs dark:divide-gray-800/80">
                            {result.architecture.sectionDistribution.map((sec) => (
                              <div
                                key={sec.path}
                                className="flex items-center justify-between px-3.5 py-2"
                              >
                                <span className="font-mono text-gray-700 dark:text-gray-300">
                                  {sec.path}
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  {sec.pageCount} {sec.pageCount === 1 ? 'page' : 'pages'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                  {result.architecture.topLinkedUrls &&
                    result.architecture.topLinkedUrls.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-xs font-bold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Top Internally Linked URLs
                        </h3>
                        <div className="mt-2.5 max-h-64 overflow-y-auto rounded-xl border border-gray-200/80 dark:border-gray-800">
                          <div className="divide-y divide-gray-100 text-xs dark:divide-gray-800/80">
                            {result.architecture.topLinkedUrls.slice(0, 15).map((item, idx) => (
                              <div
                                key={item.url}
                                className="flex items-center justify-between gap-3 px-3.5 py-2"
                              >
                                <span className="truncate font-mono text-gray-600 dark:text-gray-400">
                                  {idx + 1}. {item.url}
                                </span>
                                <span className="shrink-0 rounded bg-blue-50 px-2 py-0.5 font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                  {item.inboundCount} links
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                  <div className="mt-6">
                    <h3 className="text-xs font-bold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                      Orphan Page Candidates
                    </h3>
                    {!result.architecture.orphanCandidates ||
                    result.architecture.orphanCandidates.length === 0 ? (
                      <div className="mt-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                        ✓ No orphan candidates identified. All discovered sitemap URLs are reachable
                        via internal links.
                      </div>
                    ) : (
                      <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs dark:border-amber-900/60 dark:bg-amber-950/30">
                        <div className="font-bold text-amber-900 dark:text-amber-200">
                          {result.architecture.orphanCandidates.length} sitemap URLs with 0 inbound
                          crawl links:
                        </div>
                        <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto font-mono text-amber-800 dark:text-amber-300">
                          {result.architecture.orphanCandidates.map((url) => (
                            <li key={url} className="truncate">
                              • {url}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {result.duplicates && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                  <div className="flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                    <div>
                      <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
                        Duplicate & Canonical Conflict Analysis
                      </h2>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Content collision detection, tracking parameter variants, and conflicting
                        canonical tags.
                      </p>
                    </div>
                    <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                      Full Plan Diagnostic
                    </span>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-xs font-bold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                      Duplicate Title Groups ({result.duplicates.titleDuplicateGroups?.length ?? 0})
                    </h3>
                    {!result.duplicates.titleDuplicateGroups ||
                    result.duplicates.titleDuplicateGroups.length === 0 ? (
                      <div className="mt-2 rounded-xl border border-gray-200/80 bg-gray-50/50 p-3.5 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400">
                        ✓ No duplicate title groups identified. All crawled pages have unique title
                        tags.
                      </div>
                    ) : (
                      <div className="mt-2 space-y-3">
                        {result.duplicates.titleDuplicateGroups.map((group, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-gray-200/80 p-3.5 text-xs dark:border-gray-800"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-gray-900 dark:text-gray-100">
                                "{group.title}"
                              </span>
                              <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                {group.urls.length} pages
                              </span>
                            </div>
                            <ul className="mt-2 space-y-1 font-mono text-gray-600 dark:text-gray-400">
                              {group.urls.map((u) => (
                                <li key={u} className="truncate">
                                  • {u}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <h3 className="text-xs font-bold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                      Duplicate Meta-Description Groups (
                      {result.duplicates.descriptionDuplicateGroups?.length ?? 0})
                    </h3>
                    {!result.duplicates.descriptionDuplicateGroups ||
                    result.duplicates.descriptionDuplicateGroups.length === 0 ? (
                      <div className="mt-2 rounded-xl border border-gray-200/80 bg-gray-50/50 p-3.5 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400">
                        ✓ No duplicate meta-description groups identified. All crawled pages have
                        unique descriptions.
                      </div>
                    ) : (
                      <div className="mt-2 space-y-3">
                        {result.duplicates.descriptionDuplicateGroups.map((group, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-gray-200/80 p-3.5 text-xs dark:border-gray-800"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-gray-800 italic dark:text-gray-200">
                                "{group.description}"
                              </span>
                              <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                {group.urls.length} pages
                              </span>
                            </div>
                            <ul className="mt-2 space-y-1 font-mono text-gray-600 dark:text-gray-400">
                              {group.urls.map((u) => (
                                <li key={u} className="truncate">
                                  • {u}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <h3 className="text-xs font-bold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                      URL Parameter Variations (
                      {result.duplicates.parameterVariationGroups?.length ?? 0})
                    </h3>
                    {!result.duplicates.parameterVariationGroups ||
                    result.duplicates.parameterVariationGroups.length === 0 ? (
                      <div className="mt-2 rounded-xl border border-gray-200/80 bg-gray-50/50 p-3.5 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400">
                        ✓ No parameter variation groups identified. No query parameter duplicate
                        variations detected.
                      </div>
                    ) : (
                      <div className="mt-2 space-y-3">
                        {result.duplicates.parameterVariationGroups.map((group, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-gray-200/80 p-3.5 text-xs dark:border-gray-800"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                                Base: {group.baseUrl}
                              </span>
                              <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                {group.variations.length} variations
                              </span>
                            </div>
                            <ul className="mt-2 space-y-1 font-mono text-gray-600 dark:text-gray-400">
                              {group.variations.map((v) => (
                                <li key={v} className="truncate">
                                  • {v}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <h3 className="text-xs font-bold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                      Canonical Conflict Groups (
                      {result.duplicates.canonicalConflictGroups?.length ?? 0})
                    </h3>
                    {!result.duplicates.canonicalConflictGroups ||
                    result.duplicates.canonicalConflictGroups.length === 0 ? (
                      <div className="mt-2 rounded-xl border border-gray-200/80 bg-gray-50/50 p-3.5 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400">
                        ✓ No canonical conflict groups identified. Canonical declarations point to
                        consistent targets.
                      </div>
                    ) : (
                      <div className="mt-2 space-y-3">
                        {result.duplicates.canonicalConflictGroups.map((group, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-gray-200/80 p-3.5 text-xs dark:border-gray-800"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                                Target: {group.canonicalUrl}
                              </span>
                              <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                {group.declaredOnUrls.length} pages
                              </span>
                            </div>
                            <ul className="mt-2 space-y-1 font-mono text-gray-600 dark:text-gray-400">
                              {group.declaredOnUrls.map((u) => (
                                <li key={u} className="truncate">
                                  • Declared on: {u}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
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
                          <div className="text-xs font-bold tracking-wide uppercase opacity-80">
                            Evidence
                          </div>
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
              </div>
            </section>

            <aside className="h-fit rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
              <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">
                Scan coverage
              </h2>
              <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between gap-4">
                  <span>Pages checked</span>
                  <strong>{scan.pages_checked}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span>URLs discovered</span>
                  <strong>{scan.pages_discovered}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Pages not crawled</span>
                  <strong>{scan.pages_not_crawled}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Robots blocked</span>
                  <strong>{scan.urls_blocked_by_robots}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Crawl errors</span>
                  <strong>{scan.crawl_errors}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Internal links</span>
                  <strong>{result.metrics.internalLinks}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Images</span>
                  <strong>{result.metrics.images}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span>JSON-LD blocks</span>
                  <strong>{result.metrics.jsonLdBlocks}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span>robots.txt</span>
                  <strong>{result.robotsTxt.found ? 'Found' : 'Not found'}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Sitemap</span>
                  <strong>{result.sitemap.found ? 'Found' : 'Not found'}</strong>
                </div>
              </div>

              <div className="mt-6 grid gap-2">
                {canDownloadPdf && (
                  <a
                    href={pdfUrl}
                    className="inline-flex w-full items-center justify-center rounded-full bg-gray-900 px-5 py-3 text-sm font-bold text-white dark:bg-white dark:text-gray-900"
                  >
                    Download PDF Report
                  </a>
                )}
                <a
                  href="/technical-seo/history/"
                  className="inline-flex w-full items-center justify-center rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100"
                >
                  View scan history
                </a>
                <a
                  href="/technical-seo/"
                  className={
                    canDownloadPdf
                      ? 'inline-flex w-full items-center justify-center rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100'
                      : 'inline-flex w-full items-center justify-center rounded-full bg-gray-900 px-5 py-3 text-sm font-bold text-white dark:bg-white dark:text-gray-900'
                  }
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
