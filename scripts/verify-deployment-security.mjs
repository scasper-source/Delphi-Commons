#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const envName = process.argv[2] ?? "unset-environment";
const required = [
  "NODE_ENV",
  "EDELPHI_ALLOWED_ORIGINS",
  "EDELPHI_AI_KEY_ENCRYPTION_SECRET",
  "EDELPHI_AUTH_REQUIRE_SESSION",
];

const optionalProduction = ["EDELPHI_SMS_WEBHOOK_SECRET", "EDELPHI_SECURE_COOKIES"];

function result(ok, message) {
  const mark = ok ? "PASS" : "FAIL";
  console.log(`[${mark}] ${message}`);
  return ok;
}

console.log(`# Delphi deployment security verification`);
console.log(`Environment label: ${envName}`);
console.log(`Timestamp (UTC): ${new Date().toISOString()}`);

let allOk = true;
for (const name of required) {
  const value = process.env[name];
  const ok = typeof value === "string" && value.trim().length > 0;
  allOk = result(ok, `${name} configured`) && allOk;
}

for (const name of optionalProduction) {
  const value = process.env[name];
  result(Boolean(value), `${name} configured (recommended in production)`);
}

if (process.env.NODE_ENV === "production") {
  allOk = result(process.env.EDELPHI_ALLOWED_ORIGINS !== "*", "Wildcard CORS is not configured") && allOk;
}

console.log("\n# Running npm security audit (high)");
const audit = spawnSync("npm", ["run", "security:audit"], { cwd: new URL("../server", import.meta.url), stdio: "inherit" });
if (audit.status !== 0) {
  allOk = false;
}

if (!allOk) {
  console.error("Deployment security verification failed.");
  process.exit(1);
}

console.log("Deployment security verification passed.");
