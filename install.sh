#!/usr/bin/env bash
# create-mcp-workspace — minimal installer
# Claude Code + qmd (on-device search) + a workspace folder. Nothing else.
# Usage: curl -fsSL https://raw.githubusercontent.com/demi-hl/create-mcp-workspace/main/install.sh | bash
set -euo pipefail

# ─── colors ────────────────────────────────────────────────────
if [ -t 1 ]; then
  B=$'\033[1m'; DIM=$'\033[2m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'
  RED=$'\033[31m'; CYAN=$'\033[36m'; MAGENTA=$'\033[35m'; R=$'\033[0m'
else
  B=""; DIM=""; GREEN=""; YELLOW=""; RED=""; CYAN=""; MAGENTA=""; R=""
fi
ok()   { printf "  ${GREEN}✓${R} %s\n" "$1"; }
warn() { printf "  ${YELLOW}!${R} %s\n" "$1"; }
fail() { printf "  ${RED}✗${R} %s\n" "$1" >&2; }
step() { printf "\n${CYAN}[%s]${R} ${B}%s${R}\n" "$1" "$2"; }

# ─── banner ────────────────────────────────────────────────────
cat <<BANNER

${MAGENTA}╔═══════════════════════════════════════════════╗${R}
${MAGENTA}║${R}  ${B}create-mcp-workspace${R}                         ${MAGENTA}║${R}
${MAGENTA}║${R}  Claude Code + qmd in under 2 minutes         ${MAGENTA}║${R}
${MAGENTA}╚═══════════════════════════════════════════════╝${R}
BANNER

# ─── prereqs ───────────────────────────────────────────────────
step "1/5" "Checking prerequisites"
for bin in node npm git; do
  if command -v "$bin" >/dev/null 2>&1; then
    ok "$bin found"
  else
    fail "$bin not found"
    case "$bin" in
      node|npm) printf "\nInstall Node 18+ first: ${CYAN}https://nodejs.org${R}\n(Mac: ${DIM}brew install node${R})\n\n" ;;
      git)      printf "\nInstall Git first: ${CYAN}https://git-scm.com${R}\n" ;;
    esac
    exit 1
  fi
done

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 18 ]; then
  fail "Node $NODE_MAJOR detected — need 18 or newer"
  exit 1
fi

# ─── install CLIs ──────────────────────────────────────────────
step "2/5" "Installing Claude Code + qmd"
if command -v claude >/dev/null 2>&1; then
  ok "Claude Code already installed ($(claude --version 2>&1 | head -1))"
else
  npm install -g @anthropic-ai/claude-code
  ok "installed @anthropic-ai/claude-code"
fi
if command -v qmd >/dev/null 2>&1; then
  ok "qmd already installed ($(qmd --version 2>&1 | head -1))"
else
  npm install -g @tobilu/qmd
  ok "installed @tobilu/qmd"
fi

# ─── install qmd Claude Code plugin ────────────────────────────
step "3/5" "Wiring qmd into Claude Code"
claude plugin marketplace add tobi/qmd >/dev/null 2>&1 || true
if claude plugin install qmd@qmd >/dev/null 2>&1; then
  ok "qmd plugin installed"
else
  warn "qmd plugin install returned non-zero — may already be installed; continuing"
fi

# ─── workspace ─────────────────────────────────────────────────
step "4/5" "Creating workspace"
WS="${CLAUDE_WORKSPACE:-$HOME/claude-workspace}"
mkdir -p "$WS"
ok "workspace: $WS"

# Seed a minimal CLAUDE.md if one doesn't exist (don't overwrite)
if [ ! -f "$WS/CLAUDE.md" ]; then
  cat > "$WS/CLAUDE.md" <<'EOF'
# Workspace

## Stack
- **Claude Code** — `claude` in this directory
- **qmd** — local hybrid search (BM25 + vector + LLM rerank) over this workspace's markdown

## Architecture Rules
- Production-grade, not prototypes.
- Prefer editing existing files over creating new ones.
- Scannable output over prose.

## First Session Prompt
Paste this as your first message to Claude:

> You're starting a fresh session in my workspace. First, confirm which MCPs
> are connected. Then ask me: (1) my role / what I do day-to-day, (2) my 1–3
> top active projects, (3) any hard preferences (communication style, tools,
> things NOT to do). For each answer, write a memory file and a one-line
> pointer in MEMORY.md. Keep it short. Action-first.

## Next Steps (Optional)
- Install Obsidian (https://obsidian.md) and point it at this directory — no wiring needed; qmd reads the markdown either way
- Browse STACK.md at https://github.com/demi-hl/create-mcp-workspace for role-based Claude Code plugins, recommended CLIs, and integrations
EOF
  ok "seeded CLAUDE.md"
else
  ok "CLAUDE.md already exists — kept as-is"
fi

# Seed a basic MEMORY.md if one doesn't exist
if [ ! -f "$WS/MEMORY.md" ]; then
  cat > "$WS/MEMORY.md" <<'EOF'
<!-- Entries get added here by Claude as memory accumulates across sessions. -->
EOF
  ok "seeded MEMORY.md"
fi

# git init (non-destructive)
if [ ! -d "$WS/.git" ]; then
  git -C "$WS" init -q
  cat > "$WS/.gitignore" <<'EOF'
.env
node_modules/
*.log
.DS_Store
EOF
  ok "git initialized"
fi

# ─── qmd collection ────────────────────────────────────────────
step "5/5" "Registering qmd collection"
if qmd collection add "$WS" --name workspace >/dev/null 2>&1; then
  ok "collection workspace → $WS"
else
  warn "collection add failed or already exists — run manually if needed: qmd collection add $WS --name workspace"
fi
qmd context add "qmd://workspace" "Personal workspace — notes, projects, imported context" >/dev/null 2>&1 || true

# ─── done ──────────────────────────────────────────────────────
cat <<DONE

${GREEN}${B}Setup complete.${R}

${B}Next:${R}
  ${DIM}cd ${WS}${R}
  ${B}claude${R}

Paste the ${CYAN}"First Session Prompt"${R} from CLAUDE.md as your first message.

${DIM}Semantic search? Run once:${R}  qmd embed  ${DIM}(~1GB model download, one-time)${R}
${DIM}More plugins / integrations:${R} https://github.com/demi-hl/create-mcp-workspace/blob/main/STACK.md

DONE
