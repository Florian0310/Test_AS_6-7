import { outputDir } from '../lib/paths.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
const publicDirs=['en','sortiment','about-us','contact','forestry-work','impressum','datenschutz','cookie-richtlinie','cookie-einstellungen','barrierefreiheit','bildnachweise'];
const walk=async dir=>(await Promise.all((await fs.readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(path.join(dir,e.name)):path.join(dir,e.name)))).flat();
const pages=['index.html','404.html',...(await Promise.all(publicDirs.map(dir=>walk(path.join(outputDir,dir))))).flat().filter(p=>p.endsWith('.html')).map(file=>path.relative(outputDir,file))];
const errors=[];
for(const page of pages) {
  const html=await fs.readFile(path.join(outputDir,page),'utf8'),url=new URL('/'+page.replaceAll('\\','/'),'http://localhost');
  if (!/<html lang="(de-AT|en)"/.test(html)) errors.push(`${page}: missing locale`);
  if (!/<title>[^<]+<\/title>/.test(html)||!/<meta\s+name="description"/.test(html)||!/<link rel="canonical"/.test(html)) errors.push(`${page}: metadata incomplete`);
  if ((html.match(/data-site-header/g)||[]).length !== 1 || (html.match(/data-site-footer/g)||[]).length !== 1) errors.push(`${page}: shared shell missing or duplicated`);
  if ((html.match(/src="\/frontend\/main.js"/g)||[]).length !== 1 || /data-theme-toggle|data-open-search|class="search"/.test(html)) errors.push(`${page}: obsolete or duplicate controller`);
  for(const match of html.matchAll(/(?:href|src)="([^"]*)"/g)) {
    const value=match[1];if(!value || /^(mailto:|tel:|data:)/.test(value))continue;
    const target=new URL(value.replaceAll('&amp;','&'),url);if(target.origin!==url.origin)continue;
    let file=path.join(outputDir,decodeURIComponent(target.pathname).slice(1)||'index.html');
    try {if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');await fs.access(file);}catch{errors.push(`${page}: missing ${value}`);continue;}
    if(target.hash && file.endsWith('.html')) {
      const dest=await fs.readFile(file,'utf8');const id=decodeURIComponent(target.hash.slice(1));
      if(!dest.includes(`id="${id}"`) && !dest.includes(`name="${id}"`))errors.push(`${page}: missing anchor ${value}`);
    }
  }
}
for (const file of (await walk(path.join(outputDir,'frontend'))).filter(file=>file.endsWith('.js'))) {
  const source=await fs.readFile(file,'utf8');
  for(const match of source.matchAll(/(?:from\s*|import\s*\(?)["'](\.[^"']+)["']/g)) {
    try {await fs.access(path.resolve(path.dirname(file),match[1]));} catch {errors.push(`${file}: missing module ${match[1]}`);}
  }
}
for (const file of (await walk(outputDir)).filter(file=>file.endsWith('.css'))) {
  const source=await fs.readFile(file,'utf8');
  for(const match of source.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) {
    const value=match[1];if(/^(?:data:|https?:|#)/i.test(value))continue;
    const target=value.startsWith('/') ? path.join(outputDir,value.slice(1)) : path.resolve(path.dirname(file),value);
    try {await fs.access(target.split(/[?#]/)[0]);}catch{errors.push(`${path.relative(outputDir,file)}: missing CSS resource ${value}`);}
  }
}
await fs.mkdir('artifacts',{recursive:true});await fs.writeFile('artifacts/static-check.json',JSON.stringify({pages:pages.length,errors},null,2));
console.log(JSON.stringify({pages:pages.length,errors},null,2));if(errors.length)process.exitCode=1;
