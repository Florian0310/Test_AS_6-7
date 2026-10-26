import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const cwd=path.resolve('backend');
const node=path.resolve('node_modules/node/bin/node.exe');
const results=[];
for(const mode of ['fresh','upgrade']) {
  const name=`audit-${mode}-${Date.now()}.sqlite`,file=path.join(cwd,'data',name);
  if(mode==='upgrade') {
    await fs.copyFile(path.join(cwd,'data/pre-audit-backup.sqlite'),file);
    // Only this disposable copy: remove the dev-push marker to test the migration noninteractively.
    const prepare=spawnSync('python',['-c',"import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); c.execute('DELETE FROM payload_migrations WHERE batch=-1'); c.commit(); c.close()",file],{encoding:'utf8'});
    if(prepare.status!==0) throw new Error(prepare.stderr);
  }
  const result=spawnSync(node,['node_modules/payload/bin.js','migrate','--force-accept-warning'],{
    cwd,encoding:'utf8',timeout:120000,env:{...process.env,NODE_ENV:'development',BOOTSTRAP_ADMIN:'false',DATABASE_URI:`file:./data/${name}`},
  });
  if(result.status!==0) {console.error(result.stdout,result.stderr);process.exitCode=1;}
  if(result.status===0) {
    const check=spawnSync('python',['-c',"import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); assert c.execute('pragma integrity_check').fetchone()[0]=='ok'; assert 'english_title' in [r[1] for r in c.execute('pragma table_info(products)')]; assert 'reset_password_requested_at' in [r[1] for r in c.execute('pragma table_info(users)')]; tables=['users','products','categories','media','requests']; old=sqlite3.connect(sys.argv[2]); assert sys.argv[3]!='upgrade' or all(c.execute('select count(*) from '+t).fetchone()==old.execute('select count(*) from '+t).fetchone() for t in tables)",file,path.join(cwd,'data/pre-audit-backup.sqlite'),mode],{encoding:'utf8'});
    if(check.status!==0) {console.error(check.stderr);process.exitCode=1;}
  }
  results.push({mode,status:result.status,file:name});
}
await fs.mkdir('artifacts',{recursive:true});await fs.writeFile('artifacts/migrations.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
