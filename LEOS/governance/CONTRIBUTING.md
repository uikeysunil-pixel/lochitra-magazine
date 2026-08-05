# LEOS Governance & Contribution Specification

## Purpose

The Locitra Editorial Operating System (LEOS) Governance & Contribution Specification defines the authoritative policies, change management lifecycle, repository protection rules, documentation standards, and freeze protocols governing LEOS.

This document serves as the authoritative governance specification for LEOS. It defines **how** LEOS is governed, modified, and maintained, establishing strict change controls to preserve single-responsibility boundaries, maintain system integrity, and guarantee controlled, high-integrity evolution across all repository components.

## Governance Scope

This specification applies exclusively to governance policies, change management procedures, contribution workflows, repository protection rules, documentation standards, and document lifecycle freeze policies within LEOS.

- **In Scope:**
  - Foundational governance principles and decision-making authority.
  - Governance domain ownership definitions and decision hierarchy.
  - 7-Phase Change Management Lifecycle (Proposal to Freeze).
  - Repository protection rules and anti-duplication constraints.
  - Technical documentation formatting, markdown quality, and versioning standards.
  - Multi-tier review, approval, freeze, and unfreeze policies.

- **Out of Scope:**
  - System architecture, layer topology, and dependency rules (governed by [architecture/ARCHITECTURE.md](../architecture/ARCHITECTURE.md)).
  - Foundational philosophy and constitutional mandates (governed by [core/LEOS.md](../core/LEOS.md)).
  - Operational step-by-step pipeline execution and release gate procedures (governed by [operations/PIPELINE.md](../operations/PIPELINE.md)).
  - Repository navigation and directory index guides (governed by [README.md](../README.md)).

## Governance Principles

Governance within LEOS is anchored upon seven core principles:

- **Single Source of Truth:** Every governance rule, operational specification, and architectural standard must exist in exactly one authoritative document to prevent documentation drift and ambiguity.
- **Human Authority:** Human editorial judgment holds supreme authority over repository changes, architectural updates, patch applications, and document freeze decisions.
- **Controlled Evolution:** System modifications must be deliberate, documented, reviewed, and validated prior to integration; ad hoc modifications are strictly prohibited.
- **Preserve Git History:** Repository reorganization, file moves, and document restructuring must preserve commit history and file tracking using standard version control practices.
- **Refactor Before Create:** Existing documentation and structural assets must be audited and refactored before creating new files or introducing additional subsystems.
- **Validate Before Commit:** Modifications must pass full multi-pass technical, structural, and editorial validation prior to committing to the authoritative branch.
- **Freeze Before Expansion:** Baseline specifications and documentation packages must achieve formal freeze status before subsequent subsystem expansion packages are initiated.

## Governance Decision Model

LEOS governance decisions strictly adhere to a six-tier authority hierarchy:

```
Human Editorial Authority
           │
           ▼
   LEOS Constitution
           │
           ▼
Governance Specification
           │
           ▼
Architecture Specification
           │
           ▼
   Execution Pipeline
           │
           ▼
Supporting Documentation
```

Governance defines operational policies, change controls, and repository protection rules, but it derives supreme authority from the LEOS Constitution. Governance policies cannot override, contradict, or relax constitutional principles or human authority.

## Governance Ownership Model

LEOS establishes clear domain ownership mapping each architectural layer to authoritative documentation files:

| Layer Domain           | Primary Location               | Owned Core Specifications                                                  |
| :--------------------- | :----------------------------- | :------------------------------------------------------------------------- |
| **Governance Layer**   | `LEOS/governance/`, `.agents/` | `CONTRIBUTING.md`, `AGENTS.md`                                             |
| **Core Layer**         | `LEOS/core/`                   | `LEOS.md`, `CONFIG.md`, `MASTER_PROMPT.md`                                 |
| **Architecture Layer** | `LEOS/architecture/`           | `ARCHITECTURE.md`, `DIRECTORY_STRUCTURE.md`                                |
| **Operations Layer**   | `LEOS/operations/`             | `PIPELINE.md`, `WORKFLOWS.md`, `QUICK_START.md`                            |
| **Management Layer**   | `LEOS/management/`             | `ROADMAP.md`, `CHANGELOG.md`, `VERSION_HISTORY.md`, `DEFERRED_REGISTER.md` |

## Change Management

All modifications to LEOS specifications, documentation, and agent prompts must progress sequentially through a 7-phase change management lifecycle:

```
[Proposal] ──► [Review] ──► [Approval] ──► [Implementation] ──► [Validation] ──► [Commit] ──► [Freeze]
```

### 1. Proposal Phase

The contributor articulates a clear modification scope, detailing the target document, objective, rationale, and specific section changes.

### 2. Review Phase

Architectural and governance review evaluates the proposal against system boundaries, single-responsibility rules, and constitutional constraints.

### 3. Approval Phase

Explicit authorization is granted by human editorial authority prior to executing edits.

### 4. Implementation Phase

Modifications are applied strictly within the approved document scope, adhering to documentation standards.

### 5. Validation Phase

Automated and manual verification validates link integrity, schema compliance, markdown formatting, and repository constraints.

### 6. Commit Phase

Changes are committed using conventional commit standards (e.g., `docs(leos): update CONTRIBUTING.md`).

### 7. Freeze Phase

Completed, validated documentation packages are formally frozen, establishing a stable authoritative baseline.

## Repository Protection Rules

To protect repository structural integrity and maintain documentation hygiene, contributors must adhere to five mandatory rules:

