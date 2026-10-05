'use client'

import { useEffect, useRef, useState } from 'react'
import { rememberScan } from '@/lib/technical-seo/browser-history'

type Status =
  | 'awaiting_gsc'
  | 'awaiting_payment'
  | 'queued'
  | 'running'
  | 'analyzing'
  | 'complete'
  | 'failed'
  | 'cancelled'

const STATUS_LABELS: Record<Status, string> = {
  awaiting_gsc: 'Google Search Console connection required',
  awaiting_payment: 'Payment required',
  queued: 'Queued',
  running: 'Running',
  analyzing: 'Analyzing',
  complete: 'Complete',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

function getHeadingText(status: Status | undefined): string {
  switch (status) {
    case 'awaiting_gsc':
      return 'Google Search Console connection required'
    case 'awaiting_payment':
      return 'Payment required'
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
  gscConnected?: boolean
  gscProperty?: string | null
}

interface PropertyItem {
  siteUrl: string
  permissionLevel: string | null
  propertyType: 'domain' | 'url_prefix'
  isMatch: boolean
  isSelectable: boolean
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
  const cashfreeConfirmationAttemptedRef = useRef(false)

  // Phase 10C: Google Search Console property selection state
  const [properties, setProperties] = useState<PropertyItem[]>([])
  const [loadingProperties, setLoadingProperties] = useState(false)
  const [propertiesError, setPropertiesError] = useState('')
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [submittingProperty, setSubmittingProperty] = useState(false)

  // Phase Deep-01: PayPal checkout state for Deep Investigation
  const [initiatingPayment, setInitiatingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')

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
    const searchParams = new URLSearchParams(window.location.search)
    const provider = searchParams.get('provider')
    const key = searchParams.get('key')
    const orderId = searchParams.get('order_id') || searchParams.get('orderId')

    if (
      provider !== 'cashfree' ||
      !key?.trim() ||
      !orderId?.trim() ||
      cashfreeConfirmationAttemptedRef.current
    ) {
      return
    }

    cashfreeConfirmationAttemptedRef.current = true

    let cancelled = false
    const controller = new AbortController()

    async function confirmCashfreePayment() {
      try {
        const { scanId: id } = await params
        if (cancelled) return

        const response = await fetch('/api/technical-seo/cashfree/confirm-order', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            scanId: id,
            key: key!.trim(),
            orderId: orderId!.trim(),
          }),
          signal: controller.signal,
        })

        const payload = (await response.json()) as { error?: string }

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to confirm Cashfree payment.')
        }

        if (cancelled) return

        const cleanUrl = new URL(window.location.href)
        cleanUrl.searchParams.delete('provider')
        cleanUrl.searchParams.delete('order_id')
        cleanUrl.searchParams.delete('orderId')
        window.history.replaceState({}, '', cleanUrl.toString())
      } catch (confirmationError) {
        if (
          !cancelled &&
          !(
            confirmationError instanceof DOMException &&
            confirmationError.name === 'AbortError'
          )
        ) {
          setError(
            confirmationError instanceof Error
              ? confirmationError.message
              : 'Unable to confirm Cashfree payment.'
          )
        }
      }
    }

    confirmCashfreePayment()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [params])

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

  useEffect(() => {
    if (
      data?.plan !== 'deep' ||
      !data?.gscConnected ||
      data?.gscProperty ||
      !scanId ||
      !accessKey
    ) {
      return
    }

    let cancelled = false
    setLoadingProperties(true)
    setPropertiesError('')

    fetch(
      `/api/technical-seo/google/properties?scanId=${scanId}&key=${encodeURIComponent(accessKey)}`
    )
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) {
          throw new Error(json.error || 'Failed to load Google Search Console properties.')
        }
        return json
      })
      .then((payload) => {
        if (cancelled) return
        setProperties(payload.properties || [])
      })
      .catch((err) => {
        if (cancelled) return
        setPropertiesError(err instanceof Error ? err.message : 'Failed to load properties.')
      })
      .finally(() => {
        if (!cancelled) setLoadingProperties(false)
      })

    return () => {
      cancelled = true
    }
  }, [data?.plan, data?.gscConnected, data?.gscProperty, scanId, accessKey])

  async function handleConfirmProperty() {
    if (!scanId || !accessKey || !selectedProperty || submittingProperty) return

    setSubmittingProperty(true)
    setPropertiesError('')

    try {
      const res = await fetch('/api/technical-seo/google/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId,
          key: accessKey,
          property: selectedProperty,
        }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to select Search Console property.')
      }

      setData((prev) =>
        prev
          ? {
              ...prev,
              gscProperty: payload.property,
              status: prev.status === 'awaiting_gsc' ? 'awaiting_payment' : prev.status,
            }
          : prev
      )
    } catch (err) {
      setPropertiesError(err instanceof Error ? err.message : 'Failed to select property.')
    } finally {
      setSubmittingProperty(false)
    }
  }

  async function handleProceedToPayPal() {
    if (!scanId || !accessKey || initiatingPayment) return

    setInitiatingPayment(true)
    setPaymentError('')

    try {
      const response = await fetch('/api/technical-seo/paypal/create-order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          scanId,
          key: accessKey,
          plan: 'deep',
        }),
      })

      const payload = (await response.json()) as {
        checkoutUrl?: string
        error?: string
      }

      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(payload.error || 'Unable to start PayPal checkout.')
      }

      window.location.assign(payload.checkoutUrl)
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Unable to start PayPal checkout.')
      setInitiatingPayment(false)
    }
  }

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

              {data.plan === 'deep' && (
                <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50/50 p-6 text-left dark:border-gray-800 dark:bg-gray-900/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                        Google Search Console Connection
                      </h2>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Deep Investigation requires verified Search Console access for indexing and
                        performance data.
                      </p>
                    </div>
                    {data.gscProperty ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20 ring-inset dark:bg-emerald-950/40 dark:text-emerald-300">
                        Connected
                      </span>
                    ) : data.gscConnected ? (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/20 ring-inset dark:bg-blue-950/40 dark:text-blue-300">
                        Select Property
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20 ring-inset dark:bg-amber-950/40 dark:text-amber-300">
                        Action Required
                      </span>
                    )}
                  </div>

                  {!data.gscConnected && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Connect your Google account to allow Locitra to inspect your Search Console
                        properties in read-only mode.
                      </p>
                      <div className="mt-4">
                        <a
                          href={`/api/technical-seo/google/connect?scanId=${scanId}&key=${encodeURIComponent(accessKey || '')}`}
                          className="inline-flex items-center rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                        >
                          Connect Google Search Console
                        </a>
                      </div>
                    </div>
                  )}

                  {data.gscConnected && !data.gscProperty && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Your Google account is connected. Select the Search Console property that
                        corresponds to this scan:
                      </p>

                      {loadingProperties ? (
                        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                          Loading properties from Google Search Console…
                        </p>
                      ) : propertiesError ? (
                        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                          {propertiesError}
                        </div>
                      ) : properties.length === 0 ? (
                        <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                          No Search Console properties were found in your connected Google account.
                        </p>
                      ) : (
                        <div className="mt-4 space-y-2">
                          {properties.map((prop) => (
                            <label
                              htmlFor={`gsc-prop-${prop.siteUrl}`}
                              key={prop.siteUrl}
                              className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                                prop.isSelectable
                                  ? selectedProperty === prop.siteUrl
                                    ? 'border-primary-500 bg-primary-50/30 dark:border-primary-400 dark:bg-primary-950/20'
                                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                                  : 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-900'
                              }`}
                            >
                              <span className="sr-only">Select property {prop.siteUrl}</span>
                              <input
                                id={`gsc-prop-${prop.siteUrl}`}
                                type="radio"
                                name="gscProperty"
                                value={prop.siteUrl}
                                disabled={!prop.isSelectable}
                                checked={selectedProperty === prop.siteUrl}
                                onChange={() => setSelectedProperty(prop.siteUrl)}
                                className="text-primary-600 focus:ring-primary-500 mt-0.5"
                              />
                              <div className="flex-1 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                                    {prop.siteUrl}
                                  </span>
                                  <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-300">
                                    {prop.propertyType === 'domain' ? 'Domain' : 'URL-prefix'}
                                  </span>
                                </div>
                                <div className="mt-1 text-gray-500 dark:text-gray-400">
                                  {prop.isSelectable ? (
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      Matches target website ({prop.permissionLevel})
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">
                                      {!prop.isMatch
                                        ? 'Does not match target website'
                                        : `Unverified (${prop.permissionLevel})`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </label>
                          ))}

                          <div className="mt-4 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={handleConfirmProperty}
                              disabled={!selectedProperty || submittingProperty}
                              className="inline-flex items-center rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                            >
                              {submittingProperty ? 'Confirming…' : 'Confirm Property'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {data.gscConnected && data.gscProperty && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                      <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                        Property Confirmed for Deep Investigation
                      </p>
                      <p className="mt-1 font-mono text-sm font-bold text-emerald-950 dark:text-emerald-100">
                        {data.gscProperty}
                      </p>
                      <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                        Locitra will use this property to correlate crawl signals with Google Search
                        Console data.
                      </p>

                      {data.plan === 'deep' && data.status === 'awaiting_payment' && (
                        <div className="mt-5 border-t border-emerald-200/60 pt-4 dark:border-emerald-800/40">
                          <p className="mb-3 text-xs text-gray-700 dark:text-gray-300">
                            Search Console property confirmed. Complete checkout to begin your Deep
                            Investigation.
                          </p>
                          <button
                            type="button"
                            onClick={handleProceedToPayPal}
                            disabled={initiatingPayment}
                            className="inline-flex items-center rounded-xl bg-gray-900 px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                          >
                            {initiatingPayment ? 'Opening PayPal…' : 'Proceed to PayPal — $199'}
                          </button>
                          {paymentError && (
                            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                              {paymentError}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

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
