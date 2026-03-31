(function () {
  const STORAGE_KEY = 'as_cookie_consent_v1';
  const APP_CONFIG = window.APP_CONFIG || {};
  const dataLayer = (window.dataLayer = window.dataLayer || []);

  const TEXT = {
    de: {
      title: 'Cookie-Einstellungen',
      text:
        'Wir verwenden notwendige Cookies fuer den Betrieb der Website. Analytics wird erst nach Ihrer Einwilligung geladen.',
      necessary: 'Notwendig',
      analytics: 'Analytics',
      acceptAll: 'Alle akzeptieren',
      acceptNecessary: 'Nur notwendige',
      settings: 'Einstellungen',
      save: 'Auswahl speichern',
      revoke: 'Einwilligung widerrufen',
      provider: 'Anbieter',
      purpose: 'Zweck',
      duration: 'Speicherdauer',
      changed: 'Cookie-Einwilligung aktualisiert.',
    },
    en: {
      title: 'Cookie Settings',
      text:
        'We use necessary cookies to operate the website. Analytics is only loaded after your consent.',
      necessary: 'Necessary',
      analytics: 'Analytics',
      acceptAll: 'Accept all',
      acceptNecessary: 'Necessary only',
      settings: 'Settings',
      save: 'Save choices',
      revoke: 'Withdraw consent',
      provider: 'Provider',
      purpose: 'Purpose',
      duration: 'Storage duration',
      changed: 'Cookie consent updated.',
    },
  };

  const toLocale = () =>
    document.documentElement.lang && document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'de';

  const i18n = () => TEXT[toLocale()];

  const parse = (value) => {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch (_error) {
      return null;
    }
  };

  const nowIso = () => new Date().toISOString();

  const getStoredConsent = () => {
    let fromStorage = null;
    try {
      fromStorage = parse(window.localStorage.getItem(STORAGE_KEY));
    } catch (_error) {
      fromStorage = null;
    }
    if (!fromStorage) return null;

    return {
      necessary: true,
      analytics: Boolean(fromStorage.analytics),
      updatedAt: fromStorage.updatedAt || nowIso(),
      source: 'stored',
    };
  };

  const storeConsent = (state) => {
    const payload = {
      necessary: true,
      analytics: Boolean(state.analytics),
      updatedAt: nowIso(),
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_error) {
      // If storage is blocked, consent still applies for current session.
    }
    return payload;
  };

  const gtag = function () {
    dataLayer.push(arguments);
  };

  let analyticsLoaded = false;

  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error(`Script konnte nicht geladen werden: ${src}`));
      document.head.appendChild(script);
    });

  const loadAnalytics = async () => {
    if (analyticsLoaded) return;

    const gtmId = String(APP_CONFIG.GTM_ID || '').trim();
    const ga4Id = String(APP_CONFIG.GA4_MEASUREMENT_ID || '').trim();

    if (!gtmId && !ga4Id) {
      analyticsLoaded = true;
      return;
    }

    if (gtmId) {
      const gtmSrc = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
      await loadScript(gtmSrc);
      dataLayer.push({ event: 'gtm.js', 'gtm.start': Date.now() });
    }

    if (ga4Id) {
      const gaSrc = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`;
      await loadScript(gaSrc);

      gtag('js', new Date());
      gtag('config', ga4Id, {
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    }

    analyticsLoaded = true;
  };

  const applyConsentMode = async (state) => {
    gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted',
      wait_for_update: 500,
    });

    const analytics = state && state.analytics;

    gtag('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted',
    });

    if (analytics) {
      try {
        await loadAnalytics();
      } catch (_error) {
        // Fail-safe: Seite bleibt ohne Tracking nutzbar.
      }
    }

    document.dispatchEvent(
      new CustomEvent('as:consent-updated', {
        detail: {
          necessary: true,
          analytics: Boolean(analytics),
        },
      }),
    );
  };

  const removeBanner = () => {
    const existing = document.querySelector('[data-consent-banner]');
    if (existing) {
      existing.remove();
    }
  };

  const consentPath = () => (toLocale() === 'en' ? '/en/cookie-settings/' : '/cookie-einstellungen/');

  const createBanner = () => {
    if (document.querySelector('[data-consent-banner]')) return;

    const t = i18n();

    const banner = document.createElement('aside');
    banner.className = 'cookie-banner';
    banner.setAttribute('data-consent-banner', 'true');
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', t.title);

    banner.innerHTML =
      '<div class="cookie-banner__content">' +
      `<h2>${t.title}</h2>` +
      `<p>${t.text}</p>` +
      '<div class="cookie-banner__actions">' +
      `<button type="button" class="btn-primary" data-consent-accept-all>${t.acceptAll}</button>` +
      `<button type="button" class="btn-secondary" data-consent-accept-necessary>${t.acceptNecessary}</button>` +
      `<a class="btn-secondary" href="${consentPath()}">${t.settings}</a>` +
      '</div>' +
      '</div>';

    document.body.appendChild(banner);

    const acceptAll = banner.querySelector('[data-consent-accept-all]');
    const acceptNecessary = banner.querySelector('[data-consent-accept-necessary]');

    acceptAll?.addEventListener('click', async () => {
      const saved = storeConsent({ analytics: true });
      await applyConsentMode(saved);
      removeBanner();
    });

    acceptNecessary?.addEventListener('click', async () => {
      const saved = storeConsent({ analytics: false });
      await applyConsentMode(saved);
      removeBanner();
    });
  };

  const bindConsentSettingsForm = () => {
    const form = document.querySelector('[data-consent-settings-form]');
    if (!form) return;

    const analyticsCheckbox = form.querySelector('[data-consent-analytics]');
    const saveButton = form.querySelector('[data-consent-save]');
    const revokeButton = form.querySelector('[data-consent-revoke]');
    const statusNode = form.querySelector('[data-consent-status]');

    const current = getStoredConsent();
    if (analyticsCheckbox) {
      analyticsCheckbox.checked = Boolean(current?.analytics);
    }

    const setStatus = (text) => {
      if (!statusNode) return;
      statusNode.textContent = text;
    };

    saveButton?.addEventListener('click', async () => {
      const saved = storeConsent({ analytics: Boolean(analyticsCheckbox?.checked) });
      await applyConsentMode(saved);
      setStatus(i18n().changed);
    });

    revokeButton?.addEventListener('click', async () => {
      const saved = storeConsent({ analytics: false });
      if (analyticsCheckbox) analyticsCheckbox.checked = false;
      await applyConsentMode(saved);
      setStatus(i18n().changed);
    });
  };

  const init = async () => {
    const current = getStoredConsent();

    if (current) {
      await applyConsentMode(current);
    } else {
      await applyConsentMode({ analytics: false });
      createBanner();
    }

    bindConsentSettingsForm();
  };

  window.ASConsent = {
    getState: getStoredConsent,
    update: async (analyticsEnabled) => {
      const saved = storeConsent({ analytics: Boolean(analyticsEnabled) });
      await applyConsentMode(saved);
      removeBanner();
      return saved;
    },
    reset: async () => {
      const saved = storeConsent({ analytics: false });
      await applyConsentMode(saved);
      return saved;
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
