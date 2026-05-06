/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 *
 * Local controlled synthetic browser-pass evidence runner.
 *
 * Scope:
 * - local/dev backend and frontend only
 * - synthetic data only
 * - no external AI calls
 * - participant submissions are made through a real local browser surface
 */

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const artifactDir = path.join(__dirname, "artifacts");
const baseUrl = process.env.EDELPHI_MOCK_TRIAL_API_URL ?? "http://127.0.0.1:3001";
const frontendUrl = process.env.EDELPHI_MOCK_TRIAL_FRONTEND_URL ?? "http://127.0.0.1:5173";
const runStartedAt = new Date().toISOString();
const runSlug = runStartedAt.replace(/[:.]/g, "-");
const marker = `FMT-BROWSER-${Date.now().toString(36)}`;
const requiredStatement = "Consensus indicates agreement among this panel; it does not establish correctness.";

const { scanExportPrivacy } = await import(
  pathToFileURL(path.join(repoRoot, "server", "dist", "exports", "exportPrivacy.js")).href
);

const roles = {
  owner: { userId: "study_owner-dev-user", role: "owner" },
  steward: { userId: "ethics_methods_steward-dev-user", role: "methods_steward" },
  custodian: { userId: "data_custodian-dev-user", role: "data_custodian" },
};

const participants = Array.from({ length: 8 }, (_, index) => {
  const n = String(index + 1).padStart(3, "0");
  return {
    label: `SYN-P${n}`,
    email: `syn-p${n}@example.test`,
    name: `SYN-P${n}`,
    phone: `555-010-${String(index + 1).padStart(4, "0")}`,
    participantId: null,
    token: null,
    invitationUrl: null,
  };
});

const evidence = {
  run_started_at: runStartedAt,
  run_completed_at: null,
  marker,
  mode: "local_api_setup_with_browser_ui_participant_submission_pass",
  scope: {
    synthetic_data_only: true,
    local_or_controlled_dev_only: true,
    production_deployment: false,
    real_human_subjects_research: false,
    irb_launch: false,
    sensitive_participant_data: false,
    external_ai_calls: false,
  },
  environment: {
    commit_hash: null,
    branch: null,
    backend_url: baseUrl,
    frontend_url: frontendUrl,
    backend_health: null,
    frontend_http_status: null,
    browser: "Microsoft Edge or Chrome headless via Chrome DevTools Protocol",
    mobile_widths: [320, 390, 414],
  },
  commands: [],
  study: {},
  checks: [],
  browser_participant_submissions: {
    round1: [],
    round2: [],
    round3: [],
    round4: [],
  },
  support_loop: {},
  final_browser_check: {},
  mobile_width_checks: [],
  export_packages: [],
  export_scan: {
    failures: [],
    warnings: [],
  },
  rate_limit_backoff_events: [],
  browser_execution_scope: {
    all_8_participant_submissions_via_browser_ui: true,
    study_setup_and_round_progression_via_api: true,
    staff_support_response_via_api: true,
    mobile_width_submission_checks_completed: true,
    note:
      "The study setup, curation, round progression, final results, and export/privacy checks use local APIs. All 8 synthetic participants submit Rounds 1-4 through local browser UI automation.",
  },
  defects: { P0: [], P1: [], P2: [], P3: [] },
  status: "IN_PROGRESS",
};

function commandRecord(command, cwd = repoRoot) {
  evidence.commands.push({ command, cwd });
}

function addCheck(name, status, details = {}) {
  evidence.checks.push({ name, status, ...details });
}

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function headers(actor) {
  return {
    "Content-Type": "application/json",
    "X-User-ID": actor.userId,
    "X-User-Role": actor.role,
    Origin: frontendUrl,
  };
}

async function requestJson(pathname, actor, options = {}) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`${baseUrl}${pathname}`, {
      method: options.method ?? "GET",
      headers: headers(actor),
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    if (response.status === 429 && attempt === 0) {
      evidence.rate_limit_backoff_events.push({
        path: pathname,
        method: options.method ?? "GET",
        retry_after_ms: 65000,
      });
      await sleep(65000);
      continue;
    }
    if (!response.ok) {
      const error = body && typeof body === "object" && "error" in body ? body.error : text;
      throw new Error(`${options.method ?? "GET"} ${pathname} returned ${response.status}: ${error}`);
    }
    return body;
  }
  throw new Error(`${options.method ?? "GET"} ${pathname} did not complete after rate-limit retry.`);
}

