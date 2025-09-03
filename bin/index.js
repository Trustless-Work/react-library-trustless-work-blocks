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
  const requestedDir = path.join(TEMPLATES_DIR, name);
  let srcDir = null;
  if (fs.existsSync(requestedDir) && fs.lstatSync(requestedDir).isDirectory()) {
    srcDir = requestedDir;
  } else {
    // Alias: allow multi-release/approve-milestone to fallback to existing source
    if (name.startsWith("escrows/multi-release/approve-milestone")) {
      const altMulti = path.join(
        TEMPLATES_DIR,
        "escrows",
        "multi-release",
        "approve-milestone"
      );
      const altSingle = path.join(
        TEMPLATES_DIR,
        "escrows",
        "single-release",
        "approve-milestone"
      );
      if (fs.existsSync(altMulti) && fs.lstatSync(altMulti).isDirectory()) {
        srcDir = altMulti;
      } else if (
        fs.existsSync(altSingle) &&
        fs.lstatSync(altSingle).isDirectory()
      ) {
        srcDir = altSingle;
      }
    }
  }
  const outRoot = path.join(PROJECT_ROOT, "src", "components", "tw-blocks");

  const config = loadConfig();
  const effectiveUiBase = uiBase || config.uiBase || "@/components/ui";
  let currentEscrowType = null;

  function writeTransformed(srcPath, destPath) {
    const raw = fs.readFileSync(srcPath, "utf8");
    let transformed = raw.replaceAll("__UI_BASE__", effectiveUiBase);
    // Resolve details placeholders to either multi-release modules (if present) or local compat
    const applyDetailsPlaceholders = (content) => {
      const resolveImport = (segments, compatFile) => {
        const realWithExt = path.join(
          outRoot,
          "escrows",
          "multi-release",
          ...segments
        );
        const realCandidate = [
          realWithExt,
          realWithExt + ".tsx",
          realWithExt + ".ts",
          realWithExt + ".jsx",
          realWithExt + ".js",
        ].find((p) => fs.existsSync(p));
        const realNoExt = realCandidate
          ? realCandidate.replace(/\.(tsx|ts|jsx|js)$/i, "")
          : null;
        const compatWithExt = path.join(
          path.dirname(destPath),
          "compat",
          compatFile
        );
        const compatCandidate = [
          compatWithExt,
          compatWithExt + ".tsx",
          compatWithExt + ".ts",
          compatWithExt + ".jsx",
          compatWithExt + ".js",
        ].find((p) => fs.existsSync(p));
        const compatNoExt = (compatCandidate || compatWithExt).replace(
          /\.(tsx|ts|jsx|js)$/i,
          ""
        );
        const target = realNoExt || compatNoExt;
        let rel = path.relative(path.dirname(destPath), target);
        rel = rel.split(path.sep).join("/");
        if (!rel.startsWith(".")) rel = "./" + rel;
        return rel;
      };
      return content
        .replaceAll(
          "__MR_RELEASE_MODULE__",
          resolveImport(
            ["release-escrow", "button", "ReleaseEscrow"],
            "ReleaseEscrow"
          )
        )
        .replaceAll(
          "__MR_DISPUTE_MODULE__",
          resolveImport(
            ["dispute-escrow", "button", "DisputeEscrow"],
            "DisputeEscrow"
          )
        )
        .replaceAll(
          "__MR_RESOLVE_MODULE__",
          resolveImport(
            ["resolve-dispute", "dialog", "ResolveDispute"],
            "ResolveDispute"
          )
        );
    };
    transformed = applyDetailsPlaceholders(transformed);
    if (currentEscrowType) {
      transformed = transformed.replaceAll(
        "__ESCROW_TYPE__",
        currentEscrowType
      );
    }
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, transformed, "utf8");
    console.log(`✅ ${path.relative(PROJECT_ROOT, destPath)} created`);
  }

  // Generic: materialize any module from templates/escrows/shared/<module>
  if (!srcDir) {
    const m = name.match(
      /^escrows\/(single-release|multi-release)\/([^\/]+)(?:\/(button|dialog|form))?$/
    );
    if (m) {
      const releaseType = m[1];
      const moduleName = m[2];
      const variant = m[3] || null;

      const sharedModuleDir = path.join(
        TEMPLATES_DIR,
        "escrows",
        "shared",
        moduleName
      );

      if (
        fs.existsSync(sharedModuleDir) &&
        fs.lstatSync(sharedModuleDir).isDirectory()
      ) {
        currentEscrowType = releaseType;
        const destBase = path.join(outRoot, "escrows", releaseType, moduleName);

        function copyModuleRootFilesInto(targetDir) {
          const entries = fs.readdirSync(sharedModuleDir, {
            withFileTypes: true,
          });
          for (const entry of entries) {
            if (entry.isDirectory()) continue;
            if (!/\.(tsx?|jsx?)$/i.test(entry.name)) continue;
            const entrySrc = path.join(sharedModuleDir, entry.name);
            const entryDest = path.join(targetDir, entry.name);
            writeTransformed(entrySrc, entryDest);
          }
        }

        function copyVariant(variantName) {
          const variantSrc = path.join(sharedModuleDir, variantName);
          const variantDest = path.join(destBase, variantName);
          fs.mkdirSync(variantDest, { recursive: true });
          if (
            fs.existsSync(variantSrc) &&
            fs.lstatSync(variantSrc).isDirectory()
          ) {
            const stack = [""];
            while (stack.length) {
              const rel = stack.pop();
              const current = path.join(variantSrc, rel);
              const entries = fs.readdirSync(current, { withFileTypes: true });
              for (const entry of entries) {
                const entryRel = path.join(rel, entry.name);
                const entrySrc = path.join(variantSrc, entryRel);
                const entryDest = path.join(variantDest, entryRel);
                if (entry.isDirectory()) {
                  stack.push(entryRel);
                  continue;
                }
                if (/\.(tsx?|jsx?)$/i.test(entry.name)) {
                  writeTransformed(entrySrc, entryDest);
                } else {
                  fs.mkdirSync(path.dirname(entryDest), { recursive: true });
                  fs.copyFileSync(entrySrc, entryDest);
                  console.log(
                    `✅ ${path.relative(PROJECT_ROOT, entryDest)} created`
                  );
                }
              }
            }
          }
          // Always place module-level shared files into the variant directory
          copyModuleRootFilesInto(variantDest);
        }

        if (variant) {
          copyVariant(variant);
        } else {
          const variants = ["button", "dialog", "form"];
          for (const v of variants) copyVariant(v);
        }

        if (shouldInstall && fs.existsSync(GLOBAL_DEPS_FILE)) {
          const meta = JSON.parse(fs.readFileSync(GLOBAL_DEPS_FILE, "utf8"));
          installDeps(meta);
        }
        currentEscrowType = null;
        return;
      }
    }
  }

  if (fs.existsSync(srcDir) && fs.lstatSync(srcDir).isDirectory()) {
    const skipDetails =
      name === "escrows/escrows-by-role" ||
      name === "escrows/escrows-by-signer" ||
      name === "escrows";
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
        // Skip copying any shared directory at any depth
        const parts = entryRel.split(path.sep);
        if (parts.includes("shared")) {
          continue;
        }
        if (skipDetails) {
          const top = parts[0] || "";
          const firstTwo = parts.slice(0, 2).join(path.sep);
          if (
            top === "details" ||
            firstTwo === path.join("escrows-by-role", "details") ||
            firstTwo === path.join("escrows-by-signer", "details")
          ) {
            continue;
          }
        }
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

    // Post-copy: materialize shared initialize-escrow files into dialog/form
    try {
      const isSingleReleaseInitRoot =
        name === "escrows/single-release/initialize-escrow";
      const isSingleReleaseInitDialog =
        name === "escrows/single-release/initialize-escrow/dialog";
      const isSingleReleaseInitForm =
        name === "escrows/single-release/initialize-escrow/form";

      const srcSharedDir = path.join(
        TEMPLATES_DIR,
        "escrows",
        "single-release",
        "initialize-escrow",
        "shared"
      );

      function copySharedInto(targetDir) {
        if (!fs.existsSync(srcSharedDir)) return;
        const entries = fs.readdirSync(srcSharedDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!/\.(tsx?|jsx?)$/i.test(entry.name)) continue;
          const entrySrc = path.join(srcSharedDir, entry.name);
          const entryDest = path.join(targetDir, entry.name);
          writeTransformed(entrySrc, entryDest);
        }
      }

      if (isSingleReleaseInitRoot) {
        copySharedInto(path.join(destDir, "dialog"));
        copySharedInto(path.join(destDir, "form"));
      } else if (isSingleReleaseInitDialog) {
        copySharedInto(destDir);
      } else if (isSingleReleaseInitForm) {
        copySharedInto(destDir);
      }
    } catch (e) {
      console.warn(
        "⚠️  Failed to materialize shared initialize-escrow files:",
        e?.message || e
      );
    }

    try {
      const isSRRoot = name === "escrows/single-release/approve-milestone";
      const isSRDialog =
        name === "escrows/single-release/approve-milestone/dialog";
      const isSRForm = name === "escrows/single-release/approve-milestone/form";

      const isMRRoot = name === "escrows/multi-release/approve-milestone";
      const isMRDialog =
        name === "escrows/multi-release/approve-milestone/dialog";
      const isMRForm = name === "escrows/multi-release/approve-milestone/form";

      const srcSharedDir = path.join(
        TEMPLATES_DIR,
        "escrows",
        "shared",
        "approve-milestone",
        "shared"
      );

      function copySharedInto(targetDir) {
        if (!fs.existsSync(srcSharedDir)) return;
        const entries = fs.readdirSync(srcSharedDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!/\.(tsx?|jsx?)$/i.test(entry.name)) continue;
          const entrySrc = path.join(srcSharedDir, entry.name);
          const entryDest = path.join(targetDir, entry.name);
          writeTransformed(entrySrc, entryDest);
        }
      }

      if (isSRRoot || isMRRoot) {
        copySharedInto(path.join(destDir, "dialog"));
        copySharedInto(path.join(destDir, "form"));
      } else if (isSRDialog || isMRDialog) {
        copySharedInto(destDir);
      } else if (isSRForm || isMRForm) {
        copySharedInto(destDir);
      }
    } catch (e) {
      console.warn(
        "⚠️  Failed to materialize shared approve-milestone files:",
        e?.message || e
      );
    }

    try {
      const isSingleReleaseInitRoot =
        name === "escrows/single-release/change-milestone-status";
      const isSingleReleaseInitDialog =
        name === "escrows/single-release/change-milestone-status/dialog";
      const isSingleReleaseInitForm =
        name === "escrows/single-release/change-milestone-status/form";

      const srcSharedDir = path.join(
        TEMPLATES_DIR,
        "escrows",
        "single-release",
        "change-milestone-status",
        "shared"
      );

      function copySharedInto(targetDir) {
        if (!fs.existsSync(srcSharedDir)) return;
        const entries = fs.readdirSync(srcSharedDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!/\.(tsx?|jsx?)$/i.test(entry.name)) continue;
          const entrySrc = path.join(srcSharedDir, entry.name);
          const entryDest = path.join(targetDir, entry.name);
          writeTransformed(entrySrc, entryDest);
        }
      }

      if (isSingleReleaseInitRoot) {
        copySharedInto(path.join(destDir, "dialog"));
        copySharedInto(path.join(destDir, "form"));
      } else if (isSingleReleaseInitDialog) {
        copySharedInto(destDir);
      } else if (isSingleReleaseInitForm) {
        copySharedInto(destDir);
      }
    } catch (e) {
      console.warn(
        "⚠️  Failed to materialize shared change-milestone-status files:",
        e?.message || e
      );
    }

    try {
      const isSingleReleaseInitRoot =
        name === "escrows/single-release/fund-escrow";
      const isSingleReleaseInitDialog =
        name === "escrows/single-release/fund-escrow/dialog";
      const isSingleReleaseInitForm =
        name === "escrows/single-release/fund-escrow/form";

      const srcSharedDir = path.join(
        TEMPLATES_DIR,
        "escrows",
        "single-release",
        "fund-escrow",
        "shared"
      );

      function copySharedInto(targetDir) {
        if (!fs.existsSync(srcSharedDir)) return;
        const entries = fs.readdirSync(srcSharedDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!/\.(tsx?|jsx?)$/i.test(entry.name)) continue;
          const entrySrc = path.join(srcSharedDir, entry.name);
          const entryDest = path.join(targetDir, entry.name);
          writeTransformed(entrySrc, entryDest);
        }
      }

      if (isSingleReleaseInitRoot) {
        copySharedInto(path.join(destDir, "dialog"));
        copySharedInto(path.join(destDir, "form"));
      } else if (isSingleReleaseInitDialog) {
        copySharedInto(destDir);
      } else if (isSingleReleaseInitForm) {
        copySharedInto(destDir);
      }
    } catch (e) {
      console.warn(
        "⚠️  Failed to materialize shared fund-escrow files:",
        e?.message || e
      );
    }

    try {
      const isSingleReleaseInitRoot =
        name === "escrows/single-release/resolve-dispute";
      const isSingleReleaseInitDialog =
        name === "escrows/single-release/resolve-dispute/dialog";
      const isSingleReleaseInitForm =
        name === "escrows/single-release/resolve-dispute/form";

      const srcSharedDir = path.join(
        TEMPLATES_DIR,
        "escrows",
        "single-release",
        "resolve-dispute",
        "shared"
      );

      function copySharedInto(targetDir) {
        if (!fs.existsSync(srcSharedDir)) return;
        const entries = fs.readdirSync(srcSharedDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!/\.(tsx?|jsx?)$/i.test(entry.name)) continue;
          const entrySrc = path.join(srcSharedDir, entry.name);
          const entryDest = path.join(targetDir, entry.name);
          writeTransformed(entrySrc, entryDest);
        }
      }

      if (isSingleReleaseInitRoot) {
        copySharedInto(path.join(destDir, "dialog"));
        copySharedInto(path.join(destDir, "form"));
      } else if (isSingleReleaseInitDialog) {
        copySharedInto(destDir);
      } else if (isSingleReleaseInitForm) {
        copySharedInto(destDir);
      }
    } catch (e) {
      console.warn(
        "⚠️  Failed to materialize shared resolve-dispute files:",
        e?.message || e
      );
    }

    try {
      const isSingleReleaseInitRoot =
        name === "escrows/single-release/update-escrow";
      const isSingleReleaseInitDialog =
        name === "escrows/single-release/update-escrow/dialog";
      const isSingleReleaseInitForm =
        name === "escrows/single-release/update-escrow/form";

      const srcSharedDir = path.join(
        TEMPLATES_DIR,
        "escrows",
        "single-release",
        "update-escrow",
        "shared"
      );

      function copySharedInto(targetDir) {
        if (!fs.existsSync(srcSharedDir)) return;
        const entries = fs.readdirSync(srcSharedDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!/\.(tsx?|jsx?)$/i.test(entry.name)) continue;
          const entrySrc = path.join(srcSharedDir, entry.name);
          const entryDest = path.join(targetDir, entry.name);
          writeTransformed(entrySrc, entryDest);
        }
      }

      if (isSingleReleaseInitRoot) {
        copySharedInto(path.join(destDir, "dialog"));
        copySharedInto(path.join(destDir, "form"));
      } else if (isSingleReleaseInitDialog) {
        copySharedInto(destDir);
      } else if (isSingleReleaseInitForm) {
        copySharedInto(destDir);
      }
    } catch (e) {
      console.warn(
        "⚠️  Failed to materialize shared update-escrow files:",
        e?.message || e
      );
    }

    // Post-copy: materialize shared files for multi-release modules
    try {
      const isMultiInitRoot =
        name === "escrows/multi-release/initialize-escrow";
      const isMultiInitDialog =
        name === "escrows/multi-release/initialize-escrow/dialog";
      const isMultiInitForm =
        name === "escrows/multi-release/initialize-escrow/form";

      const srcSharedDir = path.join(
        TEMPLATES_DIR,
        "escrows",
        "multi-release",
        "initialize-escrow",
        "shared"
      );

      function copyMultiInitSharedInto(targetDir) {
        if (!fs.existsSync(srcSharedDir)) return;
        const entries = fs.readdirSync(srcSharedDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!/\.(tsx?|jsx?)$/i.test(entry.name)) continue;
          const entrySrc = path.join(srcSharedDir, entry.name);
          const entryDest = path.join(targetDir, entry.name);
          writeTransformed(entrySrc, entryDest);
        }
      }

      if (isMultiInitRoot) {
        copyMultiInitSharedInto(path.join(destDir, "dialog"));
        copyMultiInitSharedInto(path.join(destDir, "form"));
      } else if (isMultiInitDialog) {
        copyMultiInitSharedInto(destDir);
      } else if (isMultiInitForm) {
        copyMultiInitSharedInto(destDir);
      }
    } catch (e) {
      console.warn(
        "⚠️  Failed to materialize shared multi-release initialize-escrow files:",
        e?.message || e
      );
    }

    try {
      const isMultiResolveRoot =
        name === "escrows/multi-release/resolve-dispute";
      const isMultiResolveDialog =
        name === "escrows/multi-release/resolve-dispute/dialog";
      const isMultiResolveForm =
        name === "escrows/multi-release/resolve-dispute/form";

      const srcSharedDir = path.join(
        TEMPLATES_DIR,
        "escrows",
        "multi-release",
        "resolve-dispute",
        "shared"
      );

      function copyMultiResolveSharedInto(targetDir) {
        if (!fs.existsSync(srcSharedDir)) return;
        const entries = fs.readdirSync(srcSharedDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!/\.(tsx?|jsx?)$/i.test(entry.name)) continue;
          const entrySrc = path.join(srcSharedDir, entry.name);
          const entryDest = path.join(targetDir, entry.name);
          writeTransformed(entrySrc, entryDest);
        }
      }

      if (isMultiResolveRoot) {
        copyMultiResolveSharedInto(path.join(destDir, "dialog"));
        copyMultiResolveSharedInto(path.join(destDir, "form"));
      } else if (isMultiResolveDialog) {
        copyMultiResolveSharedInto(destDir);
      } else if (isMultiResolveForm) {
        copyMultiResolveSharedInto(destDir);
      }
    } catch (e) {
      console.warn(
        "⚠️  Failed to materialize shared multi-release resolve-dispute files:",
        e?.message || e
      );
    }

    try {
      const isMultiUpdateRoot = name === "escrows/multi-release/update-escrow";
      const isMultiUpdateDialog =
        name === "escrows/multi-release/update-escrow/dialog";
      const isMultiUpdateForm =
        name === "escrows/multi-release/update-escrow/form";

      const srcSharedDir = path.join(
        TEMPLATES_DIR,
        "escrows",
        "multi-release",
        "update-escrow",
        "shared"
      );

      function copyMultiUpdateSharedInto(targetDir) {
        if (!fs.existsSync(srcSharedDir)) return;
        const entries = fs.readdirSync(srcSharedDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!/\.(tsx?|jsx?)$/i.test(entry.name)) continue;
          const entrySrc = path.join(srcSharedDir, entry.name);
          const entryDest = path.join(targetDir, entry.name);
          writeTransformed(entrySrc, entryDest);
        }
      }

      if (isMultiUpdateRoot) {
        copyMultiUpdateSharedInto(path.join(destDir, "dialog"));
        copyMultiUpdateSharedInto(path.join(destDir, "form"));
      } else if (isMultiUpdateDialog) {
        copyMultiUpdateSharedInto(destDir);
      } else if (isMultiUpdateForm) {
        copyMultiUpdateSharedInto(destDir);
      }
    } catch (e) {
      console.warn(
        "⚠️  Failed to materialize shared multi-release update-escrow files:",
        e?.message || e
      );
    }

    // If adding the whole single-release bundle, materialize all shared files
    try {
      if (name === "escrows/single-release") {
        const modules = [
          "initialize-escrow",
          "approve-milestone",
          "change-milestone-status",
          "fund-escrow",
          "resolve-dispute",
          "update-escrow",
        ];

        for (const mod of modules) {
          const srcSharedDir = path.join(
            TEMPLATES_DIR,
            "escrows",
            mod === "approve-milestone" ? "shared" : "single-release",
            mod === "approve-milestone" ? "approve-milestone" : mod,
            "shared"
          );
          if (!fs.existsSync(srcSharedDir)) continue;

          const targets = [
            path.join(destDir, mod, "dialog"),
            path.join(destDir, mod, "form"),
          ];

          const entries = fs.readdirSync(srcSharedDir, { withFileTypes: true });
          for (const entry of entries) {
            if (!/\.(tsx?|jsx?)$/i.test(entry.name)) continue;
            const entrySrc = path.join(srcSharedDir, entry.name);
            for (const t of targets) {
              const entryDest = path.join(t, entry.name);
              writeTransformed(entrySrc, entryDest);
            }
          }
        }
      }
    } catch (e) {
      console.warn(
        "⚠️  Failed to materialize shared files for single-release bundle:",
        e?.message || e
      );
    }

    // If adding the whole multi-release bundle, materialize all shared files
    try {
      if (name === "escrows/multi-release") {
        const modules = [
          "initialize-escrow",
          "resolve-dispute",
          "update-escrow",
        ];

        for (const mod of modules) {
          const srcSharedDir = path.join(
            TEMPLATES_DIR,
            "escrows",
            "multi-release",
            mod,
            "shared"
          );
          if (!fs.existsSync(srcSharedDir)) continue;

          const targets = [
            path.join(destDir, mod, "dialog"),
            path.join(destDir, mod, "form"),
          ];

          const entries = fs.readdirSync(srcSharedDir, { withFileTypes: true });
          for (const entry of entries) {
            if (!/\.(tsx?|jsx?)$/i.test(entry.name)) continue;
            const entrySrc = path.join(srcSharedDir, entry.name);
            for (const t of targets) {
              const entryDest = path.join(t, entry.name);
              writeTransformed(entrySrc, entryDest);
            }
          }
        }
      }
    } catch (e) {
      console.warn(
        "⚠️  Failed to materialize shared files for multi-release bundle:",
        e?.message || e
      );
    }

    // If adding the root escrows bundle, also materialize single-release shared files
    try {
      if (name === "escrows") {
        const modules = [
          "initialize-escrow",
          "approve-milestone",
          "change-milestone-status",
          "fund-escrow",
          "resolve-dispute",
          "update-escrow",
        ];

        const baseTarget = path.join(destDir, "single-release");
        for (const mod of modules) {
          const srcSharedDir = path.join(
            TEMPLATES_DIR,
            "escrows",
            mod === "approve-milestone" ? "shared" : "single-release",
            mod === "approve-milestone" ? "approve-milestone" : mod,
            "shared"
          );
          if (!fs.existsSync(srcSharedDir)) continue;

          const targets = [
            path.join(baseTarget, mod, "dialog"),
            path.join(baseTarget, mod, "form"),
          ];

          const entries = fs.readdirSync(srcSharedDir, { withFileTypes: true });
          for (const entry of entries) {
            if (!/\.(tsx?|jsx?)$/i.test(entry.name)) continue;
            const entrySrc = path.join(srcSharedDir, entry.name);
            for (const t of targets) {
              const entryDest = path.join(t, entry.name);
              writeTransformed(entrySrc, entryDest);
            }
          }
        }
      }
    } catch (e) {
      console.warn(
        "⚠️  Failed to materialize shared files for escrows root:",
        e?.message || e
      );
    }

    // If adding the root escrows bundle, also materialize multi-release shared files
    try {
      if (name === "escrows") {
        const modules = [
          "initialize-escrow",
          "resolve-dispute",
          "update-escrow",
        ];

        const baseTarget = path.join(destDir, "multi-release");
        for (const mod of modules) {
          const srcSharedDir = path.join(
            TEMPLATES_DIR,
            "escrows",
            "multi-release",
            mod,
            "shared"
          );
          if (!fs.existsSync(srcSharedDir)) continue;

          const targets = [
            path.join(baseTarget, mod, "dialog"),
            path.join(baseTarget, mod, "form"),
          ];

          const entries = fs.readdirSync(srcSharedDir, { withFileTypes: true });
          for (const entry of entries) {
            if (!/\.(tsx?|jsx?)$/i.test(entry.name)) continue;
            const entrySrc = path.join(srcSharedDir, entry.name);
            for (const t of targets) {
              const entryDest = path.join(t, entry.name);
              writeTransformed(entrySrc, entryDest);
            }
          }
        }
      }
    } catch (e) {
      console.warn(
        "⚠️  Failed to materialize shared files for escrows root (multi-release):",
        e?.message || e
      );
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

function copySharedDetailsInto(targetRelativeDir, { uiBase } = {}) {
  const srcDir = path.join(TEMPLATES_DIR, "escrows", "details");
  const outRoot = path.join(PROJECT_ROOT, "src", "components", "tw-blocks");
  const destDir = path.join(outRoot, targetRelativeDir);
  const config = loadConfig();
  const effectiveUiBase = uiBase || config.uiBase || "@/components/ui";

  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });

  function writeTransformed(srcPath, destPath) {
    const raw = fs.readFileSync(srcPath, "utf8");
    let transformed = raw.replaceAll("__UI_BASE__", effectiveUiBase);
    // Resolve details placeholders to either multi-release modules (if present) or local compat
    const resolveImport = (segments, compatFile) => {
      const realWithExt = path.join(
        outRoot,
        "escrows",
        "multi-release",
        ...segments
      );
      const realCandidate = [
        realWithExt,
        realWithExt + ".tsx",
        realWithExt + ".ts",
        realWithExt + ".jsx",
        realWithExt + ".js",
      ].find((p) => fs.existsSync(p));
      const realNoExt = realCandidate
        ? realCandidate.replace(/\.(tsx|ts|jsx|js)$/i, "")
        : null;
      const compatWithExt = path.join(
        path.dirname(destPath),
        "compat",
        compatFile
      );
      const compatCandidate = [
        compatWithExt,
        compatWithExt + ".tsx",
        compatWithExt + ".ts",
        compatWithExt + ".jsx",
        compatWithExt + ".js",
      ].find((p) => fs.existsSync(p));
      const compatNoExt = (compatCandidate || compatWithExt).replace(
        /\.(tsx|ts|jsx|js)$/i,
        ""
      );
      const target = realNoExt || compatNoExt;
      let rel = path.relative(path.dirname(destPath), target);
      rel = rel.split(path.sep).join("/");
      if (!rel.startsWith(".")) rel = "./" + rel;
      return rel;
    };
    transformed = transformed
      .replaceAll(
        "__MR_RELEASE_MODULE__",
        resolveImport(
          ["release-escrow", "button", "ReleaseEscrow"],
          "ReleaseEscrow"
        )
      )
      .replaceAll(
        "__MR_DISPUTE_MODULE__",
        resolveImport(
          ["dispute-escrow", "button", "DisputeEscrow"],
          "DisputeEscrow"
        )
      )
      .replaceAll(
        "__MR_RESOLVE_MODULE__",
        resolveImport(
          ["resolve-dispute", "dialog", "ResolveDispute"],
          "ResolveDispute"
        )
      );
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, transformed, "utf8");
    console.log(`✅ ${path.relative(PROJECT_ROOT, destPath)} created`);
  }

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
      if (/\.(tsx?|jsx?)$/i.test(entry.name)) {
        writeTransformed(entrySrc, entryDest);
      } else {
        fs.mkdirSync(path.dirname(entryDest), { recursive: true });
        fs.copyFileSync(entrySrc, entryDest);
        console.log(`✅ ${path.relative(PROJECT_ROOT, entryDest)} created`);
      }
    }
  }
}

