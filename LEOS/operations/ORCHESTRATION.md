# LEOS Orchestration Specification

This document serves as the authoritative, permanent specification governing orchestration intelligence within the Locitra Editorial Operating System (LEOS). It defines how runtime workflows, specialist agents, filesystem artifacts, human approvals, failure routing, and execution decisions are coordinated across the system.

In compliance with **ADR-001 (Agent Architecture)**, this document belongs exclusively to the LEOS Operations Layer (`LEOS/operations/`). It defines human-readable operational coordination specifications and governance rules, and explicitly excludes executable prompts, code implementations, runtime scripts, or automated decision algorithms.

---

## 1. Title

**LEOS Orchestration Specification** (Package 2 – Operational Intelligence & Agent Framework)

---

## 2. Purpose

The purpose of this specification is to define orchestration as the operational coordination layer connecting workflow selection, specialist runtime agents, artifact handoffs, human approval gates, and release readiness checks into a deterministic execution stream.

This document answers the core operational question:

> **How does LEOS coordinate workflows, agents, artifacts, and human oversight during execution without violating component boundaries?**

It complements existing LEOS specifications without duplicating them. It governs operational routing while respecting the distinct responsibilities owned by other specifications across the Operations Layer.

> **Scope Statement:** This specification defines operational coordination policies and governance only. It does not define runtime implementations, execution stages, workflow contracts, runtime agent behavior, artifact schemas, repository automation, or executable logic.

---

## 3. Orchestration Philosophy

Orchestration in LEOS is governed by six fundamental architectural principles:

### Orchestration Principles Matrix

| Principle                          | Purpose                                                                                                                   |
| :--------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **Stateless Coordination**         | Orchestrate agent calls without holding in-memory state; infer progress exclusively from persistent filesystem artifacts. |
| **Deterministic Execution**        | Ensure identical input intent specifications produce identical, predictable agent routing and handoff sequences.          |
| **Single Orchestration Authority** | Maintain a single top-down coordinator (Workflow Orchestrator) to prevent horizontal inter-agent routing loops.           |
| **Explicit Handoffs**              | Require every agent invocation to be mediated by verified filesystem artifact boundaries.                                 |
| **Human Governance**               | Enforce mandatory human review checkpoints before state-modifying or publication operations occur.                        |
| **Failure Isolation**              | Isolate errors within individual stage boundaries to prevent unhandled cascading system failures.                         |

---

## 4. Operational Scope

The Orchestration Specification defines coordination rules across the system while respecting strict boundaries between system concerns.

### 4.1 Orchestration Responsibility Matrix

| Concern                          | Governing Specification          | Single Responsibility                                                                  |
| :------------------------------- | :------------------------------- | :------------------------------------------------------------------------------------- |
| **Execution Stages & Gates**     | [PIPELINE.md](PIPELINE.md)       | Defines the 6-stage linear pipeline, stage entry/exit criteria, and release gates.     |
| **Workflow Patterns & Intent**   | [WORKFLOWS.md](WORKFLOWS.md)     | Catalogues 9 editorial intent patterns, selection matrices, and section requirements.  |
| **Runtime Agents & Roles**       | [AGENT_INDEX.md](AGENT_INDEX.md) | Registers runtime agents, single responsibilities, and runtime directory paths.        |
| **Artifact Contracts & Schemas** | [ARTIFACTS.md](ARTIFACTS.md)     | Defines artifact schemas, storage paths, state models, and mutability rules.           |
| **Operational Coordination**     | **`ORCHESTRATION.md`**           | **Coordinates workflow routing, agent selection, artifact handoffs, and human gates.** |

> The Workflow Orchestrator coordinates interactions among existing operational components but does not assume ownership of their internal specifications. Each referenced document remains the single authoritative source for its own domain.

---

## 5. Orchestration Model

The high-level operational sequence managed by LEOS orchestration follows a deterministic 7-step coordination flow:

```
Editorial Intent
      │
      ▼
Workflow Selection
      │
      ▼
Input Validation
      │
      ▼
Agent Coordination
      │
      ▼
Artifact Verification
      │
      ▼
Human Review
      │
      ▼
Publishing Decision
```

### 5.1 Orchestration State Model

The Orchestration State Model defines the conceptual execution conditions managed by the orchestration layer during workflow coordination:

