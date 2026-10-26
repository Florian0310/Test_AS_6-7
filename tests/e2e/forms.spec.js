import { test, expect } from '@playwright/test';
const dismiss = async page => {await page.locator('[data-consent-accept-necessary]').click();};
test('contact validates, retains failed input and sends localized data after retry',async({page})=>{
  let fail=true,submitted;
  await page.route('**/api/public/contact',async route=>{
    submitted=route.request().postDataJSON();
    await route.fulfill({status:fail?503:201,json:{success:!fail}});
  });
  await page.goto('/en/contact/');await dismiss(page);
  await page.locator('[name=first_name]').fill('Test');await page.locator('[name=last_name]').fill('Person');
  await page.locator('[name=email]').fill('test@example.invalid');await page.locator('[name=message]').fill('Please advise on the right tool.');
  await page.locator('[name=privacy_consent]').check();await page.locator('form button[type=submit]').click();
  await expect(page.locator('[data-contact-status]')).toHaveClass(/is-error/);
  await expect(page.locator('[name=email]')).toHaveValue('test@example.invalid');
  fail=false;await page.locator('form button[type=submit]').click();await expect(page.locator('[data-contact-status]')).toHaveClass(/is-success/);
  expect(submitted).toMatchObject({name:'Test Person',locale:'en',consentPrivacy:true});await expect(page.locator('[name=email]')).toHaveValue('');
});
test('rental inquiry repairs date ranges and prevents duplicate submissions',async({page})=>{
  let quotes=[],requests=0;
  await page.route('**/api/catalog/pricing/calculate**',async route=>{
    quotes.push(route.request().postDataJSON());
    await route.fulfill({json:{success:true,data:{product:{availabilityStatus:'available'},pricing:{subtotals:{rentalSubtotal:20,insuranceSubtotal:2,cleaningFee:0,deposit:10,totalWithDeposit:32}}}}});
  });
  await page.route('**/api/catalog/requests**',async route=>{requests++;await new Promise(resolve=>setTimeout(resolve,200));await route.fulfill({status:201,json:{success:true}});});
  await page.goto('/en/catalog/product.html?slug=hilti-sf-6-a22');await dismiss(page);
  await expect(page.locator('[data-pricing-summary]')).toContainText('32');
  const start=page.locator('[name=startDate]'),end=page.locator('[name=endDate]');
  await start.fill('2030-06-20');await start.dispatchEvent('change');await expect(end).toHaveValue('2030-06-20');
  await expect.poll(()=>quotes.at(-1)?.endDate).toBe('2030-06-20');
  await page.locator('[name=customerName]').fill('Test Person');await page.locator('[name=customerEmail]').fill('test@example.invalid');await page.locator('[name=rentalPrivacyConsent]').check();
  await page.locator('[data-rental-form]').evaluate(form=>{form.requestSubmit();form.requestSubmit();});
  await expect(page.locator('[data-rental-feedback]')).toHaveClass(/is-success/);expect(requests).toBe(1);
});
