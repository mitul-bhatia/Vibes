# GitHub Copilot Custom Agents

Ready-to-use prompt files for GitHub Copilot in VS Code.

## What's Included

9 custom agents that work as `/commands` in Copilot Chat:

| Command           | Purpose                                    |
| ----------------- | ------------------------------------------ |
| `/code-review`    | Review code for bugs, security, quality    |
| `/plan`           | Create implementation plans                |
| `/build-fix`      | Fix TypeScript/build errors                |
| `/security`       | Security vulnerability scan                |
| `/tdd`            | Test-driven development                    |
| `/architect`      | System design decisions                    |
| `/diagram-suite`  | Generate full Mermaid UML diagram baseline |
| `/diagram-update` | Update existing Mermaid diagrams safely    |
| `/diagram-pdf`    | Export and package final diagram PDF       |

## Setup (5 minutes)

### Step 1: Copy Files to Your Project

```bash
cp -r .github /path/to/your/project/
```

### Step 2: Enable Copilot Instructions

1. Open VS Code
2. Press `Cmd+,` (Settings)
3. Search: `copilot instructions`
4. Check: `GitHub > Copilot > Chat: Code Generation Instructions`

### Step 3: Enable Custom Prompts

1. Press `Cmd+,` (Settings)
2. Search: `chat prompt files`
3. Check: `Chat: Prompt Files`
4. Restart VS Code

### Step 4: Test It

1. Open Copilot Chat (`Cmd+Shift+I`)
2. Type `/code-review`
3. You should see the prompt loaded

## Usage

### Basic Usage

```
/code-review      Review selected code
/plan             Plan a new feature
/build-fix        Fix build errors
/security         Security scan
/tdd              TDD workflow
/architect        Architecture design
/diagram-suite    Generate Class/Object/Use Case/Activity/Sequence
/diagram-update   Update one or more existing diagrams
/diagram-pdf      Build per-diagram PDFs and merged PDF book
```

### With Context

```
/code-review Review the authentication logic
/plan Create plan for user profile feature
/security Check this API endpoint
/diagram-suite Generate all diagrams from diagrams/PROJECT_CONTEXT.md
```

### With Selection

1. Select code in editor
2. Open Copilot Chat (`Cmd+Shift+I`)
3. Type `/code-review` or any command

## File Structure

```
.github/
├── copilot-instructions.md    # Always loaded for all Copilot
└── prompts/
    ├── code-review.md         # /code-review
    ├── plan.md                # /plan
    ├── build-fix.md           # /build-fix
    ├── security.md            # /security
    ├── tdd.md                 # /tdd
    ├── architect.md           # /architect
    ├── diagram-suite.md       # /diagram-suite
    ├── diagram-update.md      # /diagram-update
    └── diagram-pdf.md         # /diagram-pdf
```

## Diagram Workstation

Diagram automation is provided out of the box:

- `diagrams/manifest.json` defines required UML/ERD outputs.
- `diagrams/PROJECT_CONTEXT.md` captures project context for generation.
- `diagrams/src/*.mmd` stores Mermaid diagram source files.
- `npm run diagrams:bootstrap` creates starter Mermaid files for missing sources.
- `npm run diagrams:validate` validates manifest and required source coverage.
- `npm run diagrams:preflight` enforces mandatory per-diagram-type fail-fast checks.
- `npm run diagrams:quality` enforces depth/alignment quality heuristics.
- `npm run diagrams:book` exports PDFs and builds `diagrams/out/diagram-book.pdf`.
- `diagram-workstation/` contains reusable templates and workflow blueprint.

## Add Your Own Agent

Create `.github/prompts/my-agent.md`:

```markdown
You are an expert [role].

## What You Do

- Task 1
- Task 2

## Output Format

[How to respond]
```

Then use `/my-agent` in Copilot Chat.

## Requirements

- VS Code 1.85+
- GitHub Copilot extension
- GitHub Copilot Chat extension
