import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const artifactDir = path.join(__dirname, 'artifacts');
const baseUrl = process.env.EDELPHI_SMS_E2E_API_URL ?? 'http://127.0.0.1:3001';
const frontendUrl = process.env.EDELPHI_SMS_E2E_FRONTEND_URL ?? 'http://127.0.0.1:5173';
const runAt = new Date().toISOString();
const slug = runAt.replace(/[:.]/g, '-');
const marker = `PMTF-${Date.now().toString(36)}`;

const roles = {
  owner: { userId: 'study_owner-dev-user', role: 'owner' },
  steward: { userId: 'methods-steward-dev-user', role: 'methods_steward' },
};

const evidence = {
  run_at: runAt,
  commit: null,
  boundary: 'Local synthetic/internal mobile-browser automation evidence only; not production/pilot/human-subject/real-SMS/accessibility/real-device evidence.',
  environment: {
    api_url: baseUrl,
    frontend_url: frontendUrl,
    mobile_viewport: { width: 390, height: 844, device_scale_factor: 3 },
  },
  synthetic: {
    marker,
    study_id: null,
    version_id: null,
    flow_participant_ref: null,
    withdrawal_participant_ref: null,
    flow_invitation_token: null,
    withdrawal_invitation_token: null,
  },
  browser: {
    executable: null,
    observations: [],
  },
  steps: [],
};

function step(name, status, reason, details = {}) {
  evidence.steps.push({ name, status, reason, ...details });
}

function headers(actor) {
  return {
    'Content-Type': 'application/json',
    'X-User-ID': actor.userId,
    'X-User-Role': actor.role,
    Origin: frontendUrl,
  };
}

