'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'

const EXCLUDED_PATHS = ['/contact', '/privacy-policy', '/terms', '/disclaimer', '/editorial-policy']

const POPUP_DISMISSED_KEY = 'locitra_newsletter_popup_dismissed'
const POPUP_SUBSCRIBED_KEY = 'locitra_newsletter_subscribed'
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void
  }
}

export default function NewsletterPopup() {
  const pathname = usePathname()
  const [showPopup, setShowPopup] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const isExcluded = EXCLUDED_PATHS.includes(pathname || '')

  const timeConditionMet = useRef(false)
  const scrollConditionMet = useRef(false)
  const hasTriggered = useRef(false)

  const trackEvent = useCallback((eventName: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName)
    }
  }, [])

  const handleClose = () => {
    setShowPopup(false)
    localStorage.setItem(POPUP_DISMISSED_KEY, Date.now().toString())
    trackEvent('newsletter_popup_close')
  }

  const triggerPopup = useCallback(() => {
    if (hasTriggered.current) return
    hasTriggered.current = true
    setShowPopup(true)
    trackEvent('newsletter_popup_view')
  }, [trackEvent])

  useEffect(() => {
    if (isExcluded) return

    // Check if already subscribed
    if (localStorage.getItem(POPUP_SUBSCRIBED_KEY) === 'true') {
      return
    }

    // Check if dismissed within 30 days
    const dismissedTime = localStorage.getItem(POPUP_DISMISSED_KEY)
    if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < THIRTY_DAYS_MS) {
      return
    }

    const isMobile = window.innerWidth <= 768

    if (!isMobile) {
      // Desktop: Exit intent
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) {
          triggerPopup()
          document.removeEventListener('mouseleave', handleMouseLeave)
        }
      }
      document.addEventListener('mouseleave', handleMouseLeave)
      return () => document.removeEventListener('mouseleave', handleMouseLeave)
    } else {
      // Mobile: 60% scroll AND 20 seconds
      const timer = setTimeout(() => {
        timeConditionMet.current = true
        if (scrollConditionMet.current) {
          triggerPopup()
        }
      }, 20000)

      const handleScroll = () => {
        const scrollTop = window.scrollY
        const docHeight = document.body.scrollHeight
        const winHeight = window.innerHeight
        const scrollPercent = scrollTop / (docHeight - winHeight)

        if (scrollPercent >= 0.6) {
          scrollConditionMet.current = true
          if (timeConditionMet.current) {
            triggerPopup()
            window.removeEventListener('scroll', handleScroll)
          }
        }
      }
      window.addEventListener('scroll', handleScroll, { passive: true })

      return () => {
        clearTimeout(timer)
        window.removeEventListener('scroll', handleScroll)
      }
    }
  }, [isExcluded, triggerPopup])

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
        trackEvent('newsletter_subscribe')

        // Wait 4 seconds to read success message, then close
        setTimeout(() => {
          setShowPopup(false)
        }, 4000)
      } else {
        setStatus('error')
        setMessage(data.message || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      setStatus('error')
      setMessage('Network error. Please try again later.')
    }
  }

  if (!showPopup) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label="Close popup"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {status === 'success' ? (
          <div className="animate-in fade-in zoom-in py-6 text-center duration-300">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
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
            <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              Subscription successful!
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Check your inbox for confirmation and future Locitra updates.
            </p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <h3 className="mb-3 text-2xl leading-tight font-bold text-gray-900 dark:text-white">
              Get the Best AI & Tech Insights Weekly
            </h3>
            <p className="mb-6 leading-relaxed text-gray-600 dark:text-gray-300">
              Get weekly AI tools, software reviews, online income ideas and exclusive resources not
              published on the website.
            </p>

            <form onSubmit={handleSubmit} className="mb-6">
              <div className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status === 'loading' ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="h-5 w-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Subscribing...
                    </div>
                  ) : (
                    'Subscribe Now'
                  )}
                </button>
              </div>
              {status === 'error' && (
                <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">{message}</p>
              )}
            </form>

            <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-green-500"
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
                </svg>
                <span>No spam, ever</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-green-500"
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
                </svg>
                <span>Unsubscribe anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-green-500"
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
                </svg>
                <span>Weekly AI & tech insights</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
