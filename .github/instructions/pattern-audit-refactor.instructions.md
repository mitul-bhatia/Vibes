---
description: "Use when handling pattern audit/refactor requests (GoF, SOLID, PATTERN_AUDIT, design pattern refactor). Mandate loading both pattern skills before any analysis or edits."
applyTo: "**/*.{ts,tsx,js,jsx,md}"
---

# Pattern Audit/Refactor Hard Lock

This instruction applies to requests about:

- pattern audit
- design pattern mapping
- GoF patterns
- SOLID violation analysis
- PATTERN_AUDIT generation
- refactoring guided by PATTERN_AUDIT

## Mandatory Context Load (Do First)

Before any analysis, planning, or code edits, load both files with read_file:

1. /Users/mitulbhatia/Downloads/Vibes 2/.github/skills/systemdesgin_pattern_auditer/SKILL.md
2. /Users/mitulbhatia/Downloads/Vibes 2/.github/skills/system_design_pattern_applier/SKILL.md

If either file cannot be loaded:

- Stop and report the missing file.
- Ask for the correct path before proceeding.

## Execution Rule

For pattern-audit/refactor tasks:

- Treat both skill files as required context, not optional references.
- Follow the auditor workflow first when the task is discovery/roadmap.
- Follow the applier workflow when the task is concrete refactor implementation.
- Preserve behavior and external contracts unless user explicitly asks for breaking changes.
