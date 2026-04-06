---
name: mermaid-diagram-quality
description: Cross-diagram quality checklist for Mermaid UML suites covering depth, alignment, readability, and update safety.
---

# Mermaid Diagram Quality Skill

Use when reviewing or generating a full Mermaid diagram suite.

## Intent

- Prevent shallow, vague, or visually chaotic diagrams.
- Enforce deterministic quality before export.

## Quality Dimensions

- Structural correctness:
  - valid Mermaid declaration per file
  - parseable syntax
- Semantic depth:
  - non-placeholder nodes and edges
  - explicit guards/labels where branching exists
- Alignment and readability:
  - intentional direction
  - grouped lanes/subgraphs in cross-layer diagrams
- Change safety:
  - stable IDs and naming across revisions

## Global Quality Checklist

- Every required diagram exists and matches manifest IDs.
- Diagram type declaration matches manifest type:
  - class -> classDiagram
  - object/use-case/activity -> flowchart
  - sequence -> sequenceDiagram
  - erd -> erDiagram
- Node and edge labels are domain-specific and testable.
- Depth thresholds are met for each type.
- Failure and alternate flows are included where behavior requires them.
- Naming is consistent with codebase entities/services/endpoints.

## Layout and Styling Checklist

- Direction is explicit (`LR`, `TB`, etc.), not implicit default.
- Subgraphs are used to reduce edge crossing in multi-layer diagrams.
- Theme and config remain print-friendly for PDF output.
- No known syntax break traps:
  - avoid lowercase `end` as raw node text in flowchart/sequence
  - quote troublesome labels with special characters

## Release Gate Commands

- `npm run diagrams:bootstrap` (if files are missing)
- `npm run diagrams:preflight`
- `npm run diagrams:book`

## Reject Conditions

- Placeholder content (`TODO`, generic labels) in required diagrams.
- Missing alternate/error paths in sequence/activity where expected.
- Cardinality ambiguity in ERD or unlabeled critical relations.
- New diagram update that silently renames stable domain nodes.

## References

- https://mermaid.js.org/intro/syntax-reference.html
- https://mermaid.js.org/config/theming.html
- https://mermaid.js.org/config/schema-docs/config.html
