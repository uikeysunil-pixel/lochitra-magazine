# LEOS Runtime Agent Index & Registry

This document serves as the authoritative, permanent registry of runtime agents within the Locitra Editorial Operating System (LEOS). It defines the architectural role, single responsibility, runtime location, workflow participation, pipeline alignment, artifact boundaries, and communication model for every runtime agent.

In compliance with **ADR-001 (Architectural Decision Record 001)**, this document belongs exclusively to the LEOS Documentation Layer (`LEOS/`). It contains human-readable architectural specifications and matrix definitions, and explicitly excludes executable prompts, code implementations, and internal prompt logic.

---

## 1. Title

**LEOS Runtime Agent Index & Registry** (Package 2 – Operational Intelligence & Agent Framework)

---

## 2. Purpose

The purpose of this registry is to establish an immutable architectural catalogue of all runtime agents operating across LEOS. It acts as the central reference for system architects, human editors, and automated orchestrators to understand:

- The single responsibility and boundary of every runtime agent.
- The physical directory location where an agent's runtime implementation resides.
- How agents participate sequentially across execution pipeline stages.
- How agents engage dynamically across editorial workflow patterns.
- The immutable artifact contracts governing inter-agent handoffs.
- The top-down dependency hierarchy and communication rules.

This document describes **system architecture and operational relationships**, leaving executable instructions to the `.agents/` runtime layer.

---

## 3. Agent Registry Philosophy

Every runtime agent registered within LEOS is governed by six fundamental architectural principles:

1. **Single Responsibility Principle**: Every agent owns exactly one operational domain (e.g., factual research, content drafting, SEO auditing, editorial review, or release management). An agent must never absorb, duplicate, or perform the duties of another agent.
2. **Stateless Communication**: Agents communicate exclusively through persistent, immutable markdown artifacts written to designated filesystem locations. No agent retains in-memory state across execution boundaries.
3. **Read-Only Audit Isolation**: Diagnostic and evaluation agents (such as SEO and Editorial auditors) operate in read-only mode by default, outputting analytical reports without mutating draft files unless explicit apply-mode patching is authorized.
4. **Human Governance Primacy**: State-modifying operations, patch applications, and release deployments require explicit human authorization. Automation assists editors; it never replaces human judgment.
5. **Runtime / Documentation Boundary**: Clear separation is enforced between executable assets (`.agents/`) and documentation catalogues (`LEOS/`) per ADR-001.
6. **Architectural Stability**: Registry definitions remain stable and valid regardless of internal prompt optimizations or skill updates occurring inside runtime directories.

---

## 4. Runtime vs Documentation Boundary

LEOS maintains a strict architectural boundary between the **Runtime Implementation Layer** and the **Documentation Layer**, formally established in [ADR-001 (Agent Architecture)](../architecture/ADR_001_AGENT_ARCHITECTURE.md) and [ARCHITECTURE.md](../architecture/ARCHITECTURE.md).

```
+-----------------------------------------------------------------------------------+
|                            LEOS SYSTEM ARCHITECTURE                               |
+-----------------------------------------------------------------------------------+
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        ▼                                                                 ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────────────┐
│     RUNTIME IMPLEMENTATION LAYER      │ │         DOCUMENTATION LAYER           │
│              (`.agents/`)             │ │               (`LEOS/`)               │
├───────────────────────────────────────┤ ├───────────────────────────────────────┤
│ • Active AI session bootstrap         │ │ • Architectural Specifications        │
│   (`.agents/AGENTS.md`)               │ │ • Human-Readable Catalogues           │
│ • Executable skill directories        │ │   (`LEOS/operations/AGENT_INDEX.md`)  │
│   (`.agents/skills/<agent_name>/`)    │ │ • Operational Pipelines & Workflows   │
│ • Executable prompt instructions      │ │   (`PIPELINE.md`, `WORKFLOWS.md`)     │
│ • Runtime skill registration          │ │ • Constitutional Authority            │
│   (`skills.json`)                     │ │   (`LEOS/core/LEOS.md`, `ADR-001`)    │
└───────────────────────────────────────┘ └───────────────────────────────────────┘
```

