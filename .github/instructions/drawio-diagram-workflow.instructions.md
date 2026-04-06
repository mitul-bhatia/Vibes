---
description: "Use when creating, updating, validating, or packaging Mermaid UML/ERD/architecture diagrams for this repository."
applyTo: "diagrams/**"
---

# Mermaid Diagram Workflow Rules

## Scope

Applies to all files in diagrams/ and all tasks that generate diagram assets for PDF export.

## Mandatory Diagram Baseline

Every project baseline must support:

1. Class Diagram
2. Object Diagram
3. Use Case Diagram
4. Activity Diagram
5. Sequence Diagram

ERD is required when the project has persistent data models.

## Source of Truth

- diagrams/manifest.json defines required IDs and source file names.
- diagrams/PROJECT_CONTEXT.md defines system context and constraints.
- diagrams/src/\*.mmd are the canonical diagram sources.

## Generation Rules

- Use Mermaid syntax as the default for every diagram type.
- Encode depth through grouped subgraphs, role separation, and explicit relationship labels.
- Enforce alignment through deterministic flow direction and consistent node naming.
- Keep diagram IDs stable on updates.
- Load and follow these skills before generation:
  - .github/skills/mermaid-class-diagram/SKILL.md
  - .github/skills/mermaid-object-diagram/SKILL.md
  - .github/skills/mermaid-use-case-diagram/SKILL.md
  - .github/skills/mermaid-activity-diagram/SKILL.md
  - .github/skills/mermaid-sequence-diagram/SKILL.md
  - .github/skills/mermaid-diagram-quality/SKILL.md

## Packaging Rules

- Validate manifest before export.
- Require preflight checks before any export: `npm run diagrams:preflight`.
- Export Mermaid source files to per-diagram PDFs and one merged PDF book.
- Write build metadata to diagrams/out/diagram-build-report.json.
- Require `npm run diagrams:quality` to pass before book export.

## Mandatory Fail-Fast Conditions

- Abort export if any required diagram fails type-specific preflight checks.
- Abort export if placeholder tokens are present in required diagram sources.
- Abort export if preflight/quality commands fail.
