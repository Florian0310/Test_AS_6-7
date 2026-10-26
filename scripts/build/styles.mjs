import path from 'node:path';
import { outputDir, stylesDir } from '../lib/paths.mjs';
import fs from 'node:fs/promises';
import postcss from 'postcss';
export async function buildStyles() {
  const files = ['tokens', 'content', 'shell', 'catalog', 'product'];
  const source = (await Promise.all(files.map(file => fs.readFile(path.join(stylesDir,`${file}.css`), 'utf8')))).join('\n');
  const css = postcss.parse(source);
  css.walkRules(rule => {if (/data-theme|\.theme-toggle|\.search-panel/.test(rule.selector)) throw rule.error('Removed theme/modal selector reintroduced.');});
  await fs.writeFile(path.join(outputDir,'styles.css'), '/* Generated from frontend/styles/*.css — npm run build */\n' + css.toString());
}
