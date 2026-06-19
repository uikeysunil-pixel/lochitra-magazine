'use client'

import React, { useState, useCallback, useEffect } from 'react'

const POPUP_SUBSCRIBED_KEY = 'locitra_newsletter_subscribed'

interface Props {
  location: 'hero' | 'footer'
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void
  }
}

export default function NewsletterHubForm({ location }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [isAlreadySubscribed, setIsAlreadySubscribed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const trackEvent = useCallback(
    (eventName: string, params?: Record<string, string | number | boolean | null | undefined>) => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, params)
      }
    },
    []
  )

  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== 'undefined') {
      const subscribed = localStorage.getItem(POPUP_SUBSCRIBED_KEY) === 'true'
      setIsAlreadySubscribed(subscribed)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    trackEvent('newsletter_page_cta_click', { form_location: location })

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
        trackEvent('newsletter_page_subscribe', { form_location: location })
      } else {
        setStatus('error')
        setMessage('Unable to subscribe right now. Please try again.')
      }
    } catch (err) {
      setStatus('error')
      setMessage('Unable to subscribe right now. Please try again.')
    }
  }

  // To prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="h-[60px] w-full max-w-md animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
    )
  }

  if (isAlreadySubscribed || status === 'success') {
    return (
      <div className="flex w-full max-w-md items-center justify-center gap-3 rounded-xl bg-green-50 p-4 text-green-800 dark:bg-green-900/30 dark:text-green-300">
        <svg
          className="h-6 w-6 text-green-600 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-center font-medium">
          {status === 'success'
            ? "🎉 You're subscribed! Check your inbox."
            : "You're already part of the Locitra community."}
        </span>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex w-full max-w-md flex-col gap-3 sm:flex-row"
    >
      <label htmlFor={`newsletter-email-${location}`} className="sr-only">
        Email Address
      </label>
      <input
        id={`newsletter-email-${location}`}
        type="email"
        required
        placeholder="Email Address"
        className="w-full flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-gray-900 shadow-sm transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === 'loading'}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full shrink-0 rounded-xl bg-blue-600 px-6 py-3.5 font-bold text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 sm:w-auto"
      >
        {status === 'loading' ? 'Subscribing...' : 'Subscribe Free'}
      </button>
      {status === 'error' && (
        <p className="absolute -bottom-7 left-0 text-sm font-medium text-red-600 dark:text-red-400">
          {message}
        </p>
      )}
    </form>
  )
}
