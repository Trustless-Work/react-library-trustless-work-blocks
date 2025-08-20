#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

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

function installDeps({ dependencies = {}, devDependencies = {} }) {
  const pm = detectPM();
  const depList = Object.entries(dependencies).map(([k, v]) => `${k}@${v}`);
  const devList = Object.entries(devDependencies).map(([k, v]) => `${k}@${v}`);

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
    }
  }
  return flags;
}

function copyTemplate(name, { uiBase } = {}) {
  const srcFile = path.join(TEMPLATES_DIR, `${name}.tsx`);
  const srcDir = path.join(TEMPLATES_DIR, name);
  const outRoot = path.join(PROJECT_ROOT, "components", "tw-blocks");

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
    const destFile = path.join(outRoot, name + ".tsx");
    writeTransformed(srcFile, destFile);
  } else {
    console.error(`❌ The template "${name}" does not exist`);
    process.exit(1);
  }

  if (fs.existsSync(GLOBAL_DEPS_FILE)) {
    const meta = JSON.parse(fs.readFileSync(GLOBAL_DEPS_FILE, "utf8"));
    installDeps(meta);
  }
}

if (args[0] === "add" && args[1]) {
  const flags = parseFlags(args.slice(2));
  copyTemplate(args[1], { uiBase: flags.uiBase });
} else {
  console.log(`
Usage:
  trustless-work add <template>
Options:
  --ui-base <path>      Base import path to your shadcn/ui components (default: "@/components/ui")

Examples:
  trustless-work add ui/Button
  trustless-work add forms/Form1
  trustless-work add ui/Button --ui-base "@/components/ui"
  trustless-work add forms/InitializeEscrow --ui-base "@/components/ui"
  trustless-work add single-release/fund-escrow --ui-base "@/components/ui"
`);
}
