import { getAppConfig, getApiBase } from '../config/runtime.js';
import { locale, t } from '../i18n/index.js';
import { productPath } from '../config/routes.js';

const appConfig = getAppConfig();
const PAYLOAD_URL = String(appConfig.PAYLOAD_URL || 'http://localhost:3001').replace(/\/$/, '');
const API_BASE = getApiBase();
const FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e8edf5"/><rect x="40" y="40" width="320" height="220" rx="18" fill="#d8e0ec"/><path d="M70 220l75-70 52 44 67-62 66 88H70z" fill="#9aaecb"/><circle cx="148" cy="118" r="22" fill="#aec0d9"/></svg>',
)}`;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IS_EN = document.documentElement.lang && document.documentElement.lang.startsWith('en');
const PRICE_LOCALE = IS_EN ? 'en-AT' : 'de-AT';
const clampText = (value, maxLength = 200) => String(value || '').trim().slice(0, maxLength);

const toFiniteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const toNonNegativeInteger = (value, fallback = 0) => {
  const number = Math.floor(toFiniteNumber(value, fallback));
  return number >= 0 ? number : fallback;
};

const isSafeHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

const sanitizeRelativePath = (value) => {
  const path = String(value || '').trim();
  if (!path.startsWith('/')) return '';
  if ([...path].some(character => character.charCodeAt(0) < 32)) return '';
  return path;
};

const toSafeProductLink = slug => productPath(String(slug || ''), locale);

const clearChildren = (element) => {
  if (!element) return;
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

const appendEmptyState = (element, text) => {
  if (!element) return;
  clearChildren(element);
  const message = document.createElement('p');
  message.className = 'tool-empty';
  message.textContent = text;
  element.appendChild(message);
};

const toSafeImageSrc = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(raw)) {
    return isSafeHttpUrl(raw) ? raw : FALLBACK_IMAGE;
  }
  if (/^(\/|\.\/|\.\.\/)/.test(raw)) {
    return raw;
  }
  return FALLBACK_IMAGE;
};

const getPayloadData = (payload) => {
  if (payload && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data;
  }
  return payload;
};

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.data)) return value.data;
  if (value.data) return [value.data];
  return [];
};

const toAbsoluteMediaUrl = (url) => {
  if (!url) return '';
  const rawUrl = String(url).trim();
  if (/^https?:\/\//i.test(rawUrl)) {
    return isSafeHttpUrl(rawUrl) ? rawUrl : '';
  }
  const safePath = sanitizeRelativePath(rawUrl);
  if (!safePath) return '';
  const absoluteUrl = `${PAYLOAD_URL}${safePath}`;
  return isSafeHttpUrl(absoluteUrl) ? absoluteUrl : '';
};

const readLexicalText = (node) => {
  if (!node || typeof node !== 'object') return '';

  if (node.root) return readLexicalText(node.root);
  const parts = [];

  if (typeof node.text === 'string') {
    parts.push(node.text);
  }

  if (Array.isArray(node.children)) {
    node.children.forEach((child) => {
      const text = readLexicalText(child);
      if (text) parts.push(text);
    });
  }

  return parts.join(' ').trim();
};

const normalizeMedia = (entry) => {
  const image = entry && typeof entry === 'object' ? entry : null;
  if (!image) return null;

  const rawUrl = image.sizes?.card?.url || image.url || image.sizes?.thumb?.url || image.formats?.large?.url || '';

  if (!rawUrl) return null;

  return {
    id: image.id,
    url: toAbsoluteMediaUrl(rawUrl),
    alternativeText: clampText(image.alt || image.alternativeText, 180),
    originalUrl: toAbsoluteMediaUrl(image.originalUrl || rawUrl),
    thumbnailUrl: toAbsoluteMediaUrl(image.thumbnailUrl || rawUrl),
  };
};

const normalizeCategory = (entry) => {
  const category = entry && typeof entry === 'object' ? entry : null;
  if (!category) return null;

  const slug = clampText(category.slug, 120);

  return {
    id: category.id,
    name: clampText(category.name, 160),
    slug,
    toolCount: toNonNegativeInteger(category.toolCount, 0),
  };
};

const normalizeTool = (entry) => {
  const tool = entry && typeof entry === 'object' ? entry : null;
  if (!tool) return null;

  const images = toArray(tool.images).map(normalizeMedia).filter(Boolean);
  const pricing = tool.pricing && typeof tool.pricing === 'object' ? tool.pricing : {};
  const availabilityStatus = String(tool.availabilityStatus || '').toLowerCase();
  const isUnavailable = availabilityStatus === 'unavailable';
  const lexicalDescription = readLexicalText(tool.longDescription);

  return {
    id: tool.id,
    name: clampText(tool.title || tool.name, 160),
    slug: clampText(tool.slug, 120),
    shortDescription: clampText(tool.shortDescription, 300),
    description: String(tool.longDescriptionText || lexicalDescription || tool.shortDescription || '').trim(),
    dailyPrice: toFiniteNumber(tool.dailyPrice ?? pricing.dailyPrice, 0),
    threeDayPrice: toFiniteNumber(tool.threeDayPrice ?? pricing.threeDayPrice, 0),
    weeklyPrice: toFiniteNumber(tool.weeklyPrice ?? pricing.weeklyPrice, 0),
    deposit: toFiniteNumber(tool.deposit ?? pricing.deposit, 0) || null,
    quantityTotal: isUnavailable ? 0 : 1,
    quantityAvailable: isUnavailable ? 0 : 1,
    calculatedAvailability: isUnavailable ? 0 : 1,
    location: '',
    tags: {},
    category: normalizeCategory(tool.category),
    images,
    seo: tool.seo || null,
    specifications: Array.isArray(tool.specifications) ? tool.specifications : [],
    availabilityStatus: availabilityStatus || 'available',
  };
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat(PRICE_LOCALE, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
};

const parseErrorMessage = (errorPayload, fallback) => {
  return (
    errorPayload?.error?.message ||
    errorPayload?.message ||
    errorPayload?.data?.message ||
    errorPayload?.meta?.message ||
    fallback
  );
};

const apiRequest = async (path, options = {}) => {
  const url = new URL(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`);
  url.searchParams.set('locale', IS_EN ? 'en' : 'de');
  const requestUrl = url.href;

  const requestOptions = {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
  };

  let response;

  try {
    response = await fetch(requestUrl, requestOptions);
  } catch (networkError) {
    if(options.signal?.aborted) throw networkError;
    throw new Error(t('backendUnavailable'), { cause: networkError });
  }

  let payload = null;
  const text = await response.text();

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (parseError) {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(response.status >= 500 ? t('backendUnavailable') : response.status === 429 ? t('rateLimited') : IS_EN ? t('requestFail') : parseErrorMessage(payload, t('requestFail')));
  }

  return payload;
};

