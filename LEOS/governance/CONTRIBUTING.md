# Contributing to LEOS

To maintain the absolute highest standard of content and engineering, all contributors (human or AI) must adhere to these guidelines.

## 1. Agent Boundaries

Never update a `SKILL.md` to perform a task outside its core responsibility. The Writing Agent writes. The Research Agent researches. If you need a new capability that breaks these boundaries, propose a new agent for the Strategic Layer.

## 2. Editorial Standards (Definition of Platinum)

To pass the Platinum Editor, an article must:

- Sound authoritative, professional, and commercially neutral.
- Include no marketing fluff or filler.
- Answer user intent instantly (Quick Verdicts, At a Glance tables).
- Maintain E-E-A-T integrity.

## 3. Commit Message Rules

Follow standard conventional commits:

- `feat(content): publish proton-pass-review`
- `fix(seo): inject FAQPage schema to bitwarden`
- `docs(leos): update CONTRIBUTING.md`

## 4. Release Process

1. Complete LEOS pipeline execution.
2. Ensure `PUBLISHING_REPORT.md` exists.
3. Review `SEO_PATCH.md` and `EDITORIAL_PATCH.md`.
4. Run `npm run build` locally.
5. Push to GitHub to trigger Vercel deployment.

## 5. Branch Strategy

For major architectural overhauls, use a `feature/` branch. For content publication, committing directly to `main` is permitted provided the Publishing Agent has cleared the article as `READY AFTER SAFE PATCHES`.

## 6. Repository Standards

All text-based source files must use LF line endings. Developers should configure their editor accordingly.

## 7. Troubleshooting Line Endings

Contentlayer is highly sensitive to line endings and requires Unix LF format.

- **Why LF is required:** Windows CRLF line endings break Contentlayer's strict YAML frontmatter parser.
- **Symptoms of CRLF problems:** Build failures with `Unexpected scalar at node end` errors, and Contentlayer skipping documents ("Invalid markdown").
- **Standard recovery procedure:** If errors occur, verify files use LF. You can usually fix them by running `git add --renormalize .`. See [CHANGELOG.md](../management/CHANGELOG.md) for when this standard was implemented, and [DIRECTORY_STRUCTURE.md](../architecture/DIRECTORY_STRUCTURE.md) for where content lives.
