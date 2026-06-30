import siteMetadata from '@/data/siteMetadata'
import { resolveAbsoluteUrl, resolvePostImage } from './seo'
import type {
  OrganizationSchema,
  WebsiteSchema,
  PersonSchema,
  BlogPostingSchema,
  BreadcrumbListSchema,
  GraphSchema,
  JsonLd,
  ReviewSchema,
  ReviewData,
  SoftwareApplicationSchema,
  OfferSchema,
  PricingData,
} from './schema-types'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog, Authors } from 'contentlayer/generated'

// ── Standardized @id Constants ─────────────────────────────────────────────
export const ORGANIZATION_ID = `${siteMetadata.siteUrl}/#organization`
export const WEBSITE_ID = `${siteMetadata.siteUrl}/#website`
export const getPersonId = (slug: string) => `${siteMetadata.siteUrl}/author/${slug}#person`
export const getArticleId = (slug: string) => `${siteMetadata.siteUrl}/blog/${slug}#article`
export const getReviewId = (slug: string) => `${siteMetadata.siteUrl}/blog/${slug}#review`
export const getSoftwareId = (slug: string) => `${siteMetadata.siteUrl}/blog/${slug}#software`

// ── Validation Utility (Dev Only) ────────────────────────────────────────
function validateSchemaNode(node: JsonLd) {
  if (process.env.NODE_ENV !== 'development') return

  if (!node['@type']) console.warn('[Schema Validation] Missing @type:', node)
  if (!node['@id'] && node['@type'] !== 'Graph')
    console.warn(`[Schema Validation] Missing @id in ${node['@type']}`)

  if (node['@type'] === 'Person' && !node.name) {
    console.warn(`[Schema Validation] Person schema missing name:`, node)
  }

  if (typeof node.url === 'string' && !node.url.startsWith('http')) {
    console.warn(`[Schema Validation] Malformed URL in schema (must be absolute):`, node.url)
  }

  if (node.image) {
    const images = Array.isArray(node.image) ? node.image : [node.image]
    images.forEach((img) => {
      if (typeof img === 'string' && !img.startsWith('http')) {
        console.warn(`[Schema Validation] Malformed image URL in schema (must be absolute):`, img)
      }
    })
  }

  // Phase 2A Review Validation
  if (node['@type'] === 'Review') {
    const reviewNode = node as ReviewSchema
    if (reviewNode.reviewRating?.ratingValue < 0 || reviewNode.reviewRating?.ratingValue > 5) {
      console.warn(`[Schema Validation] reviewRating must be between 0 and 5`, node)
    }
    // Note: arrays of pros/cons are typed correctly but we could validate them dynamically here
  }

  // Phase 2B Software Validation
  if (node['@type'] === 'SoftwareApplication') {
    const swNode = node as SoftwareApplicationSchema
    if (!swNode.name) {
      console.warn(`[Schema Validation] SoftwareApplication missing name`, node)
    }
    if (swNode.offers && typeof swNode.offers.price === 'number' && swNode.offers.price < 0) {
      console.warn(`[Schema Validation] Offer price cannot be negative`, node)
    }
  }
}

// ── Builders ─────────────────────────────────────────────────────────────

export function buildOrganization(): OrganizationSchema {
  const schema: OrganizationSchema = {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: siteMetadata.title.split(' - ')[0] || 'Locitra', // Fallback name
    url: siteMetadata.siteUrl,
    description: siteMetadata.description,
    logo: {
      '@type': 'ImageObject',
      url: resolveAbsoluteUrl(siteMetadata.siteLogo),
      width: 512,
      height: 512,
    },
    sameAs: [],
  }

  if (siteMetadata.email) {
    schema.contactPoint = {
      '@type': 'ContactPoint',
      email: siteMetadata.email,
      contactType: 'editorial',
    }
  }

  // Add social links from siteMetadata if present
  const socials = [
    'twitter',
    'github',
    'linkedin',
    'facebook',
    'youtube',
    'instagram',
    'threads',
    'medium',
    'bluesky',
  ] as const
  socials.forEach((social) => {
    const link = siteMetadata[social as keyof typeof siteMetadata]
    if (link && typeof link === 'string') {
      schema.sameAs?.push(link)
    }
  })

  validateSchemaNode(schema)
  return schema
}

