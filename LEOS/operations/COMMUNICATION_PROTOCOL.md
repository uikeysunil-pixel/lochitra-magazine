# LEOS Communication Protocol Specification

This document serves as the authoritative, permanent specification governing conceptual communication principles within the Locitra Editorial Operating System (LEOS). It establishes the architectural rules, communication boundaries, permitted communication paths, integrity principles, governance controls, and failure handling policies required for deterministic, stateless information exchange across operational components.

In compliance with **ADR-001 (Agent Architecture)**, this document belongs exclusively to the LEOS Operations Layer (`LEOS/operations/`). It defines human-readable operational communication governance rules and explicitly excludes executable code, networking protocols, APIs, transport mechanisms, software messaging frameworks, or automated communication scripts.

---

## 1. Title

**LEOS Communication Protocol Specification** (Package 2 – Operational Intelligence & Agent Framework)

---

## 2. Purpose

The purpose of this specification is to define the conceptual communication protocol governing deterministic, auditable, artifact-driven information exchange across LEOS. In an asynchronous, multi-agent editorial system, this specification defines how communication boundaries are enforced to guarantee system stability and auditability.

This document answers the core operational question:

> **How is information exchange conceptually governed across LEOS operational components without introducing horizontal coupling, hidden state, or unauthorized communication paths?**

### Scope Statement

> **Scope Statement:** This specification governs conceptual communication principles and operational boundaries only. It does **not** define runtime implementations, networking protocols, APIs, serialization formats, transport mechanisms, software messaging frameworks, executable prompts, or automation logic.

> **Communication Scope Summary:** This specification governs conceptual communication boundaries, permitted communication paths, communication integrity, and governance controls. It does **not** define runtime execution, orchestration policies, workflow logic, artifact specifications, execution context, transport mechanisms, APIs, serialization formats, or implementation details.

---

## 3. Communication Philosophy

Communication in LEOS is governed by eight fundamental architectural principles:

### Communication Principles Matrix

| Principle                      | Purpose                                                                                                             |
| :----------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| **Stateless Communication**    | Ensure information exchange carries no in-memory state; communicate exclusively through persistent disk state.      |
| **Artifact-Based Exchange**    | Enforce markdown artifacts on the filesystem bus as the single permitted channel for inter-component communication. |
| **Explicit Communication**     | Require all operational communication to follow explicitly defined paths without hidden side-channels.              |
| **Communication Integrity**    | Guarantee that communicated information remains complete, consistent, and uncorrupted across stage handoffs.        |
| **Human Governance**           | Enforce that human editorial authority unconditionally supersedes all communication states and routing paths.       |
| **Communication Isolation**    | Isolate agent communication boundaries to prevent horizontal inter-agent memory or state pollution.                 |
| **Deterministic Routing**      | Ensure identical operational inputs produce identical, predictable communication paths and artifact handoffs.       |
| **Communication Traceability** | Ensure every communication exchange remains audit-traceable from initial request to final publication.              |

---

## 4. Operational Scope

The Communication Protocol Specification establishes clear operational boundaries distinguishing conceptual communication from other system specifications:

### 4.1 Communication Responsibility Matrix

| Concern                          | Governing Specification                      | Single Responsibility                                                                |
| :------------------------------- | :------------------------------------------- | :----------------------------------------------------------------------------------- |
| **Execution Stages & Gates**     | [PIPELINE.md](PIPELINE.md)                   | Defines the 6-stage linear pipeline, stage entry/exit criteria, and release gates.   |
| **Workflow Patterns & Intent**   | [WORKFLOWS.md](WORKFLOWS.md)                 | Catalogues 9 editorial intent patterns, selection matrices, and section rules.       |
| **Runtime Agents & Roles**       | [AGENT_INDEX.md](AGENT_INDEX.md)             | Registers runtime agents, single responsibilities, and runtime directory paths.      |
| **Artifact Contracts & Schemas** | [ARTIFACTS.md](ARTIFACTS.md)                 | Defines artifact schemas, storage paths, state models, and mutability rules.         |
| **Operational Coordination**     | [ORCHESTRATION.md](ORCHESTRATION.md)         | Coordinates workflow routing, agent selection, artifact handoffs, and human gates.   |
| **Execution Context**            | [EXECUTION_CONTEXT.md](EXECUTION_CONTEXT.md) | Defines execution session boundaries, contextual metadata, and state tracing.        |
| **Communication Protocol**       | **`COMMUNICATION_PROTOCOL.md`**              | **Governs communication paths, channel boundaries, integrity rules, and isolation.** |

> Communication Protocol governs conceptual communication only and never assumes ownership of workflow logic, orchestration policies, execution sequencing, runtime behavior, execution context, or artifact specifications.

> **Communication Ownership Principle:** Every communication concern within LEOS has exactly one authoritative governing specification. `COMMUNICATION_PROTOCOL.md` owns conceptual communication governance exclusively and shall never duplicate responsibilities assigned to `PIPELINE.md`, `WORKFLOWS.md`, `AGENT_INDEX.md`, `ARTIFACTS.md`, `ORCHESTRATION.md`, or `EXECUTION_CONTEXT.md`.

