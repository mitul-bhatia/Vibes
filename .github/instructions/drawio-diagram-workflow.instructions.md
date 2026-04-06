---
description: "Use when creating, updating, validating, or packaging draw.io UML/ERD/architecture diagrams for this repository."
applyTo: "diagrams/**"
---

# Draw.io Diagram Workflow Rules

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

## Generation Rules

- Prefer draw.io MCP tool calls over text-only output.
- Use XML for UML/ERD/architecture complexity.
- Use Mermaid for sequence interactions when concise.
- Keep diagram IDs stable on updates.

## Packaging Rules

- Validate manifest before export.
- Export per-diagram PDFs and one merged PDF book.
- Write build metadata to diagrams/out/diagram-build-report.json.