### Key Boundary Constraints:

- **No Implementation in Documentation**: `LEOS/` files must never store executable prompts, code snippets, or runtime skill instructions.
- **No Documentation in Runtime**: `.agents/` skill files must never duplicate constitutional policies, pipeline specifications, or human-readable catalogues.
- **Single Source of Truth**: The `.agents/skills/` directory tree owns runtime execution; the `LEOS/` directory tree owns system documentation.

---

## 5. Runtime Agent Registry

The following table catalogs all certified runtime agents currently operating within LEOS v2.0:

| Agent Name                    | Architectural Role             | Single Responsibility                                               | Runtime Directory                       | Primary Pipeline Stage    | Status    |
| :---------------------------- | :----------------------------- | :------------------------------------------------------------------ | :-------------------------------------- | :------------------------ | :-------- |
| **Workflow Orchestrator**     | Workflow Controller            | Workflow coordination, agent selection, and pipeline routing        | `.agents/skills/workflow_orchestrator/` | Stage 1 (Orchestration)   | Permanent |
| **Research Validation Agent** | Domain Specialist              | Empirical research, fact-checking, and benchmark compilation        | `.agents/skills/research_validation/`   | Stage 2 (Research)        | Frozen    |
| **Writing Agent**             | Content Generation Engine      | Transforming verified research into Platinum MDX articles           | `.agents/skills/writing_agent/`         | Stage 3 (Generation)      | Frozen    |
| **SEO Optimization Agent**    | Read-Only Quality Auditor      | Search visibility, schema validation, and internal link auditing    | `.agents/skills/seo_optimization/`      | Stage 4 (SEO Audit)       | Active    |
| **Platinum Editor Agent**     | Read-Only Editorial Gatekeeper | E-E-A-T evaluation, tone of voice, clarity, and neutrality auditing | `.agents/skills/platinum_editor/`       | Stage 5 (Editorial Audit) | Active    |
| **Publishing Agent**          | Operational Release Manager    | Build readiness, release checklist verification, and deployment     | `.agents/skills/publishing_agent/`      | Stage 6 (Release Gate)    | Active    |

---

## 6. Standard Agent Specification

### Workflow Orchestrator

- **Architectural Role:** Workflow Controller
- **Single Responsibility:** Stateless workflow coordination, agent selection, and sequential pipeline routing without performing editorial tasks.
- **Agent Status:** Permanent Architectural Rule
- **Introduced In Package:** Package 1
- **Runtime Location:** `.agents/skills/workflow_orchestrator/`
- **Pipeline Participation:** Stage 1 (Intent Definition) & Cross-Pipeline Coordination
- **Workflow Participation:** All Workflows (Orchestration & Routing)
- **Consumes:** User Prompt & Editorial Intent Specifications
- **Produces:** Execution Sequence Plan & Handoff Routing Directives
- **Upstream Dependencies:** Human Editorial Request
- **Downstream Dependencies:** Research Validation Agent, Writing Agent, SEO Optimization Agent, Platinum Editor Agent, Publishing Agent
- **Related Documents:** [WORKFLOWS.md](WORKFLOWS.md), [PIPELINE.md](PIPELINE.md), [ADR-001](../architecture/ADR_001_AGENT_ARCHITECTURE.md)
- **Implementation Reference:** `.agents/skills/workflow_orchestrator/`

---

### Research Validation Agent

- **Architectural Role:** Factual Research Engine
- **Single Responsibility:** Compiling verified facts, technical specifications, pricing data, and benchmark comparisons into an immutable research report.
- **Agent Status:** Frozen
- **Introduced In Package:** Package 1
- **Runtime Location:** `.agents/skills/research_validation/`
- **Pipeline Participation:** Stage 2 (Factual Research & Validation)
- **Workflow Participation:** Software Review, Comparison, Tutorial, Pillar, Pricing Guide, Alternatives, Roundup, Cluster Creation
- **Consumes:** Topic Target Specifications & Domain Guidelines
- **Produces:** Research Knowledge Artifacts (see [ARTIFACTS.md](../ARTIFACTS.md))
- **Upstream Dependencies:** Workflow Orchestrator
- **Downstream Dependencies:** Writing Agent
- **Related Documents:** [PIPELINE.md](PIPELINE.md), [ARTIFACTS.md](../ARTIFACTS.md)
- **Implementation Reference:** `.agents/skills/research_validation/`

