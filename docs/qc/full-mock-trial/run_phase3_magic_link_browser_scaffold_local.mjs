import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const artifactDir = path.join(__dirname, 'artifacts');
const baseUrl = process.env.EDELPHI_SMS_E2E_API_URL ?? 'http://127.0.0.1:3001';
const frontendUrl = process.env.EDELPHI_SMS_E2E_FRONTEND_URL ?? 'http://127.0.0.1:5173';
const runAt = new Date().toISOString();
const slug = runAt.replace(/[:.]/g, '-');

const actor = { 'X-User-ID': 'study_owner-dev-user', 'X-User-Role': 'owner', Origin: frontendUrl, 'Content-Type': 'application/json' };
const stewardActor = { 'X-User-ID': 'methods-steward-dev-user', 'X-User-Role': 'methods_steward', Origin: frontendUrl, 'Content-Type': 'application/json' };
const evidence = {
  run_at: runAt,
  commit: null,
  commands: ['npm run test:phase3-magic-link-browser-scaffold (with live local backend/frontend prerequisites)'],
  synthetic: {},
  steps: [],
  boundary: 'Automated local browser scaffold with synthetic/internal data only. Not real-device, not human-subject, not production-SMS evidence.',
};

function step(name, status, details = {}) { evidence.steps.push({ name, status, ...details }); }
async function req(url, init={}) { const r=await fetch(`${baseUrl}${url}`, init); const t=await r.text(); let b=null; try{b=t?JSON.parse(t):null;}catch{b=t;} if(!r.ok) throw new Error(`${url} ${r.status} ${typeof b==='object'&&b?.error?b.error:t}`); return b; }

