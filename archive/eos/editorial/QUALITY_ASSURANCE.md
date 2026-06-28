# Quality Assurance Checklist

## Purpose
This checklist must be fully executed before any article is approved for publication.

## QA Checklist

- [ ] **Editorial Review**: Does it meet the [LOCITRA_GOLD_STANDARD_v3.md](./LOCITRA_GOLD_STANDARD_v3.md)?
- [ ] **SEO Review**: Are Title, Meta Description, and Slug optimized per [SEO_CHECKLIST.md](./SEO_CHECKLIST.md)?
- [ ] **Grammar Review**: Is it free of typos and aligned with the [STYLE_GUIDE.md](./STYLE_GUIDE.md)?
- [ ] **Image Review**: Do images meet [IMAGE_STANDARD.md](./IMAGE_STANDARD.md) dimensions and alt-text rules?
- [ ] **Internal Links**: Are there 15-25 valid links following [INTERNAL_LINKING_GUIDE.md](./INTERNAL_LINKING_GUIDE.md)?
- [ ] **External Links**: Are outbound links to reputable, high-EEAT sources?
- [ ] **Schema**: Is structured data (MDX frontmatter) correct per [SCHEMA_GUIDE.md](./SCHEMA_GUIDE.md)?
- [ ] **EEAT**: Does the author/content project authority per [EEAT_GUIDE.md](./EEAT_GUIDE.md)?
- [ ] **Newsletter Placement**: Are CTAs naturally integrated per [NEWSLETTER_STANDARD.md](./NEWSLETTER_STANDARD.md)?
- [ ] **Related Articles**: Does it correctly map to the Related Articles Engine?
- [ ] **Reading Experience**: Is the layout scannable? (No walls of text, good use of bullet points).
- [ ] **Accessibility**: Are contrast ratios and screen-reader tags (alt text) present?
- [ ] **Final Build Verification**: Does `npm run build` pass without MDX syntax errors?

## Related Documents
- See [ARTICLE_TEMPLATE.md](./ARTICLE_TEMPLATE.md) for the workflow leading up to this checklist.
- See [CONTENT_LIFECYCLE.md](./CONTENT_LIFECYCLE.md) for where QA sits in the full publishing workflow.

---

# Article Technical Quality Assurance

> **This section is mandatory.** Every article must pass every item below before it is approved for publication. This checklist was established based on real production regressions encountered on the Locitra platform. It is the final technical gate that runs *after* the editorial QA above and *before* the build is merged to production.

An article is considered **publication-ready** only when all items in both the Editorial QA section above and this Technical QA section have passed.

---

## 1. Author Validation

Cross-reference the `authors` frontmatter field against the actual files in `data/authors/`.

- [ ] Author slug is present in the article frontmatter (e.g., `authors: ['sunil-kumar-uikey']`).
- [ ] A corresponding MDX file exists at `data/authors/<slug>.mdx`.
- [ ] **Never use `authors: ['default']`** — there is no `default.mdx` author file. Using an undefined slug causes a silent null-reference error in the author resolver at `app/blog/[...slug]/page.tsx`.
- [ ] The author page (`/author/<slug>`) renders correctly.
- [ ] Author name and bio display correctly inside the article.
- [ ] Author structured data (`Person` schema) resolves without error.

> **Known failure mode:** Using `authors: ['default']` causes `allAuthors.find()` to return `undefined`, which silently breaks the author card and the BlogPosting JSON-LD author field.

---

## 2. Frontmatter Validation

Verify that the MDX frontmatter is complete and conforms to the Locitra Contentlayer schema defined in `contentlayer.config.ts`.

- [ ] `title` — Present, descriptive, contains primary keyword.
- [ ] `date` — ISO 8601 format (`YYYY-MM-DD`).
- [ ] `lastmod` — ISO 8601 format. Set to publication date on first publish.
- [ ] `tags` — Array of strings. At minimum one category tag.
- [ ] `draft` — Explicitly set to `false` before publishing.
- [ ] `summary` — Present, under 155 characters, compelling.
- [ ] `images` — Array pointing to a valid WebP path under `/static/images/blog/`.
- [ ] `authors` — Array containing a valid, existing author slug (see Author Validation above).
- [ ] `layout` — Set to `PostLayout` for standard articles (must match a file in `layouts/`).
- [ ] `canonicalUrl` — Full absolute URL (e.g., `https://lochitra.com/blog/<slug>`).
- [ ] `category` — Set to the correct category slug if category-level routing is required.

---

## 3. Featured Image Validation

- [ ] The image file physically exists at the path declared in `images` frontmatter.
- [ ] Format is **WebP** only. No JPG, PNG, or GIF as featured images.
- [ ] Dimensions are **1200 × 630 pixels**.
- [ ] No text, logo, or watermark embedded in the image.
- [ ] `alt` text is set wherever the image is used in MDX body content.
- [ ] The Open Graph and Twitter card images render correctly when the URL is previewed in a social debugger.

