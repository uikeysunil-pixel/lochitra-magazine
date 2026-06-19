'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void
  }
}

export default function NewsletterPageView() {
  const hasTracked = useRef(false)

  useEffect(() => {
    if (!hasTracked.current && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'newsletter_page_view')
      hasTracked.current = true
    }
  }, [])

  return null
}
