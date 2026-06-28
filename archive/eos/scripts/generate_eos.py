import os

docs_dir = os.path.join("docs", "editorial")
os.makedirs(docs_dir, exist_ok=True)

files = {}

files["README.md"] = """# Locitra Editorial Operating System (EOS)

Welcome to the Locitra Editorial Operating System. This documentation is the single source of truth for every article, review, comparison, image, social media asset, and contributor on the Locitra platform.

## Purpose
The EOS standardizes our entire content production pipeline. It is written for both human editors and AI assistants (like ChatGPT, Gemini, Claude, Cursor, and Antigravity IDE) to ensure absolute consistency at scale.

## Documentation Structure

### Core Standards
- **[LOCITRA_GOLD_STANDARD_v3.md](./LOCITRA_GOLD_STANDARD_v3.md)**: The canonical editorial handbook. Start here.
- **[STYLE_GUIDE.md](./STYLE_GUIDE.md)**: Tone, voice, formatting, and prohibited terminology.
- **[CHANGELOG.md](./CHANGELOG.md)**: Version history of the EOS.

### Workflows and Processes
- **[CONTENT_LIFECYCLE.md](./CONTENT_LIFECYCLE.md)**: The operational workflow from planning to retirement.
- **[ARTICLE_TEMPLATE.md](./ARTICLE_TEMPLATE.md)**: Step-by-step article creation workflow.
- **[QUALITY_ASSURANCE.md](./QUALITY_ASSURANCE.md)**: The final approval checklist before publishing.
- **[MAINTENANCE_CHECKLIST.md](./MAINTENANCE_CHECKLIST.md)**: Recurring audits and refresh cycles.

### Strategy and Growth
- **[CONTENT_CLUSTER_BLUEPRINT.md](./CONTENT_CLUSTER_BLUEPRINT.md)**: Roadmap of existing and planned clusters.
- **[CATEGORY_GUIDELINES.md](./CATEGORY_GUIDELINES.md)**: Specific rules for our various content categories.
- **[MONETIZATION_GUIDE.md](./MONETIZATION_GUIDE.md)**: Ethics and workflows for affiliate and commercial content.
- **[ROADMAP.md](./ROADMAP.md)**: Long-term platform development phases.

### SEO, Linking, and EEAT
- **[SEO_CHECKLIST.md](./SEO_CHECKLIST.md)**: On-page SEO, metadata, and Featured Snippet optimization.
- **[INTERNAL_LINKING_GUIDE.md](./INTERNAL_LINKING_GUIDE.md)**: Hub/Supporting relationships and anchor text rules.
- **[EEAT_GUIDE.md](./EEAT_GUIDE.md)**: Experience, Expertise, Authoritativeness, and Trustworthiness standards.
- **[SCHEMA_GUIDE.md](./SCHEMA_GUIDE.md)**: Structured data architecture.

### Specific Content Formats
- **[REVIEW_STANDARD.md](./REVIEW_STANDARD.md)**: Software review testing and rating methodology.
- **[IMAGE_STANDARD.md](./IMAGE_STANDARD.md)**: AI image prompting, dimensions, and optimization.
- **[YOUTUBE_CONTENT_STANDARD.md](./YOUTUBE_CONTENT_STANDARD.md)**: Video scripts, Shorts, and ElevenLabs guidelines.
- **[SOCIAL_MEDIA_STANDARD.md](./SOCIAL_MEDIA_STANDARD.md)**: Platform-specific guidelines (Pinterest, X, LinkedIn).
- **[NEWSLETTER_STANDARD.md](./NEWSLETTER_STANDARD.md)**: Brevo workflows and CTA placements.
- **[CONTRIBUTOR_GUIDE.md](./CONTRIBUTOR_GUIDE.md)**: Guidelines for guest authors and external writers.

> **Note**: No document in this system should duplicate instructions found in another. Always follow the links to the canonical source document for specific guidance.
"""

