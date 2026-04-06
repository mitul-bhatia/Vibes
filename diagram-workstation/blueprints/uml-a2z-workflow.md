# UML A-to-Z Workflow Blueprint

## Objective

Produce and maintain a complete UML baseline for any software project, then publish a single PDF book.

## Phase 1: Context Freeze

1. Populate diagrams/PROJECT_CONTEXT.md.
2. Confirm required entries in diagrams/manifest.json.
3. Lock naming and IDs before generation.

## Phase 2: Diagram Generation

1. Run Copilot command /diagram-suite.
2. Generate each required diagram under diagrams/src:
   - 01-class-diagram.mmd
   - 02-object-diagram.mmd
   - 03-use-case-diagram.mmd
   - 04-activity-diagram.mmd
   - 05-sequence-diagram.mmd
3. Generate 06-erd-diagram.mmd when database modeling is needed.

## Phase 3: Diagram Update Loop

1. Capture changes using diagram-workstation/templates/diagram-change-request.template.md.
2. Run /diagram-update with the specific scope.
3. Review updated .mmd files and verify IDs stay stable.

## Phase 4: Packaging

1. Validate manifest and required files:
   npm run diagrams:validate
2. Enforce diagram depth and structural quality:
   npm run diagrams:quality
3. Export all diagrams and build merged book:
   npm run diagrams:book
4. Publish output:
   diagrams/out/diagram-book.pdf

## Quality Gates

- No required diagram missing.
- Naming and IDs match manifest.
- PDF book generated successfully.
- Build report saved in diagrams/out/diagram-build-report.json.
