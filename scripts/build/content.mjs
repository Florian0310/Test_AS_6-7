import path from 'node:path';
import { outputDir, localesDir } from '../lib/paths.mjs';
import { documentPage } from '../../frontend/templates/shell.mjs';
import fs from 'node:fs/promises';
export async function buildPages() {
  const routes = [['impressum','imprint'],['datenschutz','privacy-policy'],['cookie-richtlinie','cookie-policy'],['barrierefreiheit','accessibility-statement'],['cookie-einstellungen','cookie-settings'],['bildnachweise','image-credits']];
  for (const locale of ['de','en']) {
    const t=JSON.parse(await fs.readFile(path.join(localesDir,`${locale}.json`),'utf8'));
    const en=locale==='en', catalog=en?'/en/catalog/':'/sortiment/', privacy=en?'/en/privacy-policy/':'/datenschutz/';
    const write=async (file,title,body,counterpart,extra='')=>{
      const target = path.join(outputDir,file);
      await fs.mkdir(path.dirname(target),{recursive:true});
      const url='/'+file.replace(/index\.html$/,'');
      const html = documentPage({locale, path:url, title, content:body, mainAttributes:extra});
      await fs.writeFile(target, html);

    };
    for(let i=0;i<routes.length;i++) {
      const pair=routes[i],file=(en?'en/'+pair[1]:pair[0])+'/index.html';
      let body=t.legalContent[i];
      if(i===4) body=`<p>${t.consentIntro}</p><form class="consent-settings" data-consent-settings-form><div class="consent-settings__row"><div><strong>${t.necessary}</strong><div class="consent-settings__meta">${t.necessaryInfo}</div></div><input type="checkbox" checked disabled aria-label="${t.necessary}" /></div><div class="consent-settings__row"><div><strong>${t.analytics}</strong><div class="consent-settings__meta">${t.analyticsInfo}</div></div><input type="checkbox" data-consent-analytics aria-label="${t.analytics}" /></div><div class="cookie-banner__actions"><button class="btn-primary" type="button" data-consent-save>${t.save}</button><button class="btn-secondary" type="button" data-consent-revoke>${t.withdraw}</button></div><p class="contact-status" data-consent-status role="status" aria-live="polite"></p></form>`;
      await write(file,t.legalTitles[i],`<article class="legal-card"><h1>${t.legalTitles[i]}</h1>${body}</article>`,en?'/'+pair[0]+'/':'/en/'+pair[1]+'/','class="legal-main"');
    }
    const product=en?'en/catalog/product.html':'sortiment/produkt-hilti-sf-6-a22.html';
    const fields=[['startDate',t.start,'date'],['endDate',t.end,'date'],['customerName',t.name,'text'],['customerEmail',t.email,'email'],['customerPhone',t.phone,'tel']];
    const form=fields.map(([name,label,type])=>`<label class="field-inline"><span>${label}</span><input name="${name}" type="${type}" ${name==='customerPhone'?'':'required'} ${name==='customerName'?'maxlength="140" autocomplete="name"':name==='customerEmail'?'maxlength="180" autocomplete="email"':name==='customerPhone'?'maxlength="80" autocomplete="tel"':''} /></label>`).join('');
    await write(product,t.product,`<section class="container section" data-tool-page data-default-slug="hilti-sf-6-a22"><a class="shop-back-link" href="${catalog}">${t.backCatalog}</a><p data-tool-feedback role="status"></p><div class="product-detail-layout"><article class="product-summary-card"><h1 data-tool-name>${t.loading}</h1><p data-tool-subtitle></p><img class="catalog-main-photo" data-tool-main-image alt="${t.product}" width="640" height="480" /><div class="product-thumbs" data-tool-thumbs></div><p data-tool-description></p><p data-tool-category></p><p data-tool-availability></p><h2>${t.specs}</h2><dl data-product-specs></dl></article><aside class="rent-box"><h2>${t.inquiry}</h2><p>${t.daily} <strong data-tool-price>–</strong></p><p>${t.nonBinding}</p><form class="rent-form" data-rental-form>${form}<input type="hidden" name="quantity" value="1" /><label class="field-inline"><span>${t.notes}</span><textarea name="notes" rows="3" maxlength="2000"></textarea></label><label class="consent"><input type="checkbox" name="rentalPrivacyConsent" required /><span>${t.ack} <a href="${privacy}">${t.privacy}</a>.</span></label><p data-availability-status role="status"></p><p data-pricing-summary role="status"></p><button class="btn-primary" type="submit">${t.send}</button></form><p data-rental-feedback role="status"></p></aside></div><h2>${t.related}</h2><div class="related-grid" data-related-tools></div></section>`,en?'/sortiment/produkt-hilti-sf-6-a22.html':'/en/catalog/product.html');
    await write(en?'en/catalog/request.html':'sortiment/reservierung.html',t.inquiry,`<article class="legal-card"><h1>${t.inquiry}</h1><p>${t.nonBinding}</p><p><a href="${catalog}">${t.backCatalog}</a></p></article>`,en?'/sortiment/reservierung.html':'/en/catalog/request.html','class="legal-main"');
    if(en) for(const [slug,title,content] of [['about-us',t.about,t.aboutContent],['forestry',t.forestry,t.forestryContent]]) await write(`en/${slug}/index.html`,title,`<article class="legal-card"><h1>${title}</h1>${content}</article>`,slug==='forestry'?'/forestry-work/':'/about-us/','class="legal-main"');
  }
}
