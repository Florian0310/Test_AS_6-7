import fs from 'node:fs/promises';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
const label = process.argv[2] || 'after';
await fs.mkdir('artifacts', { recursive: true });
const chrome = await launch({chromePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', chromeFlags: ['--headless=new', '--no-sandbox']});
try {
  const { lhr } = await lighthouse('http://localhost:8000/en/index.html', {
    port: chrome.port, output: 'json', onlyCategories: ['performance','accessibility','best-practices','seo'],
    logLevel: 'error',
  });
  await fs.writeFile(`artifacts/lighthouse-${label}.json`, JSON.stringify(lhr, null, 2));
  console.log(JSON.stringify({label, categories:Object.fromEntries(Object.entries(lhr.categories).map(([k,v])=>[k,Math.round(v.score*100)])),
    LCP:lhr.audits['largest-contentful-paint'].numericValue, CLS:lhr.audits['cumulative-layout-shift'].numericValue,
    TBT:lhr.audits['total-blocking-time'].numericValue, bytes:lhr.audits['total-byte-weight'].numericValue}));
} finally {await chrome.kill();}
