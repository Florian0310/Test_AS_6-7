const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCALE_STORAGE_KEY = 'as_locale_pref_v1';
const LOCALE_AUTODETECT_KEY = 'as_locale_autodetect_done_v1';

const getAppConfig = () => window.APP_CONFIG || {};

const getApiBase = () => {
  const config = getAppConfig();
  const payloadUrl = String(config.PAYLOAD_URL || 'http://localhost:3001').replace(/\/$/, '');
  const apiPrefix = String(config.PAYLOAD_API_PREFIX || '/api');
  return `${payloadUrl}${apiPrefix.startsWith('/') ? apiPrefix : `/${apiPrefix}`}`;
};

const setupPage = () => {
  const safeStorageGet = (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch (_error) {
      return null;
    }
  };

  const safeStorageSet = (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch (_error) {
      // Ignore storage errors.
    }
  };

  const detectLocale = () => {
    const languages = Array.isArray(navigator.languages) ? navigator.languages : [navigator.language || ''];
    const normalized = languages
      .map((entry) => String(entry || '').toLowerCase())
      .filter(Boolean);

    const hasEnglish = normalized[0]?.startsWith('en');
    return hasEnglish ? 'en' : 'de';
  };

  const setLocalePreferenceFromPath = () => {
    const path = String(window.location.pathname || '').toLowerCase();
    if (path.startsWith('/en/')) {
      safeStorageSet(LOCALE_STORAGE_KEY, 'en');
      return;
    }

    if (document.body.classList.contains('home-page')) {
      safeStorageSet(LOCALE_STORAGE_KEY, 'de');
    }
  };

  const maybeRedirectLocale = () => {
    if (!document.body.classList.contains('home-page')) return;

    const currentPath = String(window.location.pathname || '');
    const normalizedPath = currentPath.toLowerCase();
    const isEnglishPath = normalizedPath.includes('/en/');
    const isRootLike = normalizedPath.endsWith('/index.html') || normalizedPath.endsWith('/');

    if (!isRootLike || isEnglishPath) return;

    const storedLocale = safeStorageGet(LOCALE_STORAGE_KEY);
    if (storedLocale === 'de') return;

    if (storedLocale === 'en') {
      const targetPath = normalizedPath.endsWith('/index.html')
        ? currentPath.replace(/\/index\.html$/i, '/en/index.html')
        : `${currentPath.replace(/\/$/, '')}/en/index.html`;

      window.location.replace(`${window.location.origin}${targetPath}${window.location.search}${window.location.hash}`);
      return;
    }

    if (safeStorageGet(LOCALE_AUTODETECT_KEY) === '1') return;

    const preferredLocale = detectLocale();
    safeStorageSet(LOCALE_AUTODETECT_KEY, '1');

    if (preferredLocale !== 'en') return;

    const targetPath = normalizedPath.endsWith('/index.html')
      ? currentPath.replace(/\/index\.html$/i, '/en/index.html')
      : `${currentPath.replace(/\/$/, '')}/en/index.html`;

    window.location.replace(`${window.location.origin}${targetPath}${window.location.search}${window.location.hash}`);
  };

  maybeRedirectLocale();
  setLocalePreferenceFromPath();

  const menu = document.querySelector('[data-nav-menu]');
  const openMenuBtn = document.querySelector('[data-open-menu]');
  const closeMenuBtn = document.querySelector('[data-close-menu]');
  const search = document.querySelector('[data-search]');
  const searchForm = document.querySelector('.search-form');
  const searchInput = document.querySelector('.search-input');
  const openSearchBtn = document.querySelector('[data-open-search]');
  const closeSearchBtn = document.querySelector('[data-close-search]');
  const dialogButtons = document.querySelectorAll('[data-open-dialog]');
  const dialogs = document.querySelectorAll('.dialog');
  const contactForm = document.querySelector('[data-contact-form]');
  const pageBody = document.body;
  const focusableSelector =
    'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  let activeDialog = null;
  let lastDialogTrigger = null;

  const getFocusableElements = (container) =>
    Array.from(container.querySelectorAll(focusableSelector)).filter((element) => {
      if (!(element instanceof HTMLElement)) return false;
      if (element.hidden || element.closest('[inert]') || !element.getClientRects().length) return false;
      return true;
    });

  const setBodyLock = () => {
    const menuOpen = Boolean(menu && menu.classList.contains('open'));
    const searchOpen = Boolean(search && search.classList.contains('active'));
    const dialogOpen = Array.from(dialogs).some((dialog) => dialog.classList.contains('active'));
    pageBody.classList.toggle('no-scroll', menuOpen || searchOpen || dialogOpen);
  };

  const setMenuState = (isOpen) => {
    if (!menu) return;
    const restore = menu.contains(document.activeElement);
    menu.classList.toggle('open', isOpen);
    const mobile = window.innerWidth <= 1023;
    menu.setAttribute('aria-hidden', String(mobile && !isOpen));
    menu.inert = mobile && !isOpen;
    if (mobile && isOpen) requestAnimationFrame(() => getFocusableElements(menu)[0]?.focus());
    if (openMenuBtn) {
      openMenuBtn.setAttribute('aria-expanded', String(isOpen));
    }
    if (!isOpen && restore) openMenuBtn?.focus();
    setBodyLock();
  };

  const setSearchState = (isOpen) => {
    if (!search) return;
    const restore = search.contains(document.activeElement);
    search.classList.toggle('active', isOpen);
    search.inert = !isOpen;
    if (!isOpen && restore) openSearchBtn?.focus();
    search.setAttribute('aria-hidden', String(!isOpen));
    if (openSearchBtn) {
      openSearchBtn.setAttribute('aria-expanded', String(isOpen));
    }
    if (isOpen && searchInput) {
      searchInput.focus();
    }
    setBodyLock();
  };

  const closeDialog = (dialog, restoreFocus = true) => {
    if (!dialog) return;
    dialog.classList.remove('active');
    dialog.setAttribute('aria-hidden', 'true');
    if (activeDialog === dialog) {
      activeDialog = null;
    }
    setBodyLock();

    if (restoreFocus && lastDialogTrigger instanceof HTMLElement && document.contains(lastDialogTrigger)) {
      lastDialogTrigger.focus();
      lastDialogTrigger = null;
    }
  };

  const closeAllDialogs = (restoreFocus = false) => {
    dialogs.forEach((dialog) => closeDialog(dialog, false));
    if (restoreFocus && lastDialogTrigger instanceof HTMLElement && document.contains(lastDialogTrigger)) {
      lastDialogTrigger.focus();
      lastDialogTrigger = null;
    }
  };

  const openDialog = (dialog, trigger) => {
    if (!dialog) return;
    closeAllDialogs(false);
    activeDialog = dialog;
    if (trigger instanceof HTMLElement) {
      lastDialogTrigger = trigger;
    }
    dialog.classList.add('active');
    dialog.setAttribute('aria-hidden', 'false');
    setBodyLock();

    const focusable = getFocusableElements(dialog);
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      dialog.focus();
    }
  };

  const trapFocusInDialog = (event) => {
    const container = activeDialog || (search?.classList.contains('active') ? search : null) || (menu?.classList.contains('open') ? menu : null);
    if (!container || event.key !== 'Tab') return;
    const focusable = getFocusableElements(container);
    if (!focusable.length) {
      event.preventDefault();
      container.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const setupThemeToggle = () => {
    const target = document.querySelector('.nav-actions') || document.querySelector('.legal-card');
    if (!target || !window.ASTheme) return;
    const label = document.createElement('label');
    label.className = 'theme-control';
    const text = document.createElement('span');
    text.className = 'sr-only';
    text.textContent = ASI18n.t('theme');
    const select = document.createElement('select');
    select.className = 'theme-toggle';
    select.dataset.themeToggle = '';
    for (const mode of ['auto','light','dark']) {
      const option = document.createElement('option');
      option.value = mode; option.textContent = ASI18n.t(mode); select.append(option);
    }
    select.value = ASTheme.getMode();
    select.addEventListener('change', () => ASTheme.setMode(select.value));
    document.addEventListener('as:theme', () => {select.value = ASTheme.getMode();});
    label.append(text, select); target.append(label);
  };

  const setupLocaleSwitch = () => {
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
    const isEnglish = ASI18n.locale === 'en';
    document.querySelectorAll('a[href]').forEach(link => {
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin) return;
      if (link.hasAttribute('data-locale-switch')) {
        const locale = link.dataset.localeSwitch;
        url.pathname = ASI18n.counterpart(location.pathname, locale);
        url.search = location.search; url.hash = location.hash;
        link.href = url.href;
        link.addEventListener('click', () => safeStorageSet(LOCALE_STORAGE_KEY, locale));
      } else if (isEnglish && !url.pathname.startsWith('/en/')) {
        const pair = ASI18n.routes.find(pair => pair[0] === url.pathname.replace(/index\.html$/, ''));
        if (pair) {url.pathname = pair[1]; link.href = url.href;}
      }
    });
    if (!document.querySelector('[data-locale-switch]')) {
      const link = document.createElement('a');
      link.href = ASI18n.counterpart(location.pathname, isEnglish ? 'de' : 'en') + location.search + location.hash;
      link.textContent = isEnglish ? 'Deutsch' : 'English';
      link.lang = isEnglish ? 'de' : 'en';
      link.dataset.localeSwitch = isEnglish ? 'de' : 'en';
      link.addEventListener('click', () => safeStorageSet(LOCALE_STORAGE_KEY, link.dataset.localeSwitch));
      (document.querySelector('.nav-actions') || document.querySelector('.legal-card'))?.append(link);
    }
  };

  const setContactStatus = (node, text, type = 'is-info') => {
    if (!node) return;
    node.textContent = text;
    node.classList.remove('is-info', 'is-success', 'is-error');
    node.classList.add(type);
  };

  let turnstileScriptPromise = null;

  const loadTurnstileScript = () => {
    if (turnstileScriptPromise) return turnstileScriptPromise;

    turnstileScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src^="https://challenges.cloudflare.com/turnstile/"]');
      if (existing) {
        if (window.turnstile) {
          resolve(true);
        } else {
          existing.addEventListener('load', () => resolve(true), { once: true });
          existing.addEventListener('error', () => reject(new Error('Turnstile konnte nicht geladen werden.')), {
            once: true,
          });
        }
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Turnstile konnte nicht geladen werden.'));
      document.head.appendChild(script);
    });

    return turnstileScriptPromise;
  };

  const setupContactForm = async () => {
    if (!contactForm) return;

    const statusNode = contactForm.querySelector('[data-contact-status]');
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const honeypotInput = contactForm.querySelector('input[name="website"]');
    const privacyConsent = contactForm.querySelector('input[name="privacy_consent"]');
    const tokenInput = contactForm.querySelector('input[name="turnstileToken"]');
    const turnstileContainer = contactForm.querySelector('[data-turnstile-container]');
    const locale = document.documentElement.lang && document.documentElement.lang.startsWith('en') ? 'en' : 'de';

    const turnstileSiteKey = String(getAppConfig().TURNSTILE_SITE_KEY || '').trim();
    let turnstileWidgetId = null;

    if (turnstileSiteKey && turnstileContainer) {
      try {
        await loadTurnstileScript();
        if (window.turnstile && typeof window.turnstile.render === 'function') {
          turnstileWidgetId = window.turnstile.render(turnstileContainer, {
            sitekey: turnstileSiteKey,
            callback: (token) => {
              if (tokenInput) tokenInput.value = token;
            },
            'expired-callback': () => {
              if (tokenInput) tokenInput.value = '';
            },
            'error-callback': () => {
              if (tokenInput) tokenInput.value = '';
            },
          });
        }
      } catch (_error) {
        setContactStatus(statusNode, ASI18n.t('securityError'), 'is-error');
      }
    }

    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(contactForm);
      const firstName = String(formData.get('first_name') || '').trim();
      const lastName = String(formData.get('last_name') || '').trim();
      const fallbackName = String(formData.get('name') || '').trim();
      const name = [firstName, lastName].filter(Boolean).join(' ') || fallbackName;
      const email = String(formData.get('email') || '').trim();
      const phone = String(formData.get('phone') || '').trim();
      const subject = String(formData.get('subject') || '').trim() || ASI18n.t('contactSubject');
      const message = String(formData.get('message') || '').trim();
      const honeypotValue = String(honeypotInput?.value || '').trim();
      const turnstileToken = String(tokenInput?.value || '').trim();

      if (!name || !EMAIL_PATTERN.test(email) || message.length < 10) {
        contactForm.reportValidity();
        setContactStatus(statusNode, ASI18n.t('invalidForm'), 'is-error');
        return;
      }

      if (!privacyConsent || !privacyConsent.checked) {
        setContactStatus(statusNode, ASI18n.t('privacy'), 'is-error');
        return;
      }

      if (turnstileSiteKey && !turnstileToken) {
        setContactStatus(statusNode, ASI18n.t('security'), 'is-error');
        return;
      }

      setContactStatus(statusNode, ASI18n.t('sending'), 'is-info');
      if (submitButton instanceof HTMLButtonElement) submitButton.disabled = true;

      try {
        const response = await fetch(`${getApiBase()}/public/contact`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({
            name,
            email,
            phone,
            subject,
            message,
            consentPrivacy: true,
            turnstileToken,
            website: honeypotValue,
            locale,
          }),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.success) {
          const errorMessage = ASI18n.t('failed');
          setContactStatus(statusNode, errorMessage, 'is-error');
          return;
        }

        setContactStatus(
          statusNode,
          locale === 'en' ? 'Thank you, your message has been sent.' : 'Vielen Dank. Ihre Nachricht wurde gesendet.',
          'is-success',
        );

        contactForm.reset();
        if (tokenInput) tokenInput.value = '';
        if (window.turnstile && typeof window.turnstile.reset === 'function' && turnstileWidgetId != null) {
          window.turnstile.reset(turnstileWidgetId);
        }
      } catch (_error) {
        setContactStatus(statusNode, ASI18n.t('network'), 'is-error');
      } finally {
        if (submitButton instanceof HTMLButtonElement) submitButton.disabled = false;
      }
    });
  };

  const hydrateSiteConfig = async () => {
    const targets = {
      legalName: document.querySelectorAll('[data-company-legal-name]'),
      brandName: document.querySelectorAll('[data-company-brand-name]'),
      address: document.querySelectorAll('[data-company-address]'),
      phone: document.querySelectorAll('[data-company-phone]'),
      email: document.querySelectorAll('[data-company-email]'),
    };

    const hasTargets =
      targets.legalName.length ||
      targets.brandName.length ||
      targets.address.length ||
      targets.phone.length ||
      targets.email.length;

    if (!hasTargets) return;

    try {
      window.ASSiteConfigPromise = window.ASSiteConfigPromise || fetch(`${getApiBase()}/public/site-config?locale=${ASI18n.locale}`, {
        headers: {
          Accept: 'application/json',
        },
      }).then(response => {if(!response.ok) throw new Error('config'); return response.json();});

      const payload = await window.ASSiteConfigPromise;
      const data = payload?.data;
      if (!data) return;

      const contact = data.contact || {};
      const legalName = String(contact.legalCompanyName || '').trim();
      const brandName = String(contact.brandName || '').trim();
      const phone = String(contact.phone || '').trim();
      const email = String(contact.email || '').trim();
      const address = [contact.street, contact.postalCode, contact.city, contact.country].filter(Boolean).join(', ');

      targets.legalName.forEach((node) => {
        node.textContent = legalName || node.textContent;
      });

      targets.brandName.forEach((node) => {
        node.textContent = brandName || node.textContent;
      });

      targets.address.forEach((node) => {
        node.textContent = address || node.textContent;
      });

      targets.phone.forEach((node) => {
        node.textContent = phone || node.textContent;
        if (node.tagName === 'A' && phone) {
          node.setAttribute('href', `tel:${phone.replace(/\s+/g, '')}`);
        }
      });

      targets.email.forEach((node) => {
        node.textContent = email || node.textContent;
        if (node.tagName === 'A' && email) {
          node.setAttribute('href', `mailto:${email}`);
        }
      });
    } catch (_error) {
      // Fallback: statische Inhalte bleiben sichtbar.
    }
  };

  if (menu) {
    if (!menu.id) {
      menu.id = 'site-navigation';
    }
    menu.setAttribute('aria-hidden', String(!menu.classList.contains('open')));
  }

  if (openMenuBtn && menu) {
    openMenuBtn.setAttribute('aria-controls', menu.id);
    openMenuBtn.setAttribute('aria-expanded', 'false');
    openMenuBtn.addEventListener('click', () => {
      closeAllDialogs(false);
      setSearchState(false);
      setMenuState(true);
    });
  }

  if (closeMenuBtn && menu) {
    closeMenuBtn.setAttribute('aria-controls', menu.id);
    closeMenuBtn.addEventListener('click', () => {
      setMenuState(false);
    });
  }

  document.querySelectorAll('.nav-link').forEach((link) => {
    if (link.classList.contains('active')) {
      link.setAttribute('aria-current', 'page');
    }

    link.addEventListener('click', () => {
      setMenuState(false);
    });
  });

  if (search) {
    if (!search.id) {
      search.id = 'site-search';
    }
    search.setAttribute('aria-hidden', String(!search.classList.contains('active')));
  }

  if (searchInput && !searchInput.hasAttribute('aria-label')) {
    searchInput.setAttribute('aria-label', document.documentElement.lang.startsWith('en') ? 'Search website' : 'Website durchsuchen');
  }

  if (openSearchBtn && search) {
    openSearchBtn.setAttribute('aria-controls', search.id);
    openSearchBtn.setAttribute('aria-expanded', 'false');
    openSearchBtn.addEventListener('click', () => {
      closeAllDialogs(false);
      setMenuState(false);
      setSearchState(true);
    });
  }

  if (closeSearchBtn && search) {
    closeSearchBtn.setAttribute('aria-controls', search.id);
    closeSearchBtn.addEventListener('click', () => {
      setSearchState(false);
    });
  }

  if (search) {
    search.addEventListener('click', (event) => {
      if (event.target === search) {
        setSearchState(false);
      }
    });
  }

  if (search && searchForm && searchInput) {
    search.setAttribute('role', 'dialog');
    search.setAttribute('aria-modal', 'true');
    search.setAttribute('aria-labelledby', 'search-title');
    const panel = document.createElement('div'); panel.className = 'search-panel';
    const heading = document.createElement('h2'); heading.id = 'search-title'; heading.textContent = ASI18n.t('searchTitle');
    const hint = document.createElement('p'); hint.id = 'search-hint'; hint.textContent = ASI18n.t('searchHint');
    const feedback = document.createElement('p'); feedback.className = 'search-feedback'; feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live','polite'); feedback.textContent = ASI18n.t('searchReady');
    const results = document.createElement('ul'); results.className = 'search-results';
    const browse = document.createElement('a'); browse.href = ASI18n.locale === 'en' ? '/en/catalog/' : '/sortiment/'; browse.textContent = ASI18n.t('catalog');
    searchInput.placeholder = ASI18n.t('searchPlaceholder');
    searchInput.setAttribute('aria-describedby', 'search-hint');
    closeSearchBtn?.setAttribute('aria-label', ASI18n.t('close'));
    panel.append(heading, hint, searchForm, feedback, results, browse);
    if (closeSearchBtn) panel.prepend(closeSearchBtn);
    search.append(panel);
    let timer, controller, sequence = 0;
    const runSearch = async () => {
      const query = searchInput.value.trim(); const id = ++sequence;
      controller?.abort(); results.replaceChildren();
      if (!query) {feedback.textContent = ASI18n.t('searchReady'); return;}
      controller = new AbortController();
      feedback.textContent = ASI18n.t('searchLoading');
      try {
        const response = await fetch(`${getApiBase()}/catalog/products?search=${encodeURIComponent(query)}&locale=${ASI18n.locale}&limit=12`, {signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)])});
        if (!response.ok) throw new Error('search');
        const data = await response.json();
        if (id !== sequence) return;
        for (const product of (data.data || []).slice(0,12)) {
          const li = document.createElement('li'); const link = document.createElement('a');
          link.href = `${ASI18n.locale === 'en' ? '/en/catalog/product.html' : '/sortiment/produkt-hilti-sf-6-a22.html'}?slug=${encodeURIComponent(product.slug)}`;
          const title = document.createElement('strong'); title.textContent = product.title;
          const category = document.createElement('small'); category.textContent = product.category?.name || '';
          link.append(title, category); li.append(link); results.append(li);
        }
        feedback.textContent = results.children.length ? `${data.total || results.children.length} ${ASI18n.t('searchCount')}` : ASI18n.t('searchEmpty');
      } catch (error) {
        if (id === sequence && error.name !== 'AbortError') feedback.textContent = ASI18n.t('searchError');
      }
    };
    searchInput.addEventListener('input', () => {clearTimeout(timer); timer = setTimeout(runSearch, 180);});
    searchForm.addEventListener('submit', event => {event.preventDefault(); const first = results.querySelector('a'); if (first) first.click(); else {clearTimeout(timer); runSearch();}});
    search.addEventListener('keydown', event => {
      if (!['ArrowDown','ArrowUp'].includes(event.key)) return;
      const links = [...results.querySelectorAll('a')]; if (!links.length) return;
      event.preventDefault(); const index = links.indexOf(document.activeElement);
      links[(index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length].focus();
    });
  }

  dialogs.forEach((dialog, index) => {
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-hidden', String(!dialog.classList.contains('active')));
    dialog.setAttribute('tabindex', '-1');

    const title = dialog.querySelector('h1, h2, h3, h4, h5, h6');
    if (title) {
      if (!title.id) {
        title.id = `dialog-title-${index + 1}`;
      }
      dialog.setAttribute('aria-labelledby', title.id);
    } else {
      dialog.setAttribute('aria-label', `Dialog ${index + 1}`);
    }
  });

  document.querySelectorAll('i[class^="ri-"], i[class*=" ri-"]').forEach((icon) => {
    icon.setAttribute('aria-hidden', 'true');
  });

  dialogButtons.forEach((button) => {
    const targetId = button.getAttribute('data-open-dialog');
    if (!targetId) return;
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', targetId);

    button.addEventListener('click', () => {
      const target = document.getElementById(targetId);
      if (!target) return;
      setMenuState(false);
      setSearchState(false);
      openDialog(target, button);
    });
  });

  dialogs.forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        closeDialog(dialog, true);
      }
    });
  });

  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => {
      const dialog = button.closest('.dialog');
      closeDialog(dialog, true);
    });
  });

  document.addEventListener('keydown', (event) => {
    trapFocusInDialog(event);

    if (event.key !== 'Escape') return;

    if (activeDialog) {
      closeDialog(activeDialog, true);
      return;
    }

    if (menu && menu.classList.contains('open')) {
      setMenuState(false);
    }
    if (search && search.classList.contains('active')) {
      setSearchState(false);
    }
  });

  window.addEventListener('resize', () => {
    if (menu) setMenuState(window.innerWidth > 1023 ? false : menu.classList.contains('open'));
  });

  setupThemeToggle();
  setupLocaleSwitch();
  setupContactForm();
  hydrateSiteConfig();

  setMenuState(Boolean(menu && menu.classList.contains('open')));
  setSearchState(Boolean(search && search.classList.contains('active')));
  setBodyLock();
};

document.addEventListener('DOMContentLoaded', setupPage);
