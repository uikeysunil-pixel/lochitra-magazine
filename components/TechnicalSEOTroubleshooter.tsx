'use client'

import { useMemo, useState } from 'react'
import type { DiagnosticProblem, PlanId, ScanResult } from '@/lib/technical-seo/types'

const PROBLEMS: Array<{ id: DiagnosticProblem; label: string; description: string }> = [
  { id: 'indexing', label: "My pages aren't getting indexed", description: 'Check crawlability, indexability, canonicals, and sitemap signals.' },
  { id: 'traffic-drop', label: 'My organic traffic dropped', description: 'Start with technical signals that may coincide with a traffic change.' },
  { id: 'wrong-page', label: 'Google is showing the wrong page', description: 'Investigate canonical and duplicate URL signals.' },
  { id: 'slow', label: 'My website is slow', description: 'Start with images, markup, resources, and performance signals.' },
  { id: 'technical', label: 'I have technical SEO errors', description: 'Run the broad technical quick check.' },
  { id: 'schema', label: 'My schema / structured data has problems', description: 'Inspect JSON-LD presence and parsing.' },
  { id: 'migration', label: 'I recently redesigned or migrated my website', description: 'Look for common migration and URL consistency risks.' },
  { id: 'broken-links', label: 'I have broken pages or links', description: 'Inspect response, redirects, and internal linking signals.' },
  { id: 'duplicates', label: 'I have duplicate or low-value pages', description: 'Start with canonical and architecture signals.' },
  { id: 'unknown', label: "I don't know — find the important problems", description: 'Use the general technical troubleshooting path.' },
]

const PLANS: Array<{
  id: PlanId
  name: string
  price: string
  description: string
  features: string[]
  enabled: boolean
}> = [
  {
    id: 'free',
    name: 'Quick Check',
    price: 'Free',
    description: 'A first look at the highest-confidence technical signals.',
    features: ['Core accessibility checks', 'Indexability signals', 'Canonical check', 'Sitemap/robots check'],
    enabled: true,
  },
  {
    id: 'quick',
    name: 'Targeted Troubleshoot',
    price: '$49',
    description: 'Problem-specific diagnosis with a focused report.',
    features: ['Problem-oriented analysis', 'Evidence', 'Prioritized findings', 'PDF report'],
    enabled: false,
  },
  {
    id: 'full',
    name: 'Full Troubleshoot',
    price: '$99',
    description: 'A broader crawl and website-wide technical analysis.',
    features: ['Expanded crawl', 'Architecture analysis', 'Duplicate candidates', 'Detailed report'],
    enabled: false,
  },
  {
    id: 'deep',
    name: 'Deep Investigation',
    price: '$199',
    description: 'Deeper diagnosis with Google Search Console data.',
    features: ['Search Console', 'URL Inspection', 'Deep diagnostics', 'Likely-cause analysis'],
    enabled: false,
  },
]

function severityClass(severity: ScanResult['findings'][number]['severity']) {
  switch (severity) {
    case 'critical':
      return 'border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200'
    case 'high':
      return 'border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-200'
    case 'medium':
      return 'border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-200'
    case 'low':
      return 'border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200'
    default:
      return 'border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200'
  }
}

