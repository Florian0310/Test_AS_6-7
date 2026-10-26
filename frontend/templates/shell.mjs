import { site } from '../src/config/site.js';
import { counterpart, canonicalPath, catalogPath } from '../src/config/routes.js';
import fs from 'node:fs/promises';
export const translations = Object.fromEntries(await Promise.all(['de', 'en'].map(async locale => [locale, JSON.parse(await fs.readFile(new URL(`../locales/${locale}.json`,import.meta.url), 'utf8'))])));
export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
export function brand(footer = false) {
  return `<span class="brand-text"><strong>${escape(site.name.toUpperCase())}</strong><small${footer ? ' data-company-legal-name' : ''}>${escape(site.operator.toUpperCase())}</small></span>`;
}
export function header(locale, path = '/') {
  const t = translations[locale], en = locale === 'en', home = en ? '/en/' : '/';
  const links = [[catalogPath(locale), t.catalog], [en ? '/en/forestry/' : '/forestry-work/', t.forestry], [en ? '/en/about-us/' : '/about-us/', t.about], [en ? '/en/contact/' : '/contact/', t.contact]];
  return `<header class="header" data-site-header>
  <nav class="nav container" aria-label="${en ? 'Main navigation' : 'Hauptnavigation'}">
    <a class="brand-logo" href="${home}">${brand()}</a>
    <div class="nav-menu" id="site-navigation" data-nav-menu>
      <ul class="nav-list">${links.map(([href, label]) => `<li><a class="nav-link${canonicalPath(path) === href ? ' active' : ''}" href="${href}"${canonicalPath(path) === href ? ' aria-current="page"' : ''}>${escape(label)}</a></li>`).join('')}</ul>
      <button class="icon-btn nav-close" data-close-menu type="button" aria-label="${t.closeMenu}"><i class="ri-close-line" aria-hidden="true"></i></button>
    </div>
    <div class="nav-actions">
      <a class="icon-btn" data-catalog-search-link href="${catalogPath(locale)}?focus=search" aria-label="${escape(t.ui.headerSearch)}"><i class="ri-search-line" aria-hidden="true"></i></a>
      <a class="locale-switch" data-locale-switch="${en ? 'de' : 'en'}" href="${counterpart(path, en ? 'de' : 'en')}" lang="${en ? 'de-AT' : 'en'}" aria-label="${en ? 'Auf Deutsch wechseln' : 'Switch to English'}">${en ? 'DE' : 'EN'}</a>
      <button class="icon-btn nav-menu-toggle" data-open-menu type="button" aria-label="${t.openMenu}" aria-controls="site-navigation" aria-expanded="false"><i class="ri-menu-line" aria-hidden="true"></i></button>
    </div>
  </nav>
</header>`;
}
export function footer(locale) {
  const t = translations[locale], en = locale === 'en';
  const legal = [['impressum', 'imprint'], ['datenschutz', 'privacy-policy'], ['cookie-richtlinie', 'cookie-policy'], ['barrierefreiheit', 'accessibility-statement'], ['cookie-einstellungen', 'cookie-settings'], ['bildnachweise', 'image-credits']];
  return `<footer class="footer" data-site-footer>
  <div class="container">
    <div class="footer-grid">
      <div class="footer-col"><a class="brand-logo brand-logo--footer" href="${en ? '/en/' : '/'}">${brand(true)}</a><p class="footer-brand-text">${escape(t.ui.footerIntro)}</p></div>
      <div class="footer-col"><h2>${escape(t.ui.service)}</h2><ul class="footer-list">
        <li><a href="${catalogPath(locale)}">${t.catalog}</a></li><li><a href="${en ? '/en/' : '/'}#rentInstructions">${escape(t.ui.howItWorks)}</a></li><li><a href="${en ? '/en/forestry/' : '/forestry-work/'}">${t.forestry}</a></li><li><a href="${en ? '/en/contact/' : '/contact/'}">${t.contact}</a></li>
      </ul></div>
      <div class="footer-col"><h2>${escape(t.ui.legal)}</h2><ul class="footer-list">${legal.map(([de, english], index) => `<li><a href="${en ? '/en/' + english : '/' + de}/">${t.legalTitles[index]}</a></li>`).join('')}</ul></div>
      <div class="footer-col"><h2>${t.contact}</h2><address><ul class="footer-list">
        <li data-company-legal-name>${escape(site.operator)}</li><li data-company-address>${escape(site.street)}, ${escape(site.postalCode)} ${escape(site.city)}</li>
        <li><a href="tel:${site.phone.replace(/\s/g, '')}" data-company-phone>${escape(site.phone)}</a></li><li><a href="mailto:${site.email}" data-company-email>${escape(site.email)}</a></li>
      </ul></address></div>
    </div>
    <div class="footer-bottom"><p>© 2026 ${escape(site.name)} · ${escape(site.operator)}</p></div>
  </div>
</footer>`;
}
export function documentPage({locale, path, title, description, content, mainAttributes = ''}) {
  const t = translations[locale];
  return `<!doctype html>
<html lang="${locale === 'en' ? 'en' : 'de-AT'}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escape(title)} | ${escape(site.name)}</title>
  <meta name="description" content="${escape(description || `${title} – ${t.description}`)}" />
  <link rel="canonical" href="${site.origin}${path}" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/assets/vendor/icons.css" />
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
<a class="skip-link" href="#main-content">${t.skip}</a>
${header(locale, path)}
<main id="main-content" ${mainAttributes}>
${content}
</main>
${footer(locale)}
</body>
</html>
`;
}
