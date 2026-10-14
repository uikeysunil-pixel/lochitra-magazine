import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Scan Status | Locitra Technical SEO',
  description: 'Transient scan progress and diagnostic status for Locitra Technical SEO.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: null,
  },
}

export default function TechnicalSEOScanLayout({ children }: { children: React.ReactNode }) {
  return children
}