export default function TechnicalSEOTroubleshooter() {
  const [url, setUrl] = useState('')
  const [problem, setProblem] = useState<DiagnosticProblem>('unknown')
  const [plan, setPlan] = useState<PlanId>('free')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)

  const selectedProblem = useMemo(
    () => PROBLEMS.find((item) => item.id === problem),
    [problem]
  )

  async function handleAnalyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setResult(null)

    if (!url.trim()) {
      setError('Enter your website URL to begin.')
      return
    }

    if (plan !== 'free') {
      setError('Paid scans are not enabled yet. The analysis engine is being built first; billing and paid crawl limits come next.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/technical-seo/scan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url, problem, plan }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to analyze the website.')
      }

      setResult(data)
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Unable to analyze the website.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <section className="rounded-3xl border border-gray-200 bg-white px-6 py-12 shadow-sm sm:px-10 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-primary-600 dark:text-primary-400 text-sm font-semibold tracking-[0.18em] uppercase">
            Locitra Technical SEO
          </p>
          <h1 className="mt-3 text-4xl leading-tight font-extrabold tracking-tight text-gray-900 sm:text-5xl dark:text-gray-100">
            Find the technical SEO problems that matter.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-400">
            Enter your website, tell us what you are worried about, and get an evidence-based first diagnostic instead of a dump of generic SEO errors.
          </p>
        </div>

        <form onSubmit={handleAnalyze} className="mx-auto mt-10 max-w-4xl space-y-8">
          <div>
            <label htmlFor="seo-url" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">
              Website URL
            </label>
            <input
              id="seo-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              required
            />
          </div>

          <div>
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">What are you trying to troubleshoot?</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This selection will steer the future diagnostic engine toward the most relevant tests.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {PROBLEMS.map((item) => {
                const active = problem === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setProblem(item.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? 'border-primary-500 bg-primary-50 shadow-sm dark:border-primary-400 dark:bg-primary-950/30'
                        : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">{item.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">{item.description}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="mb-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Choose a plan</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The first live slice is the free scanner. Paid plan enforcement comes after the analysis engine is validated on real sites.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-4">
              {PLANS.map((item) => {
                const active = plan === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => item.enabled && setPlan(item.id)}
                    aria-disabled={!item.enabled}
                    className={`rounded-2xl border p-5 text-left transition ${
                      active
                        ? 'border-gray-900 bg-gray-50 shadow-sm dark:border-gray-200 dark:bg-gray-900'
                        : item.enabled
                          ? 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900'
                          : 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-65 dark:border-gray-800 dark:bg-gray-950'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-gray-900 dark:text-gray-100">{item.name}</span>
                      {!item.enabled && (
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          Next
                        </span>
                      )}
                    </div>
                    <div className="mt-3 text-2xl font-extrabold text-gray-900 dark:text-gray-100">{item.price}</div>
                    <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">{item.description}</p>
                    <div className="mt-4 space-y-2">
                      {item.features.map((feature) => (
                        <div key={feature} className="flex gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span aria-hidden="true">✓</span>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-gray-900 px-7 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {loading ? 'Analyzing website…' : 'Troubleshoot My Website'}
            </button>
            {selectedProblem && (
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                Diagnostic path: <span className="font-semibold">{selectedProblem.label}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}
        </form>
      </section>

      {result && (
        <section className="mt-8 space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Technical quick check</p>
                {result.diagnosticFocus && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-800 dark:border-primary-900 dark:bg-primary-950/30 dark:text-primary-200">
                    <span>Diagnostic focus</span>
                    <span aria-hidden="true">·</span>
                    <span>{result.diagnosticFocus.label}</span>
                  </div>
                )}
                <h2 className="mt-1 break-all text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                  {result.finalUrl}
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Completed in {result.durationMs} ms · HTTP {result.httpStatus}
                </p>
              </div>
              <div className="grid grid-cols-5 gap-2 text-center">
                {([
                  ['critical', 'Critical'],
                  ['high', 'High'],
                  ['medium', 'Medium'],
                  ['low', 'Opportunities'],
                  ['info', 'Info'],
                ] as const).map(([key, label]) => (
                  <div key={key} className="min-w-14 rounded-xl border border-gray-200 px-2 py-3 dark:border-gray-800">
                    <div className="text-xl font-extrabold text-gray-900 dark:text-gray-100">{result.summary[key]}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Confirmed problems</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Issues the current scan can verify from the available evidence. Findings related to your selected concern are shown first.
                </p>
                <div className="mt-4 space-y-4">
                  {(() => {
                    const findings = result.findings.filter((finding) =>
                      ['critical', 'high', 'medium'].includes(finding.severity)
                    )
                    return findings.length > 0 ? findings.map((finding) => (
                      <article
                        key={finding.id}
                        className={`rounded-2xl border p-5 ${severityClass(finding.severity)}`}
                      >
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
                          <span>{finding.severity}</span>
                          <span>·</span>
                          <span>{finding.category}</span>
                          <span>·</span>
                          <span>{finding.confidence} confidence</span>
                        </div>
                        <h4 className="mt-2 text-base font-extrabold">{finding.title}</h4>
                        <p className="mt-2 text-sm leading-6">{finding.summary}</p>
                        <div className="mt-4">
                          <p className="text-xs font-bold uppercase tracking-wide opacity-80">Evidence</p>
                          <ul className="mt-1 space-y-1 text-sm">
                            {finding.evidence.map((item) => (
                              <li key={item}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-4">
                          <p className="text-xs font-bold uppercase tracking-wide opacity-80">Recommended action</p>
                          <p className="mt-1 text-sm leading-6">{finding.recommendation}</p>
                        </div>
                      </article>
                    )) : (
                      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
                        No confirmed technical problems were detected by this scan.
                      </div>
                    )
                  })()}
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Review opportunities</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Optimization or quality signals worth reviewing, but not treated as confirmed technical failures.
                </p>
                <div className="mt-4 space-y-4">
                  {(() => {
                    const findings = result.findings.filter((finding) => finding.severity === 'low')
                    return findings.length > 0 ? findings.map((finding) => (
                      <article
                        key={finding.id}
                        className={`rounded-2xl border p-5 ${severityClass(finding.severity)}`}
                      >
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
                          <span>{finding.severity}</span>
                          <span>·</span>
                          <span>{finding.category}</span>
                          <span>·</span>
                          <span>{finding.confidence} confidence</span>
                        </div>
                        <h4 className="mt-2 text-base font-extrabold">{finding.title}</h4>
                        <p className="mt-2 text-sm leading-6">{finding.summary}</p>
                        <div className="mt-4">
                          <p className="text-xs font-bold uppercase tracking-wide opacity-80">Evidence</p>
                          <ul className="mt-1 space-y-1 text-sm">
                            {finding.evidence.map((item) => (
                              <li key={item}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-4">
                          <p className="text-xs font-bold uppercase tracking-wide opacity-80">Recommended action</p>
                          <p className="mt-1 text-sm leading-6">{finding.recommendation}</p>
                        </div>
                      </article>
                    )) : (
                      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
                        No review opportunities were detected by this scan.
                      </div>
                    )
                  })()}
                </div>
              </section>

              {result.findings.some((finding) => finding.severity === 'info') && (
                <section>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Informational observations</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Useful observations that are not treated as SEO problems by themselves.
                  </p>
                  <div className="mt-4 space-y-4">
                    {result.findings
                      .filter((finding) => finding.severity === 'info')
                      .map((finding) => (
                        <article
                          key={finding.id}
                          className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        >
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
                            <span>info</span>
                            <span>·</span>
                            <span>{finding.category}</span>
                            <span>·</span>
                            <span>{finding.confidence} confidence</span>
                          </div>
                          <h4 className="mt-2 text-base font-extrabold">{finding.title}</h4>
                          <p className="mt-2 text-sm leading-6">{finding.summary}</p>
                          <div className="mt-4">
                            <p className="text-xs font-bold uppercase tracking-wide opacity-80">Evidence</p>
                            <ul className="mt-1 space-y-1 text-sm">
                              {finding.evidence.map((item) => (
                                <li key={item}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="mt-4">
                            <p className="text-xs font-bold uppercase tracking-wide opacity-80">Recommended action</p>
                            <p className="mt-1 text-sm leading-6">{finding.recommendation}</p>
                          </div>
                        </article>
                      ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-gray-100">What we checked</h3>
              <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between gap-4"><span>Internal links</span><strong className="text-gray-900 dark:text-gray-100">{result.metrics.internalLinks}</strong></div>
                <div className="flex justify-between gap-4"><span>External links</span><strong className="text-gray-900 dark:text-gray-100">{result.metrics.externalLinks}</strong></div>
                <div className="flex justify-between gap-4"><span>Images</span><strong className="text-gray-900 dark:text-gray-100">{result.metrics.images}</strong></div>
                <div className="flex justify-between gap-4"><span>Missing alt attributes</span><strong className="text-gray-900 dark:text-gray-100">{result.metrics.imagesWithoutAlt}</strong></div>
                <div className="flex justify-between gap-4"><span>Empty alt attributes</span><strong className="text-gray-900 dark:text-gray-100">{result.metrics.imagesWithEmptyAlt}</strong></div>
                <div className="flex justify-between gap-4"><span>H1 headings</span><strong className="text-gray-900 dark:text-gray-100">{result.metrics.h1Count}</strong></div>
                <div className="flex justify-between gap-4"><span>JSON-LD blocks</span><strong className="text-gray-900 dark:text-gray-100">{result.metrics.jsonLdBlocks}</strong></div>
                <div className="flex justify-between gap-4"><span>hreflang links</span><strong className="text-gray-900 dark:text-gray-100">{result.metrics.hreflangCount}</strong></div>
                <div className="flex justify-between gap-4"><span>robots.txt</span><strong className="text-gray-900 dark:text-gray-100">{result.robotsTxt.found ? 'Found' : 'Not found'}</strong></div>
                <div className="flex justify-between gap-4"><span>Sitemap</span><strong className="text-gray-900 dark:text-gray-100">{result.sitemap.found ? 'Found' : 'Not found'}</strong></div>
              </div>
              <div className="mt-6 rounded-xl bg-gray-50 p-4 text-xs leading-5 text-gray-600 dark:bg-gray-900 dark:text-gray-400">
                This MVP checks the initial HTML response and standard robots/sitemap locations. It does not yet use Google Search Console, browser rendering, full-site crawling, payments, or PDF reports.
                {result.diagnosticFocus && (
                  <span className="mt-2 block font-medium">
                    Matched findings for this diagnostic focus: {result.diagnosticFocus.matchedFindings}
                  </span>
                )}
              </div>
            </aside>
          </div>
        </section>
      )}
    </div>
  )
}
