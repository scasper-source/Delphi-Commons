/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 *
 * Local controlled synthetic mock-trial evidence runner.
 *
 * Scope:
 * - local/dev backend only
 * - synthetic data only
 * - no external AI calls
 * - no real participant data
 */

import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
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
const marker = `FMT-${Date.now().toString(36)}`;
const requiredStatement = "Consensus indicates agreement among this panel; it does not establish correctness.";

const { scanExportPrivacy } = await import(
  pathToFileURL(path.join(repoRoot, "server", "dist", "exports", "exportPrivacy.js")).href
);

const roles = {
  owner: { userId: "study_owner-dev-user", role: "owner" },
  steward: { userId: "ethics_methods_steward-dev-user", role: "methods_steward" },
  custodian: { userId: "data_custodian-dev-user", role: "data_custodian" },
  participant: { userId: "panelist-dev-user", role: "participant" },
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
  mode: "local_api_driven_with_headless_browser_mobile_smoke",
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
    browser: "Microsoft Edge headless when available; in-app browser inspection may be performed separately",
    mobile_widths: [320, 390, 414],
  },
  commands: [],
  study: {},
  checks: [],
  counts: {},
  ai: {
    mode: "existing deterministic local AI helpers; No External AI mode",
    external_ai_enabled: null,
    no_external_ai_mode: null,
    suggestions: [],
  },
  support_loop: {},
  export_packages: [],
  export_scan: {
    failures: [],
    warnings: [],
  },
  browser_mobile_smoke: [],
  browser_execution_scope: {
    all_8_participant_submissions_via_browser_ui: false,
    all_8_participant_submissions_via_local_invitation_api: true,
    headless_mobile_smoke_completed: false,
    manual_in_app_browser_pass_completed: false,
    note:
      "The full 8-participant, 4-round lifecycle is API-driven through local invitation endpoints. Browser evidence is headless mobile-width smoke of participant and staff views, not a manual all-8 UI submission pass.",
  },
  defects: {
    P0: [],
    P1: [],
    P2: [],
    P3: [],
  },
  status: "IN_PROGRESS",
};

function commandRecord(command, cwd = repoRoot) {
  evidence.commands.push({ command, cwd });
}

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function addCheck(name, status, details = {}) {
  evidence.checks.push({ name, status, ...details });
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
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: options.method ?? "GET",
    headers: headers(actor),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = body && typeof body === "object" && "error" in body ? body.error : text;
    throw new Error(`${options.method ?? "GET"} ${pathname} returned ${response.status}: ${error}`);
  }
  return body;
}

async function requestInvitation(pathname, token, options = {}) {
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
  if (!response.ok) {
    const error = body && typeof body === "object" && "error" in body ? body.error : text;
    const err = new Error(`${options.method ?? "GET"} ${pathname} returned ${response.status}: ${error}`);
    err.status = response.status;
    err.payload = body;
    throw err;
  }
  return body;
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
  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const token = hashParams.get("invite");
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
  if (itemIndex === 0) return participantIndex < 8 ? 8 : 5;
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
    reminder_body:
      `This is a neutral reminder that Round ${roundNumber} is open. Participation remains voluntary.`,
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
  evidence.ai.suggestions.push({
    suggestion_id: suggestion.suggestion_id,
    feature: suggestion.feature,
    label: suggestion.label,
    target_round_number: targetRoundNumber,
    candidate_count: suggestion.output_json?.candidates?.length ?? null,
    decision_before_human: suggestion.decision,
  });
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
    { method: "POST", body: { note: "Study Owner release signoff for synthetic mock trial." } },
  );
  await requestJson(
    `/studies/${studyId}/versions/${versionId}/ai/suggestions/${suggestion.suggestion_id}/release-signoff`,
    roles.steward,
    { method: "POST", body: { note: "Ethics and Methods Steward release signoff for synthetic mock trial." } },
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

async function submitRatingsForRound(studyId, versionId, roundNumber) {
  const itemsByToken = [];
  for (const participant of participants) {
    const listed = await requestInvitation(`/participant/invitation/rounds/${roundNumber}/items`, participant.token);
    assertCondition(listed.items.length > 0, `Round ${roundNumber} has no participant-facing items`);
    itemsByToken.push(listed.items);
  }
  const itemCount = itemsByToken[0].length;
  for (const [participantIndex, participant] of participants.entries()) {
    for (const [itemIndex, item] of itemsByToken[participantIndex].entries()) {
      await requestInvitation(`/participant/invitation/rounds/${roundNumber}/ratings`, participant.token, {
        method: "POST",
        body: {
          item_id: item.item_id,
          rating: ratingFor(roundNumber, participantIndex, itemIndex),
          action: participantIndex >= 6 && itemIndex >= 2 ? "keep" : "revise",
          rationale_text: rationaleFor(roundNumber, participantIndex, itemIndex),
        },
      });
    }
  }
  return itemCount;
}

function findEdge() {
  const candidates = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ];
  return candidates;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function cdpRequest(ws, method, params = {}) {
  const id = ++cdpRequest.nextId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cdpRequest.pending.delete(id);
      reject(new Error(`CDP timeout for ${method}`));
    }, 10000);
    cdpRequest.pending.set(id, { resolve, reject, timeout });
  });
}
cdpRequest.nextId = 0;
cdpRequest.pending = new Map();

