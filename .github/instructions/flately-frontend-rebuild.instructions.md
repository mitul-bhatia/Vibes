---
description: "Use when planning or implementing Flately frontend rebuild phases. Enforces no-mock policy, phase-gated approvals, and contract-first integration."
---

# Flately Frontend Rebuild Rules

## Applies To

- Flately frontend rebuild tasks
- Phase planning or execution requests
- Auth/onboarding/discovery/matches/chat integration work

## Mandatory Rules

1. Start each phase with a scoped discovery readout.
2. Require explicit approval before coding outside the current scope.
3. No mock/demo data in production pages.
4. Hide unsupported routes until backend endpoints exist.
5. Preserve backend contract compatibility unless the user explicitly approves backend change.
6. For auth changes, provide rollback criteria before implementation.
7. After each phase, report:
   - completed scope IDs
   - checks run
   - residual risks

## Suggested Validation Sequence

1. Typecheck
2. Lint
3. Tests
4. Build
5. Contract safety review for touched endpoints/events
