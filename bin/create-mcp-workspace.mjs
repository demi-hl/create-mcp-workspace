#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout, exit, platform } from "node:process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const C = {
  r: "\x1b[0m",
  b: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

const TOTAL_STEPS = 10;
const log = {
  step: (n, msg) =>
    console.log(`\n${C.cyan}[${n}/${TOTAL_STEPS}]${C.r} ${C.b}${msg}${C.r}`),
  ok: (msg) => console.log(`  ${C.green}✓${C.r} ${msg}`),
  warn: (msg) => console.log(`  ${C.yellow}!${C.r} ${msg}`),
  fail: (msg) => console.log(`  ${C.red}✗${C.r} ${msg}`),
  info: (msg) => console.log(`  ${C.dim}${msg}${C.r}`),
};

// Recommended CLIs installable via Homebrew (macOS) or apt (Linux).
const RECOMMENDED_CLIS = ["gh", "ripgrep", "fd", "jq", "fzf", "tmux", "ollama"];

// Essential Claude Code plugins (universal — everyone benefits).
// Plugin names verified against the claude-plugins-official marketplace.
const ESSENTIAL_PLUGINS = [
  "skill-creator",
  "remember",
  "claude-md-management",
  "commit-commands",
  "code-review",
  "security-guidance",
];

// Role-specific plugin packs. Keys match the interactive role prompt.
const ROLE_PACKS = {
  engineer: ["github", "pr-review-toolkit", "semgrep", "playwright", "chrome-devtools-mcp", "typescript-lsp"],
  designer: ["figma", "frontend-design"],
  product: ["linear", "notion", "atlassian", "posthog"],
  marketing: ["searchfit-seo", "postiz", "mintlify"],
  sales: ["zoominfo", "slack", "atlassian"],
  ops: ["terraform", "deploy-on-aws", "sentry", "pagerduty", "railway"],
  finance: ["stripe"],
  data: ["data", "data-engineering", "supabase", "planetscale", "neon"],
  legal: ["legalzoom"],
  support: ["intercom", "sentry", "pagerduty"],
  devops: ["terraform", "aws-serverless", "vercel", "netlify-skills", "firebase", "sentry"],
  ai: ["huggingface-skills", "agent-sdk-dev", "mcp-server-dev", "fiftyone"],
  none: [],
};
const ROLE_KEYS = Object.keys(ROLE_PACKS);

const rl = createInterface({ input: stdin, output: stdout });
const ask = async (q, def) => {
  const suffix = def ? ` ${C.dim}(${def})${C.r}` : "";
  const a = (await rl.question(`${q}${suffix}: `)).trim();
  return a || def || "";
};
const confirm = async (q, defYes = true) => {
  const hint = defYes ? "Y/n" : "y/N";
  const a = (await rl.question(`${q} ${C.dim}[${hint}]${C.r} `))
    .trim()
    .toLowerCase();
  if (!a) return defYes;
  return a === "y" || a === "yes";
};

const runCapture = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  return { code: r.status ?? 1, out: (r.stdout || "") + (r.stderr || "") };
};

const runStream = (cmd, args) =>
  new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: "inherit" });
    p.on("close", (code) =>
      code === 0 ? res() : rej(new Error(`${cmd} exited ${code}`))
    );
  });

const has = (binary) => runCapture("which", [binary]).code === 0;

const BANNER = `
${C.magenta}╔═══════════════════════════════════════════════╗${C.r}
${C.magenta}║${C.r}  ${C.b}create-mcp-workspace${C.r}                         ${C.magenta}║${C.r}
${C.magenta}║${C.r}  Claude Code + Obsidian + qmd + LanceDB       ${C.magenta}║${C.r}
${C.magenta}╚═══════════════════════════════════════════════╝${C.r}
`;

