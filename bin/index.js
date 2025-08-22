#!/usr/bin/env node

/* 
 AUTHOR: @trustless-work / Joel Vargas
 COPYRIGHT: 2025 Trustless Work
 LICENSE: MIT
 VERSION: 1.0.0
*/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync, spawn } from "node:child_process";
import readline from "node:readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = process.cwd();
const TEMPLATES_DIR = path.join(__dirname, "..", "templates");
const GLOBAL_DEPS_FILE = path.join(TEMPLATES_DIR, "deps.json");

const args = process.argv.slice(2);

function detectPM() {
  if (fs.existsSync(path.join(PROJECT_ROOT, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(PROJECT_ROOT, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(PROJECT_ROOT, "bun.lockb"))) return "bun";
  return "npm";
}

function run(cmd, args) {
  const r = spawnSync(cmd, args.filter(Boolean), {
    stdio: "inherit",
    cwd: PROJECT_ROOT,
    shell: true,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function tryRun(cmd, args, errorMessage) {
  const r = spawnSync(cmd, args.filter(Boolean), {
    stdio: "inherit",
    cwd: PROJECT_ROOT,
    shell: true,
  });
  if (r.status !== 0) {
    console.error(errorMessage);
    process.exit(r.status ?? 1);
  }
}

async function runAsync(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args.filter(Boolean), {
      stdio: "inherit",
      cwd: PROJECT_ROOT,
      shell: true,
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  gray: "\x1b[90m",
  blueTW: "\x1b[38;2;0;107;228m",
};

function logCheck(message) {
  console.log(`${COLORS.green}✔${COLORS.reset} ${message}`);
}

function startSpinner(message) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  process.stdout.write(`${frames[0]} ${message}`);
  const timer = setInterval(() => {
    i = (i + 1) % frames.length;
    process.stdout.write(`\r${frames[i]} ${message}`);
  }, 80);
  return () => {
    clearInterval(timer);
    process.stdout.write("\r");
  };
}

async function withSpinner(message, fn) {
  const stop = startSpinner(message);
  try {
    await fn();
    stop();
    logCheck(message);
  } catch (err) {
    stop();
    throw err;
  }
}

async function promptYesNo(question, def = true) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const suffix = def ? "(Y/n)" : "(y/N)";
  const answer = await new Promise((res) =>
    rl.question(`${question} ${suffix} `, (ans) => res(ans))
  );
  rl.close();
  const a = String(answer).trim().toLowerCase();
  if (!a) return def;
  return a.startsWith("y");
}

function oscHyperlink(text, url) {
  return `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`;
}

function printBannerTRUSTLESSWORK() {
  const map = {
    T: ["******", "  **  ", "  **  ", "  **  ", "  **  "],
    R: ["***** ", "**  **", "***** ", "** ** ", "**  **"],
    U: ["**  **", "**  **", "**  **", "**  **", " **** "],
    S: [" **** ", "**    ", " **** ", "    **", " **** "],
    L: ["**    ", "**    ", "**    ", "**    ", "******"],
    E: ["******", "**    ", "***** ", "**    ", "******"],
    W: ["**   **", "**   **", "** * **", "*** ***", "**   **"],
    O: [" **** ", "**  **", "**  **", "**  **", " **** "],
    K: ["**  **", "** ** ", "****  ", "** ** ", "**  **"],
    " ": ["   ", "   ", "   ", "   ", "   "],
  };
  const text = "TRUSTLESS WORK";
  const rows = ["", "", "", "", ""];
  for (const ch of text) {
    const glyph = map[ch] || map[" "];
    for (let i = 0; i < 5; i++) {
      rows[i] += glyph[i] + " ";
    }
  }
  console.log("\n\n");
  for (const line of rows) {
    console.log(`${COLORS.blueTW}${line}${COLORS.reset}`);
  }
}

function readProjectPackageJson() {
  const pkgPath = path.join(PROJECT_ROOT, "package.json");
  if (!fs.existsSync(pkgPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  } catch {
    return null;
  }
}

function installDeps({ dependencies = {}, devDependencies = {} }) {
  const pm = detectPM();
  const BLOCKED = new Set([
    "tailwindcss",
    "@tailwindcss/cli",
    "@tailwindcss/postcss",
    "@tailwindcss/vite",
    "postcss",
    "autoprefixer",
    "postcss-import",
  ]);
  const depList = Object.entries(dependencies)
    .filter(([k]) => !BLOCKED.has(k))
    .map(([k, v]) => `${k}@${v}`);
  const devList = Object.entries(devDependencies)
    .filter(([k]) => !BLOCKED.has(k))
    .map(([k, v]) => `${k}@${v}`);

  if (depList.length) {
    if (pm === "pnpm") run("pnpm", ["add", ...depList]);
    else if (pm === "yarn") run("yarn", ["add", ...depList]);
    else if (pm === "bun") run("bun", ["add", ...depList]);
    else run("npm", ["install", ...depList]);
  }

  if (devList.length) {
    if (pm === "pnpm") run("pnpm", ["add", "-D", ...devList]);
    else if (pm === "yarn") run("yarn", ["add", "-D", ...devList]);
    else if (pm === "bun") run("bun", ["add", "-d", ...devList]);
    else run("npm", ["install", "-D", ...devList]);
  }
}

function loadConfig() {
  const cfgPath = path.join(PROJECT_ROOT, ".twblocks.json");
  if (fs.existsSync(cfgPath)) {
    try {
      return JSON.parse(fs.readFileSync(cfgPath, "utf8"));
    } catch (e) {
      console.warn("⚠️  Failed to parse .twblocks.json, ignoring.");
    }
  }
  return {};
}

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--ui-base=")) {
      flags.uiBase = a.split("=").slice(1).join("=");
    } else if (a === "--ui-base") {
      flags.uiBase = argv[i + 1];
      i++;
    } else if (a === "--install" || a === "-i") {
      flags.install = true;
    }
  }
  return flags;
}

function copyTemplate(name, { uiBase, shouldInstall = false } = {}) {
  const srcFile = path.join(TEMPLATES_DIR, `${name}.tsx`);
  const srcDir = path.join(TEMPLATES_DIR, name);
  const outRoot = path.join(PROJECT_ROOT, "src", "components", "tw-blocks");

  const config = loadConfig();
  const effectiveUiBase = uiBase || config.uiBase || "@/components/ui";

  function writeTransformed(srcPath, destPath) {
    const raw = fs.readFileSync(srcPath, "utf8");
    const transformed = raw.replaceAll("__UI_BASE__", effectiveUiBase);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, transformed, "utf8");
    console.log(`✅ ${path.relative(PROJECT_ROOT, destPath)} created`);
  }

  if (fs.existsSync(srcDir) && fs.lstatSync(srcDir).isDirectory()) {
    // Copy directory recursively
    const destDir = path.join(outRoot, name);
    fs.mkdirSync(destDir, { recursive: true });
    const stack = [""];
    while (stack.length) {
      const rel = stack.pop();
      const current = path.join(srcDir, rel);
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const entryRel = path.join(rel, entry.name);
        const entrySrc = path.join(srcDir, entryRel);
        const entryDest = path.join(destDir, entryRel);
        if (entry.isDirectory()) {
          stack.push(entryRel);
          continue;
        }
        // Only process text files (.ts, .tsx, .js, .jsx)
        if (/\.(tsx?|jsx?)$/i.test(entry.name)) {
          writeTransformed(entrySrc, entryDest);
        } else {
          fs.mkdirSync(path.dirname(entryDest), { recursive: true });
          fs.copyFileSync(entrySrc, entryDest);
          console.log(`✅ ${path.relative(PROJECT_ROOT, entryDest)} created`);
        }
      }
    }
  } else if (fs.existsSync(srcFile)) {
    fs.mkdirSync(outRoot, { recursive: true });
    const destFile = path.join(outRoot, name + ".tsx");
    writeTransformed(srcFile, destFile);
  } else {
    console.error(`❌ The template "${name}" does not exist`);
    process.exit(1);
  }

  if (shouldInstall && fs.existsSync(GLOBAL_DEPS_FILE)) {
    const meta = JSON.parse(fs.readFileSync(GLOBAL_DEPS_FILE, "utf8"));
    installDeps(meta);
  }
}

