# Diagram Automation Scripts

## Scripts

- scripts/diagrams/validate-manifest.mjs
  - Validates diagrams/manifest.json structure.
  - By default, also checks required source files exist.

- scripts/diagrams/build-diagram-book.mjs
  - Exports draw.io files to individual PDFs.
  - Merges exported PDFs into diagrams/out/diagram-book.pdf.
  - Writes build metadata to diagrams/out/diagram-build-report.json.

## Environment

- DRAWIO_BIN (optional): explicit draw.io binary path.
  - Example macOS value:
    /Applications/draw.io.app/Contents/MacOS/draw.io

## Typical Usage

1. npm run diagrams:validate
2. npm run diagrams:book

## Notes

- Required diagrams are defined in diagrams/manifest.json.
- Optional diagrams are skipped if their source file is missing.
