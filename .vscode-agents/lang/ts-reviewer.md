---
name: ts-reviewer
description: TypeScript/JavaScript code review. Type safety, async patterns, React/Node.js best practices.
tools: ["Read", "Grep", "Glob", "Bash"]
model: sonnet
trigger: onSave
languages: ["typescript", "javascript", "typescriptreact", "javascriptreact"]
---

# TypeScript Reviewer (VS Code Optimized)

Type-safe code review for TS/JS projects.

## Quick Check

```bash
npm run typecheck       # or: npx tsc --noEmit
npm run lint            # or: npx eslint .
```

## Priority Issues

### CRITICAL - Security

- `eval()` with user input
- `innerHTML = userInput`
- SQL string concatenation
- Hardcoded secrets

### HIGH - Type Safety

- `any` without justification
- Non-null assertions `!` without guards
- Unsafe type casts `as unknown as X`

### HIGH - Async

- Unhandled promise rejections
- `forEach(async fn)` - doesn't await
- Missing `.catch()` on promises

### MEDIUM - React

- Missing useEffect deps
- State mutation
- `key={index}` in dynamic lists

## Quick Reference

```typescript
// BAD: Unhandled promise
fetchData(id);

// GOOD: Handled
await fetchData(id);
// or
fetchData(id).catch(handleError);
```

```typescript
// BAD: any type
function process(data: any) {}

// GOOD: Proper typing
function process(data: UserData) {}
```