function findLayoutFile() {
  const candidates = [
    path.join(PROJECT_ROOT, "app", "layout.tsx"),
    path.join(PROJECT_ROOT, "app", "layout.ts"),
    path.join(PROJECT_ROOT, "app", "layout.jsx"),
    path.join(PROJECT_ROOT, "app", "layout.js"),
    path.join(PROJECT_ROOT, "src", "app", "layout.tsx"),
    path.join(PROJECT_ROOT, "src", "app", "layout.ts"),
    path.join(PROJECT_ROOT, "src", "app", "layout.jsx"),
    path.join(PROJECT_ROOT, "src", "app", "layout.js"),
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

function injectProvidersIntoLayout(layoutPath) {
  try {
    let content = fs.readFileSync(layoutPath, "utf8");

    const importRQ =
      'import ReactQueryClientProvider from "@/components/tw-blocks/providers/ReactQueryClientProvider";\n';
    const importTW =
      'import { TrustlessWorkProvider } from "@/components/tw-blocks/providers/TrustlessWork";\n';
    const commentText =
      "// Use these providers to wrap your application  (<ReactQueryClientProvider> y <TrustlessWorkProvider>)\n";

    const hasImportRQ =
      /import\s+[^;]*ReactQueryClientProvider[^;]*from\s+['\"][^'\"]+['\"];?/.test(
        content
      );
    const hasImportTW =
      /import\s+[^;]*TrustlessWorkProvider[^;]*from\s+['\"][^'\"]+['\"];?/.test(
        content
      );
    const hasProvidersComment =
      /Use these providers to wrap your application/.test(content);

    let importsToAdd = "";
    if (!hasImportRQ) importsToAdd += importRQ;
    if (!hasImportTW) importsToAdd += importTW;
    if (importsToAdd) {
      const importStmtRegex = /^import.*;\s*$/gm;
      let last = null;
      for (const m of content.matchAll(importStmtRegex)) last = m;
      if (last) {
        const idx = last.index + last[0].length;
        content =
          content.slice(0, idx) +
          "\n" +
          importsToAdd +
          commentText +
          content.slice(idx);
      } else {
        content = importsToAdd + commentText + content;
      }
    } else if (!hasProvidersComment) {
      // Imports already exist; ensure the comment is present just after the last import
      const importStmtRegex = /^import.*;\s*$/gm;
      let last = null;
      for (const m of content.matchAll(importStmtRegex)) last = m;
      if (last) {
        const idx = last.index + last[0].length;
        content =
          content.slice(0, idx) + "\n" + commentText + content.slice(idx);
      }
    }

    const hasUsageRQ = /<ReactQueryClientProvider[\s>]/.test(content);
    const hasUsageTW = /<TrustlessWorkProvider[\s>]/.test(content);

    if (!hasUsageRQ && !hasUsageTW) {
      const openMatch = content.match(/<body[^>]*>/);
      const closeIdx = content.lastIndexOf("</body>");
      if (openMatch && closeIdx !== -1) {
        const openIdx = openMatch.index + openMatch[0].length;
        content =
          content.slice(0, openIdx) +
          "\n<ReactQueryClientProvider>\n<TrustlessWorkProvider>\n" +
          content.slice(openIdx, closeIdx) +
          "\n</TrustlessWorkProvider>\n</ReactQueryClientProvider>\n" +
          content.slice(closeIdx);
      }
    }

    fs.writeFileSync(layoutPath, content, "utf8");
    logCheck(
      `Updated ${path.relative(PROJECT_ROOT, layoutPath)} with providers`
    );
  } catch (e) {
    console.error("❌ Failed to update layout with providers:", e.message);
  }
}

if (args[0] === "init") {
  console.log("\n▶ Setting up shadcn/ui components...");
  const doInit = await promptYesNo("Run shadcn init now?", true);
  if (doInit) {
    run("npx", ["shadcn@latest", "init"]);
  } else {
    console.log("\x1b[90m– Skipped shadcn init\x1b[0m");
  }

  const addShadcn = await promptYesNo(
    "Add shadcn components (button, input, form, card, sonner, checkbox, dialog, textarea, sonner, select, table, calendar, popover, separator, calendar-05)?",
    true
  );
  if (addShadcn) {
    await withSpinner("Installing shadcn/ui components", async () => {
      await runAsync("npx", [
        "shadcn@latest",
        "add",
        "button",
        "input",
        "form",
        "card",
        "sonner",
        "checkbox",
        "dialog",
        "textarea",
        "sonner",
        "select",
        "table",
        "calendar",
        "popover",
        "separator",
        "calendar-05",
      ]);
    });
  } else {
    console.log("\x1b[90m– Skipped adding shadcn components\x1b[0m");
  }

  if (!fs.existsSync(GLOBAL_DEPS_FILE)) {
    console.error("❌ deps.json not found in templates/");
    process.exit(1);
  }
  const meta = JSON.parse(fs.readFileSync(GLOBAL_DEPS_FILE, "utf8"));
  const installLibs = await promptYesNo(
    "Install (react-hook-form, zod, @tanstack/react-query, @tanstack/react-query-devtools, @trustless-work/escrow, @hookform/resolvers, axios, @creit.tech/stellar-wallets-kit, react-day-picker & zod) dependencies now?",
    true
  );
  if (installLibs) {
    await withSpinner("Installing required dependencies", async () => {
      installDeps(meta);
    });
  } else {
    console.log("\x1b[90m– Skipped installing required dependencies\x1b[0m");
  }
  const cfgPath = path.join(PROJECT_ROOT, ".twblocks.json");
  if (!fs.existsSync(cfgPath)) {
    fs.writeFileSync(
      cfgPath,
      JSON.stringify({ uiBase: "@/components/ui" }, null, 2)
    );
    console.log(
      `\x1b[32m✔\x1b[0m Created ${path.relative(
        PROJECT_ROOT,
        cfgPath
      )} with default uiBase`
    );
  }
  console.log("\x1b[32m✔\x1b[0m shadcn/ui components step completed");

  const wantProviders = await promptYesNo(
    "Install TanStack Query and Trustless Work providers and wire app/layout?",
    true
  );
  if (wantProviders) {
    await withSpinner("Installing providers", async () => {
      copyTemplate("providers");
    });
    const layoutPath = findLayoutFile();
    if (layoutPath) {
      await withSpinner("Updating app/layout with providers", async () => {
        injectProvidersIntoLayout(layoutPath);
      });
    } else {
      console.warn(
        "⚠️  Could not find app/layout file. Skipped automatic wiring."
      );
    }
  } else {
    console.log("\x1b[90m– Skipped installing providers\x1b[0m");
  }

  printBannerTRUSTLESSWORK();
  console.log("\n\nResources");
  console.log("- " + oscHyperlink("Website", "https://trustlesswork.com"));
  console.log(
    "- " + oscHyperlink("Documentation", "https://docs.trustlesswork.com")
  );
  console.log("- " + oscHyperlink("Demo", "https://demo.trustlesswork.com"));
  console.log(
    "- " + oscHyperlink("Backoffice", "https://dapp.trustlesswork.com")
  );
  console.log(
    "- " + oscHyperlink("GitHub", "https://github.com/trustless-work")
  );
  console.log(
    "- " + oscHyperlink("Escrow Viewer", "https://viewer.trustlesswork.com")
  );
  console.log(
    "- " + oscHyperlink("Telegram", "https://t.me/+kmr8tGegxLU0NTA5")
  );
  console.log(
    "- " +
      oscHyperlink(
        "LinkedIn",
        "https://www.linkedin.com/company/trustlesswork/posts/?feedView=all"
      )
  );
  console.log("- " + oscHyperlink("X", "https://x.com/TrustlessWork"));
} else if (args[0] === "add" && args[1]) {
  const flags = parseFlags(args.slice(2));
  const cfgPath = path.join(PROJECT_ROOT, ".twblocks.json");
  if (!fs.existsSync(cfgPath)) {
    console.error(
      "❌ Missing initial setup. Run 'trustless-work init' first to install dependencies and create .twblocks.json (uiBase)."
    );
    console.error(
      "   After init, re-run: trustless-work add " +
        args[1] +
        (flags.uiBase ? ' --ui-base "' + flags.uiBase + '"' : "")
    );
    process.exit(1);
  }
  copyTemplate(args[1], {
    uiBase: flags.uiBase,
    shouldInstall: !!flags.install,
  });
} else {
  console.log(`
  
  Usage:

  trustless-work init
  trustless-work add <template> [--install]
  
  Options:

  --ui-base <path>      Base import path to your shadcn/ui components (default: "@/components/ui")
  --install, -i         Also install dependencies (normally use 'init' once instead)

  Examples:

  --- Get started ---
  trustless-work init

  --- Providers ---
  trustless-work add providers

  --- Wallet-kit ---
  trustless-work add wallet-kit

  --- Handle-errors ---
  trustless-work add handle-errors

  --- Tanstack ---
  trustless-work add tanstak

  --- Escrows ---
  trustless-work add escrows

  --- Escrow context ---
  trustless-work add escrows/escrow-context

  --- Escrows by role ---
  trustless-work add escrows/escrows-by-role
  trustless-work add escrows/escrows-by-role/table
  trustless-work add escrows/escrows-by-role/cards

  --- Escrows by signer ---
  trustless-work add escrows/escrows-by-signer
  trustless-work add escrows/escrows-by-signer/table
  trustless-work add escrows/escrows-by-signer/cards

  ----------------------
  --- SINGLE-RELEASE ---
  trustless-work add escrows/single-release

  --- Initialize escrow ---
  - trustless-work add escrows/single-release/initialize-escrow

  --- Fund escrow ---
  - trustless-work add escrows/single-release/fund-escrow
  - trustless-work add escrows/single-release/fund-escrow/form
  - trustless-work add escrows/single-release/fund-escrow/button
  - trustless-work add escrows/single-release/fund-escrow/dialog

  ---------------------
  --- MULTI-RELEASE ---
  trustless-work add escrows/multi-release
  
   --- Initialize escrow ---
  - trustless-work add escrows/multi-release/initialize-escrow

  --- Fund escrow ---
  - trustless-work add escrows/multi-release/fund-escrow
  - trustless-work add escrows/multi-release/fund-escrow/form
  - trustless-work add escrows/multi-release/fund-escrow/button
  - trustless-work add escrows/multi-release/fund-escrow/dialog
`);
}
