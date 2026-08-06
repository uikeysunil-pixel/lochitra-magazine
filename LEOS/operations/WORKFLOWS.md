# LEOS Workflow Catalog Specification

## Purpose

The Locitra Editorial Operating System (LEOS) Workflow Catalog Specification defines the supported workflow patterns, selection criteria, input/output contracts, and operational boundaries governing content creation across LEOS.

This document serves as the authoritative workflow catalog for LEOS. It explains **when** each specific workflow pattern should be selected and **what** each workflow is responsible for delivering, ensuring that editorial intent maps deterministically to specialized content structures without altering or redefining core execution pipeline mechanics.

## Workflow Scope

This specification applies exclusively to the classification, selection criteria, entry conditions, input/output contracts, and operational boundaries of supported LEOS workflows.

- **In Scope:**
  - Supported workflow definitions and intent classification rules.
  - Workflow selection matrix and decision tables.
  - Entry conditions, inputs, outputs, and completion criteria for each workflow.
  - Workflow operational boundaries and anti-patterns.

- **Out of Scope:**
  - Sequential execution pipeline stages and release gate mechanics (governed by [PIPELINE.md](PIPELINE.md)).
  - System architecture, layer topology, and dependency hierarchy (governed by [architecture/ARCHITECTURE.md](../architecture/ARCHITECTURE.md)).
  - Foundational philosophy and constitutional oversight principles (governed by [core/LEOS.md](../core/LEOS.md)).
  - Governance policies and change control rules (governed by [governance/CONTRIBUTING.md](../governance/CONTRIBUTING.md)).

## Workflow Principles

Execution across all LEOS workflows is governed by six operational principles:

- **Intent-Driven Execution:** Workflows are selected dynamically based on editorial intent and target search query patterns, mapping intent directly to specialized content layouts.
- **Workflow Isolation:** Each workflow pattern operates as a self-contained execution contract with clear functional perimeters, preventing cross-workflow logic leakage.
- **Standardized Outcomes:** Workflows produce predictable, structured MDX artifacts that strictly adhere to Locitra editorial schemas and E-E-A-T standards.
- **Reusable Processes:** All workflows execute through the standard linear pipeline stages defined in [PIPELINE.md](PIPELINE.md), reusing core agent capabilities without duplicating stage definitions.
- **Single Workflow Ownership:** A given content production task executes under exactly one primary workflow pattern from initiation to publication.
- **Workflow Exclusivity:** A content production task must execute under one primary workflow at a time. Workflow transitions require explicit completion of the active workflow or documented orchestration by a higher-level process.

## Workflow Lifecycle

Every LEOS workflow progresses through a standardized six-step operational lifecycle:

```
Intent Identified
       │
       ▼
Workflow Selected
       │
       ▼
Inputs Validated
       │
       ▼
Execution Delegated
       │
       ▼
Outputs Produced
       │
       ▼
Completion Verified
```

This lifecycle defines workflow selection, input validation, and output verification. It represents conceptual workflow progression only and does not replace, override, or duplicate the linear execution pipeline stages defined in [PIPELINE.md](PIPELINE.md).

## Workflow Catalog

LEOS supports nine specialized workflow patterns tailored to distinct publication intents:

### 1. Software Review Workflow

Deep commercial evaluation of a single software product or tool. Focuses on feature analysis, pricing transparency, real-world testing benchmarks, and objective E-E-A-T ratings.

### 2. Comparison Workflow

Head-to-head comparative analysis of two competing products (`Product A vs Product B`). Focuses on side-by-side benchmark matrices, feature breakdowns, and clear winner declarations.

### 3. Tutorial / How-To Workflow

Actionable instructional guide resolving a specific technical problem (`How to [Action]`). Focuses on step-by-step clarity, code/UI snippets, security warnings, and `HowTo` schema markup.

### 4. Pillar / Hub Article Workflow

Comprehensive, authoritative hub centerpiece (`Best [Category]`) covering an entire product category. Focuses on topical authority, exhaustive sub-topic coverage, and cluster internal link routing.

### 5. Pricing Guide Workflow

Targeted commercial breakdown (`[Product] Pricing`) analyzing plan tiers, add-on costs, enterprise licensing, and ROI value propositions.

### 6. Alternatives Guide Workflow

Competitive replacement guide (`[Product] Alternatives`) evaluating top alternative tools, migration considerations, and key trade-offs.

### 7. Roundup Article Workflow

Curated category compilation (`Top 10 [Category]`) providing quick-verdict summaries and comparative feature lists across multiple products.

### 8. Content Refresh Workflow

Targeted maintenance workflow auditing existing published articles to update metadata (`lastUpdated`), verify deprecated facts, patch outdated links, and refresh ratings.

### 9. Cluster Creation Workflow

Orchestrated multi-article workflow generating an entire topical cluster (one Pillar Hub article plus associated supporting review and comparison articles).

## Workflow Selection Matrix

The Workflow Orchestrator and human editors select the appropriate workflow using the following decision matrix:

