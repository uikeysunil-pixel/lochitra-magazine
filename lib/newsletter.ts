import type { NewsletterVariant } from './newsletter-copy'

export type NewsletterSource = NewsletterVariant | 'popup' | 'unknown'

export interface SubscribeOptions {
  email: string
  source: NewsletterSource
  interests?: string[]
  frequency?: string
}

/**
 * Normalizes email before validation and submission.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Validates the normalized email.
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email) return { isValid: false, error: 'Email is required.' }
  if (email.length > 254) return { isValid: false, error: 'Invalid email address.' }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return { isValid: false, error: 'Invalid email format.' }
  return { isValid: true }
}

// ── Extension Points ────────────────────────────────────────────────────────

/**
 * Hook for future spam protection (e.g., Turnstile, reCAPTCHA).
 * Returns true if the submission is allowed.
 */
export const beforeSubmit = async (options: SubscribeOptions): Promise<boolean> => {
  return true
}

/**
 * Hook for future analytics tracking when a subscription attempt starts.
 */
export const onSubscribeStart = (options: SubscribeOptions) => {
  // e.g., tracking pixel or GA event
}

/**
 * Hook for future analytics tracking on successful subscription.
 */
export const onSubscribeSuccess = (options: SubscribeOptions) => {
  // e.g., tracking pixel or GA event
}

/**
 * Hook for future analytics tracking on failed subscription.
 */
export const onSubscribeFailure = (options: SubscribeOptions, error: string) => {
  // e.g., tracking pixel or GA event
}

// ── Main API ────────────────────────────────────────────────────────────────

/**
 * Centralized subscription logic preserving the existing Brevo integration.
 * The UI components must only interact with this function.
 */
export async function subscribe(
  options: SubscribeOptions
): Promise<{ success: boolean; message?: string }> {
  onSubscribeStart(options)

  const passesSpamCheck = await beforeSubmit(options)
  if (!passesSpamCheck) {
    const err = 'Unable to verify request. Please try again.'
    onSubscribeFailure(options, err)
    return { success: false, message: err }
  }

  try {
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: options.email,
        source: options.source,
        interests: options.interests,
        frequency: options.frequency,
      }),
    })

    const data = await res.json()

    if (res.ok && data.success) {
      onSubscribeSuccess(options)
      if (data.message === 'already_subscribed') {
        return { success: true, message: 'already_subscribed' }
      }
      return { success: true }
    } else {
      const err = data.message || 'Subscription failed. Please try again.'
      onSubscribeFailure(options, err)
      return { success: false, message: err }
    }
  } catch (error) {
    const err = 'Network error. Please try again later.'
    onSubscribeFailure(options, err)
    return { success: false, message: err }
  }
}