- **No Duplicate Documentation:** Operational rules and technical definitions must exist in a single location. Duplicating content across multiple files is prohibited; use relative links to reference authoritative sources.
- **No Uncontrolled Restructuring:** Creating new folders, adding top-level root documents, or restructuring existing directory trees requires prior architectural review.
- **Preserve History with `git mv`:** File relocations and file renames must be executed using `git mv` to preserve git blame history and line tracking.
- **No Direct Edits to Frozen Documents:** Documents marked as `FROZEN` or `Authoritative` under a finalized package must not be modified without formal unfreeze approval.
- **Strict Scope Scoping:** Every pull request or commit must modify ONLY the specific file authorized by the change proposal. Modifying unrelated files is prohibited.

## Documentation Standards

All LEOS documentation must strictly adhere to the following technical standards:

- **Markdown Quality:** Standard GitHub Flavored Markdown (GFM), structured heading hierarchy (`# H1` title only, `## H2` sections, `### H3` sub-sections), clean tables, and zero HTML (`<!-- -->`) or JSX (`{/* */}`) comments.
- **Unix LF Line Endings:** Text files must strictly use Unix LF (`\n`) line endings. Windows CRLF line endings are prohibited as they break Contentlayer YAML parsing.
- **Internal Linking Format:** Relative Markdown links pointing strictly to authoritative target paths (e.g., `[LEOS Constitution](../core/LEOS.md)`). Full absolute URLs for internal links are prohibited.
- **Standardized Metadata Table:** Every specification must conclude with a Version Information metadata table containing Title, Path, Version, Last Updated, Package, and Status.
- **Consistent Terminology:** Terminology across all files must align with authoritative specifications (e.g., _Execution Layer_, _Human Control Gates_, _Three-Pass Release System_).
- **Single-Purpose Documents:** Each document must own a single, well-defined domain responsibility.
- **Frozen Document Integrity:** Frozen authoritative documents must retain stable section structure and documented responsibilities unless formally unfreezed through the approved governance process.

## Review & Approval Process

Modifications to LEOS undergo multi-tier review prior to integration:

- **Architectural Review:** Ensures changes comply with subsystem boundaries, layer definitions, and dependency rules defined in [ARCHITECTURE.md](../architecture/ARCHITECTURE.md).
- **Editorial Review:** Ensures language is clear, authoritative, professional, commercially neutral, and compliant with E-E-A-T standards defined in [LEOS.md](../core/LEOS.md).
- **Technical Validation:** Verifies line endings, internal link validity, syntax clean builds (`npm run build`), and frontmatter schema compliance.
- **Human Approval:** Final decision-making authority over all repository commits and documentation freezes. Governance approval unconditionally precedes document freezing.

## Freeze & Unfreeze Policy

LEOS enforces a rigorous document lifecycle freeze policy to ensure baseline stability:

### Freeze Criteria

A document or package is ready to be frozen when:

- It is 100% feature complete and complies fully with approved structure requirements.
- It passes all technical, architectural, and editorial validation checks.
- It has received explicit human approval for freeze.

### Unfreeze Conditions

Frozen documents enter a read-only state. Unfreezing a frozen document is permitted ONLY under three conditions:

1. **Critical Production Fix:** Repairing a verified build-breaking defect or technical incompatibility.
2. **Constitutional Evolution:** Adapting to an approved, human-authorized amendment to the LEOS Constitution.
3. **Planned Package Progression:** Executing a scheduled, human-approved multi-package evolution (e.g., progressing from Package 1 to Package 2).

### Version Increment Standard

Document versioning follows semantic rules:

- **Major (`X.0.0`):** Major structural overhauls or new package releases.
- **Minor (`1.X.0`):** New functional section additions or approved feature expansions.
- **Patch (`1.0.X`):** Technical refinements, typo corrections, link fixes, or metadata updates.

## Relationship to Other Documents

The LEOS governance specification interacts with other core specifications as follows:

- **[README.md](../README.md):** Central navigation gateway and subsystem homepage.
- **[LEOS Constitution (core/LEOS.md)](../core/LEOS.md):** Supreme constitutional authority defining operating philosophy and oversight rules.
- **[Architecture Specification (architecture/ARCHITECTURE.md)](../architecture/ARCHITECTURE.md):** Authoritative structural guide defining layer topology, subsystem boundaries, and dependency rules.
- **[Execution Pipeline (operations/PIPELINE.md)](../operations/PIPELINE.md):** Authoritative operational guide defining execution flow, stage contracts, and release gates.
- **[Strategic Roadmap (management/ROADMAP.md)](../management/ROADMAP.md):** Strategic evolution plan tracking long-term subsystem features.
- **[Quick Start Guide (operations/QUICK_START.md)](../operations/QUICK_START.md):** Practical onboarding guide for editors and developers.

This document is the authoritative governance specification for LEOS.

## Version Information

| Metadata Field      | Value                             |
| :------------------ | :-------------------------------- |
| **Document Title**  | LEOS Governance Specification     |
| **Document Path**   | `LEOS/governance/CONTRIBUTING.md` |
| **Version**         | 1.0.1                             |
| **Last Updated**    | 2026-08-05                        |
| **Current Package** | Package 1                         |
| **Document Status** | Authoritative                     |

---

**LEOS Governance Specification**  
**Document:** CONTRIBUTING.md | **Version:** 1.0.1 | **Status:** Authoritative  
_Maintained under the LEOS Governance Foundation._
