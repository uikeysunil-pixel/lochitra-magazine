# LEOS Quick Start Guide

## Purpose

The Locitra Editorial Operating System (LEOS) Quick Start Guide provides a practical, 15-minute onboarding framework for human editors, AI agents, and software maintainers beginning work with LEOS.

This document explains **how** to quickly orient yourself within the repository, follow the required reading sequence, navigate directory boundaries, and execute your first workflow cleanly, without redefining or duplicating any core LEOS specifications.

## Quick Start Philosophy

The LEOS Quick Start Guide serves as a practical onboarding companion rather than a technical or operational specification. Its purpose is to accelerate contributor productivity by orienting readers, establishing clear reading pathways, and directing contributors to authoritative core documents without duplicating constitutional principles, system architecture, pipeline execution stages, or governance policies.

## Who Should Read This Guide

This guide is designed for three contributor roles:

- **Human Editors & Authors:** Learn how to initiate editorial workflows, review diagnostic audit patches, and authorize article publication.
- **AI Assistant Agents:** Understand system boundaries, document reading order, and stateless interaction contracts.
- **Software Maintainers & Engineers:** Understand repository layout, governance rules, and documentation standards.

## Estimated Onboarding Time

Most human editors, AI assistant agents, and maintainers can complete the recommended reading sequence, orient themselves within the repository structure, and begin executing their first LEOS workflow within approximately 15–20 minutes.

## Before You Begin

Before contributing to LEOS, ensure you satisfy the following prerequisites:

- Basic familiarity with Markdown syntax and GitHub Flavored Markdown (GFM).
- Understanding of Locitra's single-quoted YAML frontmatter schema.
- Familiarity with Git version control fundamentals.
- Environment configured to enforce Unix LF (`\n`) line endings on all text files to prevent build parser crashes.

## Recommended Reading Order

New contributors must review LEOS documentation in the following sequence to build a progressive understanding of the system:

1. **[README.md](../README.md):** Provides the overall subsystem homepage, core mission, and central navigation gateway.
2. **[LEOS Constitution (core/LEOS.md)](../core/LEOS.md):** Defines foundational operating philosophy, E-E-A-T standards, and supreme human authority principles.
3. **[Architecture Specification (architecture/ARCHITECTURE.md)](../architecture/ARCHITECTURE.md):** Establishes the structural 6-layer hierarchy, subsystem boundaries, and dependency rules.
4. **[Execution Pipeline (PIPELINE.md)](PIPELINE.md):** Details the 6-stage linear execution workflow, stage contracts, and fail-safe release gates.
5. **[Governance Guide (governance/CONTRIBUTING.md)](../governance/CONTRIBUTING.md):** Outlines change management policies, repository protection rules, and document freeze standards.
6. **[Workflow Catalog (WORKFLOWS.md)](WORKFLOWS.md):** Catalogues supported workflow patterns, selection decision matrices, and input/output contracts.
7. **[Quick Start Guide (QUICK_START.md)](QUICK_START.md):** Onboards contributors with a practical, step-by-step guide to executing their first workflow.

## Repository Orientation

The `LEOS/` directory is partitioned into six functional subdirectories:

- **`LEOS/` (Root):** Central entry point containing gateway landing pages, agent index, and core artifact manifests.
- **`core/`:** Houses the constitutional manual, master execution prompts, global settings, and benchmark configurations.
- **`architecture/`:** Houses structural specifications, component topology, and directory layout standards.
- **`operations/`:** Houses execution pipeline specifications, workflow catalogs, operational recipes, and quick start guides.
- **`governance/`:** Houses operational policies, contribution guidelines, and development standards.
- **`management/`:** Houses version history, modification changelogs, strategic roadmaps, and deferred document registries.

## Your First LEOS Workflow

Executing your first content task within LEOS follows a six-step onboarding process:

1. **Identify Objective:** Determine the target topic, publication category, primary keyword, and editorial goal.
2. **Select Workflow:** Consult the decision matrix in [WORKFLOWS.md](WORKFLOWS.md) to choose the appropriate workflow pattern (e.g., Software Review, Comparison, Tutorial).
3. **Gather Inputs:** Collect necessary product facts, benchmark research data, and slug parameters.
4. **Execute Through Pipeline:** Initiate execution through the 6-stage linear pipeline specified in [PIPELINE.md](PIPELINE.md).
5. **Review Outputs:** Inspect generated draft MDX files (`data/blog/<slug>.mdx`) and diagnostic audit reports (`SEO_PATCH.md`, `EDITORIAL_PATCH.md`) in read-only mode.
6. **Human Approval:** Grant explicit human authorization to apply safe patches, verify build integrity, and approve final deployment.

## Common Mistakes to Avoid

To maintain repository hygiene and publication safety, avoid these common pitfalls:

- **Reading Documents Out of Order:** Attempting operational execution before understanding constitutional principles or architectural layer rules.
- **Mixing Workflow Responsibilities:** Combining non-overlapping workflow goals into a single task (e.g. running a review workflow for a multi-product roundup).
- **Editing Frozen Specifications:** Modifying authoritative documents marked as frozen without formal unfreeze approval.
- **Creating Duplicate Documentation:** Duplicating rules or definitions across multiple files instead of linking to authoritative specifications.
- **Skipping Validation:** Committing changes without verifying frontmatter formatting, line endings, and clean build completion.

## Where to Go Next

Once you have completed this guide, proceed to the following resources:

- Explore supported workflow contracts and decision tables in [WORKFLOWS.md](WORKFLOWS.md).
- Review contribution guidelines and pull request standards in [CONTRIBUTING.md](../governance/CONTRIBUTING.md).
- Check strategic feature milestones in [ROADMAP.md](../management/ROADMAP.md).
- Review deferred document classifications in [DEFERRED_DOCUMENT_REGISTER.md](../management/DEFERRED_DOCUMENT_REGISTER.md).

## Relationship to Other Documents

The LEOS onboarding guide connects to the core documentation suite as follows:

- **[README.md](../README.md):** Central navigation gateway and subsystem overview.
- **[LEOS Constitution (core/LEOS.md)](../core/LEOS.md):** Supreme constitutional authority defining operating philosophy and oversight rules.
- **[Architecture Specification (architecture/ARCHITECTURE.md)](../architecture/ARCHITECTURE.md):** Authoritative structural guide defining layer topology, subsystem boundaries, and dependency rules.
- **[Execution Pipeline (PIPELINE.md)](PIPELINE.md):** Authoritative operational guide defining execution flow, stage contracts, and release gates.
- **[Governance Guide (governance/CONTRIBUTING.md)](../governance/CONTRIBUTING.md):** Authoritative governance specification defining modification policies and standards.
- **[Workflow Catalog (WORKFLOWS.md)](WORKFLOWS.md):** Authoritative workflow catalog defining selection matrices and contracts.

This document is the official onboarding guide for LEOS contributors.

## Version Information

| Metadata Field      | Value                            |
| :------------------ | :------------------------------- |
| **Document Title**  | LEOS Quick Start Guide           |
| **Document Path**   | `LEOS/operations/QUICK_START.md` |
| **Version**         | 1.0.1                            |
| **Last Updated**    | 2026-08-05                       |
| **Current Package** | Package 1                        |
| **Document Status** | Authoritative                    |

---

**LEOS Quick Start Guide**  
**Document:** QUICK*START.md | **Version:** 1.0.1 | **Status:** Authoritative  
\_Maintained under the LEOS Governance Foundation.*