> **Note:** A missing featured image does not crash the build (a fallback is used), but it will degrade social sharing CTR and OG metadata quality significantly.

---

## 4. Internal Link Validation

- [ ] Every internal link (`/blog/<slug>`) was verified against the actual files in `data/blog/` before the article was written.
- [ ] No invented slugs. Only link to articles confirmed to exist as `.mdx` files.
- [ ] No broken links (404s) exist in the article.
- [ ] The article links back to its parent Pillar (if it is a Supporting article).
- [ ] The article does not create an orphan page — at minimum one other existing article links to it.
- [ ] Links strengthen the correct content cluster per [CONTENT_CLUSTER_BLUEPRINT.md](./CONTENT_CLUSTER_BLUEPRINT.md).
- [ ] Minimum 15 validated internal links present per [INTERNAL_LINKING_GUIDE.md](./INTERNAL_LINKING_GUIDE.md).

---

## 5. MDX Syntax Validation

- [ ] The article compiles through Contentlayer without errors (verify in `npm run dev` terminal output).
- [ ] No unclosed JSX tags.
- [ ] No invalid or unsupported MDX component usage.
- [ ] No raw `{}` expressions that would be interpreted as JavaScript by the MDX compiler.
- [ ] No malformed Markdown (e.g., broken tables, improperly nested lists).
- [ ] No invalid import statements in the MDX body.
- [ ] Special characters (e.g., `<`, `>`, `{`, `}`) are escaped or placed inside code blocks when used literally in body text.

---

## 6. HTML and Script Validation

This section was added directly from a production regression. Apply it strictly.

- [ ] **No raw `<script>` tags inside any MDX file.** Script tags in MDX are not supported and will cause hydration errors.
- [ ] **No `<script>` elements placed outside of `<body>` in `app/layout.tsx`.** In Next.js 15 App Router, any `<script>` placed as a direct child of `<html>` (before `<body>`) triggers the error: *"Cannot render a sync or defer `<script>` outside the main document without knowing its order."* All JSON-LD and analytics scripts must be inside `<body>`.
- [ ] JSON-LD injection follows the current Locitra architecture: site-level schema lives inside `<body>` in `app/layout.tsx`; article-level schema is injected via `app/blog/[...slug]/page.tsx`.
- [ ] No raw HTML `<iframe>`, `<embed>`, or `<object>` tags are present in MDX without explicit review.

---

## 7. Schema Validation

- [ ] `BlogPosting` structured data is generated correctly (verify via Google Rich Results Test after deployment).
- [ ] The `author` field within `BlogPosting` resolves to a valid `Person` entity, not `undefined`.
- [ ] Site-level `Organization`, `WebSite`, and `Person` schemas remain intact (they are generated by `app/layout.tsx` — confirm they were not accidentally removed or modified).
- [ ] No duplicate schema blocks exist on the same page.
- [ ] For review articles: `Review` and `SoftwareApplication` schemas are present per [SCHEMA_GUIDE.md](./SCHEMA_GUIDE.md).

---

## 8. Reading Experience Validation

Open the article locally at `http://localhost:3000/blog/<slug>` and verify:

- [ ] Table of Contents renders and all anchor links scroll correctly.
- [ ] Reading Progress bar activates on scroll.
- [ ] "Copy Link" button in the reading utilities bar works.
- [ ] Toast notification fires on copy.
- [ ] Related Articles section displays at least one article.
- [ ] Newsletter CTA block is visible and correctly positioned.
- [ ] Author card displays the correct name, avatar, and bio.

---

## 9. SEO Validation

- [ ] `<title>` tag matches the intended SEO title (check browser tab and page source).
- [ ] Meta description is present and under 155 characters.
- [ ] Canonical URL is correct and matches `siteMetadata.siteUrl + /blog/<slug>`.
- [ ] Open Graph `og:image` resolves to the correct featured image.
- [ ] Twitter card `twitter:image` resolves correctly.
- [ ] The article is structured for Featured Snippet capture (concise definitions under H2 headers, numbered lists for processes, tables for comparisons) per [SEO_CHECKLIST.md](./SEO_CHECKLIST.md).

---

## 10. Build Validation

Run the full build pipeline in this order. Do **not** skip steps.

```bash
npm run lint
npx tsc --noEmit
npm run build
```

- [ ] `npm run lint` — The new article must introduce **zero new lint errors**. Pre-existing project-wide lint errors (e.g., in `scripts/`) are documented separately and are not a blocker, but must be noted.
- [ ] `npx tsc --noEmit` — The new article must introduce **zero new TypeScript errors**. Pre-existing TS6307 errors related to Contentlayer `.mjs` files are a known project-level issue, not an article issue.
- [ ] `npm run build` — Must complete with `✓ Generating static pages` and **no build failures** specific to the new article's route.
- [ ] Both the new article's route (`/blog/<slug>`) and its parent Pillar route appear in the build output route table.

> **Documenting pre-existing errors:** If `lint` or `tsc` report errors that existed before the new article was added, note them in the article's QA record but do not count them as blockers for this article's approval. The article author is not responsible for pre-existing project debt.

