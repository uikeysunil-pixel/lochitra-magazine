import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'
import { resolveAbsoluteUrl, resolvePostImage } from '@/lib/seo'

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

  const canonical = canonicalPath ? resolveAbsoluteUrl(canonicalPath) : undefined

  return {
    title,
    description: desc,
    ...(canonical && { alternates: { canonical } }),
    openGraph: {
      title: `${title} | Locitra`,
      description: desc,
      url: canonical || siteMetadata.siteUrl,
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
