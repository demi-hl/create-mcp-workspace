# create-mcp-workspace

One-command onboarding wrapper that takes a new user from zero to a working
**Claude Code + Obsidian + qmd + LanceDB** setup with a seeded first prompt.

## What it installs

| Component | Source | Role |
|-----------|--------|------|
| `@anthropic-ai/claude-code` | npm | The Claude Code CLI |
| `obsidian-mcp-server` | npm | MCP bridge to an Obsidian vault (needs Local REST API plugin) |
| [`@tobilu/qmd`](https://github.com/tobi/qmd) | npm (published from github.com/tobi/qmd) | Local BM25 + vector + LLM-rerank search over markdown |
| `qmd` Claude Code plugin | `tobi/qmd` marketplace | Tobi's native Claude Code plugin — wires qmd's MCP automatically |
| `@iflow-mcp/lance-mcp` | npm | LanceDB vector store access via MCP |

It registers the obsidian and lancedb MCPs with Claude Code, installs
Tobi's qmd plugin (which self-wires its MCP), seeds a PARA-layout Obsidian
vault (if one doesn't exist), creates a qmd collection against the vault with
a contextual description, and optionally generates semantic embeddings.

## What it does NOT install

- Obsidian itself (GUI app — download from obsidian.md)
- Any OpenClaw / Codex / Cursor tooling
- Homebrew or Node (prereqs; fails fast if missing)

## Usage

### Local (this repo)

```bash
node onboarding/bin/create-mcp-workspace.mjs
```

### Once published to npm

```bash
npx create-mcp-workspace
# or
npm create mcp-workspace
```

## 8-step flow

1. Prereq check (node, npm, git)
2. Collect name, workspace path, vault path, install choices
3. Create workspace + LanceDB + vault directories
4. Install Claude Code CLI (if missing)
5. Install qmd CLI + obsidian-mcp-server + lance-mcp via npm; install Tobi's qmd Claude Code plugin from the `tobi/qmd` marketplace
6. Register the obsidian and lancedb MCPs with Claude Code (qmd's MCP is wired by its plugin automatically)
7. Create a qmd collection against the vault, add contextual description, optionally run `qmd embed` to download embedding models and build the vector index
8. Seed `CLAUDE.md`, `MEMORY.md`, `.env.example`, `welcome-prompt.md`, git init

## First session

```bash
cd ~/mcp-workspace    # or whatever path you chose
claude                   # start a Claude Code session
```

Then paste `welcome-prompt.md` as your first message. That prompt orients
Claude to the available MCPs and runs a short interview to seed the memory
system with the operator's profile, projects, and preferences — so by the end
of session one, memory is populated and the workspace is functional.

## Obsidian API key (one-time manual step)

The Obsidian MCP needs the **Local REST API** community plugin:

1. Obsidian → Settings → Community plugins → Browse
2. Search "Local REST API" → install → enable
3. Copy the generated API key
4. Paste into your environment:
   ```bash
   echo 'export OBSIDIAN_API_KEY="paste-key-here"' >> ~/.zshrc
   source ~/.zshrc
   ```

The installer prints this reminder at the end.

## Design notes

- **Zero dependencies** — pure Node stdlib (`readline`, `child_process`, `fs`,
  `path`, `os`). Runs via `node` directly or `npx` when published.
- **Idempotent** — re-running removes and re-adds MCP registrations, never
  duplicates them.
- **Single workspace dir** — everything user-facing lives under one path.
  Easy to back up, easy to wipe, easy to hand off.
- **PARA layout** — starter vault uses Projects / Areas / Resources / Daily /
  Imports so the operator can pick up standard organizational patterns.
