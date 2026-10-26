import fs from 'node:fs/promises';
import path from 'node:path';
import { buildPages } from './content.mjs';
import { buildCatalogPages } from '../../frontend/templates/catalog.mjs';
import { header, footer } from '../../frontend/templates/shell.mjs';
import { routePairs } from '../../frontend/src/config/routes.js';
import { buildMessages } from './messages.mjs';
import { buildStyles } from './styles.mjs';
import { buildSEO } from './seo.mjs';
import { outputDir, sourceDir, publicDir, templatesDir, routeFile, assertBuildOutput } from '../lib/paths.mjs';

export async function buildSite() {
  assertBuildOutput(outputDir);
  await fs.rm(outputDir, {recursive: true, force: true});
  await fs.mkdir(outputDir, {recursive: true});
  await fs.cp(publicDir, outputDir, {recursive: true, filter: source => !source.endsWith('app-config.example.js')});
  await fs.cp(sourceDir, path.join(outputDir, 'frontend'), {recursive: true});
  for (const file of ['index.html','about-us/index.html','forestry-work/index.html','contact/index.html','en/index.html','en/contact/index.html','404.html']) {
    await fs.mkdir(path.dirname(path.join(outputDir, file)), {recursive: true});
    await fs.copyFile(path.join(templatesDir, 'pages', file), path.join(outputDir, file));
  }
  await buildMessages();
  await buildPages();
  await buildCatalogPages();
  for (const route of [...routePairs.flat(), '/404.html']) {
    const file = routeFile(route), locale = route.startsWith('/en/') ? 'en' : 'de';
    let html = await fs.readFile(file, 'utf8');
    html = html.replace(/<header\b[^>]*>[\s\S]*?<\/header>/g, header(locale, route));
    if (!html.includes('data-site-header')) html = html.replace(/<main\b/, `${header(locale, route)}\n<main`);
    html = html.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/g, footer(locale));
    if (!html.includes('data-site-footer')) html = html.replace('</main>', `</main>\n${footer(locale)}`);
    html = html.replace('</body>', '<script type="module" src="/frontend/main.js"></script>\n</body>');
    await fs.writeFile(file, html);
  }
  await buildStyles();
  await buildSEO();
  console.log(`Built ${routePairs.length * 2 + 1} pages in dist/. Public URLs are unchanged.`);
}
