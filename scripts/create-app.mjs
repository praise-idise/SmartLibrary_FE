#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const ignored = new Set([
  ".git",
  "node_modules",
  "dist",
  ".env",
  "package-lock.json",
]);

function parseArgs(argv) {
  const values = {
    projectName: "",
    targetDirArg: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      values.help = true;
      continue;
    }

    if (arg === "--target-dir" || arg === "--out-dir") {
      values.targetDirArg = argv[i + 1] ?? "";
      i += 1;
      continue;
    }

    if (!arg.startsWith("-") && !values.projectName) {
      values.projectName = arg;
    }
  }

  return values;
}

function printUsage() {
  console.log("Usage: npm run create:app -- <project-name> [--target-dir <folder>]");
  console.log("Example (sibling): npm run create:app -- my-new-app");
  console.log("Example (specific folder): npm run create:app -- my-new-app --target-dir ../apps");
}

function copyDirectory(sourceDir, targetDir, skipDirName) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    if (entry.name === skipDirName) continue;

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath, skipDirName);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const projectName = args.projectName?.trim();

  if (!projectName) {
    printUsage();
    process.exit(1);
  }

  // Default destination is alongside the template folder.
  const destinationBase = args.targetDirArg
    ? path.resolve(rootDir, args.targetDirArg)
    : path.resolve(rootDir, "..");

  if (!fs.existsSync(destinationBase)) {
    fs.mkdirSync(destinationBase, { recursive: true });
  }

  const targetDir = path.resolve(destinationBase, projectName);
  if (fs.existsSync(targetDir)) {
    console.error(`Target directory already exists: ${targetDir}`);
    process.exit(1);
  }

  copyDirectory(rootDir, targetDir, path.basename(targetDir));

  const init = spawnSync("node", ["scripts/init-project.mjs", "--name", projectName], {
    cwd: targetDir,
    stdio: "inherit",
  });

  if (init.status !== 0) process.exit(init.status ?? 1);

  const install = spawnSync("npm", ["install"], {
    cwd: targetDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (install.status !== 0) process.exit(install.status ?? 1);

  console.log("\nProject created successfully.");
  console.log(`Location: ${targetDir}`);
  console.log(`Next: cd ${targetDir} && npm run dev`);
}

run();
