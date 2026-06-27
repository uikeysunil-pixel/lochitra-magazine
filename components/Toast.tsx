'use client'

/**
 * @file Toast.tsx
 * @description
 * Purpose: A lightweight, portal-based UI component for rendering toast notifications.
 *
 * Architecture & Performance:
 * This component remains intentionally lightweight with zero third-party dependencies (no react-toastify, etc.).
 * It uses native `createPortal` to render above all other DOM elements without layout interference.
 *
 * Accessibility:
 * Renders inside an `aria-live="polite"` container, ensuring screen readers announce feedback
 * immediately (e.g., "Section link copied") without interrupting the user.
 */

import { useToast } from '@/lib/useToast'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ToastProviderProps {
  toasts: { id: string; message: string }[]
}

export function ToastProvider({ toasts }: ToastProviderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-in fade-in slide-in-from-bottom-5 rounded-full bg-gray-900/95 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-all dark:bg-white/95 dark:text-gray-900"
        >
          {toast.message}
        </div>
      ))}
    </div>,
    document.body
  )
}
