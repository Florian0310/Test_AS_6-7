import fs from 'node:fs/promises';
import path from 'node:path';
import { projectRoot, artifactsDir } from '../lib/paths.mjs';

const walk = async directory => (await Promise.all((await fs.readdir(directory, {withFileTypes: true})).map(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : path.join(directory, entry.name)))).flat();
const files = [path.join(projectRoot, 'README.md'), ...(await walk(path.join(projectRoot, 'docs'))).filter(file => file.endsWith('.md'))];
const errors = [];
for (const file of files) {
  const source = await fs.readFile(file, 'utf8');
  for (const match of source.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].replace(/^<|>$/g, '');
    if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith('#')) continue;
    const destination = path.resolve(path.dirname(file), decodeURIComponent(target.split(/[?#]/)[0]));
    try {await fs.access(destination);} catch {errors.push(`${path.relative(projectRoot, file)}: ${target}`);}
  }
}
const report = {files: files.length, errors};
await fs.mkdir(artifactsDir, {recursive: true});
await fs.writeFile(path.join(artifactsDir, 'docs-check.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
