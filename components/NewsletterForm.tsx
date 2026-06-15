'use client'

import React, { useState } from 'react'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>(
    'idle'
  )

  const subscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        if (data.message === 'already subscribed') {
          setStatus('duplicate')
        } else {
          setStatus('success')
          setEmail('')
        }
      } else {
        setStatus('error')
      }
    } catch (error) {
      setStatus('error')
    }
  }

  return (
    <div>
      <h4 className="mb-2 text-xs font-bold tracking-widest text-gray-900 uppercase dark:text-gray-100">
        Newsletter
      </h4>
      <p className="mb-3 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
        Weekly insights on AI, tech & digital income — free.
      </p>
      <form onSubmit={subscribe} className="flex flex-col gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status !== 'idle') setStatus('idle')
          }}
          placeholder="your@email.com"
          required
          aria-label="Newsletter email"
          disabled={status === 'loading'}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:placeholder-gray-500"
        />
        <button
          type="submit"
          disabled={status === 'loading' || !email}
          className="from-primary-600 to-primary-700 w-full rounded-lg bg-gradient-to-r px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>

      <div className="mt-2 min-h-[20px] text-xs font-medium">
        {status === 'success' && (
          <p className="text-green-600 dark:text-green-400">
            Thank you for subscribing to Locitra.
          </p>
        )}
        {status === 'duplicate' && (
          <p className="text-amber-600 dark:text-amber-400">You're already subscribed.</p>
        )}
        {status === 'error' && (
          <p className="text-red-600 dark:text-red-400">Subscription failed. Please try again.</p>
        )}
      </div>
    </div>
  )
}
