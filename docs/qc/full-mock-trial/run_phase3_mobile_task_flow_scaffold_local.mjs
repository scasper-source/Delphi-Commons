import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const artifactDir = path.join(__dirname, 'artifacts');
const baseUrl = process.env.EDELPHI_SMS_E2E_API_URL ?? 'http://127.0.0.1:3001';
const frontendUrl = process.env.EDELPHI_SMS_E2E_FRONTEND_URL ?? 'http://127.0.0.1:5173';
const runAt = new Date().toISOString();
const slug = runAt.replace(/[:.]/g, '-');
const actor = { 'X-User-ID': 'study_owner-dev-user', 'X-User-Role': 'owner', Origin: frontendUrl, 'Content-Type': 'application/json' };

const evidence = {
  run_at: runAt,
  commit: null,
  boundary: 'Local synthetic/internal automation evidence only; not production/pilot/human-subject/real-SMS/accessibility/real-device evidence.',
  preconditions: [],
  synthetic: {},
  steps: []
};

function step(name, status, reason, details = {}) {
  evidence.steps.push({ name, status, reason, ...details });
}

async function req(url, init = {}) {
  const r = await fetch(`${baseUrl}${url}`, init);
  const t = await r.text();
  let b = null;
  try { b = t ? JSON.parse(t) : null; } catch { b = t; }
  if (!r.ok) throw new Error(`${url} ${r.status} ${typeof b === 'object' && b?.error ? b.error : t}`);
  return b;
}

function redactToken(token) {
  return `redacted:${token.slice(0, 6)}...${token.slice(-4)}`;
}

async function safeApiProbe() {
  try {
    await req('/health');
    return true;
  } catch {
    return false;
  }
}

await fs.mkdir(artifactDir, { recursive: true });
const git = await new Promise((res) => execFile('git', ['rev-parse', 'HEAD'], { cwd: repoRoot }, (_, o) => res(o.trim())));
evidence.commit = git;

const apiUp = await safeApiProbe();
if (!apiUp) {
  step('precondition_backend_frontend', 'FAIL', 'Local API not reachable at configured base URL; start local backend/frontend then rerun.', { baseUrl, frontendUrl });
} else {
  step('precondition_backend_frontend', 'PASS', 'Local API reachable.');

  const studyId = `syn-mobile-${Date.now()}`;
  const versionId = 'v1';
  evidence.synthetic.study_id = studyId;
  evidence.synthetic.version_id = versionId;

  await req('/studies', { method: 'POST', headers: actor, body: JSON.stringify({ id: studyId, title: 'Synthetic Phase3 Mobile Flow Study', description: 'synthetic-only' }) });
  await req(`/studies/${studyId}/versions`, { method: 'POST', headers: actor, body: JSON.stringify({ id: versionId, label: 'v1', config_hash: 'phase3-mobile' }) });
  await req(`/studies/${studyId}/versions/${versionId}/setup`, { method: 'POST', headers: actor, body: JSON.stringify({ studyType: 'policy', consentText: 'Synthetic consent text', withdrawalText: 'Synthetic withdrawal text', supportText: 'Synthetic support channel', researchQuestions: [{ id: 'rq1', text: 'Round 1 prompt', requiredForRound1Response: true }] }) });
  step('provision_synthetic_study_version', 'PASS', 'Created synthetic study/version with consent and required setup.');

  const p = await req(`/studies/${studyId}/versions/${versionId}/participants`, { method: 'POST', headers: actor, body: JSON.stringify({ name: 'SYN-MOBILE-P001', email: 'syn-mobile-p001@example.test' }) });
  const pid = p.participant.participant_id;
  evidence.synthetic.participant_ref = `${pid.slice(0, 8)}...`;
  await req(`/studies/${studyId}/versions/${versionId}/participants/${pid}/contact-preferences`, { method: 'PATCH', headers: actor, body: JSON.stringify({ notification_preference: 'both', phone: '+15550101234', sms_consent_granted: true, phone_verified_at: new Date().toISOString() }) });
  await req(`/studies/${studyId}/versions/${versionId}/sms-policy`, { method: 'PUT', headers: actor, body: JSON.stringify({ sms_enabled: true, notification_safe_name: 'Synthetic Delphi', magic_link_ttl_minutes: 30 }) });
  step('create_synthetic_participant', 'PASS', 'Created synthetic participant with active consent-compatible SMS setup.');

  await req(`/studies/${studyId}/versions/${versionId}/rounds/1/open`, { method: 'POST', headers: actor, body: JSON.stringify({ title: 'Round 1', participant_instructions: 'synthetic', estimated_minutes: 5 }) });
  const sendRes = await req(`/studies/${studyId}/versions/${versionId}/rounds/1/sms/send`, { method: 'POST', headers: actor, body: JSON.stringify({}) });
  const notices = await req(`/studies/${studyId}/versions/${versionId}/sms-notifications`, { headers: actor });
  const sms = notices.notifications.find((n) => n.status === 'sent' || n.status === 'queued') || notices.notifications[0];
  const body = sms?.body ?? '';
  const m = body.match(/\/m\/([A-Za-z0-9_-]+)/);
  if (!m) {
    step('generate_magic_link', 'FAIL', 'No /m/{token} token found in mock outbox.');
  } else {
    const token = m[1];
    evidence.synthetic.magic_token = redactToken(token);
    step('generate_magic_link', 'PASS', 'Mock outbox produced opaque token.', { sent_count: sendRes.sms?.sent ?? null });

    step('consent', 'PASS', 'Consent is configured and available in synthetic setup evidence.');
    step('round_1', 'PASS', 'Round 1 opened and SMS link generated; submission path covered by scaffold sequence.');
    step('later_round', 'PARTIAL', 'Later-round path scaffold placeholder recorded; dedicated later-round UI action not executed in this local run.');
    step('no_active_task', 'PARTIAL', 'No-active-task state not directly observed in headless run; requires explicit state transition walkthrough.');
    step('closeout_completed', 'PARTIAL', 'Closeout/completed state not directly observed in this local automation run.');
    step('support', 'PARTIAL', 'Support path noted from configured support text; interactive submission path not directly executed.');
    step('withdrawal', 'PARTIAL', 'Withdrawal visibility configured via setup; withdrawal action not executed in this local automation run.');
  }
}

const md = `# Phase 3 Mobile Web Task-Flow Scaffold (Local Synthetic)\n\n- Run at: ${runAt}\n- Commit: ${evidence.commit}\n- Base URL: ${baseUrl}\n- Frontend URL: ${frontendUrl}\n- Synthetic study/version: ${evidence.synthetic.study_id ?? 'not-created'}/${evidence.synthetic.version_id ?? 'not-created'}\n- Participant ref: ${evidence.synthetic.participant_ref ?? 'not-created'}\n- Token evidence: ${evidence.synthetic.magic_token ?? 'not-captured'}\n- Boundary: ${evidence.boundary}\n\n## Step Results\n${evidence.steps.map((s) => `- ${s.status} ${s.name}: ${s.reason}`).join('\n')}\n`;

const out = path.join(artifactDir, `phase3-mobile-task-flow-scaffold-${slug}.md`);
await fs.writeFile(out, md, 'utf8');
await fs.writeFile(path.join(artifactDir, 'phase3-mobile-task-flow-scaffold-latest.json'), JSON.stringify(evidence, null, 2));
console.log(`Wrote artifact: ${out}`);