async function main() {
  console.log(BANNER);

  // ─── STEP 1: Prereqs ──────────────────────────────────────────
  log.step(1, "Checking prerequisites");
  const needed = [
    ["node", true],
    ["npm", true],
    ["git", true],
  ];
  let missing = false;
  for (const [bin, required] of needed) {
    if (has(bin)) log.ok(`${bin} found`);
    else {
      log.fail(`${bin} missing`);
      if (required) missing = true;
    }
  }
  if (missing) {
    console.log(
      `\n${C.red}Install missing prerequisites first.${C.r} On macOS: install Homebrew, then \`brew install node git\`.`
    );
    exit(1);
  }
  if (platform === "darwin" && !has("brew")) {
    log.warn("brew not found — some optional steps will be skipped");
  }

  // ─── STEP 2: Collect settings ─────────────────────────────────
  log.step(2, "Workspace configuration");
  const name = await ask("Your name or handle", "operator");
  const workspaceDir = resolve(
    await ask("Workspace directory", join(homedir(), "claude-workspace"))
  );

  const hasObsidian = await confirm("Is Obsidian already installed?", true);
  let vaultPath = "";
  if (hasObsidian) {
    vaultPath = resolve(
      await ask(
        "Path to existing Obsidian vault (blank to create a starter vault)",
        ""
      )
    );
    if (vaultPath === resolve("")) vaultPath = "";
  }
  if (!vaultPath) {
    vaultPath = resolve(workspaceDir, "vault");
    log.info(`Will create starter vault at ${vaultPath}`);
  }

  const lancedbDir = resolve(workspaceDir, "lancedb");
  const qmdCollection = "workspace";

  const doInstallClaude = !has("claude")
    ? await confirm("Install Claude Code CLI globally?", true)
    : false;
  if (!doInstallClaude && !has("claude")) {
    log.warn("Claude Code not installed — MCP registration will be skipped");
  }

  const installMcps = await confirm(
    "Install search/vault tooling (obsidian-mcp-server, qmd, lance-mcp)?",
    true
  );
  const registerMcps =
    (has("claude") || doInstallClaude) &&
    installMcps &&
    (await confirm("Register MCPs with Claude Code?", true));
  const runEmbed =
    installMcps &&
    (await confirm(
      "Generate qmd embeddings now? (~500MB-1GB first-run model download, enables semantic search)",
      false
    ));

  // Role + extras — used by steps 8 and 9
  const role = (
    await ask(
      `Primary role (${ROLE_KEYS.join("/")})`,
      "none"
    )
  ).toLowerCase();
  const effectiveRole = ROLE_KEYS.includes(role) ? role : "none";
  if (role !== effectiveRole) {
    log.warn(`unknown role "${role}" — treating as "none"`);
  }

  const canBrew = platform === "darwin" && has("brew");
  const installCliExtras =
    canBrew &&
    (await confirm(
      `Install recommended CLIs via brew (${RECOMMENDED_CLIS.join(", ")})?`,
      true
    ));

  const canInstallPlugins = has("claude") || doInstallClaude;
  const installEssentialPlugins =
    canInstallPlugins &&
    (await confirm(
      `Install essential Claude Code plugins (${ESSENTIAL_PLUGINS.join(", ")})?`,
      true
    ));
  const installRolePlugins =
    canInstallPlugins &&
    effectiveRole !== "none" &&
    ROLE_PACKS[effectiveRole].length > 0 &&
    (await confirm(
      `Install ${effectiveRole} role pack (${ROLE_PACKS[effectiveRole].join(", ")})?`,
      true
    ));

  // ─── STEP 3: Create workspace ─────────────────────────────────
  log.step(3, "Creating workspace");
  mkdirSync(workspaceDir, { recursive: true });
  mkdirSync(lancedbDir, { recursive: true });
  mkdirSync(vaultPath, { recursive: true });
  log.ok(`workspace: ${workspaceDir}`);
  log.ok(`lancedb:   ${lancedbDir}`);
  log.ok(`vault:     ${vaultPath}`);

  // Seed starter vault if we created it
  const vaultHome = join(vaultPath, "Home.md");
  if (!existsSync(vaultHome)) {
    for (const dir of ["Projects", "Areas", "Resources", "Daily", "Imports"])
      mkdirSync(join(vaultPath, dir), { recursive: true });
    writeFileSync(vaultHome, starterHome(name));
    writeFileSync(join(vaultPath, "Projects", ".gitkeep"), "");
    log.ok("seeded starter vault (PARA layout)");
  }

  // ─── STEP 4: Claude Code ──────────────────────────────────────
  log.step(4, "Claude Code CLI");
  if (doInstallClaude) {
    await runStream("npm", ["install", "-g", "@anthropic-ai/claude-code"]);
    log.ok("installed @anthropic-ai/claude-code");
  } else if (has("claude")) {
    const v = runCapture("claude", ["--version"]).out.trim().split("\n")[0];
    log.ok(`already installed (${v})`);
  }

  // ─── STEP 5: Install CLIs + plugins ───────────────────────────
  log.step(5, "Search / vault tooling");
  // qmd — CLI from npm (canonical package published from github.com/tobi/qmd)
  //        PLUS native Claude Code plugin (Tobi's recommended integration)
  // obsidian-mcp-server + @iflow-mcp/lance-mcp — standard npm MCPs
  if (installMcps) {
    const npmPkgs = [
      { spec: "@tobilu/qmd", label: "qmd CLI (github.com/tobi/qmd)" },
      { spec: "obsidian-mcp-server", label: "obsidian-mcp-server" },
      { spec: "@iflow-mcp/lance-mcp", label: "@iflow-mcp/lance-mcp" },
    ];
    for (const { spec, label } of npmPkgs) {
      await runStream("npm", ["install", "-g", spec]);
      log.ok(`installed ${label}`);
    }

    // Install qmd's native Claude Code plugin — this wires the MCP server
    // automatically and avoids manual `claude mcp add qmd`.
    if (has("claude") || doInstallClaude) {
      runCapture("claude", ["plugin", "marketplace", "add", "tobi/qmd"]);
      const r = runCapture("claude", ["plugin", "install", "qmd@qmd"]);
      if (r.code === 0) log.ok("installed qmd Claude Code plugin");
      else log.warn(`qmd plugin install: ${r.out.trim().split("\n").pop()}`);
    }
  } else log.info("skipped tooling install");

  // ─── STEP 6: Register non-plugin MCPs ─────────────────────────
  log.step(6, "Register MCPs with Claude Code");
  // qmd is handled by its plugin above — only obsidian + lancedb need manual registration.
  if (registerMcps) {
    const mcpAdd = (name, cmd, args) => {
      runCapture("claude", ["mcp", "remove", name]);
      const r = runCapture("claude", ["mcp", "add", name, cmd, ...args]);
      if (r.code === 0) log.ok(`registered ${name}`);
      else log.fail(`register ${name}: ${r.out.trim()}`);
    };
    mcpAdd("obsidian", "npx", ["-y", "obsidian-mcp-server"]);
    mcpAdd("lancedb", "lance-mcp", [lancedbDir]);
    log.info("qmd MCP is wired by the Claude Code plugin (no manual add needed)");
  } else log.info("skipped MCP registration");

  // ─── STEP 7: qmd collection + context + embeddings ────────────
  log.step(7, "qmd collection setup");
  if (has("qmd")) {
    // Correct syntax: `qmd collection add <path> --name <name>`
    const add = runCapture("qmd", [
      "collection",
      "add",
      vaultPath,
      "--name",
      qmdCollection,
    ]);
    if (add.code === 0) {
      log.ok(`collection "${qmdCollection}" → ${vaultPath}`);
    } else {
      log.warn(
        `collection add failed — run manually: qmd collection add ${vaultPath} --name ${qmdCollection}`
      );
    }

    // Add a contextual description — Tobi flags this as the key feature for
    // LLM-driven search.
    const ctx = runCapture("qmd", [
      "context",
      "add",
      `qmd://${qmdCollection}`,
      `${name}'s knowledge vault — personal notes, projects, and imported context`,
    ]);
    if (ctx.code === 0) log.ok("collection context added");
    else log.info("context add skipped (non-fatal)");

    // Embed — downloads GGUF models (~500MB-1GB) on first run and builds the
    // vector index so vsearch/query work. Gated behind user confirmation.
    if (runEmbed) {
      log.info("running qmd embed (this will download models on first run)...");
      try {
        await runStream("qmd", ["embed"]);
        log.ok("embeddings generated");
      } catch (_) {
        log.warn("embed failed — run `qmd embed` manually later");
      }
    } else {
      log.info("skipped qmd embed — run `qmd embed` later to enable semantic search");
    }
  } else {
    log.info("qmd not on PATH — re-run after `npm install -g @tobilu/qmd`");
  }

  // ─── STEP 8: Recommended CLIs ─────────────────────────────────
  log.step(8, "Recommended CLIs");
  const installedClis = [];
  if (installCliExtras) {
    // brew install handles multiple packages in one call; tolerate already-installed.
    try {
      await runStream("brew", ["install", ...RECOMMENDED_CLIS]);
      for (const c of RECOMMENDED_CLIS) if (has(c) || has(c.replace("ripgrep", "rg"))) installedClis.push(c);
      log.ok(`brew install finished (${installedClis.length}/${RECOMMENDED_CLIS.length} present on PATH)`);
    } catch (_) {
      log.warn("brew install failed — some packages may need individual retry");
    }
  } else if (canBrew) {
    log.info("skipped recommended CLIs — run manually: brew install " + RECOMMENDED_CLIS.join(" "));
  } else {
    log.info(
      platform === "darwin"
        ? "brew not installed — skipping CLI extras"
        : "non-macOS — use your package manager for: " + RECOMMENDED_CLIS.join(" ")
    );
  }

  // ─── STEP 9: Claude Code plugins (essential + role pack) ──────
  log.step(9, "Claude Code plugins");
  const installedPlugins = [];
  if (canInstallPlugins) {
    const installPlugin = (plugin) => {
      const r = runCapture("claude", [
        "plugin",
        "install",
        `${plugin}@claude-plugins-official`,
      ]);
      if (r.code === 0) {
        installedPlugins.push(plugin);
        log.ok(`plugin: ${plugin}`);
      } else {
        log.warn(`plugin ${plugin}: ${r.out.trim().split("\n").pop()}`);
      }
    };
    if (installEssentialPlugins) {
      log.info("installing essentials...");
      for (const p of ESSENTIAL_PLUGINS) installPlugin(p);
    }
    if (installRolePlugins) {
      log.info(`installing ${effectiveRole} role pack...`);
      for (const p of ROLE_PACKS[effectiveRole]) installPlugin(p);
    }
    if (!installEssentialPlugins && !installRolePlugins) {
      log.info("skipped — pick plugins later via `claude plugin install <name>@claude-plugins-official`");
    }
  } else {
    log.info("Claude Code not available — skipping plugin step");
  }

  // ─── STEP 10: Seed workspace files ────────────────────────────
  log.step(10, "Seeding CLAUDE.md, MEMORY.md, welcome prompt");
  writeFileSync(
    join(workspaceDir, "CLAUDE.md"),
    renderClaudeMd({
      name,
      vaultPath,
      lancedbDir,
      qmdCollection,
      role: effectiveRole,
      installedClis,
      installedPlugins,
    })
  );
  log.ok("CLAUDE.md");
  writeFileSync(join(workspaceDir, "MEMORY.md"), renderMemoryMd());
  log.ok("MEMORY.md");
  writeFileSync(join(workspaceDir, ".env.example"), ENV_EXAMPLE);
  log.ok(".env.example");
  writeFileSync(join(workspaceDir, "welcome-prompt.md"), renderWelcomePrompt({ name, vaultPath }));
  log.ok("welcome-prompt.md");

  // Initial git init if not already a repo
  if (!existsSync(join(workspaceDir, ".git"))) {
    runCapture("git", ["-C", workspaceDir, "init", "-q"]);
    writeFileSync(join(workspaceDir, ".gitignore"), GITIGNORE);
    log.ok("git initialized");
  }

  // ─── Done ─────────────────────────────────────────────────────
  console.log(`\n${C.green}${C.b}Setup complete.${C.r}\n`);
  console.log(`${C.b}Next steps:${C.r}`);
  console.log(`  1. cd ${workspaceDir}`);
  console.log(`  2. Open Obsidian, then install the ${C.cyan}Local REST API${C.r} community plugin`);
  console.log(`     and paste the API key into your environment:`);
  console.log(`     ${C.dim}echo "OBSIDIAN_API_KEY=..." >> ~/.zshrc${C.r}`);
  console.log(`  3. ${C.b}claude${C.r}  ${C.dim}# start a session in this workspace${C.r}`);
  console.log(`  4. Paste the contents of ${C.cyan}welcome-prompt.md${C.r} as your first message.`);
  console.log(`\n${C.dim}Workspace: ${workspaceDir}${C.r}`);
  console.log(`${C.dim}Vault:     ${vaultPath}${C.r}`);
  console.log(`${C.dim}LanceDB:   ${lancedbDir}${C.r}`);
  rl.close();
}

