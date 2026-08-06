# LEOS Artifact Specification

This document serves as the authoritative, permanent specification governing all information artifacts within the Locitra Editorial Operating System (LEOS). It defines the runtime communication model, artifact categories, standard metadata properties, full artifact catalogue, lifecycle states, ownership boundaries, repository validation standards, dependency constraints, and future expansion rules for every artifact exchanged between runtime agents.

In compliance with **ADR-001 (Agent Architecture)**, this document belongs exclusively to the LEOS Operations Layer (`LEOS/operations/`). It defines human-readable architectural specifications and filesystem communication contracts, and explicitly excludes executable prompts, code implementations, runtime templates, or internal parsing rules.

---

## 1. Title

**LEOS Artifact Specification** (Package 2 – Operational Intelligence & Agent Framework)

---

## 2. Purpose

The purpose of this specification is to define artifacts as immutable filesystem contracts exchanged between runtime agents across LEOS pipelines. In a stateless multi-agent architecture, agents cannot communicate directly through shared memory, inter-process calls, or live execution contexts. Artifacts serve as the sole supported currency and communication channel across the entire system.

This document answers the core architectural question:

> **What information is exchanged between runtime agents, and what rules govern its structure, ownership, lifecycle, and persistence?**

---

## 3. Artifact Philosophy

Every artifact created, consumed, or maintained within LEOS is governed by six fundamental architectural principles:

1. **Stateless Execution**: Agents initialize statelessly, read required input artifacts from disk, perform their domain task, write output artifacts to disk, and terminate. No in-memory state persists across agent boundaries.
2. **Immutable Artifacts**: Once produced and validated, primary artifacts (such as research reports, audit evaluations, and release records) are immutable. Modifications occur only through explicit, approved patch artifacts or new versioned iterations.
3. **Human-Readable Markdown**: All artifacts are authored in clean GitHub Flavored Markdown (GFM) using UTF-8 encoding and Unix LF line endings. Artifacts serve human editors and automated agents with equal clarity.
4. **Filesystem Communication Bus**: The filesystem acts as the universal communication bus. Agents communicate asynchronously by writing and reading structured Markdown files at predefined repository locations.
5. **Explicit Ownership**: Every artifact has exactly one designated producing agent, defined consuming agents, and a clear human review authority. Ownership boundaries prevent ambiguous state responsibility.
6. **Single Source of Truth**: Artifact specifications are governed exclusively by this document. No runtime skill, prompt instruction, or workflow guide may define conflicting artifact contracts.

---

## 4. Runtime Communication Model

Runtime agents in LEOS operate in strict isolation. Communication occurs through asynchronous, file-mediated handoffs across designated filesystem directories.

```
┌───────────────────────────────────────────────────────────────────────────────────┐
## STATELESS FILESYSTEM BUS                                                          │
└───────────────────────────────────────────────────────────────────────────────────┘
     │ (writes research report)        │ (reads report, drafts MDX)      │ (audits MDX & report)
     ▼                                 ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────┐         ┌───────────────────────┐
│   Research Agent      │────────>│     Writing Agent     │────────>│ SEO & Editor Agents   │
│ (knowledge/research/) │         │     (data/blog/)      │         │(knowledge/seo|edit/)  │
└───────────────────────┘         └───────────────────────┘         └───────────────────────┘
                                                                                 │
                                                                                 │ (reads draft & audits)
                                                                                 ▼
                                                                    ┌───────────────────────┐
                                                                    │   Publishing Agent    │
                                                                    │(knowledge/publishing/)│
                                                                    └───────────────────────┘
```

### Communication Principles:

- **Asynchronous Decoupling**: Upstream agents produce artifacts without expecting synchronous responses from downstream agents.
- **Stage Boundary Isolation**: An agent begins execution only when all required input artifacts for its designated stage are present and validated on disk.
- **Audit Traceability**: Every intermediate decision, evaluation score, and proposed patch is recorded in a persistent artifact, creating an immutable audit trail for human editors.

---

## 5. Artifact Categories

LEOS categorizes all operational artifacts into seven functional domains:

1. **Research Artifacts**: Factual knowledge bases, specifications, market data, and benchmark indices compiled prior to drafting.
2. **Editorial Content Artifacts**: Production MDX articles, structured copy, and draft media assets.
3. **SEO Intelligence Artifacts**: Search visibility audits, keyword density analyses, schema validation reports, and safe metadata patches.
4. **Editorial Audit Artifacts**: E-E-A-T evaluations, tone of voice reviews, readability scoring, commercial neutrality audits, and safe editorial patches.
5. **Publication Artifacts**: Operational build readiness verdicts, release gates, and release candidate verifications.
6. **Release Artifacts**: Public-facing release summaries, deployment checklists, and Git release documentation.
7. **System Artifacts**: Repository content maps, global indices, and automated modification changelogs created during Apply Mode operations.

