import { test, expect, request } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';

let admin,user,userID,category,originalRequest;
const accessibility=[];
const adminEmail=process.env.PAYLOAD_ADMIN_EMAIL,adminPassword=process.env.PAYLOAD_ADMIN_PASSWORD;
const userEmail=process.env.CMS_USER_EMAIL,userPassword=process.env.CMS_USER_PASSWORD;
const denied = response => expect([401,403,404]).toContain(response.status());
const login = async (page,email,password) => {
  await page.goto('/admin/login');await page.locator('[name=email]').fill(email);await page.locator('[name=password]').fill(password);
  await page.locator('form button[type=submit]').click();await expect(page).toHaveURL(/\/admin\/?$/);
  await expect(page.locator('.cms-welcome')).toBeVisible();
};
test.beforeAll(async()=>{
  if(!adminEmail||!userEmail)throw new Error('Use npm run test:cms to create isolated test accounts.');
  const anonymous=await request.newContext({baseURL:process.env.CMS_BASE_URL});
  const getToken=async(email,password)=>(await(await anonymous.post('/api/users/login',{data:{email,password}})).json()).token;
  admin=await request.newContext({baseURL:process.env.CMS_BASE_URL,extraHTTPHeaders:{Authorization:`JWT ${await getToken(adminEmail,adminPassword)}`}});
  user=await request.newContext({baseURL:process.env.CMS_BASE_URL,extraHTTPHeaders:{Authorization:`JWT ${await getToken(userEmail,userPassword)}`}});
  userID=(await(await user.get('/api/users/me')).json()).user.id;
  category=(await(await admin.get('/api/categories?limit=1')).json()).docs[0];
  originalRequest=(await(await admin.get('/api/requests?limit=1&depth=0')).json()).docs[0];
  if(!originalRequest) {
    const product=(await(await admin.get('/api/products?limit=1')).json()).docs[0];
    originalRequest={product:product.id,productSnapshot:{title:product.title,slug:product.slug,articleNumber:product.articleNumber,prices:{dailyPrice:product.pricing.dailyPrice,threeDayPrice:product.pricing.threeDayPrice,weeklyPrice:product.pricing.weeklyPrice}},pricingSummary:{rentalDays:1,totalWithDeposit:product.pricing.dailyPrice}};
  }
  await anonymous.dispose();
});
test.afterAll(async()=>{await admin?.dispose();await user?.dispose();});

