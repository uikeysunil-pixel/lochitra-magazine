'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

const POPUP_SUBSCRIBED_KEY = 'locitra_newsletter_subscribed'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void
  }
}

export default function ArticleNewsletterBox() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [isAlreadySubscribed, setIsAlreadySubscribed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const hasTrackedView = useRef(false)

  const trackEvent = useCallback((eventName: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName)
    }
  }, [])

  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== 'undefined') {
      const subscribed = localStorage.getItem(POPUP_SUBSCRIBED_KEY) === 'true'
      setIsAlreadySubscribed(subscribed)

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !hasTrackedView.current && !subscribed) {
            hasTrackedView.current = true
            trackEvent('newsletter_article_box_view')
            observer.disconnect()
          }
        },
        { threshold: 0.5 }
      )

      const el = document.getElementById('article-newsletter-box')
      if (el) observer.observe(el)

      return () => observer.disconnect()
    }
  }, [trackEvent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setStatus('success')
        localStorage.setItem(POPUP_SUBSCRIBED_KEY, 'true')
        trackEvent('newsletter_article_box_subscribe')
      } else {
        setStatus('error')
        setMessage('Unable to subscribe right now. Please try again.')
        trackEvent('newsletter_article_box_error')
      }
    } catch (err) {
      setStatus('error')
      setMessage('Unable to subscribe right now. Please try again.')
      trackEvent('newsletter_article_box_error')
    }
  }

  // To prevent hydration mismatch, we delay rendering state-dependent UI
  if (!isMounted) {
    return <div className="mx-auto my-12 min-h-[300px] w-full max-w-[800px]" aria-hidden="true" />
  }

  if (isAlreadySubscribed) {
    return (
      <div className="mx-auto my-12 w-full max-w-[800px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0f172a] px-8 py-12 text-center shadow-xl dark:from-[#0a0f1a] dark:via-[#0f2240] dark:to-[#0a0f1a]">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
          <svg
            className="h-8 w-8 text-blue-400"
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
        <h3 className="mb-2 text-2xl font-bold text-white">
          You're already part of the Locitra community.
        </h3>
        <p className="text-blue-200">Thank you for subscribing.</p>
      </div>
    )
  }

  return (
    <div
      id="article-newsletter-box"
      className="mx-auto my-12 w-full max-w-[800px] overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 sm:p-10 dark:border-gray-800 dark:bg-gray-900"
    >
      {status === 'success' ? (
        <div className="animate-in fade-in zoom-in py-8 text-center duration-500">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg
              className="h-10 w-10 text-green-600 dark:text-green-400"
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
          <h3 className="mb-3 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            🎉 You're subscribed!
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Check your inbox for updates and exclusive Locitra resources.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8 md:flex-row lg:gap-12">
          <div className="flex-1">
            <h3 className="mb-3 text-3xl leading-tight font-extrabold tracking-tight text-gray-900 dark:text-white">
              Enjoyed this article?
            </h3>
            <p className="mb-6 text-base leading-relaxed text-gray-600 dark:text-gray-300">
              Get weekly AI tools, software reviews, online income strategies, and exclusive
              resources delivered to your inbox.
            </p>

            <div className="flex flex-col gap-3 text-sm font-medium text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                  <svg
                    className="h-3.5 w-3.5 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span>No spam</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                  <svg
                    className="h-3.5 w-3.5 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span>Unsubscribe anytime</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                  <svg
                    className="h-3.5 w-3.5 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span>Weekly AI & technology insights</span>
              </div>
            </div>
          </div>

          <div className="w-full shrink-0 rounded-2xl border border-gray-100 bg-gray-50 p-6 md:w-[320px] dark:border-gray-700 dark:bg-gray-800/50">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="article-newsletter-email" className="sr-only">
                  Email Address
                </label>
                <input
                  id="article-newsletter-email"
                  type="email"
                  required
                  placeholder="Email Address"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-gray-900 shadow-sm transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-bold text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {status === 'loading' ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Subscribing...
                  </div>
                ) : (
                  'Subscribe Free'
                )}
              </button>
              {status === 'error' && (
                <p className="mt-1 text-center text-sm font-medium text-red-600 dark:text-red-400">
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