async function requestInvitation(pathname, token, options = {}) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`${baseUrl}${pathname}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Participant-Invitation": token,
        Origin: frontendUrl,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    if (response.status === 429 && attempt === 0) {
      evidence.rate_limit_backoff_events.push({
        path: pathname,
        method: options.method ?? "GET",
        retry_after_ms: 65000,
        participant_invitation: "redacted",
      });
      await sleep(65000);
      continue;
    }
    if (!response.ok) {
      const error = body && typeof body === "object" && "error" in body ? body.error : text;
      const err = new Error(`${options.method ?? "GET"} ${pathname} returned ${response.status}: ${error}`);
      err.status = response.status;
      err.payload = body;
      throw err;
    }
    return body;
  }
  throw new Error(`${options.method ?? "GET"} ${pathname} did not complete after rate-limit retry.`);
}

async function expectInvitationFailure(pathname, token, expectedStatus, options = {}) {
  try {
    await requestInvitation(pathname, token, options);
  } catch (error) {
    if (error.status === expectedStatus) return error.payload;
    throw error;
  }
  throw new Error(`${options.method ?? "GET"} ${pathname} unexpectedly succeeded`);
}

async function execCapture(command, args, cwd = repoRoot) {
  commandRecord(`${command} ${args.join(" ")}`, cwd);
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

function tokenFromInvitationUrl(invitationUrl) {
  const parsed = new URL(invitationUrl);
  const token = new URLSearchParams(parsed.hash.replace(/^#/, "")).get("invite");
  assertCondition(token, `invitation token missing from ${invitationUrl}`);
  return token;
}

function openResponseText(index) {
  const participant = participants[index];
  const uniqueMinority =
    index === 7
      ? "One minority concern is that the app should also work for gardeners with no smartphone access."
      : "A shared calendar with neutral reminders would reduce scheduling confusion.";
  return [
    `${participant.label} suggests prioritizing the fictional garden app feature set.`,
    uniqueMinority,
    `Synthetic self-identifier test: ${participant.email}, ${participant.phone}, ${participant.participantId}.`,
  ].join(" ");
}

function ratingFor(roundNumber, participantIndex, itemIndex) {
  if (itemIndex === 0) return 8;
  if (itemIndex === 1) return participantIndex < 7 ? 8 : 4;
  if (itemIndex === 2) return participantIndex < 6 ? 7 : 4;
  if (itemIndex === 3) return participantIndex < 4 ? 8 : 3;
  if (participantIndex === 6 || participantIndex === 7) return roundNumber === 4 ? 4 : 5;
  return 7 + ((participantIndex + itemIndex + roundNumber) % 2);
}

function rationaleFor(roundNumber, participantIndex, itemIndex) {
  const participant = participants[participantIndex];
  const stance =
    participantIndex >= 6 && itemIndex >= 2
      ? "retains a minority concern without penalty"
      : "supports the item with some implementation caveats";
  return [
    `${participant.label} Round ${roundNumber} rationale ${stance}.`,
    `Synthetic identifier redaction test ${participant.email} ${participant.phone} ${participant.participantId}.`,
  ].join(" ");
}

function roundConfig(roundNumber) {
  if (roundNumber === 1) {
    return {
      task_type: "open_text",
      title: "Round 1: Open-ended elicitation",
      prompt: "What features should the fictional community garden scheduling app prioritize?",
      participant_instructions:
        "Please suggest features or concerns in your own words. There is no correct answer, and disagreement is useful.",
      response_window_days: 7,
      reminder_subject: "Round 1 response window is open",
      reminder_body:
        "This is a neutral reminder that Round 1 is open. Participation remains voluntary.",
      controlled_feedback_enabled: false,
      ai_curation_enabled: true,
      status: "Ready",
    };
  }

  return {
    task_type: "rating",
    title: `Round ${roundNumber}: Structured rating`,
    prompt:
      roundNumber === 4
        ? "Provide your final rating for each candidate feature."
        : "Review the neutral aggregate feedback and rate each candidate feature.",
    participant_instructions:
      "Use your own judgment. You may retain disagreement or revise your rating; no response is treated as correct.",
    response_window_days: 7,
    reminder_subject: `Round ${roundNumber} rating window is open`,
    reminder_body: `This is a neutral reminder that Round ${roundNumber} is open. Participation remains voluntary.`,
    controlled_feedback_enabled: true,
    ai_curation_enabled: true,
    feedback_config: {
      format: "distribution_summary",
      show_participant_prior_response: true,
    },
    status: "Ready",
  };
}

async function publishSuggestionItems(studyId, versionId, targetRoundNumber) {
  const synthesis = await requestJson(
    `/studies/${studyId}/versions/${versionId}/ai/synthesize-inter-round`,
    roles.owner,
    { method: "POST", body: { target_round_number: targetRoundNumber } },
  );
  const suggestion = synthesis.suggestion;
  assertCondition(suggestion.label === "AI Suggestion (Not Final)", "AI suggestion label missing");
  assertCondition(suggestion.decision === "None", "AI suggestion was pre-decided");

  await requestJson(
    `/studies/${studyId}/versions/${versionId}/ai/suggestions/${suggestion.suggestion_id}/decision`,
    roles.owner,
    { method: "POST", body: { decision: "Accepted", note: `Human accepted synthetic Round ${targetRoundNumber} candidates.` } },
  );
  await requestJson(
    `/studies/${studyId}/versions/${versionId}/ai/suggestions/${suggestion.suggestion_id}/release-signoff`,
    roles.owner,
    { method: "POST", body: { note: "Study Owner release signoff for synthetic browser rehearsal." } },
  );
  await requestJson(
    `/studies/${studyId}/versions/${versionId}/ai/suggestions/${suggestion.suggestion_id}/release-signoff`,
    roles.steward,
    { method: "POST", body: { note: "Methods Steward release signoff for synthetic browser rehearsal." } },
  );

  const candidates = suggestion.output_json.candidates.map((candidate) => candidate.candidate_id);
  const rationales = Object.fromEntries(candidates.map((candidateId) => [
    candidateId,
    "Human curation confirmed source traceability, preserved minority input, and neutralized wording before publication.",
  ]));
  const materialized = await requestJson(
    `/studies/${studyId}/versions/${versionId}/ai/suggestions/${suggestion.suggestion_id}/items`,
    roles.owner,
    { method: "POST", body: { candidate_ids: candidates, rationales } },
  );

  const publishedItems = [];
  for (const item of materialized.items) {
    const published = await requestJson(
      `/studies/${studyId}/versions/${versionId}/items/${item.item_id}/publish`,
      roles.owner,
      { method: "POST", body: {} },
    );
    publishedItems.push(published.item);
  }
  return publishedItems;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function findBrowser() {
  const candidates = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ];
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try next executable.
    }
  }
  return null;
}

async function launchBrowser(label, width = 1200, height = 900, mobile = false) {
  const executable = await findBrowser();
  if (!executable) throw new Error("No supported Edge/Chrome executable found.");
  const port = 9400 + Math.floor(Math.random() * 3000);
  const userDataDir = path.join(artifactDir, `edge-profile-manual-${runSlug}-${label}-${Math.floor(Math.random() * 10000)}`);
  await fs.mkdir(userDataDir, { recursive: true });
  const proc = execFile(executable, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    `--window-size=${Math.max(width, 1200)},${height}`,
    "about:blank",
  ]);
  let pageInfo = null;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await sleep(200);
    try {
      const pages = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json());
      pageInfo = pages.find((page) => page.type === "page") ?? pages[0];
      if (pageInfo?.webSocketDebuggerUrl) break;
    } catch {
      // Browser is still starting.
    }
  }
  if (!pageInfo?.webSocketDebuggerUrl) {
    proc.kill();
    throw new Error("CDP target not available.");
  }

  const ws = new WebSocket(pageInfo.webSocketDebuggerUrl);
  const pending = new Map();
  let nextId = 0;
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id);
      clearTimeout(item.timeout);
      pending.delete(message.id);
      if (message.error) item.reject(new Error(message.error.message));
      else item.resolve(message.result);
    }
  };
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout for ${method}`));
    }, 15000);
    pending.set(id, { resolve, reject, timeout });
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  });

  return {
    executable,
    width,
    height,
    mobile,
    send,
    async navigate(url) {
      await send("Page.navigate", { url });
      await sleep(2500);
    },
    async evaluate(expression) {
      const result = await send("Runtime.evaluate", { returnByValue: true, expression });
      return result.result.value;
    },
    async screenshot(name) {
      const screenshotPath = path.join(artifactDir, `${name}.png`);
      const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
      await fs.writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));
      return path.relative(repoRoot, screenshotPath).replaceAll("\\", "/");
    },
    async close() {
      try { ws.close(); } catch { /* noop */ }
      try { proc.kill(); } catch { /* noop */ }
    },
  };
}

