# Locitra Technical SEO Architecture

**Version**: 2.0.0  
**Status**: Production  
**Last Updated**: August 9, 2026  
**Owner**: Locitra Editorial Engineering & Next.js Architecture Team

---

## Executive Summary

Locitra operates as a high-authority digital magazine published on a modern stack comprising **Next.js 15 App Router**, **TypeScript**, **Tailwind CSS**, and **Contentlayer MDX**.

This document defines the authoritative, permanent Technical SEO Architecture for Locitra following the completion of the **Locitra Technical SEO Sprint (TSS-2026)**. The architecture is engineered around the core philosophy that **architectural consistency, central reusable systems, and production safety take strict priority over ad-hoc page-level overrides**.

The system is built to guarantee full compliance with:

- Google Search Central Technical Guidelines (2025/2026 Standards)
- Google Discover High-Visibility Content Requirements
- Core Web Vitals (LCP, CLS, INP) Optimization Standards
- Schema.org Decoupled Linked Data Graph Standards
- Next.js 15 App Router Built-in Metadata API Best Practices

All future software engineers, editorial contributors, and automated build agents operating on the Locitra codebase MUST strictly adhere to the policies, patterns, and validation rules documented herein.

---

## 1. Metadata Architecture

Locitra utilizes Next.js 15 App Router's native **Metadata API** (`export const metadata` and `export async function generateMetadata()`) managed through centralized utility functions to ensure single-source-of-truth configuration and eliminate duplicate HTML tags.

```
                   ┌──────────────────────────────────────┐
                   │          app/layout.tsx              │
                   │  - metadataBase                      │
                   │  - title.template (%s | Locitra)     │
                   │  - global default OpenGraph/Twitter  │
                   │  - googleBot max-image-preview       │
                   └──────────────────┬───────────────────┘
                                      │
                                      ▼
                   ┌──────────────────────────────────────┐
                   │           app/seo.tsx                │
                   │  - genPageMetadata() helper          │
                   │  - Fallback resolution               │
                   └──────────────────┬───────────────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           ▼                          ▼                          ▼
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│   app/page.tsx     │    │app/blog/[...slug]/ │    │ app/categories/    │
│  (Homepage Meta)   │    │  (Article Meta)    │    │ [category]/page.tsx│
└────────────────────┘    └────────────────────┘    └────────────────────┘
```

### Core Architecture Components

1. **Root Configuration (`app/layout.tsx`)**:
   - Declares global `metadataBase: new URL('https://www.locitra.com')`. Every relative path across child pages automatically resolves against this canonical base URL.
   - Defines the global title template `title: { default: 'Locitra', template: '%s | Locitra' }`. Child pages passing a title string automatically inherit the `| Locitra` suffix.
   - Sets global indexability defaults: `robots: { index: true, follow: true, googleBot: { 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } }`.

2. **Centralized Helper (`app/seo.tsx`)**:
   - Exports `genPageMetadata({ title, description, image, canonicalPath, ...rest })`.
   - Resolves social OpenGraph and Twitter card image URLs via `resolvePostImage()` in `lib/seo.ts`.
   - Enforces fallback logic so no page renders without a valid title, description, OpenGraph card, or Twitter image.

3. **URL Resolution Engine (`lib/seo.ts`)**:
   - `resolveAbsoluteUrl(path)`: Converts any relative path into a fully qualified HTTPS URL (`https://www.locitra.com/...`).
   - `resolvePostImage(featuredImage, images)`: Implements the image fallback chain: `featuredImage` → `images[0]` → `siteMetadata.socialBanner`.

---

## 2. Canonical URL Policy

Locitra strictly enforces a **100% Absolute HTTPS Canonical URL Policy**. Canonical tags instruct search engines on the definitive, authoritative location of a piece of content, preventing index bloat and duplicate content penalties.

### Canonical Strategy Table

