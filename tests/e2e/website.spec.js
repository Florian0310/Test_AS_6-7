import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
const settle = async page => {await page.waitForLoadState('networkidle');};
const reject = async page => {const button=page.locator('[data-consent-accept-necessary]');if(await button.count()) await button.click();};

test('fixed corporate appearance and header search route to the focused catalog',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('as_theme_mode_v1','dark'));
  await page.emulateMedia({colorScheme:'dark'}); await page.goto('/en/'); await reject(page);
  await expect(page.locator('[data-theme-toggle], .search-panel, [data-open-search]')).toHaveCount(0);
  expect(await page.locator('html').evaluate(el=>getComputedStyle(el).colorScheme)).toBe('light');
  await page.locator('[data-catalog-search-link]').click();
  const input=page.locator('[data-tools-search]'); await expect(input).toBeFocused();
  await input.fill('DRILLING'); await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.locator('.product-card h3')).toContainText('Hilti');
  await expect(page).toHaveURL(/search=DRILLING/);
  await input.fill('no-matching-tool-999'); await expect(page.locator('[data-shop-feedback]')).toContainText('No');
  await page.locator('[data-clear-search]').click();await expect(input).toHaveValue('');
  await expect(page.locator('.product-card')).toHaveCount(4);
  await page.locator('.product-card h3 a').filter({hasText:'Hilti'}).click();
  await expect(page.locator('[data-tool-description]')).toContainText('Cordless');
});

test('consent: clean profile, reject, save, withdraw, return and reload',async({page})=>{
  const tracking=[];page.on('request',r=>{if(/googletagmanager|google-analytics/.test(r.url()))tracking.push(r.url());});
  await page.goto('/en/'); await expect(page.locator('[data-consent-banner]')).toBeVisible();await settle(page);expect(tracking).toHaveLength(0);
  await reject(page);await page.reload();await expect(page.locator('[data-consent-banner]')).toHaveCount(0);
  await page.goto('/en/catalog/');await page.getByRole('link',{name:'Cookie Settings',exact:false}).first().click();
  await page.locator('[data-consent-analytics]').check();await page.locator('[data-consent-save]').click();await expect(page.locator('[data-consent-status]')).toContainText('saved');
  await page.reload();await expect(page.locator('[data-consent-analytics]')).toBeChecked();
  await page.locator('[data-consent-revoke]').click();await expect(page.locator('[data-consent-analytics]')).not.toBeChecked();await expect(page.locator('[data-consent-status]')).toContainText('withdrawn');
  await page.reload();await expect(page.locator('[data-consent-analytics]')).not.toBeChecked();
  await page.getByRole('link',{name:'Back to website'}).click();await expect(page).toHaveURL(/en\/catalog\//);expect(tracking).toHaveLength(0);
});

test('configured analytics: no early request, deduplicate and terminate after withdrawal',async({page,context})=>{
  let loads=0;
  await context.route('**/app-config.js',route=>route.fulfill({contentType:'text/javascript',body:"window.APP_CONFIG={PAYLOAD_URL:'http://localhost:3001',GA4_MEASUREMENT_ID:'G-TEST123'};"}));
  await context.route('https://www.googletagmanager.com/**',route=>{loads++;return route.fulfill({contentType:'text/javascript',body:'window.testTrackerLoaded=true;'});});
  await page.goto('/en/cookie-settings/');await settle(page);expect(loads).toBe(0);
  await page.locator('[data-consent-analytics]').check();await page.locator('[data-consent-save]').click();await expect.poll(()=>loads).toBe(1);
  await page.locator('[data-consent-save]').click();expect(loads).toBe(1);
  await page.evaluate(()=>{document.cookie='_ga=test; path=/';});
  await page.locator('[data-consent-revoke]').click();await page.waitForLoadState('load');
  await expect(page.locator('[data-consent-analytics]')).not.toBeChecked();
  expect(await page.evaluate(()=>window.testTrackerLoaded)).toBeUndefined();
  expect((await context.cookies()).some(c=>c.name==='_ga')).toBe(false);
  await page.reload();await settle(page);expect(loads).toBe(1);
});

test('language switches preserve filters and product slug; English navigation stays English',async({page})=>{
  await page.goto('/sortiment/?category=bohren-stemmen&search=Hilti');await reject(page);
  await page.locator('[data-locale-switch="en"]').click();await expect(page).toHaveURL(/en\/catalog\/\?category=bohren-stemmen&search=Hilti/);
  await expect(page.locator('.category-btn').filter({hasText:'Drilling'})).toBeVisible();
  await page.locator('.shop-product-card h3 a').first().click();
  await expect(page).toHaveURL(/en\/catalog\/product/);
  await page.locator('[data-locale-switch="de"]').click();await expect(page).toHaveURL(/sortiment\/produkt.*slug=hilti/);
});

test('language switch preserves an unsent contact form without putting personal data in the URL',async({page})=>{
  await page.goto('/contact/');await reject(page);
  await page.locator('[name=first_name]').fill('Test');await page.locator('[name=last_name]').fill('Person');await page.locator('[name=email]').fill('audit@example.invalid');
  await page.locator('[data-locale-switch="en"]').click();
  await expect(page.locator('[name=first_name]')).toHaveValue('Test');await expect(page.locator('[name=email]')).toHaveValue('audit@example.invalid');
  expect(page.url()).not.toContain('example.invalid');
  expect(await page.evaluate(()=>sessionStorage.getItem('as_locale_form_draft'))).toBe(null);
});

test('malformed/legacy consent does not grant analytics and tabs stay synchronized',async({page,context})=>{
  await page.goto('/en/cookie-settings/');
  await page.evaluate(()=>localStorage.setItem('as_cookie_consent_v2',JSON.stringify({version:2,analytics:'false',updatedAt:new Date().toISOString()})));
  await page.reload();await expect(page.locator('[data-consent-analytics]')).not.toBeChecked();
  const second=await context.newPage();await second.goto('http://localhost:8000/en/cookie-settings/');
  await page.locator('[data-consent-analytics]').check();await page.locator('[data-consent-save]').click();await expect(second.locator('[data-consent-analytics]')).toBeChecked();
  await second.locator('[data-consent-revoke]').click();await expect(page.locator('[data-consent-analytics]')).not.toBeChecked();await second.close();
});

test('category counts match filters including empty categories and All products',async({page})=>{
  await page.goto('/sortiment/');await reject(page);await settle(page);
  const buttons=page.locator('.category-btn');const total=await buttons.count();expect(total).toBeGreaterThan(1);
  for(let i=0;i<total;i++) {
    const button=buttons.nth(i);const count=Number(await button.locator('small').textContent());await button.click();await settle(page);
    await expect(page.locator('.shop-product-card')).toHaveCount(count);
    await expect(button).toHaveAttribute('aria-pressed','true');
  }
});

test('API failure offers recovery without losing the search',async({page})=>{
  let fail=true;
  await page.route('**/api/catalog/products?**',route=>fail ? route.abort() : route.continue());
  await page.goto('/en/catalog/?search=Hilti');await reject(page);
  await expect(page.locator('[data-shop-feedback]')).toContainText('unavailable');
  await expect(page.locator('[data-tools-search]')).toHaveValue('Hilti');
  fail=false;await page.locator('[data-catalog-retry]').click();await expect(page.locator('.product-card')).toHaveCount(1);
});

test('mobile navigation keyboard trap, focus return, responsive widths',async({page})=>{
  for(const width of [320,375,390,430,768,1024,1280,1440,1920]) {
    await page.setViewportSize({width,height:900});
    for(const route of ['/en/','/en/catalog/','/en/cookie-settings/','/en/catalog/product.html?slug=hilti-sf-6-a22']) {
      await page.goto(route);await reject(page);await settle(page);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1),`${width} ${route}`).toBe(true);
    }
  }
  await page.setViewportSize({width:390,height:844});await page.goto('/en/');await reject(page);
  await page.locator('[data-open-menu]').click();await expect(page.locator('.nav-link').first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');await expect(page.locator('[data-close-menu]')).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.locator('[data-open-menu]')).toBeFocused();
});