async function visibleText(page) {
  return page.evaluate("document.body ? document.body.innerText : ''");
}

async function focusAndTypeIntoTextarea(page, selectorExpression, text, label) {
  const target = await page.evaluate(`(() => {
    const area = ${selectorExpression};
    if (!area) return { found: false };
    area.scrollIntoView({ block: "center", inline: "nearest" });
    const rect = area.getBoundingClientRect();
    return {
      found: true,
      x: rect.left + Math.min(rect.width / 2, 160),
      y: rect.top + Math.min(rect.height / 2, 60),
    };
  })()`);
  assertCondition(target.found, `${label} textarea not found.`);
  await page.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: target.x,
    y: target.y,
    button: "none",
  });
  await page.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: target.x,
    y: target.y,
    button: "left",
    clickCount: 1,
  });
  await page.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: target.x,
    y: target.y,
    button: "left",
    clickCount: 1,
  });
  await sleep(100);
  for (const character of text) {
    await page.send("Input.dispatchKeyEvent", {
      type: "char",
      text: character,
      unmodifiedText: character,
    });
  }
  await page.evaluate(`(() => {
    const area = ${selectorExpression};
    if (!area) return false;
    const tracker = area._valueTracker;
    if (tracker) tracker.setValue("");
    area.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      data: area.value,
      inputType: "insertText",
    }));
    area.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  })()`);
  await sleep(200);
}

async function clickVisibleButton(page, matcherExpression) {
  return page.evaluate(`(() => {
    const buttons = [...document.querySelectorAll("button")].filter((el) => !el.disabled && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
    const button = buttons.find((el) => ${matcherExpression});
    if (!button) return false;
    button.click();
    return true;
  })()`);
}

async function completeOrientationIfNeeded(page) {
  for (let step = 0; step < 8; step += 1) {
    const didClick = await clickVisibleButton(page, `el.innerText === "Next" || el.innerText.includes("I understand and am ready to continue")`);
    if (!didClick) break;
    await sleep(700);
    const text = await visibleText(page);
    if (text.includes("Round 1 progress") || text.includes("Submit Round 1 response")) break;
  }
}

