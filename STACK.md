# Claude Code Workspace Stack Guide

A tiered reference for everything worth installing to get the most out of
Claude Code. The [wrapper](bin/create-mcp-workspace.mjs) handles **Tier 0**
automatically, offers **Tier 1** and **Tier 3** interactively, and lists the
rest for you to opt into later.

Pick what matches your actual workflow. Don't install everything — noise is
worse than missing a skill.

---

## Tier 0 — Core (wrapper installs automatically)

| Component | Purpose | Install |
|-----------|---------|---------|
| Claude Code | The terminal agent | `npm install -g @anthropic-ai/claude-code` |
| Obsidian (app) | Personal knowledge vault | obsidian.md |
| Obsidian Local REST API plugin | Lets the MCP read/write the vault | Obsidian → Settings → Community plugins |
| `obsidian-mcp-server` | MCP bridge | `npm install -g obsidian-mcp-server` |
| `@tobilu/qmd` (CLI) | Tobi Lütke's on-device hybrid search | `npm install -g @tobilu/qmd` |
| qmd Claude Code plugin | Auto-wires qmd's MCP + shipped skills | `claude plugin marketplace add tobi/qmd && claude plugin install qmd@qmd` |
| `@iflow-mcp/lance-mcp` | LanceDB vector store MCP | `npm install -g @iflow-mcp/lance-mcp` |
| Seeded `CLAUDE.md`, `MEMORY.md`, `welcome-prompt.md` | First-session orientation | wrapper seeds these |

---

## Tier 1 — Universal CLIs (wrapper offers via brew)

These are used constantly by Claude across any codebase. Wrapper offers a
batch install on macOS.

| CLI | Purpose |
|-----|---------|
| `gh` | GitHub CLI — PRs, issues, releases, Actions |
| `ripgrep` (`rg`) | Fast code/content search (Claude uses this before `grep`) |
| `fd` | Fast file finder (Claude uses this before `find`) |
| `jq` | JSON wrangling in pipelines |
| `fzf` | Fuzzy finder for interactive selection |
| `tmux` | Session multiplexing — long Claude sessions survive terminal close |
| `ollama` | Local LLM runtime (private/offline fallback) |

Manual install:
```bash
brew install gh ripgrep fd jq fzf tmux ollama     # macOS
sudo apt install ripgrep fd-find jq fzf tmux       # Debian/Ubuntu
# gh: see cli.github.com | ollama: see ollama.com
```

---

## Tier 2 — Essential Claude Code Plugins (wrapper offers)

Universal plugins from the `claude-plugins-official` marketplace. Install all of them:

```bash
claude plugin install <name>@claude-plugins-official
```

| Plugin | What it does |
|--------|--------------|
| `skill-creator` | Scaffold new skills on demand |
| `remember` | Continuous memory across sessions |
| `claude-md-management` | Maintain and improve CLAUDE.md files |
| `commit-commands` | Structured git commit / push / PR commands |
| `code-review` | Multi-agent code review on PRs |
| `security-guidance` | Hook that warns when you edit sensitive files |

Also worth a look (install case-by-case):
- `superpowers` — brainstorming + subagent-driven development
- `context7` — up-to-date library docs lookup
- `claude-code-setup` — analyzes a codebase and recommends hooks/agents
- `hookify` — easily create custom hooks
- `plugin-dev` — toolkit for developing your own plugins
- `mcp-server-dev` — build your own MCP servers
- `explanatory-output-style` / `learning-output-style` — educational modes

---

## Tier 3 — Role-specific plugin packs (wrapper offers one)

Pick **one** role. Each pack is a curated set of plugins from
`claude-plugins-official`. Install individually with
`claude plugin install <name>@claude-plugins-official`.

### Engineer
- `github` — official GitHub MCP
- `pr-review-toolkit` — specialized review agents
- `semgrep` — real-time security scans
- `playwright` — browser automation / e2e tests
- `chrome-devtools-mcp` — inspect a live Chrome tab
- LSP for your language: `typescript-lsp`, `pyright-lsp`, `rust-analyzer-lsp`, `gopls-lsp`, `ruby-lsp`, `kotlin-lsp`, `swift-lsp`, `jdtls-lsp`, `clangd-lsp`, `elixir-ls-lsp`, `lua-lsp`, `php-lsp`, `csharp-lsp`

### Designer
- `figma` — Figma design platform
- `frontend-design` — production-grade frontend generation

### Product
- `linear` — issue tracking
- `notion` — docs and databases
- `atlassian` — Jira + Confluence
- `posthog` — analytics + feature flags

### Marketing
- `searchfit-seo` — SEO audit + content strategy
- `postiz` — social automation
- `mintlify` — docs sites

### Sales
- `zoominfo` — enrichment + lead research
- `slack` — workspace integration
- `atlassian` — if selling B2B through Jira teams

### Ops / SRE
- `terraform` — infra as code
- `deploy-on-aws` / `aws-serverless`
- `sentry` — error monitoring
- `pagerduty` — incident management
- `railway` — simple deploys

