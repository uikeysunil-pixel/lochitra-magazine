# Architectural Decision Record 001 (ADR-001): Agent Runtime vs. Documentation Boundary

## Decision Summary

LEOS permanently separates the **Runtime Layer** (`.agents/`) from the **Documentation Layer** (`LEOS/`). These two layers serve complementary but architecturally distinct purposes. Neither layer may absorb, duplicate, or implement the responsibilities of the other. This decision is permanent and applies to every future LEOS package.

---

## Background

Prior to Package 2, a pre-implementation architectural review examined the full LEOS repository to establish a permanent responsibility boundary between the runtime AI implementation layer and the LEOS documentation layer.

The review covered:

- `.agents/AGENTS.md` — runtime governance bootstrap
- `.agents/skills/` — executable skill implementations (Workflow Orchestrator, Writing Agent, Research Validation Agent, SEO Optimization Agent, Platinum Editor Agent, Publishing Agent)
- `LEOS/operations/AGENT_INDEX.md` — documentation catalogue of agents
- `LEOS/architecture/ARCHITECTURE.md` — structural topology and layer hierarchy
- `LEOS/core/LEOS.md` — constitutional authority
- `LEOS/operations/WORKFLOWS.md` — workflow-to-intent documentation mapping
- `LEOS/operations/PIPELINE.md` — stage-to-agent execution sequence documentation

**Review Findings:**

- No blocking conflicts were found between any document or implementation layer.
- No ownership disputes exist across any system component.
- Intentional reinforcement (the same principle appearing in both a constitutional document and a runtime bootstrap) was confirmed as architecturally acceptable defense-in-depth, not duplication.
- The current architecture is approved.

This ADR permanently records the boundary established by that review.

---

## Architectural Decision

LEOS adopts the following permanent architectural decision:

> **`.agents/` is the Runtime Implementation Layer.**
> **`LEOS/` is the Documentation Layer.**

These are two complementary halves of the same system. They serve different audiences, operate at different layers of the architectural hierarchy, and must never merge their responsibilities.

This decision was created during Package 1 and takes effect beginning Package 2. It applies unconditionally to all future packages, extensions, and architectural revisions.

---

## Responsibility Boundary

### Runtime Layer — `.agents/`

The `.agents/` directory owns all executable, runtime-loaded content. No documentation artifact from the `LEOS/` layer may replace, override, or duplicate content that belongs here.

| Responsibility            | Description                                                             |
| :------------------------ | :---------------------------------------------------------------------- |
| **Runtime Bootstrap**     | `AGENTS.md` — IDE-injected governance rules active in every AI session  |
| **Skill Implementations** | `SKILL.md` files — executable prompt instructions loaded per-agent      |
| **Executable Behavior**   | Agent constraints, forbidden actions, inference logic, failure handling |
| **Skill Discovery**       | YAML frontmatter enabling automatic IDE skill registration              |

### Documentation Layer — `LEOS/`

The `LEOS/` directory owns all human-readable specifications, catalogues, architectural definitions, governance policies, and operational guides. No runtime implementation belongs here.

| Responsibility     | Description                                                         |
| :----------------- | :------------------------------------------------------------------ |
| **Documentation**  | All human-readable specifications and guides                        |
| **Architecture**   | Structural topology, layer hierarchy, dependency rules              |
| **Governance**     | Change control policies, freeze protocols, contribution standards   |
| **Workflows**      | Workflow-to-intent mapping and selection contracts                  |
| **Pipeline**       | Stage-to-agent execution sequence documentation                     |
| **Catalogues**     | `operations/AGENT_INDEX.md` — documentation catalogue of all agents |
| **Specifications** | Constitutional authority, operational standards, management ledgers |

---

## Layer Ownership Matrix

