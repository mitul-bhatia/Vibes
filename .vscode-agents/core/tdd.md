---
name: tdd
description: Test-driven development workflow. Write tests first, then implement.
tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
model: sonnet
trigger: manual
---

# TDD Guide (VS Code Optimized)

RED-GREEN-REFACTOR workflow for VS Code.

## TDD Cycle

### 1. RED - Write Failing Test

```typescript
// Press Cmd+Shift+T to start
test("should validate email format", () => {
  expect(validateEmail("invalid")).toBe(false);
  expect(validateEmail("user@example.com")).toBe(true);
});
```

### 2. GREEN - Minimal Implementation

```typescript
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

### 3. REFACTOR - Improve (keep tests green)

## Test Commands

```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # Coverage report
npm test -- path/to/test   # Single file
```

## VS Code Integration

- Test Explorer integration
- Run/Debug from gutter icons
- Coverage highlighting
- Inline test results

## File Naming

```
src/
  utils/
    validate.ts           # Implementation
    validate.test.ts      # Unit tests
    validate.spec.ts      # Alternative
```