---

## 5. Communication Model

The conceptual communication flow across LEOS follows a 7-step progression:

```
Editorial Request
      │
      ▼
Workflow Selection
      │
      ▼
Agent Coordination
      │
      ▼
Artifact Exchange
      │
      ▼
Human Review
      │
      ▼
Publishing Decision
      │
      ▼
Historical Record
```

### 5.1 Communication State Model

The Communication State Model defines the conceptual condition of an information exchange channel during execution:

| State             | Description                                                                         |
| :---------------- | :---------------------------------------------------------------------------------- |
| **`Pending`**     | Communication request initiated but prerequisite validation not yet established.    |
| **`Established`** | Permitted communication path validated and ready for artifact handoff.              |
| **`Active`**      | Information exchange actively occurring via persistent artifact generation on disk. |
| **`Waiting`**     | Communication paused at a mandatory human approval gate or review checkpoint.       |
| **`Completed`**   | Information exchange successfully verified and archived.                            |
| **`Archived`**    | Historical communication trace permanently recorded for auditability.               |

---

## 6. Communication Channels

LEOS strictly regulates permitted operational communication channels. Only six conceptual communication paths are authorized:

1. **Human → Workflow Orchestrator**: Editorial intent requests and manual governance overrides sent to top-down orchestration.
2. **Workflow Orchestrator → Runtime Agents**: Top-down sequential agent invocation based on validated workflow rules.
3. **Runtime Agent → Artifact**: Agent writing output artifacts to the designated filesystem bus location (`knowledge/`, `data/blog/`).
4. **Artifact → Runtime Agent**: Agent reading verified upstream artifacts as immutable input context.
5. **Human → Approval Gates**: Human editors recording explicit sign-offs or patch approvals at pipeline gates.
6. **Publishing → Repository**: Final deployment handoff writing verified content to production paths.

> **Mandatory Channel Rule:** Runtime agents never communicate directly with one another. All inter-agent communication must occur asynchronously via verified filesystem artifacts.

---

## 7. Communication Boundaries

To prevent systemic coupling and non-deterministic behavior, LEOS enforces five strict communication boundaries:

- **Forward-Only Communication**: Information flows strictly forward across pipeline stages. Backward state mutation is prohibited.
- **No Horizontal Communication**: Direct peer-to-peer communication between runtime agents is strictly forbidden.
- **No Backward Communication**: Downstream agents cannot pass execution signals or state messages directly to upstream agents.
- **No Hidden Runtime State**: Information exchange must be fully transparent and captured within visible disk artifacts.
- **No Shared Mutable Memory**: Agents do not share in-memory objects, global variables, or active process buffers.

---

## 8. Communication Integrity

Communication integrity ensures that information transferred across component boundaries remains untampered and verified:

- **Completeness**: Ensures all required fields, frontmatter properties, and content sections are fully present prior to handoff.
- **Consistency**: Confirms that communicated data conforms to the schema contracts defined in [ARTIFACTS.md](ARTIFACTS.md).
- **Traceability**: Requires every communication exchange to be linked to a unique execution session and logged in audit trails.
- **Deterministic Communication**: Guarantees that identical inputs produce identical communication outputs regardless of when or where executed.
- **Immutable Historical Record**: Preserves finalized communication records in permanent repository logs.

---

## 9. Human Governance

Human authority unconditionally governs all communication channels across LEOS:

> **Governance Principle:** Human decisions always supersede every communication state and operational communication path.

- **Approval Authority**: Mandatory human approval is required at designated pipeline checkpoints before state-modifying communications execute.
- **Override Authority**: Human editors possess absolute authority to halt, redirect, suspend, or abort any active communication path.
- **Communication Suspension**: If a governance anomaly occurs, human editors can suspend all communication channels immediately.
- **Governance Checkpoints**: Automated communications pause unconditionally when reaching human review gates.

---

## 10. Communication Failure Handling

Communication failures are conceptually classified into four distinct operational categories:

1. **Validation Failures**: Information exchanged fails schema, structural, or quality verification checks. Communication halts; status transitions to `Waiting` or `Suspended`.
2. **Operational Failures**: Interrupted session handoffs or unreadable disk artifacts. Communication halts; upstream artifacts are preserved for clean retry.
3. **Governance Failures**: Unauthorized communication path attempts or missing human gate approvals. Communication is blocked instantly.
4. **Communication Interruptions**: External process terminations during artifact writes. Communication transitions to `Suspended` to allow manual intervention.

---

## 11. Communication Recovery

When a communication failure occurs, LEOS applies deterministic recovery rules:

