import fs from 'node:fs/promises';
import { buildPages } from './build-content.mjs';
import { buildCatalogPages } from './templates/catalog.mjs';
import { header, footer } from './templates/shell.mjs';
import { routePairs } from '../frontend/config/routes.js';
import { buildMessages } from './build-messages.mjs';
import { buildStyles } from './build-styles.mjs';

// Authored pages are source templates; root HTML files are reproducible build output.
for (const file of ['index.html','about-us/index.html','forestry-work/index.html','contact/index.html','en/index.html','en/contact/index.html','404.html']) {
  await fs.copyFile(`tools/templates/pages/${file}`, file);
}
await buildMessages();
await buildPages();
await buildCatalogPages();
for (const route of [...routePairs.flat(), '/404.html']) {
  const file = (route.endsWith('/') ? route + 'index.html' : route).slice(1);
  const locale = route.startsWith('/en/') ? 'en' : 'de';
  let html = await fs.readFile(file, 'utf8');
  html = html.replace(/<header\b[^>]*>[\s\S]*?<\/header>/g, header(locale, route));
  if (!html.includes('data-site-header')) html = html.replace(/<main\b/, `${header(locale, route)}\n<main`);
  html = html.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/g, footer(locale));
  if (!html.includes('data-site-footer')) html = html.replace('</main>', `</main>\n${footer(locale)}`);
  html = html.replace('</body>', '<script type="module" src="/frontend/main.js"></script>\n</body>');
  await fs.writeFile(file, html);
}
await buildStyles();
await import('./seo.mjs');
console.log(`Built ${routePairs.length * 2 + 1} pages with one shared header/footer and fixed corporate styling.`);