async function submitRoundOneThroughBrowser(participant, index, viewport) {
  const page = await launchBrowser(`r1-${participant.label}`, viewport.width, viewport.height, viewport.mobile);
  try {
    await page.navigate(participant.invitationUrl);
    let text = await visibleText(page);
    assertCondition(text.includes("Invitation link active"), `${participant.label} invitation did not load in browser.`);
    await completeOrientationIfNeeded(page);
    text = await visibleText(page);
    assertCondition(text.includes("Submit Round 1 response"), `${participant.label} Round 1 editor not visible.`);
    await focusAndTypeIntoTextarea(
      page,
      `[...document.querySelectorAll("textarea")].find((el) => (el.getAttribute("aria-label") || "").includes("Round 1 response"))`,
      openResponseText(index),
      `${participant.label} Round 1 response`,
    );
    await page.evaluate(`(() => {
      const checkbox = [...document.querySelectorAll("input[type=checkbox]")].find((el) => !el.disabled);
      if (checkbox && !checkbox.checked) checkbox.click();
      return true;
    })()`);
    const roundOneDebugBeforeSubmit = await page.evaluate(`(() => {
      const area = [...document.querySelectorAll("textarea")].find((el) => (el.getAttribute("aria-label") || "").includes("Round 1 response"));
      const checkbox = [...document.querySelectorAll("input[type=checkbox]")].find((el) => !el.disabled);
      const submit = [...document.querySelectorAll("button")].find((el) => el.innerText.includes("Submit Round 1 response"));
      return {
        valueLength: area?.value?.length ?? null,
        checked: checkbox?.checked ?? null,
        submitDisabled: submit?.disabled ?? null,
        submitText: submit?.innerText ?? null,
      };
    })()`);
    await sleep(700);
    const submitted = await clickVisibleButton(page, `el.innerText.includes("Submit Round 1 response")`);
    assertCondition(submitted, `${participant.label} Round 1 submit button not found.`);
    await sleep(1200);
    text = await visibleText(page);
    assertCondition(
      text.includes("Round 1 response submitted") || text.includes("What was submitted"),
      `${participant.label} Round 1 submission confirmation missing. Debug: ${JSON.stringify(roundOneDebugBeforeSubmit)}. Visible text: ${text.slice(0, 1200)}`,
    );
    await clickVisibleButton(page, `el.innerText.includes("Finish Round 1 task")`);
    await sleep(500);
    const screenshotPath = await page.screenshot(`manual-browser-r1-${participant.label}`);
    const context = await requestInvitation("/participant/invitation", participant.token);
    return {
      participant: participant.label,
      viewport,
      status: "PASS",
      browser_confirmation: true,
      orientation_complete: Boolean(context.orientation_completion),
      consent_recorded: Boolean(context.consent_record && !context.consent_record.withdrew_at),
      screenshot_path: screenshotPath,
    };
  } finally {
    await page.close();
  }
}

async function submitSupportNoteThroughBrowser(participant, viewport) {
  const page = await launchBrowser(`support-${participant.label}`, viewport.width, viewport.height, viewport.mobile);
  try {
    await page.navigate(participant.invitationUrl);
    await sleep(500);
    const opened = await clickVisibleButton(page, `el.innerText === "Having trouble?"`);
    assertCondition(opened, "Support issue button not visible.");
    await sleep(500);
    await focusAndTypeIntoTextarea(
      page,
      `[...document.querySelectorAll("textarea")].at(-1)`,
      "Synthetic browser support note from SYN-P003: please confirm the Round 1 submission was recorded.",
      "Support note",
    );
    const sent = await clickVisibleButton(page, `el.innerText.includes("Send issue note")`);
    assertCondition(sent, "Support issue send button not visible.");
    await sleep(1000);
    const text = await visibleText(page);
    const screenshotPath = await page.screenshot(`manual-browser-support-${participant.label}`);
    return { participant: participant.label, viewport, status: text.includes("Issue note sent") || text.includes("Synthetic browser support note") ? "PASS" : "PARTIAL", screenshot_path: screenshotPath };
  } finally {
    await page.close();
  }
}

async function verifySupportResponseThroughBrowser(participant, viewport) {
  const page = await launchBrowser(`support-response-${participant.label}`, viewport.width, viewport.height, viewport.mobile);
  try {
    await page.navigate(participant.invitationUrl);
    await sleep(1000);
    const text = await visibleText(page);
    const screenshotPath = await page.screenshot(`manual-browser-support-response-${participant.label}`);
    return {
      participant: participant.label,
      viewport,
      staff_response_visible: text.includes("Synthetic PI browser-pass response"),
      screenshot_path: screenshotPath,
    };
  } finally {
    await page.close();
  }
}

async function submitRatingRoundThroughBrowser(participant, participantIndex, roundNumber, viewport) {
  const page = await launchBrowser(`r${roundNumber}-${participant.label}`, viewport.width, viewport.height, viewport.mobile);
  try {
    await page.navigate(participant.invitationUrl);
    let text = await visibleText(page);
    assertCondition(text.includes(`Round ${roundNumber}`), `${participant.label} Round ${roundNumber} was not visible.`);
    const ratings = Array.from({ length: 20 }, (_, itemIndex) => ratingFor(roundNumber, participantIndex, itemIndex));
    const rationales = Array.from(
      { length: 20 },
      (_, itemIndex) => `${participant.label} Round ${roundNumber} browser rationale ${itemIndex + 1}. Synthetic identifier redaction test.`,
    );
    const result = await page.evaluate(`(() => {
      const tasks = [...document.querySelectorAll("article.rating-task")];
      if (!tasks.length) return { ok: false, taskCount: 0 };
      const ratings = ${JSON.stringify(ratings)};
      const rationales = ${JSON.stringify(rationales)};
      for (const [index, task] of tasks.entries()) {
        const desired = String(ratings[index] || 7);
        const input = [...task.querySelectorAll("input[type=radio]")].find((el) => el.value === desired);
        if (!input) return { ok: false, taskCount: tasks.length, missingRating: desired, index };
        input.click();
        const area = task.querySelector("textarea");
        if (area) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
          setter.call(area, rationales[index] || "");
          area.dispatchEvent(new Event("input", { bubbles: true }));
          area.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      return { ok: true, taskCount: tasks.length };
    })()`);
    assertCondition(result.ok, `${participant.label} Round ${roundNumber} rating selection failed: ${JSON.stringify(result)}`);
    await sleep(300);
    const submitted = await clickVisibleButton(page, `el.innerText.includes("Submit Round ${roundNumber} responses")`);
    assertCondition(submitted, `${participant.label} Round ${roundNumber} submit button not visible.`);
    await sleep(1500);
    text = await visibleText(page);
    assertCondition(text.includes(`Round ${roundNumber} responses submitted`) || text.includes("What was submitted"), `${participant.label} Round ${roundNumber} submit confirmation missing.`);
    await clickVisibleButton(page, `el.innerText.includes("Retain submitted responses")`);
    await sleep(500);
    const screenshotPath = await page.screenshot(`manual-browser-r${roundNumber}-${participant.label}`);
    return {
      participant: participant.label,
      viewport,
      status: "PASS",
      item_count: result.taskCount,
      screenshot_path: screenshotPath,
    };
  } finally {
    await page.close();
  }
}

