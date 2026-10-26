import { initNavigation } from './components/navigation.js';
import { initLocale } from './components/locale-switch.js';
import { initConsent } from './components/consent.js';
import { hydrateSiteContact } from './components/site-contact.js';

function init() {
  initNavigation(); initLocale(); initConsent(); void hydrateSiteContact();
  if (document.querySelector('[data-shop-page]')) void import('./pages/catalog.js').then(module => module.initCatalog());
  if (document.querySelector('[data-tool-page]')) void import('./pages/product.js').then(module => module.renderToolDetailPage());
  if (document.body.classList.contains('home-page')) void import('./pages/home.js').then(module => module.initHome());
  if (document.querySelector('[data-contact-form]')) void import('./components/contact-form.js').then(module => module.initContactForm());
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true}); else init();