files["LOCITRA_GOLD_STANDARD_v3.md"] = """# Locitra Gold Standard v3.0

## Purpose
The Locitra Gold Standard is the canonical editorial handbook. It defines the universal quality bar every piece of content must meet before publication.

## Core Directives

### 1. Competitor Analysis
Before writing any content, editors and AI agents must:
- Analyze the highest-ranking pages for the target keyword.
- Identify missing information, outdated advice, or poor UX.
- Ensure Locitra's article is significantly more comprehensive and practical.
- Never copy competitor structure or wording.

### 2. Original Value Guarantee
Do not simply summarize what is already available online. Every article must include:
- Practical frameworks or decision trees.
- Step-by-step action plans.
- Checklists and professional recommendations.
- Real-world implementation tips.

### 3. Article Length Targets
Quality supersedes word count, but general targets include:
- **Pillar Guide**: 5,000–7,000 words
- **Industry Analysis**: 4,000–6,000 words
- **Tutorial / Comparison**: 4,000–5,000 words
- **Supporting Article**: 3,000–4,500 words
- **Software Review**: 3,500–5,000 words
- **Beginner Guide**: 3,000–4,000 words

### 4. Content Freshness
- Write as if the article is being published today.
- Use current information and avoid outdated references.
- Structure content to be *evergreen*, requiring only minor annual updates.

### 5. Statistics Policy
- Never invent statistics.
- Reference reputable organizations and include the publication year.
- Avoid unsupported percentages. If reliable data is unavailable, state this honestly.

### 6. User Experience
- Every major section must answer: *"What should the reader do next?"*
- Conclude headings with actionable advice.

## Related Documents
- See [QUALITY_ASSURANCE.md](./QUALITY_ASSURANCE.md) for pre-publish validation.
- See [EEAT_GUIDE.md](./EEAT_GUIDE.md) for authority requirements.
- See [STYLE_GUIDE.md](./STYLE_GUIDE.md) for readability and writing mechanics.
"""

files["CHANGELOG.md"] = """# EOS Changelog

All notable changes to the Locitra Editorial Operating System (EOS) will be documented in this file.

## [v3.0.0] - 2026-06-28
### Added
- Created the comprehensive `docs/editorial/` architecture.
- Added 22 dedicated markdown files for operational workflows.
- Introduced `CONTENT_LIFECYCLE.md` and `QUALITY_ASSURANCE.md`.
- Formalized AI Assistant Compatibility standards.

### Deprecated
- Standalone, unversioned guidelines previously scattered in scratchpads.
- Reliance on duplicated rules in `.agents/AGENTS.md`.

## [v2.0.0] - (Historical)
### Added
- AI Career Cluster standards.
- Initial Structured Data and Newsletter System integrations.

## [v1.0.0] - (Historical)
### Added
- Initial Locitra Gold Standard for content creation.
"""

files["STYLE_GUIDE.md"] = """# Locitra Style Guide

## Purpose
This document defines the editorial consistency of the Locitra platform. It is designed to ensure a seamless, human-written tone across all content, regardless of the author (human or AI).

## Voice and Tone
- **Voice**: Authoritative, optimistic, practical, and highly experienced.
- **Tone**: Conversational but professional. Speak *to* the reader, not *at* them.

## Formatting Rules
- **Paragraphs**: Keep paragraphs short (2-4 sentences) to prevent walls of text.
- **Active Voice**: Use active voice over passive voice. (e.g., "AI generates content" instead of "Content is generated by AI").
- **Capitalization**: Title Case for all H1, H2, and H3 headers. 

## Banned Phrases & AI Clichés
To maintain a human writing style, strictly avoid the following predictable phrases:
- "In today's fast-paced digital world..."
- "Let's dive in!"
- "A testament to..."
- "Tapestry of..."
- "A symphony of..."
- "It is important to note that..."
- "In conclusion..."

## Readability
- Maintain a Reading Grade of 7–9.
- Use natural sentence variation (mix short and long sentences).
- Provide simple explanations for complex technical topics.

## Related Documents
- See [LOCITRA_GOLD_STANDARD_v3.md](./LOCITRA_GOLD_STANDARD_v3.md) for overall quality rules.
- See [CONTRIBUTOR_GUIDE.md](./CONTRIBUTOR_GUIDE.md) for formatting submission standards.
"""

