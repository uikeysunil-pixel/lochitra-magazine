'use client'

import React, { useState } from 'react'
import { subscribe, normalizeEmail, validateEmail } from '@/lib/newsletter'
import { newsletterCopyConfig, type NewsletterVariant } from '@/lib/newsletter-copy'

interface NewsletterSignupProps {
  variant: NewsletterVariant
  heading?: string
  description?: string
  ctaText?: string
  hideText?: boolean
  source?: string
}

export default function NewsletterSignup({
  variant,
  heading,
  description,
  ctaText,
  hideText = false,
  source,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>(
    'idle'
  )
  const [message, setMessage] = useState('')

  const copy = newsletterCopyConfig[variant]
  const finalHeading = heading ?? copy.heading
  const finalDescription = description ?? copy.description
  const finalCta = ctaText ?? copy.ctaText

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (status === 'loading') return

    const normalizedEmail = normalizeEmail(email)
    const validation = validateEmail(normalizedEmail)

    if (!validation.isValid) {
      setStatus('error')
      setMessage(validation.error || 'Invalid email address')
      return
    }

    setStatus('loading')
    setMessage('')

    const result = await subscribe({
      email: normalizedEmail,
      source: (source || variant) as import('@/lib/newsletter').NewsletterSource,
    })

    if (result.success) {
      if (result.message === 'already_subscribed') {
        setStatus('duplicate')
      } else {
        setStatus('success')
        setEmail('')
      }
    } else {
      setStatus('error')
      setMessage(result.message || 'An error occurred. Please try again.')
    }
  }

  if (status === 'success' || status === 'duplicate') {
    const isDuplicate = status === 'duplicate'

    if (variant === 'footer') {
      return (
        <div className="flex w-full items-center justify-center gap-3 rounded-xl bg-green-50 p-4 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <svg
            className="h-6 w-6 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-center font-medium">
            {isDuplicate ? "You're already subscribed." : "🎉 You're subscribed! Check your inbox."}
          </span>
        </div>
      )
    }

    return (
      <div
        className={`mx-auto w-full max-w-[800px] overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] sm:p-10 dark:border-gray-800 dark:bg-gray-900 ${variant === 'homepage' || variant === 'category' ? 'my-8' : 'my-12'}`}
      >
        <div className="animate-in fade-in zoom-in py-4 duration-500">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
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
          <h3 className="mb-3 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
            {isDuplicate ? "You're already a subscriber!" : '✅ Welcome to Locitra!'}
          </h3>
          <p className="mx-auto max-w-lg text-base text-gray-600 sm:text-lg dark:text-gray-300">
            {isDuplicate
              ? 'Thank you for being part of our community.'
              : "Thank you for subscribing. You'll receive practical AI tools, technology insights, software reviews, career growth strategies, and online income ideas directly in your inbox. Please check your inbox for the confirmation email."}
          </p>
        </div>
      </div>
    )
  }

  if (variant === 'footer') {
    return (
      <div className="w-full">
        {!hideText && (
          <>
            <h4 className="mb-2 text-xs font-bold tracking-widest text-gray-900 uppercase dark:text-gray-100">
              {finalHeading}
            </h4>
            <p className="mb-3 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
              {finalDescription}
            </p>
          </>
        )}
        <form
          onSubmit={handleSubmit}
          className={
            hideText
              ? 'relative flex w-full max-w-md flex-col gap-3 sm:flex-row'
              : 'flex flex-col gap-2'
          }
        >
          <label htmlFor="footer-newsletter-email" className="sr-only">
            Email Address
          </label>
          <input
            id="footer-newsletter-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (status === 'error') setStatus('idle')
            }}
            placeholder="Email Address"
            required
            disabled={status === 'loading'}
            className={
              hideText
                ? 'w-full flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-gray-900 shadow-sm transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400'
                : 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:placeholder-gray-500'
            }
          />
          <button
            type="submit"
            disabled={status === 'loading' || !email.trim()}
            className={
              hideText
                ? 'w-full shrink-0 rounded-xl bg-blue-600 px-6 py-3.5 font-bold text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 sm:w-auto'
                : 'from-primary-600 to-primary-700 w-full rounded-lg bg-gradient-to-r px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
            }
          >
            {status === 'loading' ? 'Subscribing...' : finalCta}
          </button>
          {status === 'error' && hideText && (
            <p className="absolute -bottom-7 left-0 text-sm font-medium text-red-600 dark:text-red-400">
              {message}
            </p>
          )}
        </form>
        {status === 'error' && !hideText && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{message}</p>
        )}
      </div>
    )
  }

  return (
    <div
      className={`mx-auto w-full max-w-[800px] overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] sm:p-10 dark:border-gray-800 dark:bg-gray-900 ${variant === 'homepage' || variant === 'category' ? 'my-8' : 'my-12'}`}
    >
      <div className="flex flex-col items-center gap-8 md:flex-row lg:gap-12">
        <div className="flex-1">
          <h3 className="mb-3 text-3xl leading-tight font-extrabold tracking-tight text-gray-900 dark:text-white">
            {finalHeading}
          </h3>
          <p className="mb-6 text-base leading-relaxed text-gray-600 dark:text-gray-300">
            {finalDescription}
          </p>

          <div className="flex flex-col gap-3 text-sm font-medium text-gray-600 dark:text-gray-400">
            {['No spam', 'Unsubscribe anytime', 'Weekly AI & technology insights'].map(
              (feature) => (
                <div key={feature} className="flex items-center gap-2.5">
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
                  <span>{feature}</span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="w-full shrink-0 rounded-2xl border border-gray-100 bg-gray-50 p-6 md:w-[320px] dark:border-gray-700 dark:bg-gray-800/50">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor={`${variant}-newsletter-email`} className="sr-only">
                Email Address
              </label>
              <input
                id={`${variant}-newsletter-email`}
                type="email"
                required
                placeholder="Email Address"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-gray-900 shadow-sm transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (status === 'error') setStatus('idle')
                }}
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
                finalCta
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
    </div>
  )
}
