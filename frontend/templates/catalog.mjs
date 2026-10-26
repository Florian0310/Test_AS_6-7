import fs from 'node:fs/promises';
import { translations, documentPage, escape } from './shell.mjs';
export async function buildCatalogPages() {
  for (const locale of ['de', 'en']) {
    const content = translations[locale], t = content.ui, en = locale === 'en';
    const path = en ? '/en/catalog/' : '/sortiment/';
    const html = documentPage({locale, path, title: en ? 'Tools & equipment' : 'Werkzeuge & Geräte', description: t.catalogIntro, mainAttributes: 'class="shop-main" data-shop-page', content: `
  <section class="container shop-head">
    <nav class="shop-breadcrumb" aria-label="${en ? 'Breadcrumb' : 'Brotkrumennavigation'}"><a href="${en ? '/en/' : '/'}">${content.home}</a><span aria-hidden="true">/</span><span>${content.catalog}</span></nav>
    <h1 data-shop-headline>${en ? 'Tools & equipment' : 'Werkzeuge & Geräte'}</h1>
    <p data-shop-intro>${escape(t.catalogIntro)}</p>
    <form class="shop-search-form" data-tools-search-form role="search">
      <label class="sr-only" for="catalog-search">${t.searchLabel}</label>
      <div class="search-field"><input id="catalog-search" type="search" name="search" maxlength="120" placeholder="${t.searchPlaceholder}" data-tools-search /><button class="icon-btn" type="button" data-clear-search aria-label="${t.clearSearch}" hidden>×</button></div>
      <button type="submit" class="btn-filter">${en ? 'Search' : 'Suchen'}</button>
    </form>
  </section>
  <section class="container shop-layout">
    <aside class="shop-categories" aria-labelledby="categories-heading"><h2 id="categories-heading" data-shop-categories-title>${t.filtersTitle}</h2><p data-category-feedback role="status"></p><ul data-categories-list></ul></aside>
    <div class="catalog-results">
      <div class="catalog-toolbar"><p data-result-count role="status" aria-live="polite"></p><label class="catalog-sort"><span>${t.sortLabel}</span><select data-tools-sort><option value="name">${t.sortName}</option><option value="price-asc">${t.sortLow}</option><option value="price-desc">${t.sortHigh}</option></select></label><button class="btn-filter" type="button" data-reset-filter>${t.resetFilters}</button></div>
      <div class="active-filters" data-active-filters aria-label="${en ? 'Active filters' : 'Aktive Filter'}" hidden></div>
      <h2 class="sr-only" data-shop-products-title>${t.productsLabel}</h2>
      <p class="shop-feedback" data-shop-feedback role="status" aria-live="polite">${t.loadingTools}</p><button class="btn-filter" data-catalog-retry type="button" hidden>${t.retry}</button>
      <div class="shop-products-grid" data-tools-grid aria-busy="true"></div>
      <nav class="catalog-pagination" data-pagination aria-label="${en ? 'Product pages' : 'Produktseiten'}" hidden><button class="btn-filter" type="button" data-page-previous>${t.previous}</button><span data-page-label></span><button class="btn-filter" type="button" data-page-next>${t.next}</button></nav>
    </div>
  </section>`});
    await fs.writeFile(new URL(`../../dist${path}index.html`,import.meta.url), html);
  }
}
