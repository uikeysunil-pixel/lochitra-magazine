# LEOS Agent Index

This document catalogs every component currently implemented in LEOS v1.0. All properties are verified against the physical `.agents/skills/` repository.

## 1. Global Governance & Configuration

- **Governance:** `.agents/AGENTS.md` (Permissions, boundaries, frozen policies)
- **Execution:** `LEOS/core/MASTER_PROMPT.md` (Workflow orchestration, automation rules)
- **Configuration:** `LEOS/core/CONFIG.md` (Global settings)
- **Benchmarks:** `LEOS/REFERENCE_IMPLEMENTATIONS.md` (Certified archetypes)

## 2. Workflow Orchestrator

- **Version:** 1.0
- **Status:** Permanent Architectural Rule
- **Purpose:** Stateless workflow controller that infers required pipelines and executes specialist agents in sequence.
- **Inputs:** User Prompt.
- **Outputs:** Coordinated agent execution.

## 3. Research Validation Agent

- **Version:** 1.2
- **Status:** FROZEN
- **Purpose:** Factual research and validation.
- **Inputs:** Topic and target keyword.
- **Outputs:** `RESEARCH_REPORT.md`

## 4. Writing Agent

- **Version:** 1.1
- **Status:** FROZEN
- **Purpose:** Transforming verified research into Platinum MDX articles.
- **Inputs:** `RESEARCH_REPORT.md`
- **Outputs:** `[slug].mdx`

## 5. SEO Optimization Agent

- **Version:** 1.0
- **Status:** ACTIVE
- **Purpose:** Read-only audit for search visibility, schema injection, and internal linking.
- **Inputs:** `[slug].mdx`, `RESEARCH_REPORT.md`
- **Outputs:** `SEO_REPORT.md`, `SEO_PATCH.md`

## 6. Platinum Editor Agent

- **Version:** 1.0
- **Status:** ACTIVE
- **Purpose:** Read-only audit enforcing Locitra commercial neutrality, E-E-A-T, and reader experience.
- **Inputs:** `[slug].mdx`, `RESEARCH_REPORT.md`, `SEO_REPORT.md`, `SEO_PATCH.md`
- **Outputs:** `EDITORIAL_REPORT.md`, `EDITORIAL_PATCH.md`

## 7. Publishing Agent

- **Version:** 1.0
- **Status:** ACTIVE
- **Purpose:** Operational orchestrator and release manager ensuring build readiness.
- **Inputs:** All generated MDX and upstream reports/patches.
- **Outputs:** `PUBLISHING_REPORT.md`, `RELEASE_NOTES.md`, `GIT_RELEASE_CHECKLIST.md`, `DEPLOYMENT_CHECKLIST.md`