---

### Writing Agent

- **Architectural Role:** Structured Content Generation Engine
- **Single Responsibility:** Transforming approved factual research into publication-ready Platinum MDX articles adhering strictly to Locitra technical and editorial schemas.
- **Agent Status:** Frozen
- **Introduced In Package:** Package 1
- **Runtime Location:** `.agents/skills/writing_agent/`
- **Pipeline Participation:** Stage 3 (Structured Content Generation)
- **Workflow Participation:** Software Review, Comparison, Tutorial, Pillar, Pricing Guide, Alternatives, Roundup, Content Refresh, Cluster Creation
- **Consumes:** Research Knowledge Artifacts & Gold Standard MDX Specifications
- **Produces:** Draft Content Artifacts (see [ARTIFACTS.md](../ARTIFACTS.md))
- **Upstream Dependencies:** Research Validation Agent
- **Downstream Dependencies:** SEO Optimization Agent
- **Related Documents:** [PIPELINE.md](PIPELINE.md), [WORKFLOWS.md](WORKFLOWS.md), [AGENTS.md](../../.agents/AGENTS.md)
- **Implementation Reference:** `.agents/skills/writing_agent/`

---

### SEO Optimization Agent

- **Architectural Role:** Search Visibility & Intelligence Auditor
- **Single Responsibility:** Auditing draft articles for search intent alignment, schema correctness, semantic keyword integration, and internal link routing in read-only mode.
- **Agent Status:** Active
- **Introduced In Package:** Package 2
- **Runtime Location:** `.agents/skills/seo_optimization/`
- **Pipeline Participation:** Stage 4 (Technical & SEO Intelligence Audit)
- **Workflow Participation:** All Workflows (Audit Phase)
- **Consumes:** Draft Content Artifacts & Research Knowledge Artifacts
- **Produces:** SEO Intelligence & Patch Artifacts (see [ARTIFACTS.md](../ARTIFACTS.md))
- **Upstream Dependencies:** Writing Agent
- **Downstream Dependencies:** Platinum Editor Agent
- **Related Documents:** [PIPELINE.md](PIPELINE.md), [ARTIFACTS.md](../ARTIFACTS.md)
- **Implementation Reference:** `.agents/skills/seo_optimization/`

---

### Platinum Editor Agent

- **Architectural Role:** Editorial Quality & E-E-A-T Gatekeeper
- **Single Responsibility:** Evaluating draft articles against Locitra standards for E-E-A-T compliance, tone of voice, readability rhythm, visual hierarchy, and commercial neutrality in read-only mode.
- **Agent Status:** Active
- **Introduced In Package:** Package 2
- **Runtime Location:** `.agents/skills/platinum_editor/`
- **Pipeline Participation:** Stage 5 (Platinum Editorial Review)
- **Workflow Participation:** All Workflows (Editorial Quality Gate)
- **Consumes:** Draft Content Artifacts & SEO Intelligence Artifacts
- **Produces:** Editorial Audit & Patch Artifacts (see [ARTIFACTS.md](../ARTIFACTS.md))
- **Upstream Dependencies:** SEO Optimization Agent
- **Downstream Dependencies:** Publishing Agent
- **Related Documents:** [PIPELINE.md](PIPELINE.md), [AGENTS.md](../../.agents/AGENTS.md)
- **Implementation Reference:** `.agents/skills/platinum_editor/`

---

### Publishing Agent