async function runHeadlessBrowserSmoke(url, width, label) {
  for (const executable of findEdge()) {
    try {
      await fs.access(executable);
      const userDataDir = path.join(artifactDir, `edge-profile-${runSlug}-${width}-${label}`);
      await fs.mkdir(userDataDir, { recursive: true });
      const port = 9300 + Math.floor(Math.random() * 2000);
      const screenshotPath = path.join(artifactDir, `${label}-${width}.png`);
      const proc = execFile(executable, [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${userDataDir}`,
        "--window-size=1200,900",
        "about:blank",
      ]);
      try {
        let pageInfo = null;
        for (let attempt = 0; attempt < 50; attempt += 1) {
          await sleep(200);
          try {
            const pages = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json());
            pageInfo = pages.find((page) => page.type === "page") ?? pages[0];
            if (pageInfo?.webSocketDebuggerUrl) break;
          } catch {
            // Browser is still starting.
          }
        }
        if (!pageInfo?.webSocketDebuggerUrl) throw new Error("CDP target not available");

        const ws = new WebSocket(pageInfo.webSocketDebuggerUrl);
        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          if (message.id && cdpRequest.pending.has(message.id)) {
            const pending = cdpRequest.pending.get(message.id);
            clearTimeout(pending.timeout);
            cdpRequest.pending.delete(message.id);
            if (message.error) pending.reject(new Error(message.error.message));
            else pending.resolve(message.result);
          }
        };
        await new Promise((resolve, reject) => {
          ws.onopen = resolve;
          ws.onerror = reject;
        });
        await cdpRequest(ws, "Page.enable");
        await cdpRequest(ws, "Runtime.enable");
        await cdpRequest(ws, "Emulation.setDeviceMetricsOverride", {
          width,
          height: 900,
          deviceScaleFactor: 1,
          mobile: true,
        });
        await cdpRequest(ws, "Page.navigate", { url });
        await sleep(2500);
        const metrics = await cdpRequest(ws, "Runtime.evaluate", {
          returnByValue: true,
          expression: `(() => {
            const text = document.body ? document.body.innerText : "";
            const buttons = [...document.querySelectorAll("button")].filter((el) => !el.disabled).map((el) => el.innerText.trim()).filter(Boolean);
            const fields = [...document.querySelectorAll("textarea,input,select")].map((el) => ({ tag: el.tagName, type: el.type || "", disabled: !!el.disabled, text: el.getAttribute("aria-label") || el.getAttribute("placeholder") || "" }));
            return {
              url: location.href,
              title: document.title,
              innerWidth: window.innerWidth,
              clientWidth: document.documentElement.clientWidth,
              scrollWidth: document.documentElement.scrollWidth,
              horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
              bodyTextSample: text.slice(0, 2000),
              visibleButtons: buttons.slice(0, 20),
              fieldCount: fields.length,
              fields: fields.slice(0, 20),
              hasTroubleSupport: text.includes("Having trouble?") || text.includes("Participant Issue Notes"),
              hasConsensusLimitation: text.includes("${requiredStatement}"),
              hasForbiddenSyntheticLabel: /SYN-P00[1-8]/.test(text),
              hasForbiddenEmail: /syn-p00[1-8]@example\\.test/.test(text),
            };
          })()`,
        });
        const screenshot = await cdpRequest(ws, "Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
        await fs.writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));
        ws.close();
        proc.kill();
        return {
          label,
          width,
          url,
          executable,
          screenshot_path: path.relative(repoRoot, screenshotPath).replaceAll("\\", "/"),
          metrics: metrics.result.value,
          status: metrics.result.value.horizontalOverflow ? "WARN" : "PASS",
        };
      } catch (error) {
        proc.kill();
        throw error;
      }
    } catch {
      // Try next executable.
    }
  }
  return { label, width, url, status: "NOT_RUN", reason: "No supported headless browser executable found." };
}

async function main() {
  await fs.mkdir(artifactDir, { recursive: true });

  const [commit, branch, health] = await Promise.all([
    execCapture("git", ["rev-parse", "HEAD"]).then((result) => result.stdout),
    execCapture("git", ["branch", "--show-current"]).then((result) => result.stdout),
    requestJson("/health", roles.owner),
  ]);
  evidence.environment.commit_hash = commit;
  evidence.environment.branch = branch;
  evidence.environment.backend_health = health;
  assertCondition(health.environment === "development", "Backend environment is not visibly development");
  addCheck("backend environment visibly development", "PASS", { environment: health.environment });

  const studyCreated = await requestJson("/studies", roles.owner, {
    method: "POST",
    body: {
      title: `Full Mock Trial Classical Delphi ${marker}`,
      description: "Prioritizing features for a fictional community garden scheduling app.",
    },
  });
  const studyId = studyCreated.study.id;
  const versionCreated = await requestJson(`/studies/${studyId}/versions`, roles.owner, {
    method: "POST",
    body: {},
  });
  const versionId = versionCreated.studyVersion.id;
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
        dataMayBeSentDescription: "No external AI calls are used in this local synthetic mock trial.",
        identifiersExcludedDescription: "Direct identifiers and identity-response mappings are excluded from de-identified outputs.",
        optOutDescription: "No External AI mode remains enabled for the synthetic mock trial.",
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
  await requestJson(`/studies/${studyId}/versions/${versionId}/wizard-packet`, roles.owner, {
    method: "PATCH",
    body: {
      study_design_packet_json: {
        title: studyCreated.study.title,
        description: studyCreated.study.description,
        researchQuestion: studyCreated.study.description,
        researchQuestions: [{
          id: "rq-full-mock-garden-features",
          displayOrder: 1,
          text: studyCreated.study.description,
          shortLabel: "Garden scheduling features",
          description: "",
          requiredForRound1Response: true,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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

  await requestJson(`/studies/${studyId}/versions/${versionId}/submit-for-signoff`, roles.owner, {
    method: "POST",
    body: {},
  });
  await requestJson(`/studies/${studyId}/versions/${versionId}/signoff`, roles.owner, {
    method: "POST",
    body: { note: "Synthetic mock trial owner signoff." },
  });
  await requestJson(`/studies/${studyId}/versions/${versionId}/signoff`, roles.steward, {
    method: "POST",
    body: { note: "Synthetic mock trial ethics and methods signoff." },
  });
  await requestJson(`/studies/${studyId}/versions/${versionId}/activate`, roles.owner, {
    method: "POST",
    body: {},
  });
  addCheck("study setup and governance signoff", "PASS");

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

  await requestJson(`/studies/${studyId}/versions/${versionId}/rounds/1/open`, roles.owner, {
    method: "POST",
    body: {},
  });
  await expectInvitationFailure("/participant/invitation/responses", participants[0].token, 403, {
    method: "POST",
    body: { text: "This should be blocked before consent." },
  });
  addCheck("Round 1 submission blocked before consent", "PASS");

  for (const [index, participant] of participants.entries()) {
    const context = await requestInvitation("/participant/invitation", participant.token);
    assertCondition(context.study?.title?.includes(marker), "Participant invitation did not resolve active synthetic study");
    await requestInvitation("/participant/invitation/consent", participant.token, { method: "POST", body: {} });
    await requestInvitation("/participant/invitation/orientation/complete", participant.token, { method: "POST", body: {} });
    await requestInvitation("/participant/invitation/responses", participant.token, {
      method: "POST",
      body: { text: openResponseText(index) },
    });
  }
  addCheck("Round 1 all 8 synthetic participants submitted", "PASS");

  const issue = await requestInvitation("/participant/invitation/issues", participants[2].token, {
    method: "POST",
    body: {
      round_number: 1,
      page_context: "Round 1 participant task",
      issue_type: "button_or_textbox_not_working",
      note: "Synthetic support note from SYN-P003 for controlled mock testing only.",
    },
  });
  const issuesForStaff = await requestJson(`/studies/${studyId}/versions/${versionId}/participant-issues`, roles.owner);
  await requestJson(`/studies/${studyId}/versions/${versionId}/participant-issues/${issue.issue.issue_id}`, roles.owner, {
    method: "PATCH",
    body: { status: "reviewed", staff_response_note: "Synthetic PI response: please reload and continue; your response remains voluntary." },
  });
  const participantIssueView = await requestInvitation("/participant/invitation/issues", participants[2].token);
  const otherParticipantIssueView = await requestInvitation("/participant/invitation/issues", participants[3].token);
  evidence.support_loop = {
    issue_id: issue.issue.issue_id,
    staff_visible_count: issuesForStaff.issues.length,
    participant_response_visible: participantIssueView.issues.some((entry) => entry.issue_id === issue.issue.issue_id && entry.staff_response_note),
    other_participant_issue_count: otherParticipantIssueView.issues.length,
  };
  assertCondition(evidence.support_loop.participant_response_visible, "Participant did not see support response");
  assertCondition(evidence.support_loop.other_participant_issue_count === 0, "Other participant saw support issue");
  addCheck("support loop end to end", "PASS", evidence.support_loop);

  await requestJson(`/studies/${studyId}/versions/${versionId}/rounds/1/close`, roles.owner, { method: "POST", body: {} });
  const round2Items = await publishSuggestionItems(studyId, versionId, 2);
  await requestJson(`/studies/${studyId}/versions/${versionId}/rounds/2/open`, roles.owner, { method: "POST", body: {} });
  const round2Count = await submitRatingsForRound(studyId, versionId, 2);
  addCheck("Round 2 all 8 synthetic participants submitted ratings", "PASS", { item_count: round2Count });
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
  const round3Count = await submitRatingsForRound(studyId, versionId, 3);
  addCheck("Round 3 all 8 synthetic participants submitted reratings", "PASS", { item_count: round3Count, retained_disagreement_participants: ["SYN-P007", "SYN-P008"] });
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
  const round4Count = await submitRatingsForRound(studyId, versionId, 4);
  addCheck("Round 4 all 8 synthetic participants submitted final ratings", "PASS", { item_count: round4Count });
  const closedRound4 = await requestJson(`/studies/${studyId}/versions/${versionId}/rounds/4/close`, roles.owner, { method: "POST", body: {} });
  assertCondition(closedRound4.final_result_snapshot?.requiredStatement === requiredStatement, "Final result required statement missing");

  await requestJson(`/studies/${studyId}/versions/${versionId}/final-results/signoff`, roles.owner, { method: "POST", body: {} });
  await requestJson(`/studies/${studyId}/versions/${versionId}/final-results/signoff`, roles.steward, { method: "POST", body: {} });
  await requestJson(`/studies/${studyId}/versions/${versionId}/final-results/release`, roles.owner, { method: "POST", body: {} });
  const participantFinal = await requestInvitation("/participant/invitation/final-results", participants[0].token);
  assertCondition(participantFinal.snapshot?.requiredStatement === requiredStatement, "Participant final results limitation missing");
  addCheck("final results released to participant invitation view", "PASS");

  const reportExport = await requestJson(`/studies/${studyId}/versions/${versionId}/export-report`, roles.owner);
  assertCondition(JSON.stringify(reportExport.report).includes(requiredStatement), "Final export report limitation missing");
  addCheck("final report generated with required limitation", "PASS");

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
  assertCondition(evidence.export_scan.failures.length === 0, "Privacy scan failures found");
  addCheck("regenerated exports passed privacy scan", "PASS", {
    failures: evidence.export_scan.failures.length,
    warnings: evidence.export_scan.warnings.length,
  });

  const aiConfig = await requestJson(`/studies/${studyId}/ai-config`, roles.owner);
  evidence.ai.external_ai_enabled = aiConfig.ai_config.externalAiEnabled;
  evidence.ai.no_external_ai_mode = aiConfig.ai_config.noExternalAiMode;
  assertCondition(aiConfig.ai_config.externalAiEnabled === false, "External AI unexpectedly enabled");
  assertCondition(aiConfig.ai_config.noExternalAiMode === true, "No External AI mode not active");
  addCheck("external AI boundary", "PASS", {
    external_ai_enabled: aiConfig.ai_config.externalAiEnabled,
    no_external_ai_mode: aiConfig.ai_config.noExternalAiMode,
  });

  evidence.counts = {
    participants: participants.length,
    round1_open_text_submissions: participants.length,
    round2_rating_participants: participants.length,
    round3_rating_participants: participants.length,
    round4_rating_participants: participants.length,
    round2_items: round2Items.length,
    export_packages: evidence.export_packages.length,
  };

  const participantUrl = `${frontendUrl}/#invite=${encodeURIComponent(participants[0].token)}`;
  const staffUrl = frontendUrl;
  for (const width of evidence.environment.mobile_widths) {
    evidence.browser_mobile_smoke.push(await runHeadlessBrowserSmoke(participantUrl, width, `participant-final-${width}`));
    evidence.browser_mobile_smoke.push(await runHeadlessBrowserSmoke(staffUrl, width, `staff-dashboard-${width}`));
  }
  evidence.browser_execution_scope.headless_mobile_smoke_completed =
    evidence.browser_mobile_smoke.length > 0 &&
    evidence.browser_mobile_smoke.every((entry) => entry.status === "PASS");
  evidence.defects.P2.push({
    id: "FMT-P2-BROWSER-SCOPE",
    summary:
      "The complete 8-participant, 4-round lifecycle was API-driven through local invitation endpoints; browser evidence was headless mobile smoke, not a manual all-8 browser submission pass.",
    evidence: evidence.browser_execution_scope,
  });
  const mobileWarnings = evidence.browser_mobile_smoke.filter((entry) => entry.status === "WARN");
  const mobileNotRun = evidence.browser_mobile_smoke.filter((entry) => entry.status === "NOT_RUN");
  if (mobileWarnings.length > 0) {
    evidence.defects.P2.push({
      id: "FMT-P2-MOBILE-SMOKE-WARN",
      summary: "Headless mobile smoke detected horizontal overflow on one or more inspected pages.",
      evidence: mobileWarnings,
    });
  }
  if (mobileNotRun.length > 0) {
    evidence.defects.P2.push({
      id: "FMT-P2-MOBILE-SMOKE-NOT-RUN",
      summary: "Headless mobile smoke could not run for one or more inspected pages.",
      evidence: mobileNotRun,
    });
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

  const artifactPath = path.join(artifactDir, `full-mock-trial-run-${runSlug}.json`);
  const latestPath = path.join(artifactDir, "full-mock-trial-run-latest.json");
  await fs.writeFile(artifactPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  await fs.writeFile(latestPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    status: evidence.status,
    artifact: path.relative(repoRoot, artifactPath).replaceAll("\\", "/"),
    latest: path.relative(repoRoot, latestPath).replaceAll("\\", "/"),
    study_id: studyId,
    version_id: versionId,
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
  evidence.defects.P0.push({
    id: "FMT-P0-RUNNER-FAILURE",
    summary: "The controlled synthetic mock-trial runner failed before completing required evidence.",
    error: error instanceof Error ? error.message : String(error),
  });
  await fs.mkdir(artifactDir, { recursive: true });
  const failurePath = path.join(artifactDir, `full-mock-trial-run-${runSlug}-failed.json`);
  await fs.writeFile(failurePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.error(JSON.stringify({
    status: evidence.status,
    artifact: path.relative(repoRoot, failurePath).replaceAll("\\", "/"),
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
}
