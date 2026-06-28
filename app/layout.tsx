import 'css/tailwind.css'
import 'pliny/search/algolia.css'
import 'remark-github-blockquote-alert/alert.css'

import { Inter } from 'next/font/google'
import Script from 'next/script'
import { Analytics, AnalyticsConfig } from 'pliny/analytics'
import { SearchConfig } from 'pliny/search'
import { SearchProvider } from 'pliny/search'
import Header from '@/components/Header'
import SectionContainer from '@/components/SectionContainer'
import Footer from '@/components/Footer'
import siteMetadata from '@/data/siteMetadata'
import { ThemeProviders } from './theme-providers'
import { Metadata } from 'next'
import NewsletterPopupWrapper from '@/components/NewsletterPopupWrapper'
import { buildGraph, buildOrganization, buildWebsite, buildPerson } from '@/lib/schema'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteMetadata.siteUrl),
  title: {
    default: siteMetadata.title,
    template: `%s | Locitra`,
  },
  description: siteMetadata.description,
  keywords: [
    'AI tools',
    'technology',
    'online income',
    'career growth',
    'success stories',
    'digital skills',
    'Locitra',
  ],
  authors: [{ name: siteMetadata.author }],
  creator: siteMetadata.author,
  publisher: siteMetadata.title,
  icons: {
    icon: [
      { url: '/static/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/static/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/static/favicons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/static/favicons/apple-touch-icon.png', sizes: '76x76' }],
    other: [{ rel: 'mask-icon', url: '/static/favicons/safari-pinned-tab.svg', color: '#2563EB' }],
  },
  openGraph: {
    title: 'Locitra',
    description: siteMetadata.description,
    url: siteMetadata.siteUrl,
    siteName: 'Locitra',
    images: [
      {
        url: siteMetadata.siteUrl + siteMetadata.socialBanner,
        width: 1200,
        height: 630,
        alt: 'Locitra — AI, Technology & Online Income',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: siteMetadata.siteUrl,
    types: {
      'application/rss+xml': `${siteMetadata.siteUrl}/feed.xml`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  twitter: {
    title: 'Locitra',
    card: 'summary_large_image',
    description: siteMetadata.description,
    images: [
      {
        url: siteMetadata.siteUrl + siteMetadata.socialBanner,
        alt: 'Locitra — AI, Technology & Online Income',
      },
    ],
  },
  other: {
    'p:domain_verify': 'dcd569660286bafa5addd89a5c08749e',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const basePath = process.env.BASE_PATH || ''

  return (
    <html
      lang={siteMetadata.language}
      className={`${inter.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <link
        rel="apple-touch-icon"
        sizes="76x76"
        href={`${basePath}/static/favicons/apple-touch-icon.png`}
      />
      <link rel="icon" type="image/svg+xml" href={`${basePath}/static/favicons/icon.svg`} />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href={`${basePath}/static/favicons/favicon-32x32.png`}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href={`${basePath}/static/favicons/favicon-16x16.png`}
      />
      <link rel="manifest" href={`${basePath}/static/favicons/site.webmanifest`} />
      <link
        rel="mask-icon"
        href={`${basePath}/static/favicons/safari-pinned-tab.svg`}
        color="#2563EB"
      />
      <meta name="msapplication-TileColor" content="#0F172A" />
      <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
      <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0f172a" />
      <link rel="alternate" type="application/rss+xml" href={`${basePath}/feed.xml`} />
      <body className="bg-white pl-[calc(100vw-100%)] text-black antialiased dark:bg-gray-950 dark:text-white">
        {/* ── Organization + WebSite + Person JSON-LD ───────────────────── */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              buildGraph([
                buildOrganization(),
                buildWebsite(),
                buildPerson({
                  name: siteMetadata.author,
                  occupation: 'Founder & Editor',
                  email: siteMetadata.email,
                }),
              ])
            ),
          }}
        />
        <ThemeProviders>
          <Analytics analyticsConfig={siteMetadata.analytics as AnalyticsConfig} />
          <SectionContainer>
            <SearchProvider searchConfig={siteMetadata.search as SearchConfig}>
              <Header />
              <main className="mb-auto">{children}</main>
            </SearchProvider>
            <Footer />
          </SectionContainer>
        </ThemeProviders>
        <NewsletterPopupWrapper />
        {/* ── Google Analytics 4 ──────────────────────────────────── */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