// ─── Templates ──────────────────────────────────────────────────

const GITIGNORE = `.env
node_modules/
lancedb/
*.sqlite
*.log
.DS_Store
`;

const ENV_EXAMPLE = `# Obsidian Local REST API — install the plugin in Obsidian and paste its key
OBSIDIAN_API_KEY=
OBSIDIAN_BASE_URL=http://127.0.0.1:27123

# Anthropic (optional — Claude Code uses its own auth, but direct SDK calls need this)
ANTHROPIC_API_KEY=

# OpenAI (optional — for Whisper transcription, etc.)
OPENAI_API_KEY=
`;

const starterHome = (name) => `# ${name}'s Workspace

## Projects
- (add active initiatives here)

## Areas
- (ongoing responsibilities)

## Resources
- Prompts & Playbooks

## Daily Notes
- See \`Daily/\`

## Imports
- (drop external context dumps here)
`;

const renderClaudeMd = ({ name, vaultPath, lancedbDir, qmdCollection, role, installedClis, installedPlugins }) => `# Project Context — ${name}'s Workspace

## Who This Is For
${name} — primary user.

## Stack
| Component | Purpose | Path / Handle |
|-----------|---------|---------------|
| Claude Code | AI-native terminal | \`claude\` |
| Obsidian | Personal knowledge vault (PARA layout) | \`${vaultPath}\` |
| qmd | Local search engine over markdown | collection: \`${qmdCollection}\` |
| LanceDB | Vector store for embeddings / retrieval | \`${lancedbDir}\` |

## MCPs Registered
- \`obsidian\` — read/write vault (needs Local REST API plugin + key)
- \`lancedb\` — vector retrieval

## Claude Code Plugins
- \`qmd@qmd\` — Tobi Lütke's on-device hybrid search (BM25 + vector + LLM rerank), wires its own MCP. Collection \`${qmdCollection}\` → \`${vaultPath}\`. If semantic search misses, run \`qmd embed\` to download models + build the vector index.
${(installedPlugins?.length ?? 0) > 0 ? `\n### Installed from \`claude-plugins-official\`\n${installedPlugins.map((p) => `- \`${p}\``).join("\n")}\n` : ""}
## Primary Role
${role && role !== "none" ? `\`${role}\` — plugin recommendations weighted toward this role. See \`STACK.md\` in the onboarding repo for the full tier list.` : "Not set — run \`STACK.md\` to browse role-specific plugin packs and pick what fits."}

