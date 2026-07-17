# LEOS Official Operating Manual

## Executive Summary

The Locitra Editorial Operating System (LEOS) is a specialized AI framework designed to consistently produce Platinum-quality editorial content. By dividing the publishing process into strictly bound, single-responsibility AI agents, LEOS guarantees factual accuracy, commercial neutrality, and technical excellence.

## Vision & Mission

**Vision:** To build an autonomous editorial pipeline capable of competing with world-class human-led technology publications.
**Mission:** To enable Locitra to publish Platinum-quality content consistently across hundreds of articles and multiple commercial clusters by prioritizing reader value over raw word count.

## Design Philosophy & Core Principles

1. **Read-Only by Default:** Audit stages never modify project files automatically.
2. **Explicit Apply Mode:** Modifications require explicit approval and human-in-the-loop oversight.
3. **Single Responsibility:** No agent may perform the duties of another.
4. **Stability First:** Editorial quality always takes precedence over software novelty.

## Governance

All LEOS agents inherit global governance from `.agents/AGENTS.md`. The operational behavior, workflow coordination, and system architecture is defined by `LEOS/MASTER_PROMPT.md`. Global configuration and certified benchmarks are handled via `LEOS/CONFIG.md` and `LEOS/REFERENCE_IMPLEMENTATIONS.md`.

## Workflow & Architecture

The system is coordinated by the **Workflow Orchestrator**, which interprets user prompts and invokes the necessary specialists:

1. Research Validation Agent
2. Writing Agent
3. SEO Optimization Agent
4. Platinum Editor
5. Publishing Agent

For more, see [Architecture](ARCHITECTURE.md) and [Pipeline](PIPELINE.md).

## Knowledge Repository

LEOS relies on a centralized repository (`knowledge/`) containing subdirectories for research, seo, editorial, and publishing. This acts as the stateless memory for the Orchestrator. See [Directory Structure](DIRECTORY_STRUCTURE.md).

## Artifact Lifecycle

Every agent produces standardized markdown artifacts (e.g., `RESEARCH_REPORT.md`, `SEO_PATCH.md`). These artifacts dictate the data flow and act as the permanent record of the editorial decisions. See [Artifacts](ARTIFACTS.md).

## Release Process & Versioning

Articles only reach the release phase if all upstream artifacts exist and no fatal blockers are raised by the Platinum Editor or Publishing Agent.
LEOS adheres to semantic versioning for its own architecture.

## Frozen Components

As of v1.0, the Core Pipeline (Governance, Orchestrator, Research, Writing, SEO, Editorial, Publishing) is officially **FROZEN**. Minor maintenance updates are allowed, but major architectural redesigns require explicit approval.

## Future Evolution

Future development is restricted to the **LEOS Strategic Layer**, which will introduce the Master Architect, Analytics Agent, and Maintenance Agent. See the [Roadmap](ROADMAP.md).
