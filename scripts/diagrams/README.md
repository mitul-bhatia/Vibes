# Diagram Automation Scripts

## Scripts

- scripts/diagrams/validate-manifest.mjs
  - Validates diagrams/manifest.json structure.
  - By default, also checks required source files exist.

- scripts/diagrams/bootstrap-mermaid.mjs
  - Creates starter Mermaid files for missing diagram sources from manifest.

- scripts/diagrams/quality-gate.mjs
  - Enforces minimum depth/connectivity heuristics per required diagram type.

- scripts/diagrams/preflight-gate.mjs
  - Enforces mandatory per-diagram-type preflight checks.
  - Fails fast on placeholders, missing declarations, and diagram-type rule violations.

- scripts/diagrams/build-diagram-book.mjs
  - Exports Mermaid files to individual PDFs.
  - Merges exported PDFs into diagrams/out/diagram-book.pdf.
  - Writes build metadata to diagrams/out/diagram-build-report.json.

## Environment

- MERMAID_CLI_BIN (optional): explicit mmdc binary path.
  - Example local value:
    ./node_modules/.bin/mmdc

## Typical Usage

1. npm run diagrams:bootstrap
2. npm run diagrams:validate
3. npm run diagrams:preflight
4. npm run diagrams:quality
5. npm run diagrams:book

## Notes

- Required diagrams are defined in diagrams/manifest.json.
- Optional diagrams are skipped if their source file is missing.
