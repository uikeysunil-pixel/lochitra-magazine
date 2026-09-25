'use client'

import { useEffect, useRef, useState } from 'react'
import { rememberScan } from '@/lib/technical-seo/browser-history'

type Status =
  | 'awaiting_payment'
  | 'queued'
  | 'running'
  | 'analyzing'
  | 'complete'
  | 'failed'
  | 'cancelled'

const STATUS_LABELS: Record<Status, string> = {
  awaiting_payment: 'Awaiting payment',
  queued: 'Queued',
  running: 'Running',
  analyzing: 'Analyzing',
  complete: 'Complete',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

function getHeadingText(status: Status | undefined): string {
  switch (status) {
    case 'awaiting_payment':
      return 'Confirming payment…'
    case 'queued':
      return 'Your scan is queued'
    case 'running':
      return 'Your scan is in progress'
    case 'complete':
      return 'Your scan is complete'
    case 'failed':
      return 'Scan could not be completed'
    case 'cancelled':
      return 'Scan was cancelled'
    default:
      return 'Your scan is in progress'
  }
}

interface Payload {
  scanId: string
  status: Status
  progressPercent: number
  pagesChecked: number
  pagesDiscovered: number
  errorMessage?: string | null
  reportUrl?: string | null
  paymentStatus?: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
  plan?: string
}

const MAX_POLL_ATTEMPTS = 240
const POLL_INTERVAL_MS = 1500

export default function TechnicalSEOScanStatusPage({
  params,
}: {
  params: Promise<{ scanId: string }>
}) {
  const [scanId, setScanId] = useState<string | null>(null)
  const [data, setData] = useState<Payload | null>(null)
  const [error, setError] = useState('')
  const [accessKey, setAccessKey] = useState<string | null>(null)
  const [pollingCeilingReached, setPollingCeilingReached] = useState(false)
  const captureAttemptedRef = useRef(false)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const provider = searchParams.get('provider')
    const token = searchParams.get('token')

    if (provider !== 'paypal' || !token || !token.trim()) {
      return
    }

    const orderId = token.trim()

    if (captureAttemptedRef.current) return
    captureAttemptedRef.current = true

    let cancelled = false
    const controller = new AbortController()

    async function confirmPayPalPayment() {
      try {
        const response = await fetch('/api/technical-seo/paypal/capture-order', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ orderId }),
          signal: controller.signal,
        })

        const payload = (await response.json()) as { error?: string }

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to confirm PayPal payment.')
        }

        if (cancelled) return

        const cleanUrl = new URL(window.location.href)
        cleanUrl.searchParams.delete('provider')
        cleanUrl.searchParams.delete('token')
        cleanUrl.searchParams.delete('PayerID')

        window.history.replaceState({}, '', cleanUrl.toString())
      } catch (captureError) {
        if (
          !cancelled &&
          !(captureError instanceof DOMException && captureError.name === 'AbortError')
        ) {
          setError(
            captureError instanceof Error
              ? captureError.message
              : 'Unable to confirm PayPal payment.'
          )
        }
      }
    }

    confirmPayPalPayment()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  useEffect(() => {
    params.then(({ scanId: id }) => {
      setScanId(id)
      const key = new URLSearchParams(window.location.search).get('key')
      setAccessKey(key)
      if (key) rememberScan(id, key)
    })
  }, [params])

  useEffect(() => {
    if (!scanId) return

    let cancelled = false
    let timerId: number | undefined
    let attempts = 0

    async function poll() {
      if (cancelled) return

      try {
        const keyQuery = accessKey ? `?key=${encodeURIComponent(accessKey)}` : ''
        const response = await fetch(`/api/technical-seo/scan/${scanId}${keyQuery}`, {
          cache: 'no-store',
        })
        const payload = (await response.json()) as Payload & { error?: string }

        if (!response.ok) throw new Error(payload.error || 'Unable to read scan status.')
        if (cancelled) return

        setData(payload)

        if (
          payload.status !== 'complete' &&
          payload.status !== 'failed' &&
          payload.status !== 'cancelled'
        ) {
          attempts += 1
          if (attempts >= MAX_POLL_ATTEMPTS) {
            setPollingCeilingReached(true)
            return
          }
          timerId = window.setTimeout(poll, POLL_INTERVAL_MS)
        }
      } catch (statusError) {
        if (!cancelled) {
          setError(
            statusError instanceof Error ? statusError.message : 'Unable to read scan status.'
          )
        }
      }
    }

    poll()

    return () => {
      cancelled = true
      if (timerId) {
        window.clearTimeout(timerId)
      }
    }
  }, [scanId, accessKey])

  const progress = Math.max(0, Math.min(100, data?.progressPercent ?? 0))

  return (
    <div className="pt-8 pb-16 sm:pt-12">
      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <section className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <p className="text-primary-600 dark:text-primary-400 text-xs font-bold tracking-[0.18em] uppercase">
            Locitra Technical SEO
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            {getHeadingText(data?.status)}
          </h1>

          {error ? (
            <>
              <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {error}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <a
                  href="/technical-seo/"
                  className="inline-flex rounded-full bg-gray-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                >
                  Run another scan
                </a>
                <a
                  href="/technical-seo/history/"
                  className="inline-flex rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-900"
                >
                  View scan history
                </a>
              </div>
            </>
          ) : data ? (
            <>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Status:{' '}
                {data.paymentStatus === 'paid' ? (
                  <span className="font-semibold">
                    Paid · {STATUS_LABELS[data.status] || data.status}
                  </span>
                ) : (
                  <span className="font-semibold">{STATUS_LABELS[data.status] || data.status}</span>
                )}
              </p>
              {data.status === 'awaiting_payment' && data.plan !== 'free' && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Payment is being confirmed before the investigation starts.
                </p>
              )}
              <div className="mt-6 h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-gray-900 transition-all dark:bg-white"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {progress}% complete · {data.pagesChecked} pages checked · {data.pagesDiscovered}{' '}
                URLs discovered
              </p>

              {pollingCeilingReached &&
                data.status !== 'complete' &&
                data.status !== 'failed' &&
                data.status !== 'cancelled' && (
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                    <p>
                      This scan is taking longer than expected. We stopped live polling. Refresh
                      this page later to check the saved result.
                    </p>
                  </div>
                )}

              {data.status === 'complete' && data.reportUrl && (
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <a
                    href={data.reportUrl}
                    className="inline-flex rounded-full bg-gray-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                  >
                    View report
                  </a>
                  <a
                    href="/technical-seo/history/"
                    className="inline-flex rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-900"
                  >
                    View scan history
                  </a>
                </div>
              )}

              {data.status === 'failed' && (
                <>
                  <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                    {data.errorMessage || 'This scan did not complete.'}
                  </p>
                  <div className="mt-7 flex flex-wrap justify-center gap-3">
                    <a
                      href="/technical-seo/"
                      className="inline-flex rounded-full bg-gray-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                    >
                      Run another scan
                    </a>
                    <a
                      href="/technical-seo/history/"
                      className="inline-flex rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-900"
                    >
                      View scan history
                    </a>
                  </div>
                </>
              )}

              {data.status === 'cancelled' && (
                <>
                  <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                    {data.errorMessage || 'This scan did not complete.'}
                  </p>
                  <div className="mt-7 flex flex-wrap justify-center gap-3">
                    <a
                      href="/technical-seo/"
                      className="inline-flex rounded-full bg-gray-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                    >
                      Run another scan
                    </a>
                    <a
                      href="/technical-seo/history/"
                      className="inline-flex rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-900"
                    >
                      View scan history
                    </a>
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">Loading scan status…</p>
          )}
        </section>
      </main>
    </div>
  )
}