test('real login/logout, branded responsive dashboards and role-aware menus',async({browser})=>{
  for(const [email,password,role] of [[adminEmail,adminPassword,'admin'],[userEmail,userPassword,'user']]) {
    const context=await browser.newContext();const page=await context.newPage();
    await login(page,email,password);
    const nav=page.locator('nav');
    if(role==='admin')await expect(nav.locator('a[href="/admin/collections/users"]')).toBeVisible();
    else {
      await expect(nav.locator('a[href="/admin/collections/users"],a[href*="/admin/globals/"],a[href="/admin/collections/categories"]')).toHaveCount(0);
      await expect(page.getByRole('link',{name:'Team verwalten'})).toHaveCount(0);
    }
    await expect(page.locator('.cms-identity')).toContainText(role==='admin'?'Administrator':'Benutzer');
    for(const width of [320,390,768,1440,1920]) {
      await page.setViewportSize({width,height:900});await page.waitForTimeout(50);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${role}: ${width}`).toBe(true);
    }
    await page.setViewportSize({width:1440,height:1000});
    await page.reload();
    await expect(page.locator('aside.nav')).toHaveClass(/nav--nav-hydrated/);
    if(await page.locator('aside.nav').getAttribute('inert')!==null)await page.locator('button.template-default__nav-toggler').click();
    await expect(page.locator('aside.nav')).toHaveClass(/nav--nav-open/);
    await expect.poll(()=>page.locator('aside.nav').evaluate(node=>getComputedStyle(node).opacity)).toBe('1');
    await page.screenshot({path:`artifacts/cms-${role}-desktop.png`,fullPage:true});
    const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    const violations=axe.violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)}));
    accessibility.push({page:`dashboard-${role}`,violations});
    // Payload 3.92's dashboard layout selector has two native accessibility defects.
    // Record them explicitly, and fail on any additional/custom-component finding.
    const unexpected=violations.filter(item=>!((item.id==='aria-hidden-focus'&&item.nodes.every(target=>target.length===1&&target[0]==='.dropdown-indicator'))||(item.id==='label'&&item.nodes.every(target=>target.length===1&&/^#react-select-.*-input$/.test(target[0])))));
    expect(unexpected).toEqual([]);
    const custom=await new AxeBuilder({page}).include('.cms-welcome').include('.cms-statistics').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    expect(custom.violations).toEqual([]);
    await page.goto('/admin/logout');await expect(page).toHaveURL(/login/);
    await context.close();
  }
});

test('login rejects wrong credentials and anonymous CRUD stays forbidden',async({page})=>{
  await page.goto('/admin/login');await page.locator('[name=email]').fill(userEmail);await page.locator('[name=password]').fill('incorrect-isolated-test-password');
  await page.locator('form button[type=submit]').click();await expect(page).toHaveURL(/login/);
  await expect(page.locator('[name=password]')).toBeVisible();
  const anonymous=await request.newContext({baseURL:process.env.CMS_BASE_URL});
  for(const path of ['/api/users','/api/requests','/api/globals/site-settings'])denied(await anonymous.get(path));
  for(const path of ['/api/users','/api/products','/api/requests'])denied(await anonymous.post(path,{data:{}}));
  await anonymous.dispose();
});

test('both roles can create, read, edit and delete products',async()=>{
  for(const [role,client] of [['admin',admin],['user',user]]) {
    const slug=`cms-test-${role}-${Date.now()}`;
    const response=await client.post('/api/products',{data:{title:`CMS test ${role}`,slug,articleNumber:slug,shortDescription:'Isolated CMS CRUD test.',category:category.id,pricing:{dailyPrice:12,threeDayPrice:30,weeklyPrice:60,minimumRentalDays:1},availabilityStatus:'available',isActive:true}});
    expect(response.status(),await response.text()).toBe(201);const product=(await response.json()).doc;
    expect((await client.get(`/api/products/${product.id}`)).status()).toBe(200);
    const update=await client.patch(`/api/products/${product.id}`,{data:{title:'Updated isolated tool',pricing:{dailyPrice:15}}});expect(update.status()).toBe(200);
    expect((await update.json()).doc.pricing.dailyPrice).toBe(15);
    expect((await client.delete(`/api/products/${product.id}`)).status()).toBe(200);
    expect((await client.get(`/api/products/${product.id}`)).status()).toBe(404);
  }
});

test('admin manages users and roles; normal users cannot escalate or manage other accounts',async()=>{
  const email=`temporary-${Date.now()}@example.invalid`;
  const response=await admin.post('/api/users',{data:{email,password:'Temporary-CMS-Crud-Secret-84!',name:'Temporary User'}});expect(response.status()).toBe(201);
  const created=(await response.json()).doc;expect(created.role).toBe('user');
  denied(await user.post('/api/users',{data:{email:'forbidden@example.invalid',password:'Never-Create-This-Secret!',name:'Blocked',role:'admin'}}));
  denied(await user.get(`/api/users/${created.id}`));denied(await user.patch(`/api/users/${created.id}`,{data:{name:'Forbidden'}}));denied(await user.delete(`/api/users/${created.id}`));
  expect((await user.patch(`/api/users/${userID}`,{data:{role:'admin'}})).status()).toBe(403);
  await expect((await user.get('/api/users')).json()).resolves.toMatchObject({totalDocs:1});
  expect((await admin.patch(`/api/users/${created.id}`,{data:{name:'Updated user',role:'admin'}})).status()).toBe(200);
  expect((await admin.delete(`/api/users/${created.id}`)).status()).toBe(200);
  expect((await user.patch(`/api/users/${userID}`,{data:{name:'CMS Test User'}})).status()).toBe(200);
});

test('role changes take effect on an already issued login token',async()=>{
  denied(await user.get('/api/globals/site-settings'));
  expect((await admin.patch(`/api/users/${userID}`,{data:{role:'admin'}})).status()).toBe(200);
  expect((await user.get('/api/globals/site-settings')).status()).toBe(200);
  expect((await admin.patch(`/api/users/${userID}`,{data:{role:'user'}})).status()).toBe(200);
  denied(await user.get('/api/globals/site-settings'));
});

test('normal user only accepts requests; admin retains request CRUD',async()=>{
  const data={product:originalRequest.product,productSnapshot:originalRequest.productSnapshot,customerName:'Isolated Customer',customerEmail:'customer@example.invalid',rentalDays:1,pricingSummary:originalRequest.pricingSummary};
  const response=await admin.post('/api/requests',{data});expect(response.status(),await response.text()).toBe(201);const doc=(await response.json()).doc;
  expect((await user.get(`/api/requests/${doc.id}`)).status()).toBe(200);
  denied(await user.post('/api/requests',{data}));denied(await user.delete(`/api/requests/${doc.id}`));
  for(const mutation of [{status:'rejected'},{customerName:'Forged'},{pricingSummary:{total:1}},{status:'accepted',customerEmail:'forged@example.invalid'}])expect((await user.patch(`/api/requests/${doc.id}`,{data:mutation})).status()).toBe(403);
  const accepted=await user.patch(`/api/requests/${doc.id}`,{data:{status:'accepted'}});expect(accepted.status(),await accepted.text()).toBe(200);
  const saved=(await accepted.json()).doc;expect(saved.status).toBe('accepted');expect(saved.pricingSummary).toEqual(doc.pricingSummary);expect(saved.customerName).toBe(doc.customerName);
  expect((await admin.patch(`/api/requests/${doc.id}`,{data:{status:'rejected',customerName:'Admin corrected'}})).status()).toBe(200);
  denied(await user.patch(`/api/requests/${doc.id}`,{data:{status:'accepted'}}));
  expect((await admin.delete(`/api/requests/${doc.id}`)).status()).toBe(200);
});

test('settings and category writes are admin-only; user media support is constrained',async()=>{
  for(const slug of ['site-settings','contact-settings','rental-settings','legal-settings']) {
    expect((await admin.get(`/api/globals/${slug}`)).status()).toBe(200);
    denied(await user.get(`/api/globals/${slug}`));denied(await user.post(`/api/globals/${slug}`,{data:{}}));
  }
  expect((await admin.post('/api/globals/site-settings',{data:{siteName:'Alles Saniert'}})).status()).toBe(200);
  denied(await user.post('/api/categories',{data:{name:'Forbidden',slug:'forbidden'}}));
  denied(await user.patch(`/api/categories/${category.id}`,{data:{name:'Forbidden'}}));denied(await user.delete(`/api/categories/${category.id}`));
  const response=await user.post('/api/media',{multipart:{alt:'Isolated upload',file:{name:'cms-test.jpg',mimeType:'image/jpeg',buffer:await fs.readFile('frontend/public/assets/images/logo.jpg')}}});
  expect(response.status(),await response.text()).toBe(201);const media=(await response.json()).doc;
  expect((await user.patch(`/api/media/${media.id}`,{data:{alt:'Updated upload'}})).status()).toBe(200);
  denied(await user.delete(`/api/media/${media.id}`));expect((await admin.delete(`/api/media/${media.id}`)).status()).toBe(200);
});

test('normal-user request UI provides acceptance without editable customer or price fields',async({page})=>{
  const response=await admin.post('/api/requests',{data:{product:originalRequest.product,productSnapshot:originalRequest.productSnapshot,customerName:'UI Customer',customerEmail:'ui@example.invalid',rentalDays:1,pricingSummary:originalRequest.pricingSummary}});
  const doc=(await response.json()).doc;
  await login(page,userEmail,userPassword);await page.goto(`/admin/collections/requests/${doc.id}`);
  await expect(page.getByRole('button',{name:'Anfrage annehmen',exact:true})).toBeVisible();
  await expect(page.locator('[name=customerName]')).toBeDisabled();
  await page.getByRole('button',{name:'Anfrage annehmen',exact:true}).click();await expect(page.locator('.cms-accept-request')).toContainText('Anfrage angenommen');
  expect((await(await admin.get(`/api/requests/${doc.id}`)).json()).status).toBe('accepted');
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.screenshot({path:'artifacts/cms-request-user-mobile.png',fullPage:true});
  await admin.delete(`/api/requests/${doc.id}`);
});

test('the last administrator cannot be deleted or demoted',async()=>{
  const me=(await(await admin.get('/api/users/me')).json()).user;
  const admins=(await(await admin.get('/api/users?where[role][equals]=admin&limit=100')).json()).docs;
  for(const account of admins)if(account.id!==me.id)expect((await admin.delete(`/api/users/${account.id}`)).status()).toBe(200);
  expect((await admin.patch(`/api/users/${me.id}`,{data:{role:'user'}})).status()).toBe(403);
  expect((await admin.delete(`/api/users/${me.id}`)).status()).toBe(403);
});

test('login remains accessible and usable at mobile sizes',async({page})=>{
  const report=accessibility;
  await page.goto('/admin/login');
  for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  report.push({page:'login',violations:results.violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)}))});
  await fs.writeFile('artifacts/cms-axe.json',JSON.stringify(report,null,2));expect(report.at(-1).violations).toEqual([]);
  await page.screenshot({path:'artifacts/cms-login-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/cms-login-mobile.png',fullPage:true});
});
