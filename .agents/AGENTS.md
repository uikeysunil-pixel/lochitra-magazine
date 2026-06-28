# Locitra MDX Gold Standard v2.1

You are generating content for **Locitra**, a premium technology and digital business publication. Every article you write or edit MUST strictly adhere to the following specification. Failure to do so will break the build.

## A. Technical Standard (Non-Negotiable)

These rules directly affect build compatibility, project functionality, and accessibility. They must be followed strictly.

### 1. YAML Frontmatter Schema
*   Must strictly follow this exact order and structure.
*   All strings and arrays MUST use single quotes (`'`).
```yaml
---
title: '[Title]'
date: 'YYYY-MM-DD'
category: '[category-slug]'
tags: ['tag1', 'tag2']
draft: false
summary: '[150-160 character summary]'
authors: ['sunil-kumar-uikey']
featuredImage: '/static/images/blog/[slug].webp'
---
```

### 2. MDX Syntax & Forbidden Constructs
*   **PROHIBITED**: **NO HTML Comments (`<!-- -->`)**. HTML comments are invalid MDX v2 and cause fatal build crashes.
*   **PROHIBITED**: **NO JSX Comments (`{/* */}`)**. Keep the generated file completely clean and free of developer or metadata comments.
*   **PROHIBITED**: **NO Manual Table of Contents**. Contentlayer handles the TOC automatically at the layout level. Never generate a list of anchor links like `## Table of Contents`.
*   **PROHIBITED**: **NO inline markdown images**. Visuals rely entirely on the `featuredImage` frontmatter property. Do not use inline markdown image syntax in the body.

### 3. Allowed Components
*   **Affiliate Disclosure**: Immediately after the closing `---` of the YAML frontmatter, place the `<AffiliateDisclosure />` component on its own line before any article content begins.
*   **Newsletter CTA**: Can optionally include `<BlogNewsletterForm />` near the end of the article.
*   No other custom JSX components are permitted without explicit approval.

### 4. Heading Hierarchy
*   **PROHIBITED**: **NO H1 (`#`) tags in the body**. The layout already renders the article title as an `<h1>`. Using `#` in the body creates multiple `<h1>` elements, which is an accessibility and SEO anti-pattern.
*   **H2 (`##`)**: Use for all major sections (e.g., `## Introduction`, `## FAQ`, `## Final Verdict`).
*   **H3 (`###`)**: Use for sub-points beneath an H2.
*   **Capitalization**: All headings must strictly use Title Case.

### 5. Internal Linking Format
*   Use standard markdown internal links pointing to the slug: `[anchor text](/blog/slug)`.
*   Do not use full absolute URLs for internal links.

---

## B. Editorial Standard (Evolves Over Time)

These rules dictate the writing style, design conventions, and overall user experience.

### 1. Category Reverse-Engineering (Pre-Writing Step)
Before writing any new article, you must first inspect 3–5 existing published articles from the **SAME category**. 
*   **Objective**: Actively inherit the writing style, section flow, formatting, paragraph rhythm, heading structure, internal linking style, and editorial voice of that specific category to prevent style drift across the magazine.

### 2. Article Flow & Tone
*   **Tone of Voice**: Authoritative, professional, highly informative, yet accessible and conversational. Adhere strictly to E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) principles.
*   **Introduction Style**: Start strong. Immediately address the reader's pain point and context. Avoid fluff.
*   **Paragraph Length**: Keep paragraphs short and punchy (3-4 sentences maximum) to maintain high scannability.
*   **Readability & SEO Style**: Focus on high information density, active voice, and seamless integration of semantic keywords.

### 3. Section Organization & Conventions
*   **Horizontal Rules**: Use horizontal rules (`---`) between major sections where they improve readability, following the style of existing Locitra articles.
*   **Tables**: Utilize standard markdown tables (`| Column | Column |`) heavily for data comparisons, feature breakdowns, and "At a Glance" summaries.
*   **Blockquotes**: Standard blockquotes (`>`) should be used strategically for mid-article newsletter call-to-actions.
*   **FAQ Style**: If an FAQ is included, format the section as `## FAQ` with questions structured as H3s (`### Question?`).