files["ARTICLE_TEMPLATE.md"] = """# Article Template & Workflow

## Purpose
This document provides the standard framework for creating an article on Locitra.

## Article Workflow Steps

1. **Planning & Keyword Research**: Identify the primary keyword, search intent, and target cluster.
2. **Competitor Analysis**: Follow the protocol in [LOCITRA_GOLD_STANDARD_v3.md](./LOCITRA_GOLD_STANDARD_v3.md).
3. **Outlining**: Define H2s and H3s. Incorporate decision trees and checklists.
4. **Drafting**: Write the content following the [STYLE_GUIDE.md](./STYLE_GUIDE.md).
5. **Internal Linking**: Insert 15-25 links following the [INTERNAL_LINKING_GUIDE.md](./INTERNAL_LINKING_GUIDE.md).
6. **Media Generation**: Create images per the [IMAGE_STANDARD.md](./IMAGE_STANDARD.md).
7. **SEO Optimization**: Apply metadata per the [SEO_CHECKLIST.md](./SEO_CHECKLIST.md).
8. **Quality Assurance**: Run the [QUALITY_ASSURANCE.md](./QUALITY_ASSURANCE.md) checklist.
9. **Publishing**: Commit to the Next.js `data/blog/` directory.

## Standard Article Structure
1. Title (H1)
2. Frontmatter (MDX)
3. Hook/Introduction
4. TOC Component
5. Key Takeaways
6. Core Content (H2, H3, H4)
7. FAQs
8. Final Thoughts / Next Steps

## Related Documents
- See [CONTENT_LIFECYCLE.md](./CONTENT_LIFECYCLE.md) for the macro-level operational workflow.
"""

files["CONTENT_LIFECYCLE.md"] = """# Content Lifecycle

## Purpose
This document outlines the complete, end-to-end operational workflow for every article published on Locitra.

## The Lifecycle

1. **Planning**: Topic selection based on the [CONTENT_CLUSTER_BLUEPRINT.md](./CONTENT_CLUSTER_BLUEPRINT.md).
2. **Keyword Research**: Identifying primary, secondary, and LSI keywords.
3. **Competitor Analysis**: Reviewing top-ranking SERPs to identify gaps.
4. **Writing**: Drafting the content per [ARTICLE_TEMPLATE.md](./ARTICLE_TEMPLATE.md).
5. **Editing**: Refining tone, style, and readability per [STYLE_GUIDE.md](./STYLE_GUIDE.md).
6. **Images**: Generating visual assets per [IMAGE_STANDARD.md](./IMAGE_STANDARD.md).
7. **SEO Review**: Validating metadata per [SEO_CHECKLIST.md](./SEO_CHECKLIST.md).
8. **Quality Assurance**: Final pass against [QUALITY_ASSURANCE.md](./QUALITY_ASSURANCE.md).
9. **Publishing**: Merging to production via Next.js and Contentlayer.
10. **Promotion**: Distributing via Newsletters and Social Media.
11. **Monitoring**: Tracking SERP rankings and engagement metrics.
12. **Annual Update**: Scheduled refreshes per [MAINTENANCE_CHECKLIST.md](./MAINTENANCE_CHECKLIST.md).
13. **Retirement**: Deprecating and redirecting if content becomes fundamentally obsolete.
"""

files["QUALITY_ASSURANCE.md"] = """# Quality Assurance Checklist

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
"""

files["MAINTENANCE_CHECKLIST.md"] = """# Maintenance Checklists

## Purpose
To ensure Locitra's content remains evergreen, accurate, and high-performing, these recurring maintenance checklists must be executed.

## Monthly Maintenance
- [ ] **Broken Link Checks**: Scan for 404s on internal and external links.
- [ ] **Affiliate Review Updates**: Verify pricing and features in [REVIEW_STANDARD.md](./REVIEW_STANDARD.md) articles.
- [ ] **Newsletter Performance**: Audit CTA conversion rates.

## Quarterly Maintenance
- [ ] **Content Refreshes**: Update any articles showing ranking decay (drops in SERP positions).
- [ ] **Internal Link Audits**: Ensure new articles are linked from older, relevant pillar posts.
- [ ] **Image Optimization**: Audit WebP sizes and loading speeds.

## Yearly Maintenance
- [ ] **Schema Validation**: Run full site checks against Google's Rich Results tool.
- [ ] **SEO Audits**: Re-evaluate keyword difficulty and search intent changes.
- [ ] **Date Bumping**: Update "2026" content to "2027" where the information has been thoroughly verified as still accurate.

## Related Documents
- See [CONTENT_LIFECYCLE.md](./CONTENT_LIFECYCLE.md) for where maintenance fits in the workflow.
"""