---

## 11. Manual Browser Verification

Open the published article URL locally and perform a final human review:

- [ ] Page loads without a white screen or runtime crash.
- [ ] Browser console shows **no React errors** and **no hydration warnings**.
- [ ] All images render. No broken image icons.
- [ ] All internal and external links open the correct destination.
- [ ] Layout is correct on a desktop viewport (1280px+).
- [ ] Layout is correct on a mobile viewport (375px).
- [ ] No horizontal overflow or layout breakage on any screen size.

---

# Structured Data Quality Assurance (Schema QA)

This checklist is a mandatory validation gate before publishing any article or deploying any structured-data-related change. For implementation details and schemas, refer to [SCHEMA_GUIDE.md](./SCHEMA_GUIDE.md).

## 1. Global Structured Data

Verify:
- [ ] Exactly one **Organization** schema exists.
- [ ] Exactly one **WebSite** schema exists.
- [ ] Exactly one **site-level Person** schema exists.
- [ ] Global schemas are generated only from the Root Layout.
- [ ] No duplicate global entities are emitted elsewhere.

## 2. Article Structured Data

For standard articles verify:
- [ ] BlogPosting schema generated.
- [ ] Breadcrumb schema generated.
- [ ] Author entity resolves correctly.
- [ ] Canonical URL matches schema.
- [ ] Publication date is correct.
- [ ] Modified date is correct.
- [ ] Featured image matches metadata.
- [ ] Unique `@id` values are generated.
- [ ] Article schema links correctly to Organization and Author.

## 3. Software Review Structured Data

For review articles verify:
- [ ] Review schema generated.
- [ ] SoftwareApplication (or Product) schema generated.
- [ ] Review rating data is correct.
- [ ] Pricing information (if applicable) is accurate.
- [ ] Breadcrumb schema generated.
- [ ] BlogPosting schema preserved.
- [ ] Unique `@id` values maintained.

## 4. Author Structured Data

Verify:
- [ ] Author page generates a valid Person schema.
- [ ] Author `@id` is unique.
- [ ] Author is not duplicated as the site-level Person.
- [ ] Author metadata matches the author profile.

## 5. JSON-LD Validation

Verify:
- [ ] JSON-LD is rendered correctly.
- [ ] JSON-LD is visible in the page source.
- [ ] JSON-LD contains valid syntax.
- [ ] No malformed objects.
- [ ] No duplicate properties.
- [ ] No invalid nesting.

## 6. Entity Relationship Validation

Verify:
- [ ] Organization references WebSite correctly.
- [ ] BlogPosting references Organization.
- [ ] BlogPosting references Author.
- [ ] Review references SoftwareApplication.
- [ ] Breadcrumb references the correct URLs.
- [ ] All `@id` values are unique and consistently linked.

## 7. Rich Results Validation

Verify:
- [ ] Google Rich Results Test passes.
- [ ] Schema Markup Validator passes.
- [ ] No critical structured data errors.
- [ ] No structured data warnings introduced by the current change.

> **Note:** Document any pre-existing warnings separately from errors.

## 8. Deployment Validation

Before deployment verify:
- [ ] Homepage source contains the global Organization graph exactly once.
- [ ] Article pages contain only the expected page-level schemas.
- [ ] Review pages contain only the expected review schemas.
- [ ] Author pages contain the correct Person schema.
- [ ] No duplicate Organization, WebSite, or site-level Person schemas.

## 9. Build Validation

Run and verify:
- [ ] `npm run lint`
- [ ] `npx tsc --noEmit`
- [ ] `npm run build`

> **Note:** Any failures must be classified as either existing project issues or newly introduced issues. No deployment should proceed if the current change introduces new structured data errors.

---

## Publication Approval Gate

An article may only be merged to production when **every checkbox** in both the Editorial QA and this Technical QA section is checked.

If any item fails:

1. **Do not publish.**
2. Identify and fix the root cause.
3. Re-run the **entire** Technical QA checklist from the top.
4. Rebuild: `npm run build`
5. Re-verify the article in the browser.
6. Only then proceed to publication.

> **This gate is non-negotiable.** Skipping any item risks introducing regressions that affect every page on the Locitra platform, not just the new article.

---

## Related Documents
- See [ARTICLE_TEMPLATE.md](./ARTICLE_TEMPLATE.md) for the pre-QA writing workflow.
- See [CONTENT_LIFECYCLE.md](./CONTENT_LIFECYCLE.md) for the full lifecycle from planning to retirement.
- See [SCHEMA_GUIDE.md](./SCHEMA_GUIDE.md) for structured data architecture.
- See [IMAGE_STANDARD.md](./IMAGE_STANDARD.md) for featured image specifications.
- See [INTERNAL_LINKING_GUIDE.md](./INTERNAL_LINKING_GUIDE.md) for link validation rules.
- See [SEO_CHECKLIST.md](./SEO_CHECKLIST.md) for on-page SEO requirements.