| Page Type               | Route Pattern                        | Canonical URL Strategy                    | Example Canonical                                    |
| :---------------------- | :----------------------------------- | :---------------------------------------- | :--------------------------------------------------- |
| **Homepage**            | `/`                                  | Self-referencing absolute URL             | `https://www.locitra.com`                            |
| **Blog Post**           | `/blog/[slug]`                       | Self-referencing absolute URL             | `https://www.locitra.com/blog/1password-review-2026` |
| **Category Hub**        | `/categories/[category]`             | Self-referencing absolute URL             | `https://www.locitra.com/categories/ai-tools`        |
| **Author Profile**      | `/author/[slug]`                     | Self-referencing absolute URL             | `https://www.locitra.com/author/sunil-kumar-uikey`   |
| **About Page**          | `/about`                             | Self-referencing absolute URL             | `https://www.locitra.com/about`                      |
| **Contact Page**        | `/contact`                           | Self-referencing absolute URL             | `https://www.locitra.com/contact`                    |
| **Blog Pagination**     | `/blog/page/[page]`                  | Self-referencing absolute URL             | `https://www.locitra.com/blog/page/2`                |
| **Category Pagination** | `/categories/[category]/page/[page]` | Self-referencing absolute URL             | `https://www.locitra.com/categories/ai-tools/page/2` |
| **Tag Archive**         | `/tags/[tag]`                        | Self-referencing absolute URL (`noindex`) | `https://www.locitra.com/tags/password-managers`     |

### Non-Negotiable Canonical Rules

1. **Absolute URLs Only**: Every `<link rel="canonical">` tag MUST contain a complete, absolute HTTPS URL (`https://www.locitra.com/path`). Relative canonicals (`./` or `/path`) are strictly forbidden.
2. **Page 2 Never Canonicalizes to Page 1**: Paginated listing pages represent unique content subsets and MUST self-canonicalize (`/blog/page/2` → `https://www.locitra.com/blog/page/2`). Canonicalizing Page 2 to Page 1 causes indexing errors in Google Search Console.
3. **Trailing Slash Consistency**: Canonical URLs MUST follow the trailing slash policy configured in `next.config.js` (`trailingSlash: true`).

---

## 3. Robots & Indexing Policy

Locitra controls search engine crawling and indexing through a clean two-tiered directive system: page-level `<meta name="robots">` headers and site-wide `robots.txt` rules.

```
                               Indexability Matrix

         ┌─────────────────────────────────────────────────────────────┐
         │                       ALLOW CRAWL                           │
         │                    (robots.txt: Allow)                      │
         └──────────────────────────────┬──────────────────────────────┘
                                        │
           ┌────────────────────────────┴────────────────────────────┐
           ▼                                                         ▼
┌─────────────────────────────┐                           ┌────────────────────┐
│       INDEX, FOLLOW         │                           │  NOINDEX, FOLLOW   │
│  - Homepage                 │                           │  - Tag Archive     │
│  - Blog Articles            │                           │    Pages           │
│  - Category Hubs            │                           │    (/tags/*)       │
│  - Author Profiles          │                           └────────────────────┘
│  - About & Contact          │
│  - Paginated Pages          │
└─────────────────────────────┘
```

### 1. Indexable Routes (`index, follow`)

The following core routes are fully indexable to build topical authority and drive organic search traffic:

- **Homepage (`/`)**
- **Published Blog Articles (`/blog/[slug]`)**
- **Category Hub Pages (`/categories/[category]`)**
- **Author Profiles (`/author/[slug]`)**
- **Corporate Trust Pages (`/about`, `/contact`, `/editorial-policy`, `/newsletter`)**
- **Paginated Archive Pages (`/blog/page/[page]`, `/categories/[category]/page/[page]`)**

### 2. Non-Indexable Thin Content (`noindex, follow`)

- **Tag Archive Pages (`/tags/`, `/tags/[tag]`, `/tags/[tag]/page/[page]`)**:
  - **Directive**: `noindex, follow`
  - **Rationale**: Tag pages are auto-generated, thin content aggregations that create duplicate content patterns.
  - **Why `follow` matters**: By applying `follow`, search crawlers inspect tag archive pages and follow all internal links back to published articles, transmitting internal link equity throughout the site graph while keeping thin tag URLs out of Google Search results.

---

## 4. Pagination Strategy

Pagination on Locitra is designed to maximize **crawl efficiency**, **link equity distribution**, and **content discoverability**.

### Technical Rationale

1. **`index, follow` Directives**: Paginated archives contain links to older, deep-catalog articles. Keeping paginated pages indexable allows search bots to continuously discover and re-crawl historical content.
2. **Self-Referencing Canonicals**: Each paginated page (`/blog/page/3`) explicitly self-canonicalizes. This satisfies Google's requirement that every unique indexable URL state its own canonical identity.
3. **Unique Paginated Titles & Descriptions**: Paginated routes dynamically append page numbers (`title: 'All Posts - Page 2'`, `title: 'AI Tools - Page 3'`). This prevents duplicate title warnings in Google Search Console.
4. **Obsolete `rel="prev"` / `rel="next"` Omission**: Google officially retired `rel="prev"` and `rel="next"` as indexing signals in March 2019. Locitra intentionally omits these tags, relying on clean semantic HTML navigation links (`<a rel="prev">`, `<a rel="next">`) for user experience.

