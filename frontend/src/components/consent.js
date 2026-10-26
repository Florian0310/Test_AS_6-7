import { messagesFor } from '../i18n/index.js';
import { getAppConfig } from '../config/runtime.js';

export function initConsent() {
  const KEY = 'as_cookie_consent_v2', LEGACY = 'as_cookie_consent_v1';
  const MAX_AGE = 180 * 86400000;
  const en = document.documentElement.lang.startsWith('en');
  const t = messagesFor('consent');
  const config = getAppConfig();
  const gaID = /^G-[A-Z0-9]+$/.test(config.GA4_MEASUREMENT_ID || '') ? config.GA4_MEASUREMENT_ID : '';
  const gtmID = /^GTM-[A-Z0-9]+$/.test(config.GTM_ID || '') ? config.GTM_ID : '';
  const dataLayer = window.dataLayer = window.dataLayer || [];
  const gtag = function () {dataLayer.push(arguments);};
  const read = () => {
    try {
      const value = JSON.parse(localStorage.getItem(KEY));
      if (value?.version !== 2 || typeof value.analytics !== 'boolean' || !Number.isFinite(Date.parse(value.updatedAt))) return null;
      const age = Date.now() - Date.parse(value.updatedAt);
      if (age < 0 || age >= MAX_AGE) {localStorage.removeItem(KEY); return null;}
      return value;
    } catch (_) {return null;}
  };
  // Old grants require a new informed choice. Never coerce strings such as "false" to a grant.
  let state = read();
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY));
    if (!state && legacy?.analytics === false) {
      state = {version:2, necessary:true, analytics:false, updatedAt:new Date().toISOString()};
      localStorage.setItem(KEY,JSON.stringify(state));
    }
    localStorage.removeItem(LEGACY);
  } catch (_) {}
  let loaded = false, loading = null, persistent = true;
  const denied = {analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'};
  gtag('consent','default',denied);
  const sync = () => {
    document.querySelectorAll('[data-consent-analytics]').forEach(input => {input.checked = state?.analytics === true;});
    document.dispatchEvent(new CustomEvent('as:consent-updated',{detail:{necessary:true,analytics:state?.analytics === true}}));
  };
  const load = src => new Promise((resolve,reject) => {
    const script = document.createElement('script'); script.async = true; script.src = src;
    script.dataset.optionalAnalytics = ''; script.onload = resolve; script.onerror = reject; document.head.append(script);
  });
  const apply = () => {
    window[`ga-disable-${gaID}`] = state?.analytics !== true;
    if (state?.analytics !== true) return;
    gtag('consent','update',{...denied,analytics_storage:'granted'});
    if (loaded || loading || (!gaID && !gtmID)) return;
    // Configure GA directly OR through GTM, avoiding duplicate page views.
    loaded = true;
    loading = (async () => {
      if (gtmID) {
        dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});
        await load(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmID)}`);
      } else if (gaID) {
        await load(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaID)}`);
        if (state?.analytics !== true) return;
        gtag('js',new Date());
        gtag('config',gaID,{allow_google_signals:false,allow_ad_personalization_signals:false});
      }
    })().catch(()=>{});
  };
  const clearAnalyticsCookies = () => {
    const domains = [null,location.hostname], parts = location.hostname.split('.');
    for (let i=0;i<parts.length-1;i++) domains.push('.'+parts.slice(i).join('.'));
    const paths = ['/'], segments = location.pathname.split('/').filter(Boolean);
    for (let i=1;i<=segments.length;i++) paths.push('/'+segments.slice(0,i).join('/'));
    for (const entry of document.cookie.split(';')) {
      const name = entry.split('=')[0].trim();
      if (!/^(_ga|_gid|_gat|_gcl_)/.test(name)) continue;
      for (const domain of domains) for (const path of paths) document.cookie = `${name}=; Max-Age=0; path=${path}${domain ? '; domain='+domain : ''}; SameSite=Lax`;
    }
  };
  const update = analytics => {
    const mustReload = loaded && !analytics;
    state = {version:2,necessary:true,analytics:analytics === true,updatedAt:new Date().toISOString()};
    try {localStorage.setItem(KEY,JSON.stringify(state));} catch (_) {persistent = false;}
    document.querySelector('[data-consent-banner]')?.remove(); sync();
    if (!state.analytics) {window[`ga-disable-${gaID}`] = true; clearAnalyticsCookies();}
    if (mustReload) {
      // A fresh document is required to stop listeners and timers of already loaded trackers.
      try {sessionStorage.setItem('as_consent_confirmation',t.revoked);} catch (_) {}
      location.reload(); return state;
    }
    apply(); return state;
  };
  const settingsPath = en ? '/en/cookie-settings/' : '/cookie-einstellungen/';
  const init = () => {
    const form = document.querySelector('[data-consent-settings-form]');
    if (!state && !form) {
      const banner=document.createElement('aside'); banner.className='cookie-banner'; banner.dataset.consentBanner=''; banner.setAttribute('aria-label',t.title);
      const content=document.createElement('div'); content.className='cookie-banner__content';
      const title=document.createElement('h2'); title.textContent=t.title;
      const text=document.createElement('p'); text.textContent=t.text;
      const actions=document.createElement('div'); actions.className='cookie-banner__actions';
      for (const [name,grant] of [[t.accept,true],[t.reject,false]]) {
        const button=document.createElement('button'); button.type='button'; button.className='btn-secondary'; button.textContent=name;
        button.setAttribute(grant?'data-consent-accept-all':'data-consent-accept-necessary','');
        button.addEventListener('click',()=>update(grant)); actions.append(button);
      }
      const settings=document.createElement('a'); settings.href=settingsPath; settings.className='btn-secondary'; settings.textContent=t.settings;
      actions.append(settings); content.append(title,text,actions); banner.append(content); document.body.append(banner);
    }
    if (form) {
      const status=form.querySelector('[data-consent-status]'), checkbox=form.querySelector('[data-consent-analytics]');
      form.querySelector('input[disabled]')?.setAttribute('aria-label',t.necessary);
      checkbox?.setAttribute('aria-label',t.analytics);
      const commit=analytics=>{update(analytics); if(status) status.textContent = (analytics ? t.saved : t.revoked) + (persistent?'':' '+t.storage);};
      form.addEventListener('submit',e=>{e.preventDefault(); commit(checkbox?.checked===true);});
      form.querySelector('[data-consent-save]')?.addEventListener('click',()=>commit(checkbox?.checked===true));
      form.querySelector('[data-consent-revoke]')?.addEventListener('click',()=>commit(false));
      const back=document.createElement('a'); back.className='consent-back'; back.textContent=t.back; back.href=en?'/en/':'/';
      try {
        const previous=new URL(sessionStorage.getItem('as_consent_return')||'',location.href);
        if (previous.origin===location.origin && !previous.pathname.includes('cookie-')) back.href=previous.href;
        const confirmation=sessionStorage.getItem('as_consent_confirmation');
        if (confirmation && status) {status.textContent=confirmation; sessionStorage.removeItem('as_consent_confirmation');}
      } catch (_) {}
      form.append(back);
    }
    sync(); apply();
    document.addEventListener('click',e=>{
      const link=e.target.closest('a[href]'); if (!link) return;
      if (new URL(link.href,location.href).pathname.replace(/index\.html$/,'')===settingsPath && !form) {
        try {sessionStorage.setItem('as_consent_return',location.href);} catch (_) {}
      }
    });
  };
  window.addEventListener('storage',e=>{
    if (e.key!==KEY && e.key!==null) return;
    const previous=state; state=read();
    if (loaded && !state?.analytics) {clearAnalyticsCookies(); location.reload(); return;}
    sync(); apply(); if (!state && previous) location.reload();
  });
  window.ASConsent={getState:()=>state,update:enabled=>update(enabled===true),reset:()=>update(false)};
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
}
