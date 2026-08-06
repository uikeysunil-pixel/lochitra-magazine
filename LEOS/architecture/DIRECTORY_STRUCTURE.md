# LEOS Directory Structure

## `.agents/`

The core logic center of LEOS.

- `AGENTS.md`: The supreme governance file establishing permissions, boundaries, and frozen policies.
- `skills/`: The directories containing the individual `SKILL.md` instruction files that dictate agent personas and behaviors.

## `knowledge/`

The stateless memory bank of LEOS. Organized strictly by `phase/cluster/slug`.

- `research/`: Houses `RESEARCH_REPORT.md` artifacts.
- `seo/`: Houses SEO reports and patches.
- `editorial/`: Houses Platinum Editor reports and patches.
- `publishing/`: Houses the final release checklists and deployment notes.

## `data/blog/`

The production content directory. All generated `.mdx` files are saved here for Contentlayer ingestion and Next.js rendering.

## `LEOS/`

This directory. Contains the official operating manual, architecture specifications, configuration, governance, operations, management, and contributor guides.

- Deferred files at root: `REFERENCE_IMPLEMENTATIONS.md`, `ARTIFACTS.md`, `LEOS_DOCUMENTATION_REPORT.md`.
- `core/`: Contains `LEOS.md` (Operating Manual), `MASTER_PROMPT.md` (Constitutional Execution Core), and `CONFIG.md` (Global Configuration).
- `governance/`: Contains `CONTRIBUTING.md`.
- `architecture/`: Contains `ARCHITECTURE.md` and `DIRECTORY_STRUCTURE.md`.
- `operations/`: Contains `PIPELINE.md`, `WORKFLOWS.md`, `QUICK_START.md`, and `AGENT_INDEX.md`.

- `management/`: Contains `ROADMAP.md`, `VERSION_HISTORY.md`, and `CHANGELOG.md`.

## `public/static/images/blog/`

The required location for all 1200x630 `.webp` featured images referenced in the MDX frontmatter.
