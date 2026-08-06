# LEOS Execution Context Specification

This document serves as the authoritative, permanent specification governing execution context concepts within the Locitra Editorial Operating System (LEOS). It defines how execution sessions, contextual metadata, runtime state boundaries, human approvals, and artifact references are conceptually represented across system operations.

In compliance with **ADR-001 (Agent Architecture)**, this document belongs exclusively to the LEOS Operations Layer (`LEOS/operations/`). It defines human-readable operational context specifications and governance principles, and explicitly excludes executable prompts, code implementations, runtime context serialization schemas, or automated context management scripts.

---

## 1. Title

**LEOS Execution Context Specification** (Package 2 – Operational Intelligence & Agent Framework)

---

## 2. Purpose

The purpose of this specification is to define execution context as the conceptual information boundary that accompanies every LEOS execution session throughout its operational lifecycle. In a stateless, artifact-driven multi-agent system, execution context establishes what information defines an active or historical operational session.

This document answers the core operational question:

> **What information conceptually defines a LEOS execution session, and how is contextual state bounded across operational handoffs without violating component responsibilities?**

It defines **what execution context is**, not how it is technically implemented in software.

> **Scope Statement:** This specification defines conceptual execution context and governance boundaries only. It does not define runtime implementations, execution algorithms, workflow contracts, orchestration behavior, runtime agent behavior, artifact schemas, serialization formats, repository automation, or executable logic.

---

## 3. Execution Context Philosophy

Execution context in LEOS is governed by eight fundamental architectural principles:

### Context Principles Matrix

| Principle                      | Purpose                                                                                                                                |
| :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| **Stateless Execution**        | Ensure agents initialize statelessly; context accompanies execution conceptually via persistent artifact state.                        |
| **Explicit Context**           | Require all operational context to be explicitly defined rather than implicitly assumed or hidden in memory.                           |
| **Immutable Historical Trace** | Preserve historical execution context in permanent logs to maintain auditability across sessions.                                      |
| **Human Governance**           | Enforce that human decisions unconditionally supersede contextual execution state.                                                     |
| **Context Isolation**          | Isolate execution sessions to prevent cross-session state pollution or horizontal memory leaks.                                        |
| **Forward-Only Progression**   | Move execution context strictly forward across pipeline stages without backward state mutation.                                        |
| **Context Traceability**       | Ensure every execution session remains conceptually traceable from initiation through completion.                                      |
| **Context Completeness**       | Maintain sufficient conceptual context to support deterministic governance review, tracing, and auditing without hidden runtime state. |

### Context Completeness

Every execution session shall maintain sufficient conceptual context to support deterministic governance review, operational traceability, historical auditing, and reproducible analysis without relying on hidden runtime state.

---

## 4. Operational Scope

The Execution Context Specification establishes clear conceptual boundaries between execution context and other operational domain specifications:

### 4.1 Execution Context Responsibility Matrix

| Concern                          | Governing Specification              | Single Responsibility                                                              |
| :------------------------------- | :----------------------------------- | :--------------------------------------------------------------------------------- |
| **Execution Stages & Gates**     | [PIPELINE.md](PIPELINE.md)           | Defines the 6-stage linear pipeline, stage entry/exit criteria, and release gates. |
| **Workflow Patterns & Intent**   | [WORKFLOWS.md](WORKFLOWS.md)         | Catalogues 9 editorial intent patterns, selection matrices, and section rules.     |
| **Runtime Agents & Roles**       | [AGENT_INDEX.md](AGENT_INDEX.md)     | Registers runtime agents, single responsibilities, and runtime directory paths.    |
| **Artifact Contracts & Schemas** | [ARTIFACTS.md](ARTIFACTS.md)         | Defines artifact schemas, storage paths, state models, and mutability rules.       |
| **Operational Coordination**     | [ORCHESTRATION.md](ORCHESTRATION.md) | Coordinates workflow routing, agent selection, artifact handoffs, and human gates. |
| **Execution Context**            | **`EXECUTION_CONTEXT.md`**           | **Defines execution session boundaries, contextual metadata, and state tracing.**  |