---

## 6. Standard Artifact Metadata Specification

Every artifact produced within LEOS must specify a standard set of conceptual metadata properties. This specification defines conceptual metadata properties only and explicitly avoids prescribing machine-readable serialization schemas (such as JSON or YAML frontmatter).

| Property            | Description                                                           | Conceptual Example                                |
| :------------------ | :-------------------------------------------------------------------- | :------------------------------------------------ |
| **Purpose**         | The operational objective and content definition of the artifact.     | Factual research compilation for software review. |
| **Producing Agent** | The single agent responsible for generating the artifact.             | Research Validation Agent                         |
| **Consuming Agent** | The agent(s) designated to read and ingest the artifact.              | Writing Agent, SEO Agent, Platinum Editor         |
| **Ownership**       | Architectural layer and filesystem owner of the artifact.             | Operations / Knowledge Repository                 |
| **Mutability**      | Defines whether the artifact is immutable, append-only, or patchable. | Immutable (Read-Only)                             |
| **Validation**      | Quality and structural rules required for stage handoff.              | UTF-8, GFM, verified source citations.            |
| **Human Review**    | Indicates whether explicit human approval is mandatory.               | Required before writing phase initialization.     |
| **Lifecycle State** | Current operational condition of the artifact.                        | Validated / Approved                              |

---

## 7. Complete Artifact Catalogue

> **Architectural Boundary Note:** The Artifact Catalogue defines the architectural purpose, ownership, lifecycle, communication role, and governance responsibilities of each artifact. It does **NOT** define internal markdown templates, runtime parsing rules, executable behavior, or implementation formatting. Those responsibilities belong exclusively to the runtime layer (`.agents/skills/`).

### Artifact Classification Matrix

The following reference matrix provides a concise architectural overview of all 13 certified LEOS artifacts:

| Artifact Name                  | Producer                  | Primary Consumer           | Domain Category    | Mutability      |
| :----------------------------- | :------------------------ | :------------------------- | :----------------- | :-------------- |
| **`RESEARCH_REPORT.md`**       | Research Validation Agent | Writing Agent, Auditors    | Research Artifacts | Immutable       |
| **`RESEARCH_INDEX.md`**        | Research Validation Agent | System / Human Editors     | Research Artifacts | Append-Only     |
| **`[slug].mdx`**               | Writing Agent             | Auditors, Publishing Agent | Editorial Content  | Safe Patch Only |
| **`SEO_REPORT.md`**            | SEO Optimization Agent    | Editor, Publishing Agent   | SEO Intelligence   | Immutable       |
| **`SEO_PATCH.md`**             | SEO Optimization Agent    | Publishing Agent, Editors  | SEO Intelligence   | Apply-Once      |
| **`EDITORIAL_REPORT.md`**      | Platinum Editor Agent     | Publishing Agent, Editors  | Editorial Audit    | Immutable       |
| **`EDITORIAL_PATCH.md`**       | Platinum Editor Agent     | Publishing Agent, Editors  | Editorial Audit    | Apply-Once      |
| **`PUBLISHING_REPORT.md`**     | Publishing Agent          | Human Editors, CI/CD       | Publication        | Immutable       |
| **`RELEASE_NOTES.md`**         | Publishing Agent          | Public / Human Editors     | Release Artifacts  | Immutable       |
| **`GIT_RELEASE_CHECKLIST.md`** | Publishing Agent          | Release Manager            | Release Artifacts  | Checkbox Update |
| **`DEPLOYMENT_CHECKLIST.md`**  | Publishing Agent          | Deployment Ops             | Release Artifacts  | Checkbox Update |
| **`LOCITRA_CONTENT_INDEX.md`** | Publishing Agent          | System / Human Editors     | System Artifacts   | Append-Only     |
| **`LEOS_CHANGELOG.md`**        | Publishing Agent          | System / Governance        | System Artifacts   | Append-Only     |

---

### Detailed Catalog Entries

#### 1. Research Report (`RESEARCH_REPORT.md`)

- **Category:** Research Artifacts
- **Producing Agent:** Research Validation Agent
- **Consuming Agents:** Writing Agent, SEO Optimization Agent, Platinum Editor Agent
- **Location:** `knowledge/research/<slug>/RESEARCH_REPORT.md`
- **Architectural Responsibility:** Compiles verified facts, product pricing tiers, technical specifications, benchmark performance metrics, and source citations. Serves as the immutable factual baseline for drafting.
- **Mutability:** Immutable once designated as `Validated` / `Approved`.

