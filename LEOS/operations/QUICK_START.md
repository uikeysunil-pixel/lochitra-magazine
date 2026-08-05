# LEOS Quick Start Guide

Welcome to the Locitra Editorial Operating System (LEOS). This 15-minute guide will get you up and running.

## Prerequisites

- Familiarity with Markdown and YAML Frontmatter.
- Understanding of the Locitra Platinum Standard (see `.agents/AGENTS.md`).

## The LEOS Workflow

Because LEOS v1.0 features **One-Prompt Automation** via the Workflow Orchestrator, running the system is incredibly simple.

1. **Trigger the Orchestrator**
   Simply tell the Orchestrator what you want:
   _`"Create Keeper Security Review (2026)"`_

2. **Automatic Execution**
   The Orchestrator will infer the article type, cluster, and required workflow, and will automatically invoke:
   - `Research Agent` -> Generates `RESEARCH_REPORT.md`
   - `Writing Agent` -> Generates `[slug].mdx`
   - `SEO Agent` -> Generates `SEO_PATCH.md`
   - `Platinum Editor` -> Generates `EDITORIAL_PATCH.md`
   - `Publishing Agent` -> Generates `DEPLOYMENT_CHECKLIST.md`

3. **Human Review**
   Review the generated `PATCH` files in the `knowledge/` directory.

4. **Apply Patches (APPLY MODE)**
   Instruct the system to apply the approved patches:
   _`"Apply the SAFE patches for Keeper Security"`_

5. **Deploy**
   Follow the `DEPLOYMENT_CHECKLIST.md` and push your changes to Git.

## Repository Layout

- **Code/Rules:** `.agents/` (Governance)
- **Configuration/Execution:** `LEOS/` (Config, Master Prompt, Benchmarks)
- **Output Data:** `data/blog/`
- **Memory/Reports:** `knowledge/`

## Best Practices

- **Do not manually edit `AGENTS.md`:** Governance changes require an Implementation Order.
- **Do not merge without reviewing patches:** The Publishing Agent will mark the article as "READY AFTER SAFE PATCHES" if audits found missing elements (e.g., Schema).
