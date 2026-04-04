# VS Code Optimized Agents - Quick Start

## Setup (One-time)

1. **Copy VS Code settings:**

   ```bash
   cp .vscode-agents/keybindings.json ~/Library/Application\ Support/Code/User/keybindings.json
   ```

2. **Install recommended extensions:**
   - Open VS Code
   - Press `Cmd+Shift+X`
   - Search "@recommended"
   - Install all

3. **Verify setup:**
   - Press `Cmd+Shift+A` to open Agent Quick Panel
   - You should see: Code Reviewer, Planner, Build Fix, Security, TDD

## Daily Usage

### Quick Commands

| Shortcut      | Agent         | When to Use             |
| ------------- | ------------- | ----------------------- |
| `Cmd+Shift+R` | Code Reviewer | After writing code      |
| `Cmd+Shift+P` | Planner       | Before complex features |
| `Cmd+Shift+B` | Build Fix     | When build fails        |
| `Cmd+Shift+S` | Security      | Before commits          |
| `Cmd+Shift+T` | TDD           | Starting new work       |
| `Cmd+Shift+A` | Agent Picker  | Select any agent        |

### Workflow: New Feature

```
1. Cmd+Shift+P  → Plan the feature
2. Cmd+Shift+T  → Write tests first
3. [code...]    → Implement
4. Cmd+Shift+R  → Review code
5. Cmd+Shift+S  → Security check
6. [commit]
```

### Workflow: Bug Fix

```
1. Cmd+Shift+T  → Write failing test
2. [fix...]     → Fix the bug
3. Cmd+Shift+B  → Fix any build errors
4. Cmd+Shift+R  → Review
5. [commit]
```

## Available Agents

### Core (Always Available)

- **code-reviewer** - Code quality review
- **planner** - Implementation planning
- **build-fix** - Fix build errors
- **security** - Security scanning
- **tdd** - Test-driven development
- **architect** - Architecture decisions

### Language-Specific (Auto-detect)

- **ts-reviewer** - TypeScript/JavaScript
- **py-reviewer** - Python

## Agent Output

All agent findings appear in:

1. **Problems Panel** (`Cmd+Shift+M`)
2. **Inline Diagnostics** (red/yellow squiggles)
3. **Status Bar** (issue count)

## Customization

Edit `.vscode-agents/agents.json` to:

- Enable/disable agents
- Change triggers
- Modify shortcuts

## Removed from Original Library

For VS Code optimization, these were excluded:

- C++, Go, Rust, Kotlin, Java, Flutter reviewers (add if needed)
- Build resolvers for specific languages
- Chief-of-staff, loop-operator, harness-optimizer
- 100+ specialized skills

To add back, copy from `agents/` folder.
