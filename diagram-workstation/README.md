# Mermaid Diagram Workstation

This workstation standardizes how you generate, update, and package professional Mermaid diagrams for any project.

## What You Get

- Copilot commands for diagram generation and updates:
  - /diagram-suite
  - /diagram-update
  - /diagram-pdf
- A manifest-driven diagram contract in diagrams/manifest.json
- A reusable project context file in diagrams/PROJECT_CONTEXT.md
- A PDF book pipeline that exports each Mermaid source and merges all PDFs into one final document

## Supported Diagram Types

- UML Class Diagram
- UML Object Diagram
- UML Use Case Diagram
- UML Activity Diagram
- UML Sequence Diagram
- ERD (optional but supported)
- Architecture and flow diagrams (optional)

## Standard Folder Layout

- diagrams/PROJECT_CONTEXT.md
- diagrams/manifest.json
- diagrams/src/\*.mmd
- diagrams/out/pdf/\*.pdf
- diagrams/out/diagram-book.pdf
- scripts/diagrams/\*.mjs

## Workflow

1. Fill diagrams/PROJECT_CONTEXT.md for the target project.
2. Update diagrams/manifest.json if you need to add or remove diagram IDs.
3. Run npm run diagrams:bootstrap to create starter Mermaid sources for missing files.
4. Run /diagram-suite in Copilot Chat to generate or refresh required diagram sources.
5. Ask for /diagram-update whenever business logic changes.
6. Run npm run diagrams:preflight to enforce fail-fast type checks.
7. Run npm run diagrams:book to produce the final PDF package.

## Skill Packs

Use these project skills to enforce professional diagram quality:

- .github/skills/mermaid-class-diagram/SKILL.md
- .github/skills/mermaid-object-diagram/SKILL.md
- .github/skills/mermaid-use-case-diagram/SKILL.md
- .github/skills/mermaid-activity-diagram/SKILL.md
- .github/skills/mermaid-sequence-diagram/SKILL.md
- .github/skills/mermaid-erd-diagram/SKILL.md
- .github/skills/mermaid-diagram-quality/SKILL.md

## Update Policy

- Keep diagram IDs and file names stable for incremental updates.
- If a diagram is renamed, update diagrams/manifest.json in the same change.
- Preserve existing Mermaid structural identifiers and naming whenever possible to keep updates stable.
