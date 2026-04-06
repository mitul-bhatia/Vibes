# Draw.io Diagram Workstation

This workstation standardizes how you generate, update, and package professional diagrams for any project.

## What You Get

- Copilot commands for diagram generation and updates:
  - /diagram-suite
  - /diagram-update
  - /diagram-pdf
- A manifest-driven diagram contract in diagrams/manifest.json
- A reusable project context file in diagrams/PROJECT_CONTEXT.md
- A PDF book pipeline that exports each draw.io source and merges all PDFs into one final document

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
- diagrams/src/\*.drawio
- diagrams/out/pdf/\*.pdf
- diagrams/out/diagram-book.pdf
- scripts/diagrams/\*.mjs

## Workflow

1. Fill diagrams/PROJECT_CONTEXT.md for the target project.
2. Update diagrams/manifest.json if you need to add or remove diagram IDs.
3. Run /diagram-suite in Copilot Chat to generate or refresh required diagram sources.
4. Ask for /diagram-update whenever business logic changes.
5. Run npm run diagrams:book to produce the final PDF package.

## Update Policy

- Keep diagram IDs and file names stable for incremental updates.
- If a diagram is renamed, update diagrams/manifest.json in the same change.
- Preserve existing draw.io IDs whenever possible to keep manual edits intact.
