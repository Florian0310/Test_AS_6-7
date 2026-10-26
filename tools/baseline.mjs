import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
await fs.mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({locale:'en',viewport:{width:1440,height:1000}});
const page=await context.newPage();
const results=[];
for(const path of ['/en/index.html','/en/catalog/','/en/cookie-settings/']) {
  await page.goto(`http://localhost:8000${path}`);
  await page.waitForLoadState('networkidle');
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  results.push({path,violations:audit.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))});
  await page.screenshot({path:`artifacts/before-${path.split('/')[2]||'home'}.png`,fullPage:true});
}
await fs.writeFile('artifacts/browser-baseline.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results));
await browser.close();
