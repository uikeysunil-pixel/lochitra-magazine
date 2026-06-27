'use client'

import React from 'react'
import NewsletterSignup from './NewsletterSignup'

/**
 * @deprecated Use NewsletterSignup directly instead.
 * Preserved for backward compatibility.
 */
export default function ArticleNewsletterBox() {
  return <NewsletterSignup variant="article" />
}
