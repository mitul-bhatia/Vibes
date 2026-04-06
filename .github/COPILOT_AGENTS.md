# GitHub Copilot Agents Setup

Custom prompt files that GitHub Copilot automatically detects and uses.

## Quick Start

### Step 1: Copy to Your Project

```bash
# Copy the .github folder to your project
cp -r .github /path/to/your/project/
```

### Step 2: Enable in VS Code

1. Open VS Code Settings (`Cmd+,`)
2. Search for "copilot instructions"
3. Enable: `GitHub > Copilot > Chat: Code Generation Instructions`
4. Set path: `.github/copilot-instructions.md`

### Step 3: Enable Custom Prompts

1. Open VS Code Settings (`Cmd+,`)
2. Search for "copilot prompts"
3. Enable: `Chat: Prompt Files`
4. Restart VS Code

## Using the Agents

### In Copilot Chat

Open Copilot Chat (`Cmd+Shift+I`) and use:

```
/code-review    Review this code for issues
/plan           Create a plan for [feature]
/build-fix      Fix the build errors
/security       Scan for vulnerabilities
/tdd            Help me write tests for [function]
/architect      Design architecture for [system]
/diagram-suite  Generate full Mermaid UML diagram baseline
/diagram-update Update existing Mermaid diagrams without reset
/diagram-pdf    Export and package the final PDF book
```

Diagram commands use Mermaid .mmd sources under diagrams/src and package them to PDF via npm run diagrams:book.

### With Selection

1. Select code in editor
2. Press `Cmd+Shift+I` (Copilot Chat)
3. Type `/code-review` or any agent command

### Keyboard Shortcuts

Add to `keybindings.json` (`Cmd+K Cmd+S` → Open JSON):

```json
[
  {
    "key": "cmd+shift+r",
    "command": "workbench.action.chat.open",
    "args": { "query": "/code-review" }
  },
  {
    "key": "cmd+shift+p",
    "command": "workbench.action.chat.open",
    "args": { "query": "/plan" }
  }
]
```

## Available Agents

| Command           | Purpose                                                     |
| ----------------- | ----------------------------------------------------------- |
| `/code-review`    | Review code quality, security, bugs                         |
| `/plan`           | Create implementation plans                                 |
| `/build-fix`      | Fix TypeScript/build errors                                 |
| `/security`       | Security vulnerability scan                                 |
| `/tdd`            | Test-driven development                                     |
| `/architect`      | System design decisions                                     |
| `/diagram-suite`  | Generate Class/Object/Use Case/Activity/Sequence in Mermaid |
| `/diagram-update` | Update existing Mermaid diagram files safely                |
| `/diagram-pdf`    | Build diagram PDF package                                   |

## File Structure

```
.github/
├── copilot-instructions.md    # Global instructions (always loaded)
└── prompts/
    ├── code-review.md         # /code-review command
    ├── plan.md                # /plan command
    ├── build-fix.md           # /build-fix command
    ├── security.md            # /security command
    ├── tdd.md                 # /tdd command
    ├── architect.md           # /architect command
    ├── diagram-suite.md       # /diagram-suite command
    ├── diagram-update.md      # /diagram-update command
    └── diagram-pdf.md         # /diagram-pdf command
```

## How It Works

1. `copilot-instructions.md` - Loaded automatically for ALL Copilot interactions
2. `prompts/*.md` - Each file becomes a `/command` in Copilot Chat
3. Copilot combines instructions + prompt + your query

## Customization

### Add New Agent

Create `.github/prompts/my-agent.md`:

```markdown
You are an expert [role]. Help with [task].

## Guidelines

- Rule 1
- Rule 2

## Output Format

[How to format responses]
```

Then use `/my-agent` in Copilot Chat.

### Modify Instructions

Edit `.github/copilot-instructions.md` to change global behavior.

## Troubleshooting

### Commands Not Showing

1. Restart VS Code
2. Check `Chat: Prompt Files` is enabled
3. Verify files are in `.github/prompts/`

### Instructions Not Applied

1. Check file path in settings
2. Ensure valid markdown format
3. Restart Copilot

## Requirements

- VS Code 1.85+
- GitHub Copilot extension
- GitHub Copilot Chat extension
