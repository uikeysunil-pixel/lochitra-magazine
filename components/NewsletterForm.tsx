'use client'

import React from 'react'
import NewsletterSignup from './NewsletterSignup'

/**
 * @deprecated Use NewsletterSignup directly instead.
 * Preserved for backward compatibility.
 */
export default function NewsletterForm() {
  return <NewsletterSignup variant="footer" />
}
