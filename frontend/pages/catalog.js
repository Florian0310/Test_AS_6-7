import { RentalApi } from '../data/catalog-api.js';
import { productCard } from '../components/product-card.js';
import { t, isEnglish } from '../i18n/index.js';
import { readCatalogState, catalogQuery, toggleCategory } from '../lib/catalog-state.js';

export async function initCatalog() {
  const page = document.querySelector('[data-shop-page]');
  if (!page) return;
  const input = page.querySelector('[data-tools-search]');
  const form = page.querySelector('[data-tools-search-form]');
  const categoriesList = page.querySelector('[data-categories-list]');
  const grid = page.querySelector('[data-tools-grid]');
  const feedback = page.querySelector('[data-shop-feedback]');
  const count = page.querySelector('[data-result-count]');
  const filters = page.querySelector('[data-active-filters]');
  const sort = page.querySelector('[data-tools-sort]');
  const previous = page.querySelector('[data-page-previous]');
  const next = page.querySelector('[data-page-next]');
  const pagination = page.querySelector('[data-pagination]');
  const retry = page.querySelector('[data-catalog-retry]');
  let state = readCatalogState(location.search), categories = [], categoriesLoaded = false, catalogTotal = 0, request = 0, controller, timer;

  const updateUrl = replace => {
    const query = catalogQuery(state), url = location.pathname + (query ? `?${query}` : '');
    if (url !== location.pathname + location.search) history[replace ? 'replaceState' : 'pushState']({}, '', url);
    document.querySelectorAll('[data-locale-switch]').forEach(link => {
      const target = new URL(link.href); target.search = query; link.href = target.href;
    });
  };
  const addChip = (label, action) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'filter-chip';
    button.textContent = `${label} ×`; button.setAttribute('aria-label', `${t('removeFilter')}: ${label}`); button.addEventListener('click', action); filters.append(button);
  };
  const updateControls = () => {
    if (document.activeElement !== input) input.value = state.search;
    sort.value = state.sort;
    page.querySelector('[data-clear-search]').hidden = !input.value;
    page.querySelector('[data-reset-filter]').disabled = !state.category && !state.search && state.sort === 'name';
    categoriesList.querySelectorAll('[data-category]').forEach(button => {
      const active = button.dataset.category === state.category;
      button.setAttribute('aria-pressed', String(active)); button.closest('li').classList.toggle('active', active);
    });
    filters.replaceChildren();
    if (state.category) addChip(categories.find(category => category.slug === state.category)?.name || state.category, () => commit({...state, category: '', page: 1}));
    if (state.search) addChip(`${t('searchTerm')}: ${state.search}`, () => {input.value = ''; commit({...state, search: '', page: 1}); input.focus();});
    filters.hidden = !filters.children.length;
  };
  const renderCategories = () => {
    const used = categories.filter(category => category.toolCount > 0 || category.slug === state.category);
    const all = {slug: '', name: t('allProducts'), toolCount: catalogTotal};
    categoriesList.replaceChildren(...[all, ...used].map(category => {
      const item = document.createElement('li'), button = document.createElement('button'); button.type = 'button'; button.className = 'category-btn'; button.dataset.category = category.slug;
      const label = document.createElement('span'); label.className = 'category-label'; label.textContent = category.name;
      const meta = document.createElement('span'); meta.className = 'category-meta';
      const quantity = document.createElement('small'); quantity.textContent = categoriesLoaded ? String(category.toolCount) : '–'; quantity.setAttribute('aria-label', `${category.toolCount} ${t('productsLabel')}`);
      const chevron = document.createElement('span'); chevron.textContent = '›'; chevron.setAttribute('aria-hidden', 'true'); meta.append(quantity, chevron); button.append(label, meta); item.append(button); return item;
    }));
    updateControls();
  };
  const load = async () => {
    const id = ++request; controller?.abort(); controller = new AbortController();
    retry.hidden = true; feedback.textContent = t('loadingTools'); grid.setAttribute('aria-busy', 'true');
    updateControls();
    try {
      const result = await RentalApi.getToolPage({...state, limit: 12, signal: controller.signal});
      if (id !== request) return;
      if (!result.tools.length && result.total && state.page > 1) {state.page = Math.ceil(result.total / 12); updateUrl(true); return load();}
      grid.replaceChildren(...result.tools.map(productCard));
      count.textContent = t(result.total === 1 ? 'resultOne' : 'resultMany', result.total);
      feedback.textContent = result.tools.length ? result.searchTruncated ? t('refineSearch') : '' : t('noToolsFilter');
      previous.disabled = state.page <= 1; next.disabled = !result.hasNextPage; pagination.hidden = result.total <= 12;
      page.querySelector('[data-page-label]').textContent = t('pageLabel', state.page, Math.max(1, Math.ceil(result.total / 12)));
    } catch (error) {
      if (id !== request || controller.signal.aborted) return;
      grid.replaceChildren(); count.textContent = ''; feedback.textContent = error.message || t('productsLoadError'); retry.hidden = false; pagination.hidden = true;
    } finally {if (id === request) grid.setAttribute('aria-busy', 'false');}
  };
  const commit = (value, replace = false) => {state = value; updateUrl(replace); updateControls(); void load();};
  categoriesList.addEventListener('click', event => {
    const button = event.target.closest('[data-category]'); if (!button) return;
    clearTimeout(timer); commit(toggleCategory({...state, search: input.value.trim()}, button.dataset.category));
  });
  input.addEventListener('input', () => {
    clearTimeout(timer); page.querySelector('[data-clear-search]').hidden = !input.value;
    timer = setTimeout(() => commit({...state, search: input.value.trim(), page: 1}, true), 200);
  });
  form.addEventListener('submit', event => {event.preventDefault(); clearTimeout(timer); commit({...state, search: input.value.trim(), page: 1});});
  page.querySelector('[data-clear-search]').addEventListener('click', () => {clearTimeout(timer); input.value = ''; commit({...state, search: '', page: 1}); input.focus();});
  page.querySelector('[data-reset-filter]').addEventListener('click', () => {clearTimeout(timer); input.value = ''; commit({category: '', search: '', sort: 'name', page: 1});});
  sort.addEventListener('change', () => commit({...state, sort: sort.value, page: 1}));
  previous.addEventListener('click', () => commit({...state, page: Math.max(1, state.page - 1)}));
  next.addEventListener('click', () => commit({...state, page: state.page + 1}));
  retry.addEventListener('click', () => {void load();});
  window.addEventListener('popstate', () => {clearTimeout(timer); state = readCatalogState(location.search); input.value = state.search; renderCategories(); void load();});
  if (new URLSearchParams(location.search).get('focus') === 'search') {input.focus(); updateUrl(true);}
  updateControls(); void load();
  const results = await Promise.allSettled([RentalApi.getCategorySummary(), RentalApi.getSiteSettings()]);
  if (results[0].status === 'fulfilled') {categories = results[0].value.categories; catalogTotal = results[0].value.total; categoriesLoaded = true;}
  else {
    const categoryFeedback = page.querySelector('[data-category-feedback]');
    categoryFeedback.textContent = t('categoriesUnavailable');
    const retryCategories = document.createElement('button'); retryCategories.className = 'btn-filter'; retryCategories.type = 'button'; retryCategories.textContent = t('retry');
    categoryFeedback.after(retryCategories);
    retryCategories.addEventListener('click',async () => {
      retryCategories.disabled = true;
      try {const summary = await RentalApi.getCategorySummary(); categories = summary.categories; catalogTotal = summary.total; categoriesLoaded = true; categoryFeedback.textContent = ''; retryCategories.remove(); renderCategories();}
      catch {retryCategories.disabled = false;}
    });
  }
  if (results[1].status === 'fulfilled') {
    const settings = results[1].value?.catalog || {};
    const heading = isEnglish ? settings.headlineEn : settings.headlineDe;
    const intro = isEnglish ? settings.introEn : settings.introDe;
    if (heading) page.querySelector('[data-shop-headline]').textContent = heading;
    if (intro && !/^(Alle Inhalte werden aus Payload|All content is loaded from Payload)/i.test(intro)) page.querySelector('[data-shop-intro]').textContent = intro;
  }
  renderCategories();
}
