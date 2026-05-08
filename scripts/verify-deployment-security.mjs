#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

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

export function validateAllowedOrigins(value) {
  const origins = (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    return { ok: false, message: "EDELPHI_ALLOWED_ORIGINS has at least one origin" };
  }

  if (origins.includes("*")) {
    return { ok: false, message: "EDELPHI_ALLOWED_ORIGINS does not include wildcard '*'" };
  }

  return { ok: true, message: "EDELPHI_ALLOWED_ORIGINS contains no wildcard entries" };
}

export function auditEndpointUnavailable(output) {
  return /(?:403|forbidden|advisory|audit endpoint|registry|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|ECONNRESET)/i.test(output);
}

export function runDeploymentSecurityVerification(env = process.env, argv = process.argv, options = {}) {
  const spawnCommand = options.spawnSync ?? spawnSync;
  const auditCwd = options.auditCwd ?? new URL("../server", import.meta.url);
  const envName = argv[2] ?? "unset-environment";
  let warningCount = 0;

  function warning(message) {
    warningCount += 1;
    console.log(`[WARN] ${message}`);
  }

  console.log(`# Delphi deployment security verification`);
  console.log(`Environment label: ${envName}`);
  console.log(`Timestamp (UTC): ${new Date().toISOString()}`);

  let allOk = true;
  for (const name of required) {
    const value = env[name];
    const ok = typeof value === "string" && value.trim().length > 0;
    allOk = result(ok, `${name} configured`) && allOk;
  }

  for (const name of optionalProduction) {
    const value = env[name];
    if (!value) {
      warning(`${name} not configured (recommended in production)`);
    } else {
      result(true, `${name} configured (recommended in production)`);
    }
  }

  const allowedOrigins = validateAllowedOrigins(env.EDELPHI_ALLOWED_ORIGINS);
  allOk = result(allowedOrigins.ok, allowedOrigins.message) && allOk;

  if (allOk) {
    console.log("\n# Running npm security audit (high)");
    const audit = spawnCommand("npm", ["run", "security:audit"], {
      cwd: auditCwd,
      encoding: "utf8",
      shell: process.platform === "win32",
    });
    const auditOutput = `${audit.stdout ?? ""}${audit.stderr ?? ""}`;
    if (audit.stdout) process.stdout.write(audit.stdout);
    if (audit.stderr) process.stderr.write(audit.stderr);

    if (audit.error) {
      allOk = false;
      result(false, `npm security audit could not be started: ${audit.error.message}`);
    } else if (audit.status !== 0) {
      if (auditEndpointUnavailable(auditOutput)) {
        warning("npm security audit inconclusive due advisory/registry endpoint reachability; rerun in CI or a network-permitted environment");
      } else {
        allOk = false;
        result(false, "npm security audit completed with high-severity findings or execution failure");
      }
    } else {
      result(true, "npm security audit completed");
    }
  } else {
    console.log("\n# Skipping npm security audit because required deployment configuration checks failed.");
  }

  if (!allOk) {
    console.error("Deployment security verification failed.");
    return 1;
  }

  console.log(warningCount > 0 ? "Deployment security verification passed with warnings." : "Deployment security verification passed.");
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(runDeploymentSecurityVerification());
}