files["CATEGORY_GUIDELINES.md"] = """# Category Guidelines

## Purpose
Defines the specific standards, writing styles, and ideal formats for each of Locitra's primary content categories.

## 1. AI Tools
- **Focus**: Practical applications, UI ease of use, pricing, and limitations.
- **Article Types**: Listicles, How-To Tutorials.
- **Internal Linking**: Link heavily to Online Income and Career Growth clusters.

## 2. Technology
- **Focus**: Clear, jargon-free explanations of complex concepts (e.g., Blockchain, AGI).
- **Article Types**: Beginner Guides, Industry Analysis.
- **Common Mistakes**: Being too academic. Use analogies.

## 3. Online Income
- **Focus**: Realistic, non-scammy, highly actionable frameworks.
- **Article Types**: Case Studies, Action Plans.
- **Style**: Highly grounded. Avoid "get rich quick" language. See [MONETIZATION_GUIDE.md](./MONETIZATION_GUIDE.md).

## 4. Career Growth
- **Focus**: Professional development, soft skills, navigating the AI era.
- **Article Types**: Pillar Guides, Decision Trees.
- **Search Intent**: Informational and navigational.

## 5. Success Stories
- **Focus**: Real-world examples of professionals or bloggers achieving results.
- **Style**: Narrative-driven, interview-style.

## 6. Software Reviews
- **Focus**: Deep, hands-on testing, verified pros/cons, and direct comparisons.
- **Methodology**: Must follow the [REVIEW_STANDARD.md](./REVIEW_STANDARD.md) strictly.

## Related Documents
- See [CONTENT_CLUSTER_BLUEPRINT.md](./CONTENT_CLUSTER_BLUEPRINT.md) for how these categories map to clusters.
"""

files["CONTENT_CLUSTER_BLUEPRINT.md"] = """# Content Cluster Blueprint

## Purpose
This document maps every existing and planned content cluster. It serves as Locitra's long-term growth roadmap and prevents content cannibalization.

## Active Clusters

### 1. AI Career Cluster
- **Pillar**: How AI Is Changing Careers (2026)
- **Supporting**: AI Skills Employers Want, Leadership in the AI Era, Best AI Tools for Professionals.
- **Future Opportunities**: AI Interview Prep, AI for Freelance Career Growth.

### 2. Blogging & Online Income Cluster
- **Pillar**: How to Start a Blog and Make Money
- **Supporting**: Blogging Success Stories, Affiliate Marketing for Bloggers, SEO for New Bloggers.
- **Commercial Opportunities**: Deep reviews of hosting platforms and keyword tools.

### 3. Digital Privacy & Security Cluster
- **Pillar**: What is Cybersecurity?
- **Supporting**: Best Password Managers, VPN Reviews, Digital Identity Explained.
- **Commercial Opportunities**: High-converting VPN and Password Manager affiliate links.

## Internal Linking Strategy
All Supporting articles MUST link back to their respective Pillar. Pillars must link contextually to Supporting articles to distribute page authority. See [INTERNAL_LINKING_GUIDE.md](./INTERNAL_LINKING_GUIDE.md).

## Related Documents
- See [ROADMAP.md](./ROADMAP.md) for how new clusters fit into future platform phases.
"""

