# Changelog

All notable changes to the LEOS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-16

### Added

- **Repository Hardening:** Added permanent Git line-ending normalization (`.gitattributes`). Prevents Contentlayer parsing failures caused by CRLF files.
- **Documentation Suite:** Complete 14-document architecture manual.
- **Workflow Orchestrator:** Added the Default Inference Engine (One Prompt Automation).
- **Publishing Agent:** Full release checklist and patch orchestration logic.
- **Platinum Editor:** Implemented read-only commercial neutrality and E-E-A-T auditing.
- **SEO Agent:** Implemented read-only schema and snippet optimization auditing.

### Changed

- The Writing Agent has been strictly disconnected from the Research Agent (Dependency Rule).
- All audits are now Read-Only by default (`DIRECTIVE 1`).
- Artifacts are now stored centrally in the `knowledge/` repository.

### Frozen

- Governance (`AGENTS.md`)
- Research Validation Agent (v1.2)
- Writing Agent (v1.1)
- Workflow Orchestrator (v1.0)
- LEOS Core (v1.0 is considered officially complete and production ready).