| Component                   | Location                            | Layer              | Owner              | Single Responsibility                                                         |
| :-------------------------- | :---------------------------------- | :----------------- | :----------------- | :---------------------------------------------------------------------------- |
| **Runtime Bootstrap**       | `.agents/AGENTS.md`                 | Governance Layer   | Runtime System     | Inject editorial governance rules into every AI session                       |
| **Skill Library**           | `.agents/skills/<agent>/SKILL.md`   | Execution Layer    | Runtime System     | Executable agent implementation — instructions, constraints, behavior         |
| **Documentation Catalogue** | `LEOS/operations/AGENT_INDEX.md`    | Operations Layer   | LEOS Documentation | Human-readable catalogue of agent names, versions, I/O, and runtime locations |
| **Workflow Mapping**        | `LEOS/operations/WORKFLOWS.md`      | Operations Layer   | LEOS Documentation | Document workflow-to-intent selection contracts                               |
| **Pipeline Mapping**        | `LEOS/operations/PIPELINE.md`       | Operations Layer   | LEOS Documentation | Document stage-to-agent execution sequence and release gates                  |
| **Architecture**            | `LEOS/architecture/ARCHITECTURE.md` | Architecture Layer | LEOS Documentation | Define structural topology, boundaries, and dependency rules                  |
| **Governance**              | `LEOS/governance/CONTRIBUTING.md`   | Governance Layer   | LEOS Documentation | Define change control policies and freeze protocols                           |
| **Constitution**            | `LEOS/core/LEOS.md`                 | Core Layer         | LEOS Documentation | Supreme constitutional authority governing all LEOS operations                |

---

## Approved Dependency Model

Dependencies within LEOS flow strictly top-down. No upward dependencies, no horizontal coupling, no circular references.

```
LEOS Constitution (core/LEOS.md)
          ↓
    Architecture (architecture/ARCHITECTURE.md)
          ↓
    Operations (operations/PIPELINE.md + WORKFLOWS.md)
          ↓
    Documentation Catalogue (operations/AGENT_INDEX.md)
          ↓
    Runtime Bootstrap (.agents/AGENTS.md)
          ↓
    Runtime Skills (.agents/skills/<agent>/SKILL.md)
```

**Dependency Rules:**

- Higher layers may reference, constrain, and direct lower layers.
- Lower layers derive authority and configuration from higher layers.
- Runtime skills must never reference or modify LEOS documentation artifacts.
- Documentation must describe runtime behavior; it must never implement it.
- `LEOS/operations/AGENT_INDEX.md` is a documentation artifact; it reads from but does not direct skill implementations.

---

## Design Rationale

### Single Source of Truth

Every agent's executable behavior lives in exactly one place: its `SKILL.md` file in `.agents/skills/`. Every agent's documentary description lives in exactly one place: its entry in `LEOS/operations/AGENT_INDEX.md`. This prevents the documentation and implementation from diverging into conflicting versions of the same truth.

### Separation of Concerns

Runtime files are optimized for machine execution — they are loaded by the IDE, injected into AI sessions, and must be structured for agent consumption. Documentation files are optimized for human readability — they must be navigable, versioned, and maintained under formal governance. Mixing these concerns produces systems that serve neither audience well.

### Documentation Describes; Implementation Executes

A documentation file that contains executable instructions becomes a de facto implementation artifact and loses its documentary purpose. An implementation file that contains human governance narrative becomes bloated and difficult to maintain. The boundary enforced by this ADR ensures each artifact serves its intended function without contaminating the other.

### Enterprise Maintainability

Separating runtime from documentation enables independent evolution. Runtime skills can be updated to address agent behavior issues without triggering LEOS documentation governance processes. Documentation specifications can be revised and versioned without risking unintended changes to live agent behavior. This independence is essential for a system expected to scale to hundreds of articles and multiple commercial clusters.

### Future Scalability

As LEOS grows to Package 10 and beyond, the number of agents, workflows, and editorial patterns will increase significantly. A clear runtime-documentation boundary ensures that this growth does not produce architectural debt — each new agent produces one implementation artifact (in `.agents/`) and one documentation entry (in `LEOS/operations/AGENT_INDEX.md`), never more.

---

## Future Guidance

Every future LEOS package must adhere to the following rules derived from this decision:

1. **No runtime prompts in documentation.** Future packages must never place executable skill instructions inside any `LEOS/` document. LEOS documentation may describe what an agent does, but must never contain the instructions the agent executes.

2. **No governance documents in `.agents/`.** `.agents/` must not accumulate human-readable governance specifications. `AGENTS.md` is the sole governance artifact in `.agents/`, and its purpose is runtime injection only.