files["MONETIZATION_GUIDE.md"] = """# Monetization Guide

## Purpose
This document ensures that monetization efforts (affiliate marketing, ads) never compromise Locitra's editorial quality or user trust.

## Core Principles
1. **Editorial Independence**: Monetization must not influence review scores or editorial recommendations.
2. **Transparency**: Affiliate disclosures must be placed prominently before any commercial links.

## Affiliate Philosophy
- Only recommend tools we have tested or deeply researched.
- Provide objective pros and cons, even for high-paying affiliates.
- Compare affiliate tools against non-affiliate tools fairly.

## Monetization Integration
- **Reviews**: Use standard pricing tables and pros/cons boxes. See [REVIEW_STANDARD.md](./REVIEW_STANDARD.md).
- **Newsletter**: Use the newsletter for relationship building first, and subtle product recommendations second. See [NEWSLETTER_STANDARD.md](./NEWSLETTER_STANDARD.md).
- **Pinterest & YouTube**: Ensure all social media funnels provide value before asking for a click.

## Related Documents
- See [EEAT_GUIDE.md](./EEAT_GUIDE.md) to understand why trust is more valuable than short-term clicks.
"""

files["ROADMAP.md"] = """# Project Roadmap

## Purpose
Documents Locitra's long-term development and platform evolution phases.

## Completed Phases
- **Phases 1-6**: Initial deployment, Next.js architecture, Contentlayer integration, EEAT framework, Newsletter System, and EOS documentation.

## Future Phases

### Phase 7: Advanced Search
- Implementation of Algolia or similar full-text search.
- Faceted filtering by category and tag.

### Phase 8: Multilingual Platform
- i18n routing setup in Next.js.
- Spanish and French content translation workflows.

### Phase 9: Bookmarks
- Local storage or DB-backed user bookmarks for saving articles.

### Phase 10: Member Accounts
- Auth.js integration.
- Gated premium content for subscribers.

### Phase 11: Community Features
- Comment sections on specific article types.
- User-generated success stories.

### Phase 12: AI Personalization
- Dynamic content recommendations based on user reading history.

## Related Documents
- See [CONTENT_CLUSTER_BLUEPRINT.md](./CONTENT_CLUSTER_BLUEPRINT.md) for how content scales with these platform changes.
"""

files["INTERNAL_LINKING_GUIDE.md"] = """# Internal Linking Guide

## Purpose
Establishes the rules for internal linking to maximize SEO equity flow and improve user navigation.

## Hub ↔ Supporting Relationships
- **Supporting to Hub**: Every supporting article MUST link back to its parent Pillar Guide in the introduction or early sections.
- **Hub to Supporting**: Pillar Guides must act as a table of contents, linking out to all relevant supporting articles.

## Link Volume
- Generate between **15–25 validated contextual internal links** per long-form article.
- Balance links naturally between Pillars, Supporting articles, and Reviews.

## Anchor Text Best Practices
- Use descriptive anchor text (e.g., "our guide to [SEO for new bloggers](/blog/seo-for-new-bloggers-2026)").
- Avoid generic anchor text like "click here" or "read more".
- Do not over-optimize. Vary anchor text to appear natural.

## Validation Workflow
- Never invent URLs. 
- Always cross-reference the `data/blog/` directory to ensure the slug is correct.
- Generate an Internal Link Validation Report during the QA phase.

## Related Documents
- See [QUALITY_ASSURANCE.md](./QUALITY_ASSURANCE.md) for link checking requirements.
"""

files["SEO_CHECKLIST.md"] = """# SEO Checklist

## Purpose
Standardizes on-page SEO best practices to ensure maximum visibility in search engines, AI Overviews, and Featured Snippets.

## Core SEO Elements
- **Title Tag**: Must contain the primary keyword. Keep under 60 characters.
- **Meta Description**: Must be compelling and summarize the value proposition. Keep under 155 characters.
- **URLs (Slugs)**: Short, descriptive, and keyword-rich (e.g., `how-to-start-a-blog`). Avoid stop words and dates unless necessary.

## Featured Snippet & AI Overview Optimization
- Use clear, concise definitions directly under H2 headers.
- Use numbered lists for step-by-step processes.
- Use markdown tables for data comparisons.

## Media Optimization
- All images must use descriptive, keyword-optimized `alt` text.
- File names must use hyphens (e.g., `best-ai-tools-dashboard.webp`).
- See [IMAGE_STANDARD.md](./IMAGE_STANDARD.md) for formats.

## Evergreen Updates
- Avoid time-sensitive language like "last month" or "recently".
- Use specific years (e.g., "In 2026") only when historically relevant or necessary for the keyword.

## Related Documents
- See [SCHEMA_GUIDE.md](./SCHEMA_GUIDE.md) for technical SEO requirements.
"""

