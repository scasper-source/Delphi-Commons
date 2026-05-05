#!/usr/bin/env node

import { readdir } from "node:fs/promises";
import path from "node:path";
import { Worker } from "node:worker_threads";
import { pathToFileURL } from "node:url";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function expandPattern(pattern) {
  const normalized = pattern.replace(/\\/g, "/");
  if (!normalized.includes("*")) {
    return [path.resolve(process.cwd(), pattern)];
  }

  const slashIndex = normalized.lastIndexOf("/");
  const dirPart = slashIndex >= 0 ? normalized.slice(0, slashIndex) : ".";
  const filePattern = slashIndex >= 0 ? normalized.slice(slashIndex + 1) : normalized;
  const matcher = new RegExp(`^${filePattern.split("*").map(escapeRegExp).join(".*")}$`);
  const dir = path.resolve(process.cwd(), dirPart || ".");
  const entries = await readdir(dir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && matcher.test(entry.name))
    .map((entry) => path.join(dir, entry.name));
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node scripts/run-tests.mjs <test-file-or-glob> [...]");
  process.exit(1);
}

const expanded = (await Promise.all(args.map(expandPattern))).flat();
const files = [...new Set(expanded)].sort((a, b) => a.localeCompare(b));

if (files.length === 0) {
  console.error(`No test files matched: ${args.join(" ")}`);
  process.exit(1);
}

for (const file of files) {
  const url = pathToFileURL(file).href;
  const code = `import(${JSON.stringify(url)});`;
  const worker = new Worker(code, { eval: true, type: "module" });

  const exitCode = await new Promise((resolve) => {
    worker.once("error", (error) => {
      console.error(error);
      resolve(1);
    });
    worker.once("exit", resolve);
  });

  if (exitCode !== 0) {
    process.exitCode = 1;
  }
}