async function finalParticipantCheckThroughBrowser(participant, viewport) {
  const page = await launchBrowser(`final-${participant.label}-${viewport.width}`, viewport.width, viewport.height, viewport.mobile);
  try {
    await page.navigate(participant.invitationUrl);
    await clickVisibleButton(page, `el.innerText === "Closeout"`);
    await sleep(1000);
    const text = await visibleText(page);
    const screenshotPath = await page.screenshot(`manual-browser-final-${participant.label}-${viewport.width}`);
    return {
      participant: participant.label,
      viewport,
      status: text.includes(requiredStatement) ? "PASS" : "PARTIAL",
      required_limitation_visible: text.includes(requiredStatement),
      has_horizontal_overflow: await page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"),
      has_forbidden_synthetic_label: /SYN-P00[1-8]/.test(text),
      has_forbidden_email: /syn-p00[1-8]@example\\.test/.test(text),
      screenshot_path: screenshotPath,
    };
  } finally {
    await page.close();
  }
}

function viewportFor(roundNumber, participantIndex) {
  if (roundNumber === 1 && participantIndex === 0) return { width: 320, height: 900, mobile: true };
  if (roundNumber === 2 && participantIndex === 1) return { width: 390, height: 900, mobile: true };
  if (roundNumber === 3 && participantIndex === 6) return { width: 414, height: 900, mobile: true };
  if (roundNumber === 4 && participantIndex === 7) return { width: 320, height: 900, mobile: true };
  return { width: 1200, height: 900, mobile: false };
}

async function responseSummary(studyId, versionId) {
  const responses = await requestJson(`/studies/${studyId}/versions/${versionId}/responses`, roles.owner);
  return responses.responses;
}