3. **Documentation catalogues are summaries, not implementations.** `LEOS/operations/AGENT_INDEX.md` entries must remain summary-level. If a future package is tempted to add prompt instructions to `LEOS/operations/AGENT_INDEX.md`, those instructions belong in a `SKILL.md` file instead.

4. **One agent, two artifacts.** Every new agent added to LEOS produces exactly two artifacts: a `SKILL.md` in `.agents/skills/<agent>/` and a catalogue entry in `LEOS/operations/AGENT_INDEX.md`. No more, no less.

5. **Cross-layer references are permitted; cross-layer implementation is not.** Documentation may link to the runtime layer. Documentation may describe the runtime layer. Documentation must never duplicate or implement the runtime layer.

6. **Runtime implementations may evolve independently.** Future runtime implementations may evolve independently provided they continue to satisfy the architectural responsibilities defined by this ADR. Evolution of skill internals does not require documentation layer changes, as long as the agent's single responsibility, I/O contract, and layer placement remain consistent with this decision.

---

## Related Documents

| Document                                                              | Path                                        | Relationship to This ADR                                                                                                                                                                                                                                                                        |
| :-------------------------------------------------------------------- | :------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[README.md](../README.md)**                                         | `LEOS/README.md`                            | Subsystem navigation gateway; references both layers                                                                                                                                                                                                                                            |
| **[LEOS Constitution](../core/LEOS.md)**                              | `LEOS/core/LEOS.md`                         | Supreme constitutional authority; this ADR derives from constitutional principles                                                                                                                                                                                                               |
| **[Architecture Specification](ARCHITECTURE.md)**                     | `LEOS/architecture/ARCHITECTURE.md`         | Primary structural specification; this ADR supplements `ARCHITECTURE.md` with an explicit runtime boundary decision. It does NOT replace `ARCHITECTURE.md`. Architecture remains the authoritative structural specification; ADR-001 records a permanent design decision within that structure. |
| **[Execution Pipeline](../operations/PIPELINE.md)**                   | `LEOS/operations/PIPELINE.md`               | Documents stage-to-agent mapping; implementation lives in skills                                                                                                                                                                                                                                |
| **[Workflow Catalog](../operations/WORKFLOWS.md)**                    | `LEOS/operations/WORKFLOWS.md`              | Documents workflow-to-intent mapping; selection logic lives in Orchestrator skill                                                                                                                                                                                                               |
| **[Agent Index](../operations/AGENT_INDEX.md)**                       | `LEOS/operations/AGENT_INDEX.md`            | Documentation catalogue; the primary LEOS artifact that cross-references runtime skills                                                                                                                                                                                                         |
| **[AGENTS.md](../../.agents/AGENTS.md)**                              | `.agents/AGENTS.md`                         | Runtime bootstrap; the primary runtime artifact that enforces governance rules                                                                                                                                                                                                                  |
| **[Master Package Roadmap](../management/MASTER_PACKAGE_ROADMAP.md)** | `LEOS/management/MASTER_PACKAGE_ROADMAP.md` | Governs the package sequence in which this ADR's rules will be operationalized                                                                                                                                                                                                                  |

---

## Decision Status

| Field              | Value                                                            |
| :----------------- | :--------------------------------------------------------------- |
| **Decision**       | Approved                                                         |
| **Effective From** | Package 2                                                        |
| **Supersedes**     | None                                                             |
| **Decision Type**  | Permanent Architectural Decision                                 |
| **Review Trigger** | Major architectural revision requiring Governance Board approval |

---

## Version Information

| Metadata Field      | Value                                             |
| :------------------ | :------------------------------------------------ |
| **Document Title**  | ADR-001: Agent Runtime vs. Documentation Boundary |
| **Document Path**   | `LEOS/architecture/ADR_001_AGENT_ARCHITECTURE.md` |
| **Version**         | 1.0.0                                             |
| **Last Updated**    | 2026-08-06                                        |
| **Package Created** | Package 1                                         |
| **Effective**       | Package 2                                         |
| **Document Status** | Authoritative                                     |

---

**Architectural Decision Record (ADR-001)**
**Document:** ADR*001_AGENT_ARCHITECTURE.md | **Version:** 1.0.0 | **Status:** Authoritative
\_Maintained under the LEOS Governance Foundation.*
