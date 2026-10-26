import { getAppConfig, getApiBase } from '../config/runtime.js';
import { t } from '../i18n/index.js';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function initContactForm() {
const contactForm = document.querySelector('[data-contact-form]');
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
      setContactStatus(statusNode, t('securityError'), 'is-error');
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
    const subject = String(formData.get('subject') || '').trim() || t('contactSubject');
    const message = String(formData.get('message') || '').trim();
    const honeypotValue = String(honeypotInput?.value || '').trim();
    const turnstileToken = String(tokenInput?.value || '').trim();

    if (!name || !EMAIL_PATTERN.test(email) || message.length < 10) {
      contactForm.reportValidity();
      setContactStatus(statusNode, t('invalidForm'), 'is-error');
      return;
    }

    if (!privacyConsent || !privacyConsent.checked) {
      setContactStatus(statusNode, t('privacy'), 'is-error');
      return;
    }

    if (turnstileSiteKey && !turnstileToken) {
      setContactStatus(statusNode, t('security'), 'is-error');
      return;
    }

    setContactStatus(statusNode, t('sending'), 'is-info');
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
        const errorMessage = t('failed');
        setContactStatus(statusNode, errorMessage, 'is-error');
        return;
      }

      setContactStatus(
        statusNode,
        t('contactSuccess'),
        'is-success',
      );

      contactForm.reset();
      if (tokenInput) tokenInput.value = '';
      if (window.turnstile && typeof window.turnstile.reset === 'function' && turnstileWidgetId != null) {
        window.turnstile.reset(turnstileWidgetId);
      }
    } catch (_error) {
      setContactStatus(statusNode, t('network'), 'is-error');
    } finally {
      if (submitButton instanceof HTMLButtonElement) submitButton.disabled = false;
    }
  });
};


setupContactForm();
}