async function main() {
  await fs.mkdir(artifactDir, { recursive: true });
  const [commit, branch, health, frontend] = await Promise.all([
    execCapture("git", ["rev-parse", "HEAD"]).then((result) => result.stdout),
    execCapture("git", ["branch", "--show-current"]).then((result) => result.stdout),
    requestJson("/health", roles.owner),
    fetch(frontendUrl).then((response) => response.status),
  ]);
  evidence.environment.commit_hash = commit;
  evidence.environment.branch = branch;
  evidence.environment.backend_health = health;
  evidence.environment.frontend_http_status = frontend;
  assertCondition(health.environment === "development", "Backend environment is not visibly development.");
  assertCondition(frontend === 200, "Frontend did not respond with HTTP 200.");

  const studyCreated = await requestJson("/studies", roles.owner, {
    method: "POST",
    body: {
      title: `Manual Browser Mock Trial Classical Delphi ${marker}`,
      description: "Prioritizing features for a fictional community garden scheduling app.",
    },
  });
  const studyId = studyCreated.study.id;
  const versionId = (await requestJson(`/studies/${studyId}/versions`, roles.owner, { method: "POST", body: {} })).studyVersion.id;
  evidence.study = {
    study_id: studyId,
    version_id: versionId,
    title: studyCreated.study.title,
    topic: studyCreated.study.description,
    method: "ClassicDelphi",
  };

  await requestJson(`/studies/${studyId}/ai-config`, roles.owner, {
    method: "PUT",
    body: {
      noExternalAiMode: true,
      externalAiEnabled: false,
      providerName: null,
      modelName: null,
      featurePermissions: {
        clustering: true,
        item_drafting: true,
        neutrality_method_linting: true,
        reminders: false,
        irb_export_drafting: false,
        report_drafting: true,
      },
      disclosure: {
        dataMayBeSentDescription: "No external AI calls are used in this local synthetic browser pass.",
        identifiersExcludedDescription: "Direct identifiers and identity-response mappings are excluded from de-identified outputs.",
        optOutDescription: "No External AI mode remains enabled for this synthetic mock trial.",
        humanInTheLoopDescription: "AI Suggestion (Not Final) outputs require human accept, edit, or reject decisions.",
      },
    },
  });

  await requestJson(`/studies/${studyId}/versions/${versionId}/design`, roles.owner, {
    method: "PATCH",
    body: {
      study_format: "ClassicDelphi",
      planned_round_count: 4,
      terminal_round_number: 4,
      method_rationale:
        "A Classical Delphi design is appropriate because Round 1 elicits open-ended panel input before structured rating and controlled feedback rounds.",
    },
  });
  await requestJson(`/studies/${studyId}/versions/${versionId}/consensus-rule`, roles.owner, {
    method: "PATCH",
    body: {
      consensus_rule_json: {
        type: "percent_agreement",
        threshold: 80,
        agreement_min_rating: 7,
        source: "pi_defined",
        setting_process:
          "The Study Owner defined the synthetic consensus threshold before Round 1 for controlled mock testing.",
        pre_round_consensus_input: {
          enabled: false,
          status: "not_required",
          prompt: "",
          summary: "",
          counts_as_delphi_round: false,
        },
        finalized_before_round_1: true,
      },
    },
  });
  const now = new Date().toISOString();
  await requestJson(`/studies/${studyId}/versions/${versionId}/wizard-packet`, roles.owner, {
    method: "PATCH",
    body: {
      study_design_packet_json: {
        title: studyCreated.study.title,
        description: studyCreated.study.description,
        researchQuestion: studyCreated.study.description,
        researchQuestions: [{
          id: "rq-manual-browser-garden-features",
          displayOrder: 1,
          text: studyCreated.study.description,
          shortLabel: "Garden scheduling features",
          description: "",
          requiredForRound1Response: true,
          active: true,
          createdAt: now,
          updatedAt: now,
        }],
        roundOneMode: "open-ended",
        modifiedDesignAcknowledged: false,
        modifiedDesignRationale: "",
      },
    },
  });

  const consent = await requestJson(`/studies/${studyId}/versions/${versionId}/consent-versions`, roles.owner, {
    method: "POST",
    body: {
      text_md:
        "Synthetic participant information: participation is voluntary; identity is stored separately from responses where feasible; small-panel anonymity cannot be guaranteed; participants may withdraw from future rounds.",
    },
  });
  await requestJson(
    `/studies/${studyId}/versions/${versionId}/consent-versions/${consent.consent_version.consent_version_id}/activate`,
    roles.owner,
    { method: "POST", body: {} },
  );

  for (let roundNumber = 1; roundNumber <= 4; roundNumber += 1) {
    await requestJson(`/studies/${studyId}/versions/${versionId}/rounds/${roundNumber}/config`, roles.owner, {
      method: "PATCH",
      body: roundConfig(roundNumber),
    });
  }

  await requestJson(`/studies/${studyId}/versions/${versionId}/submit-for-signoff`, roles.owner, { method: "POST", body: {} });
  await requestJson(`/studies/${studyId}/versions/${versionId}/signoff`, roles.owner, { method: "POST", body: { note: "Synthetic browser trial owner signoff." } });
  await requestJson(`/studies/${studyId}/versions/${versionId}/signoff`, roles.steward, { method: "POST", body: { note: "Synthetic browser trial ethics and methods signoff." } });
  await requestJson(`/studies/${studyId}/versions/${versionId}/activate`, roles.owner, { method: "POST", body: {} });
  addCheck("study setup and governance signoff via local API", "PASS");

  const consensusChangeAfterLaunch = await requestJson(`/studies/${studyId}/versions/${versionId}/consensus-rule`, roles.owner, {
    method: "PATCH",
    body: { consensus_rule_json: { type: "percent_agreement", threshold: 90, agreement_min_rating: 8 } },
  }).then(
    () => ({ blocked: false }),
    (error) => ({ blocked: String(error.message).includes("409"), message: error.message }),
  );
  addCheck("consensus rule change after launch blocked", consensusChangeAfterLaunch.blocked ? "PASS" : "FAIL", consensusChangeAfterLaunch);

  for (const participant of participants) {
    const created = await requestJson(`/studies/${studyId}/versions/${versionId}/participants`, roles.owner, {
      method: "POST",
      body: { name: participant.name, email: participant.email },
    });
    participant.participantId = created.participant_id;
    const invited = await requestJson(
      `/studies/${studyId}/versions/${versionId}/participants/${participant.participantId}/invitations`,
      roles.owner,
      { method: "POST", body: {} },
    );
    participant.invitationUrl = invited.invitation_url;
    participant.token = tokenFromInvitationUrl(invited.invitation_url);
  }
  evidence.study.participant_count = participants.length;

  await requestJson(`/studies/${studyId}/versions/${versionId}/rounds/1/open`, roles.owner, { method: "POST", body: {} });
  await expectInvitationFailure("/participant/invitation/responses", participants[0].token, 403, {
    method: "POST",
    body: { text: "This should be blocked before consent." },
  });
  addCheck("Round 1 submission blocked before consent", "PASS");

  for (const [index, participant] of participants.entries()) {
    const entry = await submitRoundOneThroughBrowser(participant, index, viewportFor(1, index));
    evidence.browser_participant_submissions.round1.push(entry);
  }
  const round1Responses = await responseSummary(studyId, versionId);
  assertCondition(round1Responses.filter((entry) => entry.response_json?.round_number === 1).length >= 8, "Round 1 browser submissions were not persisted.");
  addCheck("Round 1 all 8 synthetic participants submitted through browser UI", "PASS");

  const supportSent = await submitSupportNoteThroughBrowser(participants[2], { width: 390, height: 900, mobile: true });
  const issuesForStaff = await requestJson(`/studies/${studyId}/versions/${versionId}/participant-issues`, roles.owner);
  const issue = issuesForStaff.issues.find((entry) => entry.note.includes("Synthetic browser support note"));
  assertCondition(issue, "Browser-submitted support note not visible to staff.");
  await requestJson(`/studies/${studyId}/versions/${versionId}/participant-issues/${issue.issue_id}`, roles.owner, {
    method: "PATCH",
    body: { status: "reviewed", staff_response_note: "Synthetic PI browser-pass response: please reload and continue; your participation remains voluntary." },
  });
  const supportVerified = await verifySupportResponseThroughBrowser(participants[2], { width: 390, height: 900, mobile: true });
  const otherIssueView = await requestInvitation("/participant/invitation/issues", participants[3].token);
  evidence.support_loop = {
    browser_note_submission: supportSent,
    staff_visible_count: issuesForStaff.issues.length,
    staff_response_via_api: true,
    participant_response_browser_visible: supportVerified.staff_response_visible,
    other_participant_issue_count: otherIssueView.issues.length,
    response_browser_screenshot_path: supportVerified.screenshot_path,
  };
  assertCondition(supportVerified.staff_response_visible, "Participant did not see support response in browser.");
  assertCondition(otherIssueView.issues.length === 0, "Other participant saw support issue.");
  addCheck("support loop completed with participant browser send/view", "PASS", evidence.support_loop);

  await requestJson(`/studies/${studyId}/versions/${versionId}/rounds/1/close`, roles.owner, { method: "POST", body: {} });
  await publishSuggestionItems(studyId, versionId, 2);
  await requestJson(`/studies/${studyId}/versions/${versionId}/rounds/2/open`, roles.owner, { method: "POST", body: {} });
  for (const [index, participant] of participants.entries()) {
    evidence.browser_participant_submissions.round2.push(await submitRatingRoundThroughBrowser(participant, index, 2, viewportFor(2, index)));
  }
  addCheck("Round 2 all 8 synthetic participants submitted ratings through browser UI", "PASS");
  await requestJson(`/studies/${studyId}/versions/${versionId}/rounds/2/report`, roles.owner);
  await requestJson(`/studies/${studyId}/versions/${versionId}/rounds/2/close`, roles.owner, { method: "POST", body: {} });

  const consensusChangeAfterRound2 = await requestJson(`/studies/${studyId}/versions/${versionId}/consensus-rule`, roles.owner, {
    method: "PATCH",
    body: { consensus_rule_json: { type: "percent_agreement", threshold: 70, agreement_min_rating: 7 } },
  }).then(
    () => ({ blocked: false }),
    (error) => ({ blocked: String(error.message).includes("409"), message: error.message }),
  );
  addCheck("consensus rule change after Round 2 blocked", consensusChangeAfterRound2.blocked ? "PASS" : "FAIL", consensusChangeAfterRound2);

  await publishSuggestionItems(studyId, versionId, 3);
  await requestJson(`/studies/${studyId}/versions/${versionId}/rounds/3/open`, roles.owner, { method: "POST", body: {} });
  for (const [index, participant] of participants.entries()) {
    evidence.browser_participant_submissions.round3.push(await submitRatingRoundThroughBrowser(participant, index, 3, viewportFor(3, index)));
  }
  addCheck("Round 3 all 8 synthetic participants submitted reratings through browser UI", "PASS", { retained_disagreement_participants: ["SYN-P007", "SYN-P008"] });
  await requestJson(`/studies/${studyId}/versions/${versionId}/rounds/3/report`, roles.owner);
  await requestJson(`/studies/${studyId}/versions/${versionId}/rounds/3/close`, roles.owner, { method: "POST", body: {} });

  const consensusChangeAfterRound3 = await requestJson(`/studies/${studyId}/versions/${versionId}/consensus-rule`, roles.owner, {
    method: "PATCH",
    body: { consensus_rule_json: { type: "percent_agreement", threshold: 60, agreement_min_rating: 6 } },
  }).then(
    () => ({ blocked: false }),
    (error) => ({ blocked: String(error.message).includes("409"), message: error.message }),
  );
  addCheck("consensus rule change after Round 3 blocked", consensusChangeAfterRound3.blocked ? "PASS" : "FAIL", consensusChangeAfterRound3);

  await publishSuggestionItems(studyId, versionId, 4);
  await requestJson(`/studies/${studyId}/versions/${versionId}/rounds/4/open`, roles.owner, { method: "POST", body: {} });
  for (const [index, participant] of participants.entries()) {
    evidence.browser_participant_submissions.round4.push(await submitRatingRoundThroughBrowser(participant, index, 4, viewportFor(4, index)));
  }
  addCheck("Round 4 all 8 synthetic participants submitted final ratings through browser UI", "PASS");

  const closedRound4 = await requestJson(`/studies/${studyId}/versions/${versionId}/rounds/4/close`, roles.owner, { method: "POST", body: {} });
  assertCondition(closedRound4.final_result_snapshot?.requiredStatement === requiredStatement, "Final result required statement missing.");
  await requestJson(`/studies/${studyId}/versions/${versionId}/final-results/signoff`, roles.owner, { method: "POST", body: {} });
  await requestJson(`/studies/${studyId}/versions/${versionId}/final-results/signoff`, roles.steward, { method: "POST", body: {} });
  await requestJson(`/studies/${studyId}/versions/${versionId}/final-results/release`, roles.owner, { method: "POST", body: {} });

  for (const viewport of [
    { width: 320, height: 900, mobile: true },
    { width: 390, height: 900, mobile: true },
    { width: 414, height: 900, mobile: true },
  ]) {
    evidence.mobile_width_checks.push(await finalParticipantCheckThroughBrowser(participants[0], viewport));
  }
  evidence.final_browser_check = evidence.mobile_width_checks.find((entry) => entry.width === 390) ?? evidence.mobile_width_checks[0];
  addCheck("mobile-width final participant checks completed", "PASS", { widths: evidence.mobile_width_checks.map((entry) => entry.viewport?.width ?? entry.width) });

  const reportExport = await requestJson(`/studies/${studyId}/versions/${versionId}/export-report`, roles.owner);
  assertCondition(JSON.stringify(reportExport.report).includes(requiredStatement), "Final export report limitation missing.");

  const exportTypes = [
    "final-delphi-report",
    "anonymized-response-dataset",
    "audit-package",
    "provenance-bundle",
    "complete-archive",
  ];
  for (const exportType of exportTypes) {
    const created = await requestJson(`/studies/${studyId}/versions/${versionId}/export-packages`, roles.custodian, {
      method: "POST",
      body: { export_type: exportType },
    });
    const files = await requestJson(
      `/studies/${studyId}/versions/${versionId}/export-packages/${created.export_package.export_package_id}/files`,
      roles.custodian,
    );
    const scan = scanExportPrivacy({
      exportPackage: files.export_package,
      files: files.files,
      knownParticipantIds: participants.map((participant) => participant.participantId),
      knownSyntheticLabels: participants.map((participant) => participant.label),
      knownEmailIdentifiers: participants.map((participant) => participant.email),
    });
    evidence.export_packages.push({
      export_type: exportType,
      export_package_id: created.export_package.export_package_id,
      classification: created.export_package.privacy_metadata?.data_classification ?? null,
      safe_for_deidentified_sharing: created.export_package.privacy_metadata?.safe_for_deidentified_research_report_sharing ?? null,
      direct_identifiers_included: created.export_package.privacy_metadata?.direct_identifiers_included ?? null,
      participant_response_mapping_included: created.export_package.privacy_metadata?.participant_response_mapping_included ?? null,
      file_count: files.files.length,
      scan_failure_count: scan.failures.length,
      scan_warning_count: scan.warnings.length,
      required_limitation_present: files.files.some((file) => String(file.content_text).includes(requiredStatement)),
    });
    evidence.export_scan.failures.push(...scan.failures.map((failure) => ({ export_type: exportType, ...failure })));
    evidence.export_scan.warnings.push(...scan.warnings.map((warning) => ({ export_type: exportType, ...warning })));
  }
  assertCondition(evidence.export_scan.failures.length === 0, "Privacy scan failures found.");
  addCheck("regenerated exports passed privacy scan", "PASS", {
    failures: evidence.export_scan.failures.length,
    warnings: evidence.export_scan.warnings.length,
  });

  const allBrowserRoundsPass = Object.values(evidence.browser_participant_submissions)
    .flat()
    .every((entry) => entry.status === "PASS");
  if (!allBrowserRoundsPass) {
    evidence.defects.P0.push({ id: "FMT-BROWSER-P0-SUBMISSION", summary: "One or more participant browser UI submissions failed." });
  }
  if (evidence.mobile_width_checks.some((entry) => entry.has_horizontal_overflow)) {
    evidence.defects.P2.push({ id: "FMT-BROWSER-P2-MOBILE-OVERFLOW", summary: "Mobile final participant check detected horizontal overflow.", evidence: evidence.mobile_width_checks });
  }
  if (evidence.mobile_width_checks.some((entry) => !entry.required_limitation_visible)) {
    evidence.defects.P1.push({ id: "FMT-BROWSER-P1-FINAL-LIMITATION-VISIBILITY", summary: "Final participant browser check did not show required limitation language.", evidence: evidence.mobile_width_checks });
  }
  if (evidence.mobile_width_checks.some((entry) => entry.has_forbidden_synthetic_label || entry.has_forbidden_email)) {
    evidence.defects.P0.push({ id: "FMT-BROWSER-P0-PARTICIPANT-IDENTIFIER-VISIBLE", summary: "Participant final browser check exposed synthetic labels or emails.", evidence: evidence.mobile_width_checks });
  }
  const failedChecks = evidence.checks.filter((check) => check.status === "FAIL");
  if (failedChecks.length > 0) {
    evidence.defects.P0.push(...failedChecks.map((check) => ({ id: `CHECK-${check.name}`, summary: "Required check failed.", evidence: check })));
  }

  evidence.status =
    evidence.defects.P0.length === 0 && evidence.defects.P1.length === 0
      ? "GO_WITH_CONDITIONS_FOR_CONTROLLED_SYNTHETIC_MOCK_TESTING_ONLY"
      : "NO_GO";
  evidence.run_completed_at = new Date().toISOString();

  const artifactPath = path.join(artifactDir, `manual-browser-mock-trial-run-${runSlug}.json`);
  const latestPath = path.join(artifactDir, "manual-browser-mock-trial-run-latest.json");
  await fs.writeFile(artifactPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  await fs.writeFile(latestPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    status: evidence.status,
    artifact: path.relative(repoRoot, artifactPath).replaceAll("\\", "/"),
    latest: path.relative(repoRoot, latestPath).replaceAll("\\", "/"),
    study_id: studyId,
    version_id: versionId,
    browser_round1: evidence.browser_participant_submissions.round1.length,
    browser_round2: evidence.browser_participant_submissions.round2.length,
    browser_round3: evidence.browser_participant_submissions.round3.length,
    browser_round4: evidence.browser_participant_submissions.round4.length,
    export_failures: evidence.export_scan.failures.length,
    export_warnings: evidence.export_scan.warnings.length,
    defects: Object.fromEntries(Object.entries(evidence.defects).map(([severity, entries]) => [severity, entries.length])),
  }, null, 2));
}

try {
  await main();
} catch (error) {
  evidence.status = "NO_GO";
  evidence.run_completed_at = new Date().toISOString();
  evidence.defects.P0.push({ id: "FMT-BROWSER-RUNNER-FAILURE", summary: String(error?.message ?? error) });
  await fs.mkdir(artifactDir, { recursive: true });
  const failurePath = path.join(artifactDir, `manual-browser-mock-trial-run-${runSlug}-failed.json`);
  await fs.writeFile(failurePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.error(JSON.stringify({
    status: evidence.status,
    artifact: path.relative(repoRoot, failurePath).replaceAll("\\", "/"),
    error: String(error?.message ?? error),
  }, null, 2));
  process.exitCode = 1;
}
