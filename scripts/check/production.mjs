import {spawn,spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
const node=path.resolve('node_modules/node/bin/node.exe'),cwd=path.resolve('backend');
const db=path.join(cwd,'data',`audit-production-${Date.now()}.sqlite`);
const backup=spawnSync('python',['-c',"import sqlite3,sys; s=sqlite3.connect(sys.argv[1]); d=sqlite3.connect(sys.argv[2]); s.backup(d); d.close(); s.close()",path.join(cwd,'data/payload.sqlite'),db],{encoding:'utf8'});
if(backup.status!==0)throw new Error('Could not prepare isolated database.');
await fs.cp(path.join(cwd,'.next/static'),path.join(cwd,'.next/standalone/.next/static'),{recursive:true});
let log='';
const child=spawn(node,['scripts/start.mjs'],{cwd,windowsHide:true,env:{...process.env,PORT:'3002',HOSTNAME:'127.0.0.1',NODE_ENV:'production',PAYLOAD_SECRET:randomBytes(32).toString('hex'),DATABASE_URI:`file:${db.replaceAll('\\','/')}`,BOOTSTRAP_ADMIN:'false',ENABLE_EMAIL_SENDING:'false',PAYLOAD_PUBLIC_SERVER_URL:'http://localhost:3002'}});
child.stdout.on('data',chunk=>{log+=chunk;});child.stderr.on('data',chunk=>{log+=chunk;});
const checks=[];
try {
  let ready=false;
  for(let i=0;i<100;i++) {try {const r=await fetch('http://localhost:3002/api/catalog/products');if(r.ok){ready=true;break;}}catch{ /* Server is still starting. */ } await new Promise(resolve=>setTimeout(resolve,100));}
  if(!ready) {console.error(log.slice(-5000)); throw new Error('Production server did not become ready.');}
  const products=await fetch('http://localhost:3002/api/catalog/products').then(r=>r.json());
  checks.push({label:'production-catalog',pass:products.success===true});
  const admin=await fetch('http://localhost:3002/admin');const html=await admin.text();
  checks.push({label:'production-admin',status:admin.status,pass:admin.ok});
  const staticPath=html.match(/src="([^" ]+\.js[^" ]*)"/)?.[1];
  checks.push({label:'production-admin-assets',pass:Boolean(staticPath&&(await fetch(new URL(staticPath,'http://localhost:3002'))).ok)});
  checks.push({label:'production-security-headers',pass:admin.headers.get('x-content-type-options')==='nosniff'&&Boolean(admin.headers.get('content-security-policy'))&&Boolean(admin.headers.get('strict-transport-security'))});
  const product=products.data.find(p=>p.availabilityStatus!=='unavailable');
  const response=await fetch('http://localhost:3002/api/catalog/requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:String(product.id),name:'Audit Test',email:'audit@example.invalid',rentalDays:3,consentPrivacy:true,locale:'en'})});
  const body=await response.json();
  checks.push({label:'production-inquiry-durable-copy-only',status:response.status,pass:response.status===201&&Boolean(body.data?.requestNumber)});
  checks.push({label:'no-private-email-preview',pass:!JSON.stringify(body).includes('preview')&&!JSON.stringify(body).includes('office@')});
  const stored=spawnSync('python',['-c',"import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); assert c.execute('select count(*) from requests where customer_email=?',('audit@example.invalid',)).fetchone()[0]>=1; assert c.execute('pragma integrity_check').fetchone()[0]=='ok'",db],{encoding:'utf8'});
  checks.push({label:'production-inquiry-db-check',pass:stored.status===0});
} finally {child.kill();}
await fs.mkdir('artifacts',{recursive:true});await fs.writeFile('artifacts/production-smoke.json',JSON.stringify(checks,null,2));console.log(JSON.stringify(checks,null,2));
if(checks.some(c=>!c.pass))process.exitCode=1;
