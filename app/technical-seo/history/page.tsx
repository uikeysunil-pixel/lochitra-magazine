'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { forgetScan, readScanHistory } from '@/lib/technical-seo/browser-history'

type ScanSummary = {
  scanId: string
  websiteUrl: string
  status: 'queued' | 'running' | 'analyzing' | 'complete' | 'failed' | 'cancelled'
  problem: string
  plan: string
  pagesChecked: number
  progressPercent: number
  createdAt: string
  completedAt?: string | null
  reportUrl?: string | null
  statusUrl?: string | null
  errorMessage?: string | null
}

const STATUS_LABELS: Record<ScanSummary['status'], string> = {
  queued: 'Queued',
  running: 'Running',
  analyzing: 'Analyzing',
  complete: 'Complete',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

const PROBLEM_LABELS: Record<string, string> = {
  indexing: "Pages aren't getting indexed",
  'traffic-drop': 'Organic traffic dropped',
  'wrong-page': 'Google is showing the wrong page',
  slow: 'Website is slow',
  technical: 'Technical SEO errors',
  schema: 'Schema / structured data',
  migration: 'Website redesign or migration',
  'broken-links': 'Broken pages or links',
  duplicates: 'Duplicate or low-value pages',
  unknown: 'Find the important problems',
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function TechnicalSEOHistoryPage() {
  const [scans, setScans] = useState<ScanSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadHistory() {
      const entries = readScanHistory()

      try {
        const results = await Promise.all(
          entries.map(async ({ scanId, accessKey }) => {
            try {
              const key = accessKey
                ? `&key=${encodeURIComponent(accessKey)}`
                : ''
              const response = await fetch(
                `/api/technical-seo/scan/${scanId}?summary=1${key}`,
                { cache: 'no-store' }
              )

              if (!response.ok) return null

              return (await response.json()) as ScanSummary
            } catch {
              return null
            }
          })
        )

        if (!cancelled) {
          setScans(results.filter((item): item is ScanSummary => Boolean(item)))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadHistory()

    return () => {
      cancelled = true
    }
  }, [])

  function removeScan(scanId: string) {
    forgetScan(scanId)
    setScans((current) => current.filter((scan) => scan.scanId !== scanId))
  }

  return (
    <div className="pt-8 pb-16 sm:pt-12">
      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-primary-600 text-xs font-bold tracking-[0.18em] uppercase dark:text-primary-400">
                Locitra Technical SEO
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                Your scan history
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400">
                Scans created in this browser are saved here for easy access. This local history does not list scans from other users or devices.
              </p>
            </div>

            <Link
              href="/technical-seo/"
              className="inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-3 text-sm font-bold text-white dark:bg-white dark:text-gray-900"
            >
              Run a new scan
            </Link>
          </div>

          {loading ? (
            <div className="mt-8 rounded-2xl border border-gray-200 p-6 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
              Loading your scans…
            </div>
          ) : scans.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                No saved scans yet
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Run a Free Quick Check and it will appear here.
              </p>
              <Link
                href="/technical-seo/"
                className="mt-5 inline-flex rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100"
              >
                Start a scan
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-3">
              {scans.map((scan) => {
                const isComplete = scan.status === 'complete'
                const href = isComplete
                  ? scan.reportUrl || `/technical-seo/report/${scan.scanId}/`
                  : scan.statusUrl || `/technical-seo/scan/${scan.scanId}/`

                return (
                  <div
                    key={scan.scanId}
                    className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-base font-bold text-gray-900 dark:text-gray-100">
                        {scan.websiteUrl}
                      </div>
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {PROBLEM_LABELS[scan.problem] || scan.problem} · {scan.plan}
                      </div>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {STATUS_LABELS[scan.status]} · {scan.pagesChecked} pages checked · {formatDate(scan.createdAt)}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <Link
                        href={href}
                        className="rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100"
                      >
                        {isComplete ? 'View report' : 'View scan'}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeScan(scan.scanId)}
                        className="text-xs font-semibold text-gray-500 underline underline-offset-2 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <p className="mt-6 text-xs leading-5 text-gray-500 dark:text-gray-400">
            This history is stored in your browser. Clearing site data or using another device will not carry these entries over. Account-based history can be added later.
          </p>
        </section>
      </main>
    </div>
  )
}
