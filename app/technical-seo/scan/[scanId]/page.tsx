'use client'

import { useEffect, useRef, useState } from 'react'
import { rememberScan } from '@/lib/technical-seo/browser-history'

type Status = 'queued' | 'running' | 'analyzing' | 'complete' | 'failed' | 'cancelled'

interface Payload {
  scanId: string
  status: Status
  progressPercent: number
  pagesChecked: number
  pagesDiscovered: number
  errorMessage?: string | null
  reportUrl?: string | null
  paymentStatus?: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
}

export default function TechnicalSEOScanStatusPage({
  params,
}: {
  params: Promise<{ scanId: string }>
}) {
  const [scanId, setScanId] = useState<string | null>(null)
  const [data, setData] = useState<Payload | null>(null)
  const [error, setError] = useState('')
  const [accessKey, setAccessKey] = useState<string | null>(null)
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

    async function poll() {
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
          window.setTimeout(poll, 1500)
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
            Your scan is in progress
          </h1>

          {error ? (
            <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </p>
          ) : data ? (
            <>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                {data.paymentStatus === 'pending' || data.paymentStatus === 'unpaid'
                  ? 'Payment is being confirmed before the investigation starts.'
                  : 'Status:'}{' '}
                {data.paymentStatus === 'paid' ? (
                  <span className="font-semibold">Paid · {data.status}</span>
                ) : data.paymentStatus === 'pending' || data.paymentStatus === 'unpaid' ? (
                  <span className="font-semibold capitalize">{data.paymentStatus}</span>
                ) : (
                  <span className="font-semibold capitalize">{data.status}</span>
                )}
              </p>
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

              {data.status === 'complete' && data.reportUrl && (
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <a
                    href={data.reportUrl}
                    className="inline-flex rounded-full bg-gray-900 px-6 py-3 text-sm font-bold text-white dark:bg-white dark:text-gray-900"
                  >
                    View completed report
                  </a>
                  <a
                    href="/technical-seo/history/"
                    className="inline-flex rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100"
                  >
                    Scan history
                  </a>
                </div>
              )}

              {(data.status === 'failed' || data.status === 'cancelled') && (
                <p className="mt-6 rounded-2xl border border-gray-200 p-4 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
                  {data.errorMessage || 'This scan did not complete.'}
                </p>
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