${(installedClis?.length ?? 0) > 0 ? `## CLIs Installed (brew)\n${installedClis.map((c) => `- \`${c}\``).join("\n")}\n` : ""}

## Architecture Rules
- Production-grade, not prototypes.
- Prefer editing existing files over creating new ones.
- Late-night/off-hours work is normal.
- Treat this CLAUDE.md + MEMORY.md as the durable context — everything else is ephemeral.

## Communication
- Direct, action-oriented.
- Scannable output (bullets, bold, short sections) over prose.
- Err low on estimates.

## Onboarding Queue
Tasks added here get picked up at the next session start:

\`\`\`markdown
## YYYY-MM-DD Queue
- [ ] TASK: Description | VERIFY: How to check
\`\`\`
`;

const renderMemoryMd = () => `- [Starter user profile](starter_user_profile.md) — replace with real profile on first session
- [Starter preferences](starter_preferences.md) — replace with real preferences on first session
`;

const renderWelcomePrompt = ({ name, vaultPath }) => `You are starting a fresh Claude Code session in ${name}'s workspace.

Stack available:
- Obsidian MCP (vault at ${vaultPath})
- qmd MCP (local search over the vault)
- LanceDB MCP (vector store)

First-run tasks:
1. Introduce yourself briefly and confirm which MCPs are connected.
2. Ask ${name} for:
   a. Their role / what they do day-to-day
   b. Their 1–3 top active projects (names, status, priorities)
   c. Any hard rules or preferences (communication style, what NOT to do)
3. For each answer, write a memory file to the Claude memory system AND a one-line pointer in MEMORY.md.
4. Offer to run a qmd semantic search across the vault to surface any existing context I should know about.
5. Confirm the workspace is ready and summarize what was set up.

Keep it short. No preambles. Action-first.
`;

main().catch((e) => {
  console.error(`\n${C.red}✗ fatal:${C.r} ${e.message}`);
  rl.close();
  exit(1);
});