#### 2. Research Index (`RESEARCH_INDEX.md`)

- **Category:** Research Artifacts
- **Producing Agent:** Research Validation Agent
- **Consuming Agents:** System, Human Editors
- **Location:** `knowledge/research/RESEARCH_INDEX.md`
- **Architectural Responsibility:** Maintains a global index of all completed research files across the repository to prevent duplicate research efforts.
- **Mutability:** Append-Only.

#### 3. Article Draft (`data/blog/<slug>.mdx`)

- **Category:** Editorial Content Artifacts
- **Producing Agent:** Writing Agent
- **Consuming Agents:** SEO Optimization Agent, Platinum Editor Agent, Publishing Agent
- **Location:** `data/blog/<slug>.mdx`
- **Architectural Responsibility:** Production MDX article file containing Gold Standard frontmatter, structured section hierarchy (H2/H3), comparison tables, CTA forms, and internal anchor links.
- **Mutability:** Patchable via approved `SEO_PATCH.md` or `EDITORIAL_PATCH.md` during explicit Apply Mode.

#### 4. SEO Report (`SEO_REPORT.md`)

- **Category:** SEO Intelligence Artifacts
- **Producing Agent:** SEO Optimization Agent
- **Consuming Agents:** Platinum Editor Agent, Publishing Agent, Human Editors
- **Location:** `knowledge/seo/<slug>/SEO_REPORT.md`
- **Architectural Responsibility:** Read-only audit report detailing keyword integration, search intent alignment, heading structure compliance, internal linking coverage, and metadata scoring.
- **Mutability:** Immutable.

#### 5. SEO Patch (`SEO_PATCH.md`)

- **Category:** SEO Intelligence Artifacts
- **Producing Agent:** SEO Optimization Agent
- **Consuming Agents:** Publishing Agent, Human Editors
- **Location:** `knowledge/seo/<slug>/SEO_PATCH.md`
- **Architectural Responsibility:** Actionable, highly targeted instruction file containing precise diffs or replacement blocks to resolve SEO and metadata defects.
- **Mutability:** Apply-Once (consumed during Apply Mode patching).

#### 6. Editorial Report (`EDITORIAL_REPORT.md`)

- **Category:** Editorial Audit Artifacts
- **Producing Agent:** Platinum Editor Agent
- **Consuming Agents:** Publishing Agent, Human Editors
- **Location:** `knowledge/editorial/<slug>/EDITORIAL_REPORT.md`
- **Architectural Responsibility:** Read-only audit report evaluating E-E-A-T compliance, Locitra tone of voice, paragraph rhythm, visual layout balance, and commercial neutrality.
- **Mutability:** Immutable.

#### 7. Editorial Patch (`EDITORIAL_PATCH.md`)

- **Category:** Editorial Audit Artifacts
- **Producing Agent:** Platinum Editor Agent
- **Consuming Agents:** Publishing Agent, Human Editors
- **Location:** `knowledge/editorial/<slug>/EDITORIAL_PATCH.md`
- **Architectural Responsibility:** Actionable instruction file specifying precise text modifications required to resolve editorial quality defects before release.
- **Mutability:** Apply-Once (consumed during Apply Mode patching).

#### 8. Publishing Report (`PUBLISHING_REPORT.md`)

- **Category:** Publication Artifacts
- **Producing Agent:** Publishing Agent
- **Consuming Agents:** Human Editors, CI/CD Build Pipeline
- **Location:** `knowledge/publishing/<slug>/PUBLISHING_REPORT.md`
- **Architectural Responsibility:** Final operational release gate verdict (`Ready`, `Blocked`, or `Patch Pending`). Summarizes overall build readiness, patch verification, and image asset validation.
- **Mutability:** Immutable.

#### 9. Release Notes (`RELEASE_NOTES.md`)

- **Category:** Release Artifacts
- **Producing Agent:** Publishing Agent
- **Consuming Agents:** Public Audience, Human Editors
- **Location:** `knowledge/publishing/<slug>/RELEASE_NOTES.md`
- **Architectural Responsibility:** Human-readable summary of the new article, target cluster alignment, and editorial value delivered by the publication.
- **Mutability:** Immutable.

#### 10. Git Release Checklist (`GIT_RELEASE_CHECKLIST.md`)

