# Flately Mermaid Execution Workflow

## Purpose

This document defines the exact workflow to move from codebase context to production-ready Mermaid diagrams and PDF exports for Flately.

## Current Ground Truth

- Workspace context has been reviewed across:
  - Flately backend, frontend, docs, and PATTERN_AUDIT
  - Viberes diagram workstation, scripts, manifest, and MCP setup
- Viberes MCP is configured for Mermaid in `.vscode/mcp.json`.
- Diagram pipeline dependencies are installed.
- Bootstrap has generated all six diagram source files in `diagrams/src`.

## Verified Pipeline Status

Commands run in Viberes:

1. `npm install`
2. `npm run diagrams:bootstrap`
3. `npm run diagrams:validate`
4. `npm run diagrams:preflight`
5. `npm run diagrams:quality`

Result summary:

- `diagrams:validate` passes
- `diagrams:quality` passes
- `diagrams:preflight` currently fails on:
  - object diagram missing subgraph grouping
  - sequence diagram missing control-flow block
  - ERD missing attribute blocks
  - ERD missing key markers (`PK/FK/UK`)

## Strategy Decision (Required Before Deep Authoring)

Choose one mode before full diagram authoring:

1. Current-state mode
   - Diagram exactly what exists in code now.
   - Add explicit debt annotations for PA-001..PA-006.
2. Target-state mode
   - Diagram post-refactor architecture from PATTERN_AUDIT recommendations.
   - Use diagrams as implementation blueprint.

Recommended default: current-state mode with explicit hotspot annotations.

## Phase Plan

## Phase 0 - Context Freeze

Deliverables:

- Confirm source-of-truth docs:
  - `flately-full_stack/docs/product-user-flow.md`
  - `flately-full_stack/docs/architecture.md`
  - `flately-full_stack/PATTERN_AUDIT.md`
  - `Viberes/diagrams/PROJECT_CONTEXT.md`
- Confirm endpoints/events that diagrams must reflect.

Gate:

- No unresolved contract ambiguity for endpoints/events.

## Phase 1 - Preflight Fix Baseline

Goal: make all starter diagrams structurally valid before deep modeling.

Required fixes:

1. `02-object-diagram.mmd`
   - Add subgraph sections for alignment (for example Frontend/API/Domain/Data).
2. `05-sequence-diagram.mmd`
   - Add at least one `alt` or `loop` branch.
3. `06-erd-diagram.mmd`
   - Add attribute blocks for each entity.
   - Add `PK/FK/UK` markers where applicable.

Gate command:

- `npm run diagrams:preflight`

## Phase 2 - Deep Diagram Authoring (One by One)

Author in this order:

1. `01-class-diagram.mmd`
2. `06-erd-diagram.mmd`
3. `05-sequence-diagram.mmd`
4. `04-activity-diagram.mmd`
5. `03-use-case-diagram.mmd`
6. `02-object-diagram.mmd`

Why this order:

- Class + ERD establish static contracts first.
- Sequence + Activity capture runtime behavior on top of those contracts.
- Use-case and object diagrams then finalize business and runtime snapshots.

Per-file completion checklist:

- Mermaid syntax valid
- Naming consistent with code entities and endpoints
- No placeholders
- Meets skill depth expectations
- Mentions hotspot tags when relevant (`PA-001` to `PA-006`)

## Phase 3 - Quality and Packaging

Run for every finalized batch:

1. `npm run diagrams:validate`
2. `npm run diagrams:preflight`
3. `npm run diagrams:quality`
4. `npm run diagrams:book`

Artifacts:

- `diagrams/out/pdf/*.pdf`
- `diagrams/out/diagram-book.pdf`
- `diagrams/out/diagram-build-report.json`

## Diagram Content Requirements

Apply these standards from loaded skills and repo instructions:

- Class: clear relationships with labels, architecture boundaries, stable naming
- Object: concrete instance snapshots with runtime state values
- Use case: actor-goal mapping with include/extend semantics where needed
- Activity: start/end nodes, guarded decision branches, failure and retry paths
- Sequence: explicit participants, ordered interactions, alt/opt/loop blocks
- ERD: cardinality, attributes, key markers, ownership constraints

## Documentation Maintenance Rule

After each diagram reaches done state:

1. Update `diagrams/PROJECT_CONTEXT.md` with:
   - what changed
   - which contracts were represented
   - which hotspot IDs were documented
2. Keep this workflow doc updated with completion status.

## Suggested Working Rhythm

For each diagram:

1. Read related code and docs
2. Edit single `.mmd`
3. Run `diagrams:preflight`
4. Fix issues immediately
5. Repeat until clean

After every 2 diagrams:

1. Run full gate sequence (`validate`, `preflight`, `quality`, `book`)
2. Review generated PDFs for readability and clipping

## Immediate Next Action

Start Phase 1 by fixing structural preflight issues in:

- `diagrams/src/02-object-diagram.mmd`
- `diagrams/src/05-sequence-diagram.mmd`
- `diagrams/src/06-erd-diagram.mmd`

Then begin deep authoring of `diagrams/src/01-class-diagram.mmd`.
