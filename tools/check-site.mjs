import fs from 'node:fs/promises';
import path from 'node:path';
const publicDirs=['en','sortiment','about-us','contact','forestry-work','impressum','datenschutz','cookie-richtlinie','cookie-einstellungen','barrierefreiheit','bildnachweise'];
const walk=async dir=>(await Promise.all((await fs.readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(path.join(dir,e.name)):path.join(dir,e.name)))).flat();
const pages=['index.html',...(await Promise.all(publicDirs.map(walk))).flat().filter(p=>p.endsWith('.html'))];
const errors=[];
for(const page of pages) {
  const html=await fs.readFile(page,'utf8'),url=new URL('/'+page.replaceAll('\\','/'),'http://localhost');
  if (!/<html lang="(de-AT|en)"/.test(html)) errors.push(`${page}: missing locale`);
  if (!/<title>[^<]+<\/title>/.test(html)||!/<meta\s+name="description"/.test(html)||!/<link rel="canonical"/.test(html)) errors.push(`${page}: metadata incomplete`);
  for(const match of html.matchAll(/(?:href|src)="([^"]*)"/g)) {
    const value=match[1];if(!value || /^(mailto:|tel:|data:)/.test(value))continue;
    const target=new URL(value.replaceAll('&amp;','&'),url);if(target.origin!==url.origin)continue;
    let file=decodeURIComponent(target.pathname).slice(1)||'index.html';
    try {if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');await fs.access(file);}catch{errors.push(`${page}: missing ${value}`);continue;}
    if(target.hash && file.endsWith('.html')) {
      const dest=await fs.readFile(file,'utf8');const id=decodeURIComponent(target.hash.slice(1));
      if(!dest.includes(`id="${id}"`) && !dest.includes(`name="${id}"`))errors.push(`${page}: missing anchor ${value}`);
    }
  }
}
await fs.mkdir('artifacts',{recursive:true});await fs.writeFile('artifacts/static-check.json',JSON.stringify({pages:pages.length,errors},null,2));
console.log(JSON.stringify({pages:pages.length,errors},null,2));if(errors.length)process.exitCode=1;