- **Category:** Release Artifacts
- **Producing Agent:** Publishing Agent
- **Consuming Agents:** Human Release Manager
- **Location:** `knowledge/publishing/<slug>/GIT_RELEASE_CHECKLIST.md`
- **Architectural Responsibility:** Procedural verification checklist covering Git branch state, commit tagging, merge approval, and origin push verification.
- **Mutability:** Checkbox State Updates allowed.

#### 11. Deployment Checklist (`DEPLOYMENT_CHECKLIST.md`)

- **Category:** Release Artifacts
- **Producing Agent:** Publishing Agent
- **Consuming Agents:** Human Deployment Ops / Release Manager
- **Location:** `knowledge/publishing/<slug>/DEPLOYMENT_CHECKLIST.md`
- **Architectural Responsibility:** Post-deployment verification checklist covering Next.js build validation, Contentlayer ingestion, IndexNow URL submission, and live URL smoke testing.
- **Mutability:** Checkbox State Updates allowed.

#### 12. Content Index (`LOCITRA_CONTENT_INDEX.md`)

- **Category:** System Artifacts
- **Producing Agent:** Publishing Agent
- **Consuming Agents:** System, Human Editors
- **Location:** `LEOS/management/LOCITRA_CONTENT_INDEX.md`
- **Architectural Responsibility:** Global repository content map recording published slugs, categories, cluster targets, publication dates, and canonical URLs.
- **Mutability:** Append-Only.

#### 13. LEOS Change Log (`LEOS_CHANGELOG.md`)

- **Category:** System Artifacts
- **Producing Agent:** Publishing Agent
- **Consuming Agents:** System, Governance Auditors
- **Location:** `LEOS/management/LEOS_CHANGELOG.md`
- **Architectural Responsibility:** Automated audit log recording all modifications executed during explicit `APPLY MODE` passes, capturing dates, modified files, fields added, and safe fixes applied.
- **Mutability:** Append-Only.

---

## 8. Artifact Lifecycle

Artifacts transition through a formal 7-stage operational lifecycle from creation to long-term archiving:

```
Creation ──> Validation ──> Consumption ──> Review ──> Publication ──> Archival ──> Immutable History
```

1. **Creation**: Producing agent instantiates the artifact at its designated filesystem path upon completing its stage logic.
2. **Validation**: Artifact structure, metadata completeness, and formatting rules are verified against repository standards.
3. **Consumption**: Downstream agents read the validated artifact to execute subsequent pipeline stages.
4. **Review**: Human editors inspect audit reports and patches to grant or deny modification approvals.
5. **Publication**: Publishing Agent verifies all release gates and approves final deployment.
6. **Archival**: Intermediate reports and patch records are stored in dedicated `knowledge/` subdirectories.
7. **Immutable History**: Historical artifacts remain preserved in Git version control as immutable records of publication state.

---

## 8.1 Artifact State Model

The Artifact State Model defines the precise condition of an artifact at any given moment in the pipeline. While the **Artifact Lifecycle** describes _how artifacts move_, the **State Model** describes _the current condition of an artifact_.

| State             | Description                                                                     | Transition Rule                                       |
| :---------------- | :------------------------------------------------------------------------------ | :---------------------------------------------------- |
| **`Draft`**       | Newly created artifact awaiting structural or factual validation.               | Transits to `Validated` upon passing quality checks.  |
| **`Validated`**   | Approved for downstream agent consumption.                                      | Transits to `Consumed` when read by downstream agent. |
| **`Consumed`**    | Ingested by a downstream agent; operational task completed.                     | Transits to `Review` or `Archived`.                   |
| **`Review`**      | Under human editorial evaluation or patch authorization.                        | Transits to `Publication` upon human approval.        |
| **`Publication`** | Formally released into production alongside published MDX.                      | Transits to `Archived`.                               |
| **`Archived`**    | Retained in `knowledge/` directories for audit traceability.                    | Permanent state.                                      |
| **`Superseded`**  | Replaced by an updated artifact version while remaining historically traceable. | Permanent historical state.                           |

---

## 9. Ownership & Mutability Model

LEOS enforces strict ownership and mutability controls across all artifacts to ensure state integrity:

- **Single Producer Ownership**: Only the designated producing agent may create or write to an artifact. Downstream agents have read-only access.
- **Human Review Primacy**: Human editors hold sole authority to approve state modifications, apply patch files, or override audit verdicts.
- **Read-Only Audit Isolation**: Diagnostic agents (SEO and Editorial auditors) produce read-only analytical reports (`SEO_REPORT.md`, `EDITORIAL_REPORT.md`) that are strictly immutable.
- **Apply Mode Patching**: Modifications to draft MDX files occur exclusively through approved patch artifacts (`SEO_PATCH.md`, `EDITORIAL_PATCH.md`) during explicit `APPLY MODE` passes.
- **Append-Only Repositories**: Master registers (`RESEARCH_INDEX.md`, `LOCITRA_CONTENT_INDEX.md`, `LEOS_CHANGELOG.md`) are append-only. Existing historical entries may never be deleted or overwritten by automated processes.