| Editorial Intent             | Trigger / Query Pattern      | Target Category      | Selected Workflow             |
| :--------------------------- | :--------------------------- | :------------------- | :---------------------------- |
| Single Product Deep-Dive     | `Review [Product]`           | Software Reviews     | Software Review Workflow      |
| Head-to-Head Evaluation      | `[Product A] vs [Product B]` | Comparisons          | Comparison Workflow           |
| Step-by-Step Action Guide    | `How to [Action]`            | Tutorials & Guides   | Tutorial / How-To Workflow    |
| Category Authority Hub       | `Best [Category]`            | Category Pillars     | Pillar / Hub Article Workflow |
| Commercial & Plan Analysis   | `[Product] Pricing`          | Pricing Guides       | Pricing Guide Workflow        |
| Competitor Replacements      | `[Product] Alternatives`     | Product Alternatives | Alternatives Guide Workflow   |
| Multi-Product Listicle       | `Top 10 [Category]`          | Roundups             | Roundup Article Workflow      |
| Existing Content Maintenance | `Refresh [Slug]`             | Content Maintenance  | Content Refresh Workflow      |
| Multi-Article Cluster Launch | `Create Cluster [Topic]`     | Cluster Strategy     | Cluster Creation Workflow     |

## Workflow Contracts

Each supported workflow operates under a strict contract defining its purpose, entry conditions, inputs, outputs, and completion criteria:

### 1. Software Review Workflow Contract

- **Purpose:** Provide an authoritative, commercially neutral review of a single software product.
- **Entry Conditions:** Single target product identified with confirmed factual research availability.
- **Inputs:** Target Product Name, Category Slug, `RESEARCH_REPORT.md`.
- **Outputs:** Structured Article MDX (`data/blog/<slug>.mdx`) containing Quick Verdict, Feature Breakdown, Pricing Table, Pros/Cons, FAQ, and `featuredImage`.
- **Completion Criteria:** Passes Final Release Gate defined in [PIPELINE.md](PIPELINE.md) with valid metadata, verified `.webp` asset, and clean build.

### 2. Comparison Workflow Contract

- **Purpose:** Compare two competing products to deliver a clear buying decision matrix.
- **Entry Conditions:** Two distinct, directly competing products identified.
- **Inputs:** Product A Name, Product B Name, `RESEARCH_REPORT.md` containing side-by-side benchmark data.
- **Outputs:** Comparison Article MDX containing Side-by-Side Table, Category Winners, Use Case Recommendations, and Related Links.
- **Completion Criteria:** Winner declarations established with empirical backing; passes Final Release Gate defined in [PIPELINE.md](PIPELINE.md).

### 3. Tutorial / How-To Workflow Contract

- **Purpose:** Deliver clear, step-by-step instructions to solve a specific technical task.
- **Entry Conditions:** Explicit technical action or problem statement defined.
- **Inputs:** Action Target, Prerequisites, Step-by-Step Verification Data, `RESEARCH_REPORT.md`.
- **Outputs:** Tutorial Article MDX featuring sequential H3 steps, code/UI callouts, Security Alerts, and FAQ.
- **Completion Criteria:** All steps verified for technical accuracy; passes Final Release Gate defined in [PIPELINE.md](PIPELINE.md).

### 4. Pillar / Hub Article Workflow Contract

- **Purpose:** Establish definitive topical authority for a broad software or digital business category.
- **Entry Conditions:** Broad category target defined with existing or planned sub-cluster articles.
- **Inputs:** Category Target, Cluster Architecture Map, `RESEARCH_REPORT.md`.
- **Outputs:** Comprehensive Hub Article MDX (3,000–5,000+ words) featuring Category Overview, Top Recommendations, Buyers Guide, and Internal Link Network.
- **Completion Criteria:** Links to all supporting cluster articles integrated; passes Final Release Gate defined in [PIPELINE.md](PIPELINE.md).

### 5. Pricing Guide Workflow Contract

- **Purpose:** Deconstruct software pricing models, hidden costs, and plan tier value.
- **Entry Conditions:** Product pricing tiers and commercial terms verified.
- **Inputs:** Product Name, Plan Tier Matrix, Enterprise Terms, `RESEARCH_REPORT.md`.
- **Outputs:** Pricing Guide Article MDX featuring Master Tier Table, Free vs Paid Breakdown, Hidden Fee Warnings, and Value Rating.
- **Completion Criteria:** Pricing data verified against official sources; passes Final Release Gate defined in [PIPELINE.md](PIPELINE.md).

### 6. Alternatives Guide Workflow Contract

- **Purpose:** Evaluate top alternative solutions for a popular software product.
- **Entry Conditions:** Target primary product and 3–5 viable alternative products identified.
- **Inputs:** Primary Product Name, Alternative Product List, `RESEARCH_REPORT.md`.
- **Outputs:** Alternatives Article MDX featuring Alternatives Overview Table, Per-Product Breakdown, Migration Tips, and Verdict.
- **Completion Criteria:** Each alternative evaluated against specific use cases; passes Final Release Gate defined in [PIPELINE.md](PIPELINE.md).