### 4. Article Conclusion
*   **Final Section**: The conclusion must be formatted as an H2 and titled either `## Final Verdict` or `## Final Thoughts`.
*   **Related Articles**: The absolute final section of every article must be `## Related Articles` containing a simple bulleted list of 5-8 relevant internal links.

---

## C. Article Validation Checklist

*This checklist must be executed after generating every new article and before saving or modifying any `.mdx` file. An article is not considered complete until every item passes.*

### Technical Validation
*   [ ] YAML frontmatter exactly matches the required schema.
*   [ ] All required frontmatter fields are present.
*   [ ] String values use single quotes.
*   [ ] Arrays use the correct format.
*   [ ] `<AffiliateDisclosure />` appears immediately after the frontmatter.
*   [ ] No HTML comments (`<!-- -->`) exist.
*   [ ] No JSX comments (`{/* */}`) exist.
*   [ ] No manual Table of Contents exists.
*   [ ] No inline markdown images exist.
*   [ ] Internal links use `/blog/slug`.
*   [ ] No unsupported JSX or HTML exists.
*   [ ] The article compiles successfully with the project's MDX rules.

### Structural Validation
*   [ ] Introduction is present.
*   [ ] Major sections follow the category pattern.
*   [ ] H2/H3 hierarchy is consistent.
*   [ ] No H1 exists inside the article body.
*   [ ] FAQ section follows the project format (if included).
*   [ ] Final section is `## Final Verdict` or `## Final Thoughts`.
*   [ ] `## Related Articles` is the final section.

### Editorial Validation
*   [ ] Writing style matches existing articles from the same category.
*   [ ] Tone is professional and consistent with Locitra.
*   [ ] Paragraphs remain concise.
*   [ ] Tables are used where beneficial.
*   [ ] Internal links are naturally integrated.
*   [ ] The article provides practical value rather than filler.
*   [ ] E-E-A-T principles are maintained throughout.

### SEO Validation
*   [ ] Primary keyword appears naturally.
*   [ ] Semantic keywords are used appropriately.
*   [ ] Headings are descriptive.
*   [ ] Internal linking supports the content cluster.
*   [ ] Summary/frontmatter accurately reflects the article.
*   [ ] The article contributes to topical authority for its category.

### Final Project Validation
*Before completion:*
1.  Compare the article with 3–5 existing articles in the same category.
2.  Ensure formatting, rhythm, and editorial voice are consistent.
3.  Confirm the article introduces no new unsupported MDX syntax.
4.  Confirm the project builds successfully.
5.  Only after all checks pass should the article be considered ready for publication.

---

## D. Featured Image Quality Standard & Pipeline

The Locitra Featured Image Pipeline is strictly separated into Phase A (Content) and Phase B (Asset). 
**NEVER publish an article if the referenced featured image does not yet exist on disk.**

### Image Generation Workflow
1.  The AI must formulate a highly detailed, cinematic image prompt based on the article content.
2.  The asset must be generated, converted to `.webp`, sized to exactly `1200x630`, and saved to `public/static/images/blog/[slug].webp`.
3.  The `featuredImage` frontmatter must point exactly to `/static/images/blog/[slug].webp`.

### Image Validation Checklist
Before final completion, the following visual and technical checks must pass:
*   [ ] `featuredImage` frontmatter path is correctly formatted.
*   [ ] The physical image file (`.webp`) exists in the correct directory.
*   [ ] Image is exactly 1200x630 pixels.
*   [ ] Premium editorial style (NO stock-photo look, NO cartoon/clipart).
*   [ ] Subject fully visible with safe composition (nothing critical near edges).
*   [ ] NO text, NO logos, NO watermarks, NO UI/code screenshots.
*   [ ] NO cropped faces, missing heads, or overcrowded scenes.
*   [ ] Matches the category style guide (e.g., sleek tech for AI, aspirational for Online Income).
*   [ ] Image renders correctly on homepage, category cards, and article page.
