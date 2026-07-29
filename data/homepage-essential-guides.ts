/**
 * @fileoverview Homepage Essential Guides Configuration
 *
 * PURPOSE:
 * Defines the curated list of cornerstone pillar article slugs featured in the
 * permanent "Essential Guides" section on Locitra's homepage. This section
 * strengthens internal linking structure, surfaces high-authority content,
 * optimizes search crawler efficiency, and guides readers to primary topic pillars.
 *
 * ARCHITECTURE & DESIGN DECISIONS:
 * 1. Lightweight Reference (Slugs Only):
 *    Only article slug identifiers are stored in this file. Article metadata
 *    (title, summary, date, featured image, category, reading time) is resolved
 *    dynamically at build/render time from Contentlayer's generated blog collection.
 * 2. Maintainability & Single Source of Truth:
 *    Storing only slugs avoids metadata duplication, ensuring that any updates
 *    to article content or frontmatter automatically propagate to the homepage
 *    without requiring manual updates here.
 * 3. Deterministic Display Order:
 *    The rendered order of cards in the Essential Guides section strictly follows
 *    the array index order defined in this configuration file.
 *
 * NOTE:
 * This list is intentionally curated rather than automatically generated.
 * Only evergreen cornerstone content should appear here to maintain a stable
 * internal linking structure independent of publication date.
 *
 * EDITORIAL GUIDELINES FOR EDITORS:
 * - To feature a new guide, locate the target article's MDX file under `data/blog/`.
 * - Copy its slug (the filename without `.mdx`, e.g., `data/blog/my-article.mdx` -> `"my-article"`).
 * - Place the slug in the `ESSENTIAL_GUIDES_SLUGS` array under its corresponding category comment.
 * - Ensure every entry corresponds to an existing, published article.
 */

export const ESSENTIAL_GUIDES_SLUGS = [
  // AI Tools
  'best-ai-tools-2026',

  // Technology
  'what-is-cybersecurity',

  // Online Income
  'how-to-make-money-online-2026',

  // Career Growth
  'career-growth-2026',

  // Software Reviews
  'best-password-managers-2026',

  // Success Stories
  'blogging-success-stories',
] as const
