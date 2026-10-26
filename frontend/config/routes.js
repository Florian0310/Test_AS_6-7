export const routePairs = [
  ['/', '/en/'],
  ['/sortiment/', '/en/catalog/'],
  ['/sortiment/produkt-hilti-sf-6-a22.html', '/en/catalog/product.html'],
  ['/about-us/', '/en/about-us/'],
  ['/forestry-work/', '/en/forestry/'],
  ['/contact/', '/en/contact/'],
  ['/impressum/', '/en/imprint/'],
  ['/datenschutz/', '/en/privacy-policy/'],
  ['/cookie-einstellungen/', '/en/cookie-settings/'],
  ['/cookie-richtlinie/', '/en/cookie-policy/'],
  ['/barrierefreiheit/', '/en/accessibility-statement/'],
  ['/bildnachweise/', '/en/image-credits/'],
  ['/sortiment/reservierung.html', '/en/catalog/request.html'],
];
export const canonicalPath = path => path.replace(/index\.html$/, '');
export const counterpart = (path, locale) => {
  const pair = routePairs.find(pair => pair.includes(canonicalPath(path)));
  return pair ? pair[locale === 'en' ? 1 : 0] : locale === 'en' ? '/en/' : '/';
};
export const catalogPath = locale => locale === 'en' ? '/en/catalog/' : '/sortiment/';
export const productPath = (slug, locale) => `${locale === 'en' ? '/en/catalog/product.html' : '/sortiment/produkt-hilti-sf-6-a22.html'}?slug=${encodeURIComponent(slug)}`;