files["EEAT_GUIDE.md"] = """# EEAT Guide (Experience, Expertise, Authoritativeness, Trustworthiness)

## Purpose
Outlines how Locitra content proves its quality and trustworthiness to both users and search engines.

## 1. Experience
- Demonstrate first-hand experience with the topic.
- Use real screenshots in software reviews.
- Share personal anecdotes or specific case studies (e.g., "When we tested this tool...").

## 2. Expertise
- Content must be written or reviewed by subject matter experts.
- Use professional terminology correctly.
- Provide deep, nuanced analysis, not just surface-level summaries.

## 3. Authoritativeness
- Build a strong author bio.
- Consistently publish high-quality content within specific clusters (see [CONTENT_CLUSTER_BLUEPRINT.md](./CONTENT_CLUSTER_BLUEPRINT.md)).
- Earn backlinks from reputable industry sources.

## 4. Trustworthiness
- Never invent statistics. Always cite reputable sources.
- Clearly disclose affiliate relationships per [MONETIZATION_GUIDE.md](./MONETIZATION_GUIDE.md).
- Ensure secure (HTTPS) browsing and clear privacy policies.

## Related Documents
- See [CONTRIBUTOR_GUIDE.md](./CONTRIBUTOR_GUIDE.md) for how guest authors must demonstrate EEAT.
"""

files["SCHEMA_GUIDE.md"] = """# Schema & Structured Data Guide

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
"""

files["REVIEW_STANDARD.md"] = """# Software Review Standard

## Purpose
Defines the methodology for writing unbiased, high-value software and product reviews.

## Review Philosophy
Reviews must be born from actual usage, not regurgitated marketing copy. Readers must trust our recommendations completely.

## The Testing Process
- Spend a minimum of 4 hours testing the software.
- Test primary use cases, edge cases, and customer support responsiveness.
- Document bugs and UX friction points.

## Article Structure Requirements
- **Bottom Line Summary**: TL;DR at the very beginning.
- **Pros & Cons Box**: Clear, bulleted list.
- **Pricing Documentation**: Transparent breakdown of tiers and hidden fees.
- **Alternatives**: Always suggest 2-3 viable alternatives.

## Affiliate Disclosure
- Clearly state if the review contains affiliate links in the introduction. See [MONETIZATION_GUIDE.md](./MONETIZATION_GUIDE.md).

## Schema Requirements
- Review metadata must be included in the MDX frontmatter to trigger the Review schema. See [SCHEMA_GUIDE.md](./SCHEMA_GUIDE.md).

## Related Documents
- See [ARTICLE_TEMPLATE.md](./ARTICLE_TEMPLATE.md) for standard article workflows.
"""

files["IMAGE_STANDARD.md"] = """# Image & Media Standard

## Purpose
Ensures all visual assets on Locitra are high-quality, optimized for speed, and visually consistent.

## General Specifications
- **Format**: All images must be `WebP`.
- **Naming**: `lowercase-with-hyphens.webp`.
- **Dimensions**:
  - Featured Images: 1200x630 (Optimized for Open Graph / Social Sharing)
  - In-content images: Max width 800px.

## AI Image Prompting Standards (Gemini/Midjourney)
- Use cinematic, high-quality, ultra-realistic editorial styles.
- Specify: "No text, no logos, no watermarks."
- Maintain a premium corporate/technology aesthetic.
- See [LOCITRA_GOLD_STANDARD_v3.md](./LOCITRA_GOLD_STANDARD_v3.md) for visual opportunity guidelines.

## Social Media Image Rules
- **Pinterest**: Vertical pins (1000x1500px).
- **YouTube Thumbnails**: 1280x720px, high contrast, readable text.

## Related Documents
- See [SOCIAL_MEDIA_STANDARD.md](./SOCIAL_MEDIA_STANDARD.md) for platform distribution rules.
- See [SEO_CHECKLIST.md](./SEO_CHECKLIST.md) for `alt` text requirements.
"""

