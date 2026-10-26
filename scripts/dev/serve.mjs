import http from 'node:http';
import path from 'node:path';
import { outputDir } from '../lib/paths.mjs';
import { stat, realpath, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const root = outputDir + path.sep;
const publicDirs = new Set(['assets','frontend','en','sortiment','about-us','contact','forestry-work','impressum','datenschutz','cookie-einstellungen','cookie-richtlinie','barrierefreiheit','bildnachweise']);
const publicFiles = new Set(['index.html','404.html','favicon.svg','styles.css','script.js','shop.js','consent.js','i18n.js','app-config.js','robots.txt','sitemap.xml']);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.xml':'application/xml','.txt':'text/plain; charset=utf-8','.woff2':'font/woff2'};
const csp = "default-src 'self'; script-src 'self' https://challenges.cloudflare.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: http://localhost:3001 https://www.allessaniert.at; connect-src 'self' http://localhost:3001 https://www.google-analytics.com https://region1.google-analytics.com; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self' http://localhost:3001";
http.createServer(async (req,res)=>{
  res.setHeader('Content-Security-Policy',csp);
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  try {
    if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
    const url = new URL(req.url,'http://localhost');
    const segments = decodeURIComponent(url.pathname).split('/').filter(Boolean);
    if (segments.some(s=>s.startsWith('.')||s.includes('\\')) || !(publicFiles.has(segments[0]||'index.html')||publicDirs.has(segments[0]))) throw new Error('private');
    let file=path.resolve(root,...segments);
    if ((await stat(file)).isDirectory()) {
      if (!url.pathname.endsWith('/')) {res.writeHead(308,{Location:url.pathname+'/'+url.search});res.end();return;}
      file=path.join(file,'index.html');
    }
    const resolved=await realpath(file);
    if (!resolved.startsWith(root) || !types[path.extname(resolved)]) throw new Error('private');
    let data=await readFile(resolved);
    const mime=types[path.extname(resolved)];
    res.setHeader('Vary','Accept-Encoding');
    if (data.length>1024 && /text|javascript|json|xml/.test(mime) && /\bgzip\b/.test(req.headers['accept-encoding']||'')) {
      data=gzipSync(data);res.setHeader('Content-Encoding','gzip');
    }
    res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-cache','Content-Length':data.length});
    res.end(req.method==='HEAD'?undefined:data);
  } catch {
    res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});
    res.end(await readFile(path.join(root,'404.html')).catch(()=>'<h1>404</h1><a href="/">Home / Startseite</a>'));
  }
}).listen(Number(process.env.PORT||8000),'127.0.0.1',()=>console.log('Frontend: http://localhost:8000'));
