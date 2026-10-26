import { test, expect } from '@playwright/test';
const products = Array.from({length:27},(_,index) => ({id:index+1,title:`Tool ${String(index+1).padStart(2,'0')}`,slug:`tool-${index+1}`,shortDescription:index%2 ? 'Cutting timber' : 'Drilling stone',category:{id:index%2+1,slug:index%2?'saws':'drills',name:index%2?'Saws':'Drills'},pricing:{dailyPrice:27-index},images:[],availabilityStatus:'available'}));
async function fixture(page) {
  await page.route('**/api/catalog/categories**',route=>route.fulfill({json:{data:[{id:1,slug:'drills',name:'Drills',toolCount:14},{id:2,slug:'saws',name:'Saws',toolCount:13},{id:3,slug:'empty',name:'Empty',toolCount:0}]}}));
  await page.route('**/api/catalog/products?**',async route=>{
    const params=new URL(route.request().url()).searchParams;
    const search=(params.get('search')||'').toLowerCase(),category=params.get('category'),sort=params.get('sort'),page=Number(params.get('page')||1),limit=Number(params.get('limit')||12);
    const matches=products.filter(item=>(!category||item.category.slug===category)&&`${item.title} ${item.shortDescription}`.toLowerCase().includes(search));
    if(sort==='price-asc')matches.sort((a,b)=>a.pricing.dailyPrice-b.pricing.dailyPrice);
    if(sort==='price-desc')matches.sort((a,b)=>b.pricing.dailyPrice-a.pricing.dailyPrice);
    if(search==='tool 01')await new Promise(resolve=>setTimeout(resolve,500));
    await route.fulfill({json:{data:matches.slice((page-1)*limit,page*limit),total:matches.length,hasNextPage:page*limit<matches.length}});
  });
  await page.addInitScript(()=>localStorage.setItem('as_cookie_consent_v2',JSON.stringify({version:2,analytics:false,updatedAt:new Date().toISOString()})));
}
test('combined filters toggle, clear, empty, reset, reload and browser history',async({page})=>{
  await fixture(page);await page.goto('/en/catalog/');
  const drills=page.locator('[data-category="drills"]'),search=page.locator('[data-tools-search]');
  await expect(drills).toBeVisible();await expect(page.locator('[data-category="empty"]')).toHaveCount(0);
  await drills.click();await expect(drills).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('[data-result-count]')).toContainText('14');
  await drills.click();await expect(drills).toHaveAttribute('aria-pressed','false');
  await page.goBack();await expect(drills).toHaveAttribute('aria-pressed','true');
  await search.fill('timber');await expect(page.locator('[data-shop-feedback]')).toContainText('No');
  await page.locator('[data-clear-search]').click();await expect(drills).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('[data-result-count]')).toContainText('14');
  await search.fill('stone');await expect(page).toHaveURL(/category=drills&search=stone/);
  await page.reload();await expect(search).toHaveValue('stone');await expect(drills).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-reset-filter]').click();await expect(page.locator('[data-result-count]')).toContainText('27');await expect(page).toHaveURL(/en\/catalog\/$/);
});
test('pagination, price sort and stale search responses stay consistent without reload',async({page})=>{
  await fixture(page);await page.goto('/en/catalog/');
  const token=await page.evaluate(()=>window.refactorToken=Math.random());
  await expect(page.locator('.product-card')).toHaveCount(12);
  await page.locator('[data-page-next]').click();await expect(page.locator('.product-card h3').first()).toHaveText('Tool 13');
  await page.locator('[data-page-next]').click();await expect(page.locator('.product-card')).toHaveCount(3);
  await page.locator('[data-tools-sort]').selectOption('price-asc');await expect(page.locator('.product-card h3').first()).toHaveText('Tool 27');
  await page.locator('[data-tools-search]').fill('tool 01');await page.waitForTimeout(240);
  await page.locator('[data-tools-search]').fill('tool 02');await expect(page.locator('.product-card h3')).toHaveText(['Tool 02']);
  await page.waitForTimeout(550);await expect(page.locator('.product-card h3')).toHaveText(['Tool 02']);
  expect(await page.evaluate(()=>window.refactorToken)).toBe(token);
});
test('category failure leaves products usable and supports category retry',async({page})=>{
  await fixture(page);let fail=true;
  await page.route('**/api/catalog/categories**',route=>fail?route.abort():route.fallback());
  await page.goto('/en/catalog/');await expect(page.locator('.product-card')).toHaveCount(12);
  await expect(page.locator('[data-category-feedback]')).not.toBeEmpty();
  fail=false;await page.locator('.shop-categories button',{hasText:'Try again'}).click();
  await expect(page.locator('[data-category="drills"]')).toBeVisible();await expect(page.locator('[data-category-feedback]')).toBeEmpty();
});
test('gallery uses originals, handles broken images and retains keyboard focus',async({page})=>{
  await fixture(page);
  await page.route('**/api/catalog/products/slug/**',route=>route.fulfill({json:{data:{...products[0],images:[{url:'http://localhost:8000/assets/images/bannerBackground.webp',originalUrl:'http://localhost:8000/assets/images/bannerBackground-mobile.webp',thumbnailUrl:'http://localhost:8000/assets/images/bannerBackground.webp',alt:'First picture'},{url:'http://localhost:8000/missing-image.png',originalUrl:'http://localhost:8000/missing-image.png',alt:'Second picture'}]}}}));
  await page.goto('/en/catalog/product.html?slug=tool-1');
  const image=page.locator('[data-tool-main-image]'),buttons=page.locator('[data-thumb-index]');
  await expect(image).toHaveAttribute('src',/bannerBackground-mobile/);
  await buttons.first().focus();await page.keyboard.press('ArrowRight');await expect(buttons.nth(1)).toBeFocused();
  await expect(buttons.nth(1)).toHaveAttribute('aria-pressed','true');await expect(image).toHaveAttribute('src',/^data:image\/svg/);
});