- **Architectural Role:** Operational Release Manager
- **Single Responsibility:** Verifying build readiness, patch resolutions, featured image assets, git release checklists, and executing the Three-Pass Release System.
- **Agent Status:** Active
- **Introduced In Package:** Package 2
- **Runtime Location:** `.agents/skills/publishing_agent/`
- **Pipeline Participation:** Stage 6 (Deployment & Three-Pass Release Gate)
- **Workflow Participation:** All Workflows (Release & Deployment Phase)
- **Consumes:** Draft Content Artifacts & Upstream Audit Artifacts
- **Produces:** Publication & Release Artifacts (see [ARTIFACTS.md](../ARTIFACTS.md))
- **Upstream Dependencies:** Platinum Editor Agent
- **Downstream Dependencies:** Git Repository / Deployment Pipeline
- **Related Documents:** [PIPELINE.md](PIPELINE.md), [ARTIFACTS.md](../ARTIFACTS.md)
- **Implementation Reference:** `.agents/skills/publishing_agent/`

---

## 7. Runtime Location Mapping

Runtime agent skill implementations reside in dedicated skill directories within the runtime layer. The documentation registry references directory locations only, ensuring decoupling from specific executable prompt filenames:

```
.agents/
└── skills/
    ├── workflow_orchestrator/    <-- Runtime directory for Workflow Orchestrator
    ├── research_validation/      <-- Runtime directory for Research Validation Agent
    ├── writing_agent/            <-- Runtime directory for Writing Agent
    ├── seo_optimization/         <-- Runtime directory for SEO Optimization Agent
    ├── platinum_editor/          <-- Runtime directory for Platinum Editor Agent
    └── publishing_agent/         <-- Runtime directory for Publishing Agent
```

> **Architectural Constraint:** The contents of these directories (e.g., `SKILL.md`, supporting scripts, or references) are managed dynamically by the runtime system. The documentation layer references the containing directory only.

---

## 8. Workflow Participation Matrix

The following matrix documents the participation role of each runtime agent across all nine supported LEOS workflow patterns defined in [WORKFLOWS.md](WORKFLOWS.md):

| Workflow Pattern            | Workflow Orchestrator | Research Validation Agent | Writing Agent         | SEO Optimization Agent | Platinum Editor Agent | Publishing Agent |
| :-------------------------- | :-------------------- | :------------------------ | :-------------------- | :--------------------- | :-------------------- | :--------------- |
| **1. Software Review**      | Lead Router           | Primary Researcher        | Content Drafter       | SEO Auditor            | Quality Gate          | Release Manager  |
| **2. Comparison**           | Lead Router           | Primary Researcher        | Content Drafter       | SEO Auditor            | Quality Gate          | Release Manager  |
| **3. Tutorial / How-To**    | Lead Router           | Technical Researcher      | Action Guide Drafter  | SEO Auditor            | Quality Gate          | Release Manager  |
| **4. Pillar / Hub Article** | Lead Router           | Category Researcher       | Hub Content Drafter   | Internal Link Auditor  | Quality Gate          | Release Manager  |
| **5. Pricing Guide**        | Lead Router           | Financial Researcher      | Tier Analysis Drafter | SEO Auditor            | Quality Gate          | Release Manager  |
| **6. Alternatives Guide**   | Lead Router           | Competitor Researcher     | Comparison Drafter    | SEO Auditor            | Quality Gate          | Release Manager  |
| **7. Roundup Article**      | Lead Router           | Multi-Product Researcher  | Compilation Drafter   | SEO Auditor            | Quality Gate          | Release Manager  |
| **8. Content Refresh**      | Lead Router           | Fact Delta Researcher     | Maintenance Drafter   | Metadata Auditor       | Delta Auditor         | Release Manager  |
| **9. Cluster Creation**     | Master Router         | Batch Researcher          | Sequential Drafter    | Cluster Link Auditor   | Multi-Article Gate    | Batch Release    |

---

## 9. Pipeline Participation Matrix

The following matrix documents how runtime agents align with the six sequential stages of the LEOS Execution Pipeline defined in [PIPELINE.md](PIPELINE.md):