### 7. Roundup Article Workflow Contract

- **Purpose:** Provide a curated compilation of top software options in a specific niche.
- **Entry Conditions:** Niche category and 5–10 candidate products identified.
- **Inputs:** Category Name, Candidate Product List, `RESEARCH_REPORT.md`.
- **Outputs:** Roundup Article MDX featuring "Best For" Badges, Summary Cards, Comparison Matrix, and Buying Advice.
- **Completion Criteria:** Each candidate assigned a distinct recommendation scenario; passes Final Release Gate defined in [PIPELINE.md](PIPELINE.md).

### 8. Content Refresh Workflow Contract

- **Purpose:** Audit and update an existing published article to maintain accuracy and search relevance.
- **Entry Conditions:** Existing published article MDX identified for maintenance.
- **Inputs:** Target Article Slug, Audit Report, Updated Fact Dependencies.
- **Outputs:** Updated MDX with refreshed `lastUpdated` date, corrected facts, updated pricing/links, and diagnostic patch log.
- **Completion Criteria:** All outdated claims updated; passes Final Release Gate defined in [PIPELINE.md](PIPELINE.md) re-verification.

### 9. Cluster Creation Workflow Contract

- **Purpose:** End-to-end generation and linking of a complete topical content cluster.
- **Entry Conditions:** Cluster Topic and sub-topic taxonomy approved.
- **Inputs:** Topic Strategy, Cluster Map, Multi-Topic Research Dependency Bundle.
- **Outputs:** One Pillar Article MDX plus 3–7 Supporting Article MDXs with reciprocal internal links.
- **Completion Criteria:** Pillar and all supporting articles compile clean and pass Final Release Gate defined in [PIPELINE.md](PIPELINE.md).

## Workflow Boundaries

To maintain single-responsibility boundaries and architectural integrity, workflows must operate within strict perimeters:

| Workflow               | Owned Scope                                    | Prohibited Actions                                                          |
| :--------------------- | :--------------------------------------------- | :-------------------------------------------------------------------------- |
| **Software Review**    | Single-product deep evaluation.                | Must NOT evaluate multi-product roundups or skip pricing tables.            |
| **Comparison**         | Head-to-head 2-product comparison.             | Must NOT display commercial bias or omit side-by-side spec tables.          |
| **Tutorial / How-To**  | Actionable step-by-step problem solving.       | Must NOT include promotional marketing fluff or unstructured prose.         |
| **Pillar / Hub**       | Category-wide authority and link routing.      | Must NOT omit internal links to supporting cluster articles.                |
| **Pricing Guide**      | Tiered cost breakdown and value metrics.       | Must NOT cite unverified pricing or unofficial figures.                     |
| **Alternatives Guide** | Replacement analysis and migration trade-offs. | Must NOT recommend irrelevant tools outside the primary use case.           |
| **Roundup Article**    | Multi-option category compilation.             | Must NOT assign identical recommendation badges to competing tools.         |
| **Content Refresh**    | Updating existing published article MDX.       | Must NOT alter the canonical URL slug or break existing anchor links.       |
| **Cluster Creation**   | Multi-article cluster orchestration.           | Must NOT publish disconnected articles without reciprocal internal linking. |

## Relationship to Other Documents

The LEOS workflow specification interacts with other core specifications as follows:

- **[README.md](../README.md):** Central navigation gateway and subsystem homepage.
- **[LEOS Constitution (core/LEOS.md)](../core/LEOS.md):** Supreme constitutional authority defining operating philosophy and oversight rules.
- **[Architecture Specification (architecture/ARCHITECTURE.md)](../architecture/ARCHITECTURE.md):** Authoritative structural guide defining layer topology, subsystem boundaries, and dependency rules.
- **[Execution Pipeline (PIPELINE.md)](PIPELINE.md):** Authoritative operational guide defining linear execution flow, stage contracts, and release gates.
- **[Governance Guide (governance/CONTRIBUTING.md)](../governance/CONTRIBUTING.md):** Authoritative governance specification defining modification policies and standards.
- **[Strategic Roadmap (management/ROADMAP.md)](../management/ROADMAP.md):** Strategic evolution plan tracking long-term subsystem features.
- **[Quick Start Guide (QUICK_START.md)](QUICK_START.md):** Practical onboarding guide for editors and developers.

## Version Information

| Metadata Field      | Value                               |
| :------------------ | :---------------------------------- |
| **Document Title**  | LEOS Workflow Catalog Specification |
| **Document Path**   | `LEOS/operations/WORKFLOWS.md`      |
| **Version**         | 2.0                                 |
| **Last Updated**    | 2026-08-05                          |
| **Current Package** | Package 2                           |
| **Document Status** | Authoritative / Frozen              |

---

**LEOS Workflow Catalog Specification**  
**Document:** WORKFLOWS.md | **Version:** 2.0 | **Status:** Authoritative / Frozen  
_Maintained under the LEOS Governance Foundation._