export function buildWebsite(): WebsiteSchema {
  const schema: WebsiteSchema = {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: siteMetadata.title.split(' - ')[0] || 'Locitra',
    url: siteMetadata.siteUrl,
    description: siteMetadata.description,
    publisher: { '@id': ORGANIZATION_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteMetadata.siteUrl}/blog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
  validateSchemaNode(schema)
  return schema
}

export function buildPerson(
  author: CoreContent<Authors> | { name: string; email?: string }
): PersonSchema {
  // If slug exists in the author object, we use it, otherwise format the name as a fallback slug
  const slug =
    'slug' in author ? (author.slug as string) : author.name.toLowerCase().replace(/\s+/g, '-')

  const schema: PersonSchema = {
    '@type': 'Person',
    '@id': getPersonId(slug),
    name: author.name,
    url: resolveAbsoluteUrl(`/author/${slug}`),
    worksFor: { '@id': ORGANIZATION_ID },
  }

  if (author.email) schema.email = author.email
  if ('occupation' in author && author.occupation) schema.jobTitle = author.occupation as string
  if ('avatar' in author && author.avatar)
    schema.image = resolveAbsoluteUrl(author.avatar as string)

  if ('expertise' in author && Array.isArray(author.expertise) && author.expertise.length > 0) {
    schema.knowsAbout = author.expertise
  }

  const sameAs: string[] = []
  if ('twitter' in author && author.twitter) sameAs.push(author.twitter as string)
  if ('linkedin' in author && author.linkedin) sameAs.push(author.linkedin as string)
  if ('github' in author && author.github) sameAs.push(author.github as string)
  if ('bluesky' in author && author.bluesky) sameAs.push(author.bluesky as string)

  if (sameAs.length > 0) schema.sameAs = sameAs

  validateSchemaNode(schema)
  return schema
}

export function buildBlogPosting(
  post: Blog | CoreContent<Blog>,
  authorDetails: CoreContent<Authors>[]
): BlogPostingSchema {
  const articleUrl = resolveAbsoluteUrl(`/${post.path}`)

  const schema: BlogPostingSchema = {
    '@type': 'BlogPosting',
    '@id': getArticleId(post.slug),
    headline: post.title,
    url: articleUrl,
    datePublished: post.date,
    dateModified: post.lastmod || post.date,
    description: post.summary,
    image: resolvePostImage(post.featuredImage, post.images),
    publisher: { '@id': ORGANIZATION_ID },
    isPartOf: {
      '@type': 'Blog',
      '@id': `${siteMetadata.siteUrl}/blog#blog`,
      name: siteMetadata.title,
      url: resolveAbsoluteUrl('/blog'),
    },
    inLanguage: siteMetadata.locale || 'en-US',
  }

  if (post.category) {
    schema.articleSection = post.category
  }

  if (post.tags && post.tags.length > 0) {
    schema.keywords = post.tags
  }

  // Handle authors mapping
  if (authorDetails && authorDetails.length > 0) {
    const persons = authorDetails.map((author) => buildPerson(author))
    schema.author = persons.length === 1 ? persons[0] : persons
  } else {
    // Fallback if no authors passed
    schema.author = {
      '@type': 'Person',
      '@id': getPersonId('default'),
      name: siteMetadata.author,
    }
  }

  validateSchemaNode(schema)
  return schema
}

export function buildOffer(pricing?: PricingData): OfferSchema | undefined {
  if (!pricing || (pricing.startingPrice === undefined && !pricing.model)) {
    return undefined
  }

  const offer: OfferSchema = {
    '@type': 'Offer',
  }

  if (pricing.startingPrice !== undefined) offer.price = pricing.startingPrice
  if (pricing.currency) offer.priceCurrency = pricing.currency
  if (pricing.model) offer.category = pricing.model
  if (pricing.freePlan !== undefined)
    offer.availability = pricing.freePlan ? 'https://schema.org/InStock' : undefined

  validateSchemaNode(offer as unknown as JsonLd)
  return offer
}

export function buildOrganizationReference(
  developer?: string
): { '@type': 'Organization'; name: string } | undefined {
  if (!developer) return undefined
  return {
    '@type': 'Organization',
    name: developer,
  }
}

export function buildSoftwareApplication(
  reviewData: ReviewData,
  slug: string
): SoftwareApplicationSchema {
  const schema: SoftwareApplicationSchema = {
    '@type': 'SoftwareApplication',
    '@id': getSoftwareId(slug),
    name: reviewData.productName,
  }

  if (reviewData.officialWebsite) schema.url = reviewData.officialWebsite
  if (reviewData.applicationCategory) schema.applicationCategory = reviewData.applicationCategory
  if (reviewData.operatingSystem) schema.operatingSystem = reviewData.operatingSystem
  if (reviewData.currentVersion) schema.softwareVersion = reviewData.currentVersion

  const brand = buildOrganizationReference(reviewData.developer)
  if (brand) schema.brand = brand

  const offer = buildOffer(reviewData.pricing)
  if (offer) schema.offers = offer

  validateSchemaNode(schema as unknown as JsonLd)
  return schema
}

export function buildReview(
  post: Blog | CoreContent<Blog>,
  authorDetails: CoreContent<Authors>[]
): ReviewSchema | undefined {
  if (!post.review) return undefined

  const reviewData = post.review as ReviewData

  // Map Authors
  let authorNode: { '@id': string } | undefined
  if (authorDetails && authorDetails.length > 0) {
    const author = authorDetails[0] as Record<string, unknown>
    const slug =
      'slug' in author
        ? (author.slug as string)
        : (author.name as string).toLowerCase().replace(/\s+/g, '-')
    authorNode = { '@id': getPersonId(slug) }
  } else {
    authorNode = { '@id': getPersonId('default') }
  }

  // Map Pros/Cons to ItemList
  const buildNotes = (notes?: string[]) => {
    if (!notes || notes.length === 0) return undefined
    return {
      '@type': 'ItemList' as const,
      itemListElement: notes.map((note, idx) => ({
        '@type': 'ListItem' as const,
        position: idx + 1,
        name: note,
      })),
    }
  }

  const schema: ReviewSchema = {
    '@type': 'Review',
    '@id': getReviewId(post.slug),
    itemReviewed: {
      '@id': getSoftwareId(post.slug),
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: reviewData.reviewRating,
      bestRating: 5,
      worstRating: 1,
    },
    author: authorNode,
    publisher: { '@id': ORGANIZATION_ID },
    datePublished: post.date,
    dateModified: post.lastmod || post.date,
  }

  if (reviewData.reviewSummary) {
    schema.reviewBody = reviewData.reviewSummary
  }

  if (reviewData.productName) {
    schema.name = `${reviewData.productName} Review`
  }

  const prosList = buildNotes(reviewData.pros)
  if (prosList) schema.positiveNotes = prosList

  const consList = buildNotes(reviewData.cons)
  if (consList) schema.negativeNotes = consList

  validateSchemaNode(schema as unknown as JsonLd)
  return schema
}

/**
 * Assembles multiple schema entities into a single unified JSON-LD graph.
 */
export function buildGraph(nodes: JsonLd[]): GraphSchema {
  // Validate duplicate IDs
  if (process.env.NODE_ENV === 'development') {
    const ids = new Set<string>()
    nodes.forEach((node) => {
      const id = node['@id']
      if (typeof id === 'string') {
        if (ids.has(id)) {
          console.warn(`[Schema Validation] Duplicate @id found in graph: ${id}`)
        }
        ids.add(id)
      }
    })
  }

  return {
    '@context': 'https://schema.org',
    '@graph': nodes,
  }
}

/**
 * Builds a BreadcrumbList schema for a blog post.
 * Structure: Home > Category (optional) > Article Title
 */
export function buildBreadcrumbs({
  slug,
  title,
  category,
  categoryLabel,
}: {
  slug: string
  title: string
  category?: string
  categoryLabel?: string
}): BreadcrumbListSchema {
  const siteUrl = siteMetadata.siteUrl

  const items: BreadcrumbListSchema['itemListElement'] = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: siteUrl,
    },
  ]

  if (category && categoryLabel) {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: categoryLabel,
      item: `${siteUrl}/categories/${category}`,
    })
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: title,
      item: `${siteUrl}/blog/${slug}`,
    })
  } else {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: title,
      item: `${siteUrl}/blog/${slug}`,
    })
  }

  const schema: BreadcrumbListSchema = {
    '@type': 'BreadcrumbList',
    '@id': `${siteUrl}/blog/${slug}#breadcrumb`,
    itemListElement: items,
  }

  return schema
}
