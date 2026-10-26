import fs from 'node:fs/promises';
const checks=[];
const get=async (url,status)=>{const response=await fetch(url);checks.push({url,status:response.status,pass:response.status===status});return response;};
for(const file of ['backend/.env','backend/data/payload.sqlite','.git/config','backend/package.json','docs/guides/development.md','frontend/src/main.js','frontend/templates/shell.mjs','scripts/build.mjs']) await get(`http://localhost:8000/${file}`,404);
await get('http://localhost:8000/missing-page',404);
for(const route of ['users','requests','globals/contact-settings','admin/statistics']) {
  const r=await fetch(`http://localhost:3001/api/${route}`);checks.push({route,status:r.status,pass:[401,403].includes(r.status)});
}
for(const [label,body,headers,status] of [
  ['malformed','{bad',{'Content-Type':'application/json'},400],
  ['oversize','x'.repeat(17000),{'Content-Type':'application/json'},413],
  ['cross-origin','{}',{'Content-Type':'application/json',Origin:'https://evil.invalid'},403],
  ['invalid-inquiry','{}',{'Content-Type':'application/json'},400],
]) {
  const r=await fetch('http://localhost:3001/api/catalog/requests',{method:'POST',body,headers});
  checks.push({label,status:r.status,pass:r.status===status});
}
const css=await fetch('http://localhost:8000/styles.css',{headers:{'Accept-Encoding':'gzip'}});
checks.push({label:'frontend-security-headers',pass:Boolean(css.headers.get('content-security-policy')?.includes("object-src 'none'")&&css.headers.get('x-content-type-options')==='nosniff')});
checks.push({label:'text-compression',pass:css.headers.get('content-encoding')==='gzip'});
await fs.mkdir('artifacts',{recursive:true});await fs.writeFile('artifacts/api-security.json',JSON.stringify(checks,null,2));console.log(JSON.stringify(checks,null,2));if(checks.some(c=>!c.pass))process.exitCode=1;
