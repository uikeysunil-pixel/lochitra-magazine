# Schema & Structured Data Guide

## Purpose
Documents the structured data architecture used to help search engines understand Locitra's content.

## Supported Schema Types

### BlogPosting
- Applied automatically to standard articles.
- Requires: Headline, DatePublished, DateModified, Author, Image.

### Review / SoftwareApplication
- Must be manually specified for software reviews.
- Requires: ItemReviewed, ReviewRating, Pros, Cons, Price.
- See [REVIEW_STANDARD.md](./REVIEW_STANDARD.md).

### Person / Organization
- Defines Locitra as an entity and its authors as recognized experts.

## Implementation Notes
- Schema is injected via Next.js `head` components using JSON-LD.
- Do not manually write JSON-LD inside MDX files; rely on the frontend components reading the MDX frontmatter.

## Related Documents
- See [SEO_CHECKLIST.md](./SEO_CHECKLIST.md) for on-page SEO rules.
