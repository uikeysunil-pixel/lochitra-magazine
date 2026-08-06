# LEOS Execution Pipeline

## Purpose

The Locitra Editorial Operating System (LEOS) Execution Pipeline Specification defines the deterministic operational workflow, stage transitions, artifact contracts, validation gates, and release procedures governing content production across LEOS.

This document serves as the authoritative execution specification for LEOS. It explains **how** editorial work flows step-by-step through the system, ensuring that every published article undergoes rigorous research validation, structured content generation, multi-stage auditing, and fail-safe release verification.

## Pipeline Scope

This specification applies exclusively to operational workflow execution, stage contracts, artifact movement, and release gate procedures within LEOS.

- **In Scope:**
  - Sequential pipeline stage definitions and transition criteria.
  - Stage inputs, outputs, and actor contracts.
  - High-level artifact movement and filesystem persistence paths.
  - Validation gates and Three-Pass Release System procedures.
  - Failure handling, exception recovery, and stateless resumption rules.
  - Explicit human-in-the-loop control gates.

- **Out of Scope:**
  - System architecture, layer topology, and dependency hierarchy (governed by [architecture/ARCHITECTURE.md](../architecture/ARCHITECTURE.md)).
  - Foundational governance rules and constitutional oversight principles (governed by [core/LEOS.md](../core/LEOS.md)).
  - Repository navigation and directory index guides (governed by [README.md](../README.md)).
  - Practical onboarding recipes and developer quick-start guides (governed by [QUICK_START.md](QUICK_START.md)).

## Pipeline Principles

Execution within the LEOS pipeline is governed by six operational principles:

- **Deterministic Execution:** Workflow stages progress in a strict, linear sequence where each stage executes predictable operations triggered by defined filesystem state.
- **Stateless Handoffs:** Stages communicate exclusively through immutable markdown artifacts. The Workflow Orchestrator maintains zero in-memory state, relying on filesystem inspection to determine pipeline progression.
- **Read-Only Audit Isolation:** Diagnostic and auditing stages operate strictly in read-only mode, outputting analytical reports without mutating source content files.
- **Fail-Safe Gating:** Transition between stages requires 100% compliance with explicit validation gates. Missing dependencies or failing checks halt execution immediately.
- **Three-Pass Release System:** Final publishing verification operates in three distinct phases: Phase A (Read-Only Audit), Phase B (Explicit Safe Patching), and Phase C (Re-Verification Audit).
- **Human Control Gates:** State-modifying operations, patch applications, and release deployments require explicit human authorization.

## Pipeline State Model

The LEOS execution pipeline transitions through six conceptual execution states during its lifecycle:

- **Pending:** Stage initialized, awaiting required input artifact dependencies.
- **Running:** Stage actively executing stateless operations or processing tasks.
- **Blocked:** Stage execution halted due to missing artifacts or validation gate failures.
- **Awaiting Human Approval:** Execution paused pending explicit human editorial decision.
- **Completed:** Stage operations successfully finished with verified output artifacts.
- **Failed:** Unrecoverable error encountered requiring manual intervention.

These states represent runtime execution status only and must not be interpreted as repository filesystem states or architectural layer states.

## Pipeline Stages

Editorial production within LEOS progresses linearly through six operational stages:

```
+-----------------------------------------------------------------------------------+
| Stage 1: Intent & Cluster Target Definition                                       |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Stage 2: Factual Research & Validation                                            |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Stage 3: Structured Content Generation                                            |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Stage 4: Technical & SEO Intelligence Audit (Read-Only)                           |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Stage 5: Platinum Editorial Review (Read-Only)                                    |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| Stage 6: Deployment & Three-Pass Release Gate Verification                        |
+-----------------------------------------------------------------------------------+
```

### Stage 1: Intent & Cluster Target Definition

Establish editorial goals, publication category, primary keyword, and content cluster targets.

### Stage 2: Factual Research & Validation

Compile empirical data, benchmark comparisons, and verified facts into an immutable research foundation prior to drafting.

### Stage 3: Structured Content Generation

