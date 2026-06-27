'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import NewsletterSignup from './NewsletterSignup'

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

/**
 * @deprecated The popup itself is preserved for backward compatibility,
 * but its internal UI is now powered by NewsletterSignup.
 */
export default function NewsletterPopup() {
  const pathname = usePathname()
  const [showPopup, setShowPopup] = useState(false)

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

    if (localStorage.getItem(POPUP_SUBSCRIBED_KEY) === 'true') {
      return
    }

    const dismissedTime = localStorage.getItem(POPUP_DISMISSED_KEY)
    if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < THIRTY_DAYS_MS) {
      return
    }

    const isMobile = window.innerWidth <= 768

    if (!isMobile) {
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) {
          triggerPopup()
          document.removeEventListener('mouseleave', handleMouseLeave)
        }
      }
      document.addEventListener('mouseleave', handleMouseLeave)
      return () => document.removeEventListener('mouseleave', handleMouseLeave)
    } else {
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

  if (!showPopup) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl">
        <button
          onClick={handleClose}
          className="absolute -top-12 right-0 rounded-full bg-white/10 p-2 text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:top-0 sm:-right-12"
          aria-label="Close popup"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <NewsletterSignup variant="homepage" source="popup" />
      </div>
    </div>
  )
}