async function req(url, actor = roles.owner, options = {}) {
  const response = await fetch(`${baseUrl}${url}`, {
    method: options.method ?? 'GET',
    headers: headers(actor),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    const error = body && typeof body === 'object' && 'error' in body ? body.error : text;
    throw new Error(`${options.method ?? 'GET'} ${url} returned ${response.status}: ${error}`);
  }
  return body;
}

async function reqInvitation(url, token, options = {}) {
  const response = await fetch(`${baseUrl}${url}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Participant-Invitation': token,
      Origin: frontendUrl,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    const error = body && typeof body === 'object' && 'error' in body ? body.error : text;
    throw new Error(`${options.method ?? 'GET'} ${url} returned ${response.status}: ${error}`);
  }
  return body;
}

async function safeFetch(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

function redactToken(token) {
  return `redacted:${token.slice(0, 6)}...${token.slice(-4)}`;
}

function redactId(value) {
  return `${String(value).slice(0, 8)}...`;
}

function tokenFromInvitationUrl(invitationUrl) {
  const parsed = new URL(invitationUrl);
  const hash = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash;
  const token = new URLSearchParams(hash).get('invite') ?? parsed.searchParams.get('invite');
  if (!token) throw new Error('invitation_token_missing');
  return token;
}

function ratingRoundConfig(roundNumber) {
  return {
    task_type: 'rating',
    title: `Round ${roundNumber}: Structured judgment`,
    prompt: `Review the synthetic candidate statement for Round ${roundNumber}.`,
    participant_instructions: 'Use your own judgment. You may retain disagreement or revise your rating.',
    response_window_days: 7,
    reminder_subject: `Round ${roundNumber} is open`,
    reminder_body: `This is a neutral reminder that Round ${roundNumber} is open. Participation remains voluntary.`,
    controlled_feedback_enabled: true,
    ai_curation_enabled: false,
    feedback_config: {
      format: 'distribution_summary',
      show_participant_prior_response: true,
    },
    status: 'Ready',
  };
}

function browserCandidates() {
  return [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/microsoft-edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function evaluate(send, expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? 'browser_evaluation_failed');
  }
  return result.result?.value;
}

function textSample(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, 500);
}

async function inspectMobile(label, url, options = {}) {
  let lastError = null;
  const expected = options.expect ?? [];
  for (const executable of browserCandidates()) {
    try {
      await fs.access(executable);
    } catch {
      continue;
    }

    const port = 9800 + Math.floor(Math.random() * 800);
    const userData = path.join(os.tmpdir(), `edelphi-phase3-mobile-${slug}-${label.replace(/[^a-z0-9_-]/gi, '-')}`);
    const proc = execFile(executable, [
      '--headless=new',
      '--disable-gpu',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userData}`,
      'about:blank',
    ]);

    try {
      let wsUrl = null;
      for (let i = 0; i < 50; i += 1) {
        await sleep(200);
        try {
          const pages = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json());
          wsUrl = (pages.find((page) => page.type === 'page') ?? pages[0])?.webSocketDebuggerUrl ?? null;
          if (wsUrl) break;
        } catch {
          // Browser is still starting.
        }
      }
      if (!wsUrl) throw new Error('cdp_unavailable');
      if (!globalThis.WebSocket) throw new Error('node_websocket_unavailable');

      const ws = new WebSocket(wsUrl);
      const pending = new Map();
      let id = 0;
      ws.addEventListener('message', (event) => {
        const message = JSON.parse(String(event.data));
        if (message.id && pending.has(message.id)) {
          pending.get(message.id)(message);
          pending.delete(message.id);
        }
      });
      await new Promise((resolve, reject) => {
        ws.addEventListener('open', resolve, { once: true });
        ws.addEventListener('error', reject, { once: true });
      });
      const send = (method, params = {}) => new Promise((resolve, reject) => {
        const requestId = ++id;
        pending.set(requestId, (message) => message.error ? reject(new Error(message.error.message)) : resolve(message.result));
        ws.send(JSON.stringify({ id: requestId, method, params }));
      });

      await send('Page.enable');
      await send('Runtime.enable');
      await send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        mobile: true,
      });
      await send('Page.navigate', { url });
      await sleep(options.initialWaitMs ?? 3000);

      for (const action of options.actions ?? []) {
        const value = await evaluate(send, action.expression);
        if (action.expectValue !== undefined && value !== action.expectValue) {
          throw new Error(`${action.name ?? 'browser_action'}:${value}`);
        }
        await sleep(action.waitMs ?? 1000);
      }

      const text = await evaluate(send, 'document.body.innerText');
      for (const pattern of expected) {
        if (!pattern.test(String(text ?? ''))) {
          throw new Error(`missing_expected_text:${pattern}`);
        }
      }

      const screenshotResult = await send('Page.captureScreenshot', { format: 'png' });
      const screenshotName = `phase3-mobile-viewport-${slug}-${label.replace(/[^a-z0-9_-]/gi, '-').toLowerCase()}.png`;
      const screenshotPath = path.join(artifactDir, screenshotName);
      await fs.writeFile(screenshotPath, Buffer.from(screenshotResult.data, 'base64'));

      ws.close();
      proc.kill();
      await fs.rm(userData, { recursive: true, force: true }).catch(() => undefined);
      evidence.browser.executable ??= executable;
      evidence.browser.observations.push({
        label,
        status: 'PASS',
        expected: expected.map((pattern) => String(pattern)),
        text_sample: textSample(text),
        screenshot_path: path.relative(repoRoot, screenshotPath),
        evidence_classification: 'browser_viewport_only_not_real_device',
      });
      return { executable, text, screenshotPath };
    } catch (error) {
      lastError = error;
      proc.kill();
      await fs.rm(userData, { recursive: true, force: true }).catch(() => undefined);
    }
  }
  throw lastError ?? new Error('no_edge_or_chrome_available');
}

function setTextAreaExpression(text, selector = 'textarea') {
  return `
    (() => {
      const target = [...document.querySelectorAll(${JSON.stringify(selector)})][0];
      if (!target) return 'no_textarea';
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (setter) setter.call(target, ${JSON.stringify(text)}); else target.value = ${JSON.stringify(text)};
      target.dispatchEvent(new Event('input', { bubbles: true }));
      return 'filled';
    })()
  `;
}

