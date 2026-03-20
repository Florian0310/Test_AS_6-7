(function () {
  const appConfig = window.APP_CONFIG || {};
  const STRAPI_URL = String(appConfig.STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '');
  const STRAPI_API_PREFIX = String(appConfig.STRAPI_API_PREFIX || '/api');
  const API_BASE = `${STRAPI_URL}${STRAPI_API_PREFIX.startsWith('/') ? STRAPI_API_PREFIX : `/${STRAPI_API_PREFIX}`}`;
  const FALLBACK_IMAGE = '../assets/images/aboutUsTwo.jpg';

  const toEntity = (entry) => {
    if (!entry) return null;
    if (entry.attributes && typeof entry.attributes === 'object') {
      return {
        id: entry.id,
        documentId: entry.documentId,
        ...entry.attributes,
      };
    }
    return entry;
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
    if (/^https?:\/\//i.test(url)) return url;
    return `${STRAPI_URL}${url}`;
  };

  const normalizeMedia = (entry) => {
    const image = toEntity(entry);
    if (!image) return null;

    const rawUrl =
      image.url || image.formats?.large?.url || image.formats?.medium?.url || image.formats?.small?.url || '';

    if (!rawUrl) return null;

    return {
      id: image.id,
      url: toAbsoluteMediaUrl(rawUrl),
      alternativeText: image.alternativeText || '',
    };
  };

  const normalizeCategory = (entry) => {
    const category = toEntity(entry?.data || entry);
    if (!category) return null;

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      toolCount: Number(category.toolCount || 0),
    };
  };

  const normalizeTool = (entry) => {
    const tool = toEntity(entry);
    if (!tool) return null;

    const images = toArray(tool.images).map(normalizeMedia).filter(Boolean);

    return {
      id: tool.id,
      documentId: tool.documentId,
      name: tool.name,
      slug: tool.slug,
      shortDescription: tool.shortDescription || '',
      description: tool.description || '',
      dailyPrice: Number(tool.dailyPrice || 0),
      deposit: tool.deposit != null ? Number(tool.deposit) : null,
      quantityTotal: Number(tool.quantityTotal || 0),
      quantityAvailable: Number(tool.quantityAvailable || 0),
      calculatedAvailability:
        tool.calculatedAvailability != null ? Number(tool.calculatedAvailability) : Number(tool.quantityAvailable || 0),
      location: tool.location || '',
      tags: tool.tags || {},
      category: normalizeCategory(tool.category),
      images,
      seo: tool.seo || null,
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

  const strapiRequest = async (path, options = {}) => {
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
      throw new Error('Backend nicht erreichbar. Bitte Strapi starten und URL pruefen.');
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

  const StrapiApi = {
    async getTools({ category = '', search = '' } = {}) {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);

      const query = params.toString();
      const payload = await strapiRequest(`/tools${query ? `?${query}` : ''}`);
      const source = getPayloadData(payload);
      const list = Array.isArray(source) ? source : [];
      return list.map(normalizeTool).filter(Boolean);
    },

    async getToolBySlug(slug) {
      const payload = await strapiRequest(`/tools/slug/${encodeURIComponent(slug)}`);
      return normalizeTool(getPayloadData(payload));
    },

    async getCategories() {
      const payload = await strapiRequest('/categories');
      const source = getPayloadData(payload);
      const list = Array.isArray(source) ? source : [];
      return list.map(normalizeCategory).filter(Boolean);
    },

    async getSiteSettings() {
      const payload = await strapiRequest('/site-setting?populate=*');
      const source = toEntity(getPayloadData(payload));
      if (!source) return null;

      const heroImage = normalizeMedia(source.heroImage?.data || source.heroImage);
      return {
        companyName: source.companyName || '',
        address: source.address || '',
        email: source.email || '',
        phone: source.phone || '',
        openingHours: source.openingHours || '',
        heroHeadline: source.heroHeadline || '',
        heroText: source.heroText || '',
        heroImage,
        socials: source.socials || {},
        legal: source.legal || null,
      };
    },

    async checkAvailability({ toolId, startDate, endDate, quantity }) {
      const params = new URLSearchParams({
        startDate,
        endDate,
        quantity: String(quantity),
      });
      const payload = await strapiRequest(`/tools/${toolId}/availability?${params.toString()}`);
      return getPayloadData(payload);
    },

    async createRentalRequest(input) {
      return strapiRequest('/rental-requests', {
        method: 'POST',
        body: {
          data: input,
        },
      });
    },
  };

  window.StrapiApi = StrapiApi;

  const setStatus = (element, text, type) => {
    if (!element) return;
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

      const allItemClass = !activeCategory ? 'active' : '';
      const html = [
        `<li class="${allItemClass}"><button type="button" class="category-btn" data-category="">Alle Produkte</button><i class="ri-arrow-right-s-line"></i></li>`,
      ];

      categories.forEach((category) => {
        const itemClass = activeCategory === category.slug ? 'active' : '';
        const toolCount = Number.isFinite(category.toolCount) ? `<small>${category.toolCount}</small>` : '';

        html.push(
          `<li class="${itemClass}"><button type="button" class="category-btn" data-category="${category.slug}">${category.name}</button><span class="category-meta">${toolCount}<i class="ri-arrow-right-s-line"></i></span></li>`
        );
      });

      categoriesList.innerHTML = html.join('');
    };

    const renderMiniTools = (tools) => {
      if (!miniGrid) return;

      if (!tools.length) {
        miniGrid.innerHTML = '<p class="tool-empty">Keine Werkzeuge fuer diese Kategorie gefunden.</p>';
        return;
      }

      miniGrid.innerHTML = tools
        .slice(0, 6)
        .map((tool) => {
          const imageUrl = tool.images[0]?.url || FALLBACK_IMAGE;
          return `<article><img src="${imageUrl}" alt="${tool.name}" /><span>${tool.name}</span></article>`;
        })
        .join('');
    };

    const renderToolsGrid = (tools) => {
      if (!toolsGrid) return;

      if (!tools.length) {
        toolsGrid.innerHTML = '<p class="tool-empty">Keine Werkzeuge gefunden. Bitte Filter zuruecksetzen.</p>';
        return;
      }

      toolsGrid.innerHTML = tools
        .map((tool) => {
          const imageUrl = tool.images[0]?.url || FALLBACK_IMAGE;
          const categoryName = tool.category?.name || 'Werkzeug';
          const productLink = `produkt-hilti-sf-6-a22.html?slug=${encodeURIComponent(tool.slug)}`;

          return `
            <article class="shop-product-card">
              <a class="shop-product-image" href="${productLink}">
                <img src="${imageUrl}" alt="${tool.name}" />
              </a>
              <h3><a href="${productLink}">${tool.name}</a></h3>
              <p>${categoryName}</p>
              <dl>
                <div><dt>Standort</dt><dd>${tool.location || 'Auf Anfrage'}</dd></div>
                <div><dt>Verfuegbar</dt><dd>${tool.calculatedAvailability}</dd></div>
              </dl>
              <a class="btn-price" href="${productLink}">Ab ${formatCurrency(tool.dailyPrice)}</a>
            </article>
          `;
        })
        .join('');
    };

    const loadData = async () => {
      setStatus(statusNode, 'Lade Werkzeuge aus dem CMS...', 'is-info');

      try {
        const [categories, tools] = await Promise.all([
          StrapiApi.getCategories(),
          StrapiApi.getTools({ category: activeCategory, search: activeSearch }),
        ]);

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
        setStatus(statusNode, error.message, 'is-error');
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
      mainImageNode.src = image.url;
      mainImageNode.alt = image.alternativeText || tool.name;
    };

    const renderThumbs = () => {
      thumbsNode.innerHTML = images
        .map((image, index) => {
          const activeClass = index === activeIndex ? 'active' : '';
          return `<button type="button" class="${activeClass}" data-thumb-index="${index}"><img src="${image.url}" alt="${image.alternativeText || tool.name}" /></button>`;
        })
        .join('');
    };

    thumbsNode.addEventListener('click', (event) => {
      const button = event.target.closest('[data-thumb-index]');
      if (!button) return;
      activeIndex = Number(button.getAttribute('data-thumb-index'));
      renderMain();
      renderThumbs();
    });

    renderMain();
    renderThumbs();
  };

  const createTodayDateString = (offsetDays = 0) => {
    const now = new Date();
    now.setDate(now.getDate() + offsetDays);
    return now.toISOString().slice(0, 10);
  };

  const renderToolDetailPage = async () => {
    const page = document.querySelector('[data-tool-page]');
    if (!page) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug') || page.getAttribute('data-default-slug') || '';

    const feedbackNode = page.querySelector('[data-tool-feedback]');

    if (!slug) {
      setStatus(feedbackNode, 'Kein Werkzeug-Slug uebergeben.', 'is-error');
      return;
    }

    setStatus(feedbackNode, 'Werkzeug wird geladen...', 'is-info');

    let tool;

    try {
      tool = await StrapiApi.getToolBySlug(slug);
    } catch (error) {
      setStatus(feedbackNode, error.message, 'is-error');
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

    document.title = `${tool.name} | Sortiment`;
    if (breadcrumbToolName) breadcrumbToolName.textContent = tool.name;
    if (titleNode) titleNode.textContent = tool.name;
    if (subtitleNode) subtitleNode.textContent = tool.shortDescription || tool.category?.name || 'Werkzeug';
    if (descNode) descNode.textContent = tool.description || tool.shortDescription || 'Keine Beschreibung hinterlegt.';
    if (priceNode) priceNode.textContent = formatCurrency(tool.dailyPrice);
    if (categoryNode) categoryNode.textContent = tool.category?.name || 'Werkzeug';

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

    if (startInput && !startInput.value) startInput.value = createTodayDateString(0);
    if (endInput && !endInput.value) endInput.value = createTodayDateString(1);
    if (quantityInput && !quantityInput.value) quantityInput.value = '1';

    let latestAvailability = null;

    const refreshAvailability = async () => {
      const startDate = startInput?.value;
      const endDate = endInput?.value;
      const quantity = Number(quantityInput?.value || 1);

      if (!startDate || !endDate || !Number.isFinite(quantity) || quantity <= 0) {
        setStatus(availabilityInfo, 'Bitte gueltigen Zeitraum und Menge eingeben.', 'is-info');
        return null;
      }

      try {
        const availability = await StrapiApi.checkAvailability({
          toolId: tool.id,
          startDate,
          endDate,
          quantity,
        });

        latestAvailability = availability;

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
        setStatus(availabilityInfo, error.message, 'is-error');
        return null;
      }
    };

    [startInput, endInput, quantityInput].forEach((input) => {
      if (!input) return;
      input.addEventListener('change', refreshAvailability);
    });

    await refreshAvailability();

    rentForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(rentForm);
      const payload = {
        tool: tool.id,
        customerName: String(formData.get('customerName') || '').trim(),
        customerEmail: String(formData.get('customerEmail') || '').trim(),
        customerPhone: String(formData.get('customerPhone') || '').trim(),
        startDate: String(formData.get('startDate') || ''),
        endDate: String(formData.get('endDate') || ''),
        quantity: Number(formData.get('quantity') || 1),
        notes: String(formData.get('notes') || '').trim(),
      };

      if (!payload.customerName || !payload.customerEmail) {
        setStatus(requestFeedback, 'Bitte Name und E-Mail ausfuellen.', 'is-error');
        return;
      }

      const availability = await refreshAvailability();
      if (!availability || !availability.isAvailable) {
        setStatus(requestFeedback, 'Anfrage nicht gesendet: Zeitraum oder Menge ist nicht verfuegbar.', 'is-error');
        return;
      }

      setStatus(requestFeedback, 'Anfrage wird gesendet...', 'is-info');

      try {
        await StrapiApi.createRentalRequest(payload);
        setStatus(requestFeedback, 'Vielen Dank! Ihre Anfrage wurde als "Offen" gespeichert.', 'is-success');
      } catch (error) {
        setStatus(requestFeedback, error.message, 'is-error');
      }
    });

    const relatedGrid = page.querySelector('[data-related-tools]');
    if (relatedGrid) {
      try {
        const relatedTools = await StrapiApi.getTools({ category: tool.category?.slug || '' });
        const visible = relatedTools.filter((item) => item.id !== tool.id).slice(0, 4);

        if (!visible.length) {
          relatedGrid.innerHTML = '<p class="tool-empty">Keine weiteren Werkzeuge in dieser Kategorie gefunden.</p>';
        } else {
          relatedGrid.innerHTML = visible
            .map((entry) => {
              const imageUrl = entry.images[0]?.url || FALLBACK_IMAGE;
              const link = `produkt-hilti-sf-6-a22.html?slug=${encodeURIComponent(entry.slug)}`;
              return `<article><a href="${link}"><img src="${imageUrl}" alt="${entry.name}" /></a><h3><a href="${link}">${entry.name}</a></h3><p>ab ${formatCurrency(entry.dailyPrice)}</p></article>`;
            })
            .join('');
        }
      } catch (error) {
        relatedGrid.innerHTML = `<p class="tool-empty">${error.message}</p>`;
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
      const settings = await StrapiApi.getSiteSettings();
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