---

## 10. Repository Validation Rules

Every artifact persisted within the repository must satisfy six repository-wide quality standards:

1. **Markdown Compliance**: Authored strictly in standard GitHub Flavored Markdown (GFM).
2. **UTF-8 Encoding**: Files must use pure UTF-8 character encoding without BOM (Byte Order Mark).
3. **Unix Line Endings**: Files must strictly use Unix LF (`\n`) line endings. Windows CRLF (`\r\n`) is prohibited.
4. **Relative Link Paths**: All internal file cross-references must use relative Markdown links (`../`, `./`) pointing directly to canonical repository paths.
5. **Naming Conventions**: File names must strictly adhere to uppercase standard conventions (e.g., `RESEARCH_REPORT.md`) or lower-case slug conventions (e.g., `data/blog/<slug>.mdx`).
6. **Build Compatibility**: Artifacts must contain clean syntax that introduces no MDX parser failures or Contentlayer build errors.

---

## 11. Dependency & Communication Rules

Artifact communication flows strictly under top-down, forward-only dependency rules:

- **Forward-Only Handoffs**: Upstream stage artifacts feed downstream stage agents. Downstream agents must never mutate upstream artifacts.
- **No Shared Runtime Memory**: State is passed exclusively via persistent disk artifacts. Direct memory references or cross-agent variables are forbidden.
- **No Backward Mutation**: Downstream agents (such as Publishing) cannot modify upstream research or audit reports.
- **No Cross-Agent Coupling**: Specialist agents operate independently. An agent reads input artifacts from disk without invoking or inspecting another agent's internal state.

---

## 12. Future Artifact Expansion Governance

To preserve system stability as LEOS expands, introducing a new artifact type requires compliance with the following governance rules:

1. **Demonstrated Operational Need**: The proposed artifact must fulfill a clear inter-agent handoff requirement not met by existing artifacts.
2. **Single Responsibility**: The artifact must serve exactly one functional purpose within one domain category.
3. **Registry Inclusion**: The artifact must be catalogued in Section 7 of this document (`LEOS/operations/ARTIFACTS.md`) prior to deployment.
4. **Backward Compatibility**: New artifacts must not break existing pipeline handoffs or invalidate existing historical artifacts.
5. **ADR-001 Compliance**: The artifact definition must remain purely architectural and contain no executable code or prompt text.

---

## 13. Relationship to Other Documents

This specification operates within the broader LEOS documentation framework. It cross-references related specifications without duplicating their contents:

- **[README.md](../README.md)**: Top-level repository gateway and navigation portal.
- **[LEOS.md](../core/LEOS.md)**: Supreme constitutional authority governing all LEOS operations.
- **[ARCHITECTURE.md](../architecture/ARCHITECTURE.md)**: System topology, structural layers, and architectural principles.
- **[ADR-001 (Agent Architecture)](../architecture/ADR_001_AGENT_ARCHITECTURE.md)**: Governs the permanent separation between runtime implementation (`.agents/`) and documentation (`LEOS/`).
- **[PIPELINE.md](PIPELINE.md)**: Authoritative specification for execution stages, agent sequence, and release gates.
- **[AGENT_INDEX.md](AGENT_INDEX.md)**: Authoritative catalogue of runtime agents, single responsibilities, and workflow matrices.

---

## 14. Version Information

| Property                   | Value                                                  |
| :------------------------- | :----------------------------------------------------- |
| **Document Title**         | LEOS Artifact Specification                            |
| **Canonical File Path**    | `LEOS/operations/ARTIFACTS.md`                         |
| **Specification Version**  | 2.0                                                    |
| **LEOS Framework Package** | Package 2 (Operational Intelligence & Agent Framework) |
| **Governance Standard**    | ADR-001 Compliant                                      |
| **Last Updated**           | 2026-08-06                                             |
| **Document Status**        | Authoritative (Freeze Pending)                         |

---

## 15. Enterprise Governance Footer

```
===================================================================================
LOCITRA EDITORIAL OPERATING SYSTEM (LEOS)
Package 2 – Operational Intelligence & Agent Framework
Document ID: LEOS-SPEC-ART-2.0 | Canonical Path: LEOS/operations/ARTIFACTS.md
Governance: ADR-001 Compliant | Status: Authoritative (Freeze Pending)
===================================================================================
```