function findEdge(){ return ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe','C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe','/usr/bin/microsoft-edge','/usr/bin/google-chrome']; }
async function sleep(ms){ await new Promise(r=>setTimeout(r,ms)); }

async function runBrowser(url){
  for (const exe of findEdge()) {
    try { await fs.access(exe); } catch { continue; }
    const port = 9777 + Math.floor(Math.random()*1000);
    const userData = path.join(artifactDir, `phase3-browser-${slug}`);
    const proc = execFile(exe, ['--headless=new','--disable-gpu',`--remote-debugging-port=${port}`,`--user-data-dir=${userData}`,'about:blank']);
    try {
      let wsUrl = null;
      for (let i=0;i<40;i++) { await sleep(200); try { const pages = await fetch(`http://127.0.0.1:${port}/json`).then(x=>x.json()); wsUrl = (pages.find(p=>p.type==='page')||pages[0])?.webSocketDebuggerUrl; if(wsUrl) break; } catch {} }
      if (!wsUrl) throw new Error('cdp unavailable');
      const WebSocket = globalThis.WebSocket;
      if (!WebSocket) throw new Error('WebSocket API unavailable in this Node runtime');
      const ws = new WebSocket(wsUrl);
      const pending = new Map(); let id=0;
      ws.addEventListener('message', event => {
        const m = JSON.parse(String(event.data));
        if (m.id && pending.has(m.id)) {
          pending.get(m.id)(m);
          pending.delete(m.id);
        }
      });
      await new Promise((resolve, reject) => {
        ws.addEventListener('open', resolve, { once: true });
        ws.addEventListener('error', reject, { once: true });
      });
      const send = (method, params={}) => new Promise((resolve,reject)=>{ const rid=++id; pending.set(rid, (m)=> m.error?reject(new Error(m.error.message)):resolve(m.result)); ws.send(JSON.stringify({id:rid,method,params})); });
      await send('Page.enable'); await send('Runtime.enable');
      await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
      await send('Page.navigate',{url}); await sleep(2500);
      const action = await send('Runtime.evaluate',{expression:`(()=>{const t=document.querySelector('textarea'); if(!t) return 'no_textarea'; const setter=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value')?.set; if(setter) setter.call(t,'Synthetic Phase 3 browser scaffold response.'); else t.value='Synthetic Phase 3 browser scaffold response.'; t.dispatchEvent(new Event('input',{bubbles:true})); const b=[...document.querySelectorAll('button')].find(x=>/Submit round/i.test(x.textContent||'')); if(!b) return 'no_submit'; b.click(); return 'submitted';})()`});
      if (action.result.value !== 'submitted') throw new Error(`browser_submit_unavailable:${action.result.value}`);
      await sleep(1200);
      const state = await send('Runtime.evaluate',{expression:`(()=>({html:document.body.innerText.slice(0,1200)}))()`, returnByValue:true});
      if (!String(state.result.value?.html ?? '').includes('Round response submitted')) throw new Error(`browser_submit_not_confirmed:${String(state.result.value?.html ?? '').slice(0,200)}`);
      ws.close(); proc.kill('SIGTERM');
      return { executable: exe, state: state.result.value };
    } catch (e) { proc.kill('SIGTERM'); throw e; }
  }
  throw new Error('No local Edge/Chrome available');
}

await fs.mkdir(artifactDir,{recursive:true});
const git = await new Promise((res)=>execFile('git',['rev-parse','HEAD'],{cwd:repoRoot},(_,o)=>res(o.trim()))); evidence.commit=git;
const smsCore = await import(pathToFileURL(path.join(repoRoot,'server/dist/core/smsNotifications.js')).href);
const smsStore = await import(pathToFileURL(path.join(repoRoot,'server/dist/stores/smsStore.js')).href);

const createdStudy = await req('/studies',{method:'POST',headers:actor,body:JSON.stringify({title:'Synthetic Phase3 SMS Browser Study',description:'synthetic'})});
const studyId = createdStudy.study.id;
const createdVersion = await req(`/studies/${studyId}/versions`,{method:'POST',headers:actor,body:JSON.stringify({})});
const versionId = createdVersion.studyVersion.id;
evidence.synthetic.study_id=studyId; evidence.synthetic.version_id=versionId;
await req(`/studies/${studyId}/versions/${versionId}/design`,{method:'PATCH',headers:actor,body:JSON.stringify({study_format:'ModifiedDelphi',planned_round_count:3,terminal_round_number:3,method_rationale:'Synthetic local Phase 3 browser scaffold design.'})});
await req(`/studies/${studyId}/versions/${versionId}/consensus-rule`,{method:'PATCH',headers:actor,body:JSON.stringify({consensus_rule_json:{type:'percent_agreement',threshold:80,agreement_min_rating:7,source:'pi_defined',setting_process:'Synthetic local scaffold threshold.'}})});
await req(`/studies/${studyId}/versions/${versionId}/wizard-packet`,{method:'PATCH',headers:actor,body:JSON.stringify({study_design_packet_json:{title:'Synthetic Phase3 SMS Browser Study',description:'synthetic',roundOneMode:'open-ended',researchQuestions:[{id:'rq1',text:'What should improve?',requiredForRound1Response:true,active:true}]}})});
const consentVersion = await req(`/studies/${studyId}/versions/${versionId}/consent-versions`,{method:'POST',headers:actor,body:JSON.stringify({text_md:'Synthetic consent for local Phase 3 browser scaffold.'})});
await req(`/studies/${studyId}/versions/${versionId}/consent-versions/${consentVersion.consent_version.consent_version_id}/activate`,{method:'POST',headers:actor,body:JSON.stringify({})});
await req(`/studies/${studyId}/versions/${versionId}/rounds/1/config`,{method:'PATCH',headers:actor,body:JSON.stringify({task_type:'open_text',title:'Round 1',prompt:'What should improve?',participant_instructions:'Synthetic local scaffold instructions.',response_window_days:7,reminder_subject:'Round 1 is open',reminder_body:'Participation remains voluntary.',controlled_feedback_enabled:false,ai_curation_enabled:false,status:'Ready'})});
await req(`/studies/${studyId}/versions/${versionId}/submit-for-signoff`,{method:'POST',headers:actor,body:JSON.stringify({})});
await req(`/studies/${studyId}/versions/${versionId}/signoff`,{method:'POST',headers:actor,body:JSON.stringify({note:'Synthetic owner signoff for local scaffold.'})});
await req(`/studies/${studyId}/versions/${versionId}/signoff`,{method:'POST',headers:stewardActor,body:JSON.stringify({note:'Synthetic methods signoff for local scaffold.'})});
await req(`/studies/${studyId}/versions/${versionId}/activate`,{method:'POST',headers:actor,body:JSON.stringify({})});
await req(`/studies/${studyId}/versions/${versionId}/open-round-1`,{method:'POST',headers:actor,body:JSON.stringify({})});
const p = await req(`/studies/${studyId}/versions/${versionId}/participants`,{method:'POST',headers:actor,body:JSON.stringify({name:'SYN-P001',email:'syn-p001@example.test'})});
const pid = p.participant_id; evidence.synthetic.participant_ref = pid.slice(0,8)+'...';
await req(`/studies/${studyId}/versions/${versionId}/consent`,{method:'POST',headers:actor,body:JSON.stringify({participant_id:pid})});
await req(`/studies/${studyId}/versions/${versionId}/participants/${pid}/contact-preferences`,{method:'PATCH',headers:actor,body:JSON.stringify({notification_preference:'both',phone:'+15550101234',sms_consent_granted:true})});
const challenge = await req(`/studies/${studyId}/versions/${versionId}/participants/${pid}/phone-verification/start`,{method:'POST',headers:actor,body:JSON.stringify({})});
await req(`/studies/${studyId}/versions/${versionId}/participants/${pid}/phone-verification/verify`,{method:'POST',headers:actor,body:JSON.stringify({challenge_id:challenge.challenge_id,otp:challenge.dev_otp})});
await req(`/studies/${studyId}/versions/${versionId}/sms-policy`,{method:'PUT',headers:actor,body:JSON.stringify({sms_enabled:true,notification_safe_name:'Synthetic Delphi',magic_link_ttl_minutes:30})});
const openedRound = await req(`/studies/${studyId}/versions/${versionId}/rounds/1/open`,{method:'POST',headers:actor,body:JSON.stringify({})});
const sent = openedRound.sms?.sent === 1
  ? openedRound
  : await req(`/studies/${studyId}/versions/${versionId}/rounds/1/sms/send`,{method:'POST',headers:actor,body:JSON.stringify({})});
if (sent.sms?.sent !== 1) throw new Error(`expected_one_sms_sent:${JSON.stringify(sent.sms)}`);
step('send_sms', 'pass', { sent: sent.sms?.sent ?? null, source: openedRound.sms?.sent === 1 ? 'round_open' : 'explicit_send' });
const notices = await req(`/studies/${studyId}/versions/${versionId}/sms-notifications`,{headers:actor});
const sms = notices.notifications.find(n=>n.status==='sent'||n.status==='queued') || notices.notifications[0];
if (!sms || (sms.status !== 'sent' && sms.status !== 'queued')) throw new Error(`missing_sent_sms_notification:${JSON.stringify(sms)}`);
const token = smsCore.createMagicToken();
smsStore.revokeActiveMagicLinksForParticipantRound({ participant_id: pid, study_id: studyId, version_id: versionId, round_number: 1 });
smsStore.createMagicLinkToken({
  token_hash: smsCore.hashSecret(token),
  participant_id: pid,
  study_id: studyId,
  version_id: versionId,
  round_number: 1,
  expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
  metadata: { source: 'phase3_browser_scaffold_seed', sms_notification_id: sms.sms_notification_id },
});
evidence.synthetic.magic_token='redacted:'+token.slice(0,6)+'...';
step('seed_magic_link', 'pass', { source: 'shared_local_db', sms_notification_id: sms.sms_notification_id });

const browser = await runBrowser(`${frontendUrl}/m/${token}`); step('mobile_browser_submit', 'pass', { browser: path.basename(browser.executable) });

let reused='not_checked';
try { await req('/magic-links/consume',{method:'POST',headers:{Origin:frontendUrl,'Content-Type':'application/json'},body:JSON.stringify({token})}); reused='unexpected_success'; } catch { reused='blocked'; }
step('single_use_enforced', reused==='blocked'?'pass':'fail');
let invalid='not_checked';
try { await req('/magic-links/consume',{method:'POST',headers:{Origin:frontendUrl,'Content-Type':'application/json'},body:JSON.stringify({token:'invalid-token'})}); invalid='unexpected_success'; } catch { invalid='blocked'; }
step('invalid_token', invalid==='blocked'?'pass':'fail');

const md = `# Phase 3 Magic-Link Browser Scaffold\n\n- Run at: ${runAt}\n- Commit: ${evidence.commit}\n- Synthetic study/version: ${studyId}/${versionId}\n- Participant ref: ${evidence.synthetic.participant_ref}\n- Token evidence: ${evidence.synthetic.magic_token}\n- Boundary: ${evidence.boundary}\n\n## Steps\n${evidence.steps.map(s=>`- ${s.status.toUpperCase()} ${s.name}`).join('\n')}\n`;
const out = path.join(artifactDir,`phase3-magic-link-browser-scaffold-${slug}.md`);
await fs.writeFile(out, md, 'utf8');
await fs.writeFile(path.join(artifactDir,'phase3-magic-link-browser-scaffold-latest.json'), JSON.stringify(evidence,null,2));
console.log(`Wrote artifact: ${out}`);
