# LEOS: Locitra Editorial Operating System

Welcome to the **LEOS (Locitra Editorial Operating System)** repository.

LEOS is a highly structured, agentic AI editorial framework designed specifically to produce Platinum-quality, commercially neutral, and deeply researched content for the Locitra publication. It enforces rigorous boundaries across specialized AI agents to ensure every article meets strict E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) standards.

## Key Features

- **Strict Single-Responsibility Agents:** Dedicated components for Research, Writing, SEO, Editing, and Publishing.
- **Stateless Orchestration:** The Workflow Orchestrator routes tasks dynamically without absorbing sub-agent duties.
- **Immutable Research:** The Writing Agent depends entirely on a verified `RESEARCH_REPORT.md`, eliminating hallucinations.
- **Fail-Safe Release Pipeline:** Safe patching and explicit editorial reviews ensure no sub-par content reaches deployment.

## Architecture Overview

LEOS operates on a linear, highly controlled pipeline.
`Prompt → Orchestrator → Research → Writing → SEO → Editorial → Publishing → Git`
For full details, read the [Architecture Guide](architecture/ARCHITECTURE.md).

## Documentation Index

- [Official LEOS Manual](core/LEOS.md)
- [Architecture & Boundaries](architecture/ARCHITECTURE.md)
- [Agent Index](AGENT_INDEX.md)
- [Pipeline Execution](operations/PIPELINE.md)
- [Supported Workflows](operations/WORKFLOWS.md)
- [Artifact Lifecycle](ARTIFACTS.md)
- [Directory Structure](architecture/DIRECTORY_STRUCTURE.md)
- [Version History](management/VERSION_HISTORY.md)
- [Changelog](management/CHANGELOG.md)
- [Future Roadmap](management/ROADMAP.md)

## Quick Start

New to LEOS? Start with our [15-Minute Quick Start Guide](operations/QUICK_START.md) or learn how to contribute via the [Contributing Guidelines](governance/CONTRIBUTING.md).

## Deferred Documents

Some documents intentionally remain at the LEOS root until their long-term architectural ownership has been approved. For details and architectural justifications, see the [Deferred Document Register](management/DEFERRED_DOCUMENT_REGISTER.md).

## Current Version

**LEOS Core v1.0** (Production Ready)