| Pipeline Stage                             | Active Agent              | Primary Function                         | Input Handoff              | Output Handoff                               |
| :----------------------------------------- | :------------------------ | :--------------------------------------- | :------------------------- | :------------------------------------------- |
| **Stage 1: Intent & Cluster Target**       | Workflow Orchestrator     | Pipeline Routing & Intent Classification | User Prompt                | Topic Target Specification                   |
| **Stage 2: Factual Research**              | Research Validation Agent | Empirical Research & Fact Compilation    | Topic Target Specification | `RESEARCH_REPORT.md`                         |
| **Stage 3: Structured Content Generation** | Writing Agent             | MDX Generation & Content Structuring     | `RESEARCH_REPORT.md`       | `data/blog/<slug>.mdx`                       |
| **Stage 4: Technical & SEO Audit**         | SEO Optimization Agent    | Read-Only SEO & Metadata Audit           | `data/blog/<slug>.mdx`     | `SEO_REPORT.md` / `SEO_PATCH.md`             |
| **Stage 5: Platinum Editorial Review**     | Platinum Editor Agent     | Read-Only E-E-A-T & Voice Audit          | `data/blog/<slug>.mdx`     | `EDITORIAL_REPORT.md` / `EDITORIAL_PATCH.md` |
| **Stage 6: Deployment & Release Gate**     | Publishing Agent          | Release Gate & Build Verification        | MDX + Audit Reports        | `PUBLISHING_REPORT.md` & Deployment          |

---

## 10. Agent Communication Model

Runtime agents in LEOS communicate through a **stateless, filesystem-mediated communication model**. Direct memory sharing, inter-agent state passing, and horizontal communication channels are strictly prohibited.

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           STATELESS FILESYSTEM BUS                                │
└───────────────────────────────────────────────────────────────────────────────────┘
     ▲                                 ▲                                 ▲
     │ (writes artifact)               │ (reads/writes artifact)         │ (reads artifact)
┌────┴───────────────┐           ┌─────┴───────────────┐           ┌─────┴───────────────┐
│  Research Agent    │           │    Writing Agent    │           │    SEO Agent        │
└────────────────────┘           └─────────────────────┘           └─────────────────────┘
```

### Communication Rules:

1. **Immutable Artifact Handoffs**: Stage outputs are written as immutable markdown artifacts to the designated filesystem path (e.g., `knowledge/research/` or `data/blog/`). Upstream agents produce artifacts; downstream agents consume them.
2. **Zero In-Memory Cross-State**: Agents are initialized statelessly. An agent reads its required input artifacts from disk at session start and writes its output artifacts to disk upon completion.
3. **Orchestrator Routing**: The Workflow Orchestrator monitors filesystem artifact existence to infer pipeline progression and trigger subsequent agent invocations.
4. **Compliance with ADR-001**: Communication contracts are defined at the architectural level without embedding transport code into agent skill definitions.

---

## 11. Artifact Responsibilities

Artifacts serve as the sole communication medium between runtime agents. The high-level artifact categories consumed and produced across the runtime lifecycle are outlined below:

- **Research Artifacts Category**: Owned by the Research Validation Agent. Encapsulates empirical research, fact compilations, pricing breakdowns, and benchmark data.
- **Editorial Content Category**: Owned by the Writing Agent. Encapsulates structured draft content and Gold Standard MDX article files.
- **SEO Intelligence & Patch Category**: Owned by the SEO Optimization Agent. Encapsulates read-only search visibility audits, metadata evaluations, and actionable safe patch instructions.
- **Editorial Audit & Patch Category**: Owned by the Platinum Editor Agent. Encapsulates E-E-A-T evaluations, editorial quality scoring, tone audits, and editorial patch instructions.
- **Publication & Release Category**: Owned by the Publishing Agent. Encapsulates release verification verdicts, deployment checklists, release summaries, and automated changelogs.

> **Authoritative Specification:** For complete artifact schemas, exact filenames, storage path conventions, lifecycle state transitions, and validation rules, refer exclusively to [ARTIFACTS.md](../ARTIFACTS.md).

---

## 12. Dependency Rules

LEOS enforces strict, unidirectional dependency constraints across all runtime agents:

```
Top-Down Orchestration Layer (Workflow Orchestrator)
                   │
                   ▼
