(function () {
  const appConfig = window.APP_CONFIG || {};
  const PAYLOAD_URL = String(appConfig.PAYLOAD_URL || 'http://localhost:3001').replace(/\/$/, '');
  const PAYLOAD_API_PREFIX = String(appConfig.PAYLOAD_API_PREFIX || '/api');
  const API_BASE = `${PAYLOAD_URL}${PAYLOAD_API_PREFIX.startsWith('/') ? PAYLOAD_API_PREFIX : `/${PAYLOAD_API_PREFIX}`}`;
  const FALLBACK_IMAGE = '/assets/images/aboutUsTwo.jpg';
  const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const IS_EN = document.documentElement.lang && document.documentElement.lang.startsWith('en');
  const PRICE_LOCALE = IS_EN ? 'en-AT' : 'de-AT';
  const TEXT = {
    de: {
      allProducts: 'Alle Produkte',
      allCategories: 'Alle Kategorien',
      categoryFallback: 'Kategorie',
      toolFallback: 'Werkzeug',
      toolImage: 'Werkzeugbild',
      location: 'Standort',
      available: 'Verfügbar',
      onRequest: 'Auf Anfrage',
      noToolsCategory: 'Keine Werkzeuge für diese Kategorie gefunden.',
      noToolsFilter: 'Keine Werkzeuge gefunden. Bitte Filter zurücksetzen.',
      loadingTools: 'Lade Werkzeuge aus dem CMS...',
      toolCountLoaded: (count) => `${count} Werkzeug(e) geladen.`,
      backendUnavailable: 'Backend nicht erreichbar. Bitte Payload starten und URL prüfen.',
      productsLoadError: 'Produkte konnten nicht geladen werden.',
      searchError: 'Unbekannter Fehler',
      fromPrice: 'Ab',
      dailyFrom: 'Tagesmiete ab',
      popularFallbackTitle: 'Beliebte Produkte',
      popularFallbackSubtitle: 'Die Favoriten unserer Kunden diese Woche.',
      productDataLoading: 'Produktdaten werden aus Payload geladen.',
      popularEmpty: 'Noch keine beliebten Produkte im CMS ausgewählt.',
      openProduct: 'Zum Produkt',
      productUnavailable: 'Aktuell ausgebucht',
      productAvailable: 'Verfügbar ab heute',
      loadingProduct: 'Werkzeug wird geladen...',
      productNotFound: 'Werkzeug nicht gefunden.',
      invalidSlug: 'Kein Werkzeug-Slug übergeben.',
      productLoaded: 'Werkzeugdaten geladen.',
      periodHint: 'Bitte gültigen Zeitraum und Menge eingeben.',
      availableWindow: (qty, startDate, endDate) =>
        `Verfügbar: ${qty} Stück im Zeitraum ${startDate} bis ${endDate}.`,
      unavailableWindow: (qty) => `Nicht verfügbar. Nur ${qty} Stück verfügbar.`,
      availabilityError: 'Verfügbarkeit konnte nicht geladen werden.',
      invalidName: 'Bitte gültigen Namen eingeben.',
      invalidEmail: 'Bitte gültige E-Mail eingeben.',
      invalidDates: 'Bitte gültigen Zeitraum wählen.',
      invalidEndDate: 'Das Enddatum muss am oder nach dem Startdatum liegen.',
      invalidQuantity: 'Bitte gültige Menge eingeben.',
      privacyRequired: 'Bitte Datenschutzerklärung bestätigen.',
      requestSending: 'Anfrage wird gesendet...',
      requestSuccess: 'Vielen Dank! Ihre Anfrage wurde als „Offen“ gespeichert.',
      requestFail: 'Anfrage konnte nicht gesendet werden.',
      requestNotAvailable: 'Anfrage nicht gesendet: Zeitraum oder Menge ist nicht verfügbar.',
      noRelatedTools: 'Keine weiteren Werkzeuge in dieser Kategorie gefunden.',
      relatedLoadError: 'Ähnliche Werkzeuge konnten nicht geladen werden.',
      imageButtonLabel: (index) => `Bild ${index} anzeigen`,
      homepageDefaultBadge: 'Im Piestingtal',
      descriptionMissing: 'Keine Beschreibung hinterlegt.',
    },
    en: {
      allProducts: 'All products',
      allCategories: 'All categories',
      categoryFallback: 'Category',
      toolFallback: 'Tool',
      toolImage: 'Tool image',
      location: 'Location',
      available: 'Available',
      onRequest: 'On request',
      noToolsCategory: 'No tools found for this category.',
      noToolsFilter: 'No tools found. Please reset filters.',
      loadingTools: 'Loading tools from CMS...',
      toolCountLoaded: (count) => `${count} tool(s) loaded.`,
      backendUnavailable: 'Backend unavailable. Please start Payload and verify URL.',
      productsLoadError: 'Products could not be loaded.',
      searchError: 'Unknown error',
      fromPrice: 'From',
      dailyFrom: 'Daily rent from',
      popularFallbackTitle: 'Popular Products',
      popularFallbackSubtitle: 'Top picks from our customers this week.',
      productDataLoading: 'Product data is loaded from Payload CMS.',
      popularEmpty: 'No popular products selected in CMS yet.',
      openProduct: 'Open product',
      productUnavailable: 'Currently unavailable',
      productAvailable: 'Available from today',
      loadingProduct: 'Loading tool...',
      productNotFound: 'Tool not found.',
      invalidSlug: 'No tool slug provided.',
      productLoaded: 'Tool data loaded.',
      periodHint: 'Please enter a valid date range and quantity.',
      availableWindow: (qty, startDate, endDate) => `Available: ${qty} item(s) from ${startDate} to ${endDate}.`,
      unavailableWindow: (qty) => `Not available. Only ${qty} item(s) available.`,
      availabilityError: 'Availability could not be loaded.',
      invalidName: 'Please enter a valid name.',
      invalidEmail: 'Please enter a valid email.',
      invalidDates: 'Please select a valid rental period.',
      invalidEndDate: 'End date must be on or after start date.',
      invalidQuantity: 'Please enter a valid quantity.',
      privacyRequired: 'Please accept the privacy policy.',
      requestSending: 'Sending request...',
      requestSuccess: 'Thank you. Your request has been saved as \"Open\".',
      requestFail: 'Request could not be sent.',
      requestNotAvailable: 'Request not sent: selected period or quantity is not available.',
      noRelatedTools: 'No additional tools found in this category.',
      relatedLoadError: 'Related tools could not be loaded.',
      imageButtonLabel: (index) => `Show image ${index}`,
      homepageDefaultBadge: 'In the Piesting valley',
      descriptionMissing: 'No description available.',
    },
  };
  const t = (key, ...args) => {
    const dict = IS_EN ? TEXT.en : TEXT.de;
    const value = dict[key];
    if (typeof value === 'function') return value(...args);
    return value || key;
  };

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
    if (/[\u0000-\u001F]/.test(path)) return '';
    return path;
  };

  const toSafeProductLink = (slug) => {
    const safeSlug = clampText(slug, 120);
    return `/sortiment/produkt-hilti-sf-6-a22.html?slug=${encodeURIComponent(safeSlug)}`;
  };

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

    const rawUrl = image.url || image.sizes?.card?.url || image.sizes?.thumb?.url || image.formats?.large?.url || '';

    if (!rawUrl) return null;

    return {
      id: image.id,
      url: toAbsoluteMediaUrl(rawUrl),
      alternativeText: clampText(image.alt || image.alternativeText, 180),
    };
  };

  const normalizeCategory = (entry) => {
    const category = entry && typeof entry === 'object' ? entry : null;
    if (!category) return null;

    return {
      id: category.id,
      name: clampText(category.name, 120),
      slug: clampText(category.slug, 120),
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
      description: clampText(tool.longDescriptionText || lexicalDescription || tool.shortDescription, 2000),
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
    const requestUrl = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    };

    let response;

    try {
      response = await fetch(requestUrl, requestOptions);
    } catch (networkError) {
      throw new Error(t('backendUnavailable'));
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
      throw new Error(parseErrorMessage(payload, `API Fehler (${response.status})`));
    }

    return payload;
  };

  const RentalApi = {
    async getTools({ category = '', search = '' } = {}) {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);

      const query = params.toString();
      const payload = await apiRequest(`/catalog/products${query ? `?${query}` : ''}`);
      const source = getPayloadData(payload);
      const list = Array.isArray(source) ? source : [];
      return list.map(normalizeTool).filter(Boolean);
    },

    async getToolBySlug(slug) {
      const payload = await apiRequest(`/catalog/products/slug/${encodeURIComponent(slug)}`);
      return normalizeTool(getPayloadData(payload));
    },

    async getCategories() {
      const payload = await apiRequest('/catalog/categories');
      const source = getPayloadData(payload);
      const list = Array.isArray(source) ? source : [];
      return list.map(normalizeCategory).filter(Boolean);
    },

    async getSiteSettings() {
      const source = await this.getPublicSiteConfig();
      if (!source) return null;

      return {
        companyName: source?.rental?.companyName || source?.contact?.brandName || '',
        heroHeadline: source?.rental?.heroHeadline || '',
        heroText: source?.rental?.heroText || '',
        priceDisclaimer: source?.rental?.priceDisclaimer || '',
        homepage: source?.site?.homepage || {},
      };
    },

    async getPublicSiteConfig() {
      const payload = await apiRequest('/public/site-config');
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

    async checkAvailability({ toolId, startDate, endDate, quantity }) {
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

  const renderShopListPage = async () => {
    const page = document.querySelector('[data-shop-page]');
    if (!page) return;

    const categoriesList = page.querySelector('[data-categories-list]');
    const miniGrid = page.querySelector('[data-tools-mini]');
    const toolsGrid = page.querySelector('[data-tools-grid]');
    const statusNode = page.querySelector('[data-shop-feedback]');
    const activeCategoryLabel = page.querySelector('[data-shop-current-category]');
    const searchForm = page.querySelector('[data-tools-search-form]');
    const searchInput = page.querySelector('[data-tools-search]');
    const resetFilterButton = page.querySelector('[data-reset-filter]');

    const urlState = new URLSearchParams(window.location.search);
    let activeCategory = urlState.get('category') || '';
    let activeSearch = urlState.get('search') || '';

    if (searchInput) {
      searchInput.value = activeSearch;
    }

    const updateUrl = () => {
      const next = new URLSearchParams();
      if (activeCategory) next.set('category', activeCategory);
      if (activeSearch) next.set('search', activeSearch);
      const nextUrl = `${window.location.pathname}${next.toString() ? `?${next.toString()}` : ''}`;
      window.history.replaceState({}, '', nextUrl);
    };

    const renderCategories = (categories) => {
      if (!categoriesList) return;
      clearChildren(categoriesList);

      const addCategoryItem = ({ slug, name, toolCount }, isActive) => {
        const item = document.createElement('li');
        if (isActive) item.classList.add('active');

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'category-btn';
        button.setAttribute('data-category', slug);
        button.textContent = name;
        item.appendChild(button);

        const meta = document.createElement('span');
        meta.className = 'category-meta';
        if (Number.isFinite(toolCount)) {
          const countNode = document.createElement('small');
          countNode.textContent = String(toolCount);
          meta.appendChild(countNode);
        }
        const icon = document.createElement('i');
        icon.className = 'ri-arrow-right-s-line';
        icon.setAttribute('aria-hidden', 'true');
        meta.appendChild(icon);
        item.appendChild(meta);

        categoriesList.appendChild(item);
      };

      addCategoryItem(
        {
          slug: '',
          name: t('allProducts'),
          toolCount: NaN,
        },
        !activeCategory
      );

      categories.forEach((category) => {
        addCategoryItem(
          {
            slug: clampText(category.slug, 120),
            name: clampText(category.name, 120) || t('categoryFallback'),
            toolCount: category.toolCount,
          },
          activeCategory === category.slug
        );
      });
    };

    const renderMiniTools = (tools) => {
      if (!miniGrid) return;

      if (!tools.length) {
        appendEmptyState(miniGrid, t('noToolsCategory'));
        return;
      }

      clearChildren(miniGrid);
      tools.slice(0, 6).forEach((tool) => {
        const article = document.createElement('article');
        const image = document.createElement('img');
        image.src = toSafeImageSrc(tool.images[0]?.url);
        image.alt = clampText(tool.name, 160) || t('toolImage');
        image.loading = 'lazy';
        image.decoding = 'async';

        const label = document.createElement('span');
        label.textContent = clampText(tool.name, 160) || t('toolFallback');

        article.appendChild(image);
        article.appendChild(label);
        miniGrid.appendChild(article);
      });
    };

    const createSpecRow = (label, value) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      term.textContent = label;
      const desc = document.createElement('dd');
      desc.textContent = value;
      row.appendChild(term);
      row.appendChild(desc);
      return row;
    };

    const renderToolsGrid = (tools) => {
      if (!toolsGrid) return;

      if (!tools.length) {
        appendEmptyState(toolsGrid, t('noToolsFilter'));
        return;
      }

      clearChildren(toolsGrid);

      tools.forEach((tool) => {
        const productLink = toSafeProductLink(tool.slug);
        const categoryName = clampText(tool.category?.name, 120) || t('toolFallback');
        const location = clampText(tool.location, 160) || t('onRequest');
        const availability = String(toNonNegativeInteger(tool.calculatedAvailability, 0));

        const card = document.createElement('article');
        card.className = 'shop-product-card';

        const imageLink = document.createElement('a');
        imageLink.className = 'shop-product-image';
        imageLink.href = productLink;

        const image = document.createElement('img');
        image.src = toSafeImageSrc(tool.images[0]?.url);
        image.alt = clampText(tool.name, 160) || t('toolImage');
        image.loading = 'lazy';
        image.decoding = 'async';
        imageLink.appendChild(image);

        const title = document.createElement('h3');
        const titleLink = document.createElement('a');
        titleLink.href = productLink;
        titleLink.textContent = clampText(tool.name, 160) || t('toolFallback');
        title.appendChild(titleLink);

        const category = document.createElement('p');
        category.textContent = categoryName;

        const specs = document.createElement('dl');
        specs.appendChild(createSpecRow(t('location'), location));
        specs.appendChild(createSpecRow(t('available'), availability));

        const priceLink = document.createElement('a');
        priceLink.className = 'btn-price';
        priceLink.href = productLink;
        priceLink.textContent = `${t('fromPrice')} ${formatCurrency(tool.dailyPrice)}`;

        card.appendChild(imageLink);
        card.appendChild(title);
        card.appendChild(category);
        card.appendChild(specs);
        card.appendChild(priceLink);
        toolsGrid.appendChild(card);
      });
    };

    let latestLoadRequestId = 0;

    const loadData = async () => {
      const requestId = ++latestLoadRequestId;
      setStatus(statusNode, t('loadingTools'), 'is-info');

      try {
        const [categories, tools] = await Promise.all([
          RentalApi.getCategories(),
          RentalApi.getTools({ category: activeCategory, search: activeSearch }),
        ]);

        if (requestId !== latestLoadRequestId) return;

        renderCategories(categories);
        renderMiniTools(tools);
        renderToolsGrid(tools);

        const currentCategoryName =
          categories.find((category) => category.slug === activeCategory)?.name || t('allCategories');

        if (activeCategoryLabel) {
          activeCategoryLabel.textContent = currentCategoryName;
        }

        setStatus(statusNode, '', 'is-success');
      } catch (error) {
        if (requestId !== latestLoadRequestId) return;
        setStatus(statusNode, clampText(error?.message, 220) || t('searchError'), 'is-error');
      }
    };

    if (categoriesList) {
      categoriesList.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-category]');
        if (!trigger) return;

        activeCategory = trigger.getAttribute('data-category') || '';
        updateUrl();
        loadData();
      });
    }

    if (searchForm && searchInput) {
      searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        activeSearch = searchInput.value.trim();
        updateUrl();
        loadData();
      });
    }

    if (resetFilterButton) {
      resetFilterButton.addEventListener('click', () => {
        activeCategory = '';
        activeSearch = '';
        if (searchInput) searchInput.value = '';
        updateUrl();
        loadData();
      });
    }

    await loadData();
  };

  const renderToolImages = (tool, mainImageNode, thumbsNode) => {
    if (!mainImageNode || !thumbsNode) return;

    const images = tool.images.length
      ? tool.images
      : [
          {
            url: FALLBACK_IMAGE,
            alternativeText: tool.name,
          },
        ];

    let activeIndex = 0;

    const renderMain = () => {
      const image = images[activeIndex];
      mainImageNode.src = toSafeImageSrc(image.url);
      mainImageNode.alt = clampText(image.alternativeText, 160) || clampText(tool.name, 160) || t('toolImage');
    };

    const renderThumbs = () => {
      clearChildren(thumbsNode);
      images.forEach((image, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('data-thumb-index', String(index));
        button.setAttribute('aria-label', t('imageButtonLabel', index + 1));
        if (index === activeIndex) {
          button.classList.add('active');
        }

        const thumb = document.createElement('img');
        thumb.src = toSafeImageSrc(image.url);
        thumb.alt = clampText(image.alternativeText, 160) || clampText(tool.name, 160) || t('toolImage');
        thumb.loading = 'lazy';
        thumb.decoding = 'async';

        button.appendChild(thumb);
        thumbsNode.appendChild(button);
      });
    };

    thumbsNode.addEventListener('click', (event) => {
      const button = event.target.closest('[data-thumb-index]');
      if (!button) return;
      const nextIndex = toNonNegativeInteger(button.getAttribute('data-thumb-index'), 0);
      if (nextIndex >= images.length) return;
      activeIndex = nextIndex;
      renderMain();
      renderThumbs();
    });

    renderMain();
    renderThumbs();
  };

  const createTodayDateString = (offsetDays = 0) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offsetDays);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isIsoDate = (value) => ISO_DATE_PATTERN.test(String(value || ''));

  const validateRentalPayload = (payload) => {
    if (!payload.customerName || payload.customerName.length < 2) {
      return t('invalidName');
    }

    if (!EMAIL_PATTERN.test(payload.customerEmail || '')) {
      return t('invalidEmail');
    }

    if (!isIsoDate(payload.startDate) || !isIsoDate(payload.endDate)) {
      return t('invalidDates');
    }

    if (payload.endDate < payload.startDate) {
      return t('invalidEndDate');
    }

    if (!Number.isInteger(payload.quantity) || payload.quantity < 1) {
      return t('invalidQuantity');
    }

    if (!payload.privacyConsent) {
      return t('privacyRequired');
    }

    return '';
  };

  const renderToolDetailPage = async () => {
    const page = document.querySelector('[data-tool-page]');
    if (!page) return;

    const params = new URLSearchParams(window.location.search);
    const slug = clampText(params.get('slug') || page.getAttribute('data-default-slug') || '', 120);

    const feedbackNode = page.querySelector('[data-tool-feedback]');

    if (!slug) {
      setStatus(feedbackNode, t('invalidSlug'), 'is-error');
      return;
    }

    setStatus(feedbackNode, t('loadingProduct'), 'is-info');

    let tool;

    try {
      tool = await RentalApi.getToolBySlug(slug);
    } catch (error) {
      setStatus(feedbackNode, clampText(error?.message, 220) || t('productsLoadError'), 'is-error');
      return;
    }

    if (!tool) {
      setStatus(feedbackNode, t('productNotFound'), 'is-error');
      return;
    }

    const breadcrumbToolName = page.querySelector('[data-breadcrumb-tool-name]');
    const titleNode = page.querySelector('[data-tool-name]');
    const subtitleNode = page.querySelector('[data-tool-subtitle]');
    const descNode = page.querySelector('[data-tool-description]');
    const priceNode = page.querySelector('[data-tool-price]');
    const availabilityNode = page.querySelector('[data-tool-availability]');
    const categoryNode = page.querySelector('[data-tool-category]');

    const specTorqueNode = page.querySelector('[data-spec-torque]');
    const specWeightNode = page.querySelector('[data-spec-weight]');
    const specSpeedNode = page.querySelector('[data-spec-speed]');
    const specChuckNode = page.querySelector('[data-spec-chuck]');

    const mainImageNode = page.querySelector('[data-tool-main-image]');
    const thumbsNode = page.querySelector('[data-tool-thumbs]');

    const metaTags = tool.tags && typeof tool.tags === 'object' ? tool.tags : {};

    document.title = `${clampText(tool.name, 120) || t('toolFallback')} | Sortiment`;
    if (breadcrumbToolName) breadcrumbToolName.textContent = clampText(tool.name, 160) || t('toolFallback');
    if (titleNode) titleNode.textContent = clampText(tool.name, 160) || t('toolFallback');
    if (subtitleNode) subtitleNode.textContent = clampText(tool.shortDescription || tool.category?.name, 200) || t('toolFallback');
    if (descNode) {
      descNode.textContent =
        clampText(tool.description || tool.shortDescription || t('descriptionMissing'), 2000) || t('descriptionMissing');
    }
    if (priceNode) priceNode.textContent = formatCurrency(tool.dailyPrice);
    if (categoryNode) categoryNode.textContent = clampText(tool.category?.name, 120) || t('toolFallback');

    if (availabilityNode) {
      availabilityNode.textContent = tool.calculatedAvailability > 0 ? t('productAvailable') : t('productUnavailable');
      availabilityNode.classList.toggle('is-out', tool.calculatedAvailability <= 0);
    }

    if (specTorqueNode) specTorqueNode.textContent = metaTags.torque || '-';
    if (specWeightNode) specWeightNode.textContent = metaTags.weight || '-';
    if (specSpeedNode) specSpeedNode.textContent = metaTags.speed || '-';
    if (specChuckNode) specChuckNode.textContent = metaTags.chuck || '-';

    renderToolImages(tool, mainImageNode, thumbsNode);
    setStatus(feedbackNode, t('productLoaded'), 'is-success');

    const rentForm = page.querySelector('[data-rental-form]');
    const availabilityInfo = page.querySelector('[data-availability-status]');
    const requestFeedback = page.querySelector('[data-rental-feedback]');

    if (!rentForm) return;

    const startInput = rentForm.querySelector('[name="startDate"]');
    const endInput = rentForm.querySelector('[name="endDate"]');
    const quantityInput = rentForm.querySelector('[name="quantity"]');

    if (startInput) {
      startInput.min = createTodayDateString(0);
      if (!startInput.value) startInput.value = createTodayDateString(0);
    }
    if (endInput) {
      endInput.min = startInput?.value || createTodayDateString(0);
      if (!endInput.value) endInput.value = createTodayDateString(1);
      if (endInput.value < endInput.min) {
        endInput.value = endInput.min;
      }
    }
    if (quantityInput && !quantityInput.value) quantityInput.value = '1';

    const refreshAvailability = async () => {
      const startDate = startInput?.value;
      const endDate = endInput?.value;
      const quantity = toNonNegativeInteger(quantityInput?.value, 0);

      if (!isIsoDate(startDate) || !isIsoDate(endDate) || endDate < startDate || quantity < 1) {
        setStatus(availabilityInfo, t('periodHint'), 'is-info');
        return null;
      }

      try {
        const availability = await RentalApi.checkAvailability({
          toolId: tool.id,
          startDate,
          endDate,
          quantity,
        });

        if (availability.isAvailable) {
          setStatus(availabilityInfo, t('availableWindow', availability.availableQuantity, startDate, endDate), 'is-success');
        } else {
          setStatus(availabilityInfo, t('unavailableWindow', availability.availableQuantity), 'is-error');
        }

        return availability;
      } catch (error) {
        setStatus(availabilityInfo, clampText(error?.message, 220) || t('availabilityError'), 'is-error');
        return null;
      }
    };

    [startInput, endInput, quantityInput].forEach((input) => {
      if (!input) return;
      input.addEventListener('change', refreshAvailability);
    });

    if (startInput && endInput) {
      startInput.addEventListener('change', () => {
        endInput.min = startInput.value || createTodayDateString(0);
        if (endInput.value && endInput.value < endInput.min) {
          endInput.value = endInput.min;
        }
      });
    }

    await refreshAvailability();

    rentForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(rentForm);
      const payload = {
        tool: tool.id,
        customerName: clampText(formData.get('customerName'), 140),
        customerEmail: clampText(formData.get('customerEmail'), 180),
        customerPhone: clampText(formData.get('customerPhone'), 80),
        startDate: String(formData.get('startDate') || ''),
        endDate: String(formData.get('endDate') || ''),
        quantity: toNonNegativeInteger(formData.get('quantity'), 0),
        notes: clampText(formData.get('notes'), 1000),
        privacyConsent: formData.get('rentalPrivacyConsent') === 'on',
      };

      const validationError = validateRentalPayload(payload);
      if (validationError) {
        setStatus(requestFeedback, validationError, 'is-error');
        return;
      }

      const availability = await refreshAvailability();
      if (!availability || !availability.isAvailable) {
        setStatus(requestFeedback, t('requestNotAvailable'), 'is-error');
        return;
      }

      setStatus(requestFeedback, t('requestSending'), 'is-info');

      try {
        await RentalApi.createRentalRequest(payload);
        setStatus(requestFeedback, t('requestSuccess'), 'is-success');
      } catch (error) {
        setStatus(requestFeedback, clampText(error?.message, 220) || t('requestFail'), 'is-error');
      }
    });

    const relatedGrid = page.querySelector('[data-related-tools]');
    if (relatedGrid) {
      try {
        const relatedTools = await RentalApi.getTools({ category: tool.category?.slug || '' });
        const visible = relatedTools.filter((item) => item.id !== tool.id).slice(0, 4);

        if (!visible.length) {
          appendEmptyState(relatedGrid, t('noRelatedTools'));
        } else {
          clearChildren(relatedGrid);
          visible.forEach((entry) => {
            const article = document.createElement('article');
            const link = toSafeProductLink(entry.slug);

            const imageLink = document.createElement('a');
            imageLink.href = link;
            const image = document.createElement('img');
            image.src = toSafeImageSrc(entry.images[0]?.url);
            image.alt = clampText(entry.name, 160) || t('toolImage');
            image.loading = 'lazy';
            image.decoding = 'async';
            imageLink.appendChild(image);

            const title = document.createElement('h3');
            const titleLink = document.createElement('a');
            titleLink.href = link;
            titleLink.textContent = clampText(entry.name, 160) || t('toolFallback');
            title.appendChild(titleLink);

            const price = document.createElement('p');
            price.textContent = `${t('fromPrice')} ${formatCurrency(entry.dailyPrice)}`;

            article.appendChild(imageLink);
            article.appendChild(title);
            article.appendChild(price);
            relatedGrid.appendChild(article);
          });
        }
      } catch (error) {
        appendEmptyState(relatedGrid, clampText(error?.message, 220) || t('relatedLoadError'));
      }
    }
  };

  const applyHomeSiteSettings = async () => {
    if (!document.body.classList.contains('home-page')) return;

    const headlineNode = document.querySelector('[data-site-hero-headline]');
    const textNode = document.querySelector('[data-site-hero-text]');
    const badgeNode = document.querySelector('[data-site-hero-badge]');
    const popularTitleNode = document.querySelector('[data-popular-title]');
    const popularSubtitleNode = document.querySelector('[data-popular-subtitle]');
    const popularGridNode = document.querySelector('[data-popular-grid]');

    const renderPopularTools = (tools) => {
      if (!popularGridNode) return;

      if (!Array.isArray(tools) || !tools.length) {
        appendEmptyState(popularGridNode, t('popularEmpty'));
        return;
      }

      clearChildren(popularGridNode);

      tools.slice(0, 3).forEach((tool) => {
        const article = document.createElement('article');
        article.className = 'product-card';

        const imageWrap = document.createElement('div');
        imageWrap.className = 'product-image-wrap';
        const image = document.createElement('img');
        image.src = toSafeImageSrc(tool.images?.[0]?.url);
        image.alt = clampText(tool.name, 160) || t('toolImage');
        image.loading = 'lazy';
        image.decoding = 'async';
        imageWrap.appendChild(image);

        const content = document.createElement('div');
        content.className = 'product-content';

        const category = document.createElement('span');
        category.className = 'product-category';
        category.textContent = clampText(tool.category?.name, 80) || t('categoryFallback');

        const title = document.createElement('h3');
        const titleLink = document.createElement('a');
        titleLink.href = toSafeProductLink(tool.slug);
        titleLink.textContent = clampText(tool.name, 160) || t('toolFallback');
        title.appendChild(titleLink);

        const description = document.createElement('p');
        description.textContent = clampText(tool.shortDescription, 160) || t('productDataLoading');

        const footer = document.createElement('div');
        footer.className = 'product-footer';

        const priceInfo = document.createElement('div');
        const small = document.createElement('small');
        small.textContent = t('dailyFrom');
        const strong = document.createElement('strong');
        strong.textContent = formatCurrency(tool.dailyPrice || 0);
        priceInfo.appendChild(small);
        priceInfo.appendChild(strong);

        const linkBtn = document.createElement('a');
        linkBtn.className = 'product-cart';
        linkBtn.href = toSafeProductLink(tool.slug);
        linkBtn.setAttribute('aria-label', t('openProduct'));
        const icon = document.createElement('i');
        icon.className = 'ri-arrow-right-line';
        icon.setAttribute('aria-hidden', 'true');
        linkBtn.appendChild(icon);

        footer.appendChild(priceInfo);
        footer.appendChild(linkBtn);

        content.appendChild(category);
        content.appendChild(title);
        content.appendChild(description);
        content.appendChild(footer);

        article.appendChild(imageWrap);
        article.appendChild(content);
        popularGridNode.appendChild(article);
      });
    };

    if (!headlineNode && !textNode && !badgeNode && !popularGridNode && !popularTitleNode && !popularSubtitleNode) {
      return;
    }

    try {
      const settings = await RentalApi.getSiteSettings();
      if (!settings) return;

      if (headlineNode && settings.heroHeadline) headlineNode.textContent = settings.heroHeadline;
      if (textNode && settings.heroText) textNode.textContent = settings.heroText;
      if (badgeNode) badgeNode.textContent = settings.companyName || t('homepageDefaultBadge');

      const homepage = settings.homepage || {};
      const popularTitle = IS_EN
        ? homepage.popularSectionTitleEn || t('popularFallbackTitle')
        : homepage.popularSectionTitleDe || t('popularFallbackTitle');
      const popularSubtitle = IS_EN
        ? homepage.popularSectionSubtitleEn || t('popularFallbackSubtitle')
        : homepage.popularSectionSubtitleDe || t('popularFallbackSubtitle');

      if (popularTitleNode) popularTitleNode.textContent = clampText(popularTitle, 120);
      if (popularSubtitleNode) popularSubtitleNode.textContent = clampText(popularSubtitle, 180);

      const selectedPopularProducts = Array.isArray(homepage.popularProducts) ? homepage.popularProducts : [];
      if (selectedPopularProducts.length) {
        renderPopularTools(selectedPopularProducts);
        return;
      }

      const fallbackTools = await RentalApi.getTools();
      renderPopularTools(fallbackTools);
    } catch (error) {
      if (popularGridNode) {
        appendEmptyState(popularGridNode, clampText(error?.message, 220) || t('productsLoadError'));
      }
    }
  };

  const init = () => {
    applyHomeSiteSettings();
    renderShopListPage();
    renderToolDetailPage();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
