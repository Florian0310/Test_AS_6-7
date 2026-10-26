import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const backend=fileURLToPath(new URL('../',import.meta.url));
const output=path.resolve(backend,'.next/standalone');
// Next copies dotenv files separately from file tracing. Never distribute build-machine secrets.
for(const entry of await fs.readdir(output,{withFileTypes:true})) {
  if (!/^\.env(?:\.|$)/.test(entry.name)) continue;
  const target=path.resolve(output,entry.name);
  if (!target.startsWith(output+path.sep) || entry.isDirectory()) throw new Error('Unexpected dotenv artifact.');
  await fs.rm(target);
}
await fs.cp(path.join(backend,'.next/static'),path.join(output,'.next/static'),{recursive:true});
console.log('Standalone assets prepared; dotenv files excluded. Supply secrets through runtime environment.');
