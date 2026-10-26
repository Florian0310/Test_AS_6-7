import { RentalApi, appendEmptyState } from '../data/catalog-api.js';
import { isEnglish, t } from '../i18n/index.js';
import { productCard } from '../components/product-card.js';

export async function initHome() {
  const grid = document.querySelector('[data-popular-grid]');
  if (!grid) return;
  grid.setAttribute('aria-busy', 'true');
  try {
    const settings = await RentalApi.getSiteSettings();
    const homepage = settings.homepage || {};
    for (const [selector, value] of [
      ['[data-site-hero-headline]', !isEnglish && settings.heroHeadline],
      ['[data-site-hero-text]', !isEnglish && settings.heroText],
      ['[data-popular-title]', isEnglish ? homepage.popularSectionTitleEn : homepage.popularSectionTitleDe],
      ['[data-popular-subtitle]', isEnglish ? homepage.popularSectionSubtitleEn : homepage.popularSectionSubtitleDe],
    ]) if (value) {const node = document.querySelector(selector); if (node) node.textContent = value;}
    const tools = homepage.popularProducts?.length ? homepage.popularProducts : (await RentalApi.getToolPage({limit: 3})).tools;
    grid.replaceChildren(...tools.slice(0, 3).map(productCard));
    if (!tools.length) appendEmptyState(grid, t('popularEmpty'));
  } catch {appendEmptyState(grid, t('productsLoadError'));}
  finally {grid.setAttribute('aria-busy', 'false');}
}