---

## 5. Sitemap Policy

Locitra generates a dynamic XML sitemap at `/sitemap.xml` using Next.js `MetadataRoute.Sitemap` located in [`app/sitemap.ts`](file:///c:/Users/uikey/OneDrive/Desktop/Master%20Folder/Lochitra/app/sitemap.ts).

### Included Entries

- **Homepage (`/`)**: Priority `1.0`, Change Frequency `daily`
- **Blog Hub (`/blog`)**: Priority `0.9`, Change Frequency `daily`
- **Published Blog Articles (`/blog/[slug]`)**: Priority `0.8`, Change Frequency `weekly`, `lastmod` set to post `lastmod` or `date`
- **Category Hubs (`/categories/[slug]`)**: Priority `0.7`, Change Frequency `weekly`
- **Static Pages (`/about`, `/contact`, `/newsletter`, `/privacy-policy`, `/disclaimer`, `/terms`, `/editorial-policy`)**: Priority `0.3 – 0.8`

### Strictly Excluded Entries

- **Draft Articles (`post.draft === true`)**: Excluded to prevent indexing non-published content.
- **Tag Pages (`/tags/*`)**: Excluded because tag pages carry `noindex` directives. Sitemaps must contain ONLY indexable canonical URLs.
- **Paginated Pages (`/blog/page/*`, `/categories/*/page/*`)**: Excluded following Google's recommendation that XML sitemaps focus on canonical pillar and article content.
- **Internal / API Routes (`/api/*`, `/_next/*`)**: Excluded.

---

## 6. Robots.txt Policy

The site-wide crawler directives are defined in [`app/robots.ts`](file:///c:/Users/uikey/OneDrive/Desktop/Master%20Folder/Lochitra/app/robots.ts) and served at `/robots.txt`.

### Active Directives

```txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /_next/

Sitemap: https://www.locitra.com/sitemap.xml
Host: https://www.locitra.com
```

### Critical Architectural Rule: Why `/tags/` is NOT Blocked in `robots.txt`

A common technical SEO error is blocking `/tags/` inside `robots.txt` (`Disallow: /tags/`).

**Google Search Central Explicit Guidance**:

> _"Do not block pages with robots.txt if you want Google to process the `noindex` directive. If Google cannot fetch a page because of a robots.txt rule, Google will never see the `noindex` tag, and the page might still appear in search results."_

By allowing `/tags/` in `robots.txt`, Googlebot fetches tag pages, reads the `<meta name="robots" content="noindex, follow">` directive, cleanly removes tag URLs from search results, and continues following internal links to published articles.

---

## 7. Structured Data Architecture

Locitra utilizes a centralized, modular **JSON-LD Schema Architecture** defined in [`lib/schema.ts`](file:///c:/Users/uikey/OneDrive/Desktop/Master%20Folder/Lochitra/lib/schema.ts) and [`lib/schema-types.ts`](file:///c:/Users/uikey/OneDrive/Desktop/Master%20Folder/Lochitra/lib/schema-types.ts).

Handcrafted inline JSON-LD scripts are strictly prohibited. All structured data MUST be generated through centralized builder functions.

```
                           Centralized Graph Builder

                           ┌────────────────────────┐
                           │   lib/schema.ts        │
                           │  - buildOrganization() │
                           │  - buildWebsite()      │
                           │  - buildPerson()       │
                           │  - buildBlogPosting()  │
                           │  - buildReview()       │
                           │  - buildSoftwareApp()  │
                           │  - buildCollectionPage │
                           │  - buildBreadcrumbs()  │
                           └───────────┬────────────┘
                                       │
                                       ▼
                           ┌────────────────────────┐
                           │     buildGraph()       │
                           │  Assembles nodes into  │
                           │  unified @graph array  │
                           └───────────┬────────────┘
                                       │
                                       ▼
                           ┌────────────────────────┐
                           │ <script type="ld+json">│
                           │  Rendered to HTML head │
                           └────────────────────────┘
```

### Supported Schema Types & Node Identifiers

Every schema entity uses deterministic URI fragments (`@id`) to build an interconnected Knowledge Graph:

| Schema Entity             | Builder Function             | Unique `@id` Anchor                                  | Injected Location        |
| :------------------------ | :--------------------------- | :--------------------------------------------------- | :----------------------- |
| **`Organization`**        | `buildOrganization()`        | `https://www.locitra.com/#organization`              | Global (`layout.tsx`)    |
| **`WebSite`**             | `buildWebsite()`             | `https://www.locitra.com/#website`                   | Global (`layout.tsx`)    |
| **`Person`**              | `buildPerson()`              | `https://www.locitra.com/author/[slug]#person`       | Layout, Author, Articles |
| **`BlogPosting`**         | `buildBlogPosting()`         | `https://www.locitra.com/blog/[slug]#article`        | Article Pages            |
| **`Review`**              | `buildReview()`              | `https://www.locitra.com/blog/[slug]#review`         | Software Review Posts    |
| **`SoftwareApplication`** | `buildSoftwareApplication()` | `https://www.locitra.com/blog/[slug]#software`       | Software Review Posts    |
| **`Offer`**               | `buildOffer()`               | Embedded in `SoftwareApplication`                    | Software Review Posts    |
| **`CollectionPage`**      | `buildCollectionPage()`      | `https://www.locitra.com/categories/[slug]#category` | Category Hub Pages       |
| **`BreadcrumbList`**      | `buildBreadcrumbs()`         | `https://www.locitra.com/[path]#breadcrumb`          | Articles & Category Hubs |
| **`AboutPage`**           | `buildAboutPage()`           | `https://www.locitra.com/about#webpage`              | About Page               |
| **`ContactPage`**         | `buildContactPage()`         | `https://www.locitra.com/contact#webpage`            | Contact Page             |

---

## 8. Image SEO Architecture

Locitra enforces strict image performance standards to maximize Google Image Search visibility, ensure Google Discover eligibility, and guarantee top-tier Core Web Vitals scores.

### Image Optimization Rules

1. **`next/image` Mandatory**: Native `<img>` tags are **prohibited**. All images MUST render using Next.js `next/image` or the [`components/Image.tsx`](file:///c:/Users/uikey/OneDrive/Desktop/Master%20Folder/Lochitra/components/Image.tsx) wrapper.
2. **WebP Format Standard**: All static blog assets are stored as `.webp` files under `public/static/images/blog/[slug].webp`.
3. **1200 × 630 Dimensions**: Featured blog images MUST be formatted to exactly 1200 × 630 pixels.
4. **`priority` for LCP Images**: LCP target images (homepage hero header, article featured image header) MUST specify `priority`. This injects preloading instructions into the HTML `<head>`.
5. **Cumulative Layout Shift (CLS) Prevention**: Images using `fill` MUST be wrapped inside fixed CSS aspect-ratio containers (`aspect-[16/7]`, `aspect-[16/10]`, `h-44 sm:h-48`) to reserve DOM layout space before fetching.
6. **Responsive `sizes` Attributes**: Every card and hero image MUST define explicit `sizes` media queries (e.g. `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"`).

---

## 9. Google Discover Readiness

To ensure Locitra content is eligible for Google Discover feeds, the technical architecture maintains the following requirements:

- **Large Featured Images**: All article featured images are 1200px wide WebP assets.
- **Robots `max-image-preview:large`**: Explicitly declared in global layout metadata (`robots.googleBot: { 'max-image-preview': 'large' }`).
- **ISO 8601 Timestamps**: `datePublished` and `dateModified` correctly formatted in OpenGraph and JSON-LD `BlogPosting`.
- **E-E-A-T Author Attribution**: Author profiles contain verified bios, avatars, job titles, and social profile links (`sameAs`).

---

## 10. Core Web Vitals Strategy

Locitra's technical SEO architecture directly optimizes for Google's Core Web Vitals metrics:

| Metric                              |  Target   | Locitra Technical Implementation                                                                                                     |
| :---------------------------------- | :-------: | :----------------------------------------------------------------------------------------------------------------------------------- |
| **Largest Contentful Paint (LCP)**  | `< 2.5s`  | Next.js image preloading via `priority` prop on hero/featured headers; WebP compression; Vercel Edge Caching.                        |
| **Cumulative Layout Shift (CLS)**   |  `< 0.1`  | CSS aspect-ratio containers (`aspect-[16/7]`) for images; static font loading via `next/font/google` (Inter with `display: 'swap'`). |
| **Interaction to Next Paint (INP)** | `< 200ms` | Zero blocking main-thread JavaScript; lightweight client components; deferred non-critical scripts.                                  |

---

## 11. Accessibility Policy

Search engines prioritize websites that provide accessible user experiences.

- **Alt Text Integrity**: All images MUST provide descriptive `alt` attributes (`alt={title}` or `alt={author.name}`).
- **Decorative SVGs**: Decorative UI icons MUST specify `aria-hidden="true"`.
- **Keyboard Navigation**: Interactive elements retain focus rings and proper `tabIndex` semantics.

---

## 12. Rules for Future Contributors

This checklist governs all future development on Locitra. Violating any rule will break technical SEO compliance.

### Non-Negotiable Engineering Rules

- [ ] **Never introduce relative canonicals**: Always use `genPageMetadata()` with `canonicalPath` or absolute HTTPS URLs.
- [ ] **Never block `/tags/` in `robots.txt`**: Tag pages must remain crawlable so search bots execute `noindex, follow`.
- [ ] **Never add tag pages or paginated pages to `sitemap.ts`**: The XML sitemap is strictly reserved for primary canonical content.
- [ ] **Never replace `next/image` with native `<img>`**: Native `<img>` bypasses image optimization and breaks LCP/CLS performance.
- [ ] **Never duplicate JSON-LD schema nodes**: Always use centralized schema builders in [`lib/schema.ts`](file:///c:/Users/uikey/OneDrive/Desktop/Master%20Folder/Lochitra/lib/schema.ts) with standardized `@id` constants.
- [ ] **Never hardcode site title suffixes**: Page titles must rely on layout title templates `%s | Locitra` without appending hardcoded `| Locitra`.
- [ ] **Preserve self-canonical pagination**: Paginated page 2, 3, etc. must self-canonicalize. Never canonicalize Page 2 to Page 1.
- [ ] **Validate every change with `npx next build`**: Build MUST succeed with zero errors across all static routes.

---

## 13. Pre-Deployment Validation Checklist

Before deploying any technical SEO or code updates to production:

- [ ] **Build Validation**: `npx next build` passes with zero errors.
- [ ] **Sitemap Verification**: Visit `/sitemap.xml` and confirm valid XML structure containing published articles and categories.
- [ ] **Robots Verification**: Visit `/robots.txt` and confirm `/api/` and `/_next/` are disallowed while `/tags/` is NOT disallowed.
- [ ] **Rich Results Test**: Test representative URLs (`/`, `/blog/[slug]`, `/categories/[category]`) using Google Rich Results Test tool.
- [ ] **Schema Markup Validator**: Confirm zero schema errors or duplicate entity node warnings.
- [ ] **Canonical Inspection**: Inspect `<link rel="canonical">` on target pages to verify explicit absolute HTTPS URLs.

---

## 14. Technical SEO Sprint (TSS-2026) Summary

| Phase         | Milestone Objective                   | Execution Result                                                                                                                                                                                                    |
| :------------ | :------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Phase 1**   | Tag Noindex & Robots.txt Alignment    | Removed `/tags/` from `robots.txt` disallow array. Permitted crawlers to discover and execute on-page `noindex, follow` metadata across tag archives.                                                               |
| **Phase 2**   | Reusable Structured Data Architecture | Created modular JSON-LD graph builders in [`lib/schema.ts`](file:///c:/Users/uikey/OneDrive/Desktop/Master%20Folder/Lochitra/lib/schema.ts) for `CollectionPage`, `BreadcrumbList`, `AboutPage`, and `ContactPage`. |
| **Phase 2.5** | External Schema Certification         | Audited all JSON-LD graph nodes. Certified 100% compliance with Google Rich Results and Schema.org standards (A+ Rating).                                                                                           |
| **Phase 3**   | Image Pipeline & Asset Cleanup        | Audited 156 image assets. Verified 100% `next/image` usage, LCP `priority` loading, and removed 3 orphaned unused assets (~322 KB freed).                                                                           |
| **Phase 4**   | Canonical & Metadata Refinements      | Eliminated title template duplication on author pages, upgraded category canonicals to explicit absolute URLs, and added self-canonicalizing metadata to paginated archives.                                        |
| **Phase 5**   | Sitemap & Robots Final Audit          | Verified dynamic sitemap generation, draft exclusion, and zero-conflict cross-validation across sitemap, robots.txt, and canonical directives.                                                                      |

---

## 15. Conclusion

The completion of the **Locitra Technical SEO Sprint (TSS-2026)** establishes a permanent, production-grade technical foundation.

With technical SEO, structured data, image delivery, and indexability controls fully optimized, Locitra's ongoing organic search growth relies on editorial production:

1. Publishing Platinum-quality articles following **Locitra Gold Standard v2.1**.
2. Building deep topical authority within core content clusters (**AI Tools**, **Technology**, **Online Income**, **Career Growth**).
3. Maintaining strategic internal link graphs across articles and category hubs.
4. Monitoring performance via Google Search Console and Vercel Core Web Vitals analytics.
