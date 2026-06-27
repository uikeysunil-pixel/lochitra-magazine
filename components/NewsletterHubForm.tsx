'use client'

import React from 'react'
import NewsletterSignup from './NewsletterSignup'

interface Props {
  location: 'hero' | 'footer'
}

/**
 * @deprecated Use NewsletterSignup directly instead.
 * Preserved for backward compatibility.
 */
export default function NewsletterHubForm({ location }: Props) {
  // We use variant="footer" for the inline UI layout, but pass the actual location as the source.
  return (
    <NewsletterSignup
      variant="footer"
      hideText={true}
      source={location === 'hero' ? 'homepage' : 'footer'}
      ctaText="Subscribe Free"
    />
  )
}
