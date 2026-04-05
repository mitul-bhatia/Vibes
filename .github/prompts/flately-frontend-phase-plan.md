Create a phase-bounded implementation plan for the Flately frontend rebuild.

## Required Context

- Current phase ID and objective
- Approved scope IDs
- Locked constraints (timeline, risk tolerance, breaking-change policy, protected modules)
- Backend contract assumptions for this phase

## Output Format

```markdown
# Flately Rebuild Phase Plan: [PHASE_ID]

## Objective

[1-2 sentences]

## Scope (Locked)

- Included:
- Excluded:

## Files to Create or Modify

- path - reason

## Step-by-Step Execution

1. Step name
   - Action:
   - Why:
   - Depends on:

## Validation

- Automated checks:
- Manual flow checks:
- Contract safety checks:

## Risks and Rollback

- Risk:
  - Mitigation:
  - Rollback trigger:

## Exit Criteria

- [ ] Criteria 1
- [ ] Criteria 2
```

## Rules

1. No mocks in production pages.
2. Keep unsupported routes hidden unless backend support is approved.
3. Treat backend contracts as immutable unless explicitly approved for change.
4. Keep steps small, bounded, and independently testable.