- **Restart Boundaries**: Communication resumes cleanly from the exact stage boundary where the interruption occurred.
- **Communication Continuity**: Preserved disk artifacts allow downstream components to re-establish communication without data loss.
- **Artifact Preservation**: Upstream artifacts are never deleted or overwritten during communication recovery.
- **Governance Preservation**: Human approval states recorded prior to failure remain valid and immutable.
- **Deterministic Recovery**: Re-executing a communication sequence yields identical results without side effects.

> **Recovery Governance Rule:** Communication recovery shall always resume from the most recently validated operational boundary and shall never bypass mandatory human approval checkpoints, governance controls, communication integrity verification, or artifact validation requirements.

---

## 12. Future Communication Expansion

Governance rules for future communication capabilities (such as distributed multi-cluster communication or real-time event logging) must adhere to strict invariant constraints:

### 12.1 Communication Invariants

1. **ADR-001 Compliance**: Strict boundary between runtime execution (`.agents/`) and documentation specifications (`LEOS/`).
2. **Stateless Communication**: Zero in-memory message passing or transient state retention across component boundaries.
3. **Artifact-Based Exchange**: Persistence of Markdown artifacts as the sole inter-component communication medium.
4. **Human Authority**: Human editorial decisions unconditionally override automated communication routing.
5. **Communication Integrity**: Communication exchanges must remain complete, consistent, and verifiable.
6. **Forward-Only Flow**: Unidirectional communication flow without backward state mutation.
7. **Backward Compatibility**: New communication capabilities must not invalidate existing frozen operational specifications.
8. **Communication Determinism**: Equivalent inputs must yield identical communication outputs across all executions.
9. **Communication Completeness**: Every authorized communication exchange shall preserve sufficient conceptual information to support deterministic governance review, operational traceability, historical auditing, and reproducible analysis without reliance on hidden runtime state.

### 12.2 Communication Governance

> **Operational Boundary Rule:** `COMMUNICATION_PROTOCOL.md` defines conceptual communication governance only. It never defines runtime implementation code, networking protocols, APIs, or transport mechanisms. It never replaces pipeline execution (`PIPELINE.md`), workflow contracts (`WORKFLOWS.md`), agent specifications (`AGENT_INDEX.md`), artifact specifications (`ARTIFACTS.md`), orchestration policies (`ORCHESTRATION.md`), or execution context (`EXECUTION_CONTEXT.md`).

---

## 13. Relationship to Other Documents

This specification operates within the broader LEOS documentation framework. It cross-references related specifications without duplicating their responsibilities:

- **[README.md](../README.md)**: Top-level repository gateway and navigation portal.
- **[LEOS.md](../core/LEOS.md)**: Supreme constitutional authority governing all LEOS operations.
- **[ARCHITECTURE.md](../architecture/ARCHITECTURE.md)**: System topology, structural layers, and architectural principles.
- **[ADR-001 (Agent Architecture)](../architecture/ADR_001_AGENT_ARCHITECTURE.md)**: Governs the permanent separation between runtime implementation (`.agents/`) and documentation (`LEOS/`).
- **[PIPELINE.md](PIPELINE.md)**: Authoritative specification for execution stages, entry/exit criteria, and release gates.
- **[WORKFLOWS.md](WORKFLOWS.md)**: Authoritative catalog of editorial intent patterns and content layouts.
- **[AGENT_INDEX.md](AGENT_INDEX.md)**: Authoritative catalogue of runtime agents, single responsibilities, and runtime directories.
- **[ARTIFACTS.md](ARTIFACTS.md)**: Authoritative specification for artifact schemas, file paths, and lifecycle state models.
- **[ORCHESTRATION.md](ORCHESTRATION.md)**: Authoritative specification for operational coordination policies and failure handling.
- **[EXECUTION_CONTEXT.md](EXECUTION_CONTEXT.md)**: Authoritative specification for execution session boundaries and metadata tracing.

---

## 14. Version Information

| Property                   | Value                                                  |
| :------------------------- | :----------------------------------------------------- |
| **Document Title**         | LEOS Communication Protocol Specification              |
| **Canonical File Path**    | `LEOS/operations/COMMUNICATION_PROTOCOL.md`            |
| **Specification Version**  | 2.0                                                    |
| **LEOS Framework Package** | Package 2 (Operational Intelligence & Agent Framework) |
| **Governance Standard**    | ADR-001 Compliant                                      |
| **Last Updated**           | 2026-08-06                                             |
| **Document Status**        | Authoritative (Freeze Pending)                         |

> **Freeze Governance Note:** This specification becomes immutable only after explicit human approval, successful technical validation, Git commit, Git push, final repository verification, and formal freeze authorization under LEOS governance.

---

## 15. Enterprise Governance Footer

```
===================================================================================
LOCITRA EDITORIAL OPERATING SYSTEM (LEOS)
Package 2 – Operational Intelligence & Agent Framework
Document ID: LEOS-SPEC-COMM-2.0 | Canonical Path: LEOS/operations/COMMUNICATION_PROTOCOL.md
Governance: ADR-001 Compliant | Status: Authoritative (Freeze Pending)
===================================================================================
```
