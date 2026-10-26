import { FALLBACK_IMAGE, ISO_DATE_PATTERN, EMAIL_PATTERN, IS_EN, clampText, toNonNegativeInteger, clearChildren, appendEmptyState, toSafeImageSrc, formatCurrency, RentalApi, setStatus } from '../data/catalog-api.js';
import { t } from '../i18n/index.js';
import { productCard, productImage } from '../components/product-card.js';
const renderToolImages = (tool, mainImageNode, thumbsNode) => {
  if (!mainImageNode || !thumbsNode) return;
  const images = tool.images.length ? tool.images : [{alternativeText: tool.name}];
  let activeIndex = 0;
  mainImageNode.addEventListener('error', () => { if (mainImageNode.src !== FALLBACK_IMAGE) mainImageNode.src = FALLBACK_IMAGE; });
  const buttons = images.map((image, index) => {
    const button = document.createElement('button'); button.type = 'button';
    button.dataset.thumbIndex = index; button.setAttribute('aria-label', t('imageButtonLabel', index + 1));
    button.append(productImage({...image,url:image.thumbnailUrl || image.url}, tool.name));
    button.addEventListener('click', () => select(index)); return button;
  });
  thumbsNode.replaceChildren(...buttons); thumbsNode.hidden = images.length < 2;
  const controls = document.createElement('div'); controls.className = 'gallery-controls'; controls.hidden = images.length < 2;
  const previous = document.createElement('button'), next = document.createElement('button'), position = document.createElement('span');
  previous.type = next.type = 'button'; previous.className = next.className = 'icon-btn';
  previous.textContent = '←'; next.textContent = '→'; previous.setAttribute('aria-label',t('previousImage')); next.setAttribute('aria-label',t('nextImage'));
  position.setAttribute('aria-live','polite'); controls.append(previous,position,next); thumbsNode.after(controls);
  const select = index => {
    activeIndex = (index + images.length) % images.length;
    const image = images[activeIndex]; mainImageNode.src = toSafeImageSrc(image.originalUrl || image.url);
    mainImageNode.alt = image.alternativeText || tool.name || t('toolImage');
    buttons.forEach((button,i) => button.setAttribute('aria-pressed',String(i === activeIndex)));
    position.textContent = t('imagePosition',activeIndex+1,images.length);
  };
  previous.addEventListener('click', () => select(activeIndex - 1)); next.addEventListener('click', () => select(activeIndex + 1));
  thumbsNode.addEventListener('keydown',event => {
    if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault(); select(activeIndex + (event.key === 'ArrowRight' ? 1 : -1)); buttons[activeIndex].focus();
  });
  select(0);
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

  if (!Number.isInteger(payload.quantity) || payload.quantity !== 1) {
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

  document.title = `${clampText(tool.name, 120) || t('toolFallback')} | ${IS_EN ? 'Catalog' : 'Sortiment'}`;
  const meta = document.querySelector('meta[name="description"]'); if(meta) meta.content = tool.shortDescription;
  const canonical = document.querySelector('link[rel="canonical"]'); if(canonical) canonical.href = `https://www.allessaniert.at${IS_EN ? '/en/catalog/product.html' : '/sortiment/produkt-hilti-sf-6-a22.html'}?slug=${encodeURIComponent(tool.slug)}`;
  if (breadcrumbToolName) breadcrumbToolName.textContent = clampText(tool.name, 160) || t('toolFallback');
  if (titleNode) titleNode.textContent = clampText(tool.name, 160) || t('toolFallback');
  if (subtitleNode) subtitleNode.textContent = clampText(tool.shortDescription || tool.category?.name, 200) || t('toolFallback');
  if (descNode) {
    descNode.textContent =
      (tool.description || tool.shortDescription || t('descriptionMissing')) || t('descriptionMissing');
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

  const specs = page.querySelector('[data-product-specs]');
  if (specs) {specs.replaceChildren(); for(const spec of tool.specifications){const row=document.createElement('div'),key=document.createElement('dt'),value=document.createElement('dd');key.textContent=IS_EN ? (spec.keyEn || t('specification')) : spec.key;value.textContent=spec.value;row.append(key,value);specs.append(row);} if(!specs.children.length) {const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=IS_EN?'Details':'Details';dd.textContent=t('detailsOnRequest');row.append(dt,dd);specs.append(row);}}
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

  let quoteRequest = 0;
  const refreshAvailability = async () => {
    const id = ++quoteRequest;
    const quote = page.querySelector('[data-pricing-summary]');
    if (quote) quote.textContent = '';
    if (startInput && endInput) {endInput.min = startInput.value; if(endInput.value < endInput.min) endInput.value = endInput.min;}
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

      if (id !== quoteRequest) return null;
      const totals = availability.pricing?.subtotals;
      if (quote && totals) quote.textContent = t('quoteSummary', ...[totals.rentalSubtotal,totals.insuranceSubtotal,totals.cleaningFee,totals.deposit,totals.totalWithDeposit].map(formatCurrency));
      if (availability.isAvailable) {
        setStatus(availabilityInfo, t('availableWindow', availability.availableQuantity, startDate, endDate), 'is-success');
      } else {
        setStatus(availabilityInfo, t('unavailableWindow', availability.availableQuantity), 'is-error');
      }

      return availability;
    } catch (error) {
      if (id !== quoteRequest) return null;
      setStatus(availabilityInfo, clampText(error?.message, 220) || t('availabilityError'), 'is-error');
      return null;
    }
  };

  [startInput, endInput, quantityInput].forEach((input) => {
    if (!input) return;
    input.addEventListener('change', refreshAvailability);
  });

  void refreshAvailability();

  rentForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (rentForm.dataset.submitting === 'true') return;
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

    rentForm.dataset.submitting = 'true';
    const submit = rentForm.querySelector('[type=submit]'); if (submit) submit.disabled = true;
    const availability = await refreshAvailability();
    if (!availability || !availability.isAvailable) {
      setStatus(requestFeedback, t('requestNotAvailable'), 'is-error');
      rentForm.dataset.submitting = 'false'; if (submit) submit.disabled = false;
      return;
    }

    setStatus(requestFeedback, t('requestSending'), 'is-info');
    try {
      await RentalApi.createRentalRequest(payload);
      setStatus(requestFeedback, t('requestSuccess'), 'is-success');
    } catch (error) {
      setStatus(requestFeedback, clampText(error?.message, 220) || t('requestFail'), 'is-error');
    } finally {rentForm.dataset.submitting = 'false'; if (submit) submit.disabled = false;}
  });

  const relatedGrid = page.querySelector('[data-related-tools]');
  if (relatedGrid) {
    try {
      const {tools: relatedTools} = await RentalApi.getToolPage({ category: tool.category?.slug || '', limit: 5 });
      const visible = relatedTools.filter((item) => item.id !== tool.id).slice(0, 4);

      if (!visible.length) {
        appendEmptyState(relatedGrid, t('noRelatedTools'));
      } else {
        clearChildren(relatedGrid);
        relatedGrid.append(...visible.map(productCard));
      }
    } catch (error) {
      appendEmptyState(relatedGrid, clampText(error?.message, 220) || t('relatedLoadError'));
    }
  }
};


export { renderToolDetailPage };