function roundOneSubmitExpression(text) {
  return `
    (() => {
      const textareas = [...document.querySelectorAll('textarea')];
      const target = textareas.find((entry) => /Round 1 response/i.test(entry.getAttribute('aria-label') || '')) || textareas[0];
      if (!target) return 'no_textarea';
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (setter) setter.call(target, ${JSON.stringify(text)}); else target.value = ${JSON.stringify(text)};
      target.dispatchEvent(new Event('input', { bubbles: true }));
      const checkbox = [...document.querySelectorAll('input[type="checkbox"]')][0];
      if (checkbox && !checkbox.checked) checkbox.click();
      const submit = [...document.querySelectorAll('button')].find((button) => /Submit Round 1 response/i.test(button.textContent || ''));
      if (!submit) return 'no_submit';
      submit.click();
      return 'submitted';
    })()
  `;
}

function openSupportExpression() {
  return `
    (() => {
      const button = [...document.querySelectorAll('button')].find((entry) => /Having trouble\\?/i.test(entry.textContent || ''));
      if (!button) return 'no_support_button';
      button.click();
      return 'opened';
    })()
  `;
}

function submitSupportExpression(note) {
  return `
    (() => {
      const target = [...document.querySelectorAll('.participant-issue-panel textarea')][0] || [...document.querySelectorAll('textarea')].at(-1);
      if (!target) return 'no_issue_textarea';
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (setter) setter.call(target, ${JSON.stringify(note)}); else target.value = ${JSON.stringify(note)};
      target.dispatchEvent(new Event('input', { bubbles: true }));
      const submit = [...document.querySelectorAll('button')].find((button) => /Send issue note/i.test(button.textContent || ''));
      if (!submit) return 'no_issue_submit';
      submit.click();
      return 'submitted';
    })()
  `;
}

function laterRoundSubmitExpression(rationale) {
  return `
    (() => {
      const radio = [...document.querySelectorAll('input[type="radio"]')].find((entry) => entry.value === '7') || [...document.querySelectorAll('input[type="radio"]')][0];
      if (!radio) return 'no_rating';
      radio.click();
      const rationaleBox = [...document.querySelectorAll('textarea')].at(-1);
      if (rationaleBox) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
        if (setter) setter.call(rationaleBox, ${JSON.stringify(rationale)}); else rationaleBox.value = ${JSON.stringify(rationale)};
        rationaleBox.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const submit = [...document.querySelectorAll('button')].find((button) => /Submit Round \\d+ responses/i.test(button.textContent || ''));
      if (!submit) return 'no_submit';
      submit.click();
      return 'submitted';
    })()
  `;
}

function withdrawExpression() {
  return `
    (() => {
      const button = [...document.querySelectorAll('button')].find((entry) => /Withdraw from future participation/i.test(entry.textContent || ''));
      if (!button) return 'no_withdraw_button';
      button.click();
      return 'clicked';
    })()
  `;
}

function closeoutExpression() {
  return `
    (() => {
      const button = [...document.querySelectorAll('button')].find((entry) => /Closeout/i.test(entry.textContent || ''));
      if (!button) return 'no_closeout_button';
      button.click();
      return 'clicked';
    })()
  `;
}