files["YOUTUBE_CONTENT_STANDARD.md"] = """# YouTube Content Standard

## Purpose
Guides the creation of video content that aligns with Locitra's editorial written content.

## Video Types
- **Long-Form (8-15 mins)**: Deep dives, tutorials, and comprehensive software reviews.
- **Shorts (<60s)**: Quick tips, statistics, and high-engagement hooks.

## Scripting Guidelines
- Hook the viewer in the first 5 seconds.
- Use the same [STYLE_GUIDE.md](./STYLE_GUIDE.md) tone as written articles.
- Include clear CTAs (Call to Action) to visit Locitra or subscribe to the newsletter.

## Production Workflow
- **Narration**: Use ElevenLabs for consistent AI voiceovers if a human presenter is unavailable.
- **B-Roll**: Plan specific visual assets to match script points. Keep visuals moving every 3-5 seconds.

## Related Documents
- See [IMAGE_STANDARD.md](./IMAGE_STANDARD.md) for thumbnail specifications.
"""

files["SOCIAL_MEDIA_STANDARD.md"] = """# Social Media Standard

## Purpose
Defines how Locitra distributes content across social platforms to drive traffic and build community.

## Platform Guidelines

### X (Twitter) & LinkedIn
- Focus on thought leadership and "threads" summarizing [LOCITRA_GOLD_STANDARD_v3.md](./LOCITRA_GOLD_STANDARD_v3.md) pillars.
- Professional, authoritative tone.

### Pinterest
- Highly visual. Create multiple vertical pins for every pillar article.
- Focus on inspiration and actionable lists.

### Instagram/Facebook
- Share visually engaging infographics and quote cards from Expert Insights.

## Branding
- Use consistent color palettes and typography.
- Never use clickbait. Deliver value in the post itself, then ask for the click.

## Related Documents
- See [IMAGE_STANDARD.md](./IMAGE_STANDARD.md) for specific image sizing per platform.
- See [CONTENT_LIFECYCLE.md](./CONTENT_LIFECYCLE.md) for when social promotion occurs.
"""

files["NEWSLETTER_STANDARD.md"] = """# Newsletter Standard

## Purpose
Defines the strategy for the Locitra email newsletter to build direct audience relationships.

## Writing Style
- Highly personal, written from a first-person perspective.
- Shorter paragraphs, highly scannable.
- Provide exclusive value not found on the blog.

## Workflow (Brevo)
- Send frequency: Weekly or Bi-weekly.
- Segmentation: Segment users based on interests (e.g., AI vs. Online Income).

## CTA Placement
- Limit to one primary CTA per email (e.g., "Read the full guide here").
- Use secondary, subtle text links for affiliate offers per the [MONETIZATION_GUIDE.md](./MONETIZATION_GUIDE.md).

## Related Documents
- See [STYLE_GUIDE.md](./STYLE_GUIDE.md) for voice and tone rules.
"""

files["CONTRIBUTOR_GUIDE.md"] = """# Contributor Guide

## Purpose
Provides instructions for guest authors and freelance writers submitting content to Locitra.

## Submission Standards
- All content must adhere strictly to the [LOCITRA_GOLD_STANDARD_v3.md](./LOCITRA_GOLD_STANDARD_v3.md).
- Submissions must be entirely original and pass AI/plagiarism checks.
- Format all submissions in Markdown.

## EEAT Requirements
- Contributors must provide a comprehensive author bio detailing their real-world experience.
- LinkedIn profiles must be linked to establish verifiable authority. See [EEAT_GUIDE.md](./EEAT_GUIDE.md).

## Review Workflow
1. Pitch submission and approval.
2. Draft submission via Markdown.
3. Editorial review by Locitra staff.
4. Revisions based on [QUALITY_ASSURANCE.md](./QUALITY_ASSURANCE.md).
5. Publication.

## Related Documents
- See [STYLE_GUIDE.md](./STYLE_GUIDE.md) for tone expectations.
- See [ARTICLE_TEMPLATE.md](./ARTICLE_TEMPLATE.md) for structural requirements.
"""

for filename, content in files.items():
    path = os.path.join(docs_dir, filename)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Successfully generated {len(files)} documentation files in {docs_dir}.")
