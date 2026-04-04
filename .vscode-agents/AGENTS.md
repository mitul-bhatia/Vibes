# VS Code Optimized Agents

Curated agent collection optimized for VS Code + GitHub Copilot workflows.

## Quick Reference

| Agent            | Shortcut       | When to Use             |
| ---------------- | -------------- | ----------------------- |
| `@code-reviewer` | `Ctrl+Shift+R` | After writing code      |
| `@planner`       | `Ctrl+Shift+P` | Before complex features |
| `@build-fix`     | `Ctrl+Shift+B` | When build fails        |
| `@security`      | `Ctrl+Shift+S` | Before commits          |
| `@tdd`           | `Ctrl+Shift+T` | New features/bugs       |

## Core Agents (Always Available)

### 1. Code Reviewer (`@code-reviewer`)

**Purpose:** Review code quality, security, and maintainability
**Trigger:** After writing/modifying any code
**Output:** Issue report with severity levels (CRITICAL/HIGH/MEDIUM/LOW)

### 2. Planner (`@planner`)

**Purpose:** Create implementation plans for complex features
**Trigger:** Before starting multi-file changes
**Output:** Step-by-step plan with file paths and dependencies

### 3. Build Error Resolver (`@build-fix`)

**Purpose:** Fix TypeScript/build errors quickly
**Trigger:** When build fails or red squiggles appear
**Output:** Minimal fixes to get build green

### 4. Security Reviewer (`@security`)

**Purpose:** Detect vulnerabilities and hardcoded secrets
**Trigger:** Before commits, on auth/API/input handling code
**Output:** Security audit with OWASP Top 10 check

### 5. TDD Guide (`@tdd`)

**Purpose:** Test-driven development workflow
**Trigger:** New features, bug fixes
**Output:** RED-GREEN-REFACTOR cycle guidance

### 6. Architect (`@architect`)

**Purpose:** System design and scalability decisions
**Trigger:** New features requiring architecture changes
**Output:** Architecture Decision Records (ADRs)

## Language-Specific Agents

### TypeScript/JavaScript (`@ts-reviewer`)

- Type safety checks
- Async correctness
- React/Next.js patterns
- Node.js security

### Python (`@py-reviewer`)

- PEP 8 compliance
- Type hints
- Django/FastAPI patterns

## Agent Selection

Enable/disable agents in `.vscode/settings.json`:

```json
{
  "copilot.agents": {
    "code-reviewer": true,
    "planner": true,
    "build-fix": true,
    "security": true,
    "tdd": true,
    "architect": true,
    "ts-reviewer": true,
    "py-reviewer": false
  }
}
```

## Usage Patterns

### Pattern 1: Feature Development

```
1. @planner - Plan the feature
2. @tdd - Write tests first
3. @code-reviewer - Review implementation
4. @security - Security check before commit
```

### Pattern 2: Bug Fix

```
1. @tdd - Write failing test for bug
2. @build-fix - If build breaks
3. @code-reviewer - Review fix
```

### Pattern 3: Refactoring

```
1. @planner - Plan refactoring steps
2. @architect - Validate architecture
3. @code-reviewer - Review changes
```

## VS Code Integration

### Keyboard Shortcuts

Add to `keybindings.json`:

```json
[
  {
    "key": "ctrl+shift+r",
    "command": "copilot.invokeAgent",
    "args": "code-reviewer"
  },
  {
    "key": "ctrl+shift+p",
    "command": "copilot.invokeAgent",
    "args": "planner"
  },
  {
    "key": "ctrl+shift+b",
    "command": "copilot.invokeAgent",
    "args": "build-fix"
  },
  {
    "key": "ctrl+shift+s",
    "command": "copilot.invokeAgent",
    "args": "security"
  },
  { "key": "ctrl+shift+t", "command": "copilot.invokeAgent", "args": "tdd" }
]
```

### Status Bar Integration

Agents show status in VS Code status bar:

- Green: No issues
- Yellow: Medium issues found
- Red: Critical issues found