async function writeArtifacts() {
  const md = `# Phase 3 Mobile Web Task-Flow Scaffold (Local Synthetic)

- Run at: ${runAt}
- Commit: ${evidence.commit}
- Base URL: ${baseUrl}
- Frontend URL: ${frontendUrl}
- Synthetic study/version: ${evidence.synthetic.study_id ?? 'not-created'}/${evidence.synthetic.version_id ?? 'not-created'}
- Flow participant ref: ${evidence.synthetic.flow_participant_ref ?? 'not-created'}
- Withdrawal participant ref: ${evidence.synthetic.withdrawal_participant_ref ?? 'not-created'}
- Browser: ${evidence.browser.executable ? path.basename(evidence.browser.executable) : 'not-run'}
- Boundary: ${evidence.boundary}

## Step Results
${evidence.steps.map((entry) => `- ${entry.status} ${entry.name}: ${entry.reason}`).join('\n')}

## Mobile Browser Observations
${evidence.browser.observations.map((entry) => `- ${entry.status} ${entry.label}: ${entry.expected.join(', ')} (${entry.evidence_classification ?? 'browser_viewport_only_not_real_device'})\n  - Screenshot: ${entry.screenshot_path ?? 'not-captured'}`).join('\n') || '- Not run'}
`;

  const out = path.join(artifactDir, `phase3-mobile-task-flow-scaffold-${slug}.md`);
  await fs.mkdir(artifactDir, { recursive: true });
  await fs.writeFile(out, md, 'utf8');
  await fs.writeFile(path.join(artifactDir, 'phase3-mobile-task-flow-scaffold-latest.json'), JSON.stringify(evidence, null, 2));
  console.log(`Wrote artifact: ${out}`);
}

