import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const backend=fileURLToPath(new URL('../',import.meta.url));
try {process.loadEnvFile(path.join(backend,'.env'));}catch(error){if(error.code!=='ENOENT')throw error;}
const uri=process.env.DATABASE_URI || 'file:./data/payload.sqlite';
if(!uri.startsWith('file:'))throw new Error('This upgrade helper supports local SQLite only. Use the deployment migration procedure for remote databases.');
const database=path.resolve(backend,uri.slice(5)),dataDir=path.join(backend,'data');
if(!database.startsWith(dataDir+path.sep))throw new Error('The local upgrade helper only operates inside backend/data/.');
await fs.access(database);
await new Promise((resolve,reject)=>{
  const connection=net.createConnection({host:'127.0.0.1',port:Number(process.env.PORT||3001)});
  connection.setTimeout(2000,()=>{connection.destroy();reject(new Error('Could not verify that the backend is stopped.'));});
  connection.once('connect',()=>{connection.destroy();reject(new Error('Stop the local backend before upgrading its database.'));});
  connection.once('error',error=>error.code==='ECONNREFUSED'?resolve():reject(error));
});
const backup=path.join(dataDir,`pre-cms-upgrade-${Date.now()}.sqlite`);
const prepareCode=`
import sqlite3, sys
database = sqlite3.connect(sys.argv[1])
columns = [row[1] for row in database.execute('pragma table_info(users)')]
assert columns, 'Use migrate for a new installation'
done = database.execute('select count(*) from payload_migrations where name=?', ('20261026_163132_cms_roles',)).fetchone()[0]
assert 'role' not in columns or done, 'Role column exists without its migration: restore the pre-upgrade backup and migrate before starting dev'
backup = sqlite3.connect(sys.argv[2])
database.backup(backup)
backup.close()
# The baseline migration adopts this verified legacy schema without dropping tables.
database.execute('delete from payload_migrations where batch=-1')
database.commit()
database.close()
`;
const prepare=spawnSync('python',['-c',prepareCode,database,backup],{encoding:'utf8'});
if(prepare.status)throw new Error(prepare.stderr);
console.log(`SQLite backup: ${backup}`);
const migration=spawnSync(process.execPath,['node_modules/payload/bin.js','migrate'],{cwd:backend,stdio:'inherit',env:{...process.env,NODE_ENV:'production',PAYLOAD_SECRET:randomBytes(32).toString('hex'),BOOTSTRAP_ADMIN:'false',DATABASE_URI:`file:${database.replaceAll('\\','/')}`}});
if(migration.status)throw new Error(`Migration failed. Keep the backend stopped and restore the verified backup: ${backup}`);
const verifyCode=`
import sqlite3, sys
current = sqlite3.connect(sys.argv[1])
previous = sqlite3.connect(sys.argv[2])
assert current.execute('pragma integrity_check').fetchone()[0] == 'ok'
for table in ['users', 'products', 'categories', 'media', 'requests']:
    columns = [row[1] for row in previous.execute('pragma table_info(' + table + ')')]
    query = 'select ' + ','.join(columns) + ' from ' + table + ' order by id'
    assert current.execute(query).fetchall() == previous.execute(query).fetchall(), table
assert current.execute("select count(*) from users where role='admin'").fetchone()[0] >= 1
`;
const verify=spawnSync('python',['-c',verifyCode,database,backup],{encoding:'utf8'});
if(verify.status)throw new Error(`Post-migration data verification failed. Keep the backend stopped; backup: ${backup}`);
console.log('CMS roles migrated; all pre-existing user, product, category, media and request fields verified unchanged.');