> Execution context provides conceptual information boundaries for operational sessions but does not assume ownership of workflow logic, orchestration policies, runtime agent behavior, artifact contracts, or execution sequencing. Each referenced specification remains the single authoritative source for its respective domain.

---

## 5. Execution Context Model

The conceptual lifecycle of an execution context follows a 7-step progression from initial editorial request to archival:

```
Editorial Request
      │
      ▼
Execution Session
      │
      ▼
Workflow Context
      │
      ▼
Agent Context
      │
      ▼
Artifact References
      │
      ▼
Human Review Context
      │
      ▼
Execution Completion
```

### 5.1 Context State Model

The Context State Model defines the conceptual condition of an execution session at any point in its operational lifecycle:

| State             | Description                                                                                |
| :---------------- | :----------------------------------------------------------------------------------------- |
| **`Initialized`** | Session context created upon acceptance of an editorial intent request.                    |
| **`Active`**      | Execution context actively accompanying specialist agent routing and artifact handoffs.    |
| **`Waiting`**     | Execution context paused at a mandatory human approval gate or review checkpoint.          |
| **`Suspended`**   | Execution context suspended due to a validation failure, missing artifact, or manual hold. |
| **`Completed`**   | Execution context finalized following successful pipeline deployment and verification.     |
| **`Archived`**    | Historical execution context preserved in repository logs for audit traceability.          |

---

## 6. Context Components

Execution context conceptually comprises seven core information elements:

1. **Execution Identifier**: A unique conceptual handle identifying the specific execution session.
2. **Workflow Identifier**: The bound workflow pattern (e.g., Software Review, Comparison, Tutorial) governing content structure.
3. **Session Metadata**: Conceptual properties capturing session initialization time, target slug, category, and author.
4. **Artifact References**: Conceptual links to input and output artifacts associated with the execution session.
5. **Human Approval Status**: Conceptual records of human editorial sign-offs, gate authorizations, and manual overrides.
6. **Validation Status**: Conceptual indicator reflecting structural and quality compliance across stage handoffs.
7. **Execution Outcome**: Conceptual summary of session results (`Ready`, `Blocked`, or `Aborted`).

> **Architectural Boundary Note:** This section defines conceptual context elements only. It explicitly excludes machine-readable serialization schemas (JSON, YAML, XML) or software implementation structures.

---

## 7. Context Propagation

Context propagation describes how execution context conceptually accompanies execution across operational boundaries:

- **Stage Handoff Propagation**: As execution moves across pipeline stages defined in [PIPELINE.md](PIPELINE.md), the conceptual context expands to record newly generated artifact references and validation results.
- **Orchestration Alignment**: Context propagation aligns with coordination policies defined in [ORCHESTRATION.md](ORCHESTRATION.md), ensuring context updates reflect actual workflow progress.
- **Stateless Handoffs**: Context propagation is mediated entirely by persisted disk state, ensuring zero cross-session memory retention.

---

## 8. Context Isolation

LEOS enforces strict context isolation to maintain system stability and deterministic execution:

- **Independent Sessions**: Every execution session runs within an isolated conceptual context boundary. Concurrent or sequential sessions cannot inspect or mutate each other's context.
- **Zero Shared Mutable State**: Sessions share no global variables, in-memory buffers, or transient execution contexts.
- **Deterministic Auditing**: Isolated context boundaries guarantee that an execution session can be audited, reproduced, or analyzed independently.

---

## 9. Human Governance Context

Human authority remains the supreme governing force across all execution context operations:

> **Governance Principle:** Human decisions always supersede contextual execution state.

- **Approval Ownership**: Human editors hold exclusive ownership over gate approval states recorded within the execution context.
- **Review State Primacy**: When an execution context transitions to `Waiting`, automated progression halts unconditionally until a human editor records an approval decision.
- **Manual Override Authority**: Human editors may manually alter context state (e.g., suspending, aborting, or resuming a session) at any time.

---

## 10. Context Validation