Domain Specialist Execution Layer (Research -> Writing -> SEO -> Editor -> Publishing)
```

### Hierarchy Constraints:

- **Strict Top-Down Flow**: Higher-level orchestrators invoke lower-level specialists. Lower-level agents must never depend on, call, or inspect higher-level orchestrator state.
- **No Horizontal Coupling**: Specialist agents operate independently within their pipeline stages. The Writing Agent does not call the SEO Agent; the SEO Agent does not call the Editor.
- **Orchestrator Separation**: The Workflow Orchestrator coordinates execution sequence but owns no editorial artifacts or domain logic.

---

## 13. Agent Lifecycle

Every runtime agent in LEOS follows a formal 9-stage architectural lifecycle from initial proposal to eventual retirement:

```
   Proposal
      │
      ▼
Architecture Review
      │
      ▼
Documentation Registration (AGENT_INDEX.md)
      │
      ▼
Runtime Implementation (.agents/skills/<agent>/)
      │
      ▼
  Validation
      │
      ▼
  Activation
      │
      ▼
Operational Use
      │
      ▼
    Freeze
      │
      ▼
  Retirement
```

1. **Proposal**: Submission of business need for a new agent.
2. **Architecture Review**: Evaluation against ADR-001, ARCHITECTURE.md, and Single Responsibility rules.
3. **Documentation Registration**: Addition of agent metadata to `LEOS/operations/AGENT_INDEX.md`.
4. **Runtime Implementation**: Creation of runtime directory inside `.agents/skills/<agent>/`.
5. **Validation**: Execution verification across pipeline stages and test articles.
6. **Activation**: Official deployment into production pipeline.
7. **Operational Use**: Active participation in content workflows.
8. **Freeze**: Specification frozen to prevent unexpected behavioral drift.
9. **Retirement**: Controlled deprecation and archive when superseded.

---

## 14. Future Agent Expansion

To preserve architectural integrity, any proposed addition of a new runtime agent must satisfy the following strict governance requirements:

- **Single Responsibility**: The proposed agent must own exactly one distinct operational responsibility not covered by existing agents.
- **Runtime Location**: The agent must reside in its own isolated directory under `.agents/skills/<new_agent>/`.
- **Registry Entry**: The agent must be registered in `LEOS/operations/AGENT_INDEX.md` with complete metadata prior to runtime deployment.
- **Architectural Compliance**: The agent must fully comply with [ADR-001](../architecture/ADR_001_AGENT_ARCHITECTURE.md), [ARCHITECTURE.md](../architecture/ARCHITECTURE.md), and [CONTRIBUTING.md](../governance/CONTRIBUTING.md).
- **Stateless Handoff Contract**: The agent must consume and produce filesystem artifacts adhering to [ARTIFACTS.md](../ARTIFACTS.md).

---

## 15. Relationship to Other Documents

This registry operates within the broader LEOS documentation framework. It cross-references authoritative specifications without duplicating their contents:

- **[README.md](../README.md)**: Repository overview and top-level directory index.
- **[LEOS.md](../core/LEOS.md)**: Supreme constitutional authority governing all LEOS operations.
- **[ARCHITECTURE.md](../architecture/ARCHITECTURE.md)**: System topology, structural layers, and architectural principles.
- **[ADR-001 (Agent Architecture)](../architecture/ADR_001_AGENT_ARCHITECTURE.md)**: Governs the permanent separation between runtime implementation (`.agents/`) and documentation (`LEOS/`).
- **[PIPELINE.md](PIPELINE.md)**: Authoritative specification for linear execution stages and release gates.
- **[WORKFLOWS.md](WORKFLOWS.md)**: Authoritative catalog of editorial intent patterns and content layouts.
- **[ARTIFACTS.md](../ARTIFACTS.md)**: Authoritative specification for artifact schemas, file paths, and handoff contracts.
- **[.agents/AGENTS.md](../../.agents/AGENTS.md)**: Global governance rules active in runtime sessions.

---

## 16. Version Information

| Property                   | Value                                                  |
| :------------------------- | :----------------------------------------------------- |
| **Document Status**        | Authoritative / Frozen                                 |
| **Specification Version**  | 2.0                                                    |
| **LEOS Framework Package** | Package 2 (Operational Intelligence & Agent Framework) |
| **Canonical File Path**    | `LEOS/operations/AGENT_INDEX.md`                       |

| **Governance Standard** | ADR-001 Compliant |
| **Last Updated** | 2026-08-06 |
