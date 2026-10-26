import { t } from '../i18n/index.js';
import { FALLBACK_IMAGE, toSafeImageSrc, toSafeProductLink, formatCurrency } from '../data/catalog-api.js';

export function productImage(image, name, {original = false} = {}) {
  const node = document.createElement('img');
  node.src = toSafeImageSrc(original ? image?.originalUrl || image?.url : image?.url);
  node.alt = image?.alternativeText || name || t('toolImage');
  node.width = 640; node.height = 480;
  node.loading = 'lazy'; node.decoding = 'async';
  node.addEventListener('error', () => {node.src = FALLBACK_IMAGE;}, {once: true});
  return node;
}

export function productCard(tool) {
  const card = document.createElement('article'); card.className = 'product-card shop-product-card';
  const href = toSafeProductLink(tool.slug);
  const picture = document.createElement('a'); picture.className = 'product-image-wrap'; picture.href = href;
  picture.append(productImage(tool.images[0], tool.name));
  if (!tool.images.length) {
    const note = document.createElement('span'); note.className = 'product-image-note'; note.textContent = t('imagePending'); picture.append(note);
  }
  const content = document.createElement('div'); content.className = 'product-content';
  const category = document.createElement('span'); category.className = 'product-category'; category.textContent = tool.category?.name || t('categoryFallback');
  const title = document.createElement('h3'), link = document.createElement('a'); link.href = href; link.textContent = tool.name; title.append(link);
  const description = document.createElement('p'); description.className = 'product-description'; description.textContent = tool.shortDescription || t('descriptionMissing');
  const availability = document.createElement('p'); availability.className = 'product-availability'; availability.textContent = tool.availabilityStatus === 'unavailable' ? t('productUnavailable') : t('onRequest');
  const footer = document.createElement('div'); footer.className = 'product-footer';
  const price = document.createElement('div'), label = document.createElement('small'), amount = document.createElement('strong');
  label.textContent = t('dailyFrom'); amount.textContent = formatCurrency(tool.dailyPrice); price.append(label, amount);
  const action = document.createElement('a'); action.className = 'product-cart'; action.href = href; action.textContent = '→'; action.setAttribute('aria-label', `${t('openProduct')}: ${tool.name}`);
  footer.append(price, action); content.append(category, title, description, availability, footer); card.append(picture, content);
  return card;
}
