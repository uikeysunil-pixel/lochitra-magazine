# LEOS Execution Pipeline

The standard LEOS execution pipeline ensures articles are researched, written, vetted, and deployed in a fail-safe, predictable manner. The automated execution logic is centrally defined in `LEOS/MASTER_PROMPT.md`.

## Phase 1: Research

**Actor:** Research Validation Agent
**Execution:** Identifies official sources and compiles a strict separation of verified/unverified facts.
**Knowledge Flow:** Stored in `knowledge/research/<cluster>/<slug>/`.

## Phase 2: Writing

**Actor:** Writing Agent
**Execution:** Ingests the Research Report and generates the `.mdx` article, applying Locitra's editorial style and strict YAML frontmatter.
**Knowledge Flow:** Written to `data/blog/<slug>.mdx`.

## Phase 3: SEO Audit (Read-Only)

**Actor:** SEO Optimization Agent
**Execution:** Analyzes the MDX against search intent, semantic coverage, and schema markup.
**Artifact Flow:** Generates `SEO_PATCH.md` containing SAFE or MANUAL REVIEW suggestions.

## Phase 4: Editorial Audit (Read-Only)

**Actor:** Platinum Editor Agent
**Execution:** Analyzes the MDX for tone, E-E-A-T, commercial neutrality, and reader value.
**Artifact Flow:** Generates `EDITORIAL_PATCH.md`.

## Phase 5: Publishing & Release Gate

**Actor:** Publishing Agent
**Execution:** Validates that all upstream reports exist, the MDX parses correctly, and frontmatter is complete.
**Failure Handling:** If patches are unresolved, the agent issues a `BLOCKED` or `READY AFTER SAFE PATCHES` status.
**Resume Logic:** Upon human or Master Architect intervention to apply patches, the pipeline resumes at the Git Release step.
