'use client'

import { useState } from 'react'

interface ShareBarProps {
  url: string
  title: string
}

/**
 * Social share bar with X/Twitter, Facebook, LinkedIn, and Copy Link.
 * URL is the full canonical URL of the article.
 */
export default function ShareBar({ url, title }: ShareBarProps) {
  const [copied, setCopied] = useState(false)

  const encoded = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shares = [
    {
      id: 'twitter',
      label: 'Share on X',
      href: `https://x.com/intent/tweet?url=${encoded}&text=${encodedTitle}`,
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      bg: 'bg-black hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700',
    },
    {
      id: 'facebook',
      label: 'Share on Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      bg: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      id: 'linkedin',
      label: 'Share on LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      bg: 'bg-blue-700 hover:bg-blue-800',
    },
  ]

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for environments without clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="my-10 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-700 dark:bg-gray-800/50">
      <p className="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
        Share this article
      </p>
      <div className="flex flex-wrap gap-3">
        {shares.map((share) => (
          <a
            key={share.id}
            href={share.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={share.label}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all ${share.bg}`}
          >
            {share.icon}
            <span>{share.label.replace('Share on ', '')}</span>
          </a>
        ))}

        {/* Copy Link button */}
        <button
          onClick={handleCopy}
          aria-label="Copy article link"
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
            copied
              ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          {copied ? (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
              Copy Link
            </>
          )}
        </button>
      </div>
    </div>
  )
}