Context validation conceptually evaluates whether an execution context is complete, consistent, and audit-compliant:

- **Completeness**: Verifies that all required conceptual context elements (identifiers, workflow bindings, artifact references) are present for the current stage.
- **Consistency**: Verifies that bound workflow patterns, agent roles, and artifact categories align with LEOS operational specifications.
- **Integrity**: Verifies that historical context traces have not been corrupted, altered, or retroactively mutated.

> **Boundary Note:** This section defines conceptual validation requirements only and explicitly excludes code algorithms or automated validation scripts.

---

## 11. Failure & Recovery Context

When an execution session encounters a failure, the execution context manages conceptual state recovery:

- **Interrupted Execution**: If execution is interrupted, the context transitions to `Suspended`, preserving all completed upstream artifact references.
- **Suspended Context**: The suspended context state isolates the point of failure, preventing invalid state propagation downstream.
- **Resumed Context**: Upon resolving the failure condition, execution resumes cleanly from the exact stage boundary recorded in the context.
- **Abandoned Execution**: If a failure is unrecoverable, the context transitions to `Archived` as an aborted session trace.

> **Governance Boundary:** Recovery always resumes from the most recent validated execution boundary and never bypasses mandatory human governance checkpoints, approval gates, or repository validation requirements.

---

## 12. Future Context Expansion

Future evolution of execution context capabilities (such as multi-session tracing, distributed context logging, or automated context analytics) must comply with strict governance rules:

### 12.1 Context Invariants

Regardless of future operational enhancements, the following eight architectural properties must remain permanently invariant:

1. **ADR-001 Compliance**: Strict boundary between runtime execution (`.agents/`) and documentation specifications (`LEOS/`).
2. **Stateless Execution**: Zero in-memory state retention across session or agent boundaries.
3. **Documentation Independence**: Context specifications remain human-readable documentation and never embed executable software code.
4. **Human Authority Supremacy**: Human decisions unconditionally override contextual state.
5. **Immutable History**: Historical execution context records remain immutable once archived.
6. **Forward-Only Progression**: Context state moves strictly forward without backward state mutation.
7. **Backward Compatibility**: New context capabilities must not invalidate existing frozen specifications.
8. **Context Determinism**: Equivalent execution contexts shall always produce conceptually consistent operational state regardless of runtime implementation details.

### 12.2 Execution Context Governance

> **Operational Boundary Rule:** `EXECUTION_CONTEXT.md` defines conceptual execution context policies only. It never defines runtime implementation code, never replaces orchestration (`ORCHESTRATION.md`), never replaces workflow contracts (`WORKFLOWS.md`), never replaces pipeline execution (`PIPELINE.md`), never replaces agent specifications (`AGENT_INDEX.md`), and never replaces artifact specifications (`ARTIFACTS.md`).

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

---

## 14. Version Information

| Property                   | Value                                                  |
| :------------------------- | :----------------------------------------------------- |
| **Document Title**         | LEOS Execution Context Specification                   |
| **Canonical File Path**    | `LEOS/operations/EXECUTION_CONTEXT.md`                 |
| **Specification Version**  | 2.0                                                    |
| **LEOS Framework Package** | Package 2 (Operational Intelligence & Agent Framework) |
| **Governance Standard**    | ADR-001 Compliant                                      |
| **Last Updated**           | 2026-08-06                                             |
| **Document Status**        | Authoritative / Frozen                                 |

> **Freeze Governance Note:** This specification is formally frozen under LEOS governance and becomes immutable following explicit human approval, successful technical validation, Git commit, Git push, final repository verification, and formal freeze authorization.

---

## 15. Enterprise Governance Footer

```
===================================================================================
LOCITRA EDITORIAL OPERATING SYSTEM (LEOS)
Package 2 – Operational Intelligence & Agent Framework
Document ID: LEOS-SPEC-CTX-2.0 | Canonical Path: LEOS/operations/EXECUTION_CONTEXT.md
Governance: ADR-001 Compliant | Status: Authoritative / Frozen
===================================================================================
```
