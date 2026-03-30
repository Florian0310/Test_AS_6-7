(function () {
  const appConfig = window.APP_CONFIG || {};
  const PAYLOAD_URL = String(appConfig.PAYLOAD_URL || 'http://localhost:3001').replace(/\/$/, '');
  const PAYLOAD_API_PREFIX = String(appConfig.PAYLOAD_API_PREFIX || '/api');
  const API_BASE = `${PAYLOAD_URL}${PAYLOAD_API_PREFIX.startsWith('/') ? PAYLOAD_API_PREFIX : `/${PAYLOAD_API_PREFIX}`}`;
  const FALLBACK_IMAGE = '../assets/images/aboutUsTwo.jpg';
  const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    return `produkt-hilti-sf-6-a22.html?slug=${encodeURIComponent(safeSlug)}`;
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
    return new Intl.NumberFormat('de-AT', {
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
      throw new Error('Backend nicht erreichbar. Bitte Payload starten und URL pruefen.');
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
      const payload = await apiRequest('/globals/rental-settings');
      const source = getPayloadData(payload);
      if (!source) return null;

      return {
        companyName: source.companyName || '',
        heroHeadline: source.heroHeadline || '',
        heroText: source.heroText || '',
        priceDisclaimer: source.priceDisclaimer || '',
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
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', type === 'is-error' ? 'assertive' : 'polite');
    element.textContent = text;
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
          name: 'Alle Produkte',
          toolCount: NaN,
        },
        !activeCategory
      );

      categories.forEach((category) => {
        addCategoryItem(
          {
            slug: clampText(category.slug, 120),
            name: clampText(category.name, 120) || 'Kategorie',
            toolCount: category.toolCount,
          },
          activeCategory === category.slug
        );
      });
    };

    const renderMiniTools = (tools) => {
      if (!miniGrid) return;

      if (!tools.length) {
        appendEmptyState(miniGrid, 'Keine Werkzeuge fuer diese Kategorie gefunden.');
        return;
      }

      clearChildren(miniGrid);
      tools.slice(0, 6).forEach((tool) => {
        const article = document.createElement('article');
        const image = document.createElement('img');
        image.src = toSafeImageSrc(tool.images[0]?.url);
        image.alt = clampText(tool.name, 160) || 'Werkzeugbild';
        image.loading = 'lazy';
        image.decoding = 'async';

        const label = document.createElement('span');
        label.textContent = clampText(tool.name, 160) || 'Werkzeug';

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
        appendEmptyState(toolsGrid, 'Keine Werkzeuge gefunden. Bitte Filter zuruecksetzen.');
        return;
      }

      clearChildren(toolsGrid);

      tools.forEach((tool) => {
        const productLink = toSafeProductLink(tool.slug);
        const categoryName = clampText(tool.category?.name, 120) || 'Werkzeug';
        const location = clampText(tool.location, 160) || 'Auf Anfrage';
        const availability = String(toNonNegativeInteger(tool.calculatedAvailability, 0));

        const card = document.createElement('article');
        card.className = 'shop-product-card';

        const imageLink = document.createElement('a');
        imageLink.className = 'shop-product-image';
        imageLink.href = productLink;

        const image = document.createElement('img');
        image.src = toSafeImageSrc(tool.images[0]?.url);
        image.alt = clampText(tool.name, 160) || 'Werkzeugbild';
        image.loading = 'lazy';
        image.decoding = 'async';
        imageLink.appendChild(image);

        const title = document.createElement('h3');
        const titleLink = document.createElement('a');
        titleLink.href = productLink;
        titleLink.textContent = clampText(tool.name, 160) || 'Werkzeug';
        title.appendChild(titleLink);

        const category = document.createElement('p');
        category.textContent = categoryName;

        const specs = document.createElement('dl');
        specs.appendChild(createSpecRow('Standort', location));
        specs.appendChild(createSpecRow('Verfuegbar', availability));

        const priceLink = document.createElement('a');
        priceLink.className = 'btn-price';
        priceLink.href = productLink;
        priceLink.textContent = `Ab ${formatCurrency(tool.dailyPrice)}`;

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
      setStatus(statusNode, 'Lade Werkzeuge aus dem CMS...', 'is-info');

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
          categories.find((category) => category.slug === activeCategory)?.name || 'Alle Kategorien';

        if (activeCategoryLabel) {
          activeCategoryLabel.textContent = currentCategoryName;
        }

        setStatus(statusNode, `${tools.length} Werkzeug(e) geladen.`, 'is-success');
      } catch (error) {
        if (requestId !== latestLoadRequestId) return;
        setStatus(statusNode, clampText(error?.message, 220) || 'Unbekannter Fehler', 'is-error');
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
      mainImageNode.alt = clampText(image.alternativeText, 160) || clampText(tool.name, 160) || 'Werkzeugbild';
    };

    const renderThumbs = () => {
      clearChildren(thumbsNode);
      images.forEach((image, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('data-thumb-index', String(index));
        button.setAttribute('aria-label', `Bild ${index + 1} anzeigen`);
        if (index === activeIndex) {
          button.classList.add('active');
        }

        const thumb = document.createElement('img');
        thumb.src = toSafeImageSrc(image.url);
        thumb.alt = clampText(image.alternativeText, 160) || clampText(tool.name, 160) || 'Werkzeugbild';
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
      return 'Bitte gueltigen Namen eingeben.';
    }

    if (!EMAIL_PATTERN.test(payload.customerEmail || '')) {
      return 'Bitte gueltige E-Mail eingeben.';
    }

    if (!isIsoDate(payload.startDate) || !isIsoDate(payload.endDate)) {
      return 'Bitte gueltigen Zeitraum waehlen.';
    }

    if (payload.endDate < payload.startDate) {
      return 'Das Enddatum muss am oder nach dem Startdatum liegen.';
    }

    if (!Number.isInteger(payload.quantity) || payload.quantity < 1) {
      return 'Bitte gueltige Menge eingeben.';
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
      setStatus(feedbackNode, 'Kein Werkzeug-Slug uebergeben.', 'is-error');
      return;
    }

    setStatus(feedbackNode, 'Werkzeug wird geladen...', 'is-info');

    let tool;

    try {
      tool = await RentalApi.getToolBySlug(slug);
    } catch (error) {
      setStatus(feedbackNode, clampText(error?.message, 220) || 'Werkzeug konnte nicht geladen werden.', 'is-error');
      return;
    }

    if (!tool) {
      setStatus(feedbackNode, 'Werkzeug nicht gefunden.', 'is-error');
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

    document.title = `${clampText(tool.name, 120) || 'Werkzeug'} | Sortiment`;
    if (breadcrumbToolName) breadcrumbToolName.textContent = clampText(tool.name, 160) || 'Werkzeug';
    if (titleNode) titleNode.textContent = clampText(tool.name, 160) || 'Werkzeug';
    if (subtitleNode) subtitleNode.textContent = clampText(tool.shortDescription || tool.category?.name, 200) || 'Werkzeug';
    if (descNode) {
      descNode.textContent =
        clampText(tool.description || tool.shortDescription || 'Keine Beschreibung hinterlegt.', 2000) ||
        'Keine Beschreibung hinterlegt.';
    }
    if (priceNode) priceNode.textContent = formatCurrency(tool.dailyPrice);
    if (categoryNode) categoryNode.textContent = clampText(tool.category?.name, 120) || 'Werkzeug';

    if (availabilityNode) {
      availabilityNode.textContent = tool.calculatedAvailability > 0 ? 'Verfuegbar ab heute' : 'Aktuell ausgebucht';
      availabilityNode.classList.toggle('is-out', tool.calculatedAvailability <= 0);
    }

    if (specTorqueNode) specTorqueNode.textContent = metaTags.torque || '-';
    if (specWeightNode) specWeightNode.textContent = metaTags.weight || '-';
    if (specSpeedNode) specSpeedNode.textContent = metaTags.speed || '-';
    if (specChuckNode) specChuckNode.textContent = metaTags.chuck || '-';

    renderToolImages(tool, mainImageNode, thumbsNode);
    setStatus(feedbackNode, 'Werkzeugdaten geladen.', 'is-success');

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
        setStatus(availabilityInfo, 'Bitte gueltigen Zeitraum und Menge eingeben.', 'is-info');
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
          setStatus(
            availabilityInfo,
            `Verfuegbar: ${availability.availableQuantity} Stueck im Zeitraum ${startDate} bis ${endDate}.`,
            'is-success'
          );
        } else {
          setStatus(
            availabilityInfo,
            `Nicht verfuegbar. Nur ${availability.availableQuantity} Stueck verfuegbar.`,
            'is-error'
          );
        }

        return availability;
      } catch (error) {
        setStatus(availabilityInfo, clampText(error?.message, 220) || 'Verfuegbarkeit konnte nicht geladen werden.', 'is-error');
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
      };

      const validationError = validateRentalPayload(payload);
      if (validationError) {
        setStatus(requestFeedback, validationError, 'is-error');
        return;
      }

      const availability = await refreshAvailability();
      if (!availability || !availability.isAvailable) {
        setStatus(requestFeedback, 'Anfrage nicht gesendet: Zeitraum oder Menge ist nicht verfuegbar.', 'is-error');
        return;
      }

      setStatus(requestFeedback, 'Anfrage wird gesendet...', 'is-info');

      try {
        await RentalApi.createRentalRequest(payload);
        setStatus(requestFeedback, 'Vielen Dank! Ihre Anfrage wurde als "Offen" gespeichert.', 'is-success');
      } catch (error) {
        setStatus(requestFeedback, clampText(error?.message, 220) || 'Anfrage konnte nicht gesendet werden.', 'is-error');
      }
    });

    const relatedGrid = page.querySelector('[data-related-tools]');
    if (relatedGrid) {
      try {
        const relatedTools = await RentalApi.getTools({ category: tool.category?.slug || '' });
        const visible = relatedTools.filter((item) => item.id !== tool.id).slice(0, 4);

        if (!visible.length) {
          appendEmptyState(relatedGrid, 'Keine weiteren Werkzeuge in dieser Kategorie gefunden.');
        } else {
          clearChildren(relatedGrid);
          visible.forEach((entry) => {
            const article = document.createElement('article');
            const link = toSafeProductLink(entry.slug);

            const imageLink = document.createElement('a');
            imageLink.href = link;
            const image = document.createElement('img');
            image.src = toSafeImageSrc(entry.images[0]?.url);
            image.alt = clampText(entry.name, 160) || 'Werkzeugbild';
            image.loading = 'lazy';
            image.decoding = 'async';
            imageLink.appendChild(image);

            const title = document.createElement('h3');
            const titleLink = document.createElement('a');
            titleLink.href = link;
            titleLink.textContent = clampText(entry.name, 160) || 'Werkzeug';
            title.appendChild(titleLink);

            const price = document.createElement('p');
            price.textContent = `ab ${formatCurrency(entry.dailyPrice)}`;

            article.appendChild(imageLink);
            article.appendChild(title);
            article.appendChild(price);
            relatedGrid.appendChild(article);
          });
        }
      } catch (error) {
        appendEmptyState(relatedGrid, clampText(error?.message, 220) || 'Aehnliche Werkzeuge konnten nicht geladen werden.');
      }
    }
  };

  const applyHomeSiteSettings = async () => {
    if (!document.body.classList.contains('home-page')) return;

    const headlineNode = document.querySelector('[data-site-hero-headline]');
    const textNode = document.querySelector('[data-site-hero-text]');
    const badgeNode = document.querySelector('[data-site-hero-badge]');

    if (!headlineNode && !textNode && !badgeNode) {
      return;
    }

    try {
      const settings = await RentalApi.getSiteSettings();
      if (!settings) return;

      if (headlineNode && settings.heroHeadline) headlineNode.textContent = settings.heroHeadline;
      if (textNode && settings.heroText) textNode.textContent = settings.heroText;
      if (badgeNode && settings.companyName) badgeNode.textContent = settings.companyName;
    } catch (error) {
      // Stille fallback-Anzeige auf statische Inhalte.
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
