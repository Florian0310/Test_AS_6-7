import path from 'node:path';
import { outputDir, localesDir } from '../lib/paths.mjs';
import fs from 'node:fs/promises';
export async function buildMessages() {
  const messages = {};
  for (const locale of ['de', 'en']) messages[locale] = JSON.parse(await fs.readFile(path.join(localesDir,`${locale}.json`), 'utf8')).ui;
  await fs.mkdir(path.join(outputDir,'frontend/i18n'), {recursive: true});
  await fs.writeFile(path.join(outputDir,'frontend/i18n/messages.js'), `// Generated from locales/de.json and locales/en.json. Run npm run build.\nexport const messages = ${JSON.stringify(messages, null, 2)};\n`);
}
