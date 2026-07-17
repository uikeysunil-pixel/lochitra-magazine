# LEOS Artifact Lifecycle

Artifacts are the standard currency of the LEOS system. Because agents cannot communicate directly, artifacts provide the necessary state and context.

## Research Artifacts

- **RESEARCH_REPORT.md:** Produced by the Research Agent. Consumed by the Writing Agent. Must be designated as `Approved` before writing can commence.
- **RESEARCH_INDEX.md:** A master list of all completed research inside the repository.

## Audit Artifacts

- **SEO_REPORT.md & EDITORIAL_REPORT.md:** Comprehensive scoring and analysis documents. For human review and documentation purposes.
- **SEO_PATCH.md & EDITORIAL_PATCH.md:** Actionable instruction files detailing precise, safe modifications required before publication. Consumed by the Publishing Agent (for classification) and Human Editors (for application).

## Publication Artifacts

- **PUBLISHING_REPORT.md:** Final operational verdict (Ready, Blocked, etc.).
- **RELEASE_NOTES.md:** Public-facing summary of the article's addition to the cluster.
- **GIT_RELEASE_CHECKLIST.md & DEPLOYMENT_CHECKLIST.md:** Procedural checklists for CI/CD and post-deployment smoke testing.

## System Artifacts

- **LOCITRA_CONTENT_INDEX.md:** The global project content map.
- **LEOS_CHANGELOG.md:** Documenting any automated modifications during explicit `APPLY MODE`.