test('axe AA on all public routes in both languages, with screenshots',async({page})=>{
  test.setTimeout(120000);
  await fs.mkdir('artifacts',{recursive:true});const report=[];
  for(const route of ['/','/en/','/sortiment/','/en/catalog/','/cookie-einstellungen/','/en/cookie-settings/','/contact/','/en/contact/','/sortiment/produkt-hilti-sf-6-a22.html','/en/catalog/product.html','/about-us/','/en/about-us/','/forestry-work/','/en/forestry/','/impressum/','/en/imprint/','/datenschutz/','/en/privacy-policy/','/cookie-richtlinie/','/en/cookie-policy/','/barrierefreiheit/','/en/accessibility-statement/','/bildnachweise/','/en/image-credits/','/sortiment/reservierung.html','/en/catalog/request.html','/404.html']) {
    await page.goto(route);await reject(page);await settle(page);
    const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    const violations=results.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}));report.push({route,violations});
    expect.soft(violations,route).toEqual([]);
  }
  await fs.writeFile('artifacts/axe-after.json',JSON.stringify(report,null,2));
  for(const [route,name,width] of [['/en/','home',1440],['/sortiment/','catalog',1440],['/en/catalog/','catalog-mobile',390],['/en/catalog/product.html?slug=hilti-sf-6-a22','detail-mobile',390]]) {
    await page.setViewportSize({width,height:900});await page.goto(route);await reject(page);await settle(page);
    await page.screenshot({path:`artifacts/refactor-${name}.png`,fullPage:true});
  }
});
