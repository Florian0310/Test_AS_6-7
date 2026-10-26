import fs from 'node:fs/promises';
import path from 'node:path';
import { buildSite } from './site.mjs';
import { outputDir } from '../lib/paths.mjs';
const backend = new URL(process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001');
if (backend.protocol !== 'https:' || ['localhost','127.0.0.1'].includes(backend.hostname)) throw new Error('Set BACKEND_PUBLIC_URL to the actual HTTPS backend before exporting.');
await buildSite();
await fs.writeFile(path.join(outputDir,'app-config.js'),`window.APP_CONFIG=Object.freeze(${JSON.stringify({PAYLOAD_URL:backend.origin,PAYLOAD_API_PREFIX:'/api',GTM_ID:'',GA4_MEASUREMENT_ID:'',TURNSTILE_SITE_KEY:process.env.TURNSTILE_SITE_KEY||''})});\n`);
console.log('Public files exported to dist/. Analytics remains disabled until legally and technically configured.');
