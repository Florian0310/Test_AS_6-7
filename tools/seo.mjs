import fs from 'node:fs/promises';
import { routePairs as pairs } from '../frontend/config/routes.js';
import { site } from '../frontend/config/site.js';
const domain=site.origin;
for(const pair of pairs) for(const route of pair) {
  const file=(route.endsWith('/')?route+'index.html':route).slice(1);
  let html=await fs.readFile(file,'utf8');
  html=html.replace(/\s*<link rel="(?:alternate|canonical)"[^>]*\/>/g,'');
  html=html.replace('</head>',`<link rel="canonical" href="${domain}${route}" /><link rel="alternate" hreflang="de-AT" href="${domain}${pair[0]}" /><link rel="alternate" hreflang="en" href="${domain}${pair[1]}" /><link rel="alternate" hreflang="x-default" href="${domain}${pair[0]}" /></head>`);
  html=html.replace(/(<meta property="og:url" content=")[^"]+/,`$1${domain}${route}`);
  await fs.writeFile(file,html);
}
await fs.writeFile('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${pairs.flatMap(pair=>pair.filter(route=>!route.includes('request.html')&&!route.includes('reservierung.html')).map(route=>`<url><loc>${domain}${route}</loc>${pair.map((href,i)=>`<xhtml:link rel="alternate" hreflang="${i?'en':'de-AT'}" href="${domain}${href}" />`).join('')}</url>`)).join('\n')}\n</urlset>\n`);
