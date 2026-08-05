# LEOS: Editorial Operating Manual

## Purpose

The Locitra Editorial Operating System (LEOS) is the constitutional operating framework governing content production, quality evaluation, and publishing workflows across the Locitra publication ecosystem. LEOS establishes the operational boundaries, core principles, decision hierarchies, and human-AI collaboration models required to deliver Platinum-quality editorial content with total consistency and technical integrity.

## Vision

To build a world-class, autonomous editorial operating subsystem capable of producing authoritative technology and digital business publications that compete with leading human-led industry journals.

## Mission

To enable Locitra to consistently publish Platinum-quality, deeply researched, and commercially neutral content across hundreds of articles and commercial clusters by prioritizing reader value, factual rigor, and E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) standards over raw publication volume.

## Constitutional Scope

This manual serves as the supreme constitutional document governing all editorial operations within LEOS. It defines the core authority, operating philosophy, decision hierarchy, and high-level governance model of the Editorial Operating System. Low-level technical specifications, execution pipelines, contribution workflows, and directory structures are intentionally delegated to specialized Architecture, Pipeline, Governance, and Operations documents.

## Operating Philosophy

LEOS operates under five foundational philosophical tenets:

- **Quality Over Quantity:** Editorial performance is measured by information density, technical accuracy, and reader value rather than arbitrary word counts or output velocity.
- **Evidence Before Opinion:** Every technical assertion, benchmark rating, and product comparison must originate from verified empirical evidence compiled prior to content generation.
- **Editorial Integrity:** Commercial neutrality, objective evaluation, and strict E-E-A-T standards are non-negotiable across all publication categories.
- **Human Oversight:** Automation assists and accelerates editorial workflows, but final publishing authority and state-changing file modifications remain strictly under human control.
- **Automation with Accountability:** AI agents execute within bounded, single-responsibility domains where every stage produces transparent, auditable markdown artifacts.

## Core Principles

LEOS governance inherits four constitutional principles that dictate all system behavior:

- **Read-Only by Default:** Audit, evaluation, and quality review stages execute exclusively in read-only mode, generating analytical reports without mutating repository files.
- **Explicit Apply Mode:** State modifications, file updates, and patch applications require explicit editorial authorization and multi-pass verification.
- **Single Responsibility:** Every agent owns exactly one domain (Research, Writing, SEO, Editorial Review, Publishing). No component may absorb the duties of another.
- **Stability First:** System reliability, publication safety, and editorial quality permanently take precedence over software novelty or experimental features.

## Editorial Operating Model

The editorial lifecycle within LEOS progresses conceptually through six distinct operational phases:

1. **Intent & Topic Definition:** High-level editorial goals and cluster targets are established.
2. **Factual Research & Validation:** Independent research compilation produces an immutable foundation of verified empirical data.
3. **Structured Content Generation:** Factual research is transformed into Platinum-standard MDX article content.
4. **Technical & SEO Intelligence Audit:** Content undergoes automated keyword optimization, structure audits, and metadata verification.
5. **Platinum Editorial Review:** Multi-dimensional quality inspection evaluates writing rhythm, tone, readability, and editorial compliance.
6. **Fail-Safe Release Verification:** Final build integrity, asset existence, and technical compliance are verified prior to deployment.

## AI Editorial Model

LEOS implements a multi-agent AI architecture based on stateless execution and strict domain separation:

- **Specialized AI Agents:** Autonomous agents execute dedicated roles (Research Validation, Writing, SEO Optimization, Platinum Editor, Publishing).
- **Stateless Orchestration:** The Workflow Orchestrator acts purely as a stateless coordinator, routing artifacts and task contexts without retaining persistent state or performing specialist work.
- **Bounded Responsibilities:** Agents operate strictly within pre-defined functional perimeters, preventing domain spillover and unintended system modifications.
- **Immutable Research Dependencies:** Content generation depends entirely on pre-compiled factual research artifacts, eliminating hallucinations and unverified claims.

## Human Oversight Model

Human editorial judgment represents the supreme authority within the LEOS operational model:

- **Approval Responsibilities:** Humans hold exclusive authority to approve transition into Apply Mode, authorize release gate deployment, and accept metadata patches.
- **Review & Validation Responsibilities:** Human editors review lower-confidence AI recommendations, evaluate edge cases, and inspect audit reports.
- **Final Authority:** In any conflict between automated recommendations and human editorial expertise, human judgment prevails unconditionally.

## Decision Hierarchy

Operational and editorial decisions within LEOS strictly follow a seven-tier decision flow:

```
Human Editorial Authority
 ↓
LEOS Constitution
 ↓
Repository Governance
 ↓
System Architecture
 ↓
Operational Pipelines
 ↓
AI Agents
 ↓
Generated Editorial Artifacts
```

## Constitutional Relationships

All downstream LEOS documentation and operational specifications derive their authority and functional responsibilities from this constitutional manual:

- **[README](../README.md):** Subsystem entry point, homepage, and navigation hub for orientation.
- **[Architecture](../architecture/ARCHITECTURE.md):** Subsystem boundaries, module structures, and component interaction rules.
- **[Pipeline](../operations/PIPELINE.md):** Detailed technical specification of linear execution pipelines and release gates.
- **[Governance](../governance/CONTRIBUTING.md):** Operational rules, developer contribution standards, and modification policies.
- **[Roadmap](../management/ROADMAP.md):** Strategic evolution plan and future subsystem feature pipeline.
- **[Quick Start](../operations/QUICK_START.md):** Practical 15-minute onboarding guide for editors and developers.
- **[Version History](../management/VERSION_HISTORY.md):** Formal release history and semantic version tracking log.
- **[Change Log](../management/CHANGELOG.md):** Historical record of structural modifications and patch releases.

## Version Information

| Metadata Field      | Value               |
| :------------------ | :------------------ |
| **Current Version** | 1.0.1               |
| **Last Updated**    | 2026-08-05          |
| **Document Path**   | `LEOS/core/LEOS.md` |
| **Current Package** | Package 1           |
| **Document Status** | Authoritative       |

---

**LEOS Constitution**  
**Document:** LEOS.md | **Version:** 1.0.1 | **Status:** Authoritative  
_Maintained under the LEOS Governance Foundation._
