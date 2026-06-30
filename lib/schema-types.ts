import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'

export type JsonLd = Record<string, unknown>

export type OrganizationSchema = {
  '@type': 'Organization'
  '@id': string
  name: string
  url: string
  description?: string
  logo?: {
    '@type': 'ImageObject'
    url: string
    width?: number
    height?: number
  }
  contactPoint?: {
    '@type': 'ContactPoint'
    email: string
    contactType: string
  }
  sameAs?: string[]
}

export type WebsiteSchema = {
  '@type': 'WebSite'
  '@id': string
  name: string
  url: string
  description?: string
  publisher?: {
    '@id': string
  }
  potentialAction?: {
    '@type': 'SearchAction'
    target: {
      '@type': 'EntryPoint'
      urlTemplate: string
    }
    'query-input': string
  }
}

export type PersonSchema = {
  '@type': 'Person'
  '@id': string
  name: string
  url?: string
  jobTitle?: string
  email?: string
  image?: string
  sameAs?: string[]
  worksFor?: {
    '@id': string
  }
  knowsAbout?: string[]
}

export type BlogPostingSchema = {
  '@context'?: 'https://schema.org'
  '@type': 'BlogPosting'
  '@id': string
  headline: string
  description?: string
  image?: string | string[]
  url?: string
  datePublished: string
  dateModified?: string
  author?: PersonSchema | PersonSchema[]
  publisher?:
    | {
        '@id': string
      }
    | OrganizationSchema
  isPartOf?: {
    '@type': 'WebSite' | 'Blog'
    '@id'?: string
    name?: string
    url?: string
  }
  inLanguage?: string
  articleSection?: string
  keywords?: string[]
}

export type GraphSchema = {
  '@context': 'https://schema.org'
  '@graph': unknown[]
}

// ── Phase 2A Review Domain Model ──────────────────────────────────────────

export type PricingData = {
  model?: string
  startingPrice?: number
  currency?: string
  freePlan?: boolean
}

/**
 * Editorial frontmatter model for reviews.
 * This is deliberately decoupled from Schema.org naming conventions.
 */
export type ReviewData = {
  productName: string
  reviewRating: number
  developer?: string
  officialWebsite?: string
  applicationCategory?: string
  operatingSystem?: string
  price?: string
  pricingModel?: string
  currentVersion?: string
  reviewSummary?: string
  pros?: string[]
  cons?: string[]
  testedVersion?: string
  lastTested?: string
  reviewedBy?: string
  recommendedFor?: string
  alternatives?: string[]
  affiliateLink?: string
  shortName?: string
  logo?: string
  screenshots?: string[]
  primaryCategory?: string
  supportedPlatforms?: string[]
  website?: string
  freeTrial?: boolean
  pricing?: PricingData
  releaseDate?: string
  lastUpdated?: string
  editorChoice?: boolean
  featured?: boolean
  verificationStatus?: string
}

export type RatingSchema = {
  '@type': 'Rating'
  ratingValue: number
  bestRating?: number
  worstRating?: number
}

export type OfferSchema = {
  '@type': 'Offer'
  price?: number
  priceCurrency?: string
  category?: string
  availability?: string
}

export type SoftwareApplicationSchema = {
  '@type': 'SoftwareApplication'
  '@id': string
  name: string
  url?: string
  applicationCategory?: string
  operatingSystem?: string
  softwareVersion?: string
  brand?: {
    '@type': 'Organization'
    name: string
  }
  offers?: OfferSchema
}

/**
 * JSON-LD output model for Schema.org/Review
 */
export type ReviewSchema = {
  '@type': 'Review'
  '@id': string
  itemReviewed: {
    '@id': string
  }
  reviewRating: RatingSchema
  name?: string
  reviewBody?: string
  positiveNotes?: {
    '@type': 'ItemList'
    itemListElement: {
      '@type': 'ListItem'
      position: number
      name: string
    }[]
  }
  negativeNotes?: {
    '@type': 'ItemList'
    itemListElement: {
      '@type': 'ListItem'
      position: number
      name: string
    }[]
  }
  author?: {
    '@id': string
  }
  publisher?: {
    '@id': string
  }
  datePublished?: string
  dateModified?: string
}

export type BreadcrumbListSchema = {
  '@type': 'BreadcrumbList'
  '@id': string
  itemListElement: {
    '@type': 'ListItem'
    position: number
    name: string
    item?: string
  }[]
}
