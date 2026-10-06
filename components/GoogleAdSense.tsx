'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

export default function GoogleAdSense() {
  const pathname = usePathname()

  // Suppress Google AdSense across the entire Technical SEO route namespace
  if (pathname === '/technical-seo' || pathname?.startsWith('/technical-seo/')) {
    return null
  }

  return (
    <Script
      id="google-adsense"
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2792017631035920"
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  )
}
