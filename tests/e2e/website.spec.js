import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
const settle = async page => {await page.waitForLoadState('networkidle');};
const reject = async page => {const button=page.locator('[data-consent-accept-necessary]');if(await button.count()) await button.click();};

test('theme: light/dark/auto persistence, OS changes and icon visibility',async({page})=>{
  await page.emulateMedia({colorScheme:'dark'}); await page.goto('/en/'); await reject(page);
  const select=page.locator('[data-theme-toggle]');
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await select.selectOption('light'); await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.reload(); await expect(select).toHaveValue('light');
  await select.selectOption('dark');
  expect(await page.locator('.benefit img').first().evaluate(el=>getComputedStyle(el).filter)).toContain('invert(1)');
  await select.selectOption('auto'); await page.emulateMedia({colorScheme:'light'});
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.emulateMedia({colorScheme:'dark'}); await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});

test('search: live localized products/categories, umlauts, keyboard, focus and close',async({page})=>{
  await page.goto('/en/'); await reject(page);
  const trigger=page.locator('[data-open-search]'); await trigger.click();
  const input=page.locator('.search-input');await expect(input).toBeFocused();
  await input.fill('drilling'); await expect(page.locator('.search-results a').first()).toContainText('Hilti');
  await input.press('ArrowDown'); await expect(page.locator('.search-results a').first()).toBeFocused();
  await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await expect(page.locator('body')).not.toHaveClass(/no-scroll/);
  await trigger.click(); await input.fill('no-matching-tool-999'); await expect(page.locator('.search-feedback')).toContainText('No matching');
  await input.fill(''); await expect(page.locator('.search-feedback')).toContainText('Enter a search');
  await page.locator('[data-close-search]').click();await expect(trigger).toBeFocused();
  await trigger.click();await input.fill('Hilti');await expect(page.locator('.search-results a').first()).toBeVisible();await input.press('Enter');
  await expect(page).toHaveURL(/en\/catalog\/product.html\?slug=hilti/);
  await expect(page.locator('[data-tool-name]')).toHaveText('Hilti SF 6-A22');
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

test('API failure is understandable and search remains dismissible',async({page})=>{
  await page.route('**/api/catalog/products**',route=>route.abort());await page.goto('/en/');await reject(page);await page.locator('[data-open-search]').click();await page.locator('.search-input').fill('drill');
  await expect(page.locator('.search-feedback')).toContainText('unavailable');await page.keyboard.press('Escape');await expect(page.locator('[data-open-search]')).toBeFocused();
});

test('mobile navigation keyboard trap, focus return, responsive widths',async({page})=>{
  for(const width of [320,375,390,768,1024,1440,1920]) {
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

test('axe AA on main flows in both languages and themes, with screenshots',async({page})=>{
  test.setTimeout(120000);
  await fs.mkdir('artifacts',{recursive:true});const report=[];
  for(const theme of ['light','dark']) for(const route of ['/','/en/','/sortiment/','/en/catalog/','/cookie-einstellungen/','/en/cookie-settings/','/contact/','/en/contact/','/sortiment/produkt-hilti-sf-6-a22.html','/en/catalog/product.html','/about-us/','/en/about-us/','/forestry-work/','/en/forestry/','/impressum/','/en/imprint/','/datenschutz/','/en/privacy-policy/','/cookie-richtlinie/','/en/cookie-policy/','/barrierefreiheit/','/en/accessibility-statement/','/bildnachweise/','/en/image-credits/']) {
    await page.goto(route);await reject(page);await page.locator('[data-theme-toggle]').selectOption(theme);await settle(page);
    const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    const violations=results.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}));report.push({theme,route,violations});
    expect.soft(violations,`${theme} ${route}`).toEqual([]);
  }
  await fs.writeFile('artifacts/axe-after.json',JSON.stringify(report,null,2));
  await page.goto('/en/');await reject(page);await page.locator('[data-theme-toggle]').selectOption('dark');await settle(page);await page.screenshot({path:'artifacts/after-home-dark.png',fullPage:true});
  await page.locator('[data-open-search]').click();await page.locator('.search-input').fill('drill');await expect(page.locator('.search-results a').first()).toBeVisible();await page.screenshot({path:'artifacts/after-search-dark.png'});
});