const readCache = new Map();
const cachedRead = (key, load) => {
  const current = readCache.get(key);
  if (current && current.expires > Date.now()) return current.promise;
  const promise = load().catch(error => {readCache.delete(key); throw error;});
  readCache.set(key, {promise, expires: Date.now() + 30000});
  return promise;
};
const RentalApi = {
  async getToolPage({ category = '', search = '', page = 1, limit = 12, sort = 'name', signal } = {}) {
    const params = new URLSearchParams({page: String(page), limit: String(limit), sort});
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    const payload = await apiRequest(`/catalog/products?${params}`, {signal});
    return {tools: toArray(payload.data).map(normalizeTool).filter(Boolean), total: Number(payload.total || 0), hasNextPage: payload.hasNextPage === true, searchTruncated: payload.searchTruncated === true};
  },
  async getTools({ category = '', search = '' } = {}) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (search) params.set('search', search);

    const query = params.toString();
    return cachedRead(`tools:${query}`, async () => {
      const list = []; let page = 1, payload;
      do {payload = await apiRequest(`/catalog/products?${query}${query ? '&' : ''}page=${page++}`); list.push(...(getPayloadData(payload) || []));} while(payload.hasNextPage && page <= 100);
      return list.map(normalizeTool).filter(Boolean);
    });
  },

  async getToolBySlug(slug) {
    const payload = await apiRequest(`/catalog/products/slug/${encodeURIComponent(slug)}`);
    return normalizeTool(getPayloadData(payload));
  },

  async getCategorySummary() {
    const payload = await cachedRead('categories', () => apiRequest('/catalog/categories'));
    const categories = toArray(getPayloadData(payload)).map(normalizeCategory).filter(Boolean);
    return {categories,total:Number.isFinite(payload.total) ? payload.total : categories.reduce((sum,item) => sum + item.toolCount,0)};
  },
  async getCategories() {return (await this.getCategorySummary()).categories;},

  async getSiteSettings() {
    const source = await this.getPublicSiteConfig();
    if (!source) return null;

    return {
      companyName: source?.rental?.companyName || source?.contact?.brandName || '',
      heroHeadline: source?.rental?.heroHeadline || '',
      heroText: source?.rental?.heroText || '',
      priceDisclaimer: source?.rental?.priceDisclaimer || '',
      homepage: source?.site?.homepage || {},
      catalog: source?.site?.catalog || {},
    };
  },

  async getPublicSiteConfig() {
    const payload = await cachedRead('site', () => apiRequest('/public/site-config'));
    const source = getPayloadData(payload);
    if (!source) return null;

    return {
      ...source,
      site: {
        ...(source.site || {}),
        homepage: {
          ...(source.site?.homepage || {}),
          popularProducts: toArray(source.site?.homepage?.popularProducts).map(normalizeTool).filter(Boolean),
        },
      },
    };
  },

  async checkAvailability({ toolId, startDate, endDate }) {
    const payload = await apiRequest('/catalog/pricing/calculate', {
      method: 'POST',
      body: {
        productId: String(toolId),
        startDate,
        endDate,
      },
    });

    const data = getPayloadData(payload);
    const availabilityStatus = String(data?.product?.availabilityStatus || '').toLowerCase();
    const isAvailable = availabilityStatus !== 'unavailable';

    return {
      isAvailable,
      availableQuantity: isAvailable ? 1 : 0,
      pricing: data?.pricing || null,
    };
  },

  async createRentalRequest(input) {
    return apiRequest('/catalog/requests', {
      method: 'POST',
      body: {
        productId: String(input.tool),
        name: input.customerName,
        email: input.customerEmail,
        phone: input.customerPhone,
        startDate: input.startDate,
        endDate: input.endDate,
        message: input.notes,
        consentPrivacy: input.privacyConsent,
        quantity: input.quantity,
        locale: IS_EN ? 'en' : 'de',
      },
    });
  },
};

window.RentalApi = RentalApi;

const setStatus = (element, text, type) => {
  if (!element) return;
  const normalizedText = String(text || '').trim();
  if (!normalizedText) {
    element.textContent = '';
    element.style.display = 'none';
    return;
  }

  element.style.display = '';
  element.setAttribute('role', 'status');
  element.setAttribute('aria-live', type === 'is-error' ? 'assertive' : 'polite');
  element.textContent = normalizedText;
  element.classList.remove('is-info', 'is-success', 'is-error');
  element.classList.add(type || 'is-info');
};


export { appConfig, PAYLOAD_URL, API_BASE, FALLBACK_IMAGE, ISO_DATE_PATTERN, EMAIL_PATTERN, IS_EN, PRICE_LOCALE, clampText, toFiniteNumber, toNonNegativeInteger, isSafeHttpUrl, sanitizeRelativePath, toSafeProductLink, clearChildren, appendEmptyState, toSafeImageSrc, getPayloadData, toArray, toAbsoluteMediaUrl, readLexicalText, normalizeMedia, normalizeCategory, normalizeTool, formatCurrency, parseErrorMessage, apiRequest, readCache, cachedRead, RentalApi, setStatus };
