/**
 * @file useToast.ts
 * @description
 * Architectural Note: This toast implementation is intentionally localized.
 * Currently, toast notifications are only required by the Reading Experience (e.g., copying heading links).
 * By using local state (`useState`) instead of a global React Context, we keep the bundle size smaller,
 * reduce hydration overhead, and avoid unnecessary complexity.
 *
 * Future Migration Strategy (Context API):
 * If multiple independent features (newsletter, contact forms, search, bookmarks, settings, etc.)
 * genuinely require a shared notification system in the future, this can be seamlessly upgraded:
 * 1. Introduce a `GlobalToastProvider` at the root layout.
 * 2. Move this state logic from `useState()` into the Context Provider.
 * 3. Update this `useToast()` hook to call `useContext(ToastContext)`.
 *
 * IMPORTANT API STABILITY:
 * The exported API signature `const { toasts, showToast } = useToast()` MUST remain stable.
 * This guarantees that migrating to a Context-backed implementation will not require changing
 * any consuming components. Consumers must never depend on the internal state implementation.
 */

import { useState, useCallback, useEffect } from 'react'

type ToastMessage = {
  id: string
  message: string
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((message: string, duration = 2000) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  return { toasts, showToast }
}
