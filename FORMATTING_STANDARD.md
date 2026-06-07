# Locitra Content Formatting Standard

**CRITICAL RULE:** Technology category articles are the canonical formatting standard for all future Locitra content.

Future articles in ALL categories, including:
* Technology
* Software Reviews
* AI Tools
* Online Income
* Career Growth
* Success Stories

MUST follow the same exact markdown structure unless explicitly instructed otherwise.

## Required MDX Structure

The article body should follow this exact sequence:

1. **Frontmatter** (standard fields: title, date, category, tags, draft, summary, authors, featuredImage)
2. **Introduction** (`## Introduction` heading directly starting the content)
3. **Main Content Sections** (using standard `##` and `###` headings)
4. **FAQ Section** (`## Frequently Asked Questions` using proper schema markup)
5. **Final Thoughts** (`## Final Thoughts`)
6. **Related Articles** (`## Related Articles` followed by a bulleted list of 3-5 relevant internal article links using actual existing markdown files)

## DO NOT INCLUDE

* **Manual Table of Contents:** Do NOT write manual TOCs, bullet-list navigation blocks, or use `<TOCInline />`. The Next.js layout generates the sidebar TOC automatically.
* **Manual Share Buttons, Author Boxes, or CTAs:** The layout component automatically injects these elements at the bottom of every article.