### Finance
- `stripe` — payments
- `context7` — regulation + library docs
- (Also consider standalone bookkeeping — no plugin in this marketplace yet)

### Data / Analytics
- `data` — Apache Airflow / Astronomer
- `data-engineering` — warehouse exploration, pipeline authoring
- `supabase`, `planetscale`, `neon` — DB MCPs
- `prisma` — Postgres schema management

### Legal
- `legalzoom` — attorney guidance

### Customer Support
- `intercom`
- `sentry`
- `pagerduty`

### DevOps
- `terraform`, `aws-serverless`, `vercel`, `netlify-skills`, `firebase`, `sentry`

### AI / ML
- `huggingface-skills` — HF datasets + models
- `agent-sdk-dev` — Claude Agent SDK development
- `mcp-server-dev` — build MCPs
- `fiftyone` — dataset + CV tooling

---

## Tier 4 — Data imports to bootstrap memory

Drop these into your vault's `Imports/` folder, then ask Claude to summarize
and extract memory candidates on your first session.

| Source | How to export |
|--------|--------------|
| ChatGPT | Settings → Data controls → Export → `conversations.json` |
| Gemini | Google Takeout → "Gemini Apps" |
| Perplexity | Manual copy/paste (no native export) |
| Cursor / Codex | Chat history JSON (varies by version) |
| Gmail | Google Takeout → Mail (filter: starred or labeled) |
| Calendar | Google Takeout → Calendar (`.ics`) |
| Drive / Docs | Google Takeout → Drive (markdown export recommended) |
| Prior notes | Export from Notion / Apple Notes / Evernote as markdown |

First-session prompt (ready to paste):
> Read the files in `vault/Imports/`. Extract: (1) recurring projects I
> mention, (2) people I refer to repeatedly, (3) hard rules or preferences
> I've stated, (4) tools I use. Draft memory entries in the correct categories
> (user, feedback, project, reference) and confirm with me before saving.

---

## Tier 5 — Workflow automation (post-onboarding)

These live inside Claude Code — no external installs needed.

| Feature | Purpose | Trigger |
|---------|---------|---------|
| **Hooks** | Auto-run on events (tool use, session start/stop) | `.claude/settings.json` or `update-config` skill |
| **Slash commands** | Custom shortcuts | `.claude/commands/<name>.md` |
| **Scheduled tasks** | Cron-based remote agents | `schedule` skill |
| **Background agents** | Async workers | `loop` skill for self-paced loops |
| **Plan mode** | Structured planning before execution | toggle with the `Plan` agent |
| **Worktrees** | Isolated branches per task | `EnterWorktree` tool |
| **Memory auto-consolidation** | Periodic dedupe + prune | `anthropic-skills:consolidate-memory` |

---

## Tier 6 — Optional extras

### Editor integrations
- **VS Code Claude Code extension** — inline completions + chat
- **JetBrains Claude Code plugin**
- **Neovim / Emacs** — use `claude` in a tmux pane

### Local models (private workflows)
```bash
ollama pull llama3.2           # small + fast
ollama pull qwen2.5-coder      # coding-tuned
ollama pull gpt-oss:20b        # larger local
```
Then point Claude at them or use `ollama run <model>` directly for offline work.

### Analytics / local query
- `duckdb` — `brew install duckdb` — local analytics, pairs well with qmd results
- `sqlite-utils` — `pipx install sqlite-utils` — SQLite CLI wrangler

### Tunneling (expose local services)
- `cloudflared` — Cloudflare tunnel
- `ngrok` — classic tunnel
- `tailscale` — private mesh networking

### Secrets / credentials
- `1Password CLI` (`op`) — read secrets into env vars Claude can use
- `pass` — GPG-based password manager
- `direnv` — per-dir env vars

### Observability (for agent health)
- `ctop` / `htop` — process / container monitoring
- Grafana + Prometheus if you run long-lived agents

---

## Install commands cheat sheet

```bash
# Claude Code
npm install -g @anthropic-ai/claude-code

# Core stack
npm install -g obsidian-mcp-server
npm install -g @tobilu/qmd
npm install -g @iflow-mcp/lance-mcp

# qmd Claude Code plugin (wires its own MCP)
claude plugin marketplace add tobi/qmd
claude plugin install qmd@qmd

# Other plugins (from the default marketplace)
claude plugin install <name>@claude-plugins-official

# Universal CLIs (macOS)
brew install gh ripgrep fd jq fzf tmux ollama

# Ollama models for local work
ollama pull llama3.2
ollama pull qwen2.5-coder
```

---

## Discovery

To browse all available plugins in the official marketplace:
```bash
claude plugin marketplace list
ls ~/.claude/plugins/marketplaces/claude-plugins-official/plugins
```

Anyone can publish their own marketplace from a GitHub repo with a
`.claude-plugin/marketplace.json`. To add a third-party marketplace:
```bash
claude plugin marketplace add <org>/<repo>
```
