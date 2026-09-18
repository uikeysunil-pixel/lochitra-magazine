import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Scan History | Locitra Technical SEO',
  description: 'Private browser-based history for Locitra Technical SEO scans.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function TechnicalSEOHistoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
