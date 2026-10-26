const supportedSorts = ['name', 'price-asc', 'price-desc'];
export function readCatalogState(search) {
  const params = new URLSearchParams(search);
  return {
    category: (params.get('category') || '').trim().slice(0, 120),
    search: (params.get('search') || '').trim().slice(0, 120),
    sort: supportedSorts.includes(params.get('sort')) ? params.get('sort') : 'name',
    page: Math.max(1, Math.min(10000, Math.floor(Number(params.get('page')) || 1))),
  };
}
export function catalogQuery(state) {
  const params = new URLSearchParams();
  if (state.category) params.set('category', state.category);
  if (state.search) params.set('search', state.search);
  if (state.sort !== 'name') params.set('sort', state.sort);
  if (state.page > 1) params.set('page', String(state.page));
  return params.toString();
}
export function toggleCategory(state, category) {
  return {...state, category: category === state.category ? '' : category, page: 1};
}
