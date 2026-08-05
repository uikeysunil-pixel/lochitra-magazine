# LEOS: Locitra Editorial Operating System

## Overview

The Locitra Editorial Operating System (LEOS) is an enterprise-grade, highly structured AI editorial subsystem engineered for the Locitra publication. It enforces rigorous boundaries across specialized, single-responsibility AI agents to ensure every published article adheres strictly to E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) standards. LEOS transforms article production into a deterministic, high-integrity pipeline that prioritizes deep factual research, commercial neutrality, and technical excellence over raw word volume.

## Mission

LEOS enables Locitra to publish Platinum-quality, high-value editorial content consistently across hundreds of articles and commercial clusters through stateless AI orchestration, immutable research dependencies, and fail-safe release gates.

## Repository Context

LEOS serves as the Editorial Operating System of the Locitra repository, implemented as a first-class repository subsystem. It governs all editorial operations, publication standards, automated workflows, AI agent prompts, and supporting architectural documentation. LEOS remains logically and structurally independent from application source code and generated editorial reports, serving as the central operating framework for high-integrity content publication across the organization.

## Subsystem Overview

LEOS coordinates the end-to-end editorial publishing process across six core functional areas:

- **Governance:** Enforces operational standards, human-in-the-loop oversight, and strict boundary controls.
- **Editorial Intelligence:** Evaluates article quality, tone, and compliance against Locitra's Platinum standard.
- **SEO Intelligence:** Audits keyword integration, semantic structure, readability, and metadata formatting.
- **Publishing:** Manages deployment validation, release gate verification, and patch application.
- **Automation:** Coordinates pipeline execution, artifact tracking, and multi-stage workflow verification.
- **AI Assistance:** Powers specialized agents executing dedicated, single-responsibility tasks.

## Current Status

| Component                   | Status      |
| :-------------------------- | :---------- |
| Phase 0                     | ✅ Complete |
| Package 1                   | 🚧 Active   |
| Foundation Structure        | 🔒 Frozen   |
| Documentation Modernization | 🚧 Active   |

## Directory Overview

- **`core/`**: Houses the core operating manual, master orchestrator prompts, and global system configuration.
- **`governance/`**: Contains contribution guidelines, operational policies, and governance specifications.
- **`architecture/`**: Defines subsystem boundaries, system architecture, and directory structure standards.
- **`operations/`**: Provides execution pipelines, supported workflows, and quick-start guides.
- **`management/`**: Tracks version history, changelogs, strategic roadmaps, and the deferred document register.

## Quick Navigation

| Document              | Target Location                                                                      | Description                                              |
| :-------------------- | :----------------------------------------------------------------------------------- | :------------------------------------------------------- |
| **README**            | `README.md`                                                                          | Subsystem homepage and central navigation gateway.       |
| **LEOS Manual**       | [core/LEOS.md](core/LEOS.md)                                                         | Official operating manual and framework specification.   |
| **Architecture**      | [architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md)                         | Subsystem boundaries and execution model.                |
| **Pipeline**          | [operations/PIPELINE.md](operations/PIPELINE.md)                                     | Linear execution pipeline and release gate standards.    |
| **Roadmap**           | [management/ROADMAP.md](management/ROADMAP.md)                                       | Strategic evolution plan and future subsystem features.  |
| **Contributing**      | [governance/CONTRIBUTING.md](governance/CONTRIBUTING.md)                             | Guidelines and rules for contributing to LEOS.           |
| **Quick Start**       | [operations/QUICK_START.md](operations/QUICK_START.md)                               | 15-minute onboarding guide for developers and editors.   |
| **Deferred Register** | [management/DEFERRED_DOCUMENT_REGISTER.md](management/DEFERRED_DOCUMENT_REGISTER.md) | Authoritative tracking of root-level deferred documents. |

## Getting Started

Follow the recommended reading sequence for new contributors and editors:

1. **[README.md](README.md)** – System overview and central navigation hub.
2. **[core/LEOS.md](core/LEOS.md)** – Core operational manual and framework design principles.
3. **[architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md)** – Subsystem boundaries and component interaction rules.
4. **[operations/QUICK_START.md](operations/QUICK_START.md)** – Practical 15-minute developer and editor onboarding guide.
5. **[governance/CONTRIBUTING.md](governance/CONTRIBUTING.md)** – Operational governance standards and contribution workflow.

## Deferred Documents

Certain documents intentionally remain at the `LEOS/` root directory pending future architectural classification and subsystem ownership decisions. To prevent duplication of document tracking metadata, refer directly to the [Deferred Document Register](management/DEFERRED_DOCUMENT_REGISTER.md).

## Governance Principles

- **Single Source of Truth:** Every operational rule and specification must exist in exactly one authoritative document.
- **Refactor Before Create:** Existing documentation structures must be reorganized before creating new files.
- **Preserve Git History:** Repository restructuring must maintain full file history and commit tracking.
- **Deferred Classification:** Unclassified documents must remain deferred in the root until architectural ownership is approved.
- **Analyze Before Modify:** Audit and evaluation tasks must operate in read-only mode prior to explicit changes.
- **Validate Before Freeze:** Components must pass multi-stage verification before freezing specifications.

## Implementation Workflow

```
Plan
 ↓
Architecture
 ↓
Specification
 ↓
Implementation
 ↓
Review
 ↓
Validation
 ↓
Commit
 ↓
Freeze
```

## Version Information

| Metadata Field      | Value                                          |
| :------------------ | :--------------------------------------------- |
| **Current Version** | 1.1.3                                          |
| **Last Updated**    | 2026-08-05                                     |
| **Current Package** | Package 1                                      |
| **Current Step**    | Step 2.1B – README Final Enterprise Refinement |

## Related Documents

- [architecture/DIRECTORY_STRUCTURE.md](architecture/DIRECTORY_STRUCTURE.md)
- [core/MASTER_PROMPT.md](core/MASTER_PROMPT.md)
- [core/CONFIG.md](core/CONFIG.md)
- [operations/WORKFLOWS.md](operations/WORKFLOWS.md)
- [management/CHANGELOG.md](management/CHANGELOG.md)
- [management/VERSION_HISTORY.md](management/VERSION_HISTORY.md)

---

> This document follows the LEOS documentation lifecycle.  
> Changes require implementation, validation, review, approval, and formal freeze before becoming authoritative.

---

**LEOS – Locitra Editorial Operating System**  
**Document:** README | **Version:** 1.1.3 | **Status:** Active  
_Maintained under the LEOS Governance Foundation._
