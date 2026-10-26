import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { backendDir, artifactsDir, projectRoot } from '../lib/paths.mjs';

// Test users, uploads and CRUD run only against this isolated SQLite/media copy.
const stamp = Date.now(), database = path.join(backendDir,'data',`cms-tests-${stamp}.sqlite`), media = path.join(backendDir,'data',`cms-media-${stamp}`);
const source = process.env.CMS_TEST_SOURCE || path.join(backendDir,'data','payload.sqlite');
const backup = spawnSync('python',['-c',"import sqlite3,sys; a=sqlite3.connect(sys.argv[1]); b=sqlite3.connect(sys.argv[2]); a.backup(b); b.execute('DELETE FROM payload_migrations WHERE batch=-1'); b.commit(); b.close(); a.close()",source,database],{encoding:'utf8'});
if (backup.status) throw new Error('Could not create the isolated CMS test database.');
await fs.mkdir(media,{recursive:true});
try {await fs.cp(path.join(backendDir,'media'),media,{recursive:true});} catch(error) {if(error.code!=='ENOENT')throw error;}
const baseURL = 'http://localhost:3002';
const env = {...process.env,NODE_ENV:'production',PAYLOAD_SECRET:randomBytes(32).toString('hex'),DATABASE_URI:`file:${database.replaceAll('\\','/')}`,MEDIA_DIR:media,BOOTSTRAP_ADMIN:'true',PAYLOAD_ADMIN_EMAIL:'cms-admin@example.invalid',PAYLOAD_ADMIN_PASSWORD:randomBytes(24).toString('base64url'),ENABLE_EMAIL_SENDING:'false',PORT:'3002',HOSTNAME:'127.0.0.1',PAYLOAD_PUBLIC_SERVER_URL:baseURL,CMS_BASE_URL:baseURL,CMS_USER_EMAIL:'cms-user@example.invalid',CMS_USER_PASSWORD:randomBytes(24).toString('base64url')};
const migration = spawnSync(process.execPath,['node_modules/payload/bin.js','migrate','--force-accept-warning'],{cwd:backendDir,env,encoding:'utf8'});
await fs.mkdir(artifactsDir,{recursive:true});
await fs.writeFile(path.join(artifactsDir,'cms-migration.log'),migration.stdout + migration.stderr);
if (migration.status) throw new Error(`Isolated migration failed: ${migration.stdout} ${migration.stderr}`);
let logs = '';
const server = spawn(process.execPath,['scripts/start.mjs'],{cwd:backendDir,env,windowsHide:true});
server.stdout.on('data',value=>{logs+=value;}); server.stderr.on('data',value=>{logs+=value;});
let result;
try {
  let ready = false;
  for (let attempt=0;attempt<100;attempt++) {
    try {if((await fetch(`${baseURL}/api/catalog/products`,{signal:AbortSignal.timeout(2000)})).ok) {ready=true;break;}} catch { /* Server startup. */ }
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  if (!ready) throw new Error('The isolated production CMS did not start.');
  const login = await fetch(`${baseURL}/api/users/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:env.PAYLOAD_ADMIN_EMAIL,password:env.PAYLOAD_ADMIN_PASSWORD})}).then(response=>response.json());
  if (!login.token) throw new Error('Could not log in the isolated test administrator.');
  const created = await fetch(`${baseURL}/api/users`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`JWT ${login.token}`},body:JSON.stringify({email:env.CMS_USER_EMAIL,password:env.CMS_USER_PASSWORD,name:'CMS Test User'})});
  if (created.status !== 201) throw new Error('Could not create the isolated normal user.');
  const tests = spawn(process.execPath,[path.join(projectRoot,'node_modules/@playwright/test/cli.js'),'test','--config','tests/cms/playwright.config.js'],{cwd:projectRoot,env,stdio:'inherit',windowsHide:true});
  result = {status:await new Promise((resolve,reject)=>{tests.once('error',reject);tests.once('exit',status=>resolve(status??1));})};
} finally {
  server.kill();
  await fs.writeFile(path.join(artifactsDir,'cms-server.log'),logs.replaceAll(env.PAYLOAD_ADMIN_PASSWORD,'[redacted]').replaceAll(env.CMS_USER_PASSWORD,'[redacted]'));
}
if (result?.status) process.exitCode = result.status;
