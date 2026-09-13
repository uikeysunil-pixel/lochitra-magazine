import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'
import { getCanonicalUrl, resolvePostImage } from '@/lib/seo'

interface PageSEOProps {
  title: string
  description?: string
  image?: string
  canonicalPath?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export function genPageMetadata({
  title,
  description,
  image,
  canonicalPath,
  ...rest
}: PageSEOProps): Metadata {
  const desc = description || siteMetadata.description
  const ogImage = resolvePostImage(image)

  const canonical = canonicalPath ? getCanonicalUrl(canonicalPath) : undefined
  const defaultUrl = `${siteMetadata.siteUrl.replace(/\/$/, '')}/`

  return {
    title,
    description: desc,
    ...(canonical && { alternates: { canonical } }),
    openGraph: {
      title: `${title} | Locitra`,
      description: desc,
      url: canonical || defaultUrl,
      siteName: 'Locitra',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      title: `${title} | Locitra`,
      card: 'summary_large_image',
      description: desc,
      images: [ogImage],
    },
    ...rest,
  }
}