function copySharedRoleSignerHooks(kind = "both") {
  const outRoot = path.join(PROJECT_ROOT, "src", "components", "tw-blocks");

  const mappings = [];
  if (kind === "both" || kind === "role") {
    mappings.push({
      src: path.join(
        TEMPLATES_DIR,
        "escrows",
        "escrows-by-role",
        "useEscrowsByRole.shared.ts"
      ),
      dest: path.join(
        outRoot,
        "escrows",
        "escrows-by-role",
        "useEscrowsByRole.shared.ts"
      ),
    });
  }
  if (kind === "both" || kind === "signer") {
    mappings.push({
      src: path.join(
        TEMPLATES_DIR,
        "escrows",
        "escrows-by-signer",
        "useEscrowsBySigner.shared.ts"
      ),
      dest: path.join(
        outRoot,
        "escrows",
        "escrows-by-signer",
        "useEscrowsBySigner.shared.ts"
      ),
    });
  }

  for (const { src, dest } of mappings) {
    if (!fs.existsSync(src)) continue;
    const raw = fs.readFileSync(src, "utf8");
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, raw, "utf8");
    console.log(`✅ ${path.relative(PROJECT_ROOT, dest)} created`);
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

function injectProvidersIntoLayout(
  layoutPath,
  { reactQuery = false, trustless = false, wallet = false, escrow = false } = {}
) {
  try {
    let content = fs.readFileSync(layoutPath, "utf8");

    const importRQ =
      'import { ReactQueryClientProvider } from "@/components/tw-blocks/providers/ReactQueryClientProvider";\n';
    const importTW =
      'import { TrustlessWorkProvider } from "@/components/tw-blocks/providers/TrustlessWork";\n';
    const importEscrow =
      'import { EscrowProvider } from "@/components/tw-blocks/providers/EscrowProvider";\n';
    const importWallet =
      'import { WalletProvider } from "@/components/tw-blocks/wallet-kit/WalletProvider";\n';
    const commentText =
      "// Use these imports to wrap your application (<ReactQueryClientProvider>, <TrustlessWorkProvider>, <WalletProvider> y <EscrowProvider>)\n";

    const needImport = (name) =>
      !new RegExp(
        `import\\s+[^;]*${name}[^;]*from\\s+['\"][^'\"]+['\"];?`
      ).test(content);

    let importsToAdd = "";
    if (reactQuery && needImport("ReactQueryClientProvider"))
      importsToAdd += importRQ;
    if (trustless && needImport("TrustlessWorkProvider"))
      importsToAdd += importTW;
    if (wallet && needImport("WalletProvider")) importsToAdd += importWallet;
    if (escrow && needImport("EscrowProvider")) importsToAdd += importEscrow;

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
    }

    const hasTag = (tag) => new RegExp(`<${tag}[\\s>]`).test(content);
    const wrapInside = (containerTag, newTag) => {
      const open = content.match(new RegExp(`<${containerTag}(\\s[^>]*)?>`));
      if (!open) return false;
      const openIdx = open.index + open[0].length;
      const closeIdx = content.indexOf(`</${containerTag}>`, openIdx);
      if (closeIdx === -1) return false;
      content =
        content.slice(0, openIdx) +
        `\n<${newTag}>\n` +
        content.slice(openIdx, closeIdx) +
        `\n</${newTag}>\n` +
        content.slice(closeIdx);
      return true;
    };

    const ensureTag = (tag) => {
      if (hasTag(tag)) return;
      const bodyOpen = content.match(/<body[^>]*>/);
      const bodyCloseIdx = content.lastIndexOf("</body>");
      if (!bodyOpen || bodyCloseIdx === -1) return;
      const bodyOpenIdx = bodyOpen.index + bodyOpen[0].length;
      if (tag === "TrustlessWorkProvider") {
        if (wrapInside("ReactQueryClientProvider", tag)) return;
      }
      if (tag === "WalletProvider") {
        if (wrapInside("TrustlessWorkProvider", tag)) return;
        if (wrapInside("ReactQueryClientProvider", tag)) return;
      }
      if (tag === "EscrowProvider") {
        if (wrapInside("WalletProvider", tag)) return;
        if (wrapInside("TrustlessWorkProvider", tag)) return;
        if (wrapInside("ReactQueryClientProvider", tag)) return;
      }
      content =
        content.slice(0, bodyOpenIdx) +
        `\n<${tag}>\n` +
        content.slice(bodyOpenIdx, bodyCloseIdx) +
        `\n</${tag}>\n` +
        content.slice(bodyCloseIdx);
    };

    if (reactQuery) ensureTag("ReactQueryClientProvider");
    if (trustless) ensureTag("TrustlessWorkProvider");
    if (wallet) ensureTag("WalletProvider");
    if (escrow) ensureTag("EscrowProvider");

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
    "Add shadcn components (button, input, form, card, sonner, checkbox, dialog, textarea, sonner, select, table, calendar, popover, separator, calendar-05, badge, sheet, tabs, avatar)?",
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
        "badge",
        "sheet",
        "tabs",
        "avatar",
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
    "Install (react-hook-form, @tanstack/react-query, @tanstack/react-query-devtools, @trustless-work/escrow, @hookform/resolvers, axios, @creit.tech/stellar-wallets-kit, react-day-picker & zod) dependencies now?",
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
    "Install TanStack Query and Trustless Work providers and wrap app/layout with them?",
    true
  );
  if (wantProviders) {
    await withSpinner("Installing providers", async () => {
      copyTemplate("providers");
    });
    const layoutPath = findLayoutFile();
    if (layoutPath) {
      await withSpinner("Updating app/layout with providers", async () => {
        injectProvidersIntoLayout(layoutPath, {
          reactQuery: true,
          trustless: true,
        });
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

  // Post-add wiring for specific templates
  const layoutPath = findLayoutFile();
  if (layoutPath) {
    if (args[1] === "wallet-kit" || args[1].startsWith("wallet-kit/")) {
      injectProvidersIntoLayout(layoutPath, { wallet: true });
    }
  }

  // Copy shared details into role/signer targets when applicable
  try {
    if (args[1] === "escrows") {
      copySharedDetailsInto("escrows/escrows-by-role/details", {
        uiBase: flags.uiBase,
      });
      copySharedDetailsInto("escrows/escrows-by-signer/details", {
        uiBase: flags.uiBase,
      });
      copySharedRoleSignerHooks("both");
    }
    if (
      args[1] === "escrows/escrows-by-role" ||
      args[1].startsWith("escrows/escrows-by-role/")
    ) {
      copySharedDetailsInto("escrows/escrows-by-role/details", {
        uiBase: flags.uiBase,
      });
      copySharedRoleSignerHooks("role");
    }
    if (
      args[1] === "escrows/escrows-by-signer" ||
      args[1].startsWith("escrows/escrows-by-signer/")
    ) {
      copySharedDetailsInto("escrows/escrows-by-signer/details", {
        uiBase: flags.uiBase,
      });
      copySharedRoleSignerHooks("signer");
    }
  } catch (e) {
    console.warn("⚠️  Failed to copy shared details:", e?.message || e);
  }
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
  
  --- Helpers ---
  trustless-work add helpers
  
  --- Tanstack ---
  trustless-work add tanstack
  
  --- Escrows ---
  trustless-work add escrows
  
  --- Escrows by role ---
  trustless-work add escrows/escrows-by-role
  trustless-work add escrows/escrows-by-role/table
  trustless-work add escrows/escrows-by-role/cards
  
  --- Escrows by signer ---
  trustless-work add escrows/escrows-by-signer
  trustless-work add escrows/escrows-by-signer/table
  trustless-work add escrows/escrows-by-signer/cards
  
  --- Escrow details (optional standalone) ---
  trustless-work add escrows/details
  
  ----------------------
  --- SINGLE-RELEASE ---
  trustless-work add escrows/single-release
  
  --- Initialize escrow ---
  - trustless-work add escrows/single-release/initialize-escrow
  - trustless-work add escrows/single-release/initialize-escrow/form
  - trustless-work add escrows/single-release/initialize-escrow/dialog
  
  --- Approve milestone ---
  - trustless-work add escrows/single-release/approve-milestone
  - trustless-work add escrows/single-release/approve-milestone/form
  - trustless-work add escrows/single-release/approve-milestone/button
  - trustless-work add escrows/single-release/approve-milestone/dialog
  
  --- Change milestone status ---
  - trustless-work add escrows/single-release/change-milestone-status
  - trustless-work add escrows/single-release/change-milestone-status/form
  - trustless-work add escrows/single-release/change-milestone-status/button
  - trustless-work add escrows/single-release/change-milestone-status/dialog
  
  --- Fund escrow ---
  - trustless-work add escrows/single-release/fund-escrow
  - trustless-work add escrows/single-release/fund-escrow/form
  - trustless-work add escrows/single-release/fund-escrow/button
  - trustless-work add escrows/single-release/fund-escrow/dialog
  
  --- Resolve dispute ---
  - trustless-work add escrows/single-release/resolve-dispute
  - trustless-work add escrows/single-release/resolve-dispute/form
  - trustless-work add escrows/single-release/resolve-dispute/button
  - trustless-work add escrows/single-release/resolve-dispute/dialog
  
  --- Update escrow ---
  - trustless-work add escrows/single-release/update-escrow
  - trustless-work add escrows/single-release/update-escrow/form
  - trustless-work add escrows/single-release/update-escrow/dialog
  
  --- Release escrow ---
  - trustless-work add escrows/single-release/release-escrow
  - trustless-work add escrows/single-release/release-escrow/button
  
  --- Dispute escrow ---
  - trustless-work add escrows/single-release/dispute-escrow
  - trustless-work add escrows/single-release/dispute-escrow/button
  `);
}