Transform pre-compiled research into a Platinum-standard MDX article adhering strictly to formatting and schema rules.

### Stage 4: Technical & SEO Intelligence Audit

Perform a read-only audit of keyword density, semantic heading structure, readability, and YAML metadata formatting.

### Stage 5: Platinum Editorial Review

Perform a read-only audit evaluating writing rhythm, tone of voice, E-E-A-T compliance, and commercial neutrality.

### Stage 6: Deployment & Three-Pass Release Gate Verification

Execute multi-pass verification of build integrity, asset existence, and patch resolution prior to publishing.

## Stage Contracts

Each pipeline stage operates under a strict input, output, and actor contract:

| Stage       | Responsible Actor           | Input Contract                         | Output Contract                                  |
| :---------- | :-------------------------- | :------------------------------------- | :----------------------------------------------- |
| **Stage 1** | Orchestrator / Human Editor | Topic Intent & Cluster Target          | Initialized Topic Target Specification           |
| **Stage 2** | Research Validation Agent   | Topic Target Specification             | Immutable `RESEARCH_REPORT.md`                   |
| **Stage 3** | Writing Agent               | `RESEARCH_REPORT.md` & Style Guide     | Draft Article (`data/blog/<slug>.mdx`)           |
| **Stage 4** | SEO Optimization Agent      | Draft Article (`data/blog/<slug>.mdx`) | `SEO_REPORT.md` & `SEO_PATCH.md`                 |
| **Stage 5** | Platinum Editor Agent       | Draft Article & `SEO_REPORT.md`        | `EDITORIAL_REPORT.md` & `EDITORIAL_PATCH.md`     |
| **Stage 6** | Publishing Agent            | Draft MDX, Reports, Assets             | Release Verification Report & Publication Status |

## Artifact Flow

Information and data transition through the pipeline as persistent filesystem artifacts stored in designated repository paths:

```
[Topic Target]
      │
      ▼
[knowledge/research/<cluster>/<slug>/RESEARCH_REPORT.md]
      │
      ▼
[data/blog/<slug>.mdx] ───► [public/static/images/blog/<slug>.webp]
      │
      ├───► [SEO_REPORT.md & SEO_PATCH.md]
      │
      └───► [EDITORIAL_REPORT.md & EDITORIAL_PATCH.md]
                  │
                  ▼
[Three-Pass Release Gate Verification]
                  │
                  ▼
[LEOS_CHANGELOG.md & Final Publication]
```

> **Artifact Ownership Note:** Artifacts are immutable outputs of completed pipeline stages and constitute the sole contract between execution stages.

### File Location Contracts

- **Research Artifacts:** `knowledge/research/<cluster>/<slug>/RESEARCH_REPORT.md`
- **Article MDX Content:** `data/blog/<slug>.mdx`
- **Featured Image Assets:** `public/static/images/blog/<slug>.webp`
- **Diagnostic Audit Reports:** `LEOS_CHANGELOG.md` and stage-specific patch reports.
- **Release Audit Logs:** `LEOS_CHANGELOG.md`

## Validation & Release Gates

To ensure fail-safe publication, the pipeline enforces four sequential validation gates:

### Gate 1: Research Gate

- `RESEARCH_REPORT.md` must exist in the specified knowledge path.
- Empirical source facts must be verified; zero placeholder or unverified assertions permitted.

### Gate 2: Content Generation Gate

- MDX file must compile clean with zero parsing errors.
- YAML frontmatter must strictly adhere to the Locitra frontmatter schema (single-quoted strings/arrays, exact field ordering).
- `<AffiliateDisclosure />` component must be placed immediately following the YAML frontmatter.
- Prohibited constructs (HTML comments `<!-- -->`, JSX comments `{/* */}`, manual TOCs, inline markdown images, `# H1` body tags) must be absent.

### Gate 3: Read-Only Audit Gate

- Stage 4 (SEO Audit) and Stage 5 (Editorial Audit) must complete and generate diagnostic reports.
- Safe patches are categorized separately from items requiring manual editorial review.

### Gate 4: Three-Pass Release Gate

