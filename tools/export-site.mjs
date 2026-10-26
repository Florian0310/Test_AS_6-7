import fs from 'node:fs/promises';
import path from 'node:path';
const backend = new URL(process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001');
if (backend.protocol !== 'https:' || ['localhost','127.0.0.1'].includes(backend.hostname)) throw new Error('Set BACKEND_PUBLIC_URL to the actual HTTPS backend before exporting.');
const folders=['assets','frontend','en','sortiment','about-us','contact','forestry-work','impressum','datenschutz','cookie-einstellungen','cookie-richtlinie','barrierefreiheit','bildnachweise'];
const files=['index.html','404.html','favicon.svg','styles.css','script.js','shop.js','i18n.js','consent.js','robots.txt','sitemap.xml'];
// dist is generated output. Verify the exact workspace target before clearing stale assets.
const output=path.resolve('dist');
if(path.dirname(output)!==process.cwd() || path.basename(output)!=='dist') throw new Error('Unexpected export directory.');
await fs.rm(output,{recursive:true,force:true});
await fs.mkdir('dist',{recursive:true});
for(const file of [...folders,...files]) await fs.cp(file,path.join('dist',file),{recursive:true});
await fs.writeFile('dist/app-config.js',`window.APP_CONFIG=Object.freeze(${JSON.stringify({PAYLOAD_URL:backend.origin,PAYLOAD_API_PREFIX:'/api',GTM_ID:'',GA4_MEASUREMENT_ID:'',TURNSTILE_SITE_KEY:process.env.TURNSTILE_SITE_KEY||''})});\n`);
console.log('Public files exported to dist/. Analytics remains disabled until legally and technically configured.');