| State                          | Description                                                                                               |
| :----------------------------- | :-------------------------------------------------------------------------------------------------------- |
| **`Pending`**                  | Workflow request has been accepted, but prerequisite validation has not commenced.                        |
| **`Coordinating`**             | Workflow selection, specialist agent routing, and artifact handoffs are actively executing.               |
| **`Waiting for Human Review`** | Execution is paused at a mandatory human approval checkpoint pending editorial decision.                  |
| **`Blocked`**                  | Execution cannot continue due to validation errors, missing upstream artifacts, or governance violations. |
| **`Completed`**                | All pipeline stages, audit verifications, and release gates have completed successfully.                  |
| **`Aborted`**                  | Workflow terminated prior to completion due to manual override or unrecoverable error.                    |

---

## 6. Workflow Selection Intelligence

When an editorial request enters LEOS, orchestration intelligence evaluates the request intent to select the single matching workflow pattern catalogued in [WORKFLOWS.md](WORKFLOWS.md).

- **Intent Classification**: Evaluates editorial parameters (e.g., product review, software comparison, tutorial guide, pricing analysis) to identify the target workflow.
- **Workflow Determination**: Assigns exactly one workflow pattern from the 9 certified LEOS workflows to govern content structure.
- **Single Workflow Ownership**: Ensures a content item is bound to exactly one workflow pattern throughout its generation lifecycle.
- **Orchestration Boundaries**: The orchestrator selects the workflow but does not redefine workflow section requirements or intent contracts.

### 6.1 Orchestration Decision Model

The Orchestration Decision Model describes the conceptual decision hierarchy evaluated during workflow coordination:

```
1. Editorial Intent Evaluation (Identify topic & content type)
   │
   ▼
2. Workflow Selection (Map intent to single WORKFLOWS.md contract)
   │
   ▼
3. Prerequisite Validation (Confirm topic specification & domain rules)
   │
   ▼
4. Agent Coordination (Route to Research -> Writing -> SEO -> Editor -> Publishing)
   │
   ▼
5. Artifact Availability Verification (Confirm expected output artifact exists on disk)
   │
   ▼
6. Human Approval Check (Verify required human sign-offs at designated gates)
   │
   ▼
7. Execution Continuation (Advance to next stage or trigger release gate)
```

> **Boundary Note:** This decision sequence is a conceptual coordination hierarchy. It does **not** replace the execution pipeline defined in [PIPELINE.md](PIPELINE.md).

---

## 7. Agent Coordination Model

The Workflow Orchestrator coordinates specialist agents defined in [AGENT_INDEX.md](AGENT_INDEX.md) using top-down, stateless execution routing:

- **Sequential Invocation**: Triggers specialist agents in linear sequence (Research → Writing → SEO → Platinum Editor → Publishing).
- **No Direct Agent Communication**: Specialist agents operate independently. The orchestrator routes execution by inspecting artifact availability on the filesystem bus.
- **Top-Down Authority**: The orchestrator invokes specialist agents; specialist agents never call, inspect, or direct higher-level orchestrator state.

---

## 8. Artifact Coordination

Artifacts defined in [ARTIFACTS.md](ARTIFACTS.md) serve as the sole communication medium managed during orchestration:

- **Handoff Verification**: Before invoking a downstream specialist agent, orchestration verifies that the required upstream artifact exists in the designated directory and satisfies validation rules.
- **Immutable State Handoffs**: Upstream artifacts are treated as immutable state inputs for downstream agents.
- **Directory Path Routing**: Maps artifact handoffs to canonical repository paths (`knowledge/research/`, `data/blog/`, `knowledge/seo/`, `knowledge/editorial/`, `knowledge/publishing/`).

---

## 9. Human Decision Gates

LEOS orchestration mandates four explicit human decision checkpoints where automated execution must pause to await human editorial authorization:

> **Governance Principle:** The Workflow Orchestrator may coordinate execution but never overrides explicit human decisions.

1. **Research Approval Gate**: Human editor must review and approve `RESEARCH_REPORT.md` before structured drafting initializes.
2. **Patch Application Gate**: Human editor must review and authorize safe patches (`SEO_PATCH.md`, `EDITORIAL_PATCH.md`) before `APPLY MODE` mutations occur.
3. **Release Approval Gate**: Human editor must review audit scores (`SEO_REPORT.md`, `EDITORIAL_REPORT.md`) and grant publication sign-off.
4. **Manual Override Gate**: Human editor may manually pause, resume, abort, or override any automated orchestration step at any time.

---

## 10. Exception & Failure Handling

Orchestration failure handling is conceptually classified into three distinct failure domains:

### 1. Validation Failures