Final release verification executes using a mandatory three-pass protocol:

1. **Phase A (Audit):** Read-only evaluation generates a comprehensive Release Report.
2. **Phase B (Safe Patch):** Approved safe patches (HIGH confidence frontmatter fields, formatting normalization) are applied with explicit authorization.
3. **Phase C (Verification):** Full re-audit executes. Publication is approved ONLY if:
   - Physical featured image asset (`public/static/images/blog/<slug>.webp`) exists on disk and measures exactly 1200x630 pixels.
   - All frontmatter metadata fields pass schema validation.
   - Project build parses clean with zero fatal MDX or TypeScript errors.

## Failure Handling

When a stage check or validation gate fails, the pipeline enforces deterministic exception handling:

- **Missing Upstream Artifact:** Execution halts immediately. Status is set to `BLOCKED`. The Workflow Orchestrator logs the missing file dependency and awaits stage re-execution.
- **Frontmatter or MDX Syntax Error:** Stage 6 release gate rejects deployment, outputting diagnostic line numbers to the verification log. Content returns to Stage 3 for correction.
- **Missing Featured Image Asset:** If the referenced `.webp` asset is absent from disk, the release gate unconditionally sets status to `BLOCKED`. Automated publishing cannot bypass missing assets.
- **High-Risk Quality Violation:** Auditing agents categorize high-risk flaws for manual human review. Pipeline progression pauses until explicit editorial resolution.
- **Stateless Resumption:** If execution is interrupted, the Orchestrator resumes at the last completed stage by inspecting filesystem artifacts rather than restarting the entire workflow.

## Human Control Gates

Automation assists execution, but human editorial authority remains supreme. The pipeline enforces four mandatory human control gates:

1. **Topic & Cluster Authorization:** Human editor authorizes initial topic selection and target keyword parameters prior to Stage 1.
2. **Apply Mode Authorization:** Transition from read-only audit (Phase A) to patch application (Phase B) requires explicit human authorization.
3. **Medium/Low Confidence Patch Review:** Any metadata patch classified with MEDIUM or LOW confidence requires explicit human editorial review before application.
4. **Final Release Gate Deployment:** Authorizing final git commit, production deployment, and article publication remains an exclusive human prerogative.

## Relationship to Other Documents

The LEOS documentation framework maintains strict domain boundaries across its core specifications:

- **[README.md](../README.md):** Central navigation gateway and subsystem overview.
- **[LEOS Constitution (core/LEOS.md)](../core/LEOS.md):** Supreme constitutional authority defining operating philosophy and oversight rules.
- **[Architecture Specification (architecture/ARCHITECTURE.md)](../architecture/ARCHITECTURE.md):** Authoritative structural guide defining layer topology, subsystem boundaries, and dependency rules.
- **[Execution Pipeline (PIPELINE.md)](PIPELINE.md):** Authoritative operational guide defining execution flow, stage contracts, and release gates.
- **[Governance Guide (governance/CONTRIBUTING.md)](../governance/CONTRIBUTING.md):** Contribution rules and operational governance policies.
- **[Strategic Roadmap (management/ROADMAP.md)](../management/ROADMAP.md):** Evolution plan and strategic subsystem roadmap.
- **[Quick Start Guide (QUICK_START.md)](QUICK_START.md):** Practical onboarding guide for editors and developers.
- **[Workflows Specification (WORKFLOWS.md)](WORKFLOWS.md):** Operational workflow execution recipes and commands.

## Version Information

| Metadata Field      | Value                                 |
| :------------------ | :------------------------------------ |
| **Document Title**  | LEOS Execution Pipeline Specification |
| **Document Path**   | `LEOS/operations/PIPELINE.md`         |
| **Version**         | 2.0                                   |
| **Last Updated**    | 2026-08-05                            |
| **Current Package** | Package 2                             |
| **Document Status** | Authoritative                         |

---

**LEOS Execution Pipeline Specification**  
**Document:** PIPELINE.md | **Version:** 2.0 | **Status:** Authoritative  
_Maintained under the LEOS Governance Foundation._
