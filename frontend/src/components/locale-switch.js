import { locale } from '../i18n/index.js';
import { counterpart, routePairs } from '../config/routes.js';
import { safeStorageSet, safeStorageGet } from '../lib/storage.js';
const LOCALE_STORAGE_KEY = 'as_locale_pref_v1';

export const initLocale = () => {
  // Only the German entry route auto-detects; explicit inner routes stay shareable.
  if (location.pathname === '/' || location.pathname === '/index.html') {
    const preference = safeStorageGet(LOCALE_STORAGE_KEY);
    const target = preference || ((navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'de');
    if (target === 'en') {location.replace('/en/' + location.search + location.hash); return;}
  }
  const forms = [...document.querySelectorAll('[data-contact-form], [data-rental-form]')];
  try {
    const draft = JSON.parse(sessionStorage.getItem('as_locale_form_draft'));
    sessionStorage.removeItem('as_locale_form_draft');
    if (draft && Date.now() - draft.time < 600000 && draft.path === location.pathname) {
      for(const entry of draft.forms || []) {
        const form = document.querySelector(entry.selector);
        for(const [name,value] of Object.entries(entry.values)) {
          const input = form?.elements.namedItem(name);
          if (!input || input.type === 'password') continue;
          if (input.type === 'checkbox') input.checked = value === true; else input.value = value;
        }
      }
    }
  } catch (_) {}
  document.addEventListener('click', event => {
    const link = event.target.closest('[data-locale-switch]'); if(!link || !forms.length) return;
    const draft = {time: Date.now(),path:new URL(link.href).pathname,forms:forms.map(form => ({
      selector:form.hasAttribute('data-contact-form') ? '[data-contact-form]' : '[data-rental-form]',
      values:Object.fromEntries([...form.elements].filter(input => input.name && !['password','hidden','submit'].includes(input.type) && input.name !== 'website').map(input => [input.name,input.type === 'checkbox' ? input.checked : input.value])),
    }))};
    try {sessionStorage.setItem('as_locale_form_draft',JSON.stringify(draft));} catch (_) {}
  });
  const isEnglish = locale === 'en';
  document.querySelectorAll('a[href]').forEach(link => {
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    if (link.hasAttribute('data-locale-switch')) {
      const locale = link.dataset.localeSwitch;
      url.pathname = counterpart(location.pathname, locale);
      url.search = location.search; url.hash = location.hash;
      link.href = url.href;
      link.addEventListener('click', () => safeStorageSet(LOCALE_STORAGE_KEY, locale));
    } else if (isEnglish && !url.pathname.startsWith('/en/')) {
      const pair = routePairs.find(pair => pair[0] === url.pathname.replace(/index\.html$/, ''));
      if (pair) {url.pathname = pair[1]; link.href = url.href;}
    }
  });
};
