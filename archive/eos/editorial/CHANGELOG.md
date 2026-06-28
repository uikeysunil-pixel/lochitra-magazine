# EOS Changelog

All notable changes to the Locitra Editorial Operating System (EOS) will be documented in this file.

## [v3.2.0] - 2026-06-28
### Added
- **Structured Data Quality Assurance (Schema QA)** section to `QUALITY_ASSURANCE.md` (9-point mandatory schema validation gate).
- Global, Article, Software Review, and Author Structured Data verification checklists.
- JSON-LD, Entity Relationship, Rich Results, Deployment, and Build Validation checklists.
- Integrated Schema QA as a mandatory gate before publication or deployment.

## [v3.1.0] - 2026-06-28
### Added
- **Article Technical Quality Assurance** section to `QUALITY_ASSURANCE.md` (11-point mandatory technical gate).
- Author Validation checklist with explicit warning against using `authors: ['default']`.
- HTML and Script Validation checklist (grounded in the Next.js 15 App Router `<script>` regression).
- Frontmatter, Featured Image, MDX Syntax, Schema, SEO, Build, and Browser Verification checklists.
- Publication Approval Gate formalizing the non-negotiable requirement for all items to pass.

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