- **Triggers**: Missing required input artifacts, invalid frontmatter syntax, or repository quality rule violations (e.g., non-UTF-8 characters or CRLF line endings).
- **Orchestration Behavior**: State transitions to `Blocked`. Downstream agent invocation is halted. An analytical log entry is generated detailing the validation failure.

### 2. Operational Failures

- **Triggers**: Interrupted AI agent sessions, missing upstream outputs, or incomplete stage handoffs.
- **Orchestration Behavior**: State transitions to `Blocked`. Preserves all completed upstream artifacts on disk to enable clean, stateless retry.

### 3. Governance Failures

- **Triggers**: Missing human gate approvals, frozen document modification attempts, or unauthorized workflow selection.
- **Orchestration Behavior**: State transitions to `Waiting for Human Review` or `Blocked`. Execution cannot proceed until explicit human authorization is recorded.

---

## 11. Retry & Recovery Principles

When a failure occurs, LEOS orchestration applies five deterministic recovery principles:

1. **Stateless Recovery**: Because agents hold no in-memory state, recovery requires no process restoration. Execution resumes cleanly by re-invoking the failed agent against existing disk artifacts.
2. **Restart Points**: Execution restarts at the exact stage boundary where the failure occurred, eliminating redundant re-execution of verified upstream stages.
3. **Artifact Preservation**: Validated upstream artifacts (`RESEARCH_REPORT.md`, draft `.mdx`) are preserved on disk and never deleted during failure recovery.
4. **Audit Traceability**: Every failure, retry attempt, and manual override is recorded in system logs and changelogs (`LEOS_CHANGELOG.md`).
5. **Clean Termination**: Unrecoverable failures transition state to `Aborted`, ensuring the repository working tree remains clean and stable.

> **Governance Boundary:** Recovery resumes only from validated orchestration boundaries and never bypasses mandatory human approval gates or governance checkpoints.

---

## 12. Future Orchestration Expansion

To support future scalability (such as multi-cluster batch generation, automated content scheduling, distributed agent execution, or parallel audit workflows), future orchestration extensions must adhere to formal governance constraints:

### 12.1 Orchestration Invariants

Regardless of future orchestration enhancements, the following seven architectural properties must remain permanently invariant:

1. **ADR-001 Compliance**: Strict boundary between runtime execution (`.agents/`) and documentation specifications (`LEOS/`).
2. **Stateless Execution**: Zero in-memory state retention across agent or execution boundaries.
3. **Filesystem Bus**: Persistence of Markdown artifacts as the sole inter-agent communication channel.
4. **Human Authority Supremacy**: Human editorial decisions unconditionally override automated orchestration.
5. **Single Responsibility Principle**: Specialist agents own single operational domains; orchestrators own routing only.
6. **Forward-Only Coordination**: Unidirectional execution and artifact handoff flow without backward state mutation.
7. **Backward Compatibility**: New orchestration capabilities must not invalidate existing frozen workflow, pipeline, or artifact specifications.
8. **Documentation Independence**: Documentation specifications remain implementation-independent and shall never embed executable runtime behavior, prompts, automation logic, or implementation-specific code.

### 12.2 Orchestration Governance

> **Operational Boundary Rule:** `ORCHESTRATION.md` defines operational coordination policies only. It never defines runtime implementation code, never replaces workflow contracts (`WORKFLOWS.md`), never replaces pipeline execution (`PIPELINE.md`), never replaces agent specifications (`AGENT_INDEX.md`), and never replaces artifact specifications (`ARTIFACTS.md`).

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

---

## 14. Version Information

| Property                   | Value                                                  |
| :------------------------- | :----------------------------------------------------- |
| **Document Title**         | LEOS Orchestration Specification                       |
| **Canonical File Path**    | `LEOS/operations/ORCHESTRATION.md`                     |
| **Specification Version**  | 2.0                                                    |
| **LEOS Framework Package** | Package 2 (Operational Intelligence & Agent Framework) |
| **Governance Standard**    | ADR-001 Compliant                                      |
| **Last Updated**           | 2026-08-06                                             |
| **Document Status**        | Authoritative / Frozen                                 |

---

## 15. Enterprise Governance Footer

```
===================================================================================
LOCITRA EDITORIAL OPERATING SYSTEM (LEOS)
Package 2 – Operational Intelligence & Agent Framework
Document ID: LEOS-SPEC-ORCH-2.0 | Canonical Path: LEOS/operations/ORCHESTRATION.md
Governance: ADR-001 Compliant | Status: Authoritative / Frozen
===================================================================================
```
