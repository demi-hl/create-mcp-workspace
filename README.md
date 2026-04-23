# create-mcp-workspace

**Claude Code + on-device search in under 2 minutes.**

One command to get a new operator productive with Claude Code and a local,
AI-native knowledge workspace — no config files, no API keys, no drama.

---

## Quick start (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/demi-hl/create-mcp-workspace/main/install.sh | bash
```

That's it. The script:

1. Checks that Node 18+, npm, and git are installed (fails fast if not)
2. Installs `@anthropic-ai/claude-code` and `@tobilu/qmd`
3. Installs Tobi Lütke's qmd plugin into Claude Code (auto-wires the MCP)
4. Creates `~/claude-workspace/` with a seeded `CLAUDE.md` + `MEMORY.md`
5. Registers a qmd search collection pointed at the workspace
6. Prints the one line you need to run next

## What you need first

- **Node.js 18+** — [nodejs.org](https://nodejs.org) (Mac: `brew install node`)
- **git** — usually preinstalled
- **An Anthropic account** — Claude Code prompts for login on first run

That's the full prerequisites list.

## After install

```bash
cd ~/claude-workspace
claude
```

On your first message to Claude, paste the "First Session Prompt" that the
installer seeded into `CLAUDE.md`. It interviews you for your role, projects,
and preferences, and seeds Claude's memory so future sessions know you.

## Optional: add Obsidian

Obsidian is a great GUI for the workspace but **not required**. If you want
it:

1. Install Obsidian from [obsidian.md](https://obsidian.md)
2. Open `~/claude-workspace` as a vault
3. That's it — qmd already reads the markdown files; no MCP wiring needed

For write-back-from-Claude capability (so Claude can create/edit notes in
your vault through a structured API), add the Obsidian Local REST API plugin
and wire the `obsidian-mcp-server` MCP. See [STACK.md](./STACK.md).

## Power-user path

The minimal installer keeps things simple. If you want role-based plugin
packs, additional MCPs (LanceDB vector store, Obsidian write-back, etc.),
recommended CLIs, and the full 10-step configurator, run:

```bash
npx github:demi-hl/create-mcp-workspace
```

This runs the full Node wrapper in `bin/create-mcp-workspace.mjs`.

## What's on the roadmap

See [STACK.md](./STACK.md) for the tiered reference:

- Tier 0: minimum stack (what `install.sh` sets up)
- Tier 1: universal CLIs worth adding (gh, ripgrep, fd, jq, fzf, tmux, ollama)
- Tier 2: essential Claude Code plugins
- Tier 3: role-based plugin packs (engineer, designer, product, data, etc.)
- Tier 4: data imports (ChatGPT / Gemini export migration)
- Tier 5: workflow automation (hooks, scheduled tasks, slash commands)
- Tier 6: optional extras (local Ollama models, editor integrations)

## Contributing / license

MIT — fork, modify, redistribute freely.

Issues and PRs welcome at
[github.com/demi-hl/create-mcp-workspace](https://github.com/demi-hl/create-mcp-workspace).
