import fs from 'node:fs/promises';
// Keep one authoritative palette while bundling the CMS as an independent Next app.
const source = new URL('../../frontend/styles/tokens.css', import.meta.url);
const target = new URL('../src/app/tokens.generated.css', import.meta.url);
await fs.writeFile(target, '/* Generated from frontend/styles/tokens.css. */\n' + await fs.readFile(source, 'utf8'));
