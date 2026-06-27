'use client'

/**
 * @file ReadingUtilities.tsx
 * @description
 * Client-side utilities for the Locitra reading experience.
 *
 * Architectural Note on Toast System:
 * The toast notification system (`useToast` & `ToastProvider`) is intentionally mounted here
 * and scoped specifically to the reading experience. This prevents global hydration overhead
 * on pages that do not require notifications.
 *
 * Future site-wide notifications should migrate to a Context-backed implementation
 * only when multiple independent features require shared notifications. Until then,
 * this localized approach aligns with the Locitra Gold Standard for performance.
 */

import { useEffect } from 'react'
import { useToast } from '@/lib/useToast'
import { ToastProvider } from './Toast'
import ReadingProgress from './ReadingProgress'

export default function ReadingUtilities() {
  const { toasts, showToast } = useToast()

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return

      const heading = target.closest('.content-header')
      if (heading && target.hash) {
        e.preventDefault()
        const url = new URL(window.location.href)
        url.hash = target.hash
        navigator.clipboard.writeText(url.toString()).then(() => {
          showToast('Section link copied')
          window.history.pushState(null, '', target.hash)
        })
      }
    }

    document.addEventListener('click', handleAnchorClick)
    return () => document.removeEventListener('click', handleAnchorClick)
  }, [showToast])

  return (
    <>
      <ReadingProgress />
      <ToastProvider toasts={toasts} />
    </>
  )
}
