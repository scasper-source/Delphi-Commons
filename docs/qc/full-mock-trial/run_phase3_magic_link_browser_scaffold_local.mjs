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
const evidence = { run_at: runAt, commit: null, commands: [], synthetic: {}, steps: [], boundary: 'Automated local browser scaffold with synthetic/internal data only. Not real-device, not human-subject, not production-SMS evidence.' };

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
      ws.on('message', d=>{ const m=JSON.parse(String(d)); if(m.id&&pending.has(m.id)){ pending.get(m.id)(m); pending.delete(m.id);} });
      await new Promise(r=>ws.once('open',r));
      const send = (method, params={}) => new Promise((resolve,reject)=>{ const rid=++id; pending.set(rid, (m)=> m.error?reject(new Error(m.error.message)):resolve(m.result)); ws.send(JSON.stringify({id:rid,method,params})); });
      await send('Page.enable'); await send('Runtime.enable');
      await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
      await send('Page.navigate',{url}); await sleep(2500);
      await send('Runtime.evaluate',{expression:`(()=>{const t=document.querySelector('textarea'); if(!t) return 'no_textarea'; t.value='Synthetic Phase 3 browser scaffold response.'; t.dispatchEvent(new Event('input',{bubbles:true})); const b=[...document.querySelectorAll('button')].find(x=>/Submit round/i.test(x.textContent||'')); if(!b) return 'no_submit'; b.click(); return 'submitted';})()`});
      await sleep(1200);
      const state = await send('Runtime.evaluate',{expression:`(()=>({html:document.body.innerText.slice(0,1200)}))()`});
      ws.close(); proc.kill('SIGTERM');
      return { executable: exe, state: state.result.value };
    } catch (e) { proc.kill('SIGTERM'); throw e; }
  }
  throw new Error('No local Edge/Chrome available');
}

await fs.mkdir(artifactDir,{recursive:true});
const git = await new Promise((res)=>execFile('git',['rev-parse','HEAD'],{cwd:repoRoot},(_,o)=>res(o.trim()))); evidence.commit=git;

const studyId=`syn-sms-${Date.now()}`; const versionId='v1';
evidence.synthetic.study_id=studyId; evidence.synthetic.version_id=versionId;
await req('/studies',{method:'POST',headers:actor,body:JSON.stringify({id:studyId,title:'Synthetic Phase3 SMS Browser Study',description:'synthetic'})});
await req(`/studies/${studyId}/versions`,{method:'POST',headers:actor,body:JSON.stringify({id:versionId,label:'v1',config_hash:'phase3'})});
await req(`/studies/${studyId}/versions/${versionId}/setup`,{method:'POST',headers:actor,body:JSON.stringify({studyType:'policy',consentText:'Synthetic consent',withdrawalText:'Synthetic withdrawal',researchQuestions:[{id:'rq1',text:'What should improve?',requiredForRound1Response:true}]})});
const p = await req(`/studies/${studyId}/versions/${versionId}/participants`,{method:'POST',headers:actor,body:JSON.stringify({name:'SYN-P001',email:'syn-p001@example.test'})});
const pid = p.participant.participant_id; evidence.synthetic.participant_ref = pid.slice(0,8)+'...';
await req(`/studies/${studyId}/versions/${versionId}/participants/${pid}/contact-preferences`,{method:'PATCH',headers:actor,body:JSON.stringify({notification_preference:'both',phone:'+15550101234',sms_consent_granted:true,phone_verified_at:new Date().toISOString()})});
await req(`/studies/${studyId}/versions/${versionId}/sms-policy`,{method:'PUT',headers:actor,body:JSON.stringify({sms_enabled:true,notification_safe_name:'Synthetic Delphi',magic_link_ttl_minutes:30})});
await req(`/studies/${studyId}/versions/${versionId}/rounds/1/open`,{method:'POST',headers:actor,body:JSON.stringify({title:'Round 1',participant_instructions:'synthetic',estimated_minutes:5})});
const sent = await req(`/studies/${studyId}/versions/${versionId}/rounds/1/sms/send`,{method:'POST',headers:actor,body:JSON.stringify({})});
step('send_sms', 'pass', { sent: sent.sms?.sent ?? null });
const notices = await req(`/studies/${studyId}/versions/${versionId}/sms-notifications`,{headers:actor});
const sms = notices.notifications.find(n=>n.status==='sent'||n.status==='queued') || notices.notifications[0];
const body = sms?.body ?? ''; const m = body.match(/\/m\/([A-Za-z0-9_-]+)/); if(!m) throw new Error('missing magic token in mock outbox');
const token=m[1]; evidence.synthetic.magic_token='redacted:'+token.slice(0,6)+'...';

const browser = await runBrowser(`${frontendUrl}/m/${token}`); step('mobile_browser_submit', 'pass', { browser: path.basename(browser.executable) });

await req('/magic-links/consume',{method:'POST',headers:{Origin:frontendUrl,'Content-Type':'application/json'},body:JSON.stringify({token})});
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