async function main() {
  await fs.mkdir(artifactDir, { recursive: true });
  const git = await new Promise((resolve) => execFile('git', ['rev-parse', 'HEAD'], { cwd: repoRoot }, (_, stdout) => resolve(stdout.trim())));
  evidence.commit = git;

  const apiUp = await safeFetch(`${baseUrl}/health`);
  const frontendUp = await safeFetch(frontendUrl);
  if (!apiUp || !frontendUp) {
    step(
      'precondition_backend_frontend',
      'FAIL',
      'Local API/frontend prerequisites are not reachable; start both services and rerun for task-flow evidence.',
      { api_up: apiUp, frontend_up: frontendUp },
    );
    return;
  }
  step('precondition_backend_frontend', 'PASS', 'Local API and frontend are reachable.');

  const createdStudy = await req('/studies', roles.owner, {
    method: 'POST',
    body: {
      title: `Synthetic Phase 3 Mobile Task Flow ${marker}`,
      description: 'Synthetic local mobile task-flow scaffold study.',
    },
  });
  const studyId = createdStudy.study.id;
  const createdVersion = await req(`/studies/${studyId}/versions`, roles.owner, { method: 'POST', body: {} });
  const versionId = createdVersion.studyVersion.id;
  evidence.synthetic.study_id = studyId;
  evidence.synthetic.version_id = versionId;

  await req(`/studies/${studyId}/versions/${versionId}/design`, roles.owner, {
    method: 'PATCH',
    body: {
      study_format: 'ModifiedDelphi',
      planned_round_count: 3,
      terminal_round_number: 3,
      method_rationale: 'Synthetic local Phase 3 mobile task-flow scaffold.',
    },
  });
  await req(`/studies/${studyId}/versions/${versionId}/consensus-rule`, roles.owner, {
    method: 'PATCH',
    body: {
      consensus_rule_json: {
        type: 'percent_agreement',
        threshold: 80,
        agreement_min_rating: 7,
        source: 'pi_defined',
        setting_process: 'Synthetic locked rule for local mobile scaffold.',
        pre_round_consensus_input: { status: 'not_required', summary: 'Synthetic scaffold.' },
      },
    },
  });
  await req(`/studies/${studyId}/versions/${versionId}/wizard-packet`, roles.owner, {
    method: 'PATCH',
    body: {
      study_design_packet_json: {
        title: `Synthetic Phase 3 Mobile Task Flow ${marker}`,
        description: 'Synthetic local mobile task-flow scaffold.',
        consentSummary: 'Synthetic consent, confidentiality, voluntary participation, and withdrawal rights.',
        confidentialityStatement: 'Synthetic responses are confidential to approved study-team roles.',
        withdrawalProcess: 'Synthetic participants may withdraw from future participation.',
        researchQuestions: [
          {
            id: 'rq1',
            text: 'What should the synthetic panel prioritize?',
            shortLabel: 'Priority',
            requiredForRound1Response: true,
            active: true,
          },
        ],
      },
    },
  });
  const consentVersion = await req(`/studies/${studyId}/versions/${versionId}/consent-versions`, roles.owner, {
    method: 'POST',
    body: {
      text_md: [
        '# Synthetic Consent',
        '',
        'This local scaffold uses synthetic data only.',
        '',
        'Participation is voluntary and withdrawal from future participation is available.',
      ].join('\n'),
    },
  });
  await req(`/studies/${studyId}/versions/${versionId}/consent-versions/${consentVersion.consent_version.consent_version_id}/activate`, roles.owner, {
    method: 'POST',
    body: {},
  });
  await req(`/studies/${studyId}/versions/${versionId}/rounds/1/config`, roles.owner, {
    method: 'PATCH',
    body: {
      task_type: 'open_text',
      title: 'Round 1: Open response',
      prompt: 'What should the synthetic panel prioritize?',
      participant_instructions: 'Provide a short synthetic response. There are no correct answers.',
      response_window_days: 7,
      reminder_subject: 'Round 1 is open',
      reminder_body: 'This is a neutral reminder that Round 1 is open. Participation remains voluntary.',
      controlled_feedback_enabled: false,
      ai_curation_enabled: false,
      status: 'Ready',
    },
  });
  await req(`/studies/${studyId}/versions/${versionId}/rounds/2/config`, roles.owner, {
    method: 'PATCH',
    body: ratingRoundConfig(2),
  });
  await req(`/studies/${studyId}/versions/${versionId}/rounds/3/config`, roles.owner, {
    method: 'PATCH',
    body: ratingRoundConfig(3),
  });
  await req(`/studies/${studyId}/versions/${versionId}/submit-for-signoff`, roles.owner, { method: 'POST', body: {} });
  await req(`/studies/${studyId}/versions/${versionId}/signoff`, roles.owner, {
    method: 'POST',
    body: { note: 'Synthetic owner signoff for local mobile task-flow scaffold.' },
  });
  await req(`/studies/${studyId}/versions/${versionId}/signoff`, roles.steward, {
    method: 'POST',
    body: { note: 'Synthetic methods signoff for local mobile task-flow scaffold.' },
  });
  await req(`/studies/${studyId}/versions/${versionId}/activate`, roles.owner, { method: 'POST', body: {} });
  step('provision_synthetic_study_version', 'PASS', 'Created active three-round Modified Delphi synthetic study/version.');

  const flowParticipant = await req(`/studies/${studyId}/versions/${versionId}/participants`, roles.owner, {
    method: 'POST',
    body: { name: 'SYN-MOBILE-FLOW', email: 'syn-mobile-flow@example.test' },
  });
  const withdrawalParticipant = await req(`/studies/${studyId}/versions/${versionId}/participants`, roles.owner, {
    method: 'POST',
    body: { name: 'SYN-MOBILE-WITHDRAW', email: 'syn-mobile-withdraw@example.test' },
  });
  const flowParticipantId = flowParticipant.participant_id;
  const withdrawalParticipantId = withdrawalParticipant.participant_id;
  evidence.synthetic.flow_participant_ref = redactId(flowParticipantId);
  evidence.synthetic.withdrawal_participant_ref = redactId(withdrawalParticipantId);

  const flowInvitation = await req(`/studies/${studyId}/versions/${versionId}/participants/${flowParticipantId}/invitations`, roles.owner, {
    method: 'POST',
    body: {},
  });
  const withdrawalInvitation = await req(`/studies/${studyId}/versions/${versionId}/participants/${withdrawalParticipantId}/invitations`, roles.owner, {
    method: 'POST',
    body: {},
  });
  const flowToken = tokenFromInvitationUrl(flowInvitation.invitation_url);
  const withdrawalToken = tokenFromInvitationUrl(withdrawalInvitation.invitation_url);
  evidence.synthetic.flow_invitation_token = redactToken(flowToken);
  evidence.synthetic.withdrawal_invitation_token = redactToken(withdrawalToken);
  step('create_synthetic_participants', 'PASS', 'Created synthetic invitation tokens and redacted them in evidence.');

  await req(`/studies/${studyId}/versions/${versionId}/rounds/1/open`, roles.owner, { method: 'POST', body: {} });
  await reqInvitation('/participant/invitation/orientation/complete', flowToken, { method: 'POST', body: {} });
  await reqInvitation('/participant/invitation/consent', withdrawalToken, { method: 'POST', body: {} });

  await inspectMobile('consent_mobile_view', `${frontendUrl}/#invite=${encodeURIComponent(flowToken)}`, {
    expect: [/Consent information/i, /Participant Rights/i, /withdraw/i],
  });
  step('consent', 'PASS', 'Mobile browser observed consent information, participant rights, and withdrawal language.');

  await inspectMobile('round1_mobile_submission', `${frontendUrl}/#invite=${encodeURIComponent(flowToken)}`, {
    actions: [
      {
        name: 'submit_round1',
        expression: roundOneSubmitExpression('Synthetic mobile Round 1 response for Phase 3 scaffold.'),
        expectValue: 'submitted',
        waitMs: 2500,
      },
    ],
    expect: [/Round 1 response submitted|What was submitted/i],
  });
  step('round_1', 'PASS', 'Mobile browser submitted Round 1 through the participant invitation flow.');

  await inspectMobile('support_mobile_issue_submission', `${frontendUrl}/#invite=${encodeURIComponent(flowToken)}`, {
    actions: [
      { name: 'open_support', expression: openSupportExpression(), expectValue: 'opened', waitMs: 800 },
      {
        name: 'submit_support',
        expression: submitSupportExpression('Synthetic support note from Phase 3 mobile task-flow scaffold.'),
        expectValue: 'submitted',
        waitMs: 1800,
      },
    ],
    expect: [/Issue note sent|Issue note updates|Having trouble/i],
  });
  step('support', 'PASS', 'Mobile browser submitted the participant support issue path.');

  const responses = await req(`/studies/${studyId}/versions/${versionId}/responses`, roles.owner);
  const roundOneResponse = responses.responses.find((entry) => entry.participant_id === flowParticipantId);
  if (!roundOneResponse) throw new Error('round1_response_not_found_after_browser_submission');

  await req(`/studies/${studyId}/versions/${versionId}/rounds/1/close`, roles.owner, { method: 'POST', body: {} });
  await inspectMobile('no_active_task_mobile_view', `${frontendUrl}/#invite=${encodeURIComponent(flowToken)}`, {
    expect: [/No round task is currently open/i, /Waiting for study team/i],
  });
  step('no_active_task', 'PASS', 'Mobile browser observed the waiting/no-active-task state between rounds.');

  const round2Item = await req(`/studies/${studyId}/versions/${versionId}/items`, roles.owner, {
    method: 'POST',
    body: {
      round_number: 2,
      text: 'Synthetic candidate statement derived from the Round 1 response.',
      provenance_type: 'PanelDerived',
      provenance_links: [
        {
          source_type: 'response',
          source_id: roundOneResponse.response_id,
          source_round_number: 1,
          excerpt: 'Synthetic mobile Round 1 response.',
        },
      ],
      rationale: 'Synthetic human curator confirmed traceability for local scaffold.',
    },
  });
  const publishedRound2 = await req(`/studies/${studyId}/versions/${versionId}/items/${round2Item.item.item_id}/publish`, roles.owner, {
    method: 'POST',
    body: {},
  });
  await req(`/studies/${studyId}/versions/${versionId}/rounds/2/open`, roles.owner, { method: 'POST', body: {} });
  await inspectMobile('later_round_mobile_submission', `${frontendUrl}/#invite=${encodeURIComponent(flowToken)}`, {
    actions: [
      {
        name: 'submit_later_round',
        expression: laterRoundSubmitExpression('Synthetic rationale for the Phase 3 later-round mobile scaffold.'),
        expectValue: 'submitted',
        waitMs: 2500,
      },
    ],
    expect: [/Round 2 responses submitted|What was submitted|Retain submitted responses/i],
  });
  step('later_round', 'PASS', 'Mobile browser submitted a later-round structured judgment task.');

  await req(`/studies/${studyId}/versions/${versionId}/rounds/2/close`, roles.owner, { method: 'POST', body: {} });
  const round3Item = await req(`/studies/${studyId}/versions/${versionId}/items`, roles.owner, {
    method: 'POST',
    body: {
      round_number: 3,
      text: 'Synthetic terminal statement carried forward from Round 2.',
      provenance_type: 'PanelDerived',
      provenance_links: [
        {
          source_type: 'item',
          source_id: publishedRound2.item.item_id,
          source_round_number: 2,
          excerpt: publishedRound2.item.text,
        },
      ],
      rationale: 'Synthetic human curator carried forward the Round 2 item for terminal closeout.',
    },
  });
  await req(`/studies/${studyId}/versions/${versionId}/items/${round3Item.item.item_id}/publish`, roles.owner, {
    method: 'POST',
    body: {},
  });
  await req(`/studies/${studyId}/versions/${versionId}/rounds/3/open`, roles.owner, { method: 'POST', body: {} });
  const round3Items = await reqInvitation('/participant/invitation/rounds/3/items', flowToken);
  for (const item of round3Items.items) {
    await reqInvitation('/participant/invitation/rounds/3/ratings', flowToken, {
      method: 'POST',
      body: {
        item_id: item.item_id,
        rating: 8,
        action: 'revise',
        rationale_text: 'Synthetic terminal rating for local closeout scaffold.',
      },
    });
  }
  const closedRound3 = await req(`/studies/${studyId}/versions/${versionId}/rounds/3/close`, roles.owner, { method: 'POST', body: {} });
  if (!closedRound3.final_result_snapshot) {
    await req(`/studies/${studyId}/versions/${versionId}/final-results`, roles.owner, { method: 'POST', body: {} });
  }
  await req(`/studies/${studyId}/versions/${versionId}/final-results/signoff`, roles.owner, { method: 'POST', body: {} });
  await req(`/studies/${studyId}/versions/${versionId}/final-results/signoff`, roles.steward, { method: 'POST', body: {} });
  await req(`/studies/${studyId}/versions/${versionId}/final-results/release`, roles.owner, { method: 'POST', body: {} });
  await inspectMobile('closeout_mobile_view', `${frontendUrl}/#invite=${encodeURIComponent(flowToken)}`, {
    actions: [
      { name: 'open_closeout', expression: closeoutExpression(), expectValue: 'clicked', waitMs: 1200 },
    ],
    expect: [/Thank you.*Delphi study is complete/i, /Consensus indicates agreement/i],
  });
  step('closeout_completed', 'PASS', 'Mobile browser observed released participant closeout/final-results state.');

  await inspectMobile('withdrawal_mobile_action', `${frontendUrl}/#invite=${encodeURIComponent(withdrawalToken)}`, {
    actions: [
      { name: 'withdraw', expression: withdrawExpression(), expectValue: 'clicked', waitMs: 1800 },
    ],
    expect: [/Withdrawal recorded|Withdrawn from future participation/i],
  });
  step('withdrawal', 'PASS', 'Mobile browser executed the participant withdrawal path with a synthetic invitation.');

  step('privacy_redaction_boundary', 'PASS', 'Artifacts retain only redacted token and participant references; browser observations omit raw URLs.');
}

try {
  await main();
} catch (error) {
  step('run_failed', 'FAIL', error instanceof Error ? error.message : 'Unknown scaffold failure.');
  process.exitCode = 1;
} finally {
  await writeArtifacts();
}
